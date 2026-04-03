import "dotenv/config"
import { PrismaClient } from "@/lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!.toString() }),
})

async function main() {
  await prisma.locale.createMany({
    data: [
      { id: "en", name: "English" },
      { id: "nl", name: "Nederlands" },
    ],
    skipDuplicates: true,
  })
  console.log("Seeded locales")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })