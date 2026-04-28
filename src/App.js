import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import PlayersPage from './pages/PlayersPage'
import EventsPage from './pages/EventsPage'
import AttendancePage from './pages/AttendancePage'
import StatsPage from './pages/StatsPage'
import HomeworkPage from './pages/HomeworkPage'
import FinancePage from './pages/FinancePage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>â½</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>TEAM APP</div>
        <div style={{ fontSize: 13, opacity: 0.5, marginTop: 8 }}>NaÄÃ­tÃ¡m...</div>
      </div>
    </div>
  )

  if (!user) return <LoginPage />

  const pages = {
    dashboard: <Dashboard setPage={setPage} />,
    players: <PlayersPage />,
    events: <EventsPage />,
    attendance: <AttendancePage />,
    stats: <StatsPage />,
    homework: <HomeworkPage />,
    finance: <FinancePage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9', overflow: 'hidden' }}>
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header page={page} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {pages[page] || <Dashboard setPage={setPage} />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}
