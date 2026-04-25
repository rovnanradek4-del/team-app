// AttendancePage.js
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Badge, Spinner, EmptyState, Btn, Select, useToast, ProgressBar } from '../components/UI'
import { ATTENDANCE_COLORS, ATTENDANCE_LABELS, formatDate } from '../styles'

export function AttendancePage() {
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
    const nextWeek = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]

    const [evRes, plRes] = await Promise.all([
      supabase.from('events').select('*').eq('team_id', team.id).eq('is_cancelled', false)
        .gte('date', monthAgo).lte('date', nextWeek).order('date', { ascending: false }),
      supabase.from('team_players').select('*, players(*)').eq('team_id', team.id).eq('is_active', true),
    ])
    setEvents(evRes.data || [])
    setPlayers(plRes.data || [])
    if (evRes.data?.length > 0) setSelectedEvent(evRes.data[0])
    setLoading(false)
  }

  async function loadAttendance() {
    const { data } = await supabase.from('attendance').select('*').eq('event_id', selectedEvent.id)
    const map = {}
    data?.forEach(a => { map[a.player_id] = a.status })
    // Default: unknown pro všechny
    players.forEach(tp => { if (!map[tp.player_id]) map[tp.player_id] = 'unknown' })
    setAttendance(map)
  }

  async function saveAttendance() {
    setSaving(true)
    const rows = Object.entries(attendance).map(([player_id, status]) => ({
      event_id: selectedEvent.id, player_id, status,
    }))
    await supabase.from('attendance').upsert(rows, { onConflict: 'event_id,player_id' })
    show('Docházka uložena!')
    setSaving(false)
  }

  const statusCycle = { unknown: 'present', present: 'excused', excused: 'unexcused', unexcused: 'unknown' }
  const statusBg = { present: '#f0fdf4', excused: '#fffbeb', unexcused: '#fef2f2', unknown: '#f8fafc' }

  if (!team) return <EmptyState icon="✓" title="Vyberte tým" />
  if (loading) return <Spinner />

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const totalCount = players.length

  return (
    <>
      {ToastEl}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Seznam akcí */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }}>Akce</div>
          {events.map(ev => (
            <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
              background: selectedEvent?.id === ev.id ? '#eff6ff' : 'white',
            }}>
              <div style={{ fontSize: 13, fontWeight: selectedEvent?.id === ev.id ? 600 : 400 }}>{ev.title}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatDate(ev.date)}</div>
            </div>
          ))}
          {events.length === 0 && <div style={{ padding: 16, color: '#94a3b8', fontSize: 13 }}>Žádné akce</div>}
        </Card>

        {/* Docházka */}
        <div>
          {selectedEvent && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedEvent.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{formatDate(selectedEvent.date)} · Přítomno: {presentCount}/{totalCount}</div>
                </div>
                <Btn onClick={saveAttendance} disabled={saving}>{saving ? 'Ukládám...' : 'Uložit docházku'}</Btn>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[['present', 'Vše přítomni'], ['excused', 'Vše omluveni']].map(([status, label]) => (
                  <button key={status} onClick={() => {
                    const newAtt = {}
                    players.forEach(tp => { newAtt[tp.player_id] = status })
                    setAttendance(newAtt)
                  }} style={{ padding: '6px 12px', border: `1px solid ${ATTENDANCE_COLORS[status]}`, borderRadius: 8, background: `${ATTENDANCE_COLORS[status]}20`, color: ATTENDANCE_COLORS[status], fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {players.map(tp => {
                  if (!tp.players) return null
                  const p = tp.players
                  const status = attendance[tp.player_id] || 'unknown'
                  return (
                    <div key={tp.id} onClick={() => setAttendance(prev => ({ ...prev, [tp.player_id]: statusCycle[status] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${ATTENDANCE_COLORS[status]}50`, background: statusBg[status], cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ATTENDANCE_COLORS[status], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{p.last_name} {p.first_name}</span>
                      <span style={{ fontSize: 11, color: ATTENDANCE_COLORS[status], fontWeight: 600 }}>{ATTENDANCE_LABELS[status]}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default AttendancePage
