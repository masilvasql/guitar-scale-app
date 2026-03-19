import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import GuitarFretboard from '../components/GuitarFretboard'
import Controls from '../components/Controls'
import './Scales.css'

const VALID_NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const NOTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
export const MAX_FRET = 24
export const MIN_SCALE_SPAN_FRETS = 12
export const FORMAT_SPAN_FRETS = 4
export const CAGED_FORMAT_SPAN_FRETS = 5
export const INSTRUMENT_OPEN_NOTES = {
  guitar: ['E', 'B', 'G', 'D', 'A', 'E'],
  bass: ['G', 'D', 'A', 'E'],
}
export const NOTE_TO_SEMITONE = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}
export const SEMITONE_TO_NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const AUTO_SCALE_NOTE_COLOR = '#607d8b'
export const AUTO_SCALE_TONIC_COLOR = '#ffca28'
const ROOT_OPTIONS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const SCALE_PATTERNS = [
  { id: 'major', name: 'Maior', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'naturalMinor', name: 'Menor Natural', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonicMinor', name: 'Menor Harmônica', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodicMinor', name: 'Menor Melódica', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'majorPentatonic', name: 'Pentatônica Maior', intervals: [0, 2, 4, 7, 9] },
  { id: 'minorPentatonic', name: 'Pentatônica Menor', intervals: [0, 3, 5, 7, 10] },
]
const KNOWN_SCALES = ROOT_OPTIONS.flatMap(root =>
  SCALE_PATTERNS.map(pattern => ({
    key: `${root}-${pattern.id}`,
    label: `${root} ${pattern.name}`,
    root,
    pattern,
  }))
)

function normalizeScaleLabel(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getKnownScaleByLabel(input) {
  const normalizedInput = normalizeScaleLabel(input)
  return KNOWN_SCALES.find(scale => normalizeScaleLabel(scale.label) === normalizedInput) || null
}

export function getScaleSemitones(scale) {
  const rootSemitone = NOTE_TO_SEMITONE[scale.root]
  if (rootSemitone === undefined) return new Set()

  return new Set(
    scale.pattern.intervals.map(interval => (rootSemitone + interval) % 12)
  )
}

export function scaleHasOpenString(scale, instrumentName) {
  const openNotes = INSTRUMENT_OPEN_NOTES[instrumentName] || INSTRUMENT_OPEN_NOTES.guitar
  const scaleSemitones = getScaleSemitones(scale)

  return openNotes.some(note => {
    const noteSemitone = NOTE_TO_SEMITONE[note]
    return noteSemitone !== undefined && scaleSemitones.has(noteSemitone)
  })
}

export function getOpenStringIndexesForScale(scale, instrumentName, startFret = 1) {
  const openNotes = INSTRUMENT_OPEN_NOTES[instrumentName] || INSTRUMENT_OPEN_NOTES.guitar
  const scaleSemitones = getScaleSemitones(scale)
  const firstFormatLastFret = Math.min(MAX_FRET, startFret + FORMAT_SPAN_FRETS - 1)

  return new Set(
    openNotes
      .map((note, index) => {
        const noteSemitone = NOTE_TO_SEMITONE[note]
        if (noteSemitone === undefined || !scaleSemitones.has(noteSemitone)) {
          return null
        }

        const lowerStringNote = openNotes[index + 1]
        const lowerStringSemitone = NOTE_TO_SEMITONE[lowerStringNote]

        // Avoid redundant open note if the adjacent lower string already has
        // the same pitch class in the first visible 4-fret window.
        if (lowerStringSemitone !== undefined) {
          const duplicateFret = (noteSemitone - lowerStringSemitone + 12) % 12
          if (duplicateFret > 0) {
            const duplicateAbsoluteFret = duplicateFret
            if (duplicateAbsoluteFret >= startFret && duplicateAbsoluteFret <= firstFormatLastFret) {
              return null
            }
          }
        }

        if (noteSemitone !== undefined && scaleSemitones.has(noteSemitone)) {
          return index
        }
        return null
      })
      .filter(index => index !== null)
  )
}

export function buildScaleMarkers(scale, instrumentName, startFret, fretCount) {
  const openNotes = INSTRUMENT_OPEN_NOTES[instrumentName] || INSTRUMENT_OPEN_NOTES.guitar
  const rootSemitone = NOTE_TO_SEMITONE[scale.root]

  if (rootSemitone === undefined) {
    return {}
  }

  const scaleSemitones = new Set(
    scale.pattern.intervals.map(interval => (rootSemitone + interval) % 12)
  )

  return openNotes.reduce((acc, openNote, stringIndex) => {
    const openSemitone = NOTE_TO_SEMITONE[openNote]
    if (openSemitone === undefined) return acc

    for (let fretOffset = 0; fretOffset < fretCount; fretOffset += 1) {
      const absoluteFret = startFret + fretOffset
      if (absoluteFret > MAX_FRET) continue

      const semitone = (openSemitone + absoluteFret) % 12
      if (scaleSemitones.has(semitone)) {
        const markerKey = `${stringIndex}-${fretOffset}`
        const isTonic = semitone === rootSemitone
        acc[markerKey] = {
          type: 'note',
          value: SEMITONE_TO_NOTE[semitone],
          color: isTonic ? AUTO_SCALE_TONIC_COLOR : AUTO_SCALE_NOTE_COLOR,
        }
      }
    }

    return acc
  }, {})
}

export function buildScaleFormats(markers, instrumentName, startFret, fretCount, scale = null) {
  const openNotes = INSTRUMENT_OPEN_NOTES[instrumentName] || INSTRUMENT_OPEN_NOTES.guitar
  const stringCount = openNotes.length
  const lastFret = Math.min(MAX_FRET, startFret + fretCount - 1)

  const markerEntries = Object.keys(markers).map((key) => {
    const [stringIndexRaw, fretIndexRaw] = key.split('-')
    const stringIndex = parseInt(stringIndexRaw, 10)
    const fretIndex = parseInt(fretIndexRaw, 10)

    return {
      key,
      stringIndex,
      absoluteFret: startFret + fretIndex,
    }
  })

  if (instrumentName === 'guitar' && scale) {
    const rootSemitone = NOTE_TO_SEMITONE[scale.root]

    if (rootSemitone !== undefined) {
      const tonicAnchorFrets = Array.from(new Set(
        markerEntries
          .filter((entry) => {
            const marker = markers[entry.key]
            if (!marker || marker.type !== 'note') return false
            const semitone = NOTE_TO_SEMITONE[marker.value]
            return semitone === rootSemitone
          })
          .map(entry => entry.absoluteFret)
          .filter(fret => fret >= startFret && fret <= lastFret)
      )).sort((a, b) => a - b)

      if (tonicAnchorFrets.length > 0) {
        const cagedAnchors = tonicAnchorFrets.slice(0, 5)
        const usedWindows = new Set()
        const cagedFormats = cagedAnchors
          .map((anchorFret) => {
            // In CAGED mode, each format starts from a tonic anchor.
            const windowStart = anchorFret
            const windowEnd = Math.min(lastFret, windowStart + CAGED_FORMAT_SPAN_FRETS - 1)
            const windowKey = `${windowStart}-${windowEnd}`
            if (usedWindows.has(windowKey)) return null

            const entriesInWindow = markerEntries.filter((entry) => (
              entry.absoluteFret >= windowStart && entry.absoluteFret <= windowEnd
            ))

            if (entriesInWindow.length === 0) return null

            usedWindows.add(windowKey)
            return {
              startFret: windowStart,
              endFret: windowEnd,
              markerKeys: entriesInWindow.map(entry => entry.key),
            }
          })
          .filter(Boolean)

        if (cagedFormats.length > 0) {
          return cagedFormats.map((format, index) => ({
            id: `format-${index + 1}`,
            label: `${index + 1}º formato (casas ${format.startFret}–${format.endFret})`,
            ...format,
          }))
        }
      }
    }
  }

  const strictFormats = []
  const relaxedFormats = []

  for (let windowStart = startFret; windowStart <= lastFret; windowStart += FORMAT_SPAN_FRETS) {
    const windowEnd = Math.min(lastFret, windowStart + FORMAT_SPAN_FRETS - 1)
    const entriesInWindow = markerEntries.filter((entry) => (
      entry.absoluteFret >= windowStart && entry.absoluteFret <= windowEnd
    ))

    if (entriesInWindow.length === 0) continue

    const stringsCovered = new Set(entriesInWindow.map(entry => entry.stringIndex)).size
    const formatData = {
      startFret: windowStart,
      endFret: windowEnd,
      markerKeys: entriesInWindow.map(entry => entry.key),
    }

    if (stringsCovered === stringCount) {
      strictFormats.push(formatData)
    } else if (entriesInWindow.length >= stringCount + 2) {
      relaxedFormats.push(formatData)
    }
  }

  const baseFormats = strictFormats.length > 0 ? strictFormats : relaxedFormats

  return baseFormats.map((format, index) => ({
    id: `format-${index + 1}`,
    label: `${index + 1}º formato (casas ${format.startFret}–${format.endFret})`,
    ...format,
  }))
}

function Scales() {
  const navigate = useNavigate()
  // markers: { [key]: { type: 'finger'|'note'|'fret', value: ... } }
  const [markers, setMarkers] = useState({})
  const [startingFret, setStartingFret] = useState(1)
  const [activeCell, setActiveCell] = useState(null)
  const [totalFrets, setTotalFrets] = useState(12)
  const [scaleName, setScaleName] = useState('')
  const [pendingNote, setPendingNote] = useState(null)
  const [pendingFretDigits, setPendingFretDigits] = useState('')
  const [colorPickerCell, setColorPickerCell] = useState(null)
  const [colorPickerPos, setColorPickerPos] = useState({ x: 0, y: 0 })
  const [colorMode, setColorMode] = useState('padrao')
  const [instrument, setInstrument] = useState('guitar')
  const [openStrings, setOpenStrings] = useState(new Set())
  const [selectedScaleInput, setSelectedScaleInput] = useState('')
  const [selectedScaleFeedback, setSelectedScaleFeedback] = useState('')
  const [activeKnownScale, setActiveKnownScale] = useState(null)
  const [scaleFormats, setScaleFormats] = useState([])
  const [selectedScaleView, setSelectedScaleView] = useState('all')
  const pendingTimerRef = useRef(null)
  const fretDigitTimerRef = useRef(null)
  const captureRef = useRef(null)

  const hasFretNumbers = Object.values(markers).some(m => m.type === 'fret')

  const visibleMarkers = useMemo(() => {
    if (selectedScaleView === 'all') return markers

    const chosenFormat = scaleFormats.find(format => format.id === selectedScaleView)
    if (!chosenFormat) return markers

    const allowedKeys = new Set(chosenFormat.markerKeys)
    const formatEntries = Object.entries(markers)
      .filter(([key]) => allowedKeys.has(key))
      .map(([key, marker]) => {
        const [stringIndexRaw, fretIndexRaw] = key.split('-')
        return {
          key,
          marker,
          stringIndex: parseInt(stringIndexRaw, 10),
          fretIndex: parseInt(fretIndexRaw, 10),
        }
      })
      .sort((a, b) => a.stringIndex - b.stringIndex || a.fretIndex - b.fretIndex)

    const keptNotesByString = new Map()

    return formatEntries.reduce((acc, entry) => {
      const { key, marker, stringIndex } = entry

      if (marker?.type === 'note') {
        const previousStringNotes = keptNotesByString.get(stringIndex - 1)
        if (previousStringNotes?.has(marker.value)) {
          return acc
        }

        const currentNotes = keptNotesByString.get(stringIndex) || new Set()
        currentNotes.add(marker.value)
        keptNotesByString.set(stringIndex, currentNotes)
      }

      acc[key] = marker
      return acc
    }, {})
  }, [markers, scaleFormats, selectedScaleView])

  const visibleOpenStrings = useMemo(() => {
    if (selectedScaleView === 'all') return openStrings

    const chosenFormat = scaleFormats.find(format => format.id === selectedScaleView)
    if (!chosenFormat) return openStrings

    // Open strings only make sense in the initial visible position.
    if (chosenFormat.startFret !== startingFret) {
      return new Set()
    }

    return openStrings
  }, [openStrings, scaleFormats, selectedScaleView, startingFret])

  const handleCellClick = useCallback((stringIndex, fretIndex) => {
    const key = `${stringIndex}-${fretIndex}`
    if (markers[key] !== undefined) {
      setMarkers(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setActiveCell(null)
      setPendingNote(null)
    } else {
      setActiveCell(key)
      setPendingNote(null)
    }
  }, [markers])

  const setMarkerValue = useCallback((value) => {
    if (activeCell) {
      setMarkers(prev => ({
        ...prev,
        [activeCell]: value
      }))
      setActiveCell(null)
      setPendingNote(null)
    }
  }, [activeCell])

  const handleFingerInput = useCallback((num) => {
    if (activeCell && num >= 1 && num <= 6) {
      setMarkerValue({ type: 'finger', value: num })
    }
  }, [activeCell, setMarkerValue])

  const handleNoteInput = useCallback((note) => {
    if (activeCell) {
      setMarkerValue({ type: 'note', value: note })
    }
  }, [activeCell, setMarkerValue])

  const handleFretNumberInput = useCallback((num) => {
    if (activeCell) {
      setMarkerValue({ type: 'fret', value: num })
      setPendingFretDigits('')
    }
  }, [activeCell, setMarkerValue])

  const handleCellContextMenu = useCallback((cellKey, event) => {
    const marker = markers[cellKey]
    if (marker) {
      if (colorMode === 'colorir' || marker.type === 'fret') {
        event.preventDefault()
        setColorPickerCell(cellKey)
        setColorPickerPos({ x: event.clientX, y: event.clientY })
      }
    }
  }, [markers, colorMode])

  const handleColorSelect = useCallback((color) => {
    if (colorPickerCell) {
      setMarkers(prev => ({
        ...prev,
        [colorPickerCell]: { ...prev[colorPickerCell], color }
      }))
      setColorPickerCell(null)
    }
  }, [colorPickerCell])

  const handleOpenStringToggle = useCallback((stringIndex) => {
    setOpenStrings(prev => {
      const next = new Set(prev)
      if (next.has(stringIndex)) {
        next.delete(stringIndex)
      } else {
        next.add(stringIndex)
      }
      return next
    })
  }, [])

  const handleInstrumentChange = useCallback((inst) => {
    if (inst === instrument) return
    setInstrument(inst)
    setMarkers({})
    setActiveCell(null)
    setPendingNote(null)
    setPendingFretDigits('')
    setColorPickerCell(null)
    setOpenStrings(new Set())
    setSelectedScaleFeedback('')
    setActiveKnownScale(null)
    setScaleFormats([])
    setSelectedScaleView('all')
  }, [instrument])

  const handleClearAll = useCallback(() => {
    setMarkers({})
    setActiveCell(null)
    setPendingNote(null)
    setPendingFretDigits('')
    setColorPickerCell(null)
    setOpenStrings(new Set())
    setSelectedScaleFeedback('')
    setActiveKnownScale(null)
    setScaleFormats([])
    setSelectedScaleView('all')
  }, [])

  const handleApplyKnownScale = useCallback((rawInput) => {
    const chosenScale = getKnownScaleByLabel(rawInput)

    if (!chosenScale) {
      setSelectedScaleFeedback('Escala não encontrada. Escolha uma opção da lista.')
      return
    }

    const hasOpenString = scaleHasOpenString(chosenScale, instrument)
    const preferredStartingFret = hasOpenString ? 1 : startingFret
    const maxStartingFretForSpan = Math.max(1, MAX_FRET - MIN_SCALE_SPAN_FRETS + 1)
    const nextStartingFret = Math.min(preferredStartingFret, maxStartingFretForSpan)
    const currentLastFret = nextStartingFret + totalFrets - 1
    const requiredLastFret = Math.min(MAX_FRET, nextStartingFret + MIN_SCALE_SPAN_FRETS - 1)
    const nextTotalFrets = currentLastFret >= requiredLastFret
      ? totalFrets
      : requiredLastFret - nextStartingFret + 1

    if (nextStartingFret !== startingFret) {
      setStartingFret(nextStartingFret)
    }

    if (nextTotalFrets !== totalFrets) {
      setTotalFrets(nextTotalFrets)
    }

    const nextMarkers = buildScaleMarkers(chosenScale, instrument, nextStartingFret, nextTotalFrets)
    const nextFormats = buildScaleFormats(nextMarkers, instrument, nextStartingFret, nextTotalFrets, chosenScale)

    setMarkers(nextMarkers)
    setActiveCell(null)
    setPendingNote(null)
    setPendingFretDigits('')
    setColorPickerCell(null)
    setOpenStrings(getOpenStringIndexesForScale(chosenScale, instrument, nextStartingFret))
    setActiveKnownScale(chosenScale)
    setScaleFormats(nextFormats)
    setSelectedScaleView('all')

    setSelectedScaleInput(chosenScale.label)
    setScaleName(chosenScale.label)

    if (nextTotalFrets !== totalFrets) {
      setSelectedScaleFeedback(
        hasOpenString
          ? `Escala ${chosenScale.label} aplicada. Como há corda solta, o braço iniciou na 1ª casa para o desenho aberto aparecer por último (na 12ª) e expandiu para ${nextTotalFrets} casas visíveis.`
          : `Escala ${chosenScale.label} aplicada. Braço expandido para ${nextTotalFrets} casas visíveis.`
      )
      return
    }

    setSelectedScaleFeedback(
      hasOpenString
        ? `Escala ${chosenScale.label} aplicada. Como há corda solta, o braço iniciou na 1ª casa para o desenho aberto aparecer por último (na 12ª).`
        : `Escala ${chosenScale.label} aplicada no braço.`
    )
  }, [instrument, startingFret, totalFrets])

  useEffect(() => {
    if (!activeKnownScale) return

    const nextMarkers = buildScaleMarkers(activeKnownScale, instrument, startingFret, totalFrets)
    const nextFormats = buildScaleFormats(nextMarkers, instrument, startingFret, totalFrets, activeKnownScale)

    setMarkers(nextMarkers)
    setScaleFormats(nextFormats)
    setOpenStrings(getOpenStringIndexesForScale(activeKnownScale, instrument, startingFret))
    if (selectedScaleView !== 'all' && !nextFormats.some(format => format.id === selectedScaleView)) {
      setSelectedScaleView('all')
    }
  }, [activeKnownScale, instrument, startingFret, totalFrets, selectedScaleView])

  const handleDownload = useCallback(async () => {
    if (!captureRef.current) return
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#121212',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      const fileName = scaleName.trim()
        ? `${scaleName.trim().replace(/[^a-zA-Z0-9#\s-]/g, '_')}.png`
        : instrument === 'bass' ? 'escala-baixo.png' : 'escala-guitarra.png'
      link.download = fileName
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
    }
  }, [scaleName])

  const handleCancelSelection = useCallback(() => {
    setActiveCell(null)
    setPendingNote(null)
    setPendingFretDigits('')
  }, [])

  const confirmPendingNote = useCallback((letter) => {
    if (activeCell) {
      setMarkerValue({ type: 'note', value: letter })
    }
  }, [activeCell, setMarkerValue])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeCell) return

      if (pendingNote) {
        if (e.key === '#' || e.key === '3') {
          clearTimeout(pendingTimerRef.current)
          const sharpNote = pendingNote + '#'
          if (VALID_NOTES.includes(sharpNote)) {
            handleNoteInput(sharpNote)
          } else {
            confirmPendingNote(pendingNote)
          }
          return
        } else if (e.key === 'b' || e.key === 'B') {
          clearTimeout(pendingTimerRef.current)
          const flatNote = pendingNote + 'b'
          if (VALID_NOTES.includes(flatNote)) {
            handleNoteInput(flatNote)
          } else {
            confirmPendingNote(pendingNote)
          }
          return
        } else {
          clearTimeout(pendingTimerRef.current)
          confirmPendingNote(pendingNote)
          return
        }
      }

      if (pendingFretDigits !== '') {
        const digit = e.key
        if (digit >= '0' && digit <= '9') {
          clearTimeout(fretDigitTimerRef.current)
          const newDigits = pendingFretDigits + digit
          const num = parseInt(newDigits)
          if (num > 24) {
            handleFretNumberInput(parseInt(pendingFretDigits))
            return
          }
          setPendingFretDigits(newDigits)
          fretDigitTimerRef.current = setTimeout(() => {
            handleFretNumberInput(parseInt(newDigits))
          }, 600)
          return
        } else if (e.key === 'Enter') {
          clearTimeout(fretDigitTimerRef.current)
          handleFretNumberInput(parseInt(pendingFretDigits))
          return
        } else if (e.key === 'Escape') {
          clearTimeout(fretDigitTimerRef.current)
          setPendingFretDigits('')
          handleCancelSelection()
          return
        }
        return
      }

      if (e.key === 'Escape') {
        handleCancelSelection()
        return
      }

      if (hasFretNumbers) {
        const digit = e.key
        if (digit >= '0' && digit <= '9') {
          setPendingFretDigits(digit)
          fretDigitTimerRef.current = setTimeout(() => {
            handleFretNumberInput(parseInt(digit))
          }, 600)
        }
        return
      }

      const letter = e.key.toUpperCase()
      if (NOTE_LETTERS.includes(letter)) {
        setPendingNote(letter)
        clearTimeout(pendingTimerRef.current)
        pendingTimerRef.current = setTimeout(() => {
          confirmPendingNote(letter)
        }, 800)
        return
      }

      const digit = e.key
      if (digit >= '0' && digit <= '9') {
        const num = parseInt(digit)
        if (num === 0 || num > 6) {
          setPendingFretDigits(digit)
          fretDigitTimerRef.current = setTimeout(() => {
            handleFretNumberInput(num)
          }, 600)
        } else {
          handleFingerInput(num)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(pendingTimerRef.current)
      clearTimeout(fretDigitTimerRef.current)
    }
  }, [activeCell, pendingNote, pendingFretDigits, hasFretNumbers, handleFingerInput, handleFretNumberInput, handleNoteInput, handleCancelSelection, confirmPendingNote])

  return (
    <div className="app">
      <header className="app-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar
        </button>
        <h1>{instrument === 'bass' ? '🎸 Escala de Baixo' : '🎸 Escala de Guitarra'}</h1>
        <p className="subtitle">Clique nas cordas para marcar os dedos da escala</p>
      </header>

      <Controls
        startingFret={startingFret}
        setStartingFret={setStartingFret}
        totalFrets={totalFrets}
        setTotalFrets={setTotalFrets}
        onClearAll={handleClearAll}
        onDownload={handleDownload}
        markerCount={Object.keys(markers).length}
        fretNumbersLocked={hasFretNumbers}
      />

      <div className="mode-toggle-container">
        <span className="mode-toggle-label">Instrumento:</span>
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${instrument === 'guitar' ? 'active' : ''}`}
            onClick={() => handleInstrumentChange('guitar')}
          >
            🎸 Guitarra
          </button>
          <button
            className={`mode-toggle-btn ${instrument === 'bass' ? 'active' : ''}`}
            onClick={() => handleInstrumentChange('bass')}
          >
            🎵 Baixo
          </button>
        </div>
      </div>

      <div className="mode-toggle-container">
        <span className="mode-toggle-label">Modo de cor:</span>
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${colorMode === 'padrao' ? 'active' : ''}`}
            onClick={() => setColorMode('padrao')}
          >
            Padrão
          </button>
          <button
            className={`mode-toggle-btn ${colorMode === 'colorir' ? 'active' : ''}`}
            onClick={() => setColorMode('colorir')}
          >
            🎨 Colorir
          </button>
        </div>
        {colorMode === 'colorir' && (
          <span className="mode-hint">Clique direito (ou segure no celular) para trocar a cor</span>
        )}
      </div>

      <div className="scale-name-container">
        <div className="known-scales-picker">
          <label htmlFor="known-scales-input" className="known-scales-label">Escalas conhecidas (autocomplete):</label>
          <div className="known-scales-row">
            <input
              id="known-scales-input"
              type="text"
              className="known-scales-input"
              placeholder="Ex: C Maior, A Menor Natural, E Pentatônica Menor"
              list="known-scales-options"
              value={selectedScaleInput}
              onChange={(e) => setSelectedScaleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApplyKnownScale(selectedScaleInput)
                }
              }}
            />
            <datalist id="known-scales-options">
              {KNOWN_SCALES.map(scale => (
                <option key={scale.key} value={scale.label} />
              ))}
            </datalist>
            <button
              type="button"
              className="known-scales-apply-btn"
              onClick={() => handleApplyKnownScale(selectedScaleInput)}
            >
              Aplicar no braço
            </button>
          </div>
          <div className="known-scales-view-row">
            <label htmlFor="known-scales-view" className="known-scales-view-label">Visualização dos formatos:</label>
            <select
              id="known-scales-view"
              className="known-scales-view-select"
              value={selectedScaleView}
              onChange={(e) => setSelectedScaleView(e.target.value)}
              disabled={scaleFormats.length === 0}
            >
              <option value="all">TUDO (padrão)</option>
              {scaleFormats.map(format => (
                <option key={format.id} value={format.id}>{format.label}</option>
              ))}
            </select>
          </div>
          {selectedScaleFeedback && (
            <p className={`known-scales-feedback ${selectedScaleFeedback.includes('não encontrada') ? 'error' : ''}`}>
              {selectedScaleFeedback}
            </p>
          )}
        </div>

        <input
          type="text"
          className="scale-name-input"
          placeholder="Digite o nome da escala... Ex: A# Diminuta, C Maior, G Pentatônica Menor"
          value={scaleName}
          onChange={(e) => setScaleName(e.target.value)}
        />
      </div>

      <div ref={captureRef} className="capture-area">
        {scaleName.trim() && (
          <div className="scale-name-display">
            <h2>{scaleName}</h2>
          </div>
        )}

        <div className="fretboard-container">
          <GuitarFretboard
            markers={visibleMarkers}
            activeCell={activeCell}
            startingFret={startingFret}
            totalFrets={totalFrets}
            onCellClick={handleCellClick}
            onCellContextMenu={handleCellContextMenu}
            hideFretNumbers={hasFretNumbers}
            colorMode={colorMode}
            openStrings={visibleOpenStrings}
            onOpenStringToggle={handleOpenStringToggle}
            allowOpenStrings={!hasFretNumbers}
            instrument={instrument}
          />
        </div>
      </div>

      {activeCell && (
        <div className="input-hint">
          <div className="hint-box">
            <p>📍 Posição selecionada: <strong>Corda {parseInt(activeCell.split('-')[0]) + 1}, Casa {parseInt(activeCell.split('-')[1]) + startingFret}</strong></p>
            
            {pendingNote ? (
              <p>Nota <strong>{pendingNote}</strong> — pressione <strong>#</strong> (sustenido), <strong>b</strong> (bemol) ou <strong>Enter</strong> para natural</p>
            ) : pendingFretDigits !== '' ? (
              <p>Casa <strong>{pendingFretDigits}</strong> — digite mais dígitos ou aguarde para confirmar</p>
            ) : hasFretNumbers ? (
              <p>Digite o <strong>número da casa</strong> (0–24) ou <strong>ESC</strong> para cancelar</p>
            ) : (
              <p>Digite <strong>1–6</strong> (dedo), <strong>A–G</strong> (cifra), <strong>0–9</strong> (nº casa), ou <strong>ESC</strong> para cancelar</p>
            )}

            {!pendingNote && pendingFretDigits === '' && (
              <>
                {!hasFretNumbers && (
                  <>
                    <div className="input-section">
                      <span className="section-label">Dedos:</span>
                      <div className="finger-buttons">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <button
                            key={n}
                            className="finger-btn"
                            onClick={() => handleFingerInput(n)}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="input-section">
                      <span className="section-label">Cifras:</span>
                      <div className="note-buttons">
                        {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(letter => (
                          <div key={letter} className="note-group">
                            <button
                              className="note-btn note-natural"
                              onClick={() => handleNoteInput(letter)}
                            >
                              {letter}
                            </button>
                            {['E', 'B'].includes(letter) ? null : (
                              <button
                                className="note-btn note-sharp"
                                onClick={() => handleNoteInput(letter + '#')}
                              >
                                {letter}#
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="input-section">
                      <span className="section-label">Bemóis:</span>
                      <div className="note-buttons">
                        {['Db', 'Eb', 'Gb', 'Ab', 'Bb'].map(note => (
                          <button
                            key={note}
                            className="note-btn note-flat"
                            onClick={() => handleNoteInput(note)}
                          >
                            {note}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="input-section">
                  <span className="section-label">Casas:</span>
                  <div className="fret-number-buttons">
                    {Array.from({ length: 25 }, (_, i) => i).map(n => (
                      <button
                        key={n}
                        className="note-btn fret-num-btn"
                        onClick={() => handleFretNumberInput(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {pendingNote && (
              <div className="modifier-buttons">
                <button className="mod-btn" onClick={() => { clearTimeout(pendingTimerRef.current); confirmPendingNote(pendingNote) }}>
                  {pendingNote} (Natural)
                </button>
                {!['E', 'B'].includes(pendingNote) && (
                  <button className="mod-btn sharp" onClick={() => { clearTimeout(pendingTimerRef.current); handleNoteInput(pendingNote + '#') }}>
                    {pendingNote}# (Sustenido)
                  </button>
                )}
                {!['C', 'F'].includes(pendingNote) && (
                  <button className="mod-btn flat" onClick={() => { clearTimeout(pendingTimerRef.current); handleNoteInput(pendingNote + 'b') }}>
                    {pendingNote}b (Bemol)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="legend">
        <h3>Legenda</h3>
        <div className="legend-section">
          <span className="legend-title">Dedos:</span>
          <div className="legend-items">
            <span className="legend-item"><span className="dot finger-1">1</span> Indicador</span>
            <span className="legend-item"><span className="dot finger-2">2</span> Médio</span>
            <span className="legend-item"><span className="dot finger-3">3</span> Anelar</span>
            <span className="legend-item"><span className="dot finger-4">4</span> Mínimo</span>
            <span className="legend-item"><span className="dot finger-5">5</span> Polegar</span>
            <span className="legend-item"><span className="dot finger-6">6</span> Alternativo</span>
          </div>
        </div>
        <div className="legend-section">
          <span className="legend-title">Cifras:</span>
          <div className="legend-items">
            <span className="legend-item"><span className="dot note-dot">C</span> Dó</span>
            <span className="legend-item"><span className="dot note-dot">D</span> Ré</span>
            <span className="legend-item"><span className="dot note-dot">E</span> Mi</span>
            <span className="legend-item"><span className="dot note-dot">F</span> Fá</span>
            <span className="legend-item"><span className="dot note-dot">G</span> Sol</span>
            <span className="legend-item"><span className="dot note-dot">A</span> Lá</span>
            <span className="legend-item"><span className="dot note-dot">B</span> Si</span>
          </div>
        </div>
      </div>

      {colorPickerCell && (
        <div className="color-picker-overlay" onClick={() => setColorPickerCell(null)}>
          <div
            className="color-picker-popup"
            style={{ top: colorPickerPos.y, left: colorPickerPos.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="color-picker-title">Escolha uma cor</p>
            <div className="color-picker-grid">
              {[
                '#607d8b', '#2196F3', '#4CAF50', '#FF9800',
                '#F44336', '#9C27B0', '#00BCD4', '#E91E63',
                '#FF5722', '#795548', '#3F51B5', '#009688',
                '#CDDC39', '#FFC107', '#8BC34A', '#673AB7'
              ].map(color => (
                <button
                  key={color}
                  className={`color-swatch ${markers[colorPickerCell]?.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
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

export default Scales
