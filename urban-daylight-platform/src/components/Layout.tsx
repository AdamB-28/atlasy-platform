import { Link } from 'react-router-dom'
import { Building2, Home } from 'lucide-react'
import { useState, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
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
              
              {/* Dark Mode Toggle with Sunrise/Sunset Animation */}
              <button
                onClick={toggleDarkMode}
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden group shadow-lg flex-shrink-0"
                aria-label="Toggle dark mode"
                title={darkMode ? "Switch to day mode" : "Switch to night mode"}
              >
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  darkMode 
                    ? 'bg-gradient-to-b from-indigo-900 via-purple-900 to-orange-900' 
                    : 'bg-gradient-to-b from-sky-400 via-orange-400 to-yellow-300'
                }`}>
                  {/* Stars for night mode */}
                  {darkMode && (
                    <>
                      <div className="absolute top-2 left-3 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute top-4 right-4 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute top-6 left-6 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    </>
                  )}
                  
                  {/* Sun/Moon with gradient */}
                  <div 
                    className={`absolute w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all duration-1000 ease-in-out ${
                      darkMode 
                        ? 'top-8 right-3 bg-gradient-to-br from-slate-200 to-slate-400 shadow-lg shadow-slate-400/50' 
                        : 'top-3 right-4 bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-400 shadow-lg shadow-yellow-400/50'
                    }`}
                  >
                    {/* Moon craters */}
                    {darkMode && (
                      <>
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-300/40"></div>
                        <div className="absolute bottom-2 left-1 w-1 h-1 rounded-full bg-slate-300/40"></div>
                      </>
                    )}
                  </div>
                  
                  {/* Horizon line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-4 transition-all duration-1000 ${
                    darkMode 
                      ? 'bg-gradient-to-t from-neutral-900 to-transparent' 
                      : 'bg-gradient-to-t from-green-600/20 to-transparent'
                  }`}></div>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
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
