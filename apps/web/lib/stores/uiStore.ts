import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Panel layout
  panelSizes: number[];
  setPanelSizes: (sizes: number[]) => void;
  
  // Sidebar state
  expandedNodes: string[];
  toggleNode: (nodeId: string) => void;
  setExpandedNodes: (nodes: string[]) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Focus management
  focusedPanel: 'sidebar' | 'content' | 'terminal';
  setFocusedPanel: (panel: 'sidebar' | 'content' | 'terminal') => void;
  
  // Theme
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  // Terminal
  terminalHistory: string[];
  addTerminalLine: (line: string) => void;
  clearTerminal: () => void;
  
  // Progress
  completedLessons: string[];
  markLessonComplete: (lessonId: string) => void;
  
  // Achievements
  achievements: string[];
  unlockAchievement: (achievementId: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Panel layout
      panelSizes: [20, 50, 30],
      setPanelSizes: (sizes) => set({ panelSizes: sizes }),
      
      // Sidebar state
      expandedNodes: [],
      toggleNode: (nodeId) => {
        const current = get().expandedNodes;
        if (current.includes(nodeId)) {
          set({ expandedNodes: current.filter((id) => id !== nodeId) });
        } else {
          set({ expandedNodes: [...current, nodeId] });
        }
      },
      setExpandedNodes: (nodes) => set({ expandedNodes: nodes }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Focus management
      focusedPanel: 'content',
      setFocusedPanel: (panel) => set({ focusedPanel: panel }),
      
      // Theme
      highContrast: false,
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      
      // Terminal
      terminalHistory: [],
      addTerminalLine: (line) =>
        set((state) => ({ terminalHistory: [...state.terminalHistory, line] })),
      clearTerminal: () => set({ terminalHistory: [] }),
      
      // Progress
      completedLessons: [],
      markLessonComplete: (lessonId) =>
        set((state) => {
          if (state.completedLessons.includes(lessonId)) return state;
          return { completedLessons: [...state.completedLessons, lessonId] };
        }),
      
      // Achievements
      achievements: [],
      unlockAchievement: (achievementId) =>
        set((state) => {
          if (state.achievements.includes(achievementId)) return state;
          return { achievements: [...state.achievements, achievementId] };
        }),
    }),
    {
      name: 'cyber-edu-ui-storage',
      partialize: (state) => ({
        expandedNodes: state.expandedNodes,
        highContrast: state.highContrast,
        completedLessons: state.completedLessons,
        achievements: state.achievements,
      }),
    }
  )
);

// Terminal-specific store for real-time updates
interface TerminalState {
  isReady: boolean;
  setIsReady: (ready: boolean) => void;
  commandHistory: string[];
  commandHistoryIndex: number;
  addCommand: (cmd: string) => void;
  navigateHistory: (direction: 'up' | 'down') => string | null;
  clearHistory: () => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  isReady: false,
  setIsReady: (ready) => set({ isReady: ready }),
  commandHistory: [],
  commandHistoryIndex: -1,
  addCommand: (cmd) =>
    set((state) => ({
      commandHistory: [...state.commandHistory, cmd],
      commandHistoryIndex: state.commandHistory.length,
    })),
  navigateHistory: (direction) => {
    const state = get();
    if (state.commandHistory.length === 0) return null;
    
    let newIndex = state.commandHistoryIndex;
    if (direction === 'up') {
      newIndex = Math.max(0, newIndex - 1);
    } else {
      newIndex = Math.min(state.commandHistory.length, newIndex + 1);
    }
    
    set({ commandHistoryIndex: newIndex });
    
    if (newIndex >= state.commandHistory.length) {
      return '';
    }
    return state.commandHistory[newIndex] || null;
  },
  clearHistory: () => set({ commandHistory: [], commandHistoryIndex: -1 }),
}));
