import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  WindowMgr,
  WindowCreator,
  WindowManipulator,
  WindowUtils,
  WindowEventManager,
  type WindowData,
  TabEventManager
} from '../utils';

// Types for hooks
export interface WindowHookState {
  windows: WindowData[];
  loading: boolean;
  error: string | null;
}

export interface CurrentWindowHookState {
  currentWindow: WindowData | null;
  loading: boolean;
  error: string | null;
}

export interface WindowTabsState {
  tabs: chrome.tabs.Tab[];
  loading: boolean;
  error: string | null;
}

export interface WindowSummaryState {
  total: number;
  normal: number;
  incognito: number;
  popup: number;
  totalTabs: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook untuk manage semua windows
 */
export const useWindows = (options: {
  populate?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) => {
  const { populate = false, autoRefresh = false, refreshInterval = 5000 } = options;

  const [state, setState] = useState<WindowHookState>({
    windows: [],
    loading: true,
    error: null
  });

  const fetchWindows = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const windows = await WindowMgr.getAllWindows(populate);
      if (populate) {
        windows.forEach((window, windowIndex) => {
          if (window.tabs?.length) {
            windows[windowIndex].tabs = window.tabs.filter(tab => !!tab.url)
          }
        })
      }
      setState({ windows, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch windows'
      }));
    }
  }, [populate]);

  const refresh = useCallback(() => {
    fetchWindows();
  }, [fetchWindows]);

  // Initial fetch
  useEffect(() => {
    fetchWindows();
  }, [fetchWindows]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchWindows, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWindows]);

  // Event listeners
  useEffect(() => {
    const handleWindowCreated = () => fetchWindows();
    const handleWindowRemoved = () => fetchWindows();
    const handleWindowFocusChanged = () => fetchWindows();

    WindowEventManager.onWindowCreated(handleWindowCreated);
    WindowEventManager.onWindowRemoved(handleWindowRemoved);
    WindowEventManager.onWindowFocusChanged(handleWindowFocusChanged);

    return () => {
      // Note: Chrome doesn't provide removeListener for individual callbacks
      // so we'll rely on component unmount
    };
  }, [fetchWindows]);

  return {
    ...state,
    refresh,
    fetchWindows
  };
};

/**
 * Hook untuk current window
 */
export const useCurrentWindow = (options: {
  populate?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) => {
  const { populate = false, autoRefresh = false, refreshInterval = 3000 } = options;

  const [state, setState] = useState<CurrentWindowHookState>({
    currentWindow: null,
    loading: true,
    error: null
  });

  const fetchCurrentWindow = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const currentWindow = await WindowMgr.getCurrentWindow(populate);

      if (currentWindow.tabs?.length) {
        currentWindow.tabs = currentWindow.tabs.filter(tab => !!tab.url);
      }

      setState({ currentWindow, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch current window'
      }));
    }
  }, [populate]);

  useEffect(() => {
    const handleExtensionTabActivated = () => {
      console.log('Extension tab activated, refreshing window summary...');
      fetchCurrentWindow();
    };

    TabEventManager.onTabActivated(handleExtensionTabActivated);

    return () => {
      TabEventManager.removeTabActivatedListener(handleExtensionTabActivated);
    };
  }, []);

  const refresh = useCallback(() => {
    fetchCurrentWindow();
  }, [fetchCurrentWindow]);

  // Initial fetch
  useEffect(() => {
    fetchCurrentWindow();
  }, [fetchCurrentWindow]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchCurrentWindow, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCurrentWindow]);

  // Event listeners
  useEffect(() => {
    const handleWindowFocusChanged = () => fetchCurrentWindow();
    WindowEventManager.onWindowFocusChanged(handleWindowFocusChanged);
  }, [fetchCurrentWindow]);

  return {
    ...state,
    refresh,
    fetchCurrentWindow
  };
};

/**
 * Hook untuk tabs di window tertentu
 */
export const useWindowTabs = (windowId: number | null) => {
  const [state, setState] = useState<WindowTabsState>({
    tabs: [],
    loading: true,
    error: null
  });

  const fetchWindowTabs = useCallback(async () => {
    if (!windowId) {
      setState({ tabs: [], loading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const window = await WindowMgr.getWindowById(windowId, true);
      const tabs = window?.tabs?.filter((tab) => !!tab.url) || [];
      setState({ tabs, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch window tabs'
      }));
    }
  }, [windowId]);

  const refresh = useCallback(() => {
    fetchWindowTabs();
  }, [fetchWindowTabs]);

  useEffect(() => {
    fetchWindowTabs();
  }, [fetchWindowTabs]);

  return {
    ...state,
    refresh,
    fetchWindowTabs
  };
};

/**
 * Hook untuk window summary/statistics
 */
export const useWindowSummary = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) => {
  const { autoRefresh = false, refreshInterval = 5000 } = options;

  const [state, setState] = useState<WindowSummaryState>({
    total: 0,
    normal: 0,
    incognito: 0,
    popup: 0,
    totalTabs: 0,
    loading: true,
    error: null
  });

  const fetchSummary = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const summary = await WindowUtils.getWindowSummary();
      setState({ ...summary, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch window summary'
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSummary]);

  return {
    ...state,
    refresh,
    fetchSummary
  };
};

/**
 * Hook untuk window operations (create, close, manipulate)
 */
export const useWindowOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWindow = useCallback(async (options: Parameters<typeof WindowCreator.createWindow>[0] = {}) => {
    try {
      setLoading(true);
      setError(null);
      const window = await WindowCreator.createWindow(options);
      return window;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPopup = useCallback(async (url: string, width = 400, height = 300) => {
    try {
      setLoading(true);
      setError(null);
      const window = await WindowCreator.createPopup(url, width, height);
      return window;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create popup';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createIncognito = useCallback(async (url?: string) => {
    try {
      setLoading(true);
      setError(null);
      const window = await WindowCreator.createIncognitoWindow(url);
      return window;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create incognito window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeWindow = useCallback(async (windowId: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.closeWindow(windowId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to close window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const focusWindow = useCallback(async (windowId: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.focusWindow(windowId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to focus window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const minimizeWindow = useCallback(async (windowId: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.minimizeWindow(windowId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to minimize window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const maximizeWindow = useCallback(async (windowId: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.maximizeWindow(windowId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to maximize window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreWindow = useCallback(async (windowId: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.restoreWindow(windowId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const moveWindow = useCallback(async (windowId: number, left: number, top: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.moveWindow(windowId, left, top);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const resizeWindow = useCallback(async (windowId: number, width: number, height: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.resizeWindow(windowId, width, height);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resize window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const centerWindow = useCallback(async (windowId: number, width?: number, height?: number) => {
    try {
      setLoading(true);
      setError(null);
      const success = await WindowManipulator.centerWindow(windowId, width, height);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to center window';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    // Create operations
    createWindow,
    createPopup,
    createIncognito,
    // Manipulate operations
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    moveWindow,
    resizeWindow,
    centerWindow
  };
};

/**
 * Hook untuk window filtering
 */
export const useWindowFilter = (windows: WindowData[]) => {
  const normalWindows = useMemo(() =>
    windows.filter(window => window.type === 'normal'),
  [windows]
  );

  const incognitoWindows = useMemo(() =>
    windows.filter(window => window.incognito),
  [windows]
  );

  const popupWindows = useMemo(() =>
    windows.filter(window => window.type === 'popup'),
  [windows]
  );

  const minimizedWindows = useMemo(() =>
    windows.filter(window => window.state === 'minimized'),
  [windows]
  );

  const maximizedWindows = useMemo(() =>
    windows.filter(window => window.state === 'maximized'),
  [windows]
  );

  const focusedWindow = useMemo(() =>
    windows.find(window => window.focused) || null,
  [windows]
  );

  const filterWindows = useCallback((criteria: {
    type?: 'normal' | 'popup' | 'panel' | 'app' | 'devtools';
    state?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
    incognito?: boolean;
    focused?: boolean;
  }) => {
    return windows.filter(window => {
      if (criteria.type && window.type !== criteria.type) return false;
      if (criteria.state && window.state !== criteria.state) return false;
      if (criteria.incognito !== undefined && window.incognito !== criteria.incognito) return false;
      if (criteria.focused !== undefined && window.focused !== criteria.focused) return false;
      return true;
    });
  }, [windows]);

  return {
    normalWindows,
    incognitoWindows,
    popupWindows,
    minimizedWindows,
    maximizedWindows,
    focusedWindow,
    filterWindows
  };
};

/**
 * Hook untuk window existence check
 */
export const useWindowExists = (windowId: number | null) => {
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkExists = useCallback(async () => {
    if (!windowId) {
      setExists(null);
      return;
    }

    try {
      setLoading(true);
      const windowExists = await WindowUtils.windowExists(windowId);
      setExists(windowExists);
    } catch {
      setExists(false);
    } finally {
      setLoading(false);
    }
  }, [windowId]);

  useEffect(() => {
    checkExists();
  }, [checkExists]);

  return {
    exists,
    loading,
    checkExists
  };
};

/**
 * Hook untuk window state management dengan localStorage persistence
 */
export const useWindowState = <T,>(windowId: number | null, key: string, defaultValue: T) => {
  const storageKey = windowId ? `window_${windowId}_${key}` : null;

  const [state, setState] = useState<T>(() => {
    if (!storageKey) return defaultValue;

    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;

      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextState));
        } catch (error) {
          console.warn('Failed to save window state to localStorage:', error);
        }
      }

      return nextState;
    });
  }, [storageKey]);

  const clearState = useCallback(() => {
    setState(defaultValue);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [defaultValue, storageKey]);

  return [state, updateState, clearState] as const;
};

/**
 * Combined hook untuk semua window functionality
 */
export const useWindowManager = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  populate?: boolean;
} = {}) => {
  const windows = useWindows(options);
  const currentWindow = useCurrentWindow(options);
  const summary = useWindowSummary(options);
  const operations = useWindowOperations();
  const filter = useWindowFilter(windows.windows);

  return {
    // Window data
    windows: windows.windows,
    currentWindow: currentWindow.currentWindow,
    summary,

    // Loading states
    loading: windows.loading || currentWindow.loading || summary.loading,
    error: windows.error || currentWindow.error || summary.error,

    // Operations
    operations,

    // Filters
    filter,

    // Refresh functions
    refresh: () => {
      windows.refresh();
      currentWindow.refresh();
      summary.refresh();
    },

    // Individual refresh
    refreshWindows: windows.refresh,
    refreshCurrentWindow: currentWindow.refresh,
    refreshSummary: summary.refresh
  };
};