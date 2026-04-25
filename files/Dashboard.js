import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, MetricCard, Badge, Spinner, ProgressBar, EmptyState } from '../components/UI'
import { formatDateShort, ATTENDANCE_COLORS } from '../styles'

export default function Dashboard({ setPage }) {
  const { team, season } = useApp()
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [todayEvents, setTodayEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentStats, setRecentStats] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (team) load()
  }, [team])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    const [playersRes, eventsRes, statsRes] = await Promise.all([
      supabase.from('team_players').select('*, players(*)').eq('team_id', team.id).eq('is_active', true),
      supabase.from('events').select('*').eq('team_id', team.id).gte('date', today).lte('date', nextWeek).order('date').limit(10),
      supabase.from('match_stats').select('*, players(first_name, last_name), events(title, date, type)').eq('events.team_id', team.id).order('created_at', { ascending: false }).limit(20),
    ])

    const p = playersRes.data || []
    setPlayers(p)
    setTodayEvents((eventsRes.data || []).filter(e => e.date === today))
    setUpcomingEvents((eventsRes.data || []).filter(e => e.date > today))

    // Generuj upozornění
    const a = []
    const lowDoch = p.filter(tp => tp.players && tp.players.dochazka_procent && tp.players.dochazka_procent < 60)
    lowDoch.forEach(tp => a.push({ type: 'warning', msg: `Nízká docházka: ${tp.players.first_name} ${tp.players.last_name} — ${tp.players.dochazka_procent}%` }))
    if (!season) a.push({ type: 'info', msg: 'Nemáte aktivní sezónu. Vytvořte ji v Nastavení.' })
    setAlerts(a)
    setLoading(false)
  }

  if (!team) return (
    <EmptyState icon="🏗️" title="Nejprve vytvořte tým" subtitle="V Nastavení přidejte sezónu, kategorii a tým." />
  )

  if (loading) return <Spinner />

  const topScorers = [...players]
    .filter(tp => tp.players)
    .sort((a, b) => (b.players.goly || 0) - (a.players.goly || 0))
    .slice(0, 5)

  const EVENT_ICONS = { training: '🏃', match: '⚽', tournament: '🏆', other: '📌' }
  const EVENT_COLORS = { training: '#eff6ff', match: '#f0fdf4', tournament: '#fffbeb', other: '#faf5ff' }

  return (
    <div>
      {/* Upozornění */}
      {alerts.map((a, i) => (
        <div key={i} style={{ background: a.type === 'warning' ? '#fffbeb' : '#eff6ff', border: `1px solid ${a.type === 'warning' ? '#fde68a' : '#bfdbfe'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
          <span>{a.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <span>{a.msg}</span>
        </div>
      ))}

      {/* Metriky */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <MetricCard icon="👥" label="Hráčů v týmu" value={players.length} color="#2563eb" onClick={() => setPage('players')} />
        <MetricCard icon="📅" label="Akcí tento týden" value={todayEvents.length + upcomingEvents.length} color="#16a34a" onClick={() => setPage('events')} />
        <MetricCard icon="⚽" label="Dnešní akce" value={todayEvents.length || '—'} sub={todayEvents[0]?.title || 'Žádná'} color="#d97706" />
        <MetricCard icon="📝" label="Sezóna" value={season?.name || '—'} sub={season?.is_active ? 'Aktivní' : 'Neaktivní'} color="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Dnešní a nadcházející akce */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            Nadcházející akce
            <button onClick={() => setPage('events')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer' }}>Vše →</button>
          </div>
          {todayEvents.length === 0 && upcomingEvents.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Žádné akce tento týden</div>
          ) : (
            [...todayEvents, ...upcomingEvents].slice(0, 6).map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: EVENT_COLORS[ev.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {EVENT_ICONS[ev.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatDateShort(ev.date)}{ev.time_start ? ` · ${ev.time_start.slice(0,5)}` : ''}</div>
                </div>
                {ev.date === new Date().toISOString().split('T')[0] && <Badge color="green">Dnes</Badge>}
              </div>
            ))
          )}
        </Card>

        {/* Top střelci */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            Kanadské bodování
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer' }}>Vše →</button>
          </div>
          {topScorers.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Zatím žádné statistiky</div>
          ) : (
            topScorers.map((tp, i) => {
              const p = tp.players
              const body = (p.goly || 0) + (p.asisty || 0)
              const maxBody = (topScorers[0].players.goly || 0) + (topScorers[0].players.asisty || 0)
              return (
                <div key={tp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 18, fontWeight: i < 3 ? 700 : 400 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13, flex: 1, fontWeight: i < 3 ? 600 : 400 }}>{p.last_name} {p.first_name[0]}.</span>
                  <ProgressBar value={body} max={maxBody || 1} color={i === 0 ? '#d97706' : '#2563eb'} />
                  <div style={{ display: 'flex', gap: 6, minWidth: 70, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: '#2563eb' }}>{p.goly || 0}G</span>
                    <span style={{ fontSize: 11, color: '#16a34a' }}>{p.asisty || 0}A</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{body}</span>
                  </div>
                </div>
              )
            })
          )}
        </Card>
      </div>

      {/* Rychlé akce */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Rychlé akce</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '+ Přidat hráče', page: 'players', color: '#eff6ff', text: '#1d4ed8' },
            { label: '+ Vytvořit akci', page: 'events', color: '#f0fdf4', text: '#15803d' },
            { label: '✓ Zaznamenat docházku', page: 'attendance', color: '#fffbeb', text: '#d97706' },
            { label: '📊 Zadat statistiky', page: 'stats', color: '#faf5ff', text: '#7c3aed' },
            { label: '📝 Přidat domácí úkol', page: 'homework', color: '#fef2f2', text: '#dc2626' },
          ].map(a => (
            <button key={a.page} onClick={() => setPage(a.page)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: a.color, color: a.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              {a.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
