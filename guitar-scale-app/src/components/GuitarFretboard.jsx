import React from 'react'
import './GuitarFretboard.css'

const STRING_NAMES = ['E (1ª)', 'B (2ª)', 'G (3ª)', 'D (4ª)', 'A (5ª)', 'E (6ª)']

const FINGER_COLORS = {
  1: '#2196F3', // Azul
  2: '#4CAF50', // Verde
  3: '#FF9800', // Laranja
  4: '#F44336', // Vermelho
  5: '#9C27B0', // Roxo
  6: '#00BCD4', // Ciano
}

const NOTE_COLORS = {
  'C': '#e91e63',
  'C#': '#e91e63',
  'Db': '#e91e63',
  'D': '#ff5722',
  'D#': '#ff5722',
  'Eb': '#ff5722',
  'E': '#ff9800',
  'F': '#ffc107',
  'F#': '#ffc107',
  'Gb': '#ffc107',
  'G': '#8bc34a',
  'G#': '#8bc34a',
  'Ab': '#8bc34a',
  'A': '#00bcd4',
  'A#': '#00bcd4',
  'Bb': '#00bcd4',
  'B': '#673ab7',
}

function getMarkerColor(marker) {
  if (!marker) return '#666'
  if (marker.type === 'finger') return FINGER_COLORS[marker.value] || '#666'
  if (marker.type === 'note') return NOTE_COLORS[marker.value] || '#666'
  return '#666'
}

function getMarkerLabel(marker) {
  if (!marker) return ''
  return String(marker.value)
}

// Frets that traditionally have inlay dots
const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
const DOUBLE_INLAY_FRETS = [12, 24]

function GuitarFretboard({ markers, activeCell, startingFret, totalFrets, onCellClick }) {
  const frets = Array.from({ length: totalFrets }, (_, i) => i)
  const strings = Array.from({ length: 6 }, (_, i) => i)

  return (
    <div className="fretboard-wrapper">
      {/* String labels on the left */}
      <div className="string-labels">
        {strings.map(s => (
          <div key={s} className="string-label">
            {STRING_NAMES[s]}
          </div>
        ))}
      </div>

      <div className="fretboard">
        {/* Fret numbers on top */}
        <div className="fret-numbers">
          {frets.map(f => (
            <div key={f} className="fret-number">
              {f + startingFret}
            </div>
          ))}
        </div>

        {/* Inlay dots */}
        <div className="inlay-row">
          {frets.map(f => {
            const actualFret = f + startingFret
            const isDouble = DOUBLE_INLAY_FRETS.includes(actualFret)
            const isSingle = INLAY_FRETS.includes(actualFret) && !isDouble
            return (
              <div key={f} className="inlay-cell">
                {isSingle && <div className="inlay-dot" />}
                {isDouble && (
                  <>
                    <div className="inlay-dot double-top" />
                    <div className="inlay-dot double-bottom" />
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Guitar strings and frets */}
        {strings.map(stringIndex => (
          <div key={stringIndex} className={`guitar-string string-${stringIndex}`}>
            {frets.map(fretIndex => {
              const key = `${stringIndex}-${fretIndex}`
              const marker = markers[key]
              const isActive = activeCell === key
              const hasMarker = marker !== undefined

              return (
                <div
                  key={fretIndex}
                  className={`fret-cell ${isActive ? 'active' : ''} ${hasMarker ? 'marked' : ''}`}
                  onClick={() => onCellClick(stringIndex, fretIndex)}
                  title={`Corda ${stringIndex + 1}, Casa ${fretIndex + startingFret}`}
                >
                  {/* The string wire */}
                  <div className={`string-wire wire-${stringIndex}`} />
                  
                  {/* Active selection (blue pulsing circle) */}
                  {isActive && (
                    <div className="marker active-marker">
                      <span>?</span>
                    </div>
                  )}

                  {/* Value marker */}
                  {hasMarker && (
                    <div
                      className={`marker value-marker ${marker.type === 'note' ? 'note-marker' : 'finger-marker'}`}
                      style={{ backgroundColor: getMarkerColor(marker) }}
                    >
                      <span>{getMarkerLabel(marker)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(GuitarFretboard)
