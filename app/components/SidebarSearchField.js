'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import Spinner from '@/components/Spinner'

export default function SidebarSearchField() {
  const { replace } = useRouter()
  const pathname = usePathname()
  const [searchText, setSearchText] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (pathname === '/' || pathname.includes('edit')) setSearchText('')
  }, [pathname])


  function handleSearch(term) {
    const params = new URLSearchParams(window.location.search)
    if (term) params.set('q', term)
    else params.delete('q')

    setSearchText(term)
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="search" role="search">
      <label className="offscreen" htmlFor="sidebar-search-input">
        Search for a note by title
      </label>
      <input
        id="sidebar-search-input"
        placeholder="Search"
        type="text"
        value={searchText}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <Spinner active={isPending} />
    </div>
  )
}
