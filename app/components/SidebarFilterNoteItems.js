'use client'

import { useSearchParams } from 'next/navigation'
import SidebarNoteItemContent from '@/components/SidebarNoteItemContent'

export default function SidebarFilterNoteItems({ notes }) {
  const searchParams = useSearchParams()
  const searchText = searchParams.get('q')
  return (
    <ul className="notes-list">
      {notes.map(noteItem => {
        const { noteId, note, header } = noteItem
        const { title = '', content = '' } = note
        if (!searchText || (searchText && title.toLowerCase().includes(searchText.toLowerCase()))) {
          return (
            <li key={noteId}>
              <SidebarNoteItemContent
                key={noteId}
                id={noteId}
                title={title}
                expandedChildren={
                  <p className="sidebar-note-excerpt">
                    {content.substring(0, 20) || <i>No content</i>}
                  </p>
                }>
                {header}
              </SidebarNoteItemContent>
            </li>
          )
        }
        return null
      })}
    </ul>
  )
}

