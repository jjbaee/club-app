import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const scrollAreaRef = useRef(null)
  const topBarRef = useRef(null)
  const formRef = useRef(null)
  const [offsets, setOffsets] = useState({ top: 140, bottom: 150 })

  // 채팅방 진입 시 페이지 전체는 항상 맨 위(로고가 보이는 위치)에서 시작
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // 상단바/입력창이 실제 화면에서 차지하는 정확한 픽셀 위치를 계속 측정해서
  // 가운데 채팅 영역이 그 사이 공간만 정확히 차지하도록 고정한다.
  // (고정 rem 추정치 대신 실측이라 어떤 기기·화면 크기에서도 겹치지 않음)
  useEffect(() => {
    const recalc = () => {
      const topEl = topBarRef.current
      const bottomEl = formRef.current
      if (!topEl || !bottomEl) return
      const topPx = topEl.getBoundingClientRect().bottom
      const bottomPx = window.innerHeight - bottomEl.getBoundingClientRect().top
      setOffsets({ top: topPx + 8, bottom: bottomPx + 8 })
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    if (topBarRef.current) ro.observe(topBarRef.current)
    if (formRef.current) ro.observe(formRef.current)
    window.addEventListener('resize', recalc)
    window.addEventListener('orientationchange', recalc)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', recalc)
      window.removeEventListener('orientationchange', recalc)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(name)')
        .order('created_at', { ascending: true })
        .limit(200)
      setMessages(data ?? [])
    }
    load()

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', payload.new.sender_id)
          .single()
        setMessages((prev) => [...prev, { ...payload.new, profiles: data }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    // 채팅 내부 스크롤 영역만 맨 아래로 이동, 바깥 페이지 스크롤에는 영향 없음
    const el = scrollAreaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, offsets])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await supabase.from('messages').insert({ sender_id: user.id, content })
  }

  return (
    <>
      {/* 상단 고정 영역 - 채팅방 제목 (스크롤과 무관) */}
      <div
        ref={topBarRef}
        className="fixed left-0 right-0 top-[4.5rem] md:top-0 md:left-60 z-10 bg-cream px-4 pt-6 pb-3 md:px-8 md:pt-8"
      >
        <h1 className="font-display text-2xl font-semibold text-plum">채팅방</h1>
      </div>

      {/* 중간 고정 영역 - 채팅 내용, 이 영역 안에서만 스크롤됨 */}
      <div
        ref={scrollAreaRef}
        style={{ top: offsets.top, bottom: offsets.bottom }}
        className="fixed left-0 right-0 md:left-60 mx-4 md:mx-8 overflow-y-auto overscroll-contain bg-white rounded-xl2 shadow-warm p-4 space-y-3"
      >
        {messages.length === 0 && (
          <p className="text-center text-muted text-sm py-10">첫 메시지를 보내보세요 💬</p>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === user.id
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMine && <span className="text-xs text-muted mb-0.5 px-1">{m.profiles?.name ?? '회원'}</span>}
                <div className={`rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-coral text-white rounded-br-sm' : 'bg-cream text-plum rounded-bl-sm'}`}>
                  {m.content}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 하단 고정 영역 - 메시지 입력창 (스크롤과 무관) */}
      <form
        ref={formRef}
        onSubmit={handleSend}
        className="fixed left-0 right-0 bottom-16 md:bottom-0 md:left-60 z-20 flex items-center gap-2 bg-cream/95 backdrop-blur border-t border-tan px-4 py-3"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-xl border border-tan bg-white px-4 py-3 focus:border-coral focus:outline-none"
        />
        <button type="submit" className="bg-coral text-white rounded-xl p-3 hover:bg-coral-dark transition-colors shrink-0">
          <Send size={18} />
        </button>
      </form>
    </>
  )
}
