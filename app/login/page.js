'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()

    setMessage('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('PROFILE ERROR:', profileError)
      setMessage('Profile not found.')
      setLoading(false)
      return
    }

    setMessage('Login successful!')

    setEmail('')
    setPassword('')
    setLoading(false)

    if (profile.role === 'admin') {
      router.push('/admin')
    } else if (profile.role === 'farmer') {
      router.push('/farmer')
    } else {
      router.push('/')
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logo}>
          🌾 Uzhavar Market
        </div>

        <h1 style={styles.title}>
          Welcome Back
        </h1>

        <p style={styles.subtitle}>
          Login to your account
        </p>

        <form onSubmit={handleLogin}>

          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={styles.input}
          />

          <label style={styles.label}>
            Password
          </label>

          {/* Password Input with Eye Button */}
          <div style={styles.passwordWrapper}>

            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={styles.passwordInput}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? '🙈' : '👁️'}
            </button>

          </div>

          <p style={styles.forgotText}>
            <a
              href="/forgot-password"
              style={styles.forgotLink}
            >
              Forgot Password?
            </a>
          </p>

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

        <p style={styles.registerText}>
          Don't have an account?{' '}

          <a
            href="/register"
            style={styles.registerLink}
          >
            Create Account
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

  /* Password input wrapper */
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },

  /* Password input */
  passwordInput: {
    width: '100%',
    padding: '12px',
    paddingRight: '48px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },

  /* Eye button */
  eyeButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  forgotText: {
    textAlign: 'right',
    marginTop: '10px',
    marginBottom: '5px',
    fontSize: '14px',
  },

  forgotLink: {
    color: '#166534',
    fontWeight: '600',
    textDecoration: 'none',
  },

  button: {
    width: '100%',
    padding: '13px',
    marginTop: '20px',
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

  registerText: {
    textAlign: 'center',
    marginTop: '25px',
    fontSize: '14px',
    color: '#6b7280',
  },

  registerLink: {
    color: '#166534',
    fontWeight: '600',
    textDecoration: 'none',
  },
}