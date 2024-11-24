'use server'

import "dotenv/config"
import 'faiss-node'
import { FaissStore } from "@langchain/community/vectorstores/faiss"
import { Ollama, OllamaEmbeddings } from "@langchain/ollama"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { getBufferString } from "@langchain/core/messages"
import { ChatMessageHistory } from "langchain/stores/message/in_memory"
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression"
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract"
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold"
import { join } from "path"
import { promises as fs } from 'fs'
import redis from "@/lib/redis"

async function loadVectorStore() {
  const embeddings = new OllamaEmbeddings({
    model: "gemma2",
    baseUrl: "http://localhost:11434"
  })
  const rootDirPath = join(process.cwd(), 'public', 'db')
  const dirEntries = await fs.readdir(rootDirPath, { withFileTypes: true })
  const subDirPaths = dirEntries
    .filter(item => item.isDirectory())
    .map(item => join(rootDirPath, item.name))
  const vectorStores = await Promise.all(
    subDirPaths.map(async (directory) => {
      return await FaissStore.load(directory, embeddings)
    })
  )
  // if (!vectorStores || !vectorStores.length) return null // todo: 处理空向量库 | update: db中存入了一个占位符
  const res = vectorStores[0]
  for (let i = 1; i < vectorStores.length; i++)
    res.mergeFrom(vectorStores[i])
  return res
}

async function getSummaryChain() {
  const summaryPrompt = ChatPromptTemplate.fromTemplate(`
    总结提供的新对话，并结合先前的摘要，总结出一个新的摘要。
    注意摘要的简洁性，总结时可以只保留关键信息。

    先前的摘要:
    {summary}

    新对话:
    {new_lines}

    新的摘要:
  `)

  const summaryChain = RunnableSequence.from([
    summaryPrompt,
    new Ollama({
      baseUrl: "http://localhost:11434",
      model: "gemma2",
    }),
    new StringOutputParser(),
  ])
  return summaryChain
}

async function getRephraseChain() {
  const rephraseChainPrompt = ChatPromptTemplate.fromTemplate(`
    你会收到一段历史对话总结和一个后续问题，你的任务是根据历史对话将后续问题转述成一个描述更加具体和清晰的新提问。
    注意：如果没有收到对话历史或者你认为后续问题的描述已经足够清晰，直接使用后续问题。

    例子
    对话历史：human表示他叫小明，他今年18岁。AI热情地表示很高兴认识他，并询问有什么可以帮助他的？
    后续问题：我今年多少岁了？
    重述后的问题：小明今年多少岁？
    例子结束

    对话历史：{history_summary}
    后续问题：{question}
    重述后的问题：
  `)

  const rephraseChain = RunnableSequence.from([
    rephraseChainPrompt,
    new Ollama({
      baseUrl: "http://localhost:11434",
      model: "gemma2",
      temperature: 0.4,
    }),
    new StringOutputParser(),
  ])

  return rephraseChain
}

export async function getRagChain({ sessionId = '' }) {
  // 读取向量数据并设置检索策略
  const vectorStore = await loadVectorStore()
  // const retriever = vectorStore.asRetriever(2)
  const retriever = new ContextualCompressionRetriever({
    baseCompressor: LLMChainExtractor.fromLLM(new Ollama({
      baseUrl: "http://localhost:11434",
      model: "gemma2",
    })),
    baseRetriever: ScoreThresholdRetriever.fromVectorStore(vectorStore, {
      minSimilarityScore: 0.15, // todo
      maxK: 5,
      kIncrement: 1
    })
  })

  const convertDocsToString = (documents) => {
    return documents.map(document => document.pageContent).join("\n")
  }
  const contextRetrieverChain = RunnableSequence.from([
    (input) => input.new_question,
    retriever,
    convertDocsToString,
  ])

  // 配置 RAG 链
  const SYSTEM_TEMPLATE = `
    作为一个专业的知识问答助手，你需要尽可能回答用户问题。在回答时可以参考以下信息，综合考虑后做出回答。
    当然，如果你对当前提问感到疑惑，也可以回答“我不确定”，并直接给出自己的建议。

    以下是与提问相关的文档内容：
    {context}

    以下是聊天摘要：
    {history_summary}

  `

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_TEMPLATE],
    ["human", "现在，你需要参考以上信息，回答以下问题：\n{new_question}`"],
  ])

  const history = new ChatMessageHistory()
  const summaryChain = await getSummaryChain()
  const rephraseChain = await getRephraseChain()
  const model = new Ollama({
    baseUrl: "http://localhost:11434",
    model: "gemma2",
    // verbose: true
  })

  const ragChain = RunnableSequence.from([
    {
      input: new RunnablePassthrough({
        func: async (input) => {
          history.addUserMessage(input.question)
        }
      }),
      question: (input) => input.question,
      history_summary: () => redis.get(sessionId),
    },
    RunnablePassthrough.assign({
      new_question: rephraseChain,
    }),
    RunnablePassthrough.assign({
      context: contextRetrieverChain,
    }),
    prompt,
    model,
    new StringOutputParser(),
    new RunnablePassthrough({
      func: async (input) => {
        history.addAIMessage(input)
        const messages = await history.getMessages()
        const new_lines = getBufferString(messages)
        const newSummary = await summaryChain.invoke({
          summary: redis.get(sessionId),
          new_lines
        })
        redis.set(sessionId, newSummary)
        history.clear()
      }
    })
  ])

  return ragChain
}

// current
// let executeRagBotTool = async () => null

// export async function initRagChatBot() {
//   const ragChain = await getRagChain() // todo: 单例模式

//   executeRagBotTool = async (query) => {
//     const stream = createStreamableValue()

//     const run = async () => {
//       const output = await ragChain.stream({ question: query })  // todo: sessionID - redis - 存聊天记录
//       for await (const chunk of output) {
//         stream.update(chunk)
//       }
//       stream.done()
//     }
//     run()

//     return { streamData: stream.value }
//   }
// }

// export { executeRagBotTool }