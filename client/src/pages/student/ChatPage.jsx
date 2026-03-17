import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { chatService } from '../../services/api'
import { getSocket } from '../../services/socket'
import { Send, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROOM_ID = 'general'

export default function ChatPage() {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    chatService.getMessages(ROOM_ID)
      .then(res => setMessages(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    const socket = getSocket(token)
    socketRef.current = socket
    socket.emit('join', ROOM_ID)

    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    return () => {
      socket.off('message')
      socket.emit('leave', ROOM_ID)
    }
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    socketRef.current?.emit('sendMessage', { room: ROOM_ID, content: text.trim() })
    setText('')
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-800 flex items-center gap-3">
        <div className="w-9 h-9 bg-ink-800 rounded-xl flex items-center justify-center">
          <MessageSquare size={16} className="text-lime-300" />
        </div>
        <div>
          <h1 className="font-display font-600 text-ink-100">General Chat</h1>
          <p className="text-ink-500 text-xs">All members</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center text-ink-500 text-sm py-8">Loading messages…</div>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender?._id === user?._id || m.sender === user?._id
          const name = m.sender?.name || 'Unknown'
          const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

          return (
            <div key={m._id || i} className={clsx('flex gap-3', isMe && 'flex-row-reverse')}>
              {!isMe && (
                <div className="w-8 h-8 rounded-xl bg-ink-800 flex items-center justify-center flex-shrink-0 self-end">
                  <span className="text-xs font-display font-600 text-ink-400">{initials}</span>
                </div>
              )}
              <div className={clsx('max-w-[72%] space-y-1', isMe && 'items-end flex flex-col')}>
                {!isMe && (
                  <span className="text-xs text-ink-500 font-500">{name}</span>
                )}
                <div className={clsx(
                  'px-4 py-2.5 rounded-2xl text-sm',
                  isMe
                    ? 'bg-lime-300 text-ink-950 rounded-br-sm'
                    : 'bg-ink-800 text-ink-200 rounded-bl-sm'
                )}>
                  {m.content}
                </div>
                <span className="text-xs text-ink-600 px-1">
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="p-4 border-t border-ink-800 flex gap-3">
        <input
          className="input flex-1"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary px-4 disabled:opacity-40">
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}
