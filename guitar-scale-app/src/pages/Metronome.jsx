import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MetronomeWidget from '../components/MetronomeWidget'
import './Metronome.css'

const MIN_BPM = 20
const MAX_BPM = 300

function Metronome() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialBpm = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const bpmFromUrl = Number(params.get('bpm'))

    if (Number.isFinite(bpmFromUrl) && bpmFromUrl >= MIN_BPM && bpmFromUrl <= MAX_BPM) {
      return bpmFromUrl
    }
    return 120
  }, [location.search])

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

      <MetronomeWidget initialBpm={initialBpm} />
    </div>
  )
}

export default Metronome
