import type { Session as AuthSession } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { createDemoRepo, readDemoName, resetDemo, writeDemoName } from './data/demo'
import { SessionContext, type Session } from './data/RepoContext'
import { createSupabaseRepo, supabase } from './data/supabase'
import { fallbackName } from './lib/username'
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
  const [demoName, setDemoName] = useState(readDemoName)

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
        displayName: (auth.user.user_metadata?.display_name as string | undefined) || fallbackName(auth.user.email),
        // Stored on the account's profile; onAuthStateChange then delivers the updated user.
        setDisplayName: async (name) => {
          const { error } = await client.auth.updateUser({ data: { display_name: name } })
          if (error) throw error
        },
        repo: createSupabaseRepo(client),
        signOut: () => void client.auth.signOut(),
      }
    }
    if (demo) {
      return {
        mode: 'demo',
        displayName: demoName,
        setDisplayName: async (name) => {
          writeDemoName(name)
          setDemoName(name)
        },
        repo: createDemoRepo(),
        signOut: () => {
          writeDemoFlag(false)
          resetDemo()
          setDemoName(readDemoName())
          qc.clear()
          setDemo(false)
        },
      }
    }
    return null
  }, [auth, demo, demoName, qc])

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
