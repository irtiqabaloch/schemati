const MISTRAL_MODEL = 'devstral-medium-latest'

const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return '/api/chat'
  }
  return '/api/chat'
}

export const chatWithMistral = async (messages, onUpdate) => {
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
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') break

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
            console.error('Parse error:', e)
          }
        }
      }
    }

    return fullText
  } catch (error) {
    console.error('Mistral API error:', error)
    throw error
  }
}
