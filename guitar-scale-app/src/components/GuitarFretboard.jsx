import React, { useRef, useCallback } from 'react'
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

const DEFAULT_COLORIR_COLOR = '#2196F3'

function getMarkerColor(marker, colorMode) {
  if (!marker) return '#666'
  if (colorMode === 'colorir') return marker.color || DEFAULT_COLORIR_COLOR
  if (marker.type === 'finger') return FINGER_COLORS[marker.value] || '#666'
  if (marker.type === 'note') return NOTE_COLORS[marker.value] || '#666'
  if (marker.type === 'fret') return marker.color || '#607d8b'
  return '#666'
}

function getMarkerLabel(marker) {
  if (!marker) return ''
  return String(marker.value)
}

// Frets that traditionally have inlay dots
const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
const DOUBLE_INLAY_FRETS = [12, 24]

function GuitarFretboard({ markers, activeCell, startingFret, totalFrets, onCellClick, onCellContextMenu, hideFretNumbers, colorMode }) {
  const frets = Array.from({ length: totalFrets }, (_, i) => i)
  const strings = Array.from({ length: 6 }, (_, i) => i)
  const longPressTimerRef = useRef(null)
  const longPressTriggeredRef = useRef(false)

  const handleTouchStart = useCallback((key, e) => {
    longPressTriggeredRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      const touch = e.touches[0]
      onCellContextMenu(key, {
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY
      })
    }, 500)
  }, [onCellContextMenu])

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimerRef.current)
  }, [])

  const handleTouchMove = useCallback(() => {
    clearTimeout(longPressTimerRef.current)
  }, [])

  return (
    <div className="fretboard-wrapper">
      {/* String labels on the left */}
      <div className="string-labels" style={{ paddingTop: hideFretNumbers ? '15px' : '52px' }}>
        {strings.map(s => (
          <div key={s} className="string-label">
            {STRING_NAMES[s]}
          </div>
        ))}
      </div>

      <div className="fretboard">
        {/* Fret numbers on top */}
        {!hideFretNumbers && (
          <div className="fret-numbers">
            {frets.map(f => (
              <div key={f} className="fret-number">
                {f + startingFret}
              </div>
            ))}
          </div>
        )}

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
                  onClick={(e) => {
                    if (longPressTriggeredRef.current) {
                      longPressTriggeredRef.current = false
                      return
                    }
                    onCellClick(stringIndex, fretIndex)
                  }}
                  onContextMenu={(e) => {
                    if (marker) {
                      if (colorMode === 'colorir' || marker.type === 'fret') {
                        e.preventDefault()
                        onCellContextMenu(key, e)
                      }
                    }
                  }}
                  onTouchStart={(e) => {
                    if (marker) {
                      if (colorMode === 'colorir' || marker.type === 'fret') {
                        handleTouchStart(key, e)
                      }
                    }
                  }}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
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
                      className={`marker value-marker ${marker.type === 'note' ? 'note-marker' : marker.type === 'fret' ? 'fret-num-marker' : 'finger-marker'}`}
                      style={{ backgroundColor: getMarkerColor(marker, colorMode) }}
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
