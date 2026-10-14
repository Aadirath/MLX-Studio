// The readouts above a simulation: a few labelled numbers and a status chip.
// The chip always carries words, so colour is never the only signal.
function StatusStrip({ metrics, chip }) {
  return (
    <div className="status" role="group" aria-label="Run status">
      {metrics.map((m) => (
        <div className="metric" key={m.label}>
          <span className="m-label">{m.label}</span>
          <span className="m-val">{m.value}</span>
        </div>
      ))}
      <div className="chip" data-state={chip.state}>
        <span className="dot" aria-hidden="true" />
        <span>{chip.text}</span>
      </div>
    </div>
  )
}

export default StatusStrip
