import React from 'react'
import './Controls.css'

function Controls({ startingFret, setStartingFret, totalFrets, setTotalFrets, onClearAll, markerCount }) {
  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="starting-fret">Casa Inicial:</label>
        <div className="input-with-buttons">
          <button
            className="ctrl-btn"
            onClick={() => setStartingFret(Math.max(1, startingFret - 1))}
            disabled={startingFret <= 1}
          >
            −
          </button>
          <input
            id="starting-fret"
            type="number"
            min="1"
            max="24"
            value={startingFret}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val >= 1 && val <= 24) setStartingFret(val)
            }}
          />
          <button
            className="ctrl-btn"
            onClick={() => setStartingFret(Math.min(24, startingFret + 1))}
            disabled={startingFret >= 24}
          >
            +
          </button>
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="total-frets">Quantidade de Casas:</label>
        <div className="input-with-buttons">
          <button
            className="ctrl-btn"
            onClick={() => setTotalFrets(Math.max(4, totalFrets - 1))}
            disabled={totalFrets <= 4}
          >
            −
          </button>
          <input
            id="total-frets"
            type="number"
            min="4"
            max="24"
            value={totalFrets}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val >= 4 && val <= 24) setTotalFrets(val)
            }}
          />
          <button
            className="ctrl-btn"
            onClick={() => setTotalFrets(Math.min(24, totalFrets + 1))}
            disabled={totalFrets >= 24}
          >
            +
          </button>
        </div>
      </div>

      <div className="control-group">
        <span className="marker-count">
          {markerCount} {markerCount === 1 ? 'nota marcada' : 'notas marcadas'}
        </span>
        <button
          className="clear-btn"
          onClick={onClearAll}
          disabled={markerCount === 0}
        >
          🗑️ Limpar Tudo
        </button>
      </div>
    </div>
  )
}

export default React.memo(Controls)
