'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { importNote } from '@/api/note/actions'
import Spinner from '@/components/Spinner'

export default function SidebarImport() {
  const router = useRouter()
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)

  const upload = async (e) => {
    const fileInput = e.target
    if (!fileInput.files || fileInput.files.length === 0) {
      console.warn("files list is empty")
      return
    }

    const file = fileInput.files[0]
    setLoading(true)
    try {
      const data = await importNote(file)
      router.push(`/note/${data.uid}`)
    } catch (error) {
      alert('Failed to upload file.')
      console.error(error || "upload error")
    } finally {
      setLoading(false)
    }

    // 重置 file input
    formRef.current?.reset()
  }

  return (
    <form ref={formRef}>
      {loading ? (
        <div className={'edit-button edit-button--outline'} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          Uploading
          <Spinner active={loading} />
        </div>
      ) : (
        <label htmlFor="file">
          <div className={'edit-button edit-button--outline'} style={{ whiteSpace: 'nowrap' }}>Upload .md File</div>
        </label>
      )}
      <input className="offscreen" type="file" id="file" name="file" accept=".md" onChange={upload} />
    </form>
  )
}
