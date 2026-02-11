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
const TeamPage = lazy(() => import('./pages/TeamPage'))
const MicroservicesPage = lazy(() => import('./pages/MicroservicesPage'))
const WhiteLabelPage = lazy(() => import('./pages/WhiteLabelPage'))
const GrowthDashboardPage = lazy(() => import('./pages/GrowthDashboardPage'))
const PreviewPage = lazy(() => import('./pages/PreviewPage'))
const CompliancePage = lazy(() => import('./pages/CompliancePage'))
const InfrastructurePage = lazy(() => import('./pages/InfrastructurePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/specifications" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/github-sync" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/code-review" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/streaming-generation" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/billing" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/mcp-integration" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/analytics" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/marketplace" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/containerization" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/test-generation" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/collaborative-editing" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/onboarding" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/version-history" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/component-preview" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/settings/variant-comparison" element={<Suspense fallback={LazyFallback}><SettingsLayout /></Suspense>} />
            <Route path="/sites" element={<Suspense fallback={LazyFallback}><SitesPage /></Suspense>} />
            <Route path="/suggestions" element={<Suspense fallback={LazyFallback}><SuggestionsPage /></Suspense>} />
            <Route path="/suggestions/:id" element={<Suspense fallback={LazyFallback}><SuggestionDetailPage /></Suspense>} />
            <Route path="/admin/churn" element={<Suspense fallback={LazyFallback}><AdminChurnPage /></Suspense>} />
            <Route path="/admin/suggestions" element={<Suspense fallback={LazyFallback}><AdminSuggestionPage /></Suspense>} />
            <Route path="/a2a" element={<Suspense fallback={LazyFallback}><A2APage /></Suspense>} />
            <Route path="/recommendations" element={<Suspense fallback={LazyFallback}><RecommendationsPage /></Suspense>} />
            <Route path="/project-health" element={<Suspense fallback={LazyFallback}><ProjectHealthPage /></Suspense>} />
            <Route path="/teams" element={<Suspense fallback={LazyFallback}><TeamPage /></Suspense>} />
            <Route path="/microservices" element={<Suspense fallback={LazyFallback}><MicroservicesPage /></Suspense>} />
            <Route path="/whitelabel" element={<Suspense fallback={LazyFallback}><WhiteLabelPage /></Suspense>} />
            <Route path="/admin/growth" element={<Suspense fallback={LazyFallback}><GrowthDashboardPage /></Suspense>} />
            <Route path="/preview" element={<Suspense fallback={LazyFallback}><PreviewPage /></Suspense>} />
            <Route path="/compliance" element={<Suspense fallback={LazyFallback}><CompliancePage /></Suspense>} />
            <Route path="/infrastructure" element={<Suspense fallback={LazyFallback}><InfrastructurePage /></Suspense>} />
            <Route path="/auth/callback/:provider" element={<div className="flex items-center justify-center py-24"><div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div>} />
            <Route path="*" element={<Suspense fallback={LazyFallback}><NotFoundPage /></Suspense>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
