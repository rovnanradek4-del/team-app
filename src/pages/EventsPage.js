import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Badge, Modal, FormField, Input, Select, Textarea, Btn, Spinner, EmptyState, useToast } from '../components/UI'
import { formatDate, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '../styles'

export default function EventsPage() {
  const { team } = useApp()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('upcoming')
  const { show, ToastEl } = useToast()

  const emptyForm = { title: '', type: 'training', date: '', time_start: '', time_end: '', location: '', description: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { if (team) load() }, [team, filter])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let q = supabase.from('events').select('*').eq('team_id', team.id).eq('is_cancelled', false)
    if (filter === 'upcoming') q = q.gte('date', today).order('date')
    else if (filter === 'past') q = q.lt('date', today).order('date', { ascending: false })
    else q = q.order('date', { ascending: false })
    const { data } = await q.limit(50)
    setEvents(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title || !form.date) { show('Vyplňte název a datum', 'error'); return }
    const payload = { ...form, team_id: team.id }

    if (selected) {
      const { error } = await supabase.from('events').update(payload).eq('id', selected.id)
      if (error) show(error.message, 'error')
      else { show('Akce upravena'); setModal(null); load() }
    } else {
      const { error } = await supabase.from('events').insert([payload])
      if (error) show(error.message, 'error')
      else { show('Akce vytvořena'); setModal(null); load() }
    }
  }

  async function cancel(ev) {
    await supabase.from('events').update({ is_cancelled: true }).eq('id', ev.id)
    show('Akce zrušena'); load()
  }

  function openAdd() {
    setSelected(null)
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setModal('edit')
  }

  function openEdit(ev) {
    setSelected(ev)
    setForm({ title: ev.title, type: ev.type, date: ev.date, time_start: ev.time_start || '', time_end: ev.time_end || '', location: ev.location || '', description: ev.description || '' })
    setModal('edit')
  }

  const ICONS = { training: '🏃', match: '⚽', tournament: '🏆', other: '📌' }
  const grouped = events.reduce((acc, ev) => {
    const month = ev.date.slice(0, 7)
    if (!acc[month]) acc[month] = []
    acc[month].push(ev)
    return acc
  }, {})

  if (!team) return <EmptyState icon="📅" title="Vyberte tým" />
  if (loading) return <Spinner />

  return (
    <>
      {ToastEl}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['upcoming', 'Nadcházející'], ['past', 'Minulé'], ['all', 'Vše']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              padding: '7px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
              background: filter === id ? '#1e3a5f' : 'white',
              color: filter === id ? 'white' : '#64748b',
              border: filter === id ? 'none' : '1px solid #e2e8f0',
            }}>{label}</button>
          ))}
        </div>
        <Btn onClick={openAdd}>+ Přidat akci</Btn>
      </div>

      {events.length === 0 ? (
        <EmptyState icon="📅" title="Žádné akce" subtitle="Vytvořte první trénink nebo zápas." action={<Btn onClick={openAdd}>+ Přidat akci</Btn>} />
      ) : (
        Object.entries(grouped).map(([month, evs]) => (
          <div key={month} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              {new Date(month + '-01').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {evs.map((ev, i) => {
                const isToday = ev.date === new Date().toISOString().split('T')[0]
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < evs.length - 1 ? '1px solid #f1f5f9' : 'none', background: isToday ? '#fffbeb' : 'white' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${EVENT_TYPE_COLORS[ev.type]}20`, border: `1.5px solid ${EVENT_TYPE_COLORS[ev.type]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {ICONS[ev.type]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{ev.title}</span>
                        <Badge color={ev.type === 'match' ? 'green' : ev.type === 'tournament' ? 'amber' : ev.type === 'training' ? 'blue' : 'gray'}>
                          {EVENT_TYPE_LABELS[ev.type]}
                        </Badge>
                        {isToday && <Badge color="amber">Dnes</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 12 }}>
                        <span>📅 {formatDate(ev.date)}</span>
                        {ev.time_start && <span>⏰ {ev.time_start.slice(0, 5)}{ev.time_end ? `–${ev.time_end.slice(0, 5)}` : ''}</span>}
                        {ev.location && <span>📍 {ev.location}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(ev)} style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#1d4ed8', cursor: 'pointer' }}>Upravit</button>
                      <button onClick={() => cancel(ev)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>Zrušit</button>
                    </div>
                  </div>
                )
              })}
            </Card>
          </div>
        ))
      )}

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={selected ? 'Upravit akci' : 'Nová akce'}>
        <FormField label="Název" required>
          <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Trénink, Zápas vs. AC Sparta..." />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Typ">
            <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="training">Trénink</option>
              <option value="match">Zápas</option>
              <option value="tournament">Turnaj</option>
              <option value="other">Jiná akce</option>
            </Select>
          </FormField>
          <FormField label="Datum" required>
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </FormField>
          <FormField label="Začátek">
            <Input type="time" value={form.time_start} onChange={e => setForm(p => ({ ...p, time_start: e.target.value }))} />
          </FormField>
          <FormField label="Konec">
            <Input type="time" value={form.time_end} onChange={e => setForm(p => ({ ...p, time_end: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Místo konání">
          <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Hřiště Lochotín, ul. Štefánikova..." />
        </FormField>
        <FormField label="Popis / instrukce">
          <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Informace pro hráče..." />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={save}>{selected ? 'Uložit' : 'Vytvořit akci'}</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>
    </>
  )
}
