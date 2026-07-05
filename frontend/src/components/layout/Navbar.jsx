import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [auth, setAuth] = useState({
    token: '',
    username: '',
  })

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('token') || ''
      const username = localStorage.getItem('username') || ''
      setAuth({ token, username })
    }

    syncAuth()

    const handleStorageChange = () => {
      syncAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authChanged', handleStorageChange)
    }
  }, [location.pathname])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setAuth({ token: '', username: '' })
    window.dispatchEvent(new Event('authChanged'))
    navigate('/login')
  }

  const displayName = auth.username?.trim() || 'User'

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 px-6 py-4 shadow-md backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            SmartHealth AI
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          {auth.token ? (
            <>
              <p className="text-sm font-medium text-slate-300">
                Welcome,{' '}
                <span className="font-semibold text-cyan-400">
                  {displayName}
                </span>
              </p>

              <button
                onClick={logout}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-600 hover:text-white active:scale-95"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-cyan-600 active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}