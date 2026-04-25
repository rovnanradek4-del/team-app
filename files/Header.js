import React from 'react'
import { useApp } from '../contexts/AppContext'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  players: 'Hráči & Soupiska',
  events: 'Kalendář & Akce',
  attendance: 'Docházka',
  stats: 'Statistiky',
  homework: 'Domácí úkoly',
  finance: 'Finance',
  reports: 'Reporty',
  settings: 'Nastavení',
}

export default function Header({ page, sidebarOpen, setSidebarOpen }) {
  const { club, season, team } = useApp()

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4 }}>
        ☰
      </button>

      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#0f172a' }}>{PAGE_TITLES[page] || page}</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {team && (
          <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
            {team.name}
          </div>
        )}
        {season && (
          <div style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
            {season.name}
          </div>
        )}
      </div>
    </header>
  )
}
