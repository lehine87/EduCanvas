'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import SpotlightSearch from './SpotlightSearch'

interface SearchContextType {
  openSpotlight: () => void
  closeSpotlight: () => void
  isSpotlightOpen: boolean
}

const SearchContext = createContext<SearchContextType>({
  openSpotlight: () => {},
  closeSpotlight: () => {},
  isSpotlightOpen: false
})

export const useGlobalSearch = () => useContext(SearchContext)

interface SearchProviderProps {
  children: React.ReactNode
}

export default function SearchProvider({ children }: SearchProviderProps) {
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Space for Spotlight search
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault()
        setIsSpotlightOpen(prev => !prev)
        return
      }

    }

    // Use capture phase to intercept before browser handles it
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  const openSpotlight = () => setIsSpotlightOpen(true)
  const closeSpotlight = () => setIsSpotlightOpen(false)

  return (
    <SearchContext.Provider value={{
      openSpotlight,
      closeSpotlight,
      isSpotlightOpen
    }}>
      {children}
      <SpotlightSearch 
        isOpen={isSpotlightOpen}
        onClose={closeSpotlight}
      />
    </SearchContext.Provider>
  )
}