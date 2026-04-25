// HomeworkPage.js
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Badge, Modal, FormField, Input, Textarea, Btn, Spinner, EmptyState, useToast } from '../components/UI'
import { formatDate } from '../styles'

export default function HomeworkPage() {
  const { team } = useApp()
  const [homework, setHomework] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', deadline: '' })
  const { show, ToastEl } = useToast()

  useEffect(() => { if (team) load() }, [team])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('homework').select('*, homework_submissions(count)').eq('team_id', team.id).order('created_at', { ascending: false })
    setHomework(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title) { show('Vyplňte název', 'error'); return }
    const { error } = await supabase.from('homework').insert([{ ...form, team_id: team.id }])
    if (error) show(error.message, 'error')
    else { show('Domácí úkol přidán'); setModal(null); load() }
  }

  if (!team) return <EmptyState icon="📝" title="Vyberte tým" />
  if (loading) return <Spinner />

  return (
    <>
      {ToastEl}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn onClick={() => { setForm({ title: '', description: '', deadline: '' }); setModal('add') }}>+ Přidat domácí úkol</Btn>
      </div>
      {homework.length === 0 ? (
        <EmptyState icon="📝" title="Žádné domácí úkoly" subtitle="Zadejte hráčům první úkol." action={<Btn onClick={() => setModal('add')}>+ Přidat úkol</Btn>} />
      ) : (
        homework.map(hw => (
          <Card key={hw.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{hw.title}</div>
              {hw.description && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{hw.description}</div>}
              <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#94a3b8' }}>
                {hw.deadline && <span>⏰ Deadline: {formatDate(hw.deadline)}</span>}
                <span>✓ Splněno: {hw.homework_submissions?.[0]?.count || 0} hráčů</span>
              </div>
            </div>
            <Badge color={hw.deadline && new Date(hw.deadline) < new Date() ? 'red' : 'green'}>
              {hw.deadline && new Date(hw.deadline) < new Date() ? 'Uplynul' : 'Aktivní'}
            </Badge>
          </Card>
        ))
      )}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Nový domácí úkol">
        <FormField label="Název" required>
          <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Trénink slabší nohy, 50 přihrávek..." />
        </FormField>
        <FormField label="Popis / instrukce">
          <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Popis cvičení, odkaz na video..." />
        </FormField>
        <FormField label="Deadline">
          <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={save}>Přidat úkol</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>
    </>
  )
}
