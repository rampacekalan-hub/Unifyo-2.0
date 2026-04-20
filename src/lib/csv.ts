// src/lib/csv.ts
// Minimal, dependency-free CSV parser + serializer.
// Handles:
//   - quoted fields containing commas, quotes, or newlines
//   - "" escape sequence inside quoted fields
//   - CRLF and LF line endings
//   - leading BOM (\uFEFF) stripped
//   - empty trailing newline (ignored)

/**
 * Parse a CSV string into an array of rows (each row an array of strings).
 * RFC 4180-ish: tolerant of both LF and CRLF, ignores trailing blank line.
 */
export function parseCsv(text: string): string[][] {
  if (text.length === 0) return [];
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote?
        if (i + 1 < len && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    // Not in quotes
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      // Treat CR or CRLF as one line terminator
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      if (i < len && text[i] === "\n") i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // Flush final field/row (unless file ended exactly on a newline with no trailing data)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop a single trailing empty row (result of trailing newline)
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === "") rows.pop();
  }

  return rows;
}

/** Escape a single cell per RFC 4180: wrap in quotes if it contains ",", '"', or newline. */
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Serialize rows to a CSV string with leading UTF-8 BOM (for Excel SK compatibility).
 * Uses CRLF line endings (Excel-friendly).
 */
export function toCsv(
  rows: (string | number | null | undefined)[][],
): string {
  const lines = rows.map((row) => row.map(escapeCell).join(","));
  return "\uFEFF" + lines.join("\r\n") + (lines.length > 0 ? "\r\n" : "");
}
