import React, { useState } from 'react'
import { avatarColor, initials, btn, colors } from '../styles'

export function Spinner({ size = 32 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: size, height: size, border: `3px solid #e2e8f0`, borderTop: `3px solid #2563eb`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function Card({ children, style }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', ...style }}>
      {children}
    </div>
  )
}

export function Badge({ children, color = 'blue' }) {
  const map = {
    blue: ['#eff6ff', '#1d4ed8'],
    green: ['#f0fdf4', '#15803d'],
    red: ['#fef2f2', '#dc2626'],
    amber: ['#fffbeb', '#d97706'],
    gray: ['#f8fafc', '#64748b'],
    purple: ['#faf5ff', '#7c3aed'],
  }
  const [bg, tc] = map[color] || map.blue
  return <span style={{ background: bg, color: tc, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>{children}</span>
}

export function Avatar({ first, last, size = 36 }) {
  const name = `${first}${last}`
  const clr = avatarColor(name)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: 'white', flexShrink: 0 }}>
      {initials(first, last)}
    </div>
  )
}

export function ProgressBar({ value, max = 100, color = '#2563eb' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  )
}

export function MetricCard({ label, value, sub, icon, color = '#2563eb', onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 4 }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

export function FormField({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{hint}</div>}
    </div>
  )
}

export function Input({ ...props }) {
  return <input {...props} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', ...props.style }} />
}

export function Select({ children, ...props }) {
  return <select {...props} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: 'white', ...props.style }}>{children}</select>
}

export function Textarea({ ...props }) {
  return <textarea {...props} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', ...props.style }} />
}

export function Btn({ variant = 'primary', children, ...props }) {
  return <button {...props} style={{ ...btn[variant], ...props.style }}>{children}</button>
}

export function Toast({ message, type = 'success', onClose }) {
  const bg = type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#16a34a'
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: bg, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10 }}>
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }
  const ToastEl = toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null
  return { show, ToastEl }
}

export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>{subtitle}</div>}
      {action}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
          fontSize: 14, fontFamily: 'inherit',
          color: active === tab.id ? '#1e3a5f' : '#64748b',
          fontWeight: active === tab.id ? 600 : 400,
          borderBottom: active === tab.id ? '2px solid #1e3a5f' : '2px solid transparent',
          marginBottom: -1,
        }}>{tab.label}</button>
      ))}
    </div>
  )
}
