import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const isLight = true

  useEffect(() => {
    document.documentElement.classList.add('light')
    localStorage.setItem('theme', 'light')
  }, [])

  const toggleTheme = () => {}

  return (
    <ThemeContext.Provider value={{ isLight, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
