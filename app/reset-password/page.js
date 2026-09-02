'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()

    setMessage('')

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Password updated successfully! You can now login.')

    setPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logo}>
          🌾 Uzhavar Market
        </div>

        <h1 style={styles.title}>
          Reset Password
        </h1>

        <p style={styles.subtitle}>
          Create a new password for your account.
        </p>

        <form onSubmit={handleReset}>

          <label style={styles.label}>
            New Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
            style={styles.input}
          />

          <label style={styles.label}>
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

        </form>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

        <p style={styles.loginText}>
          <a
            href="/login"
            style={styles.loginLink}
          >
            Back to Login
          </a>
        </p>

      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f7f8f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '30px 20px',
    fontFamily: 'Arial, sans-serif',
  },

  card: {
    width: '100%',
    maxWidth: '450px',
    background: '#ffffff',
    padding: '35px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },

  logo: {
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: '#166534',
    marginBottom: '25px',
  },

  title: {
    textAlign: 'center',
    fontSize: '30px',
    margin: '0 0 8px',
    color: '#1f2937',
  },

  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '30px',
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '7px',
    marginTop: '16px',
    color: '#374151',
  },

  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },

  button: {
    width: '100%',
    padding: '13px',
    marginTop: '25px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  message: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#166534',
  },

  loginText: {
    textAlign: 'center',
    marginTop: '25px',
    fontSize: '14px',
  },

  loginLink: {
    color: '#166534',
    fontWeight: '600',
    textDecoration: 'none',
  },
}