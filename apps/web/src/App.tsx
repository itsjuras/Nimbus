import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { OwnerLayout } from './components/layouts/OwnerLayout'
import { CrewLayout } from './components/layouts/CrewLayout'
import { DemoLayout } from './components/layouts/DemoLayout'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage'))

// Owner pages
const OwnerDashboard = lazy(() => import('./pages/owner/DashboardPage'))
const JobsPage = lazy(() => import('./pages/owner/JobsPage'))
const JobDetailPage = lazy(() => import('./pages/owner/JobDetailPage'))
const ClientsPage = lazy(() => import('./pages/owner/ClientsPage'))
const ClientDetailPage = lazy(() => import('./pages/owner/ClientDetailPage'))
const CrewPage = lazy(() => import('./pages/owner/CrewPage'))
const InvoicesPage = lazy(() => import('./pages/owner/InvoicesPage'))

// Crew pages
const CrewJobsPage = lazy(() => import('./pages/crew/JobsPage'))
const CrewChecklistPage = lazy(() => import('./pages/crew/ChecklistPage'))

// Demo pages
const DemoDashboard = lazy(() => import('./pages/demo/DashboardPage'))
const DemoJobsPage = lazy(() => import('./pages/demo/JobsPage'))
const DemoJobDetailPage = lazy(() => import('./pages/demo/JobDetailPage'))
const DemoClientsPage = lazy(() => import('./pages/demo/ClientsPage'))
const DemoClientDetailPage = lazy(() => import('./pages/demo/ClientDetailPage'))
const DemoCrewPage = lazy(() => import('./pages/demo/CrewPage'))
const DemoInvoicesPage = lazy(() => import('./pages/demo/InvoicesPage'))

const Spinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        {/* Owner routes */}
        <Route element={<ProtectedRoute allowedRoles={['owner', 'manager']} />}>
          <Route element={<OwnerLayout />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/jobs" element={<JobsPage />} />
            <Route path="/owner/jobs/:id" element={<JobDetailPage />} />
            <Route path="/owner/clients" element={<ClientsPage />} />
            <Route path="/owner/clients/:id" element={<ClientDetailPage />} />
            <Route path="/owner/crew" element={<CrewPage />} />
            <Route path="/owner/invoices" element={<InvoicesPage />} />
          </Route>
        </Route>

        {/* Crew routes */}
        <Route element={<ProtectedRoute allowedRoles={['crew', 'manager', 'owner']} />}>
          <Route element={<CrewLayout />}>
            <Route path="/crew/jobs" element={<CrewJobsPage />} />
            <Route path="/crew/jobs/:id" element={<CrewChecklistPage />} />
          </Route>
        </Route>

        {/* Demo routes — no auth required */}
        <Route element={<DemoLayout />}>
          <Route path="/demo" element={<DemoDashboard />} />
          <Route path="/demo/jobs" element={<DemoJobsPage />} />
          <Route path="/demo/jobs/:id" element={<DemoJobDetailPage />} />
          <Route path="/demo/clients" element={<DemoClientsPage />} />
          <Route path="/demo/clients/:id" element={<DemoClientDetailPage />} />
          <Route path="/demo/crew" element={<DemoCrewPage />} />
          <Route path="/demo/invoices" element={<DemoInvoicesPage />} />
        </Route>

        {/* Landing */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Suspense>
  )
}
