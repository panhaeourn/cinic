import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Query } from '@tanstack/react-query'
import { env } from '../config/env'

const resources = new Set(['patients', 'staff', 'departments', 'appointments', 'queue', 'vitals', 'encounters', 'invoices', 'payments', 'billing-services', 'settings', 'access-control', 'audit-logs', 'reports'])

export function useClinicEvents(userId: string | undefined) {
  const client = useQueryClient()
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    if (!userId) return
    let source: EventSource | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let retry: ReturnType<typeof setTimeout> | undefined
    let probe: AbortController | null = null
    let resumeAt = 0
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
      if (stopped || document.visibilityState === 'hidden' || !navigator.onLine || source || probe) return
      if (Date.now() < resumeAt) { retry = setTimeout(connect, resumeAt - Date.now()); return }
      const stream = new EventSource(env.apiBaseUrl + '/events', { withCredentials: true })
      source = stream
      source.addEventListener('changed', receive as EventListener)
      source.addEventListener('sync', receive as EventListener)
      source.onopen = () => { failures = 0; setUnavailable(false) }
      source.onerror = async () => {
        if (stopped || source !== stream || probe) return
        stream.close(); source = null
        // EventSource hides HTTP status. Probe only on failure to distinguish a
        // missing VPS endpoint from a transient dropped connection.
        const controller = new AbortController()
        probe = controller
        const timeout = setTimeout(() => controller.abort(), 8000)
        let delay = Math.min(30_000, 3000 * 2 ** Math.min(failures++, 4)) + Math.random() * 1000
        try {
          const response = await fetch(env.apiBaseUrl + '/events', {
            credentials: 'include', headers: { Accept: 'text/event-stream' }, signal: controller.signal,
          })
          await response.body?.cancel()
          if (stopped) return
          if ([404, 405, 401, 403].includes(response.status)) {
            setUnavailable(true)
            delay = 5 * 60_000
          }
        } catch {
          // Network errors retain the bounded reconnect backoff.
        } finally {
          clearTimeout(timeout)
          probe = null
        }
        if (!stopped) {
          resumeAt = Date.now() + delay
          retry = setTimeout(connect, delay)
        }
      }
    }
    const visibility = () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine) {
        source?.close(); source = null
        clearTimeout(retry)
        probe?.abort()
      } else {
        clearTimeout(retry)
        retry = setTimeout(connect, Math.max(0, resumeAt - Date.now()))
      }
    }
    connect()
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('online', visibility)
    window.addEventListener('offline', visibility)
    return () => {
      stopped = true
      source?.close()
      probe?.abort()
      clearTimeout(timer); clearTimeout(retry)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('online', visibility)
      window.removeEventListener('offline', visibility)
    }
  }, [client, userId])
  return Boolean(userId) && unavailable
}
