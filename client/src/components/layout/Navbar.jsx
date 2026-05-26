import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import egs from '../../assets/egs.png'
import { Moon, Sun, Menu, Settings, MoreVertical, X, PanelLeftOpen, LogOut, Pencil, User, Bell, BookOpen, Check, TrashIcon, Palette, Info } from 'lucide-react'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

export default function Navbar({ onMenuClick, onEditProfile, onLogout, onExitAdmin, isAdminRoute, sidebarCollapsed }) {
    const { user } = useAuth()
    const { isLight, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const notificationRef = useRef(null)
    const settingsRef = useRef(null)
    const navigate = useNavigate()
    const [DeleteNotification,setDeleteNotification] = useState(false);
    const [DeleteAllNotification,setAllDeleteNotification] = useState(false);
    
    const [notifications, setNotifications] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user || user.role !== 'student') return;
        try {
            const { data } = await api.get('/api/notifications');
            if (data.success) {
                setNotifications(data.data);
                setDeleteNotification(true);
                setAllDeleteNotification(true);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    // Socket & initial fetch
    useEffect(() => {
        if (user && user.role === 'student') {
            fetchNotifications();
            
            const token = localStorage.getItem('token');
            const socket = getSocket(token);
            
            socket.emit('joinDepartmentRoom', { department: user.department });
            
            socket.on('newMaterialNotification', (newNotif) => {
                toast.success(newNotif.message, { icon: '📚' });
                setNotifications(prev => [newNotif, ...prev]);
            });
            
            return () => {
                socket.off('newMaterialNotification');
            }
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const deleteNotification = async (id) =>{
        try{
            const {data} = await api.delete(`/api/notifications/delete/${id}`);
            if(data.success){
                setNotifications(prev => prev.filter(n => n._id !== id));
                toast.success(data.message);
            }
        }
        catch(error){
            console.error('Failed to delete notification', error);
        }
    }

    const deleteAllNotification = async () =>{
        try{
            const {data} = await api.delete('/api/notifications/delete-all');
            if(data.success){
                setNotifications([]);
                setAllDeleteNotification(false);
                toast.success(data.message);
            }
        }
        catch(error){
            console.error('Failed to delete all notifications', error);
        }
    }

    

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setSettingsDropdownOpen(false)
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
                            {user?.role === 'student' && (
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative w-10 h-10 rounded-xl flex items-center justify-center border border-ink-800 hover:bg-ink-800 transition-all duration-200 text-ink-400"
                                        title="Notifications"
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-lime-400 text-ink-950 text-xs font-bold rounded-full flex items-center justify-center border-2 border-ink-950">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-ink-900 border border-ink-800 rounded-xl shadow-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <div className="flex justify-between items-center px-4 py-2 border-b border-ink-800 mb-1">
                                                <h3 className="text-sm font-600 text-ink-100">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button onClick={markAllAsRead} className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1">
                                                        <Check size={14} /> Mark all read
                                                    </button>
                                                )}
                                                {DeleteAllNotification && notifications.length > 0 && (
                                                     <button onClick={deleteAllNotification} className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1">
                                                         <TrashIcon size={14} />Delete All Notifications
                                                     </button>
                                                 )}
                                            </div>
                                            
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-ink-400 text-sm">
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {notifications.map(notification => (
                                                        <div 
                                                            key={notification._id} 
                                                            className={clsx(
                                                                "px-4 py-3 hover:bg-ink-800 transition-colors cursor-pointer",
                                                                !notification.isRead && "bg-ink-800/50"
                                                            )}
                                                            onClick={() => {
                                                                if (!notification.isRead) markAsRead(notification._id);
                                                            }}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className="shrink-0 mt-1">
                                                                    <div className="w-8 h-8 rounded-full bg-lime-400/10 flex items-center justify-center text-lime-400">
                                                                        <BookOpen size={16} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-500 text-ink-100">{notification.title}</p>
                                                                    <p className="text-xs text-ink-300 mt-0.5 line-clamp-2">{notification.message}</p>
                                                                    <p className="text-[10px] text-ink-500 mt-1">
                                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                 {DeleteNotification && (
                                                                     <button 
                                                                         onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             deleteNotification(notification._id);
                                                                         }} 
                                                                         className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1 shrink-0"
                                                                     >
                                                                         <TrashIcon size={14} />Delete
                                                                     </button>
                                                                 )}
                                                                {!notification.isRead && (
                                                                    <div className="shrink-0">
                                                                        <div className="w-2 h-2 bg-lime-400 rounded-full mt-2"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

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
                            <div className="relative" ref={settingsRef}>
                                <button
                                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-ink-800 hover:bg-ink-800 transition-all duration-200 text-ink-400"
                                    title="Settings"
                                >
                                    <Settings size={20} />
                                </button>
                                
                                {settingsDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] dark:bg-ink-950 border border-ink-800 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right flex flex-col gap-1">
                                        <button 
                                            onClick={() => { setSettingsDropdownOpen(false); navigate('/settings', { state: { tab: 'profile' }}) }}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-ink-300 hover:text-white hover:bg-[#2A2A2A] transition-colors w-full"
                                        >
                                            <User size={18} />
                                            <span>Profile Details</span>
                                        </button>
                                        <button 
                                            onClick={() => { setSettingsDropdownOpen(false); navigate('/settings', { state: { tab: 'theme' }}) }}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-ink-300 hover:text-white hover:bg-[#2A2A2A] transition-colors w-full"
                                        >
                                            <Palette size={18} />
                                            <span>Change Theme</span>
                                        </button>
                                        <button 
                                            onClick={() => { setSettingsDropdownOpen(false); navigate('/settings', { state: { tab: 'about' }}) }}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-ink-300 hover:text-white hover:bg-[#2A2A2A] transition-colors w-full"
                                        >
                                            <Info size={18} />
                                            <span>About Platform</span>
                                        </button>
                                        
                                        <div className="pt-2 mt-1 border-t border-ink-800">
                                            <button 
                                                onClick={() => { setSettingsDropdownOpen(false); isAdminRoute ? onExitAdmin() : onLogout() }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-[#FF6B6B] hover:bg-red-500/10 transition-colors w-full"
                                            >
                                                <LogOut size={18} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

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
