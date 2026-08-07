import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function toDateStr(d) {
  // toISOString()은 UTC 기준으로 변환되어 한국(UTC+9) 등에서
  // 자정 근처 날짜가 하루 밀리는 문제가 있어, 로컬 날짜 값을 직접 사용
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalendarPage() {
  const { user, isAdmin } = useAuth()
  const [cursor, setCursor] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents(data ?? [])
  }
  useEffect(() => { load() }, [])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const eventsForDay = (day) => {
    if (!day) return []
    const dateStr = toDateStr(new Date(year, month, day))
    return events.filter(ev => dateStr >= ev.start_date && dateStr <= (ev.end_date || ev.start_date))
  }

  const selectedEvents = events.filter(ev => selectedDate >= ev.start_date && selectedDate <= (ev.end_date || ev.start_date))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim() || null,
      start_date: selectedDate,
      created_by: user.id,
    })
    setTitle(''); setDescription(''); setShowForm(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('이 일정을 삭제할까요?')) return
    await supabase.from('events').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-plum">캘린더</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-coral-light text-plum/60"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-plum w-24 text-center">{year}.{String(month + 1).padStart(2, '0')}</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-coral-light text-plum/60"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="bg-white rounded-xl2 shadow-warm p-4">
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-plum/40 mb-2">
          {WEEKDAYS.map(w => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const dateStr = day ? toDateStr(new Date(year, month, day)) : null
            const dayEvents = eventsForDay(day)
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === toDateStr(new Date())
            return (
              <button
                key={i}
                disabled={!day}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-start pt-1.5 text-sm relative
                  ${!day ? '' : isSelected ? 'bg-coral text-white font-semibold' : isToday ? 'bg-coral-light text-coral-dark font-semibold' : 'hover:bg-cream text-plum'}`}
              >
                {day}
                {dayEvents.length > 0 && (
                  <span className={`h-1.5 w-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-sage'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-plum">{selectedDate} 일정</h2>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-semibold text-coral-dark hover:underline">
            <Plus size={15} /> 일정 추가
          </button>
        </div>
        {selectedEvents.length === 0 && <p className="text-plum/40 text-sm">등록된 일정이 없어요.</p>}
        <div className="space-y-2">
          {selectedEvents.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl p-4 shadow-warm flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-plum">{ev.title}</p>
                {ev.description && <p className="text-sm text-plum/60 mt-0.5">{ev.description}</p>}
              </div>
              <button onClick={() => handleDelete(ev.id)} className="text-plum/30 hover:text-coral-dark shrink-0"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-plum/30 flex items-end md:items-center justify-center z-20">
          <div className="bg-white rounded-t-2xl md:rounded-xl2 w-full md:max-w-md p-6 shadow-warm-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-plum">{selectedDate} 일정 추가</h2>
              <button onClick={() => setShowForm(false)} className="text-plum/40 hover:text-plum"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="일정 제목" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-tan px-4 py-2.5 focus:border-coral focus:outline-none" />
              <textarea placeholder="설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full rounded-xl border border-tan px-4 py-2.5 focus:border-coral focus:outline-none resize-none" />
              <button type="submit" className="w-full bg-coral text-white rounded-xl py-3 font-semibold hover:bg-coral-dark transition-colors">
                추가하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
