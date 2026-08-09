/**
 * Utility functions for parsing and exporting CSV files in Shree Krishna Hospital
 */

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCSV(csvText: string): ParsedCSV {
  // Normalize line endings
  const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines: string[] = [];
  
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if (char === '\n' && !insideQuotes) {
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuote && line[i + 1] === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuote = !inQuote;
        }
      } else if ((char === ',' || char === '\t') && !inQuote) {
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field.trim());
    return fields.map(f => f.replace(/^"(.*)"$/, '$1')); // strip surrounding quotes
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function downloadSampleCSV(filename: string, headers: string[], sampleRows: string[][]) {
  const content = [
    headers.map(h => `"${h}"`).join(','),
    ...sampleRows.map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
