import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const validateEmail = (email) => {
  if (/[A-Z]/.test(email)) {
    toast.error('Capital letters are not allowed in email');
    return false;
  }
  const localPart = email.split('@')[0];
  if (localPart && /^\d+$/.test(localPart)) {
    toast.error('Email prefix cannot consist of only numbers');
    return false;
  }
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    toast.error('Invalid email format');
    return false;
  }
  return true;
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateEmail(form.email)) return;
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(user.role === 'staff' ? '/staff' : '/student')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              className="input pr-10"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300" onClick={() => setShow(s => !s)}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading ? 'Signing in…' : <>Sign in <ArrowRight size={15} /></>}
        </button>
      </form>
      <p className="text-center text-ink-500 text-sm mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-lime-300 hover:text-lime-400">Create one</Link>
      </p>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateEmail(form.email)) return;
    setLoading(true)
    try {
      const user = await register(form)
      toast.success('Account created!')
      navigate(user.role === 'staff' ? '/staff' : '/student')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Join EduPortal today">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" placeholder="John Doe" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="you@example.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" placeholder="Min. 8 characters" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} />
        </div>
        <div>
          <label className="label">I am a</label>
          <div className="grid grid-cols-2 gap-2">
            {['student', 'staff'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm(p => ({ ...p, role: r }))}
                className={`py-2.5 rounded-xl border text-sm font-display font-500 capitalize transition-all ${
                  form.role === r
                    ? 'bg-lime-400/10 border-lime-400 text-lime-300'
                    : 'border-ink-700 text-ink-400 hover:border-ink-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading ? 'Creating…' : <>Create account <ArrowRight size={15} /></>}
        </button>
      </form>
      <p className="text-center text-ink-500 text-sm mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-lime-300 hover:text-lime-400">Sign in</Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-400/5 rounded-full blur-3xl" />
      </div>

      <Link to="/" className="absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center gap-2 text-ink-400 hover:text-lime-300 transition-colors text-sm font-500 z-10 animate-fade-in">
        <ArrowLeft size={16} /> Back to Portal
      </Link>

      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-ink-950" />
          </div>
          <span className="font-display font-700 text-ink-50 text-2xl tracking-tight">EduPortal</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display font-700 text-xl text-ink-50 mb-1">{title}</h1>
          <p className="text-ink-500 text-sm mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
