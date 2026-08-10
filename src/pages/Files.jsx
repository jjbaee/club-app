import { useEffect, useRef, useState } from 'react'
import { Upload, Download, Trash2, FileText, Link2, ExternalLink, X, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// 이 크기를 넘는 파일을 직접 업로드하려 하면, 링크 추가를 권장하는 안내를 띄운다.
// (Supabase 무료 플랜 스토리지 총량이 1GB이므로 큰 파일이 누적되면 금방 찬다)
const LARGE_FILE_WARNING_MB = 20

export default function Files() {
  const { user, isAdmin } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkSaving, setLinkSaving] = useState(false)
  const inputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('files')
      .select('*, profiles:uploader_id(name)')
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > LARGE_FILE_WARNING_MB) {
      const proceed = confirm(
        `이 파일은 약 ${sizeMB.toFixed(0)}MB예요. 저장 공간이 넉넉하지 않으니(전체 1GB), ` +
        `큰 파일은 구글 드라이브 등에 올리고 "링크 추가"로 공유하는 걸 추천해요.\n\n` +
        `그래도 직접 업로드할까요?`
      )
      if (!proceed) {
        if (inputRef.current) inputRef.current.value = ''
        return
      }
    }

    setUploading(true)
    // Supabase Storage 경로(key)는 한글을 포함한 일부 문자를 허용하지 않아
    // "Invalid key" 오류가 날 수 있다. 저장 경로는 확장자만 남긴 영문/숫자 조합으로
    // 안전하게 만들고, 화면에 보여줄 원래 파일명(한글 포함)은 DB의 file_name에 그대로 저장한다.
    const extMatch = file.name.match(/\.[a-zA-Z0-9]+$/)
    const ext = extMatch ? extMatch[0] : ''
    const safeId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    const path = `${user.id}/${safeId}`
    const { error: uploadError } = await supabase.storage.from('files').upload(path, file)
    if (uploadError) {
      alert('업로드 실패: ' + uploadError.message)
      setUploading(false)
      return
    }
    await supabase.from('files').insert({
      title: file.name,
      file_path: path,
      file_name: file.name,
      uploader_id: user.id,
      source_type: 'upload',
    })
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    load()
  }

  const handleAddLink = async (e) => {
    e.preventDefault()
    if (!linkTitle.trim() || !linkUrl.trim()) return
    let url = linkUrl.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    setLinkSaving(true)
    await supabase.from('files').insert({
      title: linkTitle.trim(),
      link_url: url,
      uploader_id: user.id,
      source_type: 'link',
    })
    setLinkSaving(false)
    setLinkTitle(''); setLinkUrl(''); setShowLinkForm(false)
    load()
  }

  const handleDownload = async (f) => {
    const { data, error } = await supabase.storage.from('files').download(f.file_path)
    if (error) { alert('다운로드 실패: ' + error.message); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url; a.download = f.file_name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (f) => {
    const label = f.source_type === 'link' ? f.title : f.file_name
    if (!confirm(`"${label}"을(를) 삭제할까요?`)) return
    if (f.source_type === 'upload' && f.file_path) {
      await supabase.storage.from('files').remove([f.file_path])
    }
    await supabase.from('files').delete().eq('id', f.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-plum">자료실</h1>
          <p className="text-sm text-muted mt-0.5">동아리 자료를 공유해요</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowLinkForm(true)}
            className="flex items-center gap-1.5 bg-white border border-tan text-plum rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-coral-light transition-colors"
          >
            <Link2 size={16} /> 링크 추가
          </button>
          <label className="flex items-center gap-1.5 bg-coral text-white rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-coral-dark transition-colors cursor-pointer">
            <Upload size={16} /> {uploading ? '업로드 중...' : '업로드'}
            <input ref={inputRef} type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>

      <p className="text-xs text-muted mb-4 -mt-2">
        큰 용량의 파일(영상, 고화질 이미지 모음 등)은 구글 드라이브에 올린 뒤 "링크 추가"로 공유해주세요.
      </p>

      {loading && <p className="text-muted text-sm">불러오는 중...</p>}
      {!loading && files.length === 0 && (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-2">🗂️</p>
          <p>아직 업로드된 자료가 없어요.</p>
        </div>
      )}

      <div className="space-y-2">
        {files.map((f) => {
          const isLink = f.source_type === 'link'
          return (
            <div key={f.id} className="bg-white rounded-xl p-4 shadow-warm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isLink ? 'bg-gold/20' : 'bg-sage-light'}`}>
                  {isLink ? <Link2 size={18} className="text-coral-dark" /> : <FileText size={18} className="text-sage" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-plum truncate">{isLink ? f.title : f.file_name}</p>
                  <p className="text-xs text-muted">
                    {isLink ? '외부 링크' : '파일'} · {f.profiles?.name ?? '알 수 없음'} · {new Date(f.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isLink ? (
                  <a
                    href={f.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-coral-light text-muted hover:text-coral-dark"
                  >
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <button onClick={() => handleDownload(f)} className="p-2 rounded-lg hover:bg-coral-light text-muted hover:text-coral-dark">
                    <Download size={16} />
                  </button>
                )}
                {(f.uploader_id === user.id || isAdmin) && (
                  <button onClick={() => handleDelete(f)} className="p-2 rounded-lg hover:bg-coral-light text-muted hover:text-coral-dark">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showLinkForm && (
        <div className="fixed inset-0 bg-plum/30 flex items-end md:items-center justify-center z-20 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-xl2 w-full md:max-w-md p-6 shadow-warm-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-plum">외부 링크 추가</h2>
              <button onClick={() => setShowLinkForm(false)} className="text-muted hover:text-plum"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted mb-4">
              구글 드라이브, 네이버 클라우드 등에 올린 자료의 <b>공유 링크</b>를 붙여넣어주세요.
              (구글 드라이브의 경우 파일 우클릭 → 공유 → "링크 보기" 권한을 "링크가 있는 모든 사용자"로 설정한 뒤 링크를 복사하세요.)
            </p>
            <form onSubmit={handleAddLink} className="space-y-3">
              <input
                type="text" placeholder="자료 제목 (예: 2026 여름 워크숍 사진)" value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full rounded-xl border border-tan px-4 py-2.5 focus:border-coral focus:outline-none"
              />
              <input
                type="text" placeholder="https://drive.google.com/..." value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full rounded-xl border border-tan px-4 py-2.5 focus:border-coral focus:outline-none"
              />
              <button
                type="submit" disabled={linkSaving}
                className="w-full flex items-center justify-center gap-1.5 bg-coral text-white rounded-xl py-3 font-semibold hover:bg-coral-dark transition-colors disabled:opacity-50"
              >
                <Plus size={16} /> {linkSaving ? '추가 중...' : '링크 추가하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
