import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const scrollAreaRef = useRef(null)

  // 채팅방에 들어올 때 페이지 전체는 항상 맨 위(로고가 보이는 위치)에서 시작
  useEffect(() => {
    window.scrollTo(0, 0)
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
    // 채팅 내부 스크롤 영역만 맨 아래로 이동시키고, 바깥 페이지 스크롤에는 영향 없게 처리
    const el = scrollAreaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await supabase.from('messages').insert({ sender_id: user.id, content })
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-13.5rem)] md:h-[calc(100vh-10.5rem)]">
        <h1 className="font-display text-2xl font-semibold text-plum mb-4">채팅방</h1>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto bg-white rounded-xl2 shadow-warm p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-plum/40 text-sm py-10">첫 메시지를 보내보세요 💬</p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === user.id
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMine && <span className="text-xs text-plum/40 mb-0.5 px-1">{m.profiles?.name ?? '회원'}</span>}
                  <div className={`rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-coral text-white rounded-br-sm' : 'bg-cream text-plum rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 메시지 입력창 - 스크롤과 무관하게 항상 화면 하단에 고정 (모바일 하단탭 바로 위, PC는 화면 맨 아래) */}
      <form
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
