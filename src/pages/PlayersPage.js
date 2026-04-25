import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Avatar, Badge, Modal, FormField, Input, Select, Textarea, Btn, Spinner, EmptyState, Tabs, useToast } from '../components/UI'
import { formatDate } from '../styles'

export default function PlayersPage() {
  const { team, season } = useApp()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('list')
  const { show, ToastEl } = useToast()

  const emptyForm = { first_name: '', last_name: '', birth_date: '', position: 'field', jersey_number: '', goalkeeper_number: '', internal_notes: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { if (team) load() }, [team])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('team_players')
      .select('*, players(*)')
      .eq('team_id', team.id)
      .eq('is_active', true)
    setPlayers(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.first_name || !form.last_name) { show('Vyplňte jméno a příjmení', 'error'); return }

    if (selected) {
      // Edit
      const { error } = await supabase.from('players').update({
        first_name: form.first_name, last_name: form.last_name,
        birth_date: form.birth_date || null, position: form.position,
        jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
        goalkeeper_number: form.goalkeeper_number ? parseInt(form.goalkeeper_number) : null,
        internal_notes: form.internal_notes,
      }).eq('id', selected.players.id)
      if (error) show(error.message, 'error')
      else { show('Hráč upraven'); setModal(null); load() }
    } else {
      // Create player
      const { data: player, error: pErr } = await supabase.from('players').insert([{
        club_id: team.club_id,
        first_name: form.first_name, last_name: form.last_name,
        birth_date: form.birth_date || null, position: form.position,
        jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
        goalkeeper_number: form.goalkeeper_number ? parseInt(form.goalkeeper_number) : null,
        internal_notes: form.internal_notes,
      }]).select().single()
      if (pErr) { show(pErr.message, 'error'); return }

      // Add to team
      await supabase.from('team_players').insert([{
        team_id: team.id, player_id: player.id, season_id: season?.id,
      }])
      show('Hráč přidán'); setModal(null); load()
    }
  }

  async function removePlayer(tp) {
    await supabase.from('team_players').update({ is_active: false }).eq('id', tp.id)
    show('Hráč odebrán z týmu'); load()
  }

  function openEdit(tp) {
    setSelected(tp)
    const p = tp.players
    setForm({ first_name: p.first_name, last_name: p.last_name, birth_date: p.birth_date || '', position: p.position, jersey_number: p.jersey_number || '', goalkeeper_number: p.goalkeeper_number || '', internal_notes: p.internal_notes || '' })
    setModal('edit')
  }

  function openAdd() {
    setSelected(null)
    setForm(emptyForm)
    setModal('edit')
  }

  const filtered = players.filter(tp => {
    if (!tp.players) return false
    const q = search.toLowerCase()
    return `${tp.players.first_name} ${tp.players.last_name}`.toLowerCase().includes(q)
  })

  if (!team) return <EmptyState icon="👥" title="Vyberte tým" />
  if (loading) return <Spinner />

  return (
    <>
      {ToastEl}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flex: 1 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat hráče..." style={{ flex: 1, maxWidth: 300, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
          <Tabs tabs={[{id:'list',label:'Mřížka'},{id:'table',label:'Tabulka'}]} active={tab} onChange={setTab} />
        </div>
        <Btn onClick={openAdd}>+ Přidat hráče</Btn>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="👤" title="Žádní hráči" subtitle="Přidejte prvního hráče do týmu." action={<Btn onClick={openAdd}>+ Přidat hráče</Btn>} />
      ) : tab === 'list' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {filtered.map(tp => {
            const p = tp.players
            return (
              <Card key={tp.id} style={{ padding: 16, textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.1s', marginBottom: 0 }}
                onClick={() => openEdit(tp)}>
                <Avatar first={p.first_name} last={p.last_name} size={52} />
                <div style={{ marginTop: 10, fontWeight: 600, fontSize: 14 }}>{p.last_name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{p.first_name}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {p.position === 'goalkeeper' && <Badge color="purple">🧤 Brankář</Badge>}
                  {p.jersey_number && <Badge color="gray">#{p.jersey_number}</Badge>}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Hráč', 'Pozice', 'Datum narození', 'Dres', 'Akce'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tp, i) => {
                const p = tp.players
                return (
                  <tr key={tp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar first={p.first_name} last={p.last_name} size={32} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{p.first_name} {p.last_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge color={p.position === 'goalkeeper' ? 'purple' : 'blue'}>{p.position === 'goalkeeper' ? '🧤 Brankář' : 'Hráč'}</Badge>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{formatDate(p.birth_date)}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{p.jersey_number ? `#${p.jersey_number}` : '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(tp)} style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#1d4ed8', cursor: 'pointer' }}>Upravit</button>
                        <button onClick={() => removePlayer(tp)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>Odebrat</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal přidat/upravit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={selected ? 'Upravit hráče' : 'Přidat hráče'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Jméno" required>
            <Input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Jan" />
          </FormField>
          <FormField label="Příjmení" required>
            <Input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Novák" />
          </FormField>
        </div>
        <FormField label="Datum narození">
          <Input type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} />
        </FormField>
        <FormField label="Pozice">
          <Select value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}>
            <option value="field">Hráč v poli</option>
            <option value="goalkeeper">Brankář</option>
          </Select>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Číslo dresu" hint="Hráčské číslo">
            <Input type="number" value={form.jersey_number} onChange={e => setForm(p => ({ ...p, jersey_number: e.target.value }))} placeholder="10" min="1" max="99" />
          </FormField>
          {form.position === 'goalkeeper' && (
            <FormField label="Brankářské číslo">
              <Input type="number" value={form.goalkeeper_number} onChange={e => setForm(p => ({ ...p, goalkeeper_number: e.target.value }))} placeholder="1" />
            </FormField>
          )}
        </div>
        <FormField label="Interní poznámky trenéra" hint="Neviditelné pro hráče a rodiče">
          <Textarea value={form.internal_notes} onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))} placeholder="Poznámky k hráči..." />
        </FormField>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn onClick={save}>{selected ? 'Uložit změny' : 'Přidat hráče'}</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>
    </>
  )
}
