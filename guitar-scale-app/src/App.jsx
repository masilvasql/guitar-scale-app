import { useState, useCallback, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import GuitarFretboard from './components/GuitarFretboard'
import Controls from './components/Controls'
import './App.css'

const VALID_NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const NOTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

function App() {
  // markers: { [key]: { type: 'finger', value: 1-6 } | { type: 'note', value: 'A#' } }
  const [markers, setMarkers] = useState({})
  const [startingFret, setStartingFret] = useState(1)
  const [activeCell, setActiveCell] = useState(null)
  const [totalFrets, setTotalFrets] = useState(12)
  const [scaleName, setScaleName] = useState('')
  const [pendingNote, setPendingNote] = useState(null) // letter waiting for # or b
  const pendingTimerRef = useRef(null)
  const captureRef = useRef(null)

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

  const handleClearAll = useCallback(() => {
    setMarkers({})
    setActiveCell(null)
    setPendingNote(null)
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
      const fileName = scaleName.trim()
        ? `${scaleName.trim().replace(/[^a-zA-Z0-9#\s-]/g, '_')}.png`
        : 'escala-guitarra.png'
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
  }, [])

  // Confirm a pending note (natural, without modifier)
  const confirmPendingNote = useCallback((letter) => {
    if (activeCell) {
      setMarkerValue({ type: 'note', value: letter })
    }
  }, [activeCell, setMarkerValue])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeCell) return

      // If there's a pending note, check for # or b modifier
      if (pendingNote) {
        if (e.key === '#' || e.key === '3') {
          // # (shift+3 on many keyboards)
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
          // Any other key: confirm the natural note first
          clearTimeout(pendingTimerRef.current)
          confirmPendingNote(pendingNote)
          return
        }
      }

      const num = parseInt(e.key)
      if (num >= 1 && num <= 6) {
        handleFingerInput(num)
      } else if (e.key === 'Escape') {
        handleCancelSelection()
      } else {
        // Check for note letter
        const letter = e.key.toUpperCase()
        if (NOTE_LETTERS.includes(letter)) {
          setPendingNote(letter)
          // Auto-confirm after 800ms if no modifier is pressed
          clearTimeout(pendingTimerRef.current)
          pendingTimerRef.current = setTimeout(() => {
            confirmPendingNote(letter)
          }, 800)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(pendingTimerRef.current)
    }
  }, [activeCell, pendingNote, handleFingerInput, handleNoteInput, handleCancelSelection, confirmPendingNote])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎸 Escala de Guitarra</h1>
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
      />

      <div className="scale-name-container">
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
            markers={markers}
            activeCell={activeCell}
            startingFret={startingFret}
            totalFrets={totalFrets}
            onCellClick={handleCellClick}
          />
        </div>
      </div> {/* end capture-area */}

      {activeCell && (
        <div className="input-hint">
          <div className="hint-box">
            <p>📍 Posição selecionada: <strong>Corda {parseInt(activeCell.split('-')[0]) + 1}, Casa {parseInt(activeCell.split('-')[1]) + startingFret}</strong></p>
            
            {pendingNote ? (
              <p>Nota <strong>{pendingNote}</strong> — pressione <strong>#</strong> (sustenido), <strong>b</strong> (bemol) ou <strong>Enter</strong> para natural</p>
            ) : (
              <p>Digite <strong>1–6</strong> (dedo) ou <strong>A–G</strong> (cifra), ou <strong>ESC</strong> para cancelar</p>
            )}

            {!pendingNote && (
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
    </div>
  )
}

export default App
