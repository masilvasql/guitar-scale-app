import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Progressions.css'
import { getGuideNotesForChord } from '../utils/guideNotes'

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const MODES = {
  major: {
    label: 'Maior',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ['', 'm', 'm', '', '', 'm', 'dim'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    seventhQualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
  },
  minor: {
    label: 'Menor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    qualities: ['m', 'dim', '', 'm', 'm', '', ''],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    seventhQualities: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],
  },
  ionian: {
    label: 'Jônio',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ['', 'm', 'm', '', '', 'm', 'dim'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    seventhQualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
  },
  dorian: {
    label: 'Dórico',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    qualities: ['m', 'm', '', '', 'm', 'dim', ''],
    romans: ['i', 'ii', 'III', 'IV', 'v', 'vi°', 'VII'],
    seventhQualities: ['m7', 'm7', 'maj7', '7', 'm7', 'm7b5', 'maj7'],
  },
  phrygian: {
    label: 'Frígio',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    qualities: ['m', '', '', 'm', 'dim', '', 'm'],
    romans: ['i', 'bII', 'bIII', 'iv', 'v°', 'bVI', 'bvii'],
    seventhQualities: ['m7', 'maj7', '7', 'm7', 'm7b5', 'maj7', 'm7'],
  },
  lydian: {
    label: 'Lídio',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    qualities: ['', '', 'm', 'dim', '', 'm', 'm'],
    romans: ['I', 'II', 'iii', '#iv°', 'V', 'vi', 'vii'],
    seventhQualities: ['maj7', '7', 'm7', 'm7b5', 'maj7', 'm7', 'm7'],
  },
  mixolydian: {
    label: 'Mixolídio',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    qualities: ['', 'm', 'dim', '', 'm', 'm', ''],
    romans: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'],
    seventhQualities: ['7', 'm7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7'],
  },
  aeolian: {
    label: 'Eólio',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    qualities: ['m', 'dim', '', 'm', 'm', '', ''],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    seventhQualities: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],
  },
  locrian: {
    label: 'Lócrio',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    qualities: ['dim', '', 'm', 'm', '', '', 'm'],
    romans: ['i°', 'bII', 'biii', 'iv', 'bV', 'bVI', 'bvii'],
    seventhQualities: ['m7b5', 'maj7', 'm7', 'm7', 'maj7', 'maj7', 'm7'],
  },
}

const MODE_ORDER = ['major', 'minor', 'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian']

const PATTERNS = [
  { id: 'pop', name: 'Pop Clássica', mode: 'major', degrees: [1, 5, 6, 4], suggestedBpm: 92 },
  { id: 'cadencia', name: 'Cadência Perfeita', mode: 'major', degrees: [2, 5, 1], suggestedBpm: 86 },
  { id: 'blues', name: 'Blues Básica', mode: 'major', degrees: [1, 4, 5, 1], suggestedBpm: 104 },
  { id: 'balada', name: 'Balada', mode: 'major', degrees: [1, 6, 4, 5], suggestedBpm: 74 },
  { id: 'minor-pop', name: 'Menor Pop', mode: 'minor', degrees: [1, 6, 3, 7], suggestedBpm: 92 },
  { id: 'minor-cadence', name: 'Menor Funcional', mode: 'minor', degrees: [1, 4, 5, 1], suggestedBpm: 82 },
  { id: 'andaluz', name: 'Cadência Andaluz', mode: 'minor', degrees: [1, 7, 6, 5], suggestedBpm: 96 },
  { id: 'ionian-classic', name: 'Jônio Clássico', mode: 'ionian', degrees: [1, 4, 5, 1], suggestedBpm: 90 },
  { id: 'ionian-open', name: 'Jônio Aberto', mode: 'ionian', degrees: [1, 2, 5, 1], suggestedBpm: 96 },
  { id: 'dorian-groove', name: 'Dórico Groove', mode: 'dorian', degrees: [1, 4, 7, 1], suggestedBpm: 98 },
  { id: 'dorian-fusion', name: 'Dórico Fusion', mode: 'dorian', degrees: [1, 2, 4, 1], suggestedBpm: 104 },
  { id: 'phrygian-spanish', name: 'Frígio Espanhol', mode: 'phrygian', degrees: [1, 2, 1, 7], suggestedBpm: 108 },
  { id: 'phrygian-dark', name: 'Frígio Tenso', mode: 'phrygian', degrees: [1, 6, 2, 1], suggestedBpm: 94 },
  { id: 'lydian-cinematic', name: 'Lídio Cinemático', mode: 'lydian', degrees: [1, 2, 5, 1], suggestedBpm: 82 },
  { id: 'lydian-float', name: 'Lídio Suspenso', mode: 'lydian', degrees: [1, 7, 2, 1], suggestedBpm: 76 },
  { id: 'mixolydian-rock', name: 'Mixolídio Rock', mode: 'mixolydian', degrees: [1, 7, 4, 1], suggestedBpm: 110 },
  { id: 'mixolydian-funk', name: 'Mixolídio Funk', mode: 'mixolydian', degrees: [1, 4, 1, 7], suggestedBpm: 102 },
  { id: 'aeolian-melancholic', name: 'Eólio Melancólico', mode: 'aeolian', degrees: [1, 6, 7, 1], suggestedBpm: 84 },
  { id: 'aeolian-epic', name: 'Eólio Épico', mode: 'aeolian', degrees: [1, 7, 6, 4], suggestedBpm: 92 },
  { id: 'locrian-unstable', name: 'Lócrio Instável', mode: 'locrian', degrees: [1, 2, 5, 1], suggestedBpm: 88 },
  { id: 'locrian-tension', name: 'Lócrio Tensão', mode: 'locrian', degrees: [1, 7, 4, 1], suggestedBpm: 96 },
]

const BACKING_STYLES = [
  {
    id: 'pop-rock',
    name: 'Pop Rock Realista',
    swing: 0.04,
    humanizeMs: 10,
    kickSteps: [0, 8, 10],
    snareSteps: [4, 12],
    hatEvery: 2,
    bassSteps: [0, 8],
    chordSteps: [0, 8, 12],
  },
  {
    id: 'blues-shuffle',
    name: 'Blues Shuffle',
    swing: 0.1,
    humanizeMs: 14,
    kickSteps: [0, 6, 8, 14],
    snareSteps: [4, 12],
    hatEvery: 2,
    bassSteps: [0, 6, 8, 14],
    chordSteps: [0, 8],
  },
  {
    id: 'ballad',
    name: 'Balada Clean',
    swing: 0.02,
    humanizeMs: 8,
    kickSteps: [0, 8],
    snareSteps: [12],
    hatEvery: 4,
    bassSteps: [0, 8],
    chordSteps: [0, 4, 8, 12],
  },
]

function createNoiseBuffer(ctx) {
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2) - 1
  }
  return noiseBuffer
}

function createImpulseResponse(ctx, seconds = 1.2) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      const decay = (1 - (i / length)) ** 2.8
      data[i] = ((Math.random() * 2) - 1) * decay
    }
  }

  return impulse
}

function createSaturationCurve(amount = 3) {
  const samples = 4096
  const curve = new Float32Array(samples)
  const k = amount

  for (let i = 0; i < samples; i += 1) {
    const x = ((i * 2) / samples) - 1
    curve[i] = ((1 + k) * x) / (1 + (k * Math.abs(x)))
  }

  return curve
}

function getChordRootFrequency(note) {
  const noteIndex = CHROMATIC.indexOf(note)
  if (noteIndex < 0) {
    return 110
  }
  const midi = 36 + noteIndex
  return A4ToFrequency(midi)
}

function A4ToFrequency(midi) {
  return 440 * (2 ** ((midi - 69) / 12))
}

function getChordIntervals(chord) {
  if (chord.endsWith('dim')) {
    return [0, 3, 6]
  }
  if (chord.endsWith('m')) {
    return [0, 3, 7]
  }
  return [0, 4, 7]
}

function buildScale(tonic, mode) {
  const modeConfig = MODES[mode]
  const tonicIndex = CHROMATIC.indexOf(tonic)
  const seventhQualities = modeConfig.seventhQualities

  return modeConfig.intervals.map((interval, index) => {
    const note = CHROMATIC[(tonicIndex + interval) % 12]
    const quality = modeConfig.qualities[index]
    const roman = modeConfig.romans[index]
    const chord7 = seventhQualities[index]
    const guideNotes = getGuideNotesForChord(note, chord7, CHROMATIC)

    return {
      degree: index + 1,
      note,
      chord: `${note}${quality}`,
      roman,
      guideNotes: {
        third: guideNotes.third,
        seventh: guideNotes.seventh,
      },
    }
  })
}

function pickRandomPattern(mode) {
  const options = PATTERNS.filter((pattern) => pattern.mode === mode)
  return options[Math.floor(Math.random() * options.length)]
}

function Progressions() {
  const navigate = useNavigate()
  const [tonic, setTonic] = useState('C')
  const [mode, setMode] = useState('major')
  const [selectedPattern, setSelectedPattern] = useState(() => pickRandomPattern('major'))
  const [copyStatus, setCopyStatus] = useState('')
  const [showGuideNotes, setShowGuideNotes] = useState(false)
  const [backingStyleId, setBackingStyleId] = useState('pop-rock')
  const [backingBpm, setBackingBpm] = useState(92)
  const [backingVolume, setBackingVolume] = useState(65)
  const [isBackingPlaying, setIsBackingPlaying] = useState(false)

  const audioCtxRef = useRef(null)
  const noiseBufferRef = useRef(null)
  const audioBusRef = useRef(null)
  const schedulerRef = useRef(null)
  const nextStepTimeRef = useRef(0)
  const stepRef = useRef(0)
  const progressionRef = useRef([])
  const backingVolumeRef = useRef(65)
  const backingBpmRef = useRef(92)
  const backingStyleRef = useRef(BACKING_STYLES[0])

  const availablePatterns = useMemo(() => {
    return PATTERNS.filter((pattern) => pattern.mode === mode)
  }, [mode])

  const scale = useMemo(() => {
    return buildScale(tonic, mode)
  }, [tonic, mode])

  const progression = useMemo(() => {
    return selectedPattern.degrees.map((degree) => scale[degree - 1])
  }, [selectedPattern, scale])

  const progressionText = progression.map((item) => item.chord).join(' - ')
  const progressionDegrees = progression.map((item) => item.roman).join(' - ')

  const selectedBackingStyle = useMemo(() => {
    return BACKING_STYLES.find((style) => style.id === backingStyleId) || BACKING_STYLES[0]
  }, [backingStyleId])

  useEffect(() => {
    progressionRef.current = progression
  }, [progression])

  useEffect(() => {
    backingVolumeRef.current = backingVolume
  }, [backingVolume])

  useEffect(() => {
    backingBpmRef.current = backingBpm
  }, [backingBpm])

  useEffect(() => {
    backingStyleRef.current = selectedBackingStyle
  }, [selectedBackingStyle])

  useEffect(() => {
    setBackingBpm(selectedPattern.suggestedBpm)
  }, [selectedPattern.id, selectedPattern.suggestedBpm])

  const handleModeChange = (event) => {
    const nextMode = event.target.value
    setMode(nextMode)
    setSelectedPattern(pickRandomPattern(nextMode))
  }

  const handlePatternChange = (event) => {
    const pattern = availablePatterns.find((item) => item.id === event.target.value)
    if (pattern) {
      setSelectedPattern(pattern)
    }
  }

  const handleRandom = () => {
    setSelectedPattern(pickRandomPattern(mode))
    setCopyStatus('')
  }

  const handleCopyProgression = async () => {
    const text = `${tonic} ${MODES[mode].label} | ${selectedPattern.name} | Graus: ${progressionDegrees} | Acordes: ${progressionText}`
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Progressão copiada!')
    } catch {
      setCopyStatus('Não foi possível copiar automaticamente.')
    }
  }

  const handleOpenMetronome = () => {
    const params = new URLSearchParams({
      bpm: String(selectedPattern.suggestedBpm),
    })
    navigate(`/metronomo?${params.toString()}`)
  }

  const stopBackingTrack = useCallback(() => {
    if (schedulerRef.current) {
      window.clearInterval(schedulerRef.current)
      schedulerRef.current = null
    }
    setIsBackingPlaying(false)
  }, [])

  const ensureAudioContext = useCallback(async () => {
    const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    if (!noiseBufferRef.current) {
      noiseBufferRef.current = createNoiseBuffer(ctx)
    }

    if (!audioBusRef.current) {
      const drumBus = ctx.createGain()
      const musicBus = ctx.createGain()
      const sumBus = ctx.createGain()
      const compressor = ctx.createDynamicsCompressor()
      const saturator = ctx.createWaveShaper()
      const convolver = ctx.createConvolver()
      const dryGain = ctx.createGain()
      const reverbGain = ctx.createGain()
      const masterGain = ctx.createGain()

      drumBus.gain.value = 0.88
      musicBus.gain.value = 0.84
      sumBus.gain.value = 1

      compressor.threshold.value = -16
      compressor.knee.value = 24
      compressor.ratio.value = 2.4
      compressor.attack.value = 0.003
      compressor.release.value = 0.2

      saturator.curve = createSaturationCurve(2.8)
      saturator.oversample = '2x'

      convolver.buffer = createImpulseResponse(ctx, 1.1)
      dryGain.gain.value = 0.88
      reverbGain.gain.value = 0.17
      masterGain.gain.value = 0.9

      drumBus.connect(sumBus)
      musicBus.connect(sumBus)
      sumBus.connect(compressor)
      compressor.connect(saturator)
      saturator.connect(dryGain)
      saturator.connect(convolver)
      convolver.connect(reverbGain)
      dryGain.connect(masterGain)
      reverbGain.connect(masterGain)
      masterGain.connect(ctx.destination)

      audioBusRef.current = {
        drumBus,
        musicBus,
      }
    }

    return ctx
  }, [])

  const playKick = (ctx, time, velocity, volumeGain) => {
    if (!audioBusRef.current) {
      return
    }

    const bodyOsc = ctx.createOscillator()
    const bodyGain = ctx.createGain()
    const clickOsc = ctx.createOscillator()
    const clickGain = ctx.createGain()

    bodyOsc.type = 'sine'
    bodyOsc.frequency.setValueAtTime(140, time)
    bodyOsc.frequency.exponentialRampToValueAtTime(46, time + 0.12)

    bodyGain.gain.setValueAtTime(0.0001, time)
    bodyGain.gain.exponentialRampToValueAtTime(0.95 * velocity * volumeGain, time + 0.006)
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)

    clickOsc.type = 'triangle'
    clickOsc.frequency.setValueAtTime(980, time)
    clickOsc.frequency.exponentialRampToValueAtTime(200, time + 0.02)
    clickGain.gain.setValueAtTime(0.0001, time)
    clickGain.gain.exponentialRampToValueAtTime(0.18 * velocity * volumeGain, time + 0.001)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02)

    bodyOsc.connect(bodyGain)
    clickOsc.connect(clickGain)
    bodyGain.connect(audioBusRef.current.drumBus)
    clickGain.connect(audioBusRef.current.drumBus)

    bodyOsc.start(time)
    bodyOsc.stop(time + 0.2)
    clickOsc.start(time)
    clickOsc.stop(time + 0.03)
  }

  const playSnare = (ctx, time, velocity, volumeGain) => {
    if (!noiseBufferRef.current || !audioBusRef.current) {
      return
    }

    const noise = ctx.createBufferSource()
    noise.buffer = noiseBufferRef.current

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 1900
    noiseFilter.Q.value = 0.7

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.0001, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.38 * velocity * volumeGain, time + 0.003)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11)

    const toneOsc = ctx.createOscillator()
    const toneGain = ctx.createGain()
    toneOsc.type = 'triangle'
    toneOsc.frequency.setValueAtTime(210, time)
    toneOsc.frequency.exponentialRampToValueAtTime(120, time + 0.06)
    toneGain.gain.setValueAtTime(0.0001, time)
    toneGain.gain.exponentialRampToValueAtTime(0.14 * velocity * volumeGain, time + 0.004)
    toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(audioBusRef.current.drumBus)

    toneOsc.connect(toneGain)
    toneGain.connect(audioBusRef.current.drumBus)

    noise.start(time)
    noise.stop(time + 0.12)
    toneOsc.start(time)
    toneOsc.stop(time + 0.11)
  }

  const playHiHat = (ctx, time, velocity, volumeGain) => {
    if (!noiseBufferRef.current || !audioBusRef.current) {
      return
    }

    const noise = ctx.createBufferSource()
    noise.buffer = noiseBufferRef.current

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 7000
    filter.Q.value = 1.6

    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 5200

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.12 * velocity * volumeGain, time + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035)

    noise.connect(filter)
    filter.connect(hp)
    hp.connect(gain)
    gain.connect(audioBusRef.current.drumBus)
    noise.start(time)
    noise.stop(time + 0.05)
  }

  const playBass = (ctx, frequency, time, velocity, volumeGain) => {
    if (!audioBusRef.current) {
      return
    }

    const osc = ctx.createOscillator()
    const subOsc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    subOsc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, time)
    subOsc.frequency.setValueAtTime(frequency / 2, time)

    filter.type = 'lowpass'
    filter.frequency.value = 700
    filter.Q.value = 1.5

    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.22 * velocity * volumeGain, time + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24)

    osc.connect(filter)
    subOsc.connect(filter)
    filter.connect(gain)
    gain.connect(audioBusRef.current.musicBus)

    osc.start(time)
    osc.stop(time + 0.28)
    subOsc.start(time)
    subOsc.stop(time + 0.28)
  }

  const playChordStab = (ctx, chord, time, velocity, volumeGain) => {
    if (!audioBusRef.current) {
      return
    }

    const rootFrequency = getChordRootFrequency(chord.note)
    const intervals = getChordIntervals(chord.chord)

    intervals.forEach((semitones, index) => {
      const noteTime = time + (index * 0.007)
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc2.type = 'sine'

      const chordFrequency = rootFrequency * (2 ** (semitones / 12))
      osc.frequency.setValueAtTime(chordFrequency, noteTime)
      osc2.frequency.setValueAtTime(chordFrequency * 2, noteTime)

      filter.type = 'lowpass'
      filter.frequency.value = 1700
      filter.Q.value = 0.9

      gain.gain.setValueAtTime(0.0001, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.09 * velocity * volumeGain, noteTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.52)

      osc.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(audioBusRef.current.musicBus)

      osc.start(noteTime)
      osc.stop(noteTime + 0.55)
      osc2.start(noteTime)
      osc2.stop(noteTime + 0.42)
    })
  }

  const startBackingTrack = useCallback(async () => {
    if (schedulerRef.current || progressionRef.current.length === 0) {
      return
    }

    const ctx = await ensureAudioContext()
    const stepsPerBar = 16
    const scheduleAhead = 0.12
    const lookAheadMs = 25

    nextStepTimeRef.current = ctx.currentTime + 0.06
    stepRef.current = 0

    schedulerRef.current = window.setInterval(() => {
      while (nextStepTimeRef.current < ctx.currentTime + scheduleAhead) {
        const currentProgression = progressionRef.current
        if (currentProgression.length === 0) {
          nextStepTimeRef.current += 0.05
          continue
        }

        const style = backingStyleRef.current
        const currentBpm = Math.max(50, backingBpmRef.current)
        const volumeGain = Math.max(0, Math.min(1, backingVolumeRef.current / 100))

        const step = stepRef.current
        const barIndex = Math.floor(step / stepsPerBar) % currentProgression.length
        const stepInBar = step % stepsPerBar
        const chord = currentProgression[barIndex]
        const sixteenth = 60 / currentBpm / 4
        const swingDelay = stepInBar % 2 === 1 ? sixteenth * style.swing : 0
        const humanize = ((Math.random() * 2) - 1) * (style.humanizeMs / 1000)
        const eventTime = Math.max(ctx.currentTime + 0.001, nextStepTimeRef.current + swingDelay + humanize)

        if (style.hatEvery > 0 && stepInBar % style.hatEvery === 0) {
          playHiHat(ctx, eventTime, stepInBar % 4 === 0 ? 0.95 : 0.7, volumeGain)
        }

        if (style.kickSteps.includes(stepInBar)) {
          playKick(ctx, eventTime, stepInBar === 0 ? 1 : 0.85, volumeGain)
        }

        if (style.snareSteps.includes(stepInBar)) {
          playSnare(ctx, eventTime, 0.9, volumeGain)
        }

        if (stepInBar === 15 && Math.random() > 0.55) {
          playSnare(ctx, eventTime + 0.012, 0.36, volumeGain)
        }

        if (style.bassSteps.includes(stepInBar)) {
          const rootFrequency = getChordRootFrequency(chord.note)
          const fifthFrequency = rootFrequency * (2 ** (7 / 12))
          const bassFrequency = stepInBar % 8 === 0 ? rootFrequency : fifthFrequency
          playBass(ctx, bassFrequency, eventTime, 0.95, volumeGain)
        }

        if (style.chordSteps.includes(stepInBar)) {
          playChordStab(ctx, chord, eventTime, stepInBar === 0 ? 1 : 0.78, volumeGain)
        }

        nextStepTimeRef.current += sixteenth
        stepRef.current += 1
      }
    }, lookAheadMs)

    setIsBackingPlaying(true)
  }, [ensureAudioContext])

  const toggleBackingTrack = useCallback(() => {
    if (isBackingPlaying) {
      stopBackingTrack()
      return
    }
    startBackingTrack()
  }, [isBackingPlaying, startBackingTrack, stopBackingTrack])

  useEffect(() => {
    return () => {
      stopBackingTrack()
    }
  }, [stopBackingTrack])

  return (
    <div className="prog-page">
      <header className="prog-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Início
        </button>
        <h1>🎼 Progressões Harmônicas</h1>
        <p className="prog-subtitle">Monte e estude sequências de acordes para prática</p>
      </header>

      <section className="prog-controls">
        <label className="prog-control">
          <span>Tonalidade</span>
          <select value={tonic} onChange={(event) => setTonic(event.target.value)}>
            {CHROMATIC.map((note) => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </label>

        <label className="prog-control">
          <span>Modo</span>
          <select value={mode} onChange={handleModeChange}>
            {MODE_ORDER.map((modeId) => (
              <option key={modeId} value={modeId}>{MODES[modeId].label}</option>
            ))}
          </select>
        </label>

        <label className="prog-control">
          <span>Modelo</span>
          <select value={selectedPattern.id} onChange={handlePatternChange}>
            {availablePatterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>{pattern.name}</option>
            ))}
          </select>
        </label>

        <button className="prog-random" onClick={handleRandom}>Gerar aleatória</button>
      </section>

      <section className="prog-extra-options">
        <label className="prog-guide-toggle">
          <input
            type="checkbox"
            checked={showGuideNotes}
            onChange={(event) => setShowGuideNotes(event.target.checked)}
          />
          <span>Mostrar notas guia (3ª e 7ª) de cada acorde</span>
        </label>
      </section>

      <section className="prog-result">
        <div className="prog-box">
          <h2>{selectedPattern.name}</h2>
          <p className="prog-degrees">{progressionDegrees}</p>
          <p className="prog-chords">{progressionText}</p>
          <p className="prog-bpm">BPM sugerido: {selectedPattern.suggestedBpm}</p>

          <div className="prog-actions">
            <button className="prog-action-btn copy" onClick={handleCopyProgression}>
              Copiar progressão
            </button>
            <button className="prog-action-btn met" onClick={handleOpenMetronome}>
              Praticar no metrônomo
            </button>
            <button className={`prog-action-btn backing ${isBackingPlaying ? 'active' : ''}`} onClick={toggleBackingTrack}>
              {isBackingPlaying ? 'Parar backing track' : 'Tocar backing track'}
            </button>
          </div>

          <div className="prog-backing-panel">
            <h3>Backing track realista</h3>

            <div className="prog-backing-controls">
              <label className="prog-backing-field">
                <span>Estilo</span>
                <select value={backingStyleId} onChange={(event) => setBackingStyleId(event.target.value)}>
                  {BACKING_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
              </label>

              <label className="prog-backing-field">
                <span>BPM</span>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={backingBpm}
                  onChange={(event) => setBackingBpm(Number(event.target.value))}
                />
                <strong>{backingBpm}</strong>
              </label>

              <label className="prog-backing-field">
                <span>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={backingVolume}
                  onChange={(event) => setBackingVolume(Number(event.target.value))}
                />
                <strong>{backingVolume}%</strong>
              </label>
            </div>

            <p className="prog-backing-hint">
              Mudanças de estilo, BPM e volume são aplicadas em tempo real durante a reprodução.
            </p>
          </div>

          {copyStatus && <p className="prog-copy-status">{copyStatus}</p>}
        </div>

        <div className="prog-cards">
          {progression.map((item, index) => (
            <article className="prog-card" key={`${item.degree}-${index}`}>
              <span className="prog-card-degree">{item.roman}</span>
              <strong className="prog-card-chord">{item.chord}</strong>
              <small className="prog-card-note">Grau {item.degree}</small>

              {showGuideNotes && (
                <div className="prog-guide-notes">
                  <span className="guide third">3ª: {item.guideNotes.third}</span>
                  <span className="guide seventh">7ª: {item.guideNotes.seventh}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Progressions
