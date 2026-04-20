/**
 * Prisma seed script: ingests Python explanation exports into Postgres.
 *
 * Bootstrap (always runs):
 *   - Inserts default locales (en, nl) with skipDuplicates.
 *
 * Reads from $EXPORTS_PATH (default: ../xai_decision_making/exports), looking
 * for `<model_type>/manifest.json` and `<model_type>/patient_*.json` under it.
 * Each model directory found (rsf, condor) is processed independently; missing
 * directories are skipped silently.
 *
 * Behavior:
 *   - Upserts `Patient` rows on (modelType, externalId). Preserves the `notes`
 *     field across re-seeds (only set on initial create).
 *   - Upserts `Explanation` rows on (patientId, modality, method).
 *   - Re-runnable: adding a new method to the Python registry and re-exporting
 *     just that method, then re-seeding, inserts the new rows and refreshes
 *     existing ones. Existing rows for unrelated methods are left alone.
 *
 * Pruning (opt-in via --prune):
 *   - Orphan explanations (in DB, not in current export) are deleted. Always safe.
 *   - Orphan patients are deleted ONLY if no Response rows reference them.
 *     Use --force to also delete patients that have responses (research data loss).
 *
 * Usage:
 *   npm run seed
 *   npm run seed -- --prune
 *   npm run seed -- --prune --force
 *   EXPORTS_PATH=/abs/path/to/exports npm run seed
 */

import "dotenv/config"
import { PrismaClient, Modality } from "@/lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!.toString() }),
})

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_EXPORTS_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "xai_decision_making",
  "exports",
)

const EXPORTS_PATH = process.env.EXPORTS_PATH
  ? path.resolve(process.env.EXPORTS_PATH)
  : DEFAULT_EXPORTS_PATH

const MODEL_TYPES = ["rsf", "condor"] as const
type ModelType = (typeof MODEL_TYPES)[number]

const MODALITY_MAP: Record<string, Modality> = {
  attribution:    Modality.ATTRIBUTION,
  counterfactual: Modality.COUNTERFACTUAL,
  case_based:     Modality.CASE_BASED,
  rule_based:     Modality.RULE_BASED,
}

const DEFAULT_LOCALES = [
  { id: "en", name: "English" },
  { id: "nl", name: "Nederlands" },
]

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)
const PRUNE = argv.includes("--prune")
const FORCE = argv.includes("--force")

if (FORCE && !PRUNE) {
  console.error("--force requires --prune")
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Bootstrap data (always runs, idempotent)
// ---------------------------------------------------------------------------

async function seedBootstrap() {
  console.log("\n[bootstrap] seeding locales...")
  const result = await prisma.locale.createMany({
    data: DEFAULT_LOCALES,
    skipDuplicates: true,
  })
  console.log(`[bootstrap] locales: ${result.count} new (${DEFAULT_LOCALES.length - result.count} already existed)`)
}

// ---------------------------------------------------------------------------
// Types matching the export JSON shape
// ---------------------------------------------------------------------------

interface ManifestEntry {
  patient_id: string
  file: string
  methods: Record<string, Record<string, string>>
}

interface Manifest {
  generated_at: string
  model_type: string
  model_meta: Record<string, unknown>
  n_patients: number
  feature_names: string[]
  modalities: Record<string, string[]>
  patients: ManifestEntry[]
}

interface ExplanationEntry {
  content?: unknown
  metadata?: unknown
  error?: string
  error_type?: string
}

interface PatientFile {
  patient_id: string | number
  model_type: string
  features: Record<string, unknown>
  prediction: unknown
  explanations: Record<string, Record<string, ExplanationEntry>>
}

// ---------------------------------------------------------------------------
// Per-model seed
// ---------------------------------------------------------------------------

interface SeedStats {
  patientsCreated: number
  patientsUpdated: number
  explanationsCreated: number
  explanationsUpdated: number
  explanationsPruned: number
  patientsPruned: number
  patientsRefusedPrune: number
  errors: number
}

async function seedModel(modelType: ModelType): Promise<SeedStats | null> {
  const modelDir = path.join(EXPORTS_PATH, modelType)
  const manifestPath = path.join(modelDir, "manifest.json")

  if (!fs.existsSync(manifestPath)) {
    console.log(`[${modelType}] no manifest at ${manifestPath} — skipping`)
    return null
  }

  console.log(`\n[${modelType}] reading ${manifestPath}`)
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  console.log(`[${modelType}] ${manifest.n_patients} patients in manifest`)

  const stats: SeedStats = {
    patientsCreated: 0,
    patientsUpdated: 0,
    explanationsCreated: 0,
    explanationsUpdated: 0,
    explanationsPruned: 0,
    patientsPruned: 0,
    patientsRefusedPrune: 0,
    errors: 0,
  }

  const seenExternalIds = new Set<string>()

  for (let i = 0; i < manifest.patients.length; i++) {
    const entry = manifest.patients[i]
    const filePath = path.join(modelDir, entry.file)

    if (!fs.existsSync(filePath)) {
      console.log(`  [warn] manifest references missing file: ${entry.file}`)
      stats.errors++
      continue
    }

    let record: PatientFile
    try {
      record = JSON.parse(fs.readFileSync(filePath, "utf8"))
    } catch (err) {
      console.log(`  [error] cannot parse ${entry.file}: ${err}`)
      stats.errors++
      continue
    }

    const externalId = String(record.patient_id)
    seenExternalIds.add(externalId)

    // Upsert Patient — preserve notes by only setting it on create
    let patient
    try {
      const existing = await prisma.patient.findUnique({
        where: { modelType_externalId: { modelType, externalId } },
        select: { id: true },
      })

      patient = await prisma.patient.upsert({
        where: { modelType_externalId: { modelType, externalId } },
        create: {
          externalId,
          modelType,
          features: record.features as object,
          prediction: record.prediction as object,
          notes: null,
        },
        update: {
          features: record.features as object,
          prediction: record.prediction as object,
          // notes deliberately not touched
        },
      })

      if (existing) {
        stats.patientsUpdated++
      } else {
        stats.patientsCreated++
      }
    } catch (err) {
      console.log(`  [error] upsert patient ${externalId}: ${err}`)
      stats.errors++
      continue
    }

    const seenMethods = new Set<string>()
    let perPatientNew = 0
    let perPatientUpdated = 0

    for (const [modalityKey, methods] of Object.entries(record.explanations)) {
      const modality = MODALITY_MAP[modalityKey]
      if (!modality) {
        console.log(`  [warn] unknown modality key '${modalityKey}' for ${externalId}`)
        continue
      }

      for (const [method, expEntry] of Object.entries(methods)) {
        seenMethods.add(`${modality}:${method}`)

        const isError = expEntry && typeof expEntry === "object" && "error" in expEntry
        const errorMessage = isError
          ? `${expEntry.error_type ?? "Error"}: ${expEntry.error ?? "<unknown>"}`
          : null

        try {
          const existingExp = await prisma.explanation.findUnique({
            where: {
              patientId_modality_method: {
                patientId: patient.id,
                modality,
                method,
              },
            },
            select: { id: true },
          })

          await prisma.explanation.upsert({
            where: {
              patientId_modality_method: {
                patientId: patient.id,
                modality,
                method,
              },
            },
            create: {
              patientId: patient.id,
              modality,
              method,
              content: (expEntry?.content ?? null) as object,
              metadata: (expEntry?.metadata ?? {}) as object,
              error: errorMessage,
            },
            update: {
              content: (expEntry?.content ?? null) as object,
              metadata: (expEntry?.metadata ?? {}) as object,
              error: errorMessage,
            },
          })

          if (existingExp) {
            stats.explanationsUpdated++
            perPatientUpdated++
          } else {
            stats.explanationsCreated++
            perPatientNew++
          }
        } catch (err) {
          console.log(
            `  [error] upsert explanation ${externalId}/${modality}/${method}: ${err}`,
          )
          stats.errors++
        }
      }
    }

    // Per-patient prune: remove explanations in DB but not in the current export
    if (PRUNE) {
      const dbExplanations = await prisma.explanation.findMany({
        where: { patientId: patient.id },
        select: { id: true, modality: true, method: true },
      })

      const orphanIds = dbExplanations
        .filter((e) => !seenMethods.has(`${e.modality}:${e.method}`))
        .map((e) => e.id)

      if (orphanIds.length > 0) {
        await prisma.explanation.deleteMany({
          where: { id: { in: orphanIds } },
        })
        stats.explanationsPruned += orphanIds.length
      }
    }

    if ((i + 1) % 10 === 0 || i === manifest.patients.length - 1) {
      console.log(
        `  [${i + 1}/${manifest.patients.length}] ${entry.file}  ` +
          `(+${perPatientNew} ~${perPatientUpdated})`,
      )
    }
  }

  // Patient-level prune
  if (PRUNE) {
    const allModelPatients = await prisma.patient.findMany({
      where: { modelType },
      select: {
        id: true,
        externalId: true,
        _count: { select: { responses: true } },
      },
    })

    const orphans = allModelPatients.filter(
      (p) => !seenExternalIds.has(p.externalId),
    )

    for (const p of orphans) {
      if (p._count.responses > 0 && !FORCE) {
        console.log(
          `  [skip] would prune ${modelType}/${p.externalId} but it has ` +
            `${p._count.responses} responses. Use --force to override.`,
        )
        stats.patientsRefusedPrune++
        continue
      }

      if (p._count.responses > 0 && FORCE) {
        console.log(
          `  [force] pruning ${modelType}/${p.externalId} with ` +
            `${p._count.responses} responses (DATA LOSS)`,
        )
        await prisma.response.updateMany({
          where: { patientId: p.id },
          data: { patientId: null, modality: null },
        })
      }

      await prisma.patient.delete({ where: { id: p.id } })
      stats.patientsPruned++
    }
  }

  return stats
}

function printStats(modelType: ModelType, stats: SeedStats) {
  console.log(`\n[${modelType}] summary:`)
  console.log(`  patients     created=${stats.patientsCreated}  updated=${stats.patientsUpdated}`)
  console.log(`  explanations created=${stats.explanationsCreated}  updated=${stats.explanationsUpdated}`)
  if (PRUNE) {
    console.log(`  pruned       explanations=${stats.explanationsPruned}  patients=${stats.patientsPruned}`)
    if (stats.patientsRefusedPrune > 0) {
      console.log(`  refused      ${stats.patientsRefusedPrune} patients (have responses; use --force)`)
    }
  }
  if (stats.errors > 0) {
    console.log(`  ERRORS:      ${stats.errors}`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Exports path: ${EXPORTS_PATH}`)
  console.log(`Mode: ${PRUNE ? (FORCE ? "prune+force" : "prune") : "additive"}`)

  await seedBootstrap()

  if (!fs.existsSync(EXPORTS_PATH)) {
    console.error(`\nExports directory does not exist: ${EXPORTS_PATH}`)
    console.error("Set EXPORTS_PATH or run the Python exporter first.")
    process.exit(1)
  }

  for (const modelType of MODEL_TYPES) {
    const stats = await seedModel(modelType)
    if (stats) {
      printStats(modelType, stats)
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })