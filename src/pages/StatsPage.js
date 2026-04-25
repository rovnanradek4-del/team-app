import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Avatar, Badge, Spinner, EmptyState, Btn, Modal, FormField, Input, Textarea, useToast, ProgressBar } from '../components/UI'
import { formatDate } from '../styles'

export default function StatsPage() {
  const { team } = useApp()
  const [players, setPlayers] = useState([])
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventStats, setEventStats] = useState({})
  const [tab, setTab] = useState('table')
  const { show, ToastEl } = useToast()

  useEffect(() => { if (team) load() }, [team])

  async function load() {
    setLoading(true)
    const [plRes, evRes, stRes] = await Promise.all([
      supabase.from('team_players').select('*, players(*)').eq('team_id', team.id).eq('is_active', true),
      supabase.from('events').select('*').eq('team_id', team.id).in('type', ['match', 'tournament']).order('date', { ascending: false }).limit(20),
      supabase.from('match_stats').select('*'),
    ])
    setPlayers(plRes.data || [])
    setEvents(evRes.data || [])

    // Agreguj statistiky
    const agg = {}
    plRes.data?.forEach(tp => {
      agg[tp.player_id] = { goals: 0, assists: 0, minutes: 0, ratings: [], count: 0 }
    })
    stRes.data?.forEach(s => {
      if (agg[s.player_id]) {
        agg[s.player_id].goals += s.goals || 0
        agg[s.player_id].assists += s.assists || 0
        agg[s.player_id].minutes += s.minutes_played || 0
        if (s.rating) agg[s.player_id].ratings.push(s.rating)
        agg[s.player_id].count++
      }
    })
    setStats(agg)
    setLoading(false)
  }

  async function openEventStats(ev) {
    setSelectedEvent(ev)
    const { data } = await supabase.from('match_stats').select('*').eq('event_id', ev.id)
    const map = {}
    data?.forEach(s => { map[s.player_id] = s })
    players.forEach(tp => {
      if (!map[tp.player_id]) map[tp.player_id] = { goals: 0, assists: 0, minutes_played: 0, rating: '', internal_note: '' }
    })
    setEventStats(map)
    setModal('event')
  }

  async function saveEventStats() {
    const rows = Object.entries(eventStats).map(([player_id, s]) => ({
      event_id: selectedEvent.id, player_id,
      goals: parseInt(s.goals) || 0,
      assists: parseInt(s.assists) || 0,
      minutes_played: parseInt(s.minutes_played) || 0,
      rating: s.rating ? parseFloat(s.rating) : null,
      internal_note: s.internal_note || null,
    }))
    const { error } = await supabase.from('match_stats').upsert(rows, { onConflict: 'event_id,player_id' })
    if (error) show(error.message, 'error')
    else { show('Statistiky uloženy!'); setModal(null); load() }
  }

  const sorted = [...players].filter(tp => tp.players).sort((a, b) => {
    const sa = stats[a.player_id] || {}
    const sb = stats[b.player_id] || {}
    return ((sb.goals || 0) + (sb.assists || 0)) - ((sa.goals || 0) + (sa.assists || 0))
  })
  const maxPoints = sorted.length ? (stats[sorted[0].player_id]?.goals || 0) + (stats[sorted[0].player_id]?.assists || 0) : 1

  if (!team) return <EmptyState icon="📊" title="Vyberte tým" />
  if (loading) return <Spinner />

  return (
    <>
      {ToastEl}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['table', 'Kanadské bodování'], ['events', 'Zápasy']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', background: tab === id ? '#1e3a5f' : 'white', color: tab === id ? 'white' : '#64748b', border: '1px solid #e2e8f0' }}>{label}</button>
        ))}
      </div>

      {tab === 'table' && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Kanadské bodování — sezóna</div>
          {sorted.length === 0 ? <EmptyState icon="📊" title="Žádné statistiky" subtitle="Přidejte výsledky zápasů." /> : (
            sorted.map((tp, i) => {
              const p = tp.players
              const s = stats[tp.player_id] || {}
              const pts = (s.goals || 0) + (s.assists || 0)
              const avgRating = s.ratings?.length ? (s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length).toFixed(1) : '—'
              return (
                <div key={tp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: i < 3 ? 16 : 13, minWidth: 28, fontWeight: i < 3 ? 700 : 400, color: i === 0 ? '#d97706' : i === 1 ? '#94a3b8' : i === 2 ? '#92400e' : '#94a3b8' }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}
                  </span>
                  <Avatar first={p.first_name} last={p.last_name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: i < 3 ? 600 : 400 }}>{p.last_name} {p.first_name[0]}.</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Ø hodnocení: {avgRating} · {s.minutes || 0} min</div>
                  </div>
                  <ProgressBar value={pts} max={maxPoints} color={i === 0 ? '#d97706' : '#2563eb'} />
                  <div style={{ display: 'flex', gap: 8, minWidth: 100, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 500 }}>{s.goals || 0}G</span>
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>{s.assists || 0}A</span>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'right' }}>{pts}</span>
                  </div>
                </div>
              )
            })
          )}
        </Card>
      )}

      {tab === 'events' && (
        <div>
          {events.length === 0 ? <EmptyState icon="⚽" title="Žádné zápasy" subtitle="Přidejte zápasy v Kalendáři." /> : (
            events.map(ev => (
              <Card key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => openEventStats(ev)}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{formatDate(ev.date)} · {ev.type === 'match' ? 'Zápas' : 'Turnaj'}</div>
                </div>
                <Btn variant="secondary" onClick={e => { e.stopPropagation(); openEventStats(ev) }}>Zadat statistiky</Btn>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal pro zadání statistik zápasu */}
      <Modal open={modal === 'event'} onClose={() => setModal(null)} title={`Statistiky: ${selectedEvent?.title}`} width={700}>
        {selectedEvent && (
          <>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Zadejte výkon každého hráče v tomto zápase.</div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                  <tr>
                    {['Hráč', 'Góly', 'Asistence', 'Minuty', 'Hodnocení (1–5)', 'Poznámka'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', fontSize: 12, color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.filter(tp => tp.players).map(tp => {
                    const p = tp.players
                    const s = eventStats[tp.player_id] || {}
                    const upd = (k, v) => setEventStats(prev => ({ ...prev, [tp.player_id]: { ...prev[tp.player_id], [k]: v } }))
                    return (
                      <tr key={tp.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500 }}>{p.last_name} {p.first_name[0]}.</td>
                        {[['goals', '0'], ['assists', '0'], ['minutes_played', '0']].map(([field, ph]) => (
                          <td key={field} style={{ padding: '4px 6px' }}>
                            <input type="number" min="0" max={field === 'minutes_played' ? 120 : 30} value={s[field] || ''} onChange={e => upd(field, e.target.value)} placeholder={ph}
                              style={{ width: 60, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, textAlign: 'center' }} />
                          </td>
                        ))}
                        <td style={{ padding: '4px 6px' }}>
                          <select value={s.rating || ''} onChange={e => upd('rating', e.target.value)} style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, background: 'white' }}>
                            <option value="">—</option>
                            {[1,1.5,2,2.5,3,3.5,4,4.5,5].map(r => <option key={r} value={r}>{r}★</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input value={s.internal_note || ''} onChange={e => upd('internal_note', e.target.value)} placeholder="Poznámka..."
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={saveEventStats}>Uložit statistiky</Btn>
              <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
