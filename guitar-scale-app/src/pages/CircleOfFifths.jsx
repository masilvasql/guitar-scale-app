import { useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import './CircleOfFifths.css'

// ─── Circle of Fifths data ────────────────────────────────────────────────────
// Order around the circle (clockwise from top = C)
const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm']

// Accidentals for each position (pretty unicode labels)
const ACC_LABELS = ['0', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯/6♭', '6♭', '5♭', '4♭', '3♭', '2♭', '1♭']

// Harmonic field degrees for major scale (Nashville numbering)
const MAJOR_DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII°']
// Steps from tonic in circle positions (clockwise)
const MAJOR_FIELD_OFFSETS = [0, 2, 4, -1, 1, 3, 5] // IV is one step CCW (-1)

// Colors per degree
const DEGREE_COLORS = [
  '#4FC3F7', // I  - light blue
  '#FFB74D', // II - orange
  '#81C784', // III- green
  '#F06292', // IV - pink
  '#FFD54F', // V  - yellow
  '#BA68C8', // VI - purple
  '#FF8A65', // VII- coral
]

const INNER_MINOR_COLORS = '#a78bfa'
const OUTER_MAJOR_COLORS = '#38bdf8'

// ─── SVG Circle component ─────────────────────────────────────────────────────
const SIZE = 420
const CX = SIZE / 2
const CY = SIZE / 2
const R_OUTER = 180
const R_MID   = 140
const R_INNER  = 100
const R_ACC    = 60

function polarToXY(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function describeArc(startAngle, endAngle, r) {
  const s = polarToXY(startAngle, r)
  const e = polarToXY(endAngle, r)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`
}

function CircleOfFifthsSVG({ rotation, onRotate, selectedIndex, onSelect, harmonicSet }) {
  const sliceAngle = 360 / 12

  const isDragging = useRef(false)
  const lastAngle = useRef(null)
  const svgRef = useRef(null)

  function getSVGAngle(e) {
    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI)
  }

  function onMouseDown(e) {
    isDragging.current = true
    lastAngle.current = getSVGAngle(e)
    e.preventDefault()
  }

  function onMouseMove(e) {
    if (!isDragging.current) return
    const angle = getSVGAngle(e)
    const delta = angle - lastAngle.current
    lastAngle.current = angle
    onRotate(prev => prev + delta)
  }

  function onMouseUp() {
    isDragging.current = false
  }

  // Snap rotation to nearest slice on release (optional smooth snapping)
  function onMouseUpSnap() {
    isDragging.current = false
    onRotate(prev => {
      const snapped = Math.round(prev / sliceAngle) * sliceAngle
      return snapped
    })
  }

  return (
    <svg
      ref={svgRef}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="cof-svg"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUpSnap}
      onMouseLeave={onMouseUpSnap}
      onTouchStart={onMouseDown}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUpSnap}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx={CX} cy={CY} r={R_OUTER + 8} fill="#0f1729" stroke="#1e3a5f" strokeWidth="2"/>

      {/* Rotating group */}
      <g transform={`rotate(${rotation}, ${CX}, ${CY})`}>
        {MAJOR_KEYS.map((key, i) => {
          const startAngle = i * sliceAngle
          const endAngle = startAngle + sliceAngle
          const midAngle = startAngle + sliceAngle / 2
          const textPos = polarToXY(midAngle, (R_OUTER + R_MID) / 2)
          const isSelected = selectedIndex === i
          const isInHarmonic = harmonicSet.majorIndices.includes(i)
          const degIdx = harmonicSet.majorIndices.indexOf(i)

          let fill = '#132040'
          if (isSelected) fill = '#1d4ed8'
          else if (isInHarmonic && degIdx >= 0) fill = DEGREE_COLORS[degIdx] + '33'

          return (
            <g key={`major-${i}`} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
              <path
                d={describeArc(startAngle, endAngle, R_OUTER)}
                fill={fill}
                stroke={isSelected ? '#60a5fa' : isInHarmonic ? DEGREE_COLORS[degIdx] : '#1e3a5f'}
                strokeWidth={isSelected ? 2.5 : isInHarmonic ? 1.5 : 0.8}
                filter={isSelected ? 'url(#glow)' : undefined}
              />
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isSelected ? 17 : 15}
                fontWeight="bold"
                fill={isSelected ? '#fff' : isInHarmonic && degIdx >= 0 ? DEGREE_COLORS[degIdx] : OUTER_MAJOR_COLORS}
              >
                {key}
              </text>
              {isInHarmonic && degIdx >= 0 && (
                <text
                  x={polarToXY(midAngle, R_OUTER - 12).x}
                  y={polarToXY(midAngle, R_OUTER - 12).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fill={DEGREE_COLORS[degIdx]}
                  fontWeight="bold"
                >
                  {MAJOR_DEGREES[degIdx]}
                </text>
              )}
            </g>
          )
        })}

        {/* Inner minor ring */}
        {MINOR_KEYS.map((key, i) => {
          const startAngle = i * sliceAngle
          const endAngle = startAngle + sliceAngle
          const midAngle = startAngle + sliceAngle / 2
          const textPos = polarToXY(midAngle, (R_MID + R_INNER) / 2)
          const isRelative = selectedIndex !== null && i === selectedIndex

          return (
            <g key={`minor-${i}`}>
              <path
                d={describeArc(startAngle, endAngle, R_MID)}
                fill={isRelative ? '#312e81' : '#0c1829'}
                stroke={isRelative ? '#818cf8' : '#1e3a5f'}
                strokeWidth={isRelative ? 2 : 0.8}
              />
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={isRelative ? 'bold' : 'normal'}
                fill={isRelative ? '#c4b5fd' : INNER_MINOR_COLORS}
              >
                {key}
              </text>
            </g>
          )
        })}

        {/* Accidentals innermost ring */}
        {ACC_LABELS.slice(0, 12).map((acc, i) => {
          const startAngle = i * sliceAngle
          const endAngle = startAngle + sliceAngle
          const midAngle = startAngle + sliceAngle / 2
          const textPos = polarToXY(midAngle, (R_INNER + R_ACC) / 2)
          return (
            <g key={`acc-${i}`}>
              <path
                d={describeArc(startAngle, endAngle, R_INNER)}
                fill="#09111e"
                stroke="#1e3a5f"
                strokeWidth="0.6"
              />
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="#475569"
              >
                {acc}
              </text>
            </g>
          )
        })}

        {/* Center circle (decorative) */}
        <circle cx={CX} cy={CY} r={R_ACC} fill="#070d18" stroke="#1e3a5f" strokeWidth="1"/>
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize={11} fill="#334155">Ciclo</text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize={11} fill="#334155">das Quintas</text>
      </g>

      {/* Fixed pointer at top */}
      <polygon
        points={`${CX},${CY - R_OUTER - 4} ${CX - 7},${CY - R_OUTER - 18} ${CX + 7},${CY - R_OUTER - 18}`}
        fill="#ef4444"
        stroke="#fca5a5"
        strokeWidth="1"
      />
    </svg>
  )
}

// ─── Harmonic field computation ───────────────────────────────────────────────
function computeHarmonicSet(selectedIndex) {
  if (selectedIndex === null) return { majorIndices: [], minorIndex: null }
  const majorIndices = MAJOR_FIELD_OFFSETS.map(offset =>
    ((selectedIndex + offset) % 12 + 12) % 12
  )
  return { majorIndices }
}

// ─── Harmonic field table ─────────────────────────────────────────────────────
function HarmonicFieldTable({ selectedIndex }) {
  if (selectedIndex === null) return (
    <p className="cof-hint">Clique em uma nota no círculo para ver o campo harmônico</p>
  )

  const { majorIndices } = computeHarmonicSet(selectedIndex)
  const rootKey = MAJOR_KEYS[selectedIndex]

  const chordQualities = ['', 'm', 'm', '', '', 'm', '°']

  return (
    <div className="cof-harmonic-table-wrapper">
      <h3 className="cof-harmonic-title">
        Campo Harmônico de <span style={{ color: '#60a5fa' }}>{rootKey} Maior</span>
      </h3>
      <div className="cof-harmonic-chords">
        {majorIndices.map((idx, degreeIdx) => (
          <div
            key={degreeIdx}
            className="cof-chord-card"
            style={{ borderColor: DEGREE_COLORS[degreeIdx] + '88', background: DEGREE_COLORS[degreeIdx] + '15' }}
          >
            <span className="cof-chord-degree" style={{ color: DEGREE_COLORS[degreeIdx] }}>
              {MAJOR_DEGREES[degreeIdx]}
            </span>
            <span className="cof-chord-name">
              {MAJOR_KEYS[idx]}{chordQualities[degreeIdx]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Rotation controls ────────────────────────────────────────────────────────
function RotationControls({ onStep }) {
  return (
    <div className="cof-rotation-controls">
      <button className="cof-rotate-btn" onClick={() => onStep(-1)} title="Girar sentido anti-horário">
        ↺ CCW
      </button>
      <span className="cof-rotate-hint">arraste o círculo para girar</span>
      <button className="cof-rotate-btn" onClick={() => onStep(1)} title="Girar sentido horário">
        CW ↻
      </button>
    </div>
  )
}

// ─── Table (existing feature) ─────────────────────────────────────────────────
const COLUMNS = [
  'Bemóis / Sustenidos',
  'Tom Maior',
  'Tom Menor',
  'Acorde Diminuto',
]

const ROWS_COUNT = 12

function createEmptyTable() {
  return Array.from({ length: ROWS_COUNT }, () =>
    Array.from({ length: COLUMNS.length }, () => '')
  )
}

function CircleOfFifths() {
  const navigate = useNavigate()
  const [tableData, setTableData] = useState(createEmptyTable)
  const [tableName, setTableName] = useState('')
  const [rotation, setRotation] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const captureRef = useRef(null)

  const sliceAngle = 360 / 12

  // Which circle index is at the top pointer?
  const pointerIndex = useMemo(() => {
    const normalized = ((-rotation % 360) + 360) % 360
    return Math.round(normalized / sliceAngle) % 12
  }, [rotation, sliceAngle])

  const harmonicSet = useMemo(() => computeHarmonicSet(selectedIndex), [selectedIndex])

  const handleSelect = useCallback((i) => {
    setSelectedIndex(prev => prev === i ? null : i)
  }, [])

  const handleStep = useCallback((dir) => {
    setRotation(prev => prev + dir * sliceAngle)
  }, [sliceAngle])

  const handleCellChange = useCallback((rowIndex, colIndex, value) => {
    setTableData(prev => {
      const next = prev.map(row => [...row])
      next[rowIndex][colIndex] = value
      return next
    })
  }, [])

  const handleClearTable = useCallback(() => {
    setTableData(createEmptyTable())
    setTableName('')
  }, [])

  const handleDownload = useCallback(async () => {
    if (!captureRef.current) return
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#121212',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      const fileName = tableName.trim()
        ? `${tableName.trim().replace(/[^a-zA-Z0-9#\s-]/g, '_')}.png`
        : 'ciclo-das-quintas.png'
      link.download = fileName
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
    }
  }, [tableName])

  const hasData = tableData.some(row => row.some(cell => cell.trim() !== ''))

  return (
    <div className="cof-page">
      <header className="cof-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar
        </button>
        <h1>🎵 Ciclo das Quintas</h1>
        <p className="cof-subtitle">Visualize e explore o ciclo das quintas de forma interativa</p>
      </header>

      {/* ── Interactive Circle Section ── */}
      <section className="cof-circle-section">
        <CircleOfFifthsSVG
          rotation={rotation}
          onRotate={setRotation}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          harmonicSet={harmonicSet}
        />
        <RotationControls onStep={handleStep} />
        <HarmonicFieldTable selectedIndex={selectedIndex} />
      </section>

      {/* ── Table Section ── */}
      <section className="cof-table-section">
        <h2 className="cof-section-title">📋 Tabela de Referência</h2>

        <div className="cof-controls">
          <button
            className="cof-btn cof-btn-clear"
            onClick={handleClearTable}
            disabled={!hasData && !tableName.trim()}
          >
            🗑️ Limpar
          </button>
          <button
            className="cof-btn cof-btn-download"
            onClick={handleDownload}
            disabled={!hasData}
          >
            📥 Download da Tabela
          </button>
        </div>

        <div className="cof-name-container">
          <input
            type="text"
            className="cof-name-input"
            placeholder="Digite um título para a tabela... Ex: Ciclo das Quintas - Maior"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
          />
        </div>

        <div ref={captureRef} className="cof-capture-area">
          {tableName.trim() && (
            <div className="cof-table-title">
              <h2>{tableName}</h2>
            </div>
          )}

          <div className="cof-table-wrapper">
            <table className="cof-table">
              <thead>
                <tr>
                  <th className="cof-row-number">#</th>
                  {COLUMNS.map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="cof-row-number">{rowIndex + 1}</td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="cof-cell">
                        <input
                          type="text"
                          className="cof-cell-input"
                          value={cell}
                          onChange={(e) =>
                            handleCellChange(rowIndex, colIndex, e.target.value)
                          }
                          placeholder="—"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="cof-footer">
        <span>Powered by <strong>Marcelo Abrão da Silva</strong></span>
        <a href="https://github.com/masilvasql" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          github.com/masilvasql
        </a>
      </footer>
    </div>
  )
}

export default CircleOfFifths
