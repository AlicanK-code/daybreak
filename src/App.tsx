import type { Session as AuthSession } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { createDemoRepo, resetDemo } from './data/demo'
import { SessionContext, type Session } from './data/RepoContext'
import { createSupabaseRepo, supabase } from './data/supabase'
import { AuthScreen } from './views/AuthScreen'
import { Shell } from './views/Shell'

const DEMO_FLAG = 'questlog-demo-mode'

function readDemoFlag() {
  try {
    return localStorage.getItem(DEMO_FLAG) === '1'
  } catch {
    return false
  }
}

function writeDemoFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(DEMO_FLAG, '1')
    else localStorage.removeItem(DEMO_FLAG)
  } catch {
    /* ignore */
  }
}

export default function App() {
  const qc = useQueryClient()
  const [auth, setAuth] = useState<AuthSession | null>(null)
  const [authLoading, setAuthLoading] = useState(!!supabase)
  const [demo, setDemo] = useState(readDemoFlag)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setAuth(data.session)
      setAuthLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth((prev) => {
        // Different user (or signed out) → drop any cached data from the previous one.
        if (prev?.user.id !== session?.user.id) qc.clear()
        return session
      })
    })
    return () => data.subscription.unsubscribe()
  }, [qc])

  const session = useMemo<Session | null>(() => {
    if (auth && supabase) {
      const client = supabase
      return {
        mode: 'supabase',
        displayName: (auth.user.user_metadata?.display_name as string | undefined) ?? auth.user.email?.split('@')[0] ?? 'Adventurer',
        repo: createSupabaseRepo(client),
        signOut: () => void client.auth.signOut(),
      }
    }
    if (demo) {
      return {
        mode: 'demo',
        displayName: 'Demo Adventurer',
        repo: createDemoRepo(),
        signOut: () => {
          writeDemoFlag(false)
          resetDemo()
          qc.clear()
          setDemo(false)
        },
      }
    }
    return null
  }, [auth, demo, qc])

  if (authLoading) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted" role="status">
        Loading…
      </div>
    )
  }

  if (!session) {
    return (
      <AuthScreen
        onDemo={() => {
          qc.clear()
          writeDemoFlag(true)
          setDemo(true)
        }}
      />
    )
  }

  return (
    <SessionContext.Provider value={session}>
      <Shell />
    </SessionContext.Provider>
  )
}
