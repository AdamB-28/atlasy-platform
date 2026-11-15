import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CityPage from './pages/CityPage'
import ComparePage from './pages/ComparePage'
import AdminModeProvider from './components/AdminModeProvider'

function App() {
  return (
    <AdminModeProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/city/:cityId" element={<CityPage />} />
        <Route path="/compare/:cityAId/:cityBId" element={<ComparePage />} />
        <Route path="/compare/:cityId" element={<ComparePage />} />
      </Routes>
    </AdminModeProvider>
  )
}

export default App
