// =============================================================================
// Application Constants
// =============================================================================
// Centralized constants referenced throughout the app.
// Values are derived from the spec (§3.1, §3.3).
// =============================================================================

/** Timer durations in seconds per writing mode */
export const TIMER_DURATION_SECONDS = {
  EMAIL: 420,       // 7 minutes
  DISCUSSION: 600,  // 10 minutes
} as const

/** Warning threshold in seconds (2 minutes remaining) */
export const TIMER_WARNING_THRESHOLD_SECONDS = 120

/** Recommended word count targets per writing mode */
export const WORD_COUNT_TARGETS = {
  EMAIL: {
    min: 100,
    max: 130,
    label: '100–130 words',
  },
  DISCUSSION: {
    min: 100,
    max: Infinity,
    label: '100+ words',
  },
} as const

/** Adaptive difficulty thresholds (spec §3.3) */
export const ADAPTIVE_DIFFICULTY = {
  /** Minimum submissions before level can change */
  MIN_SUBMISSIONS_FOR_CHANGE: 3,
  /** Number of recent submissions to consider */
  SLIDING_WINDOW_SIZE: 5,
  /** Score threshold: below this → Beginner */
  BEGINNER_THRESHOLD: 2.0,
  /** Score threshold: above this → Advanced */
  ADVANCED_THRESHOLD: 3.5,
} as const

/** Score range for ETS rubric */
export const SCORE_RANGE = {
  MIN: 0,
  MAX: 5,
} as const

/** Default Ollama endpoint */
export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434'

/** Ollama model name */
export const OLLAMA_MODEL = 'gemma4'

/** LocalStorage keys */
export const STORAGE_KEYS = {
  LLM_CONFIG: 'toefl-helper-llm-config',
  AUTH_TOKEN: 'toefl-helper-auth-token',
  DIFFICULTY_OVERRIDE: 'toefl-helper-difficulty-override',
} as const
