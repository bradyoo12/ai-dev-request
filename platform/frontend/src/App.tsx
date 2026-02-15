import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

const LazyFallback = <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" /></div>
const HomePage = lazy(() => import('./pages/HomePage'))
const SettingsLayout = lazy(() => import('./pages/SettingsLayout'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
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
const BuyCreditsPage = lazy(() => import('./pages/BuyCreditsPage'))
const SupportBoardPage = lazy(() => import('./pages/SupportBoardPage'))
// const SubagentOrchestrationPage = lazy(() => import('./pages/SubagentOrchestrationPage'))
const IterativeRefinementPage = lazy(() => import('./pages/IterativeRefinementPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const TicketProgressPage = lazy(() => import('./pages/TicketProgressPage'))
const SubtasksPage = lazy(() => import('./pages/SubtasksPage'))
const PatentsPage = lazy(() => import('./pages/PatentsPage'))
const LiveGenerationPage = lazy(() => import('./pages/LiveGenerationPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/**
 * AppRoutes contains all route definitions without a router wrapper.
 * This is exported separately so that both the client (BrowserRouter)
 * and server (StaticRouter) entry points can share the same route tree.
 */
export function AppRoutes() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <AuthProvider>
      <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Suspense fallback={LazyFallback}><HomePage /></Suspense>} />
            <Route path="/settings" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/specifications" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/github-sync" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/code-review" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/streaming-generation" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/billing" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/mcp-integration" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/analytics" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/marketplace" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/containerization" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/test-generation" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/collaborative-editing" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/onboarding" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/version-history" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/component-preview" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/variant-comparison" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/arena" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/performance" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/schema-designer" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/ai-elements" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/review-pipeline" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/oauth-connectors" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/observability" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/compiler-validation" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/self-healing-test" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/multi-agent-test" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/database-branching" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/sandbox" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-automation" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/usage-dashboard" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/ai-model" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><Suspense fallback={LazyFallback}><TicketProgressPage /></Suspense></ProtectedRoute>} />
            <Route path="/projects" element={<Suspense fallback={LazyFallback}><ProjectsPage /></Suspense>} />
            <Route path="/projects/:id" element={<Suspense fallback={LazyFallback}><ProjectDetailPage /></Suspense>} />
            <Route path="/projects/:projectId/subtasks" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SubtasksPage /></Suspense></ProtectedRoute>} />
            <Route path="/sites" element={<Suspense fallback={LazyFallback}><SitesPage /></Suspense>} />
            <Route path="/my-sites" element={<Navigate to="/sites" replace />} />
            <Route path="/suggestions" element={<Suspense fallback={LazyFallback}><SuggestionsPage /></Suspense>} />
            <Route path="/suggestions/:id" element={<Suspense fallback={LazyFallback}><SuggestionDetailPage /></Suspense>} />
            <Route path="/admin/churn" element={<ProtectedRoute requireAdmin><Suspense fallback={LazyFallback}><AdminChurnPage /></Suspense></ProtectedRoute>} />
            <Route path="/admin/suggestions" element={<ProtectedRoute requireAdmin><Suspense fallback={LazyFallback}><AdminSuggestionPage /></Suspense></ProtectedRoute>} />
            <Route path="/a2a" element={<ProtectedRoute requireAdmin><Suspense fallback={LazyFallback}><A2APage /></Suspense></ProtectedRoute>} />
            <Route path="/recommendations" element={<Suspense fallback={LazyFallback}><RecommendationsPage /></Suspense>} />
            <Route path="/project-health" element={<Suspense fallback={LazyFallback}><ProjectHealthPage /></Suspense>} />
            <Route path="/teams" element={<Suspense fallback={LazyFallback}><TeamPage /></Suspense>} />
            <Route path="/microservices" element={<Suspense fallback={LazyFallback}><MicroservicesPage /></Suspense>} />
            <Route path="/whitelabel" element={<Suspense fallback={LazyFallback}><WhiteLabelPage /></Suspense>} />
            <Route path="/admin/growth" element={<Suspense fallback={LazyFallback}><GrowthDashboardPage /></Suspense>} />
            <Route path="/preview" element={<Suspense fallback={LazyFallback}><PreviewPage /></Suspense>} />
            <Route path="/compliance" element={<ProtectedRoute><Suspense fallback={LazyFallback}><CompliancePage /></Suspense></ProtectedRoute>} />
            <Route path="/infrastructure" element={<ProtectedRoute><Suspense fallback={LazyFallback}><InfrastructurePage /></Suspense></ProtectedRoute>} />
            <Route path="/buy-credits" element={<Suspense fallback={LazyFallback}><BuyCreditsPage /></Suspense>} />
            <Route path="/templates" element={<Suspense fallback={LazyFallback}><TemplatesPage /></Suspense>} />
            <Route path="/support" element={<Suspense fallback={LazyFallback}><SupportBoardPage /></Suspense>} />
            <Route path="/patents" element={<Suspense fallback={LazyFallback}><PatentsPage /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={LazyFallback}><TermsPage /></Suspense>} />
            <Route path="/privacy" element={<Suspense fallback={LazyFallback}><PrivacyPage /></Suspense>} />
            <Route path="/faq" element={<Suspense fallback={LazyFallback}><FaqPage /></Suspense>} />
            <Route path="/requests/:id/refine" element={<Suspense fallback={LazyFallback}><IterativeRefinementPage /></Suspense>} />
            <Route path="/live-generation/:requestId" element={<ProtectedRoute><Suspense fallback={LazyFallback}><LiveGenerationPage /></Suspense></ProtectedRoute>} />
            <Route path="/settings/orchestration" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/langgraph" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/hybrid-cache" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/playwright-healing" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/self-healing-code" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/production-sandboxes" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/org-memory" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/background-agents" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-rules" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/server-components" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/code-lint" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/vector-search" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/repl-test" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-terminal" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/composer" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/dotnet-perf" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/multi-model" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/biome-lint" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/deepwiki" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/build-toolchain" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/vision-to-code" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/dotnet10-upgrade" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/parallel-agents" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/webmcp" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-sdk" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/auto-terminal" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/turso-database" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/workers-ai" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/react-use-hook" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/edit-predictions" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/browser-ide" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/governance" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/inference-cost" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/language-expansion" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/hybrid-validation" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-messages" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agentic-workflows" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-trace" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/confidence-scoring" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/ai-marketplace" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-skills" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-builder" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/agent-inbox" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/playwright-mcp" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/visual-workflow" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/patent-agent" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/streaming-codegen" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/settings/managed-backend" element={<ProtectedRoute><Suspense fallback={LazyFallback}><SettingsLayout /></Suspense></ProtectedRoute>} />
            <Route path="/auth/callback/:provider" element={<div className="flex items-center justify-center py-24"><div className="animate-spin w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full" /></div>} />
            <Route path="*" element={<Suspense fallback={LazyFallback}><NotFoundPage /></Suspense>} />
          </Route>
        </Routes>
      </AuthProvider>
  )
}

/**
 * App is the default export that wraps AppRoutes with BrowserRouter
 * and ErrorBoundary for client-side usage.
 * For SSR, use AppRoutes directly with StaticRouter instead.
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
