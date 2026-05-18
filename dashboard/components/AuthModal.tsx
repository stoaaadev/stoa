'use client'

import { useState } from 'react'

interface AuthModalProps {
  onClose: () => void
  onAuth: (success: boolean) => void
}

export function AuthModal({ onClose, onAuth }: AuthModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (data.authenticated) {
        onAuth(true)
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 p-6 rounded-lg bg-surface-raised border border-border-dim shadow-2xl">
        <h2 className="text-sm font-bold mb-1">Authenticate</h2>
        <p className="text-xs text-text-muted mb-5">
          Enter the dashboard password to access protected operations.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full px-3 py-2.5 rounded bg-surface border border-border-dim text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />

          {error && (
            <div className="mt-2 text-xs text-red-400">{error}</div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-xs font-bold rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Authenticate'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded border border-border-dim text-text-muted hover:text-text-primary hover:border-border-bright transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
