import { Link } from 'react-router-dom'
import { Building2, Home, Moon, Sun } from 'lucide-react'
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
              <h3 className="font-semibold mb-3 text-sm sm:text-base">Project credits</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-3">
                Gdańsk University of Technology · Katedra Transformacji Miasta
              </p>
              <ul className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-1">
                <li>dr hab. inż. arch. Justyna Martyniuk-Pęczek</li>
                <li>dr inż. Natalia Sokół</li>
                <li>dr inż. arch. Adam Bladowski</li>
                <li>mgr inż. Anna Zackiewicz</li>
              </ul>
              <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Prof. Cláudia Naves David Amorim · University of Brasília, Brazil
                {' '}(<a href="https://task70.iea-shc.org/participants" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">IEA Task 70 participant</a>).
              </p>
            </div>
            
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-semibold mb-3 text-sm sm:text-base">Learn More</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Explore source-reported sun hours, daylight-potential distributions, urban-block indicators, and solar-energy data.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-xs sm:text-sm text-neutral-500">
            <p>IEA Task 70 • Educational Resource</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
