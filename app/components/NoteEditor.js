'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteNote, saveNote } from '@/api/note/actions'
import NotePreview from '@/components/NotePreview'

export default function NoteEditor({
  noteId,
  initialTitle,
  initialBody
}) {
  const { pending } = useFormStatus()
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)

  const isEdit = !!noteId

  const save = async (formData) => {
    const res = await saveNote(formData)
    if (!res.success) alert(res.message)
  }

  return (
    <div className="note-editor">
      <form className="note-editor-form" autoComplete="off">
        <div className="note-editor-menu" role="menubar">
          <input type="hidden" name="noteId" value={noteId} />
          <button
            className="note-editor-done"
            type="submit"
            formAction={save}
            disabled={pending}
            role="menuitem"
          >
            <img
              src="/checkmark.svg"
              width="14px"
              height="10px"
              alt=""
              role="presentation"
            />
            {pending ? 'Saving' : 'Done'}
          </button>
          {isEdit &&
            (<button
              className="note-editor-delete"
              disabled={pending}
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this note?'))
                  e.preventDefault(), e.stopPropagation()
              }}
              formAction={deleteNote}
              role="menuitem"
            >
              <img
                src="/cross.svg"
                width="10px"
                height="10px"
                alt=""
                role="presentation"
              />
              Delete
            </button>)}
        </div>
        <label className="offscreen" htmlFor="note-title-input">
          Enter a title for your note
        </label>
        <input
          id="note-title-input"
          type="text"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
          }}
        />
        <label className="offscreen" htmlFor="note-body-input">
          Enter the body for your note
        </label>
        <textarea
          name="body"
          value={body}
          style={{ resize: 'none' }}
          id="note-body-input"
          onChange={(e) => setBody(e.target.value)}
        />
      </form>
      <div className="note-editor-preview">
        <div className="label label--preview" role="status">
          Preview
        </div>
        <h1 className="note-title">{title}</h1>
        <NotePreview>{body}</NotePreview>
      </div>
    </div>
  )
}

