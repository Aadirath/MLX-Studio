import { useRef, useState } from 'react'
import { parseCSVText } from './csvParser.js'
import './TeacherDatasetSelector.css'

function TeacherDatasetSelector({
  samplePresets = [],
  selectedPresetId,
  onSelectPreset,
  isCustomCsv,
  csvData,
  onCsvLoaded,
  onResetToSample,
  col1Label = 'Input (X)',
  col2Label = 'Target (Y)',
  selectedCol1,
  selectedCol2,
  onCol1Change,
  onCol2Change,
}) {
  const fileInputRef = useRef(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMsg('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      const result = parseCSVText(content, file.name)
      if (result.error) {
        setErrorMsg(result.error)
        return
      }
      onCsvLoaded(result)
      setShowPreview(false)
    }
    reader.onerror = () => {
      setErrorMsg('Failed to read the file. Please try again.')
    }
    reader.readAsText(file)
    // reset input so uploading the same file again triggers onChange
    e.target.value = ''
  }

  return (
    <div className="tw-dataset-bar">
      <div className="tw-dataset-row">
        <div className="tw-dataset-left">
          <span className="tw-dataset-label">📊 Dataset:</span>

          {/* Sample Preset Dropdown */}
          <select
            className="tw-select"
            value={isCustomCsv ? '__custom__' : selectedPresetId}
            onChange={(e) => {
              if (e.target.value !== '__custom__') {
                onSelectPreset(e.target.value)
              }
            }}
          >
            {isCustomCsv && <option value="__custom__">Custom CSV ({csvData?.fileName})</option>}
            {samplePresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Upload Button */}
          <button
            type="button"
            className="tw-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload a local CSV file"
          >
            <span>📁</span> Upload CSV
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {/* Reset button when custom CSV is active */}
          {isCustomCsv && (
            <button
              type="button"
              className="tw-reset-dataset-btn"
              onClick={onResetToSample}
              title="Return to default sample dataset"
            >
              ↺ Use Sample Dataset
            </button>
          )}
        </div>

        {/* If custom CSV is active, show file details and preview toggle */}
        {isCustomCsv && csvData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tw-csv-info-pill">
              📄 {csvData.fileName} · {csvData.totalRows} rows · {csvData.numericColumns.length} numeric cols
            </span>
            <button
              type="button"
              className="tw-btn-chip"
              onClick={() => setShowPreview((p) => !p)}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              {showPreview ? 'Hide Preview' : '👁️ Preview'}
            </button>
          </div>
        )}
      </div>

      {errorMsg && <div className="tw-dataset-error">⚠️ {errorMsg}</div>}

      {/* Column Mapping Selector (when custom CSV is loaded) */}
      {isCustomCsv && csvData && csvData.numericColumns.length >= 2 && (
        <div className="tw-col-select-row">
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Map Columns:</span>

          <div className="tw-col-item">
            <label>{col1Label}:</label>
            <select
              className="tw-select"
              value={selectedCol1}
              onChange={(e) => onCol1Change(e.target.value)}
            >
              {csvData.numericColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="tw-col-item">
            <label>{col2Label}:</label>
            <select
              className="tw-select"
              value={selectedCol2}
              onChange={(e) => onCol2Change(e.target.value)}
            >
              {csvData.numericColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* CSV Preview Table Drawer */}
      {isCustomCsv && showPreview && csvData && (
        <div className="tw-preview-table-box">
          <table className="tw-preview-table">
            <thead>
              <tr>
                {csvData.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.rows.slice(0, 5).map((row, rIdx) => (
                <tr key={rIdx}>
                  {csvData.headers.map((h, cIdx) => (
                    <td key={cIdx}>{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: 4 }}>
            Showing first 5 of {csvData.totalRows} rows
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDatasetSelector
