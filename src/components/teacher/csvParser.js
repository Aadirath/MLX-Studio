/**
 * Robust, lightweight CSV parser for client-side ML playgrounds.
 */

function stripQuotes(str) {
  const s = str.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim()
  }
  return s
}

export function parseCSVText(csvText, fileName = 'dataset.csv') {
  if (!csvText || typeof csvText !== 'string') {
    return { error: 'Please select a valid CSV file.' }
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    return { error: 'The CSV file must contain at least a header row and one row of data.' }
  }

  // Parse header
  const rawHeaders = lines[0].split(',').map((h) => stripQuotes(h))
  const headers = rawHeaders.map((h, i) => h || `Column ${i + 1}`)

  // Parse data rows
  const parsedRows = []
  for (let i = 1; i < lines.length; i++) {
    const rawCells = lines[i].split(',').map((c) => stripQuotes(c))
    if (rawCells.length === 0 || (rawCells.length === 1 && rawCells[0] === '')) continue

    const rowObj = {}
    headers.forEach((h, colIdx) => {
      const valStr = rawCells[colIdx] ?? ''
      const num = Number(valStr)
      rowObj[h] = valStr !== '' && Number.isFinite(num) ? num : valStr
    })
    parsedRows.push(rowObj)
  }

  if (parsedRows.length === 0) {
    return { error: 'No data rows found in the CSV file.' }
  }

  // Detect which columns are numeric (at least 70% of non-empty values are numbers)
  const numericColumns = headers.filter((h) => {
    let numericCount = 0
    let validCount = 0
    for (const row of parsedRows) {
      const val = row[h]
      if (val !== undefined && val !== '') {
        validCount++
        if (typeof val === 'number') numericCount++
      }
    }
    return validCount > 0 && numericCount / validCount >= 0.7
  })

  if (numericColumns.length < 1) {
    return { error: 'No numeric columns found. Please upload a CSV containing numeric data.' }
  }

  return {
    fileName,
    headers,
    numericColumns,
    rows: parsedRows,
    totalRows: parsedRows.length,
  }
}
