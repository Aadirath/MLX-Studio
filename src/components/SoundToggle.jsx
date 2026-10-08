import { useId } from 'react'
import './SoundToggle.css'

// Off by default and not remembered: the parent keeps the state in plain useState.
function SoundToggle({ checked, onChange, legend, status = '' }) {
  const id = useId()
  return (
    <div className="soundToggle">
      <label className="soundLabel" htmlFor={id}>
        <input
          id={id}
          className="soundInput"
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="soundTrack" aria-hidden="true">
          <span className="soundThumb" />
        </span>
        <span>Hear the error</span>
      </label>
      <p className="soundLegend">{legend}</p>
      <p className="soundStatus" aria-live="polite">
        {checked ? status : ''}
      </p>
    </div>
  )
}

export default SoundToggle
