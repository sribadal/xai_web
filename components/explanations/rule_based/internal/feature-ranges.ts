export const FEATURE_RANGES: Record<string, [number, number]> = {
  ca199:           [0, 9000],
  bilirubine:      [0, 300],
  albumine:        [20, 55],
  kreatinine:      [40, 300],
  hb:              [3, 12],
  ldh:             [100, 1000],
  crp:             [0, 200],
  cea:             [0, 100],
  leeftcat:        [1, 20],
  cci:             [0, 10],
  perfstat:        [0, 4],
  asa:             [1, 5],
  lengte:          [140, 210],
  diaggewicht:     [30, 150],
  gebrgewicht:     [30, 150],
  klintumafm:      [0, 200],
  patumafm:        [0, 200],
};

export function getRangeForFeature(feature: string): [number, number] | null {
  const key = feature.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [k, range] of Object.entries(FEATURE_RANGES)) {
    if (key.includes(k) || k.includes(key)) return range;
  }
  return null;
}