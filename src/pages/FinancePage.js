import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Badge, Modal, FormField, Input, Textarea, Btn, Spinner, EmptyState, useToast, Avatar } from '../components/UI'
import { formatDate } from '../styles'

export default function FinancePage() {
  const { team } = useApp()
  const [items, setItems] = useState([])
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ title: '', amount: '', deadline: '', description: '' })
  const { show, ToastEl } = useToast()

  useEffect(() => { if (team) load() }, [team])
  useEffect(() => { if (selected) loadPayments(selected.id) }, [selected])

  async function load() {
    setLoading(true)
    const [itemsRes, plRes] = await Promise.all([
      supabase.from('finance_items').select('*').eq('team_id', team.id).order('created_at', { ascending: false }),
      supabase.from('team_players').select('*, players(*)').eq('team_id', team.id).eq('is_active', true),
    ])
    setItems(itemsRes.data || [])
    setPlayers(plRes.data || [])
    setLoading(false)
  }

  async function loadPayments(itemId) {
    const { data } = await supabase.from('finance_payments').select('*').eq('finance_item_id', itemId)
    const map = {}
    data?.forEach(p => { map[p.player_id] = p })
    setPayments(map)
  }

  async function saveItem() {
    if (!form.title) { show('Vyplňte název', 'error'); return }
    const { data: item, error } = await supabase.from('finance_items').insert([{ ...form, team_id: team.id, amount: form.amount ? parseFloat(form.amount) : null }]).select().single()
    if (error) { show(error.message, 'error'); return }
    // Vytvoří záznamy plateb pro všechny hráče
    const rows = players.map(tp => ({ finance_item_id: item.id, player_id: tp.player_id, paid: false }))
    await supabase.from('finance_payments').insert(rows)
    show('Finanční položka přidána'); setModal(null); load()
  }

  async function togglePaid(itemId, playerId, currentlyPaid) {
    const existing = payments[playerId]
    if (existing) {
      await supabase.from('finance_payments').update({ paid: !currentlyPaid, paid_at: !currentlyPaid ? new Date().toISOString() : null }).eq('id', existing.id)
    } else {
      await supabase.from('finance_payments').insert([{ finance_item_id: itemId, player_id: playerId, paid: true, paid_at: new Date().toISOString() }])
    }
    loadPayments(itemId)
  }

  if (!team) return <EmptyState icon="💶" title="Vyberte tým" />
  if (loading) return <Spinner />

  return (
    <>
      {ToastEl}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Seznam položek */}
        <div>
          <Btn onClick={() => { setForm({ title: '', amount: '', deadline: '', description: '' }); setModal('add') }} style={{ width: '100%', marginBottom: 12 }}>+ Přidat položku</Btn>
          {items.map(item => {
            const isExpired = item.deadline && new Date(item.deadline) < new Date()
            return (
              <Card key={item.id} onClick={() => setSelected(item)} style={{ cursor: 'pointer', background: selected?.id === item.id ? '#eff6ff' : 'white', marginBottom: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{item.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {item.amount && <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{item.amount.toLocaleString('cs-CZ')} Kč</span>}
                  {item.deadline && <span style={{ fontSize: 11, color: isExpired ? '#dc2626' : '#94a3b8' }}>do {formatDate(item.deadline)}</span>}
                </div>
              </Card>
            )
          })}
          {items.length === 0 && <EmptyState icon="💶" title="Žádné položky" />}
        </div>

        {/* Platby */}
        {selected && (
          <Card>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{selected.title}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Zaplaceno: {Object.values(payments).filter(p => p.paid).length}/{players.length} hráčů
            </div>
            {players.filter(tp => tp.players).map(tp => {
              const p = tp.players
              const payment = payments[tp.player_id]
              const paid = payment?.paid || false
              return (
                <div key={tp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <Avatar first={p.first_name} last={p.last_name} size={32} />
                  <span style={{ flex: 1, fontSize: 14 }}>{p.first_name} {p.last_name}</span>
                  <button onClick={() => togglePaid(selected.id, tp.player_id, paid)} style={{
                    padding: '5px 14px', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                    background: paid ? '#f0fdf4' : '#fef2f2',
                    color: paid ? '#16a34a' : '#dc2626',
                    fontWeight: 600,
                  }}>
                    {paid ? '✓ Zaplaceno' : '✗ Nezaplaceno'}
                  </button>
                </div>
              )
            })}
          </Card>
        )}
      </div>

      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Nová finanční položka">
        <FormField label="Název" required>
          <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Příspěvky na soustředění, Výjezd..." />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Částka (Kč)">
            <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="1500" />
          </FormField>
          <FormField label="Deadline">
            <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Popis">
          <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Poznámka k položce..." />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={saveItem}>Přidat položku</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>
    </>
  )
}
