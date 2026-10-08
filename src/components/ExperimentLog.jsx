import './ExperimentLog.css'

function ExperimentLog({ topicKey, entries, onClear }) {
  const newestFirst = [...entries].reverse()

  function download() {
    const body = entries.map((e) => `Experiment ${e.n}: ${e.text}`).join('\n') + '\n'
    try {
      const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `mlx-experiments-${topicKey}.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // download blocked: nothing else to do
    }
  }

  return (
    <aside className="logPanel" aria-label="Experiment log">
      <h2 className="logTitle">Your experiments</h2>
      {newestFirst.length === 0 ? (
        <p className="logEmpty">Run the simulation to start your log.</p>
      ) : (
        <ul className="logList">
          {newestFirst.map((e) => (
            <li key={e.n}>
              Experiment {e.n}: {e.text}
            </li>
          ))}
        </ul>
      )}
      <div className="logActions">
        <button className="logBtn" type="button" onClick={onClear} disabled={entries.length === 0}>
          Clear
        </button>
        <button className="logBtn" type="button" onClick={download} disabled={entries.length === 0}>
          Download my notes
        </button>
      </div>
      <p className="logHint">The coach reads this list when you ask it a question.</p>
    </aside>
  )
}

export default ExperimentLog
