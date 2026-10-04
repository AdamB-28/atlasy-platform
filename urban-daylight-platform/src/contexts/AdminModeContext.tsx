import { createContext, useContext } from 'react'

export interface AdminModeContextValue {
  isAdminMode: boolean
  enableAdminMode: (password: string) => boolean
  disableAdminMode: () => void
}

export const AdminModeContext = createContext<AdminModeContextValue>({
  isAdminMode: false,
  enableAdminMode: () => false,
  disableAdminMode: () => undefined,
})

export function useAdminMode() {
  return useContext(AdminModeContext)
}
