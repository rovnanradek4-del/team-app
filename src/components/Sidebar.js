import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'

const NAV_ITEMS = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'players', icon: '👥', label: 'Hráči' },
  { id: 'events', icon: '📅', label: 'Kalendář' },
  { id: 'attendance', icon: '✓', label: 'Docházka' },
  { id: 'stats', icon: '📊', label: 'Statistiky' },
  { id: 'homework', icon: '📝', label: 'Domácí úkoly' },
  { id: 'finance', icon: '💶', label: 'Finance' },
  { id: 'reports', icon: '📄', label: 'Reporty' },
  null, // divider
  { id: 'settings', icon: '⚙', label: 'Nastavení' },
]

export default function Sidebar({ page, setPage, open, setOpen }) {
  const { profile, signOut } = useAuth()
  const { club, season, team, teams, setTeam } = useApp()

  if (!open) return (
    <div style={{ width: 56, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 4 }}>
      {NAV_ITEMS.filter(Boolean).map(item => (
        <button key={item.id} onClick={() => setPage(item.id)} title={item.label} style={{
          width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer',
          background: page === item.id ? '#1e293b' : 'transparent',
          color: page === item.id ? 'white' : '#64748b',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{item.icon}</button>
      ))}
    </div>
  )

  return (
    <div style={{ width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚽</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>TEAM APP</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>v1.0</div>
          </div>
        </div>

        {/* Kontext klubu */}
        {club && (
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Klub</div>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{club.name}</div>
            {season && <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>Sezóna: {season.name}</div>}
          </div>
        )}
      </div>

      {/* Team switcher */}
      {teams.length > 1 && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Tým</div>
          <select value={team?.id || ''} onChange={e => setTeam(teams.find(t => t.id === e.target.value))}
            style={{ width: '100%', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', fontSize: 13, cursor: 'pointer' }}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item, i) => {
          if (!item) return <div key={i} style={{ height: 1, background: '#1e293b', margin: '8px 0' }} />
          const active = page === item.id
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: active ? '#1e293b' : 'transparent',
              color: active ? 'white' : '#64748b',
              fontSize: 14, textAlign: 'left', marginBottom: 2,
              fontFamily: 'inherit', fontWeight: active ? 500 : 400,
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#2563eb' }} />}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 12px', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 600, flexShrink: 0 }}>
            {(profile?.first_name?.[0] || '?').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile ? `${profile.first_name} ${profile.last_name}` : 'Uživatel'}
            </div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{profile?.role || 'coach'}</div>
          </div>
          <button onClick={signOut} title="Odhlásit" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>→</button>
        </div>
      </div>
    </div>
  )
}
