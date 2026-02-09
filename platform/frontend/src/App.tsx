import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import './App.css'

const LazyFallback = <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
const SettingsLayout = lazy(() => import('./pages/SettingsLayout'))
const SitesPage = lazy(() => import('./pages/SitesPage'))
const SuggestionsPage = lazy(() => import('./pages/SuggestionsPage'))
const AdminChurnPage = lazy(() => import('./pages/AdminChurnPage'))
const SuggestionDetailPage = lazy(() => import('./pages/SuggestionDetailPage'))
const AdminSuggestionPage = lazy(() => import('./pages/admin/SuggestionManagement'))
const A2APage = lazy(() => import('./pages/A2APage'))
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'))
const ProjectHealthPage = lazy(() => import('./pages/ProjectHealthPage'))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/sites" element={<Suspense fallback={LazyFallback}><SitesPage /></Suspense>} />
            <Route path="/suggestions" element={<Suspense fallback={LazyFallback}><SuggestionsPage /></Suspense>} />
            <Route path="/suggestions/:id" element={<Suspense fallback={LazyFallback}><SuggestionDetailPage /></Suspense>} />
            <Route path="/admin/churn" element={<Suspense fallback={LazyFallback}><AdminChurnPage /></Suspense>} />
            <Route path="/admin/suggestions" element={<Suspense fallback={LazyFallback}><AdminSuggestionPage /></Suspense>} />
            <Route path="/a2a" element={<Suspense fallback={LazyFallback}><A2APage /></Suspense>} />
            <Route path="/recommendations" element={<Suspense fallback={LazyFallback}><RecommendationsPage /></Suspense>} />
            <Route path="/project-health" element={<Suspense fallback={LazyFallback}><ProjectHealthPage /></Suspense>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
