import DefaultPage from '@/page'
import NoteEditor from '@/components/NoteEditor'
import { getNote } from '@/lib/redis'
import { sleep } from '@/lib/utils'

export default async function EditPage({ params }) {

  const { id: noteId } = await params
  const note = await getNote(noteId)
  const { title, content } = JSON.parse(note)

  // 让 Suspense 的效果更明显
  // await sleep(200)

  return note ? <NoteEditor noteId={noteId} initialTitle={title} initialBody={content} /> : <DefaultPage />
}