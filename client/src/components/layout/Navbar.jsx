import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import egs from '../../assets/egs.png'
import { Moon, Sun, Menu, Bell, Settings, Key, MoreVertical, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import nba from "../../assets/nba-logo.svg";
import nirf from "../../assets/nirf.webp";
import naac from "../../assets/NAAC.png";
import aicte from "../../assets/aicte.png";
import annau from "../../assets/annau.svg"; 

const accreditationLogos = [{src:nba},{src:nirf},{src:naac},{src:aicte},{src:annau}] // Add any valid accreditation logos here if needed

export default function Navbar({ onMenuClick }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const { isLight, toggleTheme } = useTheme()
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <nav className="sticky top-0 z-50 w-full bg-ink-950 border-b border-ink-800 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">

                <div className="flex items-center gap-3">
                    {/* Mobile sidebar hamburger button */}
                    {onMenuClick && (
                        <button className="md:hidden btn-ghost p-2" onClick={onMenuClick} aria-label="Open sidebar">
                            <Menu size={24} />
                        </button>
                    )}

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
                    {user ? (
                        <>
                            {accreditationLogos.map((item, idx) => (
                                <img
                                    key={idx}
                                    src={item.src}
                                    alt={item.alt || ''}
                                    className="h-8 lg:h-10 xl:h-12 w-auto object-contain transition-transform duration-200 hover:scale-105 rounded-full"
                                />
                            ))}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 ml-2">
                            <Link to="/admin-login" className="btn-ghost text-sm py-1.5 text-yellow-600 hover:text-sky-300">Admin</Link>
                            <Link to="/login" className="btn-ghost text-sm py-1.5">Sign In</Link>
                            <Link to="/register" className="btn-primary py-1.5 text-sm px-4">Register</Link>
                        </div>
                    )}
                </div>

                {/* Mobile hamburger button for dropdown */}
                <div className="md:hidden flex items-center gap-2">
                    
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center justify-center w-10 h-10 rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X size={24} /> : <MoreVertical size={24} />}
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
                        {(!user) && 
                            <div className="flex items-center gap-4 flex-wrap justify-center">
                                <Link to="/admin-login" className="btn-ghost px-6 py-2 text-sky-400 hover:text-sky-300">Admin</Link>
                                <Link to="/login" className="btn-ghost px-6 py-2">Sign In</Link>
                                <Link to="/register" className="btn-primary px-6 py-2">Register</Link>
                            </div>
                        }
                    </div>
                </div>
            </div>

        </nav>
    )
}
