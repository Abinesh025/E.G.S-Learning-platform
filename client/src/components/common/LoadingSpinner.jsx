export default function LoadingSpinner({
  size = 'md',
  color = 'border-lime-400',
  className = '',
  fullScreen = false,
  minHeight = 'min-h-[220px]',
}) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-12 h-12 border-3',
  }[size] || 'w-8 h-8 border-2'

  const spinner = (
    <div
      className={`rounded-full ${sizeClasses} ${color} border-t-transparent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
        {spinner}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center w-full p-8 ${minHeight}`}>
      {spinner}
    </div>
  )
}
