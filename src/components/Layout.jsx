import { NavLink, Outlet } from 'react-router-dom'
import { MessageSquare, Calendar, FolderOpen, Users, LogOut, Megaphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/board', label: '게시판', icon: Megaphone },
  { to: '/calendar', label: '캘린더', icon: Calendar },
  { to: '/files', label: '자료실', icon: FolderOpen },
  { to: '/chat', label: '채팅', icon: MessageSquare },
  { to: '/members', label: '회원', icon: Users },
]

export default function Layout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream md:flex">
      {/* 데스크탑 사이드바 - 화면에 고정, 콘텐츠 길이와 무관하게 항상 같은 위치 */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col md:border-r md:border-tan bg-white/60 p-5 md:overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 px-1">
          <div className="h-9 w-9 rounded-xl bg-coral flex items-center justify-center text-lg">🌱</div>
          <span className="font-display text-xl font-semibold text-plum">평생학습 동아리</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-coral text-white' : 'text-plum/70 hover:bg-coral-light hover:text-plum'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-tan pt-4 mt-4">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="h-8 w-8 rounded-full bg-gold/40 flex items-center justify-center text-sm font-semibold text-plum">
              {profile?.name?.[0] ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-plum truncate">{profile?.name ?? '회원'}</p>
              <p className="text-xs text-plum/50">{profile?.role === 'admin' ? '관리자' : '일반회원'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm text-plum/60 hover:bg-coral-light hover:text-coral-dark transition-colors"
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일 상단 헤더 - 스크롤과 무관하게 항상 화면 최상단에 고정 */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center gap-2 bg-white/95 backdrop-blur border-b border-tan px-4 py-3">
        <div className="h-8 w-8 rounded-lg bg-coral flex items-center justify-center text-base shrink-0">🌱</div>
        <span className="font-display text-lg font-semibold text-plum truncate">평생학습 동아리</span>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 pt-16 pb-20 md:pt-0 md:pb-0 md:ml-60">
        <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-tan flex justify-around py-2 z-10">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium ${
                isActive ? 'text-coral' : 'text-plum/50'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
