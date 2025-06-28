/**
 * Tab Utilities for Flextab Extension
 * Comprehensive set of utilities for tab management in Chrome extensions
 */

// Use Chrome's native Tab type for better compatibility
export type TabInfo = chrome.tabs.Tab

export interface TabGroup {
  id: number
  title?: string
  color: chrome.tabGroups.ColorEnum
  collapsed: boolean
  windowId: number
}

export interface WindowInfo {
  id?: number
  focused?: boolean
  top?: number
  left?: number
  width?: number
  height?: number
  tabs?: TabInfo[]
  incognito?: boolean
  type?: 'normal' | 'popup' | 'panel' | 'app' | 'devtools'
  state?: 'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'
}

/**
 * Tab Query and Retrieval Functions
 */
export class TabManager {
  /**
   * Get all tabs across all windows
   */
  static async getAllTabs(): Promise<TabInfo[]> {
    try {
      const tabs = await chrome.tabs.query({})
      return tabs
    } catch (error) {
      console.error('Error getting all tabs:', error)
      return []
    }
  }

  /**
   * Get tabs in current window
   */
  static async getCurrentWindowTabs(): Promise<TabInfo[]> {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true })
      return tabs.filter((tab) => !!tab.url)
    } catch (error) {
      console.error('Error getting current window tabs:', error)
      return []
    }
  }

  /**
   * Get active tab in current window
   */
  static async getActiveTab(): Promise<TabInfo | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      return tab || null
    } catch (error) {
      console.error('Error getting active tab:', error)
      return null
    }
  }

  /**
   * Get tab by ID
   */
  static async getTabById(tabId: number): Promise<TabInfo | null> {
    try {
      const tab = await chrome.tabs.get(tabId)
      return tab
    } catch (error) {
      console.error('Error getting tab by ID:', error)
      return null
    }
  }

  /**
   * Query tabs with specific criteria
   */
  static async queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<TabInfo[]> {
    try {
      const tabs = await chrome.tabs.query(queryInfo)
      return tabs
    } catch (error) {
      console.error('Error querying tabs:', error)
      return []
    }
  }

  /**
   * Get pinned tabs
   */
  static async getPinnedTabs(): Promise<TabInfo[]> {
    return this.queryTabs({ pinned: true })
  }

  /**
   * Get tabs by URL pattern
   */
  static async getTabsByUrl(urlPattern: string): Promise<TabInfo[]> {
    try {
      const allTabs = await this.getAllTabs()
      return allTabs.filter(tab =>
        tab.url && tab.url.includes(urlPattern)
      )
    } catch (error) {
      console.error('Error getting tabs by URL:', error)
      return []
    }
  }

  /**
   * Get tabs by domain
   */
  static async getTabsByDomain(domain: string): Promise<TabInfo[]> {
    try {
      const allTabs = await this.getAllTabs()
      return allTabs.filter(tab => {
        if (!tab.url) return false
        try {
          const url = new URL(tab.url)
          return url.hostname === domain || url.hostname.endsWith('.' + domain)
        } catch {
          return false
        }
      })
    } catch (error) {
      console.error('Error getting tabs by domain:', error)
      return []
    }
  }
}

/**
 * Tab Creation and Navigation Functions
 */
export class TabCreator {
  /**
   * Create a new tab
   */
  static async createTab(createProperties: chrome.tabs.CreateProperties): Promise<TabInfo | null> {
    try {
      const tab = await chrome.tabs.create(createProperties)
      return tab
    } catch (error) {
      console.error('Error creating tab:', error)
      return null
    }
  }

  /**
   * Open URL in new tab
   */
  static async openUrl(url: string, active: boolean = true): Promise<TabInfo | null> {
    return this.createTab({ url, active })
  }

  /**
   * Open multiple URLs in new tabs
   */
  static async openMultipleUrls(urls: string[], active: boolean = false): Promise<TabInfo[]> {
    try {
      const tabs = await Promise.all(
        urls.map(url => this.createTab({ url, active }))
      )
      return tabs.filter(tab => tab !== null) as TabInfo[]
    } catch (error) {
      console.error('Error opening multiple URLs:', error)
      return []
    }
  }

  /**
   * Duplicate a tab
   */
  static async duplicateTab(tabId: number): Promise<TabInfo | null> {
    try {
      const tab = await chrome.tabs.duplicate(tabId)
      return tab
    } catch (error) {
      console.error('Error duplicating tab:', error)
      return null
    }
  }
}

/**
 * Tab Manipulation Functions
 */
export class TabManipulator {
  /**
   * Close a tab
   */
  static async closeTab(tabId: number): Promise<boolean> {
    try {
      await chrome.tabs.remove(tabId)
      return true
    } catch (error) {
      console.error('Error closing tab:', error)
      return false
    }
  }

  /**
   * Close multiple tabs
   */
  static async closeTabs(tabIds: number[]): Promise<boolean> {
    try {
      await chrome.tabs.remove(tabIds)
      return true
    } catch (error) {
      console.error('Error closing tabs:', error)
      return false
    }
  }

  /**
   * Close all tabs except specified ones
   */
  static async closeAllExcept(keepTabIds: number[]): Promise<boolean> {
    try {
      const allTabs = await TabManager.getAllTabs()
      const tabsToClose = allTabs
        .filter(tab => tab.id && !keepTabIds.includes(tab.id))
        .map(tab => tab.id!)

      if (tabsToClose.length > 0) {
        await chrome.tabs.remove(tabsToClose)
      }
      return true
    } catch (error) {
      console.error('Error closing tabs except specified:', error)
      return false
    }
  }

  /**
   * Close duplicate tabs
   */
  static async closeDuplicateTabs(): Promise<number> {
    try {
      const allTabs = await TabManager.getAllTabs()
      const urlMap = new Map<string, TabInfo[]>()

      // Group tabs by URL
      allTabs.forEach(tab => {
        if (tab.url) {
          if (!urlMap.has(tab.url)) {
            urlMap.set(tab.url, [])
          }
          urlMap.get(tab.url)!.push(tab)
        }
      })

      // Find duplicates and close them (keep the first one)
      let closedCount = 0
      for (const [, tabs] of urlMap) {
        if (tabs.length > 1) {
          const tabsToClose = tabs.slice(1).map(tab => tab.id!).filter(id => id !== undefined)
          if (tabsToClose.length > 0) {
            await chrome.tabs.remove(tabsToClose)
            closedCount += tabsToClose.length
          }
        }
      }

      return closedCount
    } catch (error) {
      console.error('Error closing duplicate tabs:', error)
      return 0
    }
  }

  /**
   * Move tab to specific position
   */
  static async moveTab(tabId: number, index: number): Promise<TabInfo | null> {
    try {
      const tabs = await chrome.tabs.move(tabId, { index })
      return Array.isArray(tabs) ? tabs[0] : tabs
    } catch (error) {
      console.error('Error moving tab:', error)
      return null
    }
  }

  /**
   * Move tab to different window
   */
  static async moveTabToWindow(tabId: number, windowId: number, index?: number): Promise<TabInfo | null> {
    try {
      const moveProperties: chrome.tabs.MoveProperties = { windowId, index: index ?? -1 }
      const tabs = await chrome.tabs.move(tabId, moveProperties)
      return Array.isArray(tabs) ? tabs[0] : tabs
    } catch (error) {
      console.error('Error moving tab to window:', error)
      return null
    }
  }

  /**
   * Pin/Unpin tab
   */
  static async togglePin(tabId: number): Promise<boolean> {
    try {
      const tab = await chrome.tabs.get(tabId)
      await chrome.tabs.update(tabId, { pinned: !tab.pinned })
      return true
    } catch (error) {
      console.error('Error toggling pin:', error)
      return false
    }
  }

  /**
   * Mute/Unmute tab
   */
  static async toggleMute(tabId: number): Promise<boolean> {
    try {
      const tab = await chrome.tabs.get(tabId)
      const muted = tab.mutedInfo?.muted || false
      await chrome.tabs.update(tabId, { muted: !muted })
      return true
    } catch (error) {
      console.error('Error toggling mute:', error)
      return false
    }
  }

  /**
   * Reload tab
   */
  static async reloadTab(tabId: number, bypassCache: boolean = false): Promise<boolean> {
    try {
      await chrome.tabs.reload(tabId, { bypassCache })
      return true
    } catch (error) {
      console.error('Error reloading tab:', error)
      return false
    }
  }

  /**
   * Activate/Focus tab
   */
  static async activateTab(tabId: number): Promise<boolean> {
    try {
      await chrome.tabs.update(tabId, { active: true })
      return true
    } catch (error) {
      console.error('Error activating tab:', error)
      return false
    }
  }
}

/**
 * Tab Grouping Functions
 */
export class TabGroupManager {
  /**
   * Create a new tab group
   */
  static async createGroup(tabIds: number[], title?: string, color?: chrome.tabGroups.ColorEnum): Promise<number | null> {
    try {
      const groupId = await chrome.tabs.group({ tabIds })

      if (title || color) {
        await chrome.tabGroups.update(groupId, {
          title: title || '',
          color: color || 'grey'
        })
      }

      return groupId
    } catch (error) {
      console.error('Error creating tab group:', error)
      return null
    }
  }

  /**
   * Add tabs to existing group
   */
  static async addTabsToGroup(tabIds: number[], groupId: number): Promise<boolean> {
    try {
      await chrome.tabs.group({ tabIds, groupId })
      return true
    } catch (error) {
      console.error('Error adding tabs to group:', error)
      return false
    }
  }

  /**
   * Remove tabs from group
   */
  static async ungroupTabs(tabIds: number[]): Promise<boolean> {
    try {
      await chrome.tabs.ungroup(tabIds)
      return true
    } catch (error) {
      console.error('Error ungrouping tabs:', error)
      return false
    }
  }

  /**
   * Update group properties
   */
  static async updateGroup(groupId: number, updateProperties: chrome.tabGroups.UpdateProperties): Promise<boolean> {
    try {
      await chrome.tabGroups.update(groupId, updateProperties)
      return true
    } catch (error) {
      console.error('Error updating group:', error)
      return false
    }
  }

  /**
   * Get all tab groups
   */
  static async getAllGroups(): Promise<TabGroup[]> {
    try {
      const groups = await chrome.tabGroups.query({})
      return groups
    } catch (error) {
      console.error('Error getting all groups:', error)
      return []
    }
  }

  /**
   * Collapse/Expand group
   */
  static async toggleGroupCollapse(groupId: number): Promise<boolean> {
    try {
      const group = await chrome.tabGroups.get(groupId)
      await chrome.tabGroups.update(groupId, { collapsed: !group.collapsed })
      return true
    } catch (error) {
      console.error('Error toggling group collapse:', error)
      return false
    }
  }
}

/**
 * Window Management Functions
 */
export class WindowManager {
  /**
   * Get all windows
   */
  static async getAllWindows(): Promise<WindowInfo[]> {
    try {
      const windows = await chrome.windows.getAll({ populate: true })
      return windows
    } catch (error) {
      console.error('Error getting all windows:', error)
      return []
    }
  }

  /**
   * Get current window
   */
  static async getCurrentWindow(): Promise<WindowInfo | null> {
    try {
      const window = await chrome.windows.getCurrent({ populate: true })
      return window
    } catch (error) {
      console.error('Error getting current window:', error)
      return null
    }
  }

  /**
   * Create new window with tabs
   */
  static async createWindow(createData?: chrome.windows.CreateData): Promise<WindowInfo | null> {
    try {
      const window = await chrome.windows.create(createData)
      return window
    } catch (error) {
      console.error('Error creating window:', error)
      return null
    }
  }

  /**
   * Close window
   */
  static async closeWindow(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.remove(windowId)
      return true
    } catch (error) {
      console.error('Error closing window:', error)
      return false
    }
  }
}

/**
 * Tab Utility Helper Functions
 */
export class TabUtils {
  /**
   * Get domain from URL
   */
  static getDomainFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return null
    }
  }

  /**
   * Check if URL is valid
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Format tab title for display
   */
  static formatTabTitle(title: string, maxLength: number = 50): string {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength - 3) + '...'
  }

  /**
   * Get tab count by domain
   */
  static async getTabCountByDomain(): Promise<Map<string, number>> {
    try {
      const tabs = await TabManager.getAllTabs()
      const domainCount = new Map<string, number>()

      tabs.forEach(tab => {
        if (tab.url) {
          const domain = this.getDomainFromUrl(tab.url)
          if (domain) {
            domainCount.set(domain, (domainCount.get(domain) || 0) + 1)
          }
        }
      })

      return domainCount
    } catch (error) {
      console.error('Error getting tab count by domain:', error)
      return new Map()
    }
  }

  /**
   * Sort tabs by various criteria
   */
  static sortTabs(tabs: TabInfo[], criteria: 'title' | 'url' | 'index' = 'title'): TabInfo[] {
    return [...tabs].sort((a, b) => {
      switch (criteria) {
      case 'title':
        return (a.title || '').localeCompare(b.title || '')
      case 'url':
        return (a.url || '').localeCompare(b.url || '')
      case 'index':
        return (a.index || 0) - (b.index || 0)
      default:
        return 0
      }
    })
  }

  /**
   * Filter tabs by status
   */
  static filterTabsByStatus(tabs: TabInfo[], status: string): TabInfo[] {
    return tabs.filter(tab => tab.status === status)
  }

  /**
   * Search tabs by title or URL
   */
  static searchTabs(tabs: TabInfo[], query: string): TabInfo[] {
    const lowerQuery = query.toLowerCase()
    return tabs.filter(tab =>
      (tab.title?.toLowerCase().includes(lowerQuery)) ||
      (tab.url?.toLowerCase().includes(lowerQuery))
    )
  }
}

/**
 * Tab Event Listeners and Monitoring
 */
export class TabEventManager {
  /**
   * Listen for tab updates
   */
  static onTabUpdated(callback: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void): void {
    chrome.tabs.onUpdated.addListener(callback)
  }

  /**
   * Remove tab updated listener
   */
  static removeTabUpdatedListener(callback: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void): void {
    chrome.tabs.onUpdated.removeListener(callback)
  }

  /**
   * Listen for tab creation
   */
  static onTabCreated(callback: (tab: chrome.tabs.Tab) => void): void {
    chrome.tabs.onCreated.addListener(callback)
  }

  /**
   * Remove tab created listener
   */
  static removeTabCreatedListener(callback: (tab: chrome.tabs.Tab) => void): void {
    chrome.tabs.onCreated.removeListener(callback)
  }

  /**
   * Listen for tab removal
   */
  static onTabRemoved(callback: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void): void {
    chrome.tabs.onRemoved.addListener(callback)
  }

  /**
   * Remove tab removed listener
   */
  static removeTabRemovedListener(callback: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void): void {
    chrome.tabs.onRemoved.removeListener(callback)
  }

  /**
   * Listen for tab activation
   */
  static onTabActivated(callback: (activeInfo: chrome.tabs.TabActiveInfo) => void): void {
    chrome.tabs.onActivated.addListener(callback)
  }

  /**
   * Remove tab activated listener
   */
  static removeTabActivatedListener(callback: (activeInfo: chrome.tabs.TabActiveInfo) => void): void {
    chrome.tabs.onActivated.removeListener(callback)
  }

  /**
   * Listen for tab moves
   */
  static onTabMoved(callback: (tabId: number, moveInfo: chrome.tabs.TabMoveInfo) => void): void {
    chrome.tabs.onMoved.addListener(callback)
  }

  /**
   * Remove tab moved listener
   */
  static removeTabMovedListener(callback: (tabId: number, moveInfo: chrome.tabs.TabMoveInfo) => void): void {
    chrome.tabs.onMoved.removeListener(callback)
  }
}
