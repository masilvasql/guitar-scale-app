import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Afinador.css'

const A4_FREQ = 440
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function getNearestNote(frequency) {
  const midi = Math.round(69 + (12 * Math.log2(frequency / A4_FREQ)))
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  const noteFrequency = A4_FREQ * (2 ** ((midi - 69) / 12))
  const cents = Math.round(1200 * Math.log2(frequency / noteFrequency))

  return {
    midi,
    noteName,
    octave,
    cents,
    noteFrequency,
  }
}

function detectPitchAutoCorrelation(buffer, sampleRate, options = {}) {
  const {
    minRms = 0.01,
    trimThreshold = 0.2,
    minFrequency = 60,
    maxFrequency = 1400,
  } = options

  const size = buffer.length
  let rms = 0

  for (let i = 0; i < size; i += 1) {
    const value = buffer[i]
    rms += value * value
  }

  rms = Math.sqrt(rms / size)
  if (rms < minRms) {
    return null
  }

  let r1 = 0
  let r2 = size - 1

  for (let i = 0; i < size / 2; i += 1) {
    if (Math.abs(buffer[i]) < trimThreshold) {
      r1 = i
      break
    }
  }

  for (let i = 1; i < size / 2; i += 1) {
    if (Math.abs(buffer[size - i]) < trimThreshold) {
      r2 = size - i
      break
    }
  }

  const trimmed = buffer.slice(r1, r2)
  const trimmedSize = trimmed.length
  if (trimmedSize < 16) {
    return null
  }

  const correlation = new Array(trimmedSize).fill(0)

  for (let lag = 0; lag < trimmedSize; lag += 1) {
    let sum = 0
    for (let i = 0; i + lag < trimmedSize; i += 1) {
      sum += trimmed[i] * trimmed[i + lag]
    }
    correlation[lag] = sum
  }

  let dip = 0
  while (dip < trimmedSize - 1 && correlation[dip] > correlation[dip + 1]) {
    dip += 1
  }

  let bestLag = -1
  let bestValue = -Infinity
  for (let i = dip; i < trimmedSize; i += 1) {
    if (correlation[i] > bestValue) {
      bestValue = correlation[i]
      bestLag = i
    }
  }

  if (bestLag <= 0) {
    return null
  }

  const prev = correlation[bestLag - 1] || correlation[bestLag]
  const mid = correlation[bestLag]
  const next = correlation[bestLag + 1] || correlation[bestLag]
  const denominator = 2 * (2 * mid - prev - next)
  const shift = denominator !== 0 ? (next - prev) / denominator : 0
  const period = bestLag + shift

  if (!Number.isFinite(period) || period <= 0) {
    return null
  }

  const frequency = sampleRate / period

  if (!Number.isFinite(frequency) || frequency < minFrequency || frequency > maxFrequency) {
    return null
  }

  return frequency
}

function Afinador() {
  const navigate = useNavigate()
  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }, [])

  const [isListening, setIsListening] = useState(false)
  const [frequency, setFrequency] = useState(null)
  const [error, setError] = useState('')

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const sourceRef = useRef(null)
  const dataRef = useRef(null)
  const rafRef = useRef(null)

  const tuning = useMemo(() => {
    if (!frequency) {
      return null
    }
    return getNearestNote(frequency)
  }, [frequency])

  const centsClamped = tuning ? Math.max(-50, Math.min(50, tuning.cents)) : 0
  const pointerPosition = `${50 + (centsClamped / 50) * 50}%`

  const tuningState = useMemo(() => {
    if (!tuning) {
      return 'idle'
    }
    if (Math.abs(tuning.cents) <= 5) {
      return 'in-tune'
    }
    if (Math.abs(tuning.cents) <= 15) {
      return 'close'
    }
    return 'off'
  }, [tuning])

  const stopListening = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsListening(false)
    setFrequency(null)
  }, [])

  const analyzePitch = useCallback(() => {
    const analyser = analyserRef.current
    const data = dataRef.current

    if (!analyser || !data || !audioCtxRef.current) {
      return
    }

    analyser.getFloatTimeDomainData(data)

    const detectedFrequency = detectPitchAutoCorrelation(data, audioCtxRef.current.sampleRate, {
      minRms: isMobile ? 0.006 : 0.01,
      trimThreshold: isMobile ? 0.12 : 0.2,
      minFrequency: 60,
      maxFrequency: 1400,
    })

    if (detectedFrequency) {
      setFrequency((prev) => {
        if (!prev) {
          return detectedFrequency
        }
        const blend = isMobile ? 0.45 : 0.3
        return (prev * (1 - blend)) + (detectedFrequency * blend)
      })
    }

    rafRef.current = window.requestAnimationFrame(analyzePitch)
  }, [isMobile])

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 4096
      analyser.smoothingTimeConstant = 0

      source.connect(analyser)

      streamRef.current = stream
      sourceRef.current = source
      analyserRef.current = analyser
      dataRef.current = new Float32Array(analyser.fftSize)

      setError('')
      setIsListening(true)
      rafRef.current = window.requestAnimationFrame(analyzePitch)
    } catch (err) {
      setError('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
      stopListening()
    }
  }, [analyzePitch, stopListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
      return
    }
    startListening()
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return (
    <div className="tuner-page">
      <header className="tuner-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Início
        </button>
        <h1>🎯 Afinador</h1>
        <p className="tuner-subtitle">Afine sua guitarra em tempo real</p>
      </header>

      <section className="tuner-main">
        <div className={`tuner-note-card state-${tuningState}`}>
          <span className="tuner-note">{tuning ? tuning.noteName : '--'}</span>
          <span className="tuner-octave">{tuning ? tuning.octave : ''}</span>
        </div>

        <p className="tuner-frequency">
          {frequency ? `${frequency.toFixed(1)} Hz` : 'Sem sinal detectado'}
        </p>

        <div className="tuner-meter-wrap">
          <div className="tuner-meter-scale">
            <span>-50</span>
            <span>0</span>
            <span>+50</span>
          </div>
          <div className="tuner-meter-track">
            <div className="tuner-meter-center" />
            <div className={`tuner-meter-pointer state-${tuningState}`} style={{ left: pointerPosition }} />
          </div>
          <p className={`tuner-cents state-${tuningState}`}>
            {tuning ? `${tuning.cents > 0 ? '+' : ''}${tuning.cents} cents` : 'Aguardando nota'}
          </p>
        </div>

        <button className={`tuner-toggle ${isListening ? 'listening' : ''}`} onClick={toggleListening}>
          {isListening ? 'Parar afinador' : 'Ativar afinador'}
        </button>

        <p className="tuner-hint">
          Toque uma corda por vez para melhorar a precisão da leitura.
        </p>

        {error && <p className="tuner-error">{error}</p>}
      </section>
    </div>
  )
}

export default Afinador
