'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/db'

type Step = 'login' | 'register' | 'balance'

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regBalance, setRegBalance] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(loginEmail, loginPassword)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim()) { setError('Name is required'); return }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setStep('balance')
    setError('')
  }

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const balance = parseFloat(regBalance)
    if (isNaN(balance) || balance < 0) { setError('Enter a valid balance'); return }
    setLoading(true)
    setError('')
    try {
      await signUp(regEmail, regPassword, regName, balance)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setStep('register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(232,160,32,0.06) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-up">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'var(--accent)',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 24 }}>₹</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            TenPhel
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Smart money tracking for students
          </p>
        </div>

        {/* Card */}
        <div className="card animate-fade-up" style={{ padding: 24, animationDelay: '80ms' }}>

          {/* Step indicator for register flow */}
          {(step === 'register' || step === 'balance') && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
              {['register', 'balance'].map((s, i) => (
                <div key={s} style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: (step === 'balance' && i === 0) || step === s
                    ? 'var(--accent)'
                    : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}

          {/* LOGIN */}
          {step === 'login' && (
            <form onSubmit={handleLogin}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Welcome back</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Sign in to your TenPhel account
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    suppressHydrationWarning
                  />
                </div>

                {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>{error}</p>}

                <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }} suppressHydrationWarning>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('register'); setError('') }}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                  suppressHydrationWarning
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* REGISTER - Step 1 */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Create account</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Step 1 of 2 — Your details
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Full name</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Sonam Wangchuk"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@rub.edu.bt"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    suppressHydrationWarning
                  />
                </div>

                {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}

                <button className="btn-primary" type="submit" style={{ marginTop: 4 }} suppressHydrationWarning>
                  Continue
                </button>
              </div>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('login'); setError('') }}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                  suppressHydrationWarning
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* REGISTER - Step 2: Balance */}
          {step === 'balance' && (
            <form onSubmit={handleFinalRegister}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>How much do you have?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Step 2 of 2 — Enter your current total funds in Nu. No bank needed.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                    Current balance (Nu.)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      fontSize: 14,
                    }}>Nu.</span>
                    <input
                      className="input"
                      type="number"
                      placeholder="1000"
                      value={regBalance}
                      suppressHydrationWarning
                      onChange={e => setRegBalance(e.target.value)}
                      min="0"
                      style={{ paddingLeft: 44 }}
                      autoFocus
                    />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Count everything: cash on hand, in your account, everywhere.
                  </p>
                </div>

                {/* Quick select */}
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Quick select</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[500, 1000, 2000, 3000, 5000].map(a => (
                      <button
                        key={a}
                        type="button"
                        className="chip"
                        onClick={() => setRegBalance(String(a))}
                        suppressHydrationWarning
                        style={regBalance === String(a) ? {
                          background: 'var(--accent-dim)',
                          borderColor: 'var(--accent)',
                          color: 'var(--accent)',
                        } : {}}
                      >
                        Nu. {a.toLocaleString()}
                      </button>
                    ))} suppressHydrationWarning
                  </div>
                </div>

                {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}

                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Start tracking →'}
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setStep('register'); setError('') }}
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, marginTop: 20 }}>
          Built for Bhutanese students · CST, Phuntsholing
        </p>
      </div>
    </div>
  )
}
