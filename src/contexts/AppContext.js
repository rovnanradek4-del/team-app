import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './AuthContext'

const AppContext = createContext({})

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [club, setClub] = useState(null)
  const [season, setSeason] = useState(null)
  const [team, setTeam] = useState(null)
  const [clubs, setClubs] = useState([])
  const [seasons, setSeasons] = useState([])
  const [categories, setCategories] = useState([])
  const [teams, setTeams] = useState([])

  useEffect(() => {
    if (user) loadClubs()
  }, [user])

  useEffect(() => {
    if (club) loadSeasons(club.id)
  }, [club])

  useEffect(() => {
    if (season) loadCategories(season.id)
  }, [season])

  async function loadClubs() {
    const { data } = await supabase.from('clubs').select('*').eq('is_active', true)
    setClubs(data || [])
    if (data?.length > 0 && !club) setClub(data[0])
  }

  async function loadSeasons(clubId) {
    const { data } = await supabase.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false })
    setSeasons(data || [])
    const active = data?.find(s => s.is_active) || data?.[0]
    if (active) setSeason(active)
  }

  async function loadCategories(seasonId) {
    const { data: cats } = await supabase.from('categories').select('*, teams(*)').eq('season_id', seasonId).order('sort_order')
    setCategories(cats || [])
    const allTeams = cats?.flatMap(c => c.teams || []) || []
    setTeams(allTeams)
    if (allTeams.length > 0 && !team) setTeam(allTeams[0])
  }

  async function createClub(clubData) {
    const { data, error } = await supabase.from('clubs').insert([clubData]).select().single()
    if (!error) { setClubs(prev => [...prev, data]); setClub(data) }
    return { data, error }
  }

  async function createSeason(seasonData) {
    const { data, error } = await supabase.from('seasons').insert([{ ...seasonData, club_id: club.id }]).select().single()
    if (!error) { setSeasons(prev => [...prev, data]); setSeason(data) }
    return { data, error }
  }

  async function createCategory(catData) {
    const { data, error } = await supabase.from('categories').insert([{ ...catData, club_id: club.id, season_id: season.id }]).select().single()
    if (!error) setCategories(prev => [...prev, { ...data, teams: [] }])
    return { data, error }
  }

  async function createTeam(teamData) {
    const { data, error } = await supabase.from('teams').insert([{ ...teamData, club_id: club.id }]).select().single()
    if (!error) { setTeams(prev => [...prev, data]); if (!team) setTeam(data) }
    return { data, error }
  }

  return (
    <AppContext.Provider value={{
      club, setClub, clubs,
      season, setSeason, seasons,
      team, setTeam, teams,
      categories,
      createClub, createSeason, createCategory, createTeam,
      reload: () => club && loadSeasons(club.id)
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
