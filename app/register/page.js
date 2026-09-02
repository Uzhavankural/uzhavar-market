'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()

    setMessage('')
    setLoading(true)

   const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      phone: phone,
      role: role,
    },
  },
})

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage(
      'Registration successful! Please check your email to confirm your account.'
    )

    setFullName('')
    setPhone('')
    setEmail('')
    setPassword('')
    setLoading(false)
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          🌾 Uzhavar Market
        </div>

        <h1 style={styles.title}>
          Create Account
        </h1>

        <p style={styles.subtitle}>
          Join Uzhavar Market
        </p>

        <form onSubmit={handleRegister}>

          <label style={styles.label}>
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            placeholder="Enter your full name"
            required
            style={styles.input}
          />


          <label style={styles.label}>
            Phone Number
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="Enter your phone number"
            required
            style={styles.input}
          />


          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            required
            style={styles.input}
          />


          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Create a password"
            required
            minLength={6}
            style={styles.input}
          />


          <label style={styles.label}>
            Account Type
          </label>

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            style={styles.input}
          >
            <option value="customer">
              Customer
            </option>

            <option value="farmer">
              Farmer
            </option>
          </select>


          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading
              ? 'Creating Account...'
              : 'Create Account'}
          </button>

        </form>


        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}


        <p style={styles.loginText}>
          Already have an account?{' '}

          <a
            href="/login"
            style={styles.loginLink}
          >
            Login
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
    color: '#6b7280',
  },

  loginLink: {
    color: '#166534',
    fontWeight: '600',
    textDecoration: 'none',
  },
}