// Clears a lesson's saved progress and starts it again (the page remounts the lesson).
function RestartLessonButton({ onRestart }) {
  return (
    <button type="button" className="btn btn--ghost ghostBtn" onClick={onRestart}>
      Restart lesson
    </button>
  )
}

export default RestartLessonButton
