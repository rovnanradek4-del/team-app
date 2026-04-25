export const colors = {
  primary: '#1e3a5f',
  primaryLight: '#2563eb',
  accent: '#3b82f6',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  bg: '#f1f5f9',
  bgCard: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  sidebar: '#0f172a',
  sidebarActive: '#1e293b',
  sidebarText: '#94a3b8',
  sidebarTextActive: '#ffffff',
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  club_admin: 'Club Admin',
  head_coach: 'Šéftrenér',
  coach: 'Trenér',
  assistant: 'Asistent',
  player: 'Hráč',
  parent: 'Rodič',
}

export const EVENT_TYPE_LABELS = {
  training: 'Trénink',
  match: 'Zápas',
  tournament: 'Turnaj',
  other: 'Jiná akce',
}

export const EVENT_TYPE_COLORS = {
  training: '#3b82f6',
  match: '#16a34a',
  tournament: '#d97706',
  other: '#8b5cf6',
}

export const ATTENDANCE_LABELS = {
  present: 'Přítomen',
  excused: 'Omluven',
  unexcused: 'Neomluven',
  unknown: 'Neznámo',
}

export const ATTENDANCE_COLORS = {
  present: '#16a34a',
  excused: '#d97706',
  unexcused: '#dc2626',
  unknown: '#94a3b8',
}

export const card = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 16,
}

export const btn = {
  primary: {
    background: '#1e3a5f',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  secondary: {
    background: 'white',
    color: '#1e3a5f',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '9px 18px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  danger: {
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '9px 18px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  success: {
    background: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}

export function avatarColor(str) {
  const colors = ['#1e3a5f','#1d4ed8','#0f766e','#7c3aed','#be185d','#c2410c','#065f46','#92400e']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function initials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase()
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('cs-CZ')
}

export function formatDateShort(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
}
