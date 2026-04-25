import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', club_name: '', club_sport: 'fotbal', club_city: '' })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn(form.email, form.password)
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true); setError('')

    // Registrace uživatele
    const { error: signUpErr } = await signUp(form.email, form.password, {
      first_name: form.first_name,
      last_name: form.last_name,
      role: 'club_admin'
    })
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

    // Vytvoření klubu
    const { data: club, error: clubErr } = await supabase.from('clubs').insert([{
      name: form.club_name,
      sport: form.club_sport,
      city: form.club_city,
    }]).select().single()
    if (clubErr) { setError(clubErr.message); setLoading(false); return }

    // Vytvoří výchozí sezónu
    const year = new Date().getFullYear()
    await supabase.from('seasons').insert([{
      club_id: club.id,
      name: `${year}/${year + 1}`,
      start_date: `${year}-07-01`,
      end_date: `${year + 1}-06-30`,
      autumn_end: `${year}-12-31`,
      spring_start: `${year + 1}-01-01`,
      is_active: true,
    }])

    setLoading(false)
    setMode('success')
  }

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  if (mode === 'success') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Klub zaregistrován!</h2>
        <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 24 }}>Zkontrolujte e-mail a potvrďte registraci. Poté se přihlaste.</p>
        <button onClick={() => setMode('login')} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Přihlásit se</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: '#2563eb', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>⚽</div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>TEAM APP</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>Datová páteř vašeho klubu</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[['login', 'Přihlášení'], ['register', 'Registrace klubu']].map(([id, label]) => (
              <button key={id} onClick={() => { setMode(id); setError('') }} style={{
                flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                background: mode === id ? 'white' : 'transparent',
                color: mode === id ? '#0f172a' : '#64748b',
                fontWeight: mode === id ? 600 : 400,
                boxShadow: mode === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>E-mail</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required style={inputStyle} placeholder="vas@email.cz" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Heslo</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required style={inputStyle} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Přihlašuji...' : 'Přihlásit se'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Jméno *</label>
                  <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required style={inputStyle} placeholder="Radek" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Příjmení *</label>
                  <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required style={inputStyle} placeholder="Novák" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>E-mail *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required style={inputStyle} placeholder="vas@email.cz" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Heslo *</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required style={inputStyle} placeholder="Min. 8 znaků" minLength={8} />
              </div>
              <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Informace o klubu</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Název klubu *</label>
                <input value={form.club_name} onChange={e => set('club_name', e.target.value)} required style={inputStyle} placeholder="FC Viktoria Plzeň" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Sport</label>
                  <select value={form.club_sport} onChange={e => set('club_sport', e.target.value)} style={{ ...inputStyle }}>
                    <option value="fotbal">Fotbal</option>
                    <option value="hokej">Hokej</option>
                    <option value="basketbal">Basketbal</option>
                    <option value="jiný">Jiný</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Město</label>
                  <input value={form.club_city} onChange={e => set('club_city', e.target.value)} style={inputStyle} placeholder="Plzeň" />
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Zakládám klub...' : 'Založit klub a registrovat se'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
