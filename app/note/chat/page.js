"use client"

import React, { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { readStreamableValue } from "ai/rsc"
import { initRagChatBot, executeRagBotTool, removeRagBot } from "@/api/llm/ragBotService"
import { v4 as uuidv4 } from 'uuid'
import styles from "./styles.module.css"
import Spinner from '@/components/Spinner'

export default function Page() {
  const [emptyText, setEmptyText] = useState("")
  const [input, setInput] = useState("")
  const [chatHistory, setChatHistory] = useState([])
  const [curMsg, setCurMsg] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const scrollRef = useRef(null)
  const sessionId = useRef(uuidv4())

  useEffect(() => {
    let cleanup
    (async () => {
      setEmptyText("😊")
      cleanup = typeEmptyText()
      await initRagChatBot(sessionId.current)
      setIsReady(true)
    })()
    return () => {
      removeRagBot(sessionId.current)
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory])

  const typeEmptyText = () => {
    let index = -1, timeoutId
    const typingSpeed = 100
    const emptyMsg = "有什么可以帮忙的？".split('')

    const type = () => {
      ++index
      setEmptyText((prev) => prev + emptyMsg[index])
      if (index < emptyMsg.length - 1) {
        timeoutId = setTimeout(type, typingSpeed)
      }
    }
    type()

    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input || !isReady || isLoading) return

    let msg = ''
    setIsLoading(true)
    setChatHistory(prev => [...prev, input])
    const { streamData } = await executeRagBotTool(sessionId.current, input)
    setInput("")
    for await (const chunk of readStreamableValue(streamData)) {
      msg += chunk
      setCurMsg(msg)
    }
    setChatHistory(prev => [...prev, msg])
    setIsLoading(false)
    setCurMsg("")
  }

  return (
    <div className={styles.outerContainer}>
      <div className={styles.container}>
        <div ref={scrollRef} className={styles.chatContainer}>
          {chatHistory.map((item, idx) => {
            return (
              <div key={idx}>
                {idx % 2 ? (
                  <>
                    <img src="/gemma2Icon.png" className={`${styles.aiIcon}`} alt="AI Icon" role="presentation" />
                    <ReactMarkdown>{item}</ReactMarkdown>
                  </>
                ) : (
                  <span className={`${styles.userMsg}`}>{item}</span>
                )}
              </div>
            )
          })}
          {!!curMsg.length && <div>
            <img src="/gemma2Icon.png" className={`${styles.aiIcon}`} alt="AI Icon" role="presentation" />
            <ReactMarkdown>{curMsg}</ReactMarkdown>
          </div>}
          {!chatHistory.length && <strong className={`${styles.emptyMsg}`}>{emptyText}</strong>}
        </div>
        <form onSubmit={handleSubmit} className={`${styles.search}`}>
          <textarea
            className={styles.inputField}
            placeholder="Send message to the chatbot."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey)
                e.preventDefault(), handleSubmit(e)
            }}
          />
          <button className={`edit-button edit-button--outline ${styles.uploadBnt}`} type="submit" disabled={isLoading}>
            {isLoading ? <div className={`${styles.active}`}><Spinner active={isLoading} /></div> : "👆🏼"}
          </button>
        </form>
      </div>
    </div>
  )
}