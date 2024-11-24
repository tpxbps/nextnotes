'use server'

import { saveNoteToVectorStore } from "@/api/llm/saveNoteToVectorStore"
import { redirect } from 'next/navigation'
import { addNote, updateNote, delNote } from '@/lib/redis'
import { z } from "zod"
import { rm } from 'fs/promises'
import { join } from "path"

const schema = z.object({
  title: z.string().max(200, 'The title should be less than 200 characters.'),
  content: z.string()
})

export async function saveNote(formData) {
  const data = {
    title: formData.get('title'),
    content: formData.get('body'),
    updateTime: new Date()
  }
  // 校验数据
  const validated = schema.safeParse(data)
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0].message
    }
  }

  let noteId = formData.get('noteId')
  const sData = JSON.stringify(data)
  if (noteId) {
    await updateNote(noteId, sData)
  } else {
    noteId = await addNote(sData)
  }
  // 保存到向量数据库
  await saveNoteToVectorStore({
    ...data,
    uid: noteId
  })
  redirect(`/note/${noteId}`)
}

export async function deleteNote(formData) {
  const noteId = formData.get('noteId')
  const flag = await delNote(noteId)
  if (flag) {
    try {
      // 删除向量数据库记录的内容
      await rm(join(process.cwd(), 'public', 'db', noteId), { recursive: true, force: true })
    } catch (error) {
      console.error(`Error deleting vector store with ID ${noteId}:`, error)
    }
    redirect('/')
  } else {
    console.error("Delete failed.")
  }
}

export async function importNote(file) {
  if (!file) return new Error("File is required.")

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name.replace(/\.[^/.]+$/, "")
    // 写入数据库
    const data = {
      title: filename,
      content: buffer.toString('utf-8'),
      updateTime: new Date()
    }
    const res = await addNote(JSON.stringify(data))
    await saveNoteToVectorStore({
      ...data,
      uid: res
    })
    return { uid: res }
  } catch (e) {
    console.error(e)
    return new Error("Upload failed.")
  }
}