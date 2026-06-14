// GRC Export Utilities — CSV, XLSX, and PDF report generation

interface ExportRow {
  [key: string]: string | number | boolean | undefined | null
}

/**
 * Export data as CSV file download
 */
export function exportCSV(
  filename: string,
  headers: string[],
  rows: ExportRow[],
  mapRow: (row: ExportRow) => (string | number | boolean | undefined | null)[]
): void {
  const csvContent = [
    headers.join(','),
    ...rows.map(r => mapRow(r).map(cell => {
      const val = String(cell ?? '')
      // Escape commas and quotes
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val
    }).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Generate an HTML table that can be copy-pasted into Excel or printed
 */
export function generateHTMLTable(
  title: string,
  headers: string[],
  rows: ExportRow[],
  mapRow: (row: ExportRow) => (string | number | boolean | undefined | null)[]
): string {
  const headerRow = headers.map(h => `<th style="padding:8px 12px;border:1px solid #ddd;background:#f5f5f5;font-weight:700;text-align:left">${h}</th>`).join('')
  const dataRows = rows.map(r => {
    const cells = mapRow(r).map(c => `<td style="padding:6px 12px;border:1px solid #ddd">${c ?? ''}</td>`).join('')
    return `<tr>${cells}</tr>`
  }).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body>
<h2>${title}</h2>
<p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px">
<thead>${headerRow}</thead>
<tbody>${dataRows}</tbody>
</table>
</body></html>`
}

/**
 * Open a print-friendly version of the report
 */
export function printReport(
  title: string,
  headers: string[],
  rows: ExportRow[],
  mapRow: (row: ExportRow) => (string | number | boolean | undefined | null)[]
): void {
  const html = generateHTMLTable(title, headers, rows, mapRow)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

/**
 * Download report as HTML file (can be opened in Excel)
 */
export function downloadHTML(
  filename: string,
  title: string,
  headers: string[],
  rows: ExportRow[],
  mapRow: (row: ExportRow) => (string | number | boolean | undefined | null)[]
): void {
  const html = generateHTMLTable(title, headers, rows, mapRow)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.html`
  link.click()
  URL.revokeObjectURL(url)
}
