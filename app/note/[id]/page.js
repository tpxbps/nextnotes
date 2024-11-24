import DefaultPage from '@/page'
import Note from '@/components/Note'
import { getNote } from '@/lib/redis'
import { sleep } from '@/lib/utils'

export default async function Page({ params }) {
  // 动态路由 获取笔记 id
  const { id: noteId } = await params
  const note = await getNote(noteId)

  // 防止加载速度过快，骨架屏导致的页面闪烁
  // await sleep(200)

  return note ? <Note noteId={noteId} note={JSON.parse(note)} /> : <DefaultPage />
}