import { useEffect, useRef, useState } from 'react'
import { Upload, Download, Trash2, FileText } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Files() {
  const { user, isAdmin } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
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
    setUploading(true)
    const path = `${user.id}/${Date.now()}_${file.name}`
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
    })
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
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
    if (!confirm(`"${f.file_name}"을(를) 삭제할까요?`)) return
    await supabase.storage.from('files').remove([f.file_path])
    await supabase.from('files').delete().eq('id', f.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-plum">자료실</h1>
          <p className="text-sm text-muted mt-0.5">동아리 자료를 공유해요</p>
        </div>
        <label className="flex items-center gap-1.5 bg-coral text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-coral-dark transition-colors cursor-pointer">
          <Upload size={16} /> {uploading ? '업로드 중...' : '업로드'}
          <input ref={inputRef} type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      {loading && <p className="text-muted text-sm">불러오는 중...</p>}
      {!loading && files.length === 0 && (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-2">🗂️</p>
          <p>아직 업로드된 자료가 없어요.</p>
        </div>
      )}

      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="bg-white rounded-xl p-4 shadow-warm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-sage-light flex items-center justify-center shrink-0">
                <FileText size={18} className="text-sage" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-plum truncate">{f.file_name}</p>
                <p className="text-xs text-muted">
                  {f.profiles?.name ?? '알 수 없음'} · {new Date(f.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleDownload(f)} className="p-2 rounded-lg hover:bg-coral-light text-muted hover:text-coral-dark">
                <Download size={16} />
              </button>
              {(f.uploader_id === user.id || isAdmin) && (
                <button onClick={() => handleDelete(f)} className="p-2 rounded-lg hover:bg-coral-light text-muted hover:text-coral-dark">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
