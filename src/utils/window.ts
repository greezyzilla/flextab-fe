/**
 * Window Utilities for Flextab Extension
 * Comprehensive set of utilities for window management in Chrome extensions
 */

export type WindowInfo = chrome.windows.Window;

export interface WindowCreateOptions extends chrome.windows.CreateData {
  url?: string | string[];
  tabId?: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  focused?: boolean;
  incognito?: boolean;
  type?: 'normal' | 'popup' | 'panel';
  state?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
  setSelfAsOpener?: boolean;
}

export interface WindowUpdateOptions extends chrome.windows.UpdateInfo {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  focused?: boolean;
  drawAttention?: boolean;
  state?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
}

export interface WindowPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WindowLayout {
  windows: Array<{
    id: number;
    position: WindowPosition;
  }>;
}

/**
 * Window Query and Retrieval Functions
 */
export class WindowManager {
  /**
   * Get all windows
   */
  static async getAllWindows(populate: boolean = false): Promise<WindowInfo[]> {
    try {
      const windows = await chrome.windows.getAll({ populate });
      return windows;
    } catch (error) {
      console.error('Error getting all windows:', error);
      return [];
    }
  }

  /**
   * Get current window
   */
  static async getCurrentWindow(populate: boolean = false): Promise<WindowInfo | null> {
    try {
      const window = await chrome.windows.getCurrent({ populate });
      return window;
    } catch (error) {
      console.error('Error getting current window:', error);
      return null;
    }
  }

  /**
   * Get window by ID
   */
  static async getWindowById(windowId: number, populate: boolean = false): Promise<WindowInfo | null> {
    try {
      const window = await chrome.windows.get(windowId, { populate });
      return window;
    } catch (error) {
      console.error('Error getting window by ID:', error);
      return null;
    }
  }

  /**
   * Get focused window
   */
  static async getFocusedWindow(populate: boolean = false): Promise<WindowInfo | null> {
    try {
      const windows = await chrome.windows.getAll({ populate });
      return windows.find(window => window.focused) || null;
    } catch (error) {
      console.error('Error getting focused window:', error);
      return null;
    }
  }

  /**
   * Get normal windows (exclude popups, panels, etc.)
   */
  static async getNormalWindows(populate: boolean = false): Promise<WindowInfo[]> {
    try {
      const windows = await chrome.windows.getAll({
        populate,
        windowTypes: ['normal']
      });
      return windows;
    } catch (error) {
      console.error('Error getting normal windows:', error);
      return [];
    }
  }

  /**
   * Get incognito windows
   */
  static async getIncognitoWindows(populate: boolean = false): Promise<WindowInfo[]> {
    try {
      const windows = await chrome.windows.getAll({ populate });
      return windows.filter(window => window.incognito);
    } catch (error) {
      console.error('Error getting incognito windows:', error);
      return [];
    }
  }

  /**
   * Get popup windows
   */
  static async getPopupWindows(populate: boolean = false): Promise<WindowInfo[]> {
    try {
      const windows = await chrome.windows.getAll({
        populate,
        windowTypes: ['popup']
      });
      return windows;
    } catch (error) {
      console.error('Error getting popup windows:', error);
      return [];
    }
  }
}

/**
 * Window Creation Functions
 */
export class WindowCreator {
  /**
   * Create a new window
   */
  static async createWindow(options: WindowCreateOptions = {}): Promise<WindowInfo | null> {
    try {
      const window = await chrome.windows.create(options);
      return window;
    } catch (error) {
      console.error('Error creating window:', error);
      return null;
    }
  }

  /**
   * Create window with URL
   */
  static async createWindowWithUrl(url: string, options: WindowCreateOptions = {}): Promise<WindowInfo | null> {
    return this.createWindow({ ...options, url });
  }

  /**
   * Create window with multiple URLs
   */
  static async createWindowWithUrls(urls: string[], options: WindowCreateOptions = {}): Promise<WindowInfo | null> {
    return this.createWindow({ ...options, url: urls });
  }

  /**
   * Create popup window
   */
  static async createPopup(url: string, width: number = 400, height: number = 300): Promise<WindowInfo | null> {
    return this.createWindow({
      url,
      type: 'popup',
      width,
      height,
      focused: true
    });
  }

  /**
   * Create incognito window
   */
  static async createIncognitoWindow(url?: string): Promise<WindowInfo | null> {
    return this.createWindow({
      url,
      incognito: true,
      focused: true
    });
  }

  /**
   * Create window from tab
   */
  static async createWindowFromTab(tabId: number, options: WindowCreateOptions = {}): Promise<WindowInfo | null> {
    return this.createWindow({ ...options, tabId });
  }

  /**
   * Create fullscreen window
   */
  static async createFullscreenWindow(url?: string): Promise<WindowInfo | null> {
    return this.createWindow({
      url,
      state: 'fullscreen',
      focused: true
    });
  }

  /**
   * Create maximized window
   */
  static async createMaximizedWindow(url?: string): Promise<WindowInfo | null> {
    return this.createWindow({
      url,
      state: 'maximized',
      focused: true
    });
  }
}

/**
 * Window Manipulation Functions
 */
export class WindowManipulator {
  /**
   * Close window
   */
  static async closeWindow(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.remove(windowId);
      return true;
    } catch (error) {
      console.error('Error closing window:', error);
      return false;
    }
  }

  /**
   * Close all windows except current
   */
  static async closeAllExceptCurrent(): Promise<boolean> {
    try {
      const currentWindow = await WindowManager.getCurrentWindow();
      if (!currentWindow?.id) return false;

      const allWindows = await WindowManager.getAllWindows();
      const windowsToClose = allWindows.filter(window =>
        window.id !== currentWindow.id && window.id !== undefined
      );

      await Promise.all(
        windowsToClose.map(window => this.closeWindow(window.id!))
      );

      return true;
    } catch (error) {
      console.error('Error closing all windows except current:', error);
      return false;
    }
  }

  /**
   * Focus window
   */
  static async focusWindow(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.update(windowId, { focused: true });
      return true;
    } catch (error) {
      console.error('Error focusing window:', error);
      return false;
    }
  }

  /**
   * Update window
   */
  static async updateWindow(windowId: number, updateInfo: WindowUpdateOptions): Promise<WindowInfo | null> {
    try {
      const window = await chrome.windows.update(windowId, updateInfo);
      return window;
    } catch (error) {
      console.error('Error updating window:', error);
      return null;
    }
  }

  /**
   * Minimize window
   */
  static async minimizeWindow(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.update(windowId, { state: 'minimized' });
      return true;
    } catch (error) {
      console.error('Error minimizing window:', error);
      return false;
    }
  }

  /**
   * Maximize window
   */
  static async maximizeWindow(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.update(windowId, { state: 'maximized' });
      return true;
    } catch (error) {
      console.error('Error maximizing window:', error);
      return false;
    }
  }

  /**
   * Restore window (from minimized/maximized)
   */
  static async restoreWindow(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.update(windowId, { state: 'normal' });
      return true;
    } catch (error) {
      console.error('Error restoring window:', error);
      return false;
    }
  }

  /**
   * Toggle window state (minimize/restore)
   */
  static async toggleWindowState(windowId: number): Promise<boolean> {
    try {
      const window = await WindowManager.getWindowById(windowId);
      if (!window) return false;

      const newState = window.state === 'minimized' ? 'normal' : 'minimized';
      await chrome.windows.update(windowId, { state: newState });
      return true;
    } catch (error) {
      console.error('Error toggling window state:', error);
      return false;
    }
  }

  /**
   * Move window to position
   */
  static async moveWindow(windowId: number, left: number, top: number): Promise<boolean> {
    try {
      await chrome.windows.update(windowId, { left, top });
      return true;
    } catch (error) {
      console.error('Error moving window:', error);
      return false;
    }
  }

  /**
   * Resize window
   */
  static async resizeWindow(windowId: number, width: number, height: number): Promise<boolean> {
    try {
      await chrome.windows.update(windowId, { width, height });
      return true;
    } catch (error) {
      console.error('Error resizing window:', error);
      return false;
    }
  }

  /**
   * Set window bounds (position and size)
   */
  static async setWindowBounds(windowId: number, bounds: WindowPosition): Promise<boolean> {
    try {
      await chrome.windows.update(windowId, bounds);
      return true;
    } catch (error) {
      console.error('Error setting window bounds:', error);
      return false;
    }
  }

  /**
   * Center window on screen
   */
  static async centerWindow(windowId: number, width?: number, height?: number): Promise<boolean> {
    try {
      const window = await WindowManager.getWindowById(windowId);
      if (!window) return false;

      // Get screen dimensions (approximate)
      const screenWidth = window.width ? window.left! + window.width + 100 : 1920;
      const screenHeight = window.height ? window.top! + window.height + 100 : 1080;

      const windowWidth = width || window.width || 800;
      const windowHeight = height || window.height || 600;

      const left = Math.round((screenWidth - windowWidth) / 2);
      const top = Math.round((screenHeight - windowHeight) / 2);

      await chrome.windows.update(windowId, {
        left,
        top,
        width: windowWidth,
        height: windowHeight
      });

      return true;
    } catch (error) {
      console.error('Error centering window:', error);
      return false;
    }
  }
}

/**
 * Window Layout and Organization Functions
 */
export class WindowLayoutManager {
  /**
   * Arrange windows in a grid
   */
  static async arrangeInGrid(windowIds: number[], columns: number = 2): Promise<boolean> {
    try {
      if (windowIds.length === 0) return false;

      // Approximate screen dimensions
      const screenWidth = 1920;
      const screenHeight = 1080;
      const rows = Math.ceil(windowIds.length / columns);

      const windowWidth = Math.floor(screenWidth / columns);
      const windowHeight = Math.floor(screenHeight / rows);

      const promises = windowIds.map(async (windowId, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;

        const left = col * windowWidth;
        const top = row * windowHeight;

        return WindowManipulator.setWindowBounds(windowId, {
          left,
          top,
          width: windowWidth,
          height: windowHeight
        });
      });

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error arranging windows in grid:', error);
      return false;
    }
  }

  /**
   * Tile windows horizontally
   */
  static async tileHorizontally(windowIds: number[]): Promise<boolean> {
    try {
      if (windowIds.length === 0) return false;

      const screenWidth = 1920;
      const screenHeight = 1080;
      const windowWidth = Math.floor(screenWidth / windowIds.length);

      const promises = windowIds.map(async (windowId, index) => {
        const left = index * windowWidth;

        return WindowManipulator.setWindowBounds(windowId, {
          left,
          top: 0,
          width: windowWidth,
          height: screenHeight
        });
      });

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error tiling windows horizontally:', error);
      return false;
    }
  }

  /**
   * Tile windows vertically
   */
  static async tileVertically(windowIds: number[]): Promise<boolean> {
    try {
      if (windowIds.length === 0) return false;

      const screenWidth = 1920;
      const screenHeight = 1080;
      const windowHeight = Math.floor(screenHeight / windowIds.length);

      const promises = windowIds.map(async (windowId, index) => {
        const top = index * windowHeight;

        return WindowManipulator.setWindowBounds(windowId, {
          left: 0,
          top,
          width: screenWidth,
          height: windowHeight
        });
      });

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error tiling windows vertically:', error);
      return false;
    }
  }

  /**
   * Save window layout
   */
  static async saveLayout(name: string): Promise<boolean> {
    try {
      const windows = await WindowManager.getAllWindows();
      const layout: WindowLayout = {
        windows: windows.map(window => ({
          id: window.id!,
          position: {
            left: window.left || 0,
            top: window.top || 0,
            width: window.width || 800,
            height: window.height || 600
          }
        }))
      };

      // Save to storage (assuming you have storage utility)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [`layout_${name}`]: layout });
      }

      return true;
    } catch (error) {
      console.error('Error saving window layout:', error);
      return false;
    }
  }

  /**
   * Restore window layout
   */
  static async restoreLayout(name: string): Promise<boolean> {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) return false;

      const result = await chrome.storage.local.get([`layout_${name}`]);
      const layout: WindowLayout = result[`layout_${name}`];

      if (!layout) return false;

      const promises = layout.windows.map(async (windowInfo) => {
        try {
          const window = await WindowManager.getWindowById(windowInfo.id);
          if (window) {
            return WindowManipulator.setWindowBounds(windowInfo.id, windowInfo.position);
          }
        } catch {
          // Window might not exist anymore
        }
        return false;
      });

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error restoring window layout:', error);
      return false;
    }
  }
}

/**
 * Window Utility Functions
 */
export class WindowUtils {
  /**
   * Get window count
   */
  static async getWindowCount(): Promise<number> {
    try {
      const windows = await WindowManager.getAllWindows();
      return windows.length;
    } catch (error) {
      console.error('Error getting window count:', error);
      return 0;
    }
  }

  /**
   * Get total tab count across all windows
   */
  static async getTotalTabCount(): Promise<number> {
    try {
      const windows = await WindowManager.getAllWindows(true);
      return windows.reduce((total, window) => total + (window.tabs?.length || 0), 0);
    } catch (error) {
      console.error('Error getting total tab count:', error);
      return 0;
    }
  }

  /**
   * Check if window exists
   */
  static async windowExists(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.get(windowId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get window info summary
   */
  static async getWindowSummary(): Promise<{
    total: number;
    normal: number;
    incognito: number;
    popup: number;
    totalTabs: number;
  }> {
    try {
      const allWindows = await WindowManager.getAllWindows(true);
      const normalWindows = allWindows.filter(w => w.type === 'normal');
      const incognitoWindows = allWindows.filter(w => w.incognito);
      const popupWindows = allWindows.filter(w => w.type === 'popup');
      const totalTabs = allWindows.reduce((sum, w) => sum + (w.tabs?.filter((tab) => !!tab.url).length || 0), 0);

      return {
        total: allWindows.length,
        normal: normalWindows.length,
        incognito: incognitoWindows.length,
        popup: popupWindows.length,
        totalTabs
      };
    } catch (error) {
      console.error('Error getting window summary:', error);
      return { total: 0, normal: 0, incognito: 0, popup: 0, totalTabs: 0 };
    }
  }

  /**
   * Find windows by criteria
   */
  static async findWindows(criteria: {
    type?: 'normal' | 'popup' | 'panel' | 'app' | 'devtools';
    state?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
    incognito?: boolean;
    focused?: boolean;
  }): Promise<WindowInfo[]> {
    try {
      const allWindows = await WindowManager.getAllWindows();

      return allWindows.filter(window => {
        if (criteria.type && window.type !== criteria.type) return false;
        if (criteria.state && window.state !== criteria.state) return false;
        if (criteria.incognito !== undefined && window.incognito !== criteria.incognito) return false;
        if (criteria.focused !== undefined && window.focused !== criteria.focused) return false;
        return true;
      });
    } catch (error) {
      console.error('Error finding windows:', error);
      return [];
    }
  }
}

/**
 * Window Event Management
 */
export class WindowEventManager {
  /**
   * Listen for window created events
   */
  static onWindowCreated(callback: (window: chrome.windows.Window) => void): void {
    if (chrome.windows && chrome.windows.onCreated) {
      chrome.windows.onCreated.addListener(callback);
    }
  }

  /**
   * Listen for window removed events
   */
  static onWindowRemoved(callback: (windowId: number) => void): void {
    if (chrome.windows && chrome.windows.onRemoved) {
      chrome.windows.onRemoved.addListener(callback);
    }
  }

  /**
   * Listen for window focus changed events
   */
  static onWindowFocusChanged(callback: (windowId: number) => void): void {
    if (chrome.windows && chrome.windows.onFocusChanged) {
      chrome.windows.onFocusChanged.addListener(callback);
    }
  }

  /**
   * Listen for window bounds changed events
   */
  static onWindowBoundsChanged(callback: (window: chrome.windows.Window) => void): void {
    if (chrome.windows && chrome.windows.onBoundsChanged) {
      chrome.windows.onBoundsChanged.addListener(callback);
    }
  }

  /**
   * Remove all window event listeners
   */
  static removeAllListeners(): void {
    if (chrome.windows) {
      chrome.windows.onCreated.removeListener(() => {});
      chrome.windows.onRemoved.removeListener(() => {});
      chrome.windows.onFocusChanged.removeListener(() => {});
      if (chrome.windows.onBoundsChanged) {
        chrome.windows.onBoundsChanged.removeListener(() => {});
      }
    }
  }
}

// Export default instances for convenience
export const windowManager = WindowManager;
export const windowCreator = WindowCreator;
export const windowManipulator = WindowManipulator;
export const windowLayoutManager = WindowLayoutManager;
export const windowUtils = WindowUtils;
export const windowEventManager = WindowEventManager;

export default {
  WindowManager,
  WindowCreator,
  WindowManipulator,
  WindowLayoutManager,
  WindowUtils,
  WindowEventManager
};
