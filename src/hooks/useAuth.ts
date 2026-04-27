// Re-export from the shared AuthContext so all consumers get the same state.
// The actual implementation lives in src/contexts/AuthContext.tsx.
export { useAuth } from '@/contexts/AuthContext'
