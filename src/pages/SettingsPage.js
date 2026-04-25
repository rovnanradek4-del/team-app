import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useApp } from '../contexts/AppContext'
import { Card, Badge, Modal, FormField, Input, Select, Textarea, Btn, Spinner, EmptyState, useToast, Tabs } from '../components/UI'
import { formatDate } from '../styles'

export default function SettingsPage() {
  const { club, season, seasons, categories, teams, createSeason, createCategory, createTeam, reload } = useApp()
  const [tab, setTab] = useState('struktura')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const { show, ToastEl } = useToast()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ── Sezóna ──────────────────────────────────────────────────
  async function saveSeason() {
    if (!form.name || !form.start_date || !form.end_date) { show('Vyplňte povinná pole', 'error'); return }
    const { error } = await createSeason(form)
    if (error) show(error.message, 'error')
    else { show('Sezóna vytvořena'); setModal(null); setForm({}) }
  }

  async function toggleSeasonActive(s) {
    // Deaktivuj ostatní
    await supabase.from('seasons').update({ is_active: false }).eq('club_id', club.id)
    await supabase.from('seasons').update({ is_active: true }).eq('id', s.id)
    show('Aktivní sezóna změněna'); reload()
  }

  // ── Kategorie ────────────────────────────────────────────────
  async function saveCategory() {
    if (!form.name) { show('Vyplňte název kategorie', 'error'); return }
    const { error } = await createCategory(form)
    if (error) show(error.message, 'error')
    else { show('Kategorie vytvořena'); setModal(null); setForm({}) }
  }

  // ── Tým ──────────────────────────────────────────────────────
  async function saveTeam() {
    if (!form.name || !form.category_id) { show('Vyplňte název a vyberte kategorii', 'error'); return }
    const { error } = await createTeam(form)
    if (error) show(error.message, 'error')
    else { show('Tým vytvořen'); setModal(null); setForm({}) }
  }

  // ── Klub ─────────────────────────────────────────────────────
  async function saveClub() {
    if (!club) return
    const { error } = await supabase.from('clubs').update({ name: form.club_name, city: form.club_city, sport: form.club_sport, description: form.club_description }).eq('id', club.id)
    if (error) show(error.message, 'error')
    else show('Nastavení klubu uloženo')
  }

  if (!club) return (
    <EmptyState icon="⚙️" title="Nejprve vytvořte klub" subtitle="Zaregistrujte se a založte klub." />
  )

  const tabsList = [
    { id: 'struktura', label: 'Struktura' },
    { id: 'klub', label: 'Klub' },
  ]

  return (
    <>
      {ToastEl}
      <Tabs tabs={tabsList} active={tab} onChange={setTab} />

      {/* ── STRUKTURA ──────────────────────────────────────── */}
      {tab === 'struktura' && (
        <div>
          {/* Sezóny */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Sezóny</div>
            <Btn onClick={() => { setForm({ name: '', start_date: '', end_date: '', autumn_end: '', spring_start: '' }); setModal('season') }}>+ Nová sezóna</Btn>
          </div>
          <Card style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
            {seasons.length === 0 ? (
              <div style={{ padding: 20, color: '#94a3b8', fontSize: 13 }}>Žádné sezóny. Vytvořte první sezónu.</div>
            ) : seasons.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(s.start_date)} – {formatDate(s.end_date)}</div>
                </div>
                {s.is_active && <Badge color="green">Aktivní</Badge>}
                {s.is_archived && <Badge color="gray">Archivováno</Badge>}
                {!s.is_active && !s.is_archived && (
                  <button onClick={() => toggleSeasonActive(s)} style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'white' }}>
                    Nastavit jako aktivní
                  </button>
                )}
              </div>
            ))}
          </Card>

          {/* Kategorie */}
          {season && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Kategorie — {season.name}</div>
                <Btn onClick={() => { setForm({ name: '', age_group: '' }); setModal('category') }}>+ Nová kategorie</Btn>
              </div>
              <Card style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
                {categories.length === 0 ? (
                  <div style={{ padding: 20, color: '#94a3b8', fontSize: 13 }}>Žádné kategorie. Přidejte první kategorii (např. U11, U13).</div>
                ) : categories.map(cat => (
                  <div key={cat.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cat.teams?.length ? 8 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{cat.name}</div>
                      {cat.age_group && <Badge color="blue">{cat.age_group}</Badge>}
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{cat.teams?.length || 0} týmů</span>
                    </div>
                    {cat.teams?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 12 }}>
                        {cat.teams.map(t => (
                          <div key={t.id} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{t.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </Card>

              {/* Týmy */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Týmy</div>
                <Btn onClick={() => { setForm({ name: '', category_id: categories[0]?.id || '', description: '' }); setModal('team') }}
                  disabled={categories.length === 0}>+ Nový tým</Btn>
              </div>
              {categories.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#92400e', marginBottom: 12 }}>
                  ⚠️ Nejdřív vytvořte alespoň jednu kategorii.
                </div>
              )}
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {teams.length === 0 ? (
                  <div style={{ padding: 20, color: '#94a3b8', fontSize: 13 }}>Žádné týmy. Přidejte první tým.</div>
                ) : teams.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👥</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                      {t.description && <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.description}</div>}
                    </div>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── KLUB ───────────────────────────────────────────── */}
      {tab === 'klub' && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Informace o klubu</div>
          <FormField label="Název klubu" required>
            <Input defaultValue={club.name} onBlur={e => set('club_name', e.target.value)} placeholder={club.name} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Sport">
              <Select defaultValue={club.sport} onChange={e => set('club_sport', e.target.value)}>
                <option value="fotbal">Fotbal</option>
                <option value="hokej">Hokej</option>
                <option value="basketbal">Basketbal</option>
                <option value="jiný">Jiný</option>
              </Select>
            </FormField>
            <FormField label="Město">
              <Input defaultValue={club.city} onBlur={e => set('club_city', e.target.value)} placeholder={club.city} />
            </FormField>
          </div>
          <FormField label="Popis klubu">
            <Textarea defaultValue={club.description} onBlur={e => set('club_description', e.target.value)} placeholder="Popis klubu..." />
          </FormField>
          <Btn onClick={saveClub}>Uložit nastavení</Btn>
        </Card>
      )}

      {/* ── Modaly ─────────────────────────────────────────── */}

      {/* Modal: Nová sezóna */}
      <Modal open={modal === 'season'} onClose={() => setModal(null)} title="Nová sezóna">
        <FormField label="Název sezóny" required hint="Např. 2025/2026">
          <Input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="2025/2026" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Začátek sezóny" required>
            <Input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
          </FormField>
          <FormField label="Konec sezóny" required>
            <Input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} />
          </FormField>
          <FormField label="Konec podzimu" hint="Pro půlsezónní statistiky">
            <Input type="date" value={form.autumn_end || ''} onChange={e => set('autumn_end', e.target.value)} />
          </FormField>
          <FormField label="Začátek jara">
            <Input type="date" value={form.spring_start || ''} onChange={e => set('spring_start', e.target.value)} />
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={saveSeason}>Vytvořit sezónu</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>

      {/* Modal: Nová kategorie */}
      <Modal open={modal === 'category'} onClose={() => setModal(null)} title="Nová kategorie">
        <FormField label="Název kategorie" required hint="Např. U11, U13, Dorost">
          <Input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="U11" />
        </FormField>
        <FormField label="Věková skupina" hint="Volitelně, např. 2015">
          <Input value={form.age_group || ''} onChange={e => set('age_group', e.target.value)} placeholder="2015" />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={saveCategory}>Vytvořit kategorii</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>

      {/* Modal: Nový tým */}
      <Modal open={modal === 'team'} onClose={() => setModal(null)} title="Nový tým">
        <FormField label="Název týmu" required hint="Např. FCVP U11 A, FK Náchod U13">
          <Input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="FCVP U11 A" />
        </FormField>
        <FormField label="Kategorie" required>
          <Select value={form.category_id || ''} onChange={e => set('category_id', e.target.value)}>
            <option value="">Vyberte kategorii...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Popis">
          <Input value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Popis týmu..." />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={saveTeam}>Vytvořit tým</Btn>
          <Btn variant="secondary" onClick={() => setModal(null)}>Zrušit</Btn>
        </div>
      </Modal>
    </>
  )
}
