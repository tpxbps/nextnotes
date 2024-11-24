'use server'

import "dotenv/config"
import 'faiss-node'
import { Document } from 'langchain/document'
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { FaissStore } from "@langchain/community/vectorstores/faiss"
import { OllamaEmbeddings } from "@langchain/ollama"
import { join } from "path"
import dayjs from 'dayjs'

export const saveNoteToVectorStore = async (noteInfo) => {
  if (!noteInfo.content) return
  const docs = [
    new Document({
      pageContent: noteInfo.content,
      metadata: {
        title: noteInfo.title,
        uid: noteInfo.uid,
        updateTime: dayjs(noteInfo.updateTime).format('YYYY-MM-DD HH:mm:ss')
      }
    })
  ]

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100, // todo: 动态调整
    chunkOverlap: 10
  })

  const splitDocs = await splitter.splitDocuments(docs)

  const embeddings = new OllamaEmbeddings({
    model: "gemma2",
    baseUrl: "http://localhost:11434"
  })
  const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings)

  await vectorStore.save(join(process.cwd(), 'public', 'db', `${noteInfo.uid}`))
}