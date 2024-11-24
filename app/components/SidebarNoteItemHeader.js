import dayjs from 'dayjs' // [tip] 服务端渲染，这意味着 day.js 的代码并不会被打包到客户端的 bundle 中

export default function SidebarNoteItemHeader({ title, updateTime }) {
  return (
    <header className="sidebar-note-header">
      <strong>{title}</strong>
      <small>{dayjs(updateTime).format('YYYY-MM-DD hh:mm:ss')}</small>
    </header>
  )
}