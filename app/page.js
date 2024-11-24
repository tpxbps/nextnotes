export default async function Page() {
  return (
    <div className="flex">
      <div className="note--empty-state">
        <span className="note-text--empty-state">
          Click a note on the left to find something! 🥺
        </span>
      </div>
      <div className="note--empty-state">
        <span className="note-text--empty-state">
          Or simply chat with the note-enhanced AI~ 🤖
        </span>
      </div>
    </div>
  )
}