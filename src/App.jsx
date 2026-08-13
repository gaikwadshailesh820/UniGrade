import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SGPA from './pages/SGPA'
import FixedGrading from './pages/FixedGrading'
import RelativeGrading from './pages/RelativeGrading'
import GradingSystems from './pages/GradingSystems'
import './App.css'

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sgpa" element={<SGPA />} />
        <Route path="/fixed-grading" element={<FixedGrading />} />
        <Route path="/relative-grading" element={<RelativeGrading />} />
        <Route path="/grading-systems" element={<GradingSystems />} />
      </Routes>
    </>
  )
}

export default App