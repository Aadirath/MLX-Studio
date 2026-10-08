// Clears a lesson's saved progress and starts it again (the page remounts the lesson).
function RestartLessonButton({ onRestart }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 0 8px' }}>
      <button type="button" className="ghostBtn" onClick={onRestart}>
        Restart lesson
      </button>
    </div>
  )
}

export default RestartLessonButton
