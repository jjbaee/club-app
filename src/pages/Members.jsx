import { useEffect, useState } from 'react'
import { Shield, User } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Members() {
  const { isAdmin, user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setMembers(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleRole = async (member) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    if (!confirm(`${member.name}님을 ${newRole === 'admin' ? '관리자로' : '일반회원으로'} 변경할까요?`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', member.id)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-plum">회원목록</h1>
        <p className="text-sm text-muted mt-0.5">총 {members.length}명의 회원이 함께하고 있어요</p>
      </div>

      {loading && <p className="text-muted text-sm">불러오는 중...</p>}

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-xl p-4 shadow-warm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-gold/40 flex items-center justify-center font-semibold text-plum shrink-0">
                {m.name?.[0] ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-plum truncate flex items-center gap-1.5">
                  {m.name}
                  {m.id === user.id && <span className="text-xs text-muted">(나)</span>}
                </p>
                <p className="text-xs text-muted">
                  {new Date(m.created_at).toLocaleDateString('ko-KR')} 가입
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {isAdmin && m.id !== user.id ? (
                <button
                  onClick={() => toggleRole(m)}
                  className={`flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
                    m.role === 'admin' ? 'bg-coral text-white hover:bg-coral-dark' : 'bg-cream text-muted hover:bg-coral-light'
                  }`}
                >
                  {m.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                  {m.role === 'admin' ? '관리자' : '일반회원'}
                </button>
              ) : (
                <span className={`flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 ${
                  m.role === 'admin' ? 'bg-coral-light text-coral-dark' : 'bg-cream text-muted'
                }`}>
                  {m.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                  {m.role === 'admin' ? '관리자' : '일반회원'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
