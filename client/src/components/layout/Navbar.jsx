import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import egs from '../../assets/egs.png'
import { Moon, Sun, Menu, Bell, Settings } from 'lucide-react'

const accreditationLogos = [] // Add any valid accreditation logos here if needed

export default function Navbar({ onMenuClick }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const { isLight, toggleTheme } = useTheme()
    const { user } = useAuth()

    return (
        <nav className="sticky top-0 z-50 w-full bg-ink-950 border-b border-ink-800 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">

                <div className="flex items-center gap-3">
                    {/* Mobile sidebar hamburger button */}
                    <button className="md:hidden btn-ghost p-2" onClick={onMenuClick} aria-label="Open sidebar">
                        <Menu size={18} />
                    </button>

                    {/* College logo */}
                    <a href="/" className="shrink-0 flex items-center">
                        <div className={!isLight ? "bg-white p-1.5 rounded-lg" : ""}>
                            <img
                                src={egs}
                                alt="EGS Logo"
                                className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-all duration-300"
                            />
                        </div>
                    </a>
                </div>

                {/* Desktop accreditation logos & controls */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 flex-wrap justify-end">
                    {accreditationLogos.map((item) => (
                        <img
                            key={item.alt}
                            src={item.src}
                            alt={item.alt}
                            className="h-8 lg:h-10 xl:h-12 w-auto object-contain transition-transform duration-200 hover:scale-105"
                        />
                    ))}

                    <div className="flex items-center gap-2 border-l border-ink-800 pl-4 ml-2">
                        {/* Theme Toggle Button */}
                        <button onClick={toggleTheme} className="btn-ghost p-2" title="Toggle Theme">
                            {isLight ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                        {user ? (
                            <>
                                <button className="btn-ghost p-2 relative">
                                    <Bell size={16} />
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-lime-300 rounded-full" />
                                </button>
                                <button className="btn-ghost p-2">
                                    <Settings size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-2">
                                <Link to="/login" className="btn-ghost text-sm py-1.5">Sign In</Link>
                                <Link to="/register" className="btn-primary py-1.5 text-sm px-4">Register</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile hamburger button for dropdown */}
                <div className="md:hidden flex items-center gap-2">
                    <button onClick={toggleTheme} className="btn-ghost p-2" title="Toggle Theme">
                        {isLight ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center justify-center w-10 h-10 rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown for accreditation logos & extras */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="flex flex-col items-center justify-center gap-4 px-4 py-4 bg-ink-900 border-t border-ink-800">
                    {accreditationLogos.length > 0 && (
                        <div className="flex items-center justify-center flex-wrap gap-4">
                            {accreditationLogos.map((item) => (
                                <a key={item.alt} href="#" className="shrink-0">
                                    <img
                                        src={item.src}
                                        alt={item.alt}
                                        className="h-8 w-auto object-contain"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-4 border-t border-ink-800 pt-4 w-full justify-center">
                        {user ? (
                            <>
                                <button className="btn-ghost px-4 py-2 relative">
                                    <Bell size={18} className="mr-2" /> Notifications
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-lime-300 rounded-full" />
                                </button>
                                <button className="btn-ghost px-4 py-2">
                                    <Settings size={18} className="mr-2" /> Settings
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="btn-ghost px-6 py-2">Sign In</Link>
                                <Link to="/register" className="btn-primary px-6 py-2">Register</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
