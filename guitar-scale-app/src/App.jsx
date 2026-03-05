import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Scales from './pages/Scales'
import CircleOfFifths from './pages/CircleOfFifths'
import HarmonicField from './pages/HarmonicField'
import Metronome from './pages/Metronome'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/escalas" element={<Scales />} />
      <Route path="/ciclo-das-quintas" element={<CircleOfFifths />} />
      <Route path="/campo-harmonico" element={<HarmonicField />} />
      <Route path="/metronomo" element={<Metronome />} />
    </Routes>
  )
}

export default App
