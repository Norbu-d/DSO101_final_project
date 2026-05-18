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

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

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
      background: 'var(--bg)',
    }}>
      {/* Soft background blobs */}
      <div style={{
        position: 'fixed', top: -100, right: -100,
        width: 340, height: 340, borderRadius: '50%',
        background: 'rgba(124,111,247,0.08)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -80, left: -80,
        width: 260, height: 260, borderRadius: '50%',
        background: 'rgba(40,160,95,0.07)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="animate-fade-up">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56, height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #7c6ff7 0%, #5b4ee0 100%)',
            marginBottom: 14,
            boxShadow: '0 8px 24px rgba(124,111,247,0.25)',
          }}>
            <span style={{ fontSize: 26, color: '#fff' }}>₿</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            TenPhel
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Smart money tracking for students
          </p>
        </div>

        {/* Card */}
        <div
          className="card animate-fade-up"
          style={{ padding: '28px 24px', animationDelay: '80ms' }}
        >
          {/* Step progress bar for register flow */}
          {(step === 'register' || step === 'balance') && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {['register', 'balance'].map((s, i) => (
                <div key={s} style={{
                  flex: 1, height: 3, borderRadius: 2,
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
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Welcome back
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                Sign in to your TenPhel account
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Email
                  </label>
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
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Password
                  </label>
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

                {error && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: '#fff0ec', border: '1px solid rgba(224,90,48,0.25)',
                  }}>
                    <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, marginTop: 4,
                    background: loading ? '#c4b8f7' : 'var(--accent)',
                    color: '#fff', fontWeight: 600, fontSize: 15,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                  suppressHydrationWarning
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('register'); setError('') }}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* REGISTER step 1 */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Create account
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                Step 1 of 2 — Your details
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Full name
                  </label>
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
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Email
                  </label>
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
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Password
                  </label>
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

                {error && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: '#fff0ec', border: '1px solid rgba(224,90,48,0.25)',
                  }}>
                    <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, marginTop: 4,
                    background: 'var(--accent)', color: '#fff',
                    fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer',
                  }}
                  suppressHydrationWarning
                >
                  Continue
                </button>
              </div>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('login'); setError('') }}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* REGISTER step 2 */}
          {step === 'balance' && (
            <form onSubmit={handleFinalRegister}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                How much do you have?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                Step 2 of 2 — Enter your current total funds in Nu.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Current balance (Nu.)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--accent)', fontWeight: 600, fontSize: 14,
                    }}>Nu.</span>
                    <input
                      className="input"
                      type="number"
                      placeholder="1000"
                      value={regBalance}
                      onChange={e => setRegBalance(e.target.value)}
                      min="0"
                      style={{ paddingLeft: 44 }}
                      suppressHydrationWarning
                      autoFocus
                    />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Count everything: cash on hand, bank, everywhere.
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Quick select</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[500, 1000, 2000, 3000, 5000].map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setRegBalance(String(a))}
                        suppressHydrationWarning
                        style={{
                          padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                          border: `1px solid ${regBalance === String(a) ? 'var(--accent)' : 'var(--border)'}`,
                          background: regBalance === String(a) ? 'var(--accent-dim)' : 'var(--bg-muted)',
                          color: regBalance === String(a) ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: regBalance === String(a) ? 500 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        Nu. {a.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: '#fff0ec', border: '1px solid rgba(224,90,48,0.25)',
                  }}>
                    <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12,
                    background: loading ? '#c4b8f7' : 'var(--accent)',
                    color: '#fff', fontWeight: 600, fontSize: 15,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Creating account...' : 'Start tracking'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('register'); setError('') }}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 12,
                    background: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)', fontSize: 14,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
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