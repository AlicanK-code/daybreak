import { useEffect, useState } from 'react'
import { toDayKey } from '../lib/dates'

/** Current local day key; rolls over at midnight and when the tab regains focus. */
export function useToday(): string {
  const [today, setToday] = useState(toDayKey)
  useEffect(() => {
    const tick = () => setToday(toDayKey())
    const id = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}
