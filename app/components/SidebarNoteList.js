import SidebarFilterNoteItems from '@/components/SidebarFilterNoteItems'
import SidebarNoteItemHeader from '@/components/SidebarNoteItemHeader'
import { getAllNotes } from '@/lib/redis'

export default async function SidebarNoteList() {
  const noteArr = Object.entries(await getAllNotes())

  return !!noteArr.length && (
    <SidebarFilterNoteItems notes={
      noteArr.map(([noteId, note]) => {
        const noteData = JSON.parse(note)
        return {
          noteId,
          note: noteData,
          header: <SidebarNoteItemHeader title={noteData.title} updateTime={noteData.updateTime} />
        }
      })
    } />
  )
}
