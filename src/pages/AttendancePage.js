import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Badge, Btn, Spinner, EmptyState, useToast } from '../components/UI'
import { formatDate } from '../styles'

const STATUSES = [
  { key: 'present', label: 'Přítomen/a', color: '#16a34a', bg: '#f0fdf4', icon: '✓' },
  { key: 'excused', label: 'Omluven/a', color: '#d97706', bg: '#fffbeb', icon: '○' },
  { key: 'unexcused', label: 'Neomluven/a', color: '#dc2626', bg: '#fef2f2', icon: '✗' },
  { key: 'uninvited', label: 'Nepoz{án/a', color: '#94a3b8', bg: '#f8fafc', icon: '—' },
]

const STATUS_CYCLE = { present: 'excused', excused: 'unexcused', unexcused: 'uninvited', uninvited: 'present' }

export default function AttendancePage() {
  const { team } = useApp()
  const [events, setEvents] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { show, ToastEl } = useToast()

  useEffect(() => { if (team) loadEvents() }, [team])
  useEffect(() => { if (selectedEvent) loadAttendance() }, [selectedEvent])

  async function loadEvents() {
    setLoading(true)
    const today = new Date()
    const monthAgo = new Date(today - 30 * 86400000).toISOString().split('T')[0]
    const nextWeek = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0]
    const [evRes, plRes] = await Promise.all([
      supabase.from('events').select('*').eq('team_id', team.id).eq('is_cancelled', false)
        .gte('date', monthAgo).lte('date', nextWeek).order('date', { ascending: false }),
      supabase.from('team_players').select('*, players(*)').eq('team_id', team.id).eq('is_active', true),
    ])
    const evs = evRes.data || []
    const pls = plRes.data || []
    setEvents(evs)
    setPlayers(pls)
    if (evs.length > 0) setSelectedEvent(evs[0])
    setLoading(false)
  }

  async function loadAttendance() {
    const { data } = await supabase.from('attendance').select('*').eq('event_id', selectedEvent.id)
    const map = {}
    data?.forEach(a => { map[a.player_id] = a.status })
    players.forEach(tp => { if (!map[tp.player_id]) map[tp.player_id] = 'present' })
    setAttendance(map)
  }

  async function save() {
    setSaving(true)
    const rows = Object.entries(attendance).map(([player_id, status]) => ({
      event_id: selectedEvent.id, player_id, status,
    }))
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'event_id,player_id' })
    if (error) show(error.message, 'error')
    else show('Docházka uložena! ✓')
    setSaving(false)
  }

  function setAll(status) {
    const newAtt = {}
    players.forEach(tp => { newAtt[tp.player_id] = status })
    setAttendance(newAtt)
  }

  function cancelEvent() {
    if (!window.confirm('Opravdu zrušit tuto akci?')) return
    supabase.from('events').update({ is_cancelled: true }).eq('id', selectedEvent.id).then(() => {
      show('Akce zrušena')
      loadEvents()
    })
  }

  const stats = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    excused: Object.values(attendance).filter(s => s === 'excused').length,
    unexcused: Object.values(attendance).filter(s => s === 'unexcused').length,
    uninvited: Object.values(attendance).filter(s => s === 'uninvited').length,
  }

  const TYPE_ICONS = { training: '🏃', match: '⚽', tournament: '🏆', other: '📌' }

  if (!team) return <EmptyState icon="✓" title="Vyberte tým" />
  if (loading) return <Spinner />

  return (
    <>
      {ToastEl}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
         <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akce</div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {events.length === 0 && <div style={{ padding: 16, color: '#94a3b8', fontSize: 13 }}>Žádné akce</div>}
            {events.map(ev => {
              const isSelected = selectedEvent?.id === ev.id
              const isToday = ev.date === new Date().toISOString().split('T')[0]
              return (
                <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: isSelected ? '#eff6ff' : 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{TYPE_ICONS[ev.type] || '🐌'}</span>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, flex: 1 }}>{ev.title}</span>
                    {isToday && <Badge color="amber">Dnes</Badge>}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatDate(ev.date)}</div>
                </div>
              )
            })}
          </Card>
         </div>
         {selectedEvent ? (
          <div>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedEvent.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{formatDate(selectedEvent.date)}</div>
                </div>
                <Btn onClick={save} disabled={saving}>{saving ? 'Ukládám...' : 'Uložit docházku'}</Btn>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <div key={s.key} style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {s.icon} {s.label}: {stats[s.key]}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setAll('present')} style={{ padding: '6px 14px', border: '1px solid #16a34a', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>✓ Všichni přítomni</button>
                <button onClick={() => setAll('excused')} style={{ padding: '6px 14px', border: '1px solid #d97706', borderRadius: 8, background: '#fffbeb', color: '#d97706', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>○ Všichni omluveni</button>
                <button onClick={() => setAll('uninvited')} style={{ padding: '6px 14px', border: '1px solid #94a3b8', borderRadius: 8, background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>— Nikdo nepozván</button>
                <button onClick={cancelEvent} style={{ padding: '6px 14px', border: '1px solid #dc2626', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>✗ Akce zrušena</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {players.filter(tp => tp.players).map(tp => {
                const p = tp.players
                const status = attendance[tp.player_id] || 'present'
                const statusInfo = STATUSES.find(s => s.key === status)
                return (
                  <div key={tp.id} onClick={() => setAttendance(prev => ({ ...prev, [tp.player_id]: STATUS_CYCLE[status] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${statusInfo.color}40`, background: statusInfo.bg, cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: statusInfo.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: statusInfo.color, fontWeight: 700, flexShrink: 0 }}>
                      {statusInfo.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.last_name} {p.first_name}</div>
                      {p.jersey_number && <div style={{ fontSize: 11, color: '#94a3b8' }}>#{p.jersey_number}</div>}
                    </div>
                    <select value={status} onChange={e => { e.stopPropagation(); setAttendance(prev => ({ ...prev, [tp.player_id]: e.target.value })) }} onClick={e => e.stopPropagation()}
                      style={{ fontSize: 11, border: 'none', background: 'transparent', color: statusInfo.color, fontWeight: 600, cursor: 'pointer' }}>
                      {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        ) : <EmptyState icon="📋" title="Vyberte akci" subtitle="Klikněte na akci vlevo." />}
      </div>
    </>
  )
}
