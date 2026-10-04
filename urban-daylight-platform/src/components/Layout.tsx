import { Link } from 'react-router-dom'
import { Building2, Home, Moon, Shield, ShieldCheck, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAdminMode } from '../contexts/AdminModeContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAdminMode, enableAdminMode, disableAdminMode } = useAdminMode()
  const [showAdminAccess, setShowAdminAccess] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true'
    }
    return false
  })
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [darkMode])
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleAdminSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (enableAdminMode(adminPassword)) {
      setAdminPassword('')
      setAdminError('')
      setShowAdminAccess(false)
    } else {
      setAdminPassword('')
      setAdminError('Incorrect administrator password')
    }
  }
  
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-neutral-900' : 'bg-neutral-50'} transition-colors duration-500`}>
      <header className={`${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} border-b sticky top-0 z-50 transition-colors duration-500`}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1">
              <Building2 className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0 ${darkMode ? 'text-primary-400' : 'text-primary-600'} transition-colors duration-500`} />
              <div className="min-w-0">
                <h1 className={`text-sm sm:text-base md:text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-neutral-900'} transition-colors duration-500`}>
                  Atlases: IEA Task 70
                </h1>
                <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'} hidden md:block transition-colors duration-500`}>
                  Educational Resource for Architecture & Urban Studies
                </p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
              <Link 
                to="/" 
                className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium ${darkMode ? 'text-neutral-300 hover:text-primary-400' : 'text-neutral-600 hover:text-primary-600'} transition-colors`}
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>

              <div className="relative">
                {isAdminMode ? (
                  <button
                    type="button"
                    onClick={disableAdminMode}
                    aria-label="Disable admin mode"
                    title="Admin mode on · switch off"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-amber-500 bg-amber-100 px-2 text-xs font-semibold text-amber-950 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin on</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setShowAdminAccess((open) => !open); setAdminError('') }}
                    aria-expanded={showAdminAccess}
                    aria-controls="admin-access-panel"
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold ${darkMode ? 'border-neutral-600 text-neutral-300 hover:border-amber-500 hover:text-amber-300' : 'border-neutral-300 text-neutral-600 hover:border-amber-500 hover:text-amber-800'}`}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                {!isAdminMode && showAdminAccess && (
                  <form
                    id="admin-access-panel"
                    onSubmit={handleAdminSubmit}
                    className="absolute right-0 top-full mt-2 z-[60] w-[min(19rem,calc(100vw-1.5rem))] rounded-md border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <label htmlFor="admin-password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">Administrator password</label>
                    <input
                      id="admin-password"
                      type="password"
                      autoComplete="current-password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      className="mt-2 min-h-10 w-full rounded border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                    />
                    {adminError && <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{adminError}</p>}
                    <button type="submit" className="mt-3 min-h-10 w-full rounded bg-amber-700 px-3 text-sm font-semibold text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500">Enable admin mode</button>
                    <p className="mt-2 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Local inspection only. Source data is bundled with this app and is not protected by this switch.</p>
                  </form>
                )}
              </div>
              
              <button
                onClick={toggleDarkMode}
                className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${darkMode ? 'border-neutral-600 text-amber-300 hover:bg-neutral-700' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'}`}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className={`${darkMode ? 'bg-black border-neutral-700' : 'bg-neutral-900 border-neutral-800'} text-white border-t mt-8 sm:mt-12 transition-colors duration-500`}>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h3 className="font-semibold mb-3 text-sm sm:text-base">About This Platform</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                An educational resource for architecture, urbanism, and energy engineering 
                students to explore urban daylight and energy performance through data-driven analysis.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-sm sm:text-base">Research Team</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-3">
                <strong className="text-white">Gdańsk University of Technology</strong><br/>
                Department of Architecture<br/>
                <em>Katedra Transformacji Miasta</em>
              </p>
              <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-2">
                <p>
                  <strong className="text-white">dr hab. inż. arch. Justyna Martyniuk-Pęczek</strong><br/>
                  <span className="text-neutral-400 text-[10px] sm:text-xs">Head of Department</span>
                </p>
                <p>
                  <strong className="text-white">prof. Cláudia Amorim</strong>
                </p>
                <p>
                  <strong className="text-white">dr inż. Natalia Sokół</strong>
                </p>
                <p>
                  <strong className="text-white">dr inż. arch. Adam Bladowski</strong>
                </p>
                <p>
                  <strong className="text-white">mgr inż. Anna Zackiewicz</strong><br/>
                </p>
              </div>
            </div>
            
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-semibold mb-3 text-sm sm:text-base">Learn More</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                This platform demonstrates daylight factor (DF), spatial daylight autonomy (sDA), 
                and useful daylight illuminance (UDI) metrics across diverse urban contexts.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-xs sm:text-sm text-neutral-500">
            <p>© 2026 Gdańsk University of Technology • Educational Resource</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
