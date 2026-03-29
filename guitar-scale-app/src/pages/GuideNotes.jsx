import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GuideNotes.css'
import { getGuideNotesForChord } from '../utils/guideNotes'

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const DEGREE_HEADERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

const MODES = {
  major: {
    label: 'Maior',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    seventhChords: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  },
  minor: {
    label: 'Menor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    seventhChords: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  },
}

const PATTERNS = [
  { id: 'ii-v-i', name: 'ii - V - I', mode: 'major', degrees: [2, 5, 1] },
  { id: 'i-vi-ii-v', name: 'I - vi - ii - V', mode: 'major', degrees: [1, 6, 2, 5] },
  { id: 'i-v-vi-iv', name: 'I - V - vi - IV', mode: 'major', degrees: [1, 5, 6, 4] },
  { id: 'i-vii-vi-v', name: 'i - VII - VI - V', mode: 'minor', degrees: [1, 7, 6, 5] },
  { id: 'i-iv-v', name: 'i - iv - v', mode: 'minor', degrees: [1, 4, 5] },
]

function buildScale(tonic, mode) {
  const modeData = MODES[mode]
  const tonicIndex = CHROMATIC.indexOf(tonic)

  return modeData.intervals.map((interval, index) => {
    const root = CHROMATIC[(tonicIndex + interval) % 12]
    const chordType = modeData.seventhChords[index]
    const guideNotes = getGuideNotesForChord(root, chordType, CHROMATIC)

    return {
      degree: index + 1,
      roman: modeData.romans[index],
      root,
      chord: `${root}${chordType}`,
      third: guideNotes.third,
      seventh: guideNotes.seventh,
    }
  })
}

function pickInitialPattern(mode) {
  return PATTERNS.find((pattern) => pattern.mode === mode) || PATTERNS[0]
}

function GuideNotes() {
  const navigate = useNavigate()
  const [tonic, setTonic] = useState('C')
  const [mode, setMode] = useState('major')
  const [patternId, setPatternId] = useState(() => pickInitialPattern('major').id)
  const [showGuideNotesInProgression, setShowGuideNotesInProgression] = useState(true)

  const modePatterns = useMemo(() => {
    return PATTERNS.filter((pattern) => pattern.mode === mode)
  }, [mode])

  const selectedPattern = useMemo(() => {
    return modePatterns.find((pattern) => pattern.id === patternId) || modePatterns[0]
  }, [modePatterns, patternId])

  const scale = useMemo(() => {
    return buildScale(tonic, mode)
  }, [tonic, mode])

  const guideNotes = useMemo(() => {
    return selectedPattern.degrees.map((degree) => scale[degree - 1])
  }, [selectedPattern, scale])

  const majorFieldTable = useMemo(() => {
    return CHROMATIC.map((key) => ({
      key,
      degrees: buildScale(key, 'major'),
    }))
  }, [])

  const minorFieldTable = useMemo(() => {
    return CHROMATIC.map((key) => ({
      key,
      degrees: buildScale(key, 'minor'),
    }))
  }, [])

  const handleModeChange = (event) => {
    const nextMode = event.target.value
    setMode(nextMode)
    setPatternId(pickInitialPattern(nextMode).id)
  }

  return (
    <div className="gn-page">
      <header className="gn-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Início
        </button>
        <h1>🎵 Notas Guia</h1>
        <p className="gn-subtitle">Estude 3ª e 7ª dos acordes em uma progressão</p>
      </header>

      <section className="gn-controls">
        <label className="gn-control">
          <span>Tonalidade</span>
          <select value={tonic} onChange={(event) => setTonic(event.target.value)}>
            {CHROMATIC.map((note) => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </label>

        <label className="gn-control">
          <span>Modo</span>
          <select value={mode} onChange={handleModeChange}>
            <option value="major">Maior</option>
            <option value="minor">Menor</option>
          </select>
        </label>

        <label className="gn-control">
          <span>Progressão</span>
          <select value={selectedPattern.id} onChange={(event) => setPatternId(event.target.value)}>
            {modePatterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>{pattern.name}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="gn-extra-options">
        <label className="gn-guide-toggle">
          <input
            type="checkbox"
            checked={showGuideNotesInProgression}
            onChange={(event) => setShowGuideNotesInProgression(event.target.checked)}
          />
          <span>Mostrar notas guia em cada acorde da progressão</span>
        </label>
      </section>

      <section className="gn-grid">
        {guideNotes.map((item, index) => (
          <article className="gn-card" key={`${item.chord}-${index}`}>
            <p className="gn-degree">{item.roman}</p>
            <h2 className="gn-chord">{item.chord}</h2>
            {showGuideNotesInProgression && (
              <div className="gn-notes">
                <div className="gn-note-box third">
                  <span className="label">3ª</span>
                  <strong>{item.third}</strong>
                </div>
                <div className="gn-note-box seventh">
                  <span className="label">7ª</span>
                  <strong>{item.seventh}</strong>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="gn-tip">
        <p>
          Dica: conecte a 3ª ou 7ª de um acorde para a nota guia mais próxima do acorde seguinte.
        </p>
      </section>

      <section className="gn-reference">
        <h2>📚 Tabela Completa de Notas Guia (C até B)</h2>
        <p>
          Cada célula mostra 3ª/7ª do acorde correspondente ao grau daquele campo harmônico.
        </p>

        <div className="gn-table-block">
          <h3>Campo Maior</h3>
          <div className="gn-table-wrap">
            <table className="gn-table">
              <thead>
                <tr>
                  <th>Tonalidade</th>
                  {DEGREE_HEADERS.map((header) => (
                    <th key={`major-${header}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {majorFieldTable.map((row) => (
                  <tr key={`major-row-${row.key}`}>
                    <td className="key-cell">{row.key}</td>
                    {row.degrees.map((degree) => (
                      <td key={`major-${row.key}-${degree.degree}`}>
                        <span className="cell-main">{degree.third}/{degree.seventh}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="gn-table-block">
          <h3>Campo Menor</h3>
          <div className="gn-table-wrap">
            <table className="gn-table">
              <thead>
                <tr>
                  <th>Tonalidade</th>
                  {DEGREE_HEADERS.map((header) => (
                    <th key={`minor-${header}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {minorFieldTable.map((row) => (
                  <tr key={`minor-row-${row.key}`}>
                    <td className="key-cell">{row.key}m</td>
                    {row.degrees.map((degree) => (
                      <td key={`minor-${row.key}-${degree.degree}`}>
                        <span className="cell-main">{degree.third}/{degree.seventh}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

export default GuideNotes
