import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Query } from '@tanstack/react-query'
import { env } from '../config/env'

const resources = new Set(['patients', 'staff', 'departments', 'appointments', 'queue', 'vitals', 'encounters', 'invoices', 'payments', 'billing-services', 'settings', 'access-control', 'audit-logs', 'reports'])

export function useClinicEvents(userId: string | undefined) {
  const client = useQueryClient()
  useEffect(() => {
    if (!userId) return
    let source: EventSource | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let retry: ReturnType<typeof setTimeout> | undefined
    let stopped = false
    let failures = 0
    const pending = new Set<string>()
    const receive = (event: MessageEvent<string>) => {
      if (stopped) return
      let changed: unknown
      try { changed = JSON.parse(event.data) } catch { return }
      if (!Array.isArray(changed)) return
      for (const resource of changed) if (resource === '*' || resources.has(resource)) pending.add(resource)
      timer ??= setTimeout(() => {
        const all = pending.has('*')
        const batch = new Set(pending)
        pending.clear()
        timer = undefined
        const matches = (query: Query) => {
          const key = String(query.queryKey[0])
          return resources.has(key) && (all || batch.has(key))
        }
        // An initial fetch has no cached data and cannot be replaced by invalidation.
        // Reconcile once it settles so a write during that fetch is not lost.
        const initialFetches = new Set(client.getQueryCache().findAll({ type: 'active', predicate: matches })
          .filter(query => query.state.fetchStatus === 'fetching' && query.state.data === undefined)
          .map(query => query.queryHash))
        void client.invalidateQueries({ predicate: matches }).then(() => {
          if (!stopped && initialFetches.size) void client.invalidateQueries({ predicate: query => initialFetches.has(query.queryHash) })
        })
        if (batch.has('access-control')) void client.invalidateQueries({ queryKey: ['auth', 'session'] })
      }, 200)
    }
    const connect = () => {
      if (stopped || document.visibilityState === 'hidden' || !navigator.onLine || source) return
      source = new EventSource(env.apiBaseUrl + '/events', { withCredentials: true })
      source.addEventListener('changed', receive as EventListener)
      source.addEventListener('sync', receive as EventListener)
      source.onopen = () => { failures = 0 }
      source.onerror = () => {
        // Recreate even when a proxy closes the stream with an HTTP error.
        source?.close(); source = null
        if (!stopped) retry = setTimeout(connect, Math.min(30_000, 3000 * 2 ** Math.min(failures++, 4)) + Math.random() * 1000)
      }
    }
    const visibility = () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine) {
        source?.close(); source = null
        clearTimeout(retry)
      } else connect()
    }
    connect()
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('online', visibility)
    window.addEventListener('offline', visibility)
    return () => {
      stopped = true
      source?.close()
      clearTimeout(timer); clearTimeout(retry)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('online', visibility)
      window.removeEventListener('offline', visibility)
    }
  }, [client, userId])
}
