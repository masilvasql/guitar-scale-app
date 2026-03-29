import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Metronome.css'

const TIME_SIGNATURES = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '5/4', beats: 5 },
  { label: '6/8', beats: 6 },
  { label: '7/8', beats: 7 },
]

const SUBDIVISIONS = [
  { label: '𝅘𝅥', name: 'Semínima', divisor: 1 },
  { label: '𝅘𝅥𝅮', name: 'Colcheia', divisor: 2 },
  { label: '𝅘𝅥𝅯', name: 'Semicolcheia', divisor: 4 },
  { label: '𝅘𝅥𝅰', name: 'Fusa', divisor: 8 },
]

const MIN_BPM = 20
const MAX_BPM = 300

function Metronome() {
  const navigate = useNavigate()
  const location = useLocation()
  const [bpm, setBpm] = useState(120)
  const [timeSignature, setTimeSignature] = useState(TIME_SIGNATURES[2]) // 4/4
  const [isPlaying, setIsPlaying] = useState(false)
  const [accentEnabled, setAccentEnabled] = useState(true)
  const [subdivision, setSubdivision] = useState(SUBDIVISIONS[0]) // Semínima
  const [currentBeat, setCurrentBeat] = useState(-1)

  const audioCtxRef = useRef(null)
  const timerRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const currentBeatRef = useRef(0)
  const isPlayingRef = useRef(false)
  const bpmRef = useRef(bpm)
  const beatsRef = useRef(timeSignature.beats)
  const accentRef = useRef(accentEnabled)
  const subdivisionRef = useRef(subdivision.divisor)

  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  useEffect(() => {
    beatsRef.current = timeSignature.beats
  }, [timeSignature])

  useEffect(() => {
    accentRef.current = accentEnabled
  }, [accentEnabled])

  useEffect(() => {
    subdivisionRef.current = subdivision.divisor
  }, [subdivision])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const bpmFromUrl = Number(params.get('bpm'))

    if (Number.isFinite(bpmFromUrl) && bpmFromUrl >= MIN_BPM && bpmFromUrl <= MAX_BPM) {
      setBpm(bpmFromUrl)
    }
  }, [location.search])

  useEffect(() => {
    return () => {
      stopMetronome()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }, [])

  const playClick = useCallback((time, isAccent, isSubdivision) => {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (isAccent && accentRef.current) {
      osc.frequency.value = 1000
      gain.gain.setValueAtTime(0.7, time)
    } else if (isSubdivision) {
      osc.frequency.value = 600
      gain.gain.setValueAtTime(0.2, time)
    } else {
      osc.frequency.value = 800
      gain.gain.setValueAtTime(0.4, time)
    }

    osc.type = 'sine'
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    osc.start(time)
    osc.stop(time + 0.05)
  }, [getAudioContext])

  const scheduler = useCallback(() => {
    const ctx = getAudioContext()
    const scheduleAhead = 0.1
    const lookahead = 25

    function schedule() {
      while (nextNoteTimeRef.current < ctx.currentTime + scheduleAhead) {
        const totalClicks = beatsRef.current * subdivisionRef.current
        const isMainBeat = currentBeatRef.current % subdivisionRef.current === 0
        const mainBeatIndex = Math.floor(currentBeatRef.current / subdivisionRef.current)
        const isAccent = currentBeatRef.current === 0
        const isSubdivision = !isMainBeat

        playClick(nextNoteTimeRef.current, isAccent, isSubdivision)

        const beatIndex = currentBeatRef.current
        const scheduledTime = nextNoteTimeRef.current
        const delay = (scheduledTime - ctx.currentTime) * 1000

        setTimeout(() => {
          if (isPlayingRef.current) {
            setCurrentBeat(beatIndex)
          }
        }, Math.max(0, delay))

        const secondsPerBeat = 60.0 / bpmRef.current
        const secondsPerClick = secondsPerBeat / subdivisionRef.current
        nextNoteTimeRef.current += secondsPerClick
        currentBeatRef.current = (currentBeatRef.current + 1) % totalClicks
      }
      timerRef.current = setTimeout(schedule, lookahead)
    }

    schedule()
  }, [getAudioContext, playClick])

  const startMetronome = useCallback(() => {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    currentBeatRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime
    isPlayingRef.current = true
    setIsPlaying(true)
    setCurrentBeat(-1)
    scheduler()
  }, [getAudioContext, scheduler])

  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setCurrentBeat(-1)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopMetronome()
    } else {
      startMetronome()
    }
  }, [isPlaying, startMetronome, stopMetronome])

  const handleBpmChange = (e) => {
    const val = Number(e.target.value)
    if (val >= MIN_BPM && val <= MAX_BPM) {
      setBpm(val)
    }
  }

  const adjustBpm = (delta) => {
    setBpm(prev => Math.max(MIN_BPM, Math.min(MAX_BPM, prev + delta)))
  }

  const handleTimeSignatureChange = (ts) => {
    setTimeSignature(ts)
    if (isPlaying) {
      stopMetronome()
      setTimeout(() => {
        beatsRef.current = ts.beats
        startMetronome()
      }, 50)
    }
  }

  const tempoMarking = (() => {
    if (bpm < 40) return 'Grave'
    if (bpm < 55) return 'Largo'
    if (bpm < 66) return 'Larghetto'
    if (bpm < 76) return 'Adagio'
    if (bpm < 92) return 'Andante'
    if (bpm < 108) return 'Moderato'
    if (bpm < 120) return 'Allegretto'
    if (bpm < 156) return 'Allegro'
    if (bpm < 176) return 'Vivace'
    if (bpm < 200) return 'Presto'
    return 'Prestissimo'
  })()

  const handleSubdivisionChange = (sub) => {
    setSubdivision(sub)
    if (isPlaying) {
      stopMetronome()
      setTimeout(() => {
        subdivisionRef.current = sub.divisor
        startMetronome()
      }, 50)
    }
  }

  const totalClicks = timeSignature.beats * subdivision.divisor
  const beatIndicators = Array.from({ length: totalClicks }, (_, i) => i)

  return (
    <div className="met-page">
      <header className="met-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Início
        </button>
        <h1>🎵 Metrônomo</h1>
        <p className="met-subtitle">Controle o tempo da sua prática</p>
      </header>

      {/* Beat Indicators */}
      <div className="met-beats-display">
        {beatIndicators.map((i) => (
          <div
            key={i}
            className={`beat-dot ${currentBeat === i ? 'active' : ''} ${i === 0 ? 'accent' : ''} ${i % subdivision.divisor !== 0 ? 'sub' : ''}`}
          />
        ))}
      </div>

      {/* Tempo Marking */}
      <div className="met-tempo-marking">{tempoMarking}</div>

      {/* BPM Control */}
      <div className="met-bpm-section">
        <button className="met-bpm-btn" onClick={() => adjustBpm(-5)} aria-label="Diminuir 5 BPM">-5</button>
        <button className="met-bpm-btn" onClick={() => adjustBpm(-1)} aria-label="Diminuir 1 BPM">-1</button>
        <div className="met-bpm-display">
          <input
            type="number"
            className="met-bpm-input"
            value={bpm}
            onChange={handleBpmChange}
            min={MIN_BPM}
            max={MAX_BPM}
          />
          <span className="met-bpm-label">BPM</span>
        </div>
        <button className="met-bpm-btn" onClick={() => adjustBpm(1)} aria-label="Aumentar 1 BPM">+1</button>
        <button className="met-bpm-btn" onClick={() => adjustBpm(5)} aria-label="Aumentar 5 BPM">+5</button>
      </div>

      {/* BPM Slider */}
      <div className="met-slider-container">
        <input
          type="range"
          className="met-slider"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={handleBpmChange}
        />
      </div>

      {/* Play/Stop Button */}
      <div className="met-play-section">
        <button className={`met-play-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay}>
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <rect x="8" y="6" width="5" height="20" rx="1"/>
              <rect x="19" y="6" width="5" height="20" rx="1"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <polygon points="10,6 26,16 10,26"/>
            </svg>
          )}
        </button>
      </div>

      {/* Time Signature */}
      <div className="met-section">
        <label className="met-section-label">Compasso</label>
        <div className="met-ts-grid">
          {TIME_SIGNATURES.map((ts) => (
            <button
              key={ts.label}
              className={`met-ts-btn ${timeSignature.label === ts.label ? 'active' : ''}`}
              onClick={() => handleTimeSignatureChange(ts)}
            >
              {ts.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subdivision */}
      <div className="met-section">
        <label className="met-section-label">Subdivisão</label>
        <div className="met-ts-grid">
          {SUBDIVISIONS.map((sub) => (
            <button
              key={sub.name}
              className={`met-ts-btn met-sub-btn ${subdivision.name === sub.name ? 'active' : ''}`}
              onClick={() => handleSubdivisionChange(sub)}
              title={sub.name}
            >
              <span className="met-sub-symbol">{sub.label}</span>
              <span className="met-sub-name">{sub.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Toggle */}
      <div className="met-section">
        <label className="met-section-label">Acento no primeiro tempo</label>
        <div className="met-accent-toggle">
          <button
            className={`met-toggle-btn ${accentEnabled ? 'active' : ''}`}
            onClick={() => setAccentEnabled(true)}
          >
            Ligado
          </button>
          <button
            className={`met-toggle-btn ${!accentEnabled ? 'active' : ''}`}
            onClick={() => setAccentEnabled(false)}
          >
            Desligado
          </button>
        </div>
        <p className="met-accent-hint">
          {accentEnabled
            ? 'Um som mais agudo marca o início de cada compasso'
            : 'Todos os tempos têm o mesmo som'}
        </p>
      </div>
    </div>
  )
}

export default Metronome
