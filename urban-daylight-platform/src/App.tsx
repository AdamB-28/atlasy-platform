import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CityPage from './pages/CityPage'
import ComparePage from './pages/ComparePage'
import PasswordGate from './components/PasswordGate'

function App() {
  return (
    <PasswordGate>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/city/:cityId" element={<CityPage />} />
        <Route path="/compare/:cityAId/:cityBId" element={<ComparePage />} />
      </Routes>
    </PasswordGate>
  )
}

export default App
