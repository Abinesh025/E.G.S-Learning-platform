import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isLight, setIsLight] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'light'
    }
    // Fallback to system theme if nothing is saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
  })

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }, [isLight])

  const toggleTheme = () => setIsLight(!isLight)

  return (
    <ThemeContext.Provider value={{ isLight, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
