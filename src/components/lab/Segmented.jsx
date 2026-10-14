import { useId } from 'react'

// A row of radio buttons drawn as one segmented control. Arrow keys move between options.
function Segmented({ legend, options, value, onChange, small = false }) {
  const name = useId()
  return (
    <fieldset className={`seg${small ? ' seg--small' : ''}`}>
      <legend className="srOnly">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} title={o.title}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={o.value === value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  )
}

export default Segmented
