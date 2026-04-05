import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getChordShapes, parseChordInput } from '../utils/chordDictionary'
import GuitarFretboard from '../components/GuitarFretboard'
import './ChordDictionary.css'

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const OPEN_NOTES_LOW_TO_HIGH = ['E', 'A', 'D', 'G', 'B', 'E']
const OPEN_TO_SEMITONE = { E: 4, A: 9, D: 2, G: 7, B: 11 }

function midiToFrequency(midi) {
  return 440 * (2 ** ((midi - 69) / 12))
}

function getShapeStartFret(frets) {
  const pressed = frets.filter((fret) => fret > 0)
  if (pressed.length === 0) return 1
  const min = Math.min(...pressed)
  return min > 3 ? min : 1
}

function shouldPreferFlats(root) {
  return root?.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root)
}

function getNoteName(openNote, fret, preferFlats = false) {
  const openSemitone = OPEN_TO_SEMITONE[openNote]
  const semitone = (openSemitone + fret) % 12
  return preferFlats ? CHROMATIC_FLAT[semitone] : CHROMATIC_SHARP[semitone]
}

function getShapeMarkers(frets, startFret, rootNote) {
  const markers = {}
  const preferFlats = shouldPreferFlats(rootNote)

  frets.forEach((absoluteFret, lowToHighIndex) => {
    if (absoluteFret <= 0) return

    const boardStringIndex = 5 - lowToHighIndex
    const fretOffset = absoluteFret - startFret
    if (fretOffset < 0 || fretOffset > 4) return

    markers[`${boardStringIndex}-${fretOffset}`] = {
      type: 'note',
      value: getNoteName(OPEN_NOTES_LOW_TO_HIGH[lowToHighIndex], absoluteFret, preferFlats),
    }
  })

  return markers
}

function getOpenStrings(frets) {
  const open = new Set()
  frets.forEach((fret, lowToHighIndex) => {
    if (fret === 0) {
      open.add(5 - lowToHighIndex)
    }
  })
  return open
}

function getMutedStringsLabel(frets) {
  const muted = []
  frets.forEach((fret, lowToHighIndex) => {
    if (fret < 0) {
      muted.push(6 - lowToHighIndex)
    }
  })
  if (muted.length === 0) return null
  return muted.map((stringNumber) => `${stringNumber}a`).join(', ')
}
function ChordShapeDiagram({ frets, shapeBarres = [], rootNote }) {
  const startFret = getShapeStartFret(frets)
  const markers = getShapeMarkers(frets, startFret, rootNote)
  const openStrings = getOpenStrings(frets)
  const mutedStringsLabel = getMutedStringsLabel(frets)
  const barres = (shapeBarres || []).filter((barre) => Number.isFinite(barre?.fret) && barre.fret > 0)

  return (
    <div className="chord-diagram-wrap chord-fretboard-wrap">
      <div className="chord-fretboard-frame">
        <GuitarFretboard
          markers={markers}
          activeCell={null}
          startingFret={startFret}
          totalFrets={5}
          onCellClick={() => {}}
          onCellContextMenu={() => {}}
          hideFretNumbers={false}
          colorMode="note"
          openStrings={openStrings}
          onOpenStringToggle={() => {}}
          allowOpenStrings={false}
          instrument="guitar"
          variant="modern"
          barres={barres}
        />
      </div>
      {mutedStringsLabel && <p className="chord-muted-text">Cordas mudas: {mutedStringsLabel}</p>}
    </div>
  )
}

function ChordDictionary() {
  const navigate = useNavigate()
  const audioContextRef = useRef(null)

  const [inputValue, setInputValue] = useState('C')
  const [query, setQuery] = useState('C')
  const [error, setError] = useState('')

  const parsed = useMemo(() => parseChordInput(query), [query])
  const shapes = useMemo(() => {
    if (!parsed || parsed.error) return []
    return getChordShapes(parsed)
  }, [parsed])

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }

  const playShape = (shape, delay = 0) => {
    const ctx = ensureAudioContext()

    let playableString = 0
    shape.frets.forEach((fret, stringIndex) => {
      if (fret < 0) return

      const midi = OPEN_STRING_MIDI[stringIndex] + fret
      const frequency = midiToFrequency(midi)
      const startAt = ctx.currentTime + delay + (playableString * 0.045)
      const stopAt = startAt + 1.2

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(frequency, startAt)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2500, startAt)

      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startAt)
      osc.stop(stopAt)
      playableString += 1
    })
  }

  const playAllShapes = () => {
    shapes.forEach((shape, index) => {
      playShape(shape, index * 1.4)
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsedInput = parseChordInput(inputValue)

    if (parsedInput.error) {
      setError(parsedInput.error)
      return
    }

    setError('')
    setQuery(inputValue.trim())
  }

  return (
    <div className="chord-page">
      <header className="chord-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Inicio
        </button>

        <h1>Dicionario de Acordes</h1>
        <p className="chord-subtitle">Digite uma cifra e veja formas no braco do violao com audio</p>
      </header>

      <section className="chord-search-card">
        <form className="chord-form" onSubmit={handleSubmit}>
          <label htmlFor="chord-input">Cifra</label>
          <div className="chord-form-row">
            <input
              id="chord-input"
              className="chord-input"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ex: C, Am, F#7, Bbmaj7, Dm7"
            />
            <button className="chord-search-btn" type="submit">Buscar</button>
          </div>
        </form>
        {error && <p className="chord-error">{error}</p>}
      </section>

      {parsed?.error ? (
        <section className="chord-empty">
          <p>{parsed.error}</p>
        </section>
      ) : (
        <section className="chord-results">
          <div className="chord-results-head">
            <h2>{parsed.displayName}</h2>
            <span>{parsed.qualityLabel}</span>
            <button type="button" className="chord-play-all-btn" onClick={playAllShapes} disabled={shapes.length === 0}>
              Ouvir todas as formas
            </button>
          </div>

          {shapes.length === 0 ? (
            <div className="chord-empty">
              <p>Nenhuma forma cadastrada para esse acorde.</p>
            </div>
          ) : (
            <div className="chord-shapes-grid">
              {shapes.map((shape) => (
                <article key={shape.id} className="chord-shape-card">
                  <div className="chord-shape-header">
                    <h3>{shape.name}</h3>
                    <button type="button" className="chord-play-btn" onClick={() => playShape(shape)}>
                      Ouvir
                    </button>
                  </div>
                  <ChordShapeDiagram frets={shape.frets} shapeBarres={shape.barres} rootNote={parsed.root} />
                  <p className="chord-frets-text">Casas (6a {'->'} 1a): {shape.frets.map((fret) => (fret < 0 ? 'X' : fret)).join(' - ')}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default ChordDictionary
