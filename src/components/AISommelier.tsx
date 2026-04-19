'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/lib/types'

const SUGGESTED = [
  "What should I drink tonight with a lamb roast?",
  "Which wines are at peak drinking right now?",
  "What are my most valuable bottles?",
  "What Wendouree should I open first?",
  "Suggest a wine for a special occasion",
  "Which bottles should I drink in the next 2 years?",
]

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isUser ? 'var(--wine)' : 'var(--parchment)',
          color: isUser ? 'var(--cream)' : 'var(--ink)',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderRadius: isUser ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
        }}
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>'),
        }}
      />
    </div>
  )
}

export default function AISommelier() {
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  async function send(message: string) {
    if (!message.trim() || loading) return
    setInput('')
    setError('')
    const newHistory: ChatMessage[] = [...history, { role: 'user', content: message }]
    setHistory(newHistory)
    setLoading(true)

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    })
    setLoading(false)
    if (res.ok) {
      const { reply } = await res.json()
      setHistory([...newHistory, { role: 'assistant', content: reply }])
    } else {
      setError('Failed to get response. Please try again.')
      setHistory(history) // rollback
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden rounded-xl" style={{ border: '1px solid var(--border)' }}>
      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--cream)' }}>
        {history.length === 0 ? (
          <div className="py-8 text-center" style={{ color: 'var(--muted)' }}>
            <div className="text-4xl mb-3">🍷</div>
            <p className="font-medium mb-1">Your personal sommelier</p>
            <p className="text-sm">Ask about your cellar, food pairings, or drink windows</p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{ background: 'var(--parchment)', color: 'var(--wine)', border: '1px solid var(--border)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((msg, i) => <MessageBubble key={i} msg={msg} />)
        )}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: 'var(--parchment)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              <span className="animate-pulse">Sommelier is thinking…</span>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-center my-2" style={{ color: '#991b1b' }}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ background: 'var(--parchment)', borderTop: '1px solid var(--border)' }}>
        {history.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {SUGGESTED.slice(0, 3).map(q => (
              <button key={q} onClick={() => send(q)} className="whitespace-nowrap px-2 py-1 rounded-full text-xs flex-shrink-0"
                style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="Ask your sommelier…"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl font-medium text-sm transition-opacity disabled:opacity-40"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            Send
          </button>
        </div>
        <button onClick={() => setHistory([])} className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Clear conversation
        </button>
      </div>
    </div>
  )
}
