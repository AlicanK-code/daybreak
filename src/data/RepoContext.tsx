import { createContext, useContext } from 'react'
import type { Repo } from './repo'

export interface Session {
  mode: 'supabase' | 'demo'
  displayName: string
  repo: Repo
  signOut: () => void
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const s = useContext(SessionContext)
  if (!s) throw new Error('useSession must be used inside SessionContext')
  return s
}

export const useRepo = () => useSession().repo
