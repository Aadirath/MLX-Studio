import './ModeCompare.css'

// One short table that answers "how is student mode different from teacher mode?".
// Shown on the teacher passcode screen, the teacher dashboard and the About page.
const ROWS = [
  ['Who it is for', 'A learner working alone or in a pair', 'An instructor teaching a room'],
  ['Who drives', 'The learner, guided stage by stage', 'The instructor, with play, step and speed controls'],
  ['Flow', 'Aim, theory, pretest, procedure, simulation, posttest', 'One workspace per algorithm, ready to project'],
  ['Data', 'Preset datasets and your own CSV', 'Preset datasets and an uploaded CSV'],
  ['Help', 'An AI coach that asks you to predict first, in English, Hindi or Marathi', 'An explanation panel and a concept whiteboard for the class'],
  ['Code', 'Not shown', 'Python in step with the picture, editable parameters, and a runnable version you can break on purpose'],
  ['Progress', 'Pretest and posttest scores, experiment log, session summary', 'Class insights from anonymous logs: sessions, score gain, most-missed ideas'],
  ['Access', 'Open to everyone', 'Class passcode'],
]

function ModeCompare({ compact = false }) {
  return (
    <div className={`modeCompare${compact ? ' modeCompare--compact' : ''}`}>
      <table>
        <caption className="sr-only">Student mode compared with teacher mode</caption>
        <thead>
          <tr>
            <th scope="col"> </th>
            <th scope="col">Student mode</th>
            <th scope="col">Teacher mode</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([what, student, teacher]) => (
            <tr key={what}>
              <th scope="row">{what}</th>
              <td>{student}</td>
              <td>{teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ModeCompare
