import { Suspense } from 'react'
import Link from 'next/link'
import SidebarNoteList from '@/components/SidebarNoteList'
import EditButton from '@/components/EditButton'
import NoteListSkeleton from '@/components/NoteListSkeleton'
import SidebarSearchField from '@/components/SidebarSearchField'
import Uploader from '@/components/Uploader'

export default async function Sidebar() {
  return (
    <>
      <section className="col sidebar">
        <Link href={'/'} className="link--unstyled">
          <section className="sidebar-header">
            <img
              className="logo"
              src="/logo.svg"
              width="22px"
              height="20px"
              alt=""
              role="presentation"
            />
            <strong>Next Notes</strong>
          </section>
        </Link>
        <section className="sidebar-menu" role="menubar">
          <SidebarSearchField />
          <EditButton>New</EditButton>
        </section>
        <Link href={'/note/chat'} className="link--unstyled">
          <section className="sidebar-menu">
            <img
              src="/llmEntryIcon.png"
              width="300px"
              height="40px"
              alt=""
              role="presentation"
            />
          </section>
        </Link>
        <nav>
          <Suspense fallback={<NoteListSkeleton />}>
            <SidebarNoteList />
          </Suspense>
        </nav>
        <section className="sidebar-menu" role="menubar">
          <Uploader />
        </section>
      </section>
    </>
  )
}
