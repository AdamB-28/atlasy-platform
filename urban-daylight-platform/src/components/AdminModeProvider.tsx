import { useState } from 'react'
import { AdminModeContext } from '../contexts/AdminModeContext'

const ADMIN_PASSWORD = 'KTMadmin!'

export default function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(() => sessionStorage.getItem('adminMode') === 'true')

  const enableAdminMode = (candidate: string) => {
    if (candidate !== ADMIN_PASSWORD) return false
    setIsAdminMode(true)
    sessionStorage.setItem('adminMode', 'true')
    return true
  }

  const disableAdminMode = () => {
    setIsAdminMode(false)
    sessionStorage.removeItem('adminMode')
  }

  return (
    <AdminModeContext.Provider value={{ isAdminMode, enableAdminMode, disableAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  )
}
