import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SettingsLayout from './pages/SettingsLayout'
import SitesPage from './pages/SitesPage'
import SuggestionsPage from './pages/SuggestionsPage'
import AdminChurnPage from './pages/AdminChurnPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsLayout />} />
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/admin/churn" element={<AdminChurnPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
