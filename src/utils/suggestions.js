export function collectSuggestions(rows, keys = []) {
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(keys) || keys.length === 0) {
    return [];
  }

  const bucket = [];

  for (const row of rows) {
    for (const key of keys) {
      const raw = typeof key === "function" ? key(row) : row?.[key];
      if (Array.isArray(raw)) {
        for (const item of raw) {
          const normalized = normalizeSuggestion(item);
          if (normalized) {
            bucket.push(normalized);
          }
        }
      } else {
        const normalized = normalizeSuggestion(raw);
        if (normalized) {
          bucket.push(normalized);
        }
      }
    }
  }

  return Array.from(new Set(bucket)).slice(0, 300);
}

function normalizeSuggestion(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value).trim();
  return str.length > 0 ? str : "";
}
