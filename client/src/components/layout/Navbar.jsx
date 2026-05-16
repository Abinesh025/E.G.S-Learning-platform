import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import egs from '../../assets/egs.png'
import { Moon, Sun, Menu, Settings, MoreVertical, X, PanelLeftOpen, LogOut, Pencil, User, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

export default function Navbar({ onMenuClick, onEditProfile, onLogout, onExitAdmin, isAdminRoute, sidebarCollapsed }) {
    const { user } = useAuth()
    const { isLight, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null
        if (avatarPath.startsWith('http')) return avatarPath
        const base = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
            : ''
        return `${base}${avatarPath}`
    }

    const initials = isAdminRoute ? 'AD' : user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U'

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
                    <Link to="/" className="shrink-0 flex items-center">
                        <div className={!isLight ? "bg-white p-1.5 rounded-lg" : ""}>
                            <img
                                src={egs}
                                alt="EGS Logo"
                                className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-all duration-300"
                            />
                        </div>
                    </Link>
                </div>

                {/* Right Side: Profile & Actions */}
                <div className="flex items-center gap-4">
                    {user || isAdminRoute ? (
                        <div className="relative flex items-center gap-3" ref={dropdownRef}>
                            {/* Notification Button */}
                            <button
                                className="relative w-10 h-10 rounded-xl flex items-center justify-center border border-ink-800 hover:bg-ink-800 transition-all duration-200 text-ink-400"
                                title="Notifications"
                            >
                                <Bell size={20} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-lime-400 rounded-full border-2 border-ink-950"></span>
                            </button>

                            {/* Profile Trigger */}
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-lime-400/50",
                                    isAdminRoute ? "bg-sky-400/10 border-sky-400/20" : "bg-lime-400/10 border-lime-400/20"
                                )}>
                                    {user?.avatar ? (
                                        <img 
                                            src={getAvatarUrl(user.avatar)} 
                                            alt={user.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className={clsx(
                                            "font-display font-600 text-xs",
                                            isAdminRoute ? "text-sky-400" : "text-lime-300"
                                        )}>{initials}</span>
                                    )}
                                </div>
                            </button>

                            {/* Settings Button */}
                            <button
                                onClick={() => navigate('')}
                                className="w-10 h-10 rounded-xl flex items-center justify-center border border-ink-800 hover:bg-ink-800 transition-all duration-200 text-ink-400"
                                title="Settings"
                            >
                                <Settings size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-ink-900 border border-ink-800 rounded-xl shadow-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="px-4 py-2 border-b border-ink-800 mb-1">
                                        <p className="text-sm font-600 text-ink-100 truncate">{user?.name || 'Admin'}</p>
                                        <p className="text-xs text-ink-400 truncate capitalize">{user?.role || 'Administrator'}</p>
                                    </div>
                                    
                                    {!isAdminRoute && (
                                        <button 
                                            onClick={() => {
                                                onEditProfile()
                                                setDropdownOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink-300 hover:bg-ink-800 hover:text-ink-100 transition-colors"
                                        >
                                            <Pencil size={16} />
                                            <span>Edit Profile</span>
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={() => {
                                            isAdminRoute ? onExitAdmin() : onLogout()
                                            setDropdownOpen(false)
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        <span>{isAdminRoute ? 'Exit Admin' : 'Logout'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-2">
                            <Link to="/admin-login" className="btn-ghost text-sm py-1.5 text-yellow-600 hover:text-sky-300">Admin</Link>
                            <Link to="/login" className="btn-ghost text-sm py-1.5">Sign In</Link>
                            <Link to="/register" className="btn-primary py-1.5 text-sm px-4">Register</Link>
                        </div>
                    )}

                    {/* Mobile menu toggle for non-logged-in users */}
                    {!user && !isAdminRoute && (
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X size={24} /> : <MoreVertical size={24} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile dropdown for non-logged-in users */}
            {menuOpen && !user && !isAdminRoute && (
                <div className="md:hidden overflow-hidden bg-ink-900 border-t border-ink-800 p-4 space-y-4">
                    <div className="flex flex-col gap-2">
                        <Link to="/admin-login" className="btn-ghost justify-center text-yellow-600">Admin</Link>
                        <Link to="/login" className="btn-ghost justify-center">Sign In</Link>
                        <Link to="/register" className="btn-primary justify-center">Register</Link>
                    </div>
                </div>
            )}
        </nav>
    )
}
