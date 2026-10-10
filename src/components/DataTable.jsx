import './DataTable.css'

// A table of a dataset: one row per data point, one column per feature, each column marked with its role
// (feature = an input the algorithm uses, target = what is predicted, label = known answer the algorithm
// does NOT see). Summary rows (mean, min, max, standard deviation) sit under the numeric columns.
//   columns: [{ label, unit?, role: 'feature' | 'target' | 'label', format?: (v) => string }]
//   rows:    arrays of values, one per column
const ROLE_TEXT = { feature: 'feature', target: 'target', label: 'label, not used' }

function stats(values) {
  const n = values.length
  const mean = values.reduce((a, v) => a + v, 0) / n
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / n)
  return { mean, min: Math.min(...values), max: Math.max(...values), sd }
}

const fmt = (v) => String(Number(v.toPrecision(3)))

function DataTable({ columns, rows, caption, maxHeight = 320, showIndex = true }) {
  const numericCols = columns.map((c, j) => c.role !== 'label' && rows.every((r) => Number.isFinite(r[j])))
  const summary = columns.map((_, j) => (numericCols[j] && rows.length ? stats(rows.map((r) => r[j])) : null))
  const lines = [
    ['Mean', 'mean'],
    ['Min', 'min'],
    ['Max', 'max'],
    ['Std. dev.', 'sd'],
  ]
  return (
    <div className="dataTableBox">
      {caption && <p className="dataTableCaption">{caption}</p>}
      <div className="dataTableScroll" style={{ maxHeight }}>
        <table className="dataTableX">
          <thead>
            <tr>
              {showIndex && <th className="dtIdx">#</th>}
              {columns.map((c) => (
                <th key={c.label} className={`dtRole-${c.role}`}>
                  <span className="dtName">
                    {c.label}
                    {c.unit ? ` (${c.unit})` : ''}
                  </span>
                  <span className={`dtRoleTag dtRoleTag-${c.role}`}>{ROLE_TEXT[c.role]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {showIndex && <td className="dtIdx">{i + 1}</td>}
                {r.map((v, j) => (
                  <td key={j} className={`dtRole-${columns[j].role}`}>
                    {columns[j].format ? columns[j].format(v) : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {lines.map(([name, key]) => (
              <tr key={key}>
                {showIndex && <th className="dtIdx">{name}</th>}
                {summary.map((s, j) => (
                  <td key={j} className={`dtRole-${columns[j].role}`}>
                    {s ? fmt(s[key]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      <p className="dataTableNote">
        {rows.length} rows × {columns.length} columns. <b>Features</b> are the inputs the algorithm uses
        {columns.some((c) => c.role === 'target') ? '; the target is what it predicts' : ''}
        {columns.some((c) => c.role === 'label') ? '; the label is the known answer, hidden from the algorithm' : ''}.
      </p>
    </div>
  )
}

export default DataTable
