const MISTRAL_MODEL = 'devstral-medium-latest'
const REQUEST_TIMEOUT = 20000

const getApiUrl = () => {
  return '/api/chat'
}

export const chatWithMistral = async (messages, onUpdate, abortSignal) => {
  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: 2048
      }),
      signal: abortSignal
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 504) {
        throw new Error('The server is taking too long to respond. Please try again.')
      }
      if (response.status === 503) {
        throw new Error('The service is temporarily unavailable. Please try again in a few moments.')
      }
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait before trying again.')
      }

      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6)

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullText += content
              if (onUpdate) {
                onUpdate(fullText)
              }
            }
          } catch (e) {
            console.warn('Parse error for line:', trimmedLine, e)
          }
        }
      }
    }

    return fullText
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }
    throw error
  }
}
