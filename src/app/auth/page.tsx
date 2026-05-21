'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signUp } from '@/lib/db'

type Step = 'login' | 'register' | 'balance'

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(() =>
    searchParams.get('step') === 'register' ? 'register' : 'login'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regBalance, setRegBalance] = useState('')

  const balanceInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'balance' && balanceInputRef.current) {
      setTimeout(() => {
        balanceInputRef.current?.focus()
      }, 100)
    }
  }, [step])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      setError('Please enter both email and password')
      return
    }
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
    if (!regEmail.trim()) { setError('Email is required'); return }
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

  const handleQuickBalance = (amount: number) => {
    setRegBalance(String(amount))
  }

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setRegBalance(value)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', top: -150, right: -150,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -100, left: -100,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(40,160,95,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="animate-fade-up">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 70,
            height: 70,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #7c6ff7 0%, #5b4ee0 100%)',
            marginBottom: 16,
            boxShadow: '0 10px 30px rgba(124,111,247,0.3)',
          }}>
            <span style={{ fontSize: 32, color: '#fff', fontWeight: 700 }}>₿</span>
          </div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #7c6ff7, #a89eff)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.5px',
            marginBottom: 8
          }}>
            TenPhel
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Smart money tracking for students
          </p>
        </div>

        {/* Auth Card */}
        <div
          className="card animate-fade-up"
          style={{ 
            padding: '32px 28px',
            background: 'var(--bg-card)',
            borderRadius: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Progress Steps */}
          {(step === 'register' || step === 'balance') && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {['Details', 'Balance'].map((label, i) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: (step === 'balance' && i === 0) || (step === 'register' && i === 0)
                        ? 'var(--accent)'
                        : 'var(--bg-muted)',
                      color: (step === 'balance' && i === 0) || (step === 'register' && i === 0)
                        ? '#fff'
                        : 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 6,
                      border: '1px solid var(--border)',
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ 
                      fontSize: 11, 
                      color: (step === 'balance' && i === 0) || (step === 'register' && i === 0)
                        ? 'var(--accent)'
                        : 'var(--text-muted)',
                      fontWeight: 500
                    }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: (step === 'balance' && i === 0) || (step === 'register' && i === 0)
                      ? 'var(--accent)'
                      : 'var(--border)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {step === 'login' && (
            <form onSubmit={handleLogin}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
                Sign in to your account
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Email Address
                  </label>
                  <input
                    className="input"
                    type="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    style={{ 
                      padding: '13px 16px', 
                      fontSize: 15,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      width: '100%',
                      outline: 'none',
                    }}
                    suppressHydrationWarning
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Password
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    style={{ 
                      padding: '13px 16px', 
                      fontSize: 15,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      width: '100%',
                      outline: 'none',
                    }}
                    suppressHydrationWarning
                  />
                </div>

                {error && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--red-dim)',
                    border: '1px solid var(--red-dim)',
                  }}>
                    <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ 
                    marginTop: 8,
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                  suppressHydrationWarning
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 24 }}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('register'); setError(''); setRegName(''); setRegEmail(''); setRegPassword(''); }}
                  style={{ 
                    color: 'var(--accent)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: 13, 
                    fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  Create Account
                </button>
              </p>
            </form>
          )}

          {/* REGISTER Step 1 */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Create account
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
                Enter your details to get started
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Full Name
                  </label>
                  <input
                    className="input"
                    type="text"
                    inputMode="text"
                    placeholder="Sonam Wangchuk"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    required
                    style={{ 
                      padding: '13px 16px', 
                      fontSize: 15,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      width: '100%',
                      outline: 'none',
                    }}
                    suppressHydrationWarning
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Email Address
                  </label>
                  <input
                    className="input"
                    type="email"
                    inputMode="email"
                    placeholder="you@rub.edu.bt"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                    style={{ 
                      padding: '13px 16px', 
                      fontSize: 15,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      width: '100%',
                      outline: 'none',
                    }}
                    suppressHydrationWarning
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Password
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ 
                      padding: '13px 16px', 
                      fontSize: 15,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      width: '100%',
                      outline: 'none',
                    }}
                    suppressHydrationWarning
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Password must be at least 6 characters
                  </p>
                </div>

                {error && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--red-dim)',
                    border: '1px solid var(--red-dim)',
                  }}>
                    <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ 
                    marginTop: 8,
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  suppressHydrationWarning
                >
                  Continue
                </button>
              </div>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 24 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('login'); setError(''); }}
                  style={{ 
                    color: 'var(--accent)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: 13, 
                    fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* REGISTER Step 2 - Balance */}
          {step === 'balance' && (
            <form onSubmit={handleFinalRegister}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Initial Balance
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
                Enter your current total funds in Ngultrum (Nu.)
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Current Balance (Nu.)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--accent)', fontWeight: 600, fontSize: 16,
                    }}>Nu.</span>
                    <input
                      ref={balanceInputRef}
                      className="input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={regBalance}
                      onChange={handleBalanceChange}
                      style={{ 
                        paddingLeft: 56, 
                        paddingRight: 16,
                        paddingTop: 14,
                        paddingBottom: 14,
                        fontSize: 18, 
                        fontWeight: 600,
                        fontFamily: 'DM Mono, monospace',
                        textAlign: 'right',
                        background: 'var(--bg-muted)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        color: 'var(--text-primary)',
                        width: '100%',
                        outline: 'none',
                      }}
                      suppressHydrationWarning
                    />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    Include cash on hand, bank balance, and any other funds
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 500 }}>
                    Quick Select
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[500, 1000, 2000, 3000, 5000, 10000].map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleQuickBalance(a)}
                        suppressHydrationWarning
                        style={{
                          padding: '12px 8px',
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: `1.5px solid ${regBalance === String(a) ? 'var(--accent)' : 'var(--border)'}`,
                          background: regBalance === String(a) ? 'var(--accent-dim)' : 'var(--bg-muted)',
                          color: regBalance === String(a) ? 'var(--accent)' : 'var(--text-secondary)',
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
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--red-dim)',
                    border: '1px solid var(--red-dim)',
                  }}>
                    <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ 
                    marginTop: 8,
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Creating Account...' : 'Start Tracking'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('register'); setError(''); }}
                  className="btn-secondary"
                  style={{ 
                    marginTop: 0,
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    padding: '14px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, marginTop: 24 }}>
          Built for Bhutanese Students · CST, Phuntsholing
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  )
}