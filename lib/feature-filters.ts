const CAT_DUMMY_PATTERN = /^cat_\d+$/;

const FEATURE_TOKEN_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function isInternalFeatureKey(key: string): boolean {
  return CAT_DUMMY_PATTERN.test(key);
}

function extractFeatureToken(condition: string): string | undefined {
  const tokens = condition.split(/\s+/);
  return tokens.find(
    (t) => FEATURE_TOKEN_PATTERN.test(t) && !/^[A-Z]+$/.test(t),
  );
}

export function filterInternalFeatures<V>(
  obj: Record<string, V> | null | undefined,
): Record<string, V> {
  if (!obj) return {};
  const out: Record<string, V> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!isInternalFeatureKey(k)) out[k] = v;
  }
  return out;
}

export function filterInternalEntries<V>(
  entries: Array<[string, V]>,
): Array<[string, V]> {
  return entries.filter(([k]) => !isInternalFeatureKey(k));
}

export function filterInternalLimeKeys<V>(
  obj: Record<string, V> | null | undefined,
): Record<string, V> {
  if (!obj) return {};
  const out: Record<string, V> = {};
  for (const [conditionKey, v] of Object.entries(obj)) {
    const featureToken = extractFeatureToken(conditionKey);
    if (featureToken && isInternalFeatureKey(featureToken)) continue;
    out[conditionKey] = v;
  }
  return out;
}

export function filterInternalConditions(
  conditions: string[] | null | undefined,
): string[] {
  if (!conditions) return [];
  return conditions.filter((cond) => {
    const featureToken = extractFeatureToken(cond);
    return !(featureToken && isInternalFeatureKey(featureToken));
  });
}

export function filterInternalFiringRules<R extends { rule: string }>(
  rules: R[] | null | undefined,
): R[] {
  if (!rules) return [];
  return rules.filter((r) => {
    const clauses = r.rule.split(/\s+and\s+/i);
    return clauses.every((clause) => {
      const featureToken = extractFeatureToken(clause);
      return !(featureToken && isInternalFeatureKey(featureToken));
    });
  });
}

export function filterInternalCaseRecord<V>(
  record: Record<string, V> | null | undefined,
): Record<string, V> {
  if (!record) return {};
  const out: Record<string, V> = {};
  for (const [k, v] of Object.entries(record)) {
    if (!isInternalFeatureKey(k)) out[k] = v;
  }
  return out;
}