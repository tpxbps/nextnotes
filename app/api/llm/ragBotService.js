'use server'

import { getRagChain } from "@/api/llm/ragChain"
import { createStreamableValue } from "ai/rsc"
import redis from "@/lib/redis"

const ragChainMap = new Map() // 模拟线程池 - 单例模式

export async function initRagChatBot(sessionId) {
  if (!ragChainMap.has(sessionId)) {
    const ragChain = await getRagChain({ sessionId })
    ragChainMap.set(sessionId, ragChain)
    redis.set(sessionId, "")
  }
}

export async function executeRagBotTool(sessionId, query) {
  const ragChain = ragChainMap.get(sessionId)
  if (!ragChain) throw new Error("RagBot is not initialized for this session.")

  const stream = createStreamableValue()

  const run = async () => {
    const output = await ragChain.stream({ question: query })
    for await (const chunk of output) {
      stream.update(chunk)
    }
    stream.done()
  }
  run()

  return { streamData: stream.value }
}

export async function removeRagBot(sessionId) {
  ragChainMap.delete(sessionId)
  redis.del(sessionId)
}