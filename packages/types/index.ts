/**
 * Core types for CyberEdu Zero-Trust Academy Platform
 * All types are strictly typed for TypeScript strict mode
 */

/** Represents a node in the lesson roadmap tree */
export interface LessonNode {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'challenge' | 'boss';
  status: 'locked' | 'available' | 'completed';
  children?: LessonNode[];
  metadata?: {
    estimatedTime?: number; // minutes
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
  };
}

/** Challenge configuration and metadata */
export interface ChallengeMeta {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  flagHash: string; // SHA-256 hash of the flag
  hints: Array<{
    content: string;
    penalty: number; // points deducted
  }>;
  maxPoints: number;
  category: 'network' | 'crypto' | 'forensics' | 'web' | 'reverse';
  dockerized?: boolean;
  wasmModule?: string;
}

/** User progress and state management */
export interface UserState {
  userId: string;
  completedLessons: string[];
  completedChallenges: Array<{
    challengeId: string;
    pointsEarned: number;
    completedAt: string; // ISO 8601
    attempts: number;
  }>;
  achievements: string[];
  settings: {
    theme: 'dark' | 'high-contrast';
    reducedMotion: boolean;
    soundEnabled: boolean;
    language: 'es' | 'en';
  };
  analytics: {
    totalTimeSpent: number; // seconds
    dailyStreak: number;
    lastActiveDate: string; // ISO 8601
    skillBreakdown: Record<string, number>;
  };
  expandedNodes: string[]; // Sidebar state
}

/** Boss fight configuration and state machine */
export interface BossFightConfig {
  id: string;
  name: string;
  description: string;
  phases: Array<{
    id: number;
    name: string;
    health: number;
    defenses: string[];
    vulnerabilities: string[];
    attacks: Array<{
      name: string;
      damage: number;
      pattern: string;
    }>;
  }>;
  totalHealth: number;
  timeLimit?: number; // seconds
  rewards: {
    points: number;
    achievement: string;
    certificate?: boolean;
  };
}

/** Terminal session state */
export interface TerminalSession {
  id: string;
  active: boolean;
  history: string[];
  currentDirectory: string;
  environment: Record<string, string>;
  wasmModules: string[];
}

/** Analytics event for local tracking */
export interface AnalyticsEvent {
  eventId: string;
  eventType: 'lesson_start' | 'lesson_complete' | 'challenge_attempt' | 'challenge_complete' | 'achievement_unlock';
  timestamp: string; // ISO 8601
  metadata: Record<string, unknown>;
  sessionId: string;
}

/** Certificate data structure */
export interface CertificateData {
  certificateId: string;
  userId: string;
  userName: string;
  completedLessons: string[];
  totalPoints: number;
  issuedAt: string; // ISO 8601
  signatureHash: string; // SHA-256
  qrCodeData: string;
  verificationUrl: string;
}

/** PWA offline cache status */
export interface CacheStatus {
  version: string;
  cachedResources: string[];
  lastUpdated: string; // ISO 8601
  storageUsed: number; // bytes
}
