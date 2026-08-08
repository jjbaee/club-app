import { NavLink, Outlet } from 'react-router-dom'
import { MessageSquare, Calendar, FolderOpen, Users, LogOut, Megaphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const KAKAO_CHAT_URL = 'https://open.kakao.com/o/g0pBSYDi'

const navItems = [
  { to: '/board', label: '게시판', icon: Megaphone },
  { to: '/calendar', label: '캘린더', icon: Calendar },
  { to: '/files', label: '자료실', icon: FolderOpen },
  { href: KAKAO_CHAT_URL, label: '채팅', icon: MessageSquare, external: true },
  { to: '/members', label: '회원', icon: Users },
]

function BrandLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`${compact ? 'h-8 w-8 text-base' : 'h-9 w-9 text-lg'} rounded-xl bg-coral flex items-center justify-center shrink-0`}>
        🌱
      </div>
      <div className="flex flex-col items-start leading-tight min-w-0">
        <span className={`font-display font-bold text-plum truncate ${compact ? 'text-lg' : 'text-xl'}`}>
          평생학습동아리
        </span>
        <span className="font-display text-muted truncate text-xs">화성시민대학</span>
      </div>
    </div>
  )
}

export default function Layout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream md:flex">
      {/* 데스크탑 사이드바 - 화면에 고정, 콘텐츠 길이와 무관하게 항상 같은 위치 */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col md:border-r md:border-tan bg-white/60 p-5 md:overflow-y-auto">
        <div className="mb-8 px-1">
          <BrandLogo />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-muted hover:bg-coral-light hover:text-plum"
              >
                <item.icon size={18} />
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-coral text-white' : 'text-muted hover:bg-coral-light hover:text-plum'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="border-t border-tan pt-4 mt-4">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="h-8 w-8 rounded-full bg-gold/40 flex items-center justify-center text-sm font-semibold text-plum">
              {profile?.name?.[0] ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-plum truncate">{profile?.name ?? '회원'}</p>
              <p className="text-xs text-muted">{profile?.role === 'admin' ? '관리자' : '일반회원'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm text-muted hover:bg-coral-light hover:text-coral-dark transition-colors"
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일 상단 헤더 - 스크롤과 무관하게 항상 화면 최상단에 고정 */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center bg-white/95 backdrop-blur border-b border-tan px-4 py-2.5">
        <BrandLogo compact />
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 pt-[4.5rem] pb-20 md:pt-0 md:pb-0 md:ml-60">
        <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-tan flex justify-around py-2 z-10">
        {navItems.map((item) =>
          item.external ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium text-muted"
            >
              <item.icon size={20} />
              {item.label}
            </a>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium ${
                  isActive ? 'text-coral' : 'text-muted'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    </div>
  )
}
