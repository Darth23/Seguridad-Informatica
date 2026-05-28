/**
 * useAnalytics Hook
 * Hook personalizado para gestionar analytics y métricas
 * Proporciona funciones para trackear eventos y obtener estadísticas
 */

import { useState, useEffect, useCallback } from 'react';
import {
  trackEvent,
  updateLessonMetrics,
  getLessonMetrics,
  getRecentActivity,
  getUserStats,
  exportAnalyticsData,
  importAnalyticsData,
} from '../analytics/analyticsDB';

interface UseAnalyticsReturn {
  // Event tracking
  trackEvent: (type: string, data?: Record<string, unknown>, lessonId?: string) => Promise<void>;
  
  // Lesson metrics
  updateLessonMetrics: (
    lessonId: string,
    updates: Partial<{
      attempts: number;
      completions: number;
      timeSpent: number;
      flagsFound: number;
      bestTime: number;
    }>
  ) => Promise<void>;
  
  // User stats
  userStats: {
    totalPlayTime: number;
    totalLessonsCompleted: number;
    totalFlagsCaptured: number;
    currentStreak: number;
    longestStreak: number;
    skillBreakdown: Record<string, number>;
  } | null;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  
  // Export/Import
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [userStats, setUserStats] = useState<{
    totalPlayTime: number;
    totalLessonsCompleted: number;
    totalFlagsCaptured: number;
    currentStreak: number;
    longestStreak: number;
    skillBreakdown: Record<string, number>;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const stats = await getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, []);

  const trackEventWrapper = useCallback(
    async (type: string, data?: Record<string, unknown>, lessonId?: string) => {
      await trackEvent(type, data, lessonId);
      // Actualizar stats después de trackear ciertos eventos
      if (type === 'lesson_complete' || type === 'flag_captured') {
        await loadStats();
      }
    },
    []
  );

  const updateLessonMetricsWrapper = useCallback(
    async (
      lessonId: string,
      updates: Partial<{
        attempts: number;
        completions: number;
        timeSpent: number;
        flagsFound: number;
        bestTime: number;
      }>
    ) => {
      await updateLessonMetrics(lessonId, updates);
      await loadStats();
    },
    []
  );

  const exportData = useCallback(async (): Promise<string> => {
    return exportAnalyticsData();
  }, []);

  const importDataWrapper = useCallback(async (json: string) => {
    await importAnalyticsData(json);
    await loadStats();
  }, []);

  return {
    trackEvent: trackEventWrapper,
    updateLessonMetrics: updateLessonMetricsWrapper,
    userStats,
    isLoading,
    refreshStats,
    exportData,
    importData: importDataWrapper,
  };
}

// Hook específico para métricas de una lección
interface UseLessonMetricsReturn {
  metrics: {
    lessonId: string;
    attempts: number;
    completions: number;
    timeSpent: number;
    flagsFound: number;
    lastAttempt: number;
    bestTime?: number;
  } | null;
  isLoading: boolean;
  recordAttempt: () => Promise<void>;
  recordCompletion: (timeSpent?: number, flagsFound?: number) => Promise<void>;
  recordBestTime: (time: number) => Promise<void>;
}

export function useLessonMetrics(lessonId: string): UseLessonMetricsReturn {
  const [metrics, setMetrics] = useState<{
    lessonId: string;
    attempts: number;
    completions: number;
    timeSpent: number;
    flagsFound: number;
    lastAttempt: number;
    bestTime?: number;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [lessonId]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await getLessonMetrics(lessonId);
      setMetrics(data || null);
    } catch (error) {
      console.error('Failed to load lesson metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordAttempt = useCallback(async () => {
    await updateLessonMetrics(lessonId, { attempts: 1 });
    await loadMetrics();
  }, [lessonId]);

  const recordCompletion = useCallback(
    async (timeSpent?: number, flagsFound?: number) => {
      await updateLessonMetrics(lessonId, {
        completions: 1,
        timeSpent: timeSpent || 0,
        flagsFound: flagsFound || 0,
      });
      await loadMetrics();
    },
    [lessonId]
  );

  const recordBestTime = useCallback(
    async (time: number) => {
      await updateLessonMetrics(lessonId, { bestTime: time });
      await loadMetrics();
    },
    [lessonId]
  );

  return {
    metrics,
    isLoading,
    recordAttempt,
    recordCompletion,
    recordBestTime,
  };
}

// Hook para actividad reciente
interface UseRecentActivityReturn {
  activity: Array<{
    date: string;
    lessonsCompleted: number;
    flagsCaptured: number;
    timeSpent: number;
    streak: number;
  }>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useRecentActivity(days: number = 30): UseRecentActivityReturn {
  const [activity, setActivity] = useState<Array<{
    date: string;
    lessonsCompleted: number;
    flagsCaptured: number;
    timeSpent: number;
    streak: number;
  }>>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecentActivity(days);
      setActivity(data);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  return {
    activity,
    isLoading,
    refresh: loadActivity,
  };
}

export default useAnalytics;
