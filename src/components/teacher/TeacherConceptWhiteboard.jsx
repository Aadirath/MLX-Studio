import React, { useState } from 'react'
import { tokenizePythonLine } from './teacherAlgorithmCode'
import './TeacherConceptWhiteboard.css'

export default function TeacherConceptWhiteboard({
  selectedObject = null,
  onClearSelection,
  onQuickInspectPoint,
  onQuickInspectCentroid,
  isPresentationMode = false,
  algorithmType = 'kmeans',
}) {
  const [activeTab, setActiveTab] = useState('math') // 'math' | 'code'

  // Tokenize code snippet if present
  const tokenizedCode = selectedObject?.code?.snippet
    ? selectedObject.code.snippet.split('\n').map((line, idx) => ({
        lineNum: idx + 1,
        tokens: tokenizePythonLine(line),
      }))
    : []

  // If nothing is selected, render a minimal, clean 1-line guidance bar
  if (!selectedObject) {
    return (
      <div className={`tc-idle-bar ${isPresentationMode ? 'presentation' : ''}`}>
        <div className="tc-idle-left">
          <span className="tc-idle-tag">💡 Live Inspector</span>
          <span className="tc-idle-hint">
            Click any {algorithmType === 'kmeans' ? 'point or centroid' : algorithmType === 'linear-regression' ? 'data point or regression line' : 'point on the loss landscape'} to reveal how it was calculated.
          </span>
        </div>
        <div className="tc-idle-actions">
          <button
            type="button"
            className="tc-idle-btn"
            onClick={onQuickInspectPoint}
            title="Inspect a representative data point"
          >
            📍 Sample Point
          </button>
          {algorithmType === 'kmeans' && onQuickInspectCentroid && (
            <button
              type="button"
              className="tc-idle-btn"
              onClick={onQuickInspectCentroid}
              title="Inspect centroid mean calculation"
            >
              ✦ Centroid Mean
            </button>
          )}
          {algorithmType === 'linear-regression' && onQuickInspectCentroid && (
            <button
              type="button"
              className="tc-idle-btn"
              onClick={onQuickInspectCentroid}
              title="Inspect regression line fit and MSE calculation"
            >
              📈 Fit Line
            </button>
          )}
          {algorithmType === 'gradient-descent' && onQuickInspectCentroid && (
            <button
              type="button"
              className="tc-idle-btn"
              onClick={onQuickInspectCentroid}
              title="Inspect current gradient descent step"
            >
              ⚡ Current Step
            </button>
          )}
        </div>
      </div>
    )
  }

  // Active Inspector Card: Clean, readable, focused on answering "Why?"
  return (
    <div className={`tc-inspector-card ${isPresentationMode ? 'presentation' : ''}`}>
      {/* Top Header Row */}
      <div className="tc-card-top">
        <div className="tc-top-left">
          <span className="tc-badge">{selectedObject.badge}</span>
          <h3 className="tc-title">{selectedObject.title}</h3>
        </div>

        <div className="tc-top-right">
          {/* Simple Tab Switcher: Math vs Code */}
          <div className="tc-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'math'}
              className={`tc-tab ${activeTab === 'math' ? 'active' : ''}`}
              onClick={() => setActiveTab('math')}
            >
              📐 Calculation &amp; Formula
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'code'}
              className={`tc-tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              💻 Python Code
            </button>
          </div>

          <button
            type="button"
            className="tc-close-btn"
            onClick={onClearSelection}
            title="Close inspector"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Direct Pedagogical Answer */}
      <div className="tc-direct-answer">
        <span className="tc-answer-q">&ldquo;{selectedObject.question}&rdquo;</span>
        <span className="tc-answer-arrow">➔</span>
        <span className="tc-answer-text">
          {selectedObject.calculation?.conclusion || selectedObject.observation}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="tc-card-body">
        {activeTab === 'math' ? (
          <div className="tc-math-grid">
            {/* Left: Formula & Concept */}
            {selectedObject.formula && (
              <div className="tc-formula-pane">
                <div className="tc-pane-label">{selectedObject.formula.name}</div>
                <div className="tc-formula-box">
                  {selectedObject.formula.html || selectedObject.formula.symbolic}
                </div>
                {selectedObject.formula.note && (
                  <p className="tc-pane-note">{selectedObject.formula.note}</p>
                )}
              </div>
            )}

            {/* Right: Live Substituted Values */}
            {selectedObject.substitution && (
              <div className="tc-subst-pane">
                <div className="tc-pane-label">{selectedObject.substitution.title}</div>
                <div className="tc-subst-list">
                  {selectedObject.substitution.items.map((item, idx) => (
                    <div key={idx} className={`tc-subst-item ${item.isBest ? 'best' : ''}`}>
                      <div className="tc-subst-text">
                        <span className="tc-subst-name">{item.label}</span>
                        <span className="tc-subst-formula" dangerouslySetInnerHTML={{ __html: item.expr }} />
                      </div>
                      <div className="tc-subst-val">
                        <b>{item.result}</b>
                        {item.tag && <span className="tc-tag">{item.tag}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Python Code Tab */
          <div className="tc-code-pane">
            <div className="tc-code-header">
              <span className="tc-code-file">{selectedObject.code?.filename || 'algorithm.py'}</span>
              {selectedObject.code?.explanation && (
                <span className="tc-code-summary">{selectedObject.code.explanation}</span>
              )}
            </div>
            <div className="tc-code-viewer">
              <pre>
                <code>
                  {tokenizedCode.map((line) => (
                    <div key={line.lineNum} className="tc-code-row">
                      <span className="tc-code-num">{line.lineNum}</span>
                      <span className="tc-code-content">
                        {line.tokens.map((tk, tIdx) => (
                          <span key={tIdx} className={`tc-tok-${tk.type}`}>
                            {tk.text}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
