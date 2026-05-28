/**
 * Analytics Database - IndexedDB Wrapper
 * Almacena eventos, métricas por lección, actividad diaria y progreso
 * Usa la librería `idb` para una API moderna y type-safe
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Schema de la base de datos
interface AnalyticsDBSchema extends DBSchema {
  events: {
    key: number;
    value: {
      id: number;
      type: string;
      timestamp: number;
      lessonId?: string;
      data: Record<string, unknown>;
    };
    indexes: {
      byType: string;
      byTimestamp: number;
      byLesson: string;
    };
  };
  lessonMetrics: {
    key: string;
    value: {
      lessonId: string;
      attempts: number;
      completions: number;
      timeSpent: number;
      flagsFound: number;
      lastAttempt: number;
      bestTime?: number;
    };
  };
  dailyActivity: {
    key: string; // YYYY-MM-DD
    value: {
      date: string;
      lessonsCompleted: number;
      flagsCaptured: number;
      timeSpent: number;
      streak: number;
    };
  };
  userStats: {
    key: string;
    value: {
      totalPlayTime: number;
      totalLessonsCompleted: number;
      totalFlagsCaptured: number;
      currentStreak: number;
      longestStreak: number;
      skillBreakdown: Record<string, number>;
    };
  };
}

const DB_NAME = 'cyber-edu-analytics';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AnalyticsDBSchema> | null = null;

/**
 * Obtener instancia de la base de datos (singleton)
 */
export async function getDB(): Promise<IDBPDatabase<AnalyticsDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AnalyticsDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store de eventos
      const eventStore = db.createObjectStore('events', {
        keyPath: 'id',
        autoIncrement: true,
      });
      eventStore.createIndex('byType', 'type');
      eventStore.createIndex('byTimestamp', 'timestamp');
      eventStore.createIndex('byLesson', 'lessonId');

      // Store de métricas por lección
      db.createObjectStore('lessonMetrics', {
        keyPath: 'lessonId',
      });

      // Store de actividad diaria
      db.createObjectStore('dailyActivity', {
        keyPath: 'date',
      });

      // Store de estadísticas globales
      db.createObjectStore('userStats', {
        keyPath: 'key',
      });
    },
  });

  return dbInstance;
}

/**
 * Registrar un evento
 */
export async function trackEvent(
  type: string,
  data: Record<string, unknown> = {},
  lessonId?: string
): Promise<void> {
  const db = await getDB();
  
  await db.add('events', {
    type,
    timestamp: Date.now(),
    lessonId,
    data,
  });

  // Actualizar estadísticas si es relevante
  if (type === 'lesson_complete' && lessonId) {
    await incrementLessonComplete(lessonId);
  } else if (type === 'flag_captured') {
    await incrementFlagCaptured();
  }
}

/**
 * Obtener eventos filtrados
 */
export async function getEvents(filters?: {
  type?: string;
  lessonId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): Promise<Array<{ id: number; type: string; timestamp: number; lessonId?: string; data: Record<string, unknown> }>> {
  const db = await getDB();
  const tx = db.transaction('events', 'readonly');
  const store = tx.objectStore('events');
  
  let results: Array<{ id: number; type: string; timestamp: number; lessonId?: string; data: Record<string, unknown> }> = [];

  if (filters?.lessonId) {
    const index = store.index('byLesson');
    results = await index.getAll(filters.lessonId);
  } else if (filters?.type) {
    const index = store.index('byType');
    results = await index.getAll(filters.type);
  } else {
    results = await store.getAll();
  }

  // Filtrar por fecha
  if (filters?.startDate || filters?.endDate) {
    results = results.filter((event) => {
      if (filters.startDate && event.timestamp < filters.startDate) return false;
      if (filters.endDate && event.timestamp > filters.endDate) return false;
      return true;
    });
  }

  // Ordenar por timestamp descendente
  results.sort((a, b) => b.timestamp - a.timestamp);

  // Limitar resultados
  if (filters?.limit) {
    results = results.slice(0, filters.limit);
  }

  return results;
}

/**
 * Actualizar métricas de una lección
 */
export async function updateLessonMetrics(
  lessonId: string,
  updates: Partial<{
    attempts: number;
    completions: number;
    timeSpent: number;
    flagsFound: number;
    bestTime: number;
  }>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('lessonMetrics', lessonId);

  const metrics = {
    lessonId,
    attempts: (existing?.attempts || 0) + (updates.attempts || 0),
    completions: (existing?.completions || 0) + (updates.completions || 0),
    timeSpent: (existing?.timeSpent || 0) + (updates.timeSpent || 0),
    flagsFound: (existing?.flagsFound || 0) + (updates.flagsFound || 0),
    lastAttempt: Date.now(),
    bestTime: updates.bestTime
      ? Math.min(existing?.bestTime || Infinity, updates.bestTime)
      : existing?.bestTime,
  };

  await db.put('lessonMetrics', metrics);
}

/**
 * Obtener métricas de una lección
 */
export async function getLessonMetrics(
  lessonId: string
): Promise<{
  lessonId: string;
  attempts: number;
  completions: number;
  timeSpent: number;
  flagsFound: number;
  lastAttempt: number;
  bestTime?: number;
} | undefined> {
  const db = await getDB();
  return db.get('lessonMetrics', lessonId);
}

/**
 * Obtener todas las métricas de lecciones
 */
export async function getAllLessonMetrics(): Promise<Array<{
  lessonId: string;
  attempts: number;
  completions: number;
  timeSpent: number;
  flagsFound: number;
  lastAttempt: number;
  bestTime?: number;
}>> {
  const db = await getDB();
  return db.getAll('lessonMetrics');
}

/**
 * Actualizar actividad diaria
 */
export async function updateDailyActivity(
  date: string,
  updates: Partial<{
    lessonsCompleted: number;
    flagsCaptured: number;
    timeSpent: number;
    streak: number;
  }>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('dailyActivity', date);

  const activity = {
    date,
    lessonsCompleted: (existing?.lessonsCompleted || 0) + (updates.lessonsCompleted || 0),
    flagsCaptured: (existing?.flagsCaptured || 0) + (updates.flagsCaptured || 0),
    timeSpent: (existing?.timeSpent || 0) + (updates.timeSpent || 0),
    streak: updates.streak || existing?.streak || 0,
  };

  await db.put('dailyActivity', activity);
}

/**
 * Obtener actividad de los últimos N días
 */
export async function getRecentActivity(days: number = 30): Promise<Array<{
  date: string;
  lessonsCompleted: number;
  flagsCaptured: number;
  timeSpent: number;
  streak: number;
}>> {
  const db = await getDB();
  const all = await db.getAll('dailyActivity');
  
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return all
    .filter((activity) => new Date(activity.date).getTime() > cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Actualizar estadísticas globales
 */
export async function updateUserStats(
  updates: Partial<{
    totalPlayTime: number;
    totalLessonsCompleted: number;
    totalFlagsCaptured: number;
    currentStreak: number;
    longestStreak: number;
    skillBreakdown: Record<string, number>;
  }>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('userStats', 'global');

  const stats = {
    key: 'global',
    totalPlayTime: (existing?.totalPlayTime || 0) + (updates.totalPlayTime || 0),
    totalLessonsCompleted: (existing?.totalLessonsCompleted || 0) + (updates.totalLessonsCompleted || 0),
    totalFlagsCaptured: (existing?.totalFlagsCaptured || 0) + (updates.totalFlagsCaptured || 0),
    currentStreak: updates.currentStreak ?? existing?.currentStreak ?? 0,
    longestStreak: updates.longestStreak ?? existing?.longestStreak ?? 0,
    skillBreakdown: { ...existing?.skillBreakdown, ...updates.skillBreakdown },
  };

  await db.put('userStats', stats);
}

/**
 * Obtener estadísticas globales
 */
export async function getUserStats(): Promise<{
  totalPlayTime: number;
  totalLessonsCompleted: number;
  totalFlagsCaptured: number;
  currentStreak: number;
  longestStreak: number;
  skillBreakdown: Record<string, number>;
}> {
  const db = await getDB();
  const stats = await db.get('userStats', 'global');
  
  return (
    stats || {
      totalPlayTime: 0,
      totalLessonsCompleted: 0,
      totalFlagsCaptured: 0,
      currentStreak: 0,
      longestStreak: 0,
      skillBreakdown: {},
    }
  );
}

/**
 * Exportar todos los datos a JSON
 */
export async function exportAnalyticsData(): Promise<string> {
  const db = await getDB();
  
  const [events, lessonMetrics, dailyActivity, userStats] = await Promise.all([
    db.getAll('events'),
    db.getAll('lessonMetrics'),
    db.getAll('dailyActivity'),
    db.get('userStats', 'global'),
  ]);

  const data = {
    exportDate: new Date().toISOString(),
    version: DB_VERSION,
    events,
    lessonMetrics,
    dailyActivity,
    userStats,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Importar datos desde JSON
 */
export async function importAnalyticsData(json: string): Promise<void> {
  const db = await getDB();
  const data = JSON.parse(json);

  const tx = db.transaction(['events', 'lessonMetrics', 'dailyActivity', 'userStats'], 'readwrite');

  // Limpiar datos existentes
  await tx.objectStore('events').clear();
  await tx.objectStore('lessonMetrics').clear();
  await tx.objectStore('dailyActivity').clear();
  await tx.objectStore('userStats').clear();

  // Insertar nuevos datos
  if (data.events) {
    for (const event of data.events) {
      await tx.objectStore('events').add(event);
    }
  }

  if (data.lessonMetrics) {
    for (const metric of data.lessonMetrics) {
      await tx.objectStore('lessonMetrics').put(metric);
    }
  }

  if (data.dailyActivity) {
    for (const activity of data.dailyActivity) {
      await tx.objectStore('dailyActivity').put(activity);
    }
  }

  if (data.userStats) {
    await tx.objectStore('userStats').put(data.userStats);
  }

  await tx.done;
}

// Helpers internos
async function incrementLessonComplete(lessonId: string): Promise<void> {
  await updateLessonMetrics(lessonId, { completions: 1 });
  await updateUserStats({ totalLessonsCompleted: 1 });
  
  const today = new Date().toISOString().split('T')[0];
  await updateDailyActivity(today, { lessonsCompleted: 1 });
}

async function incrementFlagCaptured(): Promise<void> {
  await updateUserStats({ totalFlagsCaptured: 1 });
  
  const today = new Date().toISOString().split('T')[0];
  await updateDailyActivity(today, { flagsCaptured: 1 });
}
