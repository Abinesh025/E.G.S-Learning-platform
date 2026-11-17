import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [emailSent, setEmailSent] = useState(true)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Email validation
  const validateEmail = (val) => {
    if (/[A-Z]/.test(val)) {
      toast.error('Capital letters are not allowed in email')
      return false
    }
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
    if (!emailRegex.test(val)) {
      toast.error('Please enter a valid email address')
      return false
    }
    return true
  }

  // Password validation
  const validatePassword = (pwd) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-_^()]).{8,}$/
    return passwordRegex.test(pwd)
  }

  // ── Step 1: Send OTP ─────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!validateEmail(trimmedEmail)) return

    setLoading(true)
    try {
      const res = await api.post('/api/auth/forgot-password', { email: trimmedEmail })
      toast.success(res.data.message || 'Verification code sent!')
      
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp)
        setOtp(res.data.devOtp) // Auto-populate for seamless local testing
      }
      setEmailSent(res.data.emailSent ?? true)

      setStep(2)
      setResendCooldown(60) // 60 seconds cooldown
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code. Please check your email.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ───────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.trim().length !== 6) {
      toast.error('Please enter the full 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })
      toast.success(res.data.message || 'Code verified successfully!')
      setResetToken(res.data.resetToken || '')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Reset Password ───────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!validatePassword(newPassword)) {
      toast.error('Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        resetToken,
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      })
      toast.success(res.data.message || 'Password reset successfully! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed. Please request a new code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 rounded-2xl flex items-center justify-center text-lime-400 shadow-lg shadow-lime-400/5">
            <KeyRound size={24} />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold font-display text-ink-100">
          {step === 1 && 'Reset Password'}
          {step === 2 && 'Enter Verification Code'}
          {step === 3 && 'Create New Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-ink-400">
          {step === 1 && 'Enter your registered email to receive a password reset code.'}
          {step === 2 && `We sent a 6-digit code to ${email}`}
          {step === 3 && 'Choose a strong new password for your account.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-ink-900 border border-ink-800 py-8 px-6 sm:px-10 rounded-2xl shadow-xl">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-ink-800 text-xs">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-lime-400 font-semibold' : 'text-ink-600'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-lime-400 text-ink-950 font-bold' : 'bg-ink-800'}`}>1</span>
              <span>Email</span>
            </div>
            <div className={`h-0.5 w-8 ${step >= 2 ? 'bg-lime-400' : 'bg-ink-800'}`} />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-lime-400 font-semibold' : 'text-ink-600'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-lime-400 text-ink-950 font-bold' : 'bg-ink-800'}`}>2</span>
              <span>Verify</span>
            </div>
            <div className={`h-0.5 w-8 ${step >= 3 ? 'bg-lime-400' : 'bg-ink-800'}`} />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-lime-400 font-semibold' : 'text-ink-600'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-lime-400 text-ink-950 font-bold' : 'bg-ink-800'}`}>3</span>
              <span>Password</span>
            </div>
          </div>

          {/* STEP 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="label">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" size={16} />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? 'Sending Code…' : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {devOtp && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-200">
                      Verification Code: <span className="font-mono text-base font-bold tracking-widest text-lime-400 ml-1">{devOtp}</span>
                    </p>
                    <p className="text-[11px] text-amber-300/80 mt-1">
                      {emailSent
                        ? 'A confirmation copy was also dispatched to your email.'
                        : 'Code auto-filled. (To receive live emails in your inbox, set your real Gmail credentials in server/.env).'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="label">6-Digit Verification Code</label>
                <input
                  type="text"
                  className="input text-center tracking-[0.75em] font-mono text-xl font-bold py-3"
                  placeholder="••••••"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? 'Verifying…' : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-ink-400 hover:text-ink-200 transition"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className={`flex items-center gap-1 ${
                    resendCooldown > 0 ? 'text-ink-600 cursor-not-allowed' : 'text-lime-400 hover:text-lime-300'
                  }`}
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password Form */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" size={16} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password checklist */}
              <div className="p-3.5 bg-ink-950 border border-ink-800 rounded-xl space-y-1 text-xs text-ink-400">
                <p className="font-semibold text-ink-300 mb-1.5">Password requirements:</p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={newPassword.length >= 8 ? 'text-lime-400' : 'text-ink-600'} />
                  <span className={newPassword.length >= 8 ? 'text-ink-200' : ''}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={/[A-Z]/.test(newPassword) ? 'text-lime-400' : 'text-ink-600'} />
                  <span className={/[A-Z]/.test(newPassword) ? 'text-ink-200' : ''}>Uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={/[a-z]/.test(newPassword) ? 'text-lime-400' : 'text-ink-600'} />
                  <span className={/[a-z]/.test(newPassword) ? 'text-ink-200' : ''}>Lowercase letter (a-z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={/\d/.test(newPassword) ? 'text-lime-400' : 'text-ink-600'} />
                  <span className={/\d/.test(newPassword) ? 'text-ink-200' : ''}>Number (0-9)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={/[@$!%*?&#\-_^()]/.test(newPassword) ? 'text-lime-400' : 'text-ink-600'} />
                  <span className={/[@$!%*?&#\-_^()]/.test(newPassword) ? 'text-ink-200' : ''}>Special character (@$!%*?&#-_^())</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? 'Resetting Password…' : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to Login Footer */}
          <div className="mt-6 pt-5 border-t border-ink-800 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-lime-400 transition"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
