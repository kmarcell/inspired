/**
 * Location Badge Formatting Utility
 * Consistently formats postcode outward codes and neighborhood area names
 * e.g. "📍 W12 (Askew)", "📍 W6 (Hammersmith)", "📍 W4 (Chiswick)", "📍 SW3 (Chelsea)"
 */

export const POSTCODE_AREA_MAP: Record<string, string> = {
  W12: 'Askew',
  W4: 'Chiswick',
  W6: 'Hammersmith',
  SW3: 'Chelsea',
  NW1: 'Camden',
  E2: 'Shoreditch',
  SE1: 'Southwark',
  SW1: 'Westminster',
  N1: 'Islington',
  W1: 'Mayfair',
};

export const formatLocationBadge = (
  locationPrefix?: string | null,
  rawAreaName?: string | null
): string | null => {
  if (!locationPrefix && !rawAreaName) return null;

  const rawPrefix = locationPrefix?.trim();

  // If multi-prefix comma list (e.g. "W4, W12, W5, N1")
  if (rawPrefix && rawPrefix.includes(',')) {
    const prefixes = rawPrefix.split(',').map((s) => s.trim());
    if (prefixes.length > 3) {
      return `📍 ${prefixes.slice(0, 3).join(', ')}...`;
    }
    return `📍 ${prefixes.join(', ')}`;
  }

  const prefix = rawPrefix?.toUpperCase();

  // If prefix is a known postcode outward code
  if (prefix && POSTCODE_AREA_MAP[prefix]) {
    return `📍 ${prefix} (${POSTCODE_AREA_MAP[prefix]})`;
  }

  // If rawAreaName is passed or prefix is an area name (e.g. "Askew"), map it
  if (rawAreaName) {
    const foundEntry = Object.entries(POSTCODE_AREA_MAP).find(
      ([, name]) => name.toLowerCase() === rawAreaName.toLowerCase()
    );
    if (foundEntry) {
      return `📍 ${foundEntry[0]} (${foundEntry[1]})`;
    }
  }

  if (prefix) {
    const foundEntryByPrefix = Object.entries(POSTCODE_AREA_MAP).find(
      ([, name]) => name.toLowerCase() === prefix.toLowerCase()
    );
    if (foundEntryByPrefix) {
      return `📍 ${foundEntryByPrefix[0]} (${foundEntryByPrefix[1]})`;
    }
  }

  // Fallback if custom prefix or area
  if (prefix && rawAreaName && prefix !== rawAreaName.toUpperCase()) {
    return `📍 ${prefix} (${rawAreaName})`;
  }

  return `📍 ${prefix || rawAreaName}`;
};
