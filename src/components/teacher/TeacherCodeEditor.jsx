import { useEffect, useMemo, useRef, useState } from 'react'
import { executeTeacherPythonCode, tokenizePythonLine } from './teacherAlgorithmCode.js'
import './TeacherCodeEditor.css'

function TeacherCodeEditor({
  algorithmType = 'linear-regression',
  filename = 'algorithm.py',
  codeLines = [],
  activeLineRange = [1, 1], // [startLine, endLine] 1-indexed
  stepNumber = 1,
  totalSteps = 1,
  stepLabel = '',
  liveVariables = [],
  visualNotice = '',
  onRunCode,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCodeText, setEditedCodeText] = useState(() => codeLines.join('\n'))
  const [execStatus, setExecStatus] = useState({ type: 'idle', message: '', details: '' })
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const codeContainerRef = useRef(null)
  const activeLineRef = useRef(null)
  const textareaRef = useRef(null)

  const [prevCodeLines, setPrevCodeLines] = useState(codeLines)
  if (prevCodeLines !== codeLines) {
    setPrevCodeLines(codeLines)
    setEditedCodeText(codeLines.join('\n'))
  }

  // Tokenize code lines currently active (either edited or original)
  const currentLinesArray = useMemo(() => {
    return editedCodeText.split('\n')
  }, [editedCodeText])

  const parsedLines = useMemo(() => {
    return currentLinesArray.map((line, idx) => ({
      lineNum: idx + 1,
      tokens: tokenizePythonLine(line),
      raw: line,
    }))
  }, [currentLinesArray])

  // Scroll active line into view smoothly
  useEffect(() => {
    if (!isEditing && activeLineRef.current && codeContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [activeLineRange, isEditing])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(editedCodeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRunTeacherCode = () => {
    const result = executeTeacherPythonCode(algorithmType, editedCodeText)
    if (result.success) {
      setExecStatus({
        type: 'success',
        message: '✓ Code executed! Simulation parameters updated.',
        details: '',
      })
      onRunCode?.(result.extracted, editedCodeText)
      setTimeout(() => {
        setExecStatus((prev) => (prev.type === 'success' ? { type: 'idle', message: '', details: '' } : prev))
      }, 4000)
    } else {
      setExecStatus({
        type: 'error',
        message: 'Code could not be executed: Please check the highlighted section of the algorithm.',
        details: result.error,
      })
    }
  }

  const handleResetToCanonical = () => {
    const canonicalText = codeLines.join('\n')
    setEditedCodeText(canonicalText)
    const result = executeTeacherPythonCode(algorithmType, canonicalText)
    if (result.success) {
      onRunCode?.(result.extracted, canonicalText)
    }
    setExecStatus({ type: 'idle', message: '', details: '' })
  }

  const [startLine, endLine] = activeLineRange || [1, 1]

  return (
    <div className="tw-code-card">
      {/* 1. Header with Mode Toggle & Actions */}
      <div className="tw-code-header">
        <div className="tw-code-file-tab">
          <span className="tw-code-file-icon">🐍</span>
          <span>{filename}</span>
          <span className="tw-code-lang-badge">Python 3</span>
        </div>

        <div className="tw-code-header-actions">
          {/* Mode Switcher: Synced View vs Edit Code */}
          <div className="tw-code-view-toggle">
            <button
              type="button"
              className={`tw-code-mode-tab ${!isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing(false)}
              title="View synchronized execution highlights"
            >
              <span>👁</span> Visual Sync
            </button>
            <button
              type="button"
              className={`tw-code-mode-tab ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing(true)}
              title="Edit Python algorithm parameters and run code"
            >
              <span>✏</span> Edit Code
            </button>
          </div>

          <button
            type="button"
            className="tw-code-action-btn"
            onClick={handleCopyCode}
            title="Copy Python code"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* 2. Step Status Banner (when viewing in sync mode) */}
      {!isEditing && (
        <div className="tw-code-step-banner">
          <div className="tw-code-step-banner-left">
            <span className="tw-code-step-badge">
              Step {stepNumber}/{totalSteps}
            </span>
            <span className="tw-code-step-title">{stepLabel}</span>
          </div>
          <div className="tw-code-step-lines">
            Lines {startLine}–{endLine}
          </div>
        </div>
      )}

      {/* 3. Edit Mode Toolbar (when editing code) */}
      {isEditing && (
        <div className="tw-code-edit-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="tw-code-run-btn"
              onClick={handleRunTeacherCode}
              title="Execute teacher code and update simulation"
            >
              <span>▶</span> Run Code & Apply
            </button>
            <button
              type="button"
              className="tw-code-revert-btn"
              onClick={handleResetToCanonical}
              title="Reset code to original baseline"
            >
              <span>↺</span> Revert Code
            </button>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Modify parameters (e.g. learning_rate, K, slope) and click Run
          </span>
        </div>
      )}

      {/* 4. Error or Success Feedback Banner */}
      {execStatus.type === 'error' && (
        <div className="tw-code-error-banner">
          <div className="tw-code-error-title-row">
            <span>⚠️ <b>{execStatus.message}</b></span>
            <button
              type="button"
              className="tw-code-error-toggle"
              onClick={() => setShowErrorDetails((p) => !p)}
            >
              {showErrorDetails ? 'Hide details ▴' : 'View error details ▾'}
            </button>
          </div>
          {showErrorDetails && (
            <div className="tw-code-error-details">
              <code>{execStatus.details}</code>
            </div>
          )}
        </div>
      )}

      {execStatus.type === 'success' && (
        <div className="tw-code-success-banner">
          <span>{execStatus.message}</span>
        </div>
      )}

      {/* 5. Code Area: Either Synced Highlight View OR Textarea Editor */}
      {isEditing ? (
        <div className="tw-code-editor-wrap">
          <textarea
            ref={textareaRef}
            className="tw-code-textarea"
            value={editedCodeText}
            onChange={(e) => setEditedCodeText(e.target.value)}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            placeholder="# Enter educational Python algorithm code..."
          />
        </div>
      ) : (
        <div className="tw-code-viewport" ref={codeContainerRef}>
          {parsedLines.map(({ lineNum, tokens }) => {
            const isActive = lineNum >= startLine && lineNum <= endLine
            return (
              <div
                key={lineNum}
                ref={isActive && lineNum === startLine ? activeLineRef : null}
                className={`tw-code-line ${isActive ? 'active' : ''}`}
              >
                <div className="tw-code-gutter">{lineNum}</div>
                <div className="tw-code-pointer">{isActive ? '▶' : ''}</div>
                <div className="tw-code-text">
                  {tokens.length === 0 ? (
                    '\u00A0'
                  ) : (
                    tokens.map((tok, i) => (
                      <span key={i} className={`tok-${tok.type}`}>
                        {tok.text}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 6. Diagram Reflection Notice */}
      {!isEditing && visualNotice && (
        <div className="tw-code-notice-box">
          <span className="tw-code-notice-icon">👁</span>
          <span>
            <b>Diagram:</b> {visualNotice}
          </span>
        </div>
      )}

      {/* 7. Live Variables State Inspector */}
      {liveVariables && liveVariables.length > 0 && (
        <div className="tw-code-vars-panel">
          <div className="tw-code-vars-title-row">
            <span>⚡ Live Execution State</span>
            <span style={{ fontSize: '10.5px', color: 'var(--muted)', textTransform: 'none' }}>
              Evaluated on active dataset
            </span>
          </div>
          <div className="tw-code-vars-grid">
            {liveVariables.map((v, i) => (
              <div
                key={i}
                className={`tw-var-chip ${v.highlight ? 'highlight' : ''}`}
                title={v.desc || `${v.name} = ${v.value}`}
              >
                <span className="tw-var-name">{v.name}:</span>
                <span className="tw-var-val">{v.value}</span>
                {v.unit && <span className="tw-var-unit">{v.unit}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherCodeEditor
