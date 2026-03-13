import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import GuitarFretboard from '../components/GuitarFretboard'
import Controls from '../components/Controls'
import './Scales.css'

const VALID_NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const NOTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

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
  const pendingTimerRef = useRef(null)
  const fretDigitTimerRef = useRef(null)
  const captureRef = useRef(null)

  const hasFretNumbers = Object.values(markers).some(m => m.type === 'fret')

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
  }, [instrument])

  const handleClearAll = useCallback(() => {
    setMarkers({})
    setActiveCell(null)
    setPendingNote(null)
    setPendingFretDigits('')
    setColorPickerCell(null)
    setOpenStrings(new Set())
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
            onCellContextMenu={handleCellContextMenu}
            hideFretNumbers={hasFretNumbers}
            colorMode={colorMode}
            openStrings={openStrings}
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
