import { useEffect, useState } from 'react'
import { Plus, Pin, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Board() {
  const { user, profile, isAdmin } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isNotice, setIsNotice] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:author_id(name)')
      .order('is_notice', { ascending: false })
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    await supabase.from('posts').insert({
      author_id: user.id,
      title: title.trim(),
      content: content.trim(),
      is_notice: isAdmin ? isNotice : false,
    })
    setTitle(''); setContent(''); setIsNotice(false); setShowForm(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('이 글을 삭제할까요?')) return
    await supabase.from('posts').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-plum">게시판</h1>
          <p className="text-sm text-plum/50 mt-0.5">공지사항과 소식을 나눠요</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-coral text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-coral-dark transition-colors"
        >
          <Plus size={16} /> 글쓰기
        </button>
      </div>

      {loading && <p className="text-plum/40 text-sm">불러오는 중...</p>}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16 text-plum/40">
          <p className="text-4xl mb-2">📭</p>
          <p>아직 글이 없어요. 첫 글을 남겨보세요!</p>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className={`rounded-xl2 p-5 shadow-warm ${post.is_notice ? 'bg-gold/15 border border-gold/40' : 'bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {post.is_notice && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-coral-dark bg-coral-light rounded-full px-2 py-0.5">
                      <Pin size={11} /> 공지
                    </span>
                  )}
                  <h3 className="font-semibold text-plum truncate">{post.title}</h3>
                </div>
                <p className="text-plum/70 text-sm whitespace-pre-wrap">{post.content}</p>
                <p className="text-xs text-plum/40 mt-3">
                  {post.profiles?.name ?? '알 수 없음'} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {(post.author_id === user.id || isAdmin) && (
                <button onClick={() => handleDelete(post.id)} className="text-plum/30 hover:text-coral-dark shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-plum/30 flex items-end md:items-center justify-center z-20 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-xl2 w-full md:max-w-md p-6 shadow-warm-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-plum">새 글 작성</h2>
              <button onClick={() => setShowForm(false)} className="text-plum/40 hover:text-plum"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-tan px-4 py-2.5 focus:border-coral focus:outline-none"
              />
              <textarea
                placeholder="내용을 입력하세요" value={content} onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-tan px-4 py-2.5 focus:border-coral focus:outline-none resize-none"
              />
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm text-plum/70">
                  <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} className="accent-coral" />
                  공지사항으로 등록
                </label>
              )}
              <button type="submit" className="w-full bg-coral text-white rounded-xl py-3 font-semibold hover:bg-coral-dark transition-colors">
                등록하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
