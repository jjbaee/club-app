import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, name)
        if (error) throw error
        setMessage('가입 완료! 이메일함에서 인증 링크를 확인해주세요 📬')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않아요.'
        : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-coral text-cream text-2xl font-display font-semibold shadow-warm mb-4">
            🌱
          </div>
          <h1 className="font-display text-3xl font-semibold text-plum">평생학습 동아리</h1>
          <p className="text-muted mt-1 text-sm">
            {mode === 'signin' ? '다시 만나서 반가워요' : '우리 동아리에 오신 걸 환영해요'}
          </p>
        </div>

        <div className="bg-white rounded-xl2 shadow-warm p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-tan bg-cream/50 px-4 py-3 text-plum placeholder:text-muted focus:border-coral focus:outline-none"
              />
            )}
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-tan bg-cream/50 px-4 py-3 text-plum placeholder:text-muted focus:border-coral focus:outline-none"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-tan bg-cream/50 px-4 py-3 text-plum placeholder:text-muted focus:border-coral focus:outline-none"
            />

            {error && <p className="text-sm text-coral-dark bg-coral-light rounded-lg px-3 py-2">{error}</p>}
            {message && <p className="text-sm text-sage bg-sage-light rounded-lg px-3 py-2">{message}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-coral text-white font-semibold py-3 hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              {busy ? '처리 중...' : mode === 'signin' ? '로그인' : '가입하기'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-tan" />
            <span className="text-xs text-muted">또는</span>
            <div className="h-px flex-1 bg-tan" />
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-tan bg-white py-3 font-medium text-plum hover:bg-cream transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
              <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.97H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
            </svg>
            구글로 계속하기
          </button>

          <p className="text-center text-sm text-muted mt-5">
            {mode === 'signin' ? '아직 회원이 아니신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage('') }}
              className="text-coral font-semibold hover:underline"
            >
              {mode === 'signin' ? '가입하기' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
