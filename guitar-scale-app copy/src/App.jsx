import { useState, useCallback, useEffect } from 'react'
import GuitarFretboard from './components/GuitarFretboard'
import Controls from './components/Controls'
import './App.css'

function App() {
  const [markers, setMarkers] = useState({})
  const [startingFret, setStartingFret] = useState(1)
  const [activeCell, setActiveCell] = useState(null)
  const [totalFrets, setTotalFrets] = useState(12)

  const handleCellClick = useCallback((stringIndex, fretIndex) => {
    const key = `${stringIndex}-${fretIndex}`
    
    if (markers[key] !== undefined) {
      setMarkers(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setActiveCell(null)
    } else {
      setActiveCell(key)
    }
  }, [markers])

  const handleFingerInput = useCallback((value) => {
    if (activeCell && value >= 1 && value <= 6) {
      setMarkers(prev => ({
        ...prev,
        [activeCell]: value
      }))
      setActiveCell(null)
    }
  }, [activeCell])

  const handleClearAll = useCallback(() => {
    setMarkers({})
    setActiveCell(null)
  }, [])

  const handleCancelSelection = useCallback(() => {
    setActiveCell(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeCell) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 6) {
          handleFingerInput(num)
        } else if (e.key === 'Escape') {
          handleCancelSelection()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeCell, handleFingerInput, handleCancelSelection])

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
        markerCount={Object.keys(markers).length}
      />

      <div className="fretboard-container">
        <GuitarFretboard
          markers={markers}
          activeCell={activeCell}
          startingFret={startingFret}
          totalFrets={totalFrets}
          onCellClick={handleCellClick}
        />
      </div>

      {activeCell && (
        <div className="input-hint">
          <div className="hint-box">
            <p>📍 Posição selecionada: <strong>Corda {parseInt(activeCell.split('-')[0]) + 1}, Casa {parseInt(activeCell.split('-')[1]) + startingFret}</strong></p>
            <p>Digite um número de <strong>1 a 6</strong> para o dedo, ou pressione <strong>ESC</strong> para cancelar</p>
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
        </div>
      )}

      <div className="legend">
        <h3>Legenda dos Dedos</h3>
        <div className="legend-items">
          <span className="legend-item"><span className="dot finger-1">1</span> Indicador</span>
          <span className="legend-item"><span className="dot finger-2">2</span> Médio</span>
          <span className="legend-item"><span className="dot finger-3">3</span> Anelar</span>
          <span className="legend-item"><span className="dot finger-4">4</span> Mínimo</span>
          <span className="legend-item"><span className="dot finger-5">5</span> Polegar</span>
          <span className="legend-item"><span className="dot finger-6">6</span> Alternativo</span>
        </div>
      </div>
    </div>
  )
}

export default App
