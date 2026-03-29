import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Progressions.css'
import { getGuideNotesForChord } from '../utils/guideNotes'

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const MODES = {
  major: {
    label: 'Maior',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ['', 'm', 'm', '', '', 'm', 'dim'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  },
  minor: {
    label: 'Menor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    qualities: ['m', 'dim', '', 'm', 'm', '', ''],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  },
}

const PATTERNS = [
  { id: 'pop', name: 'Pop Clássica', mode: 'major', degrees: [1, 5, 6, 4], suggestedBpm: 92 },
  { id: 'cadencia', name: 'Cadência Perfeita', mode: 'major', degrees: [2, 5, 1], suggestedBpm: 86 },
  { id: 'blues', name: 'Blues Básica', mode: 'major', degrees: [1, 4, 5, 1], suggestedBpm: 104 },
  { id: 'balada', name: 'Balada', mode: 'major', degrees: [1, 6, 4, 5], suggestedBpm: 74 },
  { id: 'minor-pop', name: 'Menor Pop', mode: 'minor', degrees: [1, 6, 3, 7], suggestedBpm: 92 },
  { id: 'minor-cadence', name: 'Menor Funcional', mode: 'minor', degrees: [1, 4, 5, 1], suggestedBpm: 82 },
  { id: 'andaluz', name: 'Cadência Andaluz', mode: 'minor', degrees: [1, 7, 6, 5], suggestedBpm: 96 },
]

function buildScale(tonic, mode) {
  const modeConfig = MODES[mode]
  const tonicIndex = CHROMATIC.indexOf(tonic)

  const seventhQualities = mode === 'major'
    ? ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5']
    : ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7']

  return modeConfig.intervals.map((interval, index) => {
    const note = CHROMATIC[(tonicIndex + interval) % 12]
    const quality = modeConfig.qualities[index]
    const roman = modeConfig.romans[index]
    const chord7 = seventhQualities[index]
    const guideNotes = getGuideNotesForChord(note, chord7, CHROMATIC)

    return {
      degree: index + 1,
      note,
      chord: `${note}${quality}`,
      roman,
      guideNotes: {
        third: guideNotes.third,
        seventh: guideNotes.seventh,
      },
    }
  })
}

function pickRandomPattern(mode) {
  const options = PATTERNS.filter((pattern) => pattern.mode === mode)
  return options[Math.floor(Math.random() * options.length)]
}

function Progressions() {
  const navigate = useNavigate()
  const [tonic, setTonic] = useState('C')
  const [mode, setMode] = useState('major')
  const [selectedPattern, setSelectedPattern] = useState(() => pickRandomPattern('major'))
  const [copyStatus, setCopyStatus] = useState('')
  const [showGuideNotes, setShowGuideNotes] = useState(false)

  const availablePatterns = useMemo(() => {
    return PATTERNS.filter((pattern) => pattern.mode === mode)
  }, [mode])

  const scale = useMemo(() => {
    return buildScale(tonic, mode)
  }, [tonic, mode])

  const progression = useMemo(() => {
    return selectedPattern.degrees.map((degree) => scale[degree - 1])
  }, [selectedPattern, scale])

  const progressionText = progression.map((item) => item.chord).join(' - ')
  const progressionDegrees = progression.map((item) => item.roman).join(' - ')

  const handleModeChange = (event) => {
    const nextMode = event.target.value
    setMode(nextMode)
    setSelectedPattern(pickRandomPattern(nextMode))
  }

  const handlePatternChange = (event) => {
    const pattern = availablePatterns.find((item) => item.id === event.target.value)
    if (pattern) {
      setSelectedPattern(pattern)
    }
  }

  const handleRandom = () => {
    setSelectedPattern(pickRandomPattern(mode))
    setCopyStatus('')
  }

  const handleCopyProgression = async () => {
    const text = `${tonic} ${MODES[mode].label} | ${selectedPattern.name} | Graus: ${progressionDegrees} | Acordes: ${progressionText}`
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Progressão copiada!')
    } catch {
      setCopyStatus('Não foi possível copiar automaticamente.')
    }
  }

  const handleOpenMetronome = () => {
    const params = new URLSearchParams({
      bpm: String(selectedPattern.suggestedBpm),
    })
    navigate(`/metronomo?${params.toString()}`)
  }

  return (
    <div className="prog-page">
      <header className="prog-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Início
        </button>
        <h1>🎼 Progressões Harmônicas</h1>
        <p className="prog-subtitle">Monte e estude sequências de acordes para prática</p>
      </header>

      <section className="prog-controls">
        <label className="prog-control">
          <span>Tonalidade</span>
          <select value={tonic} onChange={(event) => setTonic(event.target.value)}>
            {CHROMATIC.map((note) => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </label>

        <label className="prog-control">
          <span>Modo</span>
          <select value={mode} onChange={handleModeChange}>
            <option value="major">Maior</option>
            <option value="minor">Menor</option>
          </select>
        </label>

        <label className="prog-control">
          <span>Modelo</span>
          <select value={selectedPattern.id} onChange={handlePatternChange}>
            {availablePatterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>{pattern.name}</option>
            ))}
          </select>
        </label>

        <button className="prog-random" onClick={handleRandom}>Gerar aleatória</button>
      </section>

      <section className="prog-extra-options">
        <label className="prog-guide-toggle">
          <input
            type="checkbox"
            checked={showGuideNotes}
            onChange={(event) => setShowGuideNotes(event.target.checked)}
          />
          <span>Mostrar notas guia (3ª e 7ª) de cada acorde</span>
        </label>
      </section>

      <section className="prog-result">
        <div className="prog-box">
          <h2>{selectedPattern.name}</h2>
          <p className="prog-degrees">{progressionDegrees}</p>
          <p className="prog-chords">{progressionText}</p>
          <p className="prog-bpm">BPM sugerido: {selectedPattern.suggestedBpm}</p>

          <div className="prog-actions">
            <button className="prog-action-btn copy" onClick={handleCopyProgression}>
              Copiar progressão
            </button>
            <button className="prog-action-btn met" onClick={handleOpenMetronome}>
              Praticar no metrônomo
            </button>
          </div>

          {copyStatus && <p className="prog-copy-status">{copyStatus}</p>}
        </div>

        <div className="prog-cards">
          {progression.map((item, index) => (
            <article className="prog-card" key={`${item.degree}-${index}`}>
              <span className="prog-card-degree">{item.roman}</span>
              <strong className="prog-card-chord">{item.chord}</strong>
              <small className="prog-card-note">Grau {item.degree}</small>

              {showGuideNotes && (
                <div className="prog-guide-notes">
                  <span className="guide third">3ª: {item.guideNotes.third}</span>
                  <span className="guide seventh">7ª: {item.guideNotes.seventh}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Progressions
