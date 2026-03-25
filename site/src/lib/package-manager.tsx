import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'ni'

const STORAGE_KEY = 'preferred-package-manager'
const DEFAULT: PackageManager = 'npm'

function getStored(): PackageManager {
  if (typeof window === 'undefined') return DEFAULT
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'npm' || stored === 'pnpm' || stored === 'yarn' || stored === 'ni') {
    return stored
  }
  return DEFAULT
}

const installCommands: Record<PackageManager, (pkg: string) => string> = {
  npm: (pkg) => `npm install ${pkg}`,
  pnpm: (pkg) => `pnpm add ${pkg}`,
  yarn: (pkg) => `yarn add ${pkg}`,
  ni: (pkg) => `ni ${pkg}`,
}

export function getInstallCommand(pm: PackageManager, packages: string): string {
  return installCommands[pm](packages)
}

interface PackageManagerContextValue {
  pm: PackageManager
  setPm: (pm: PackageManager) => void
}

const PackageManagerContext = createContext<PackageManagerContextValue>({
  pm: DEFAULT,
  setPm: () => {},
})

export function PackageManagerProvider({ children }: { children: ReactNode }) {
  const [pm, setPmState] = useState<PackageManager>(DEFAULT)

  useEffect(() => {
    setPmState(getStored())
  }, [])

  const setPm = useCallback((next: PackageManager) => {
    setPmState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return (
    <PackageManagerContext.Provider value={{ pm, setPm }}>
      {children}
    </PackageManagerContext.Provider>
  )
}

export function usePackageManager() {
  return useContext(PackageManagerContext)
}
