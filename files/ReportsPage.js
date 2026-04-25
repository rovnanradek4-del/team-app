// ReportsPage.js
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Avatar, Badge, Modal, FormField, Textarea, Btn, Spinner, EmptyState, useToast } from '../components/UI'
import { formatDate } from '../styles'

export function ReportsPage() {
  const { team, season } = useApp()
  const [players, setPlayers] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [form, setForm] = useState({ type: 'autumn', strengths: '', improvements: '', coach_note: '' })
  const { show, ToastEl } = useToast()

  useEffect(() => { if (team) load() }, [team])

  async function load() {
    setLoading(true)
    const [plRes, rpRes] = await Promise.all([
      supabase.from('team_players').select('*, players(*)').eq('team_id', team.id).eq('is_active', true),
      supabase.from('player_reports').select('*').eq('team_id', team.id),
    ])
    setPlayers(plRes.data || [])
    setReports(rpRes.data || [])
    setLoading(false)
  }

  async function save() {
    if (!selectedPlayer) return
    const payload = {
      ...form, player_id: selectedPlayer.player_id, team_id: team.id, season_id: season?.id,
    }
    const { error } = await supabase.from('player_reports').insert([payload])
    if (error) show(error.message, 'error')
    else { show('Report uložen'); setModal(null); load() }
  }

  const reportTypes = [
    { id: 'autumn', label: 'Podzimní report' },
    { id: 'spring', label: 'Jarní report' },
    { id: 'full_season', label: 'Celosezonní report' },
    { id: 'monthly', label: 'Měsíční souhrn' },
  ]

  if (!team) return <EmptyState icon="📄" title="Vyberte tým" />
  if (loading) return <Spinner />

  return (
    <>
      {ToastEl}
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
        Kliknutím na hráče vytvoříte nebo zobrazíte jeho report.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {players.filter(tp => tp.players).map(tp => {
          const p = tp.players
          const playerReports = reports.filter(r => r.player_id === tp.player_id)
          return (
            <Card key={tp.id} style={{ cursor: 'pointer', padding: 16 }} onClick={() => { setSelectedPlayer(tp); setForm({ type: 'autumn', strengths: '', improvements: '', coach_note: '' }); setModal('report') }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar first={p.first_name} last={p.last_name} size={40} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.last_name} {p.first_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{playerReports.length} reportů</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {reportTypes.map(rt => {
                  const has = playerReports.some(r => r.type === rt.id)
                  return <Badge key={rt.id} color={has ? 'green' : 'gray'}>{has ? '✓' : '○'} {rt.label.split(' ')[0]}</Badge>
                })}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={modal === 'report'} onClose={() => setModal(null)} title={`Report: ${selectedPlayer?.players?.first_name} ${selectedPlayer?.players?.last_name}`} width={600}>
        <FormField label="Typ reportu">
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
            {reportTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.label}</option>)}
          </select>
        </FormField>
        <FormField label="Silné stránky" hint="Viditelné pro hráče a rodiče">
          <Textarea value={form.strengths} onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))} placeholder="Co hráči jde dobře, v čem se zlepšil..." rows={4} />
        </FormField>
        <FormField label="Oblasti k rozvoji" hint="Viditelné pro hráče a rodiče">
          <Textarea value={form.improvements} onChange={e => setForm(p => ({ ...p, improvements: e.target.value }))} placeholder="Na čem má hráč pracovat..." rows={4} />
        </FormField>
        <FormField label="Interní poznámka trenéra" hint="Neviditelné pro hráče a rodiče">
          <Textarea value={form.coach_note} onChange={e => setForm(p => ({ ...p, coach_note: e.target.value }))} placeholder="Interní poznámky..." rows={3} />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={save}>Uložit report</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>
    </>
  )
}

export default ReportsPage
