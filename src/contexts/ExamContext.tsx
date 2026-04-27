'use client'

// =============================================================================
// ExamContext
// =============================================================================
// Provides a global flag that the Header reads to hide itself during an
// active exam session, preventing navigation away from the practice page.
// =============================================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ExamContextValue {
  isExamActive: boolean
  setExamActive: (active: boolean) => void
}

const ExamContext = createContext<ExamContextValue>({
  isExamActive: false,
  setExamActive: () => {},
})

export function ExamProvider({ children }: { children: ReactNode }) {
  const [isExamActive, setIsExamActive] = useState(false)

  const setExamActive = useCallback((active: boolean) => {
    setIsExamActive(active)
  }, [])

  return (
    <ExamContext.Provider value={{ isExamActive, setExamActive }}>
      {children}
    </ExamContext.Provider>
  )
}

export function useExamContext() {
  return useContext(ExamContext)
}
