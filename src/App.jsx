import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
import Home from './pages/Home'
import SGPA from './pages/SGPA'
import FixedGrading from './pages/FixedGrading'
import GradingSystems from './pages/GradingSystems'
import EvaluationSchemes from './pages/EvaluationSchemes'
import FacultyLogin from './pages/FacultyLogin'
import FacultyRegister from './pages/FacultyRegister'
import FacultyForgot from './pages/FacultyForgot'
import InstitutionLogin from './pages/InstitutionLogin'
import InstitutionRegister from './pages/InstitutionRegister'
import InstitutionForgot from './pages/InstitutionForgot'

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import UploadExcel from './pages/faculty/UploadExcel'
import StudentRecords from './pages/faculty/StudentRecords'
import FacultyRelativeGrading from './pages/faculty/RelativeGrading'
import FacultyProfile from './pages/faculty/FacultyProfile'

// Institution Pages
import InstitutionDashboard from './pages/institution/InstitutionDashboard'
import InstitutionRecords from './pages/institution/InstitutionRecords'
import GenerateSGPA from './pages/institution/GenerateSGPA'
import ViewSGPA from './pages/institution/ViewSGPA'
import InstitutionProfile from './pages/institution/InstitutionProfile'

import './App.css'

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/sgpa" element={<SGPA />} />
        <Route path="/fixed-grading" element={<FixedGrading />} />
        <Route path="/relative-grading" element={<FacultyRelativeGrading />} />
        <Route path="/grading-systems" element={<GradingSystems />} />
        <Route path="/evaluation-schemes" element={<EvaluationSchemes />} />
        
        {/* Auth Routes */}
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/FacultyLogin" element={<Navigate to="/faculty-login" replace />} />
        <Route path="/faculty-register" element={<FacultyRegister />} />
        <Route path="/faculty-forgot" element={<FacultyForgot />} />
        
        <Route path="/institution-login" element={<InstitutionLogin />} />
        <Route path="/InstitutionLogin" element={<Navigate to="/institution-login" replace />} />
        <Route path="/institution-register" element={<InstitutionRegister />} />
        <Route path="/institution-forgot" element={<InstitutionForgot />} />

        {/* Protected Faculty Routes */}
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-excel"
          element={
            <ProtectedRoute allowedRole="faculty">
              <UploadExcel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-records"
          element={
            <ProtectedRoute allowedRole="faculty">
              <StudentRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty-profile"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyProfile />
            </ProtectedRoute>
          }
        />

        {/* Protected Institution Routes */}
        <Route
          path="/institution-dashboard"
          element={
            <ProtectedRoute allowedRole="institution">
              <InstitutionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution-records"
          element={
            <ProtectedRoute allowedRole="institution">
              <InstitutionRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution-sgpa"
          element={
            <ProtectedRoute allowedRole="institution">
              <GenerateSGPA />
            </ProtectedRoute>
          }
        />
        <Route
          path="/view-sgpa"
          element={
            <ProtectedRoute allowedRole="institution">
              <ViewSGPA />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution-profile"
          element={
            <ProtectedRoute allowedRole="institution">
              <InstitutionProfile />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App