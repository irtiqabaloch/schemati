import { useState, useCallback, useRef } from 'react'
import { chatWithMistral } from '../services/mistralService'

export const useAgentChat = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim() || isLoading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMsg])

    try {
      abortControllerRef.current = new AbortController()

      const apiMessages = [...messages, userMsg].map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      await chatWithMistral(apiMessages, (streamedText) => {
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = streamedText
          }
          return newMessages
        })
      })
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message')
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage.role === 'assistant' && !lastMessage.content) {
          lastMessage.content = 'Sorry, I encountered an error. Please try again.'
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages, isLoading])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    stopGeneration
  }
}
