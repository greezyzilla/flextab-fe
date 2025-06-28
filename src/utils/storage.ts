/**
 * Storage utility for browser extensions and web applications
 * Supports Chrome extension storage (sync/local) and localStorage
 */

export type StorageType = 'sync' | 'local' | 'localStorage';

export interface StorageOptions {
  type?: StorageType;
  prefix?: string;
}

export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expires?: number;
}

export class StorageManager {
  private type: StorageType;
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.type = options.type || 'local';
    this.prefix = options.prefix || '';
  }

  /**
   * Get the appropriate storage API based on type
   */
  private getStorageApi() {
    if (this.type === 'localStorage') {
      return {
        get: (keys: string[]) => {
          const result: Record<string, any> = {};
          keys.forEach(key => {
            const item = window.localStorage.getItem(this.getKey(key));
            if (item) {
              try {
                result[key] = JSON.parse(item);
              } catch {
                result[key] = item;
              }
            }
          });
          return Promise.resolve(result);
        },
        set: (items: Record<string, any>) => {
          Object.entries(items).forEach(([key, value]) => {
            window.localStorage.setItem(this.getKey(key), JSON.stringify(value));
          });
          return Promise.resolve();
        },
        remove: (keys: string[]) => {
          keys.forEach(key => window.localStorage.removeItem(this.getKey(key)));
          return Promise.resolve();
        },
        clear: () => {
          if (this.prefix) {
            // Clear only prefixed items
            const keysToRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
              const key = window.localStorage.key(i);
              if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => window.localStorage.removeItem(key));
          } else {
            window.localStorage.clear();
          }
          return Promise.resolve();
        }
      };
    }

    // Chrome extension storage
    const chromeStorage = this.type === 'sync' ? chrome.storage.sync : chrome.storage.local;
    return {
      get: (keys: string[]) => chromeStorage.get(keys.map(key => this.getKey(key))),
      set: (items: Record<string, any>) => {
        const prefixedItems: Record<string, any> = {};
        Object.entries(items).forEach(([key, value]) => {
          prefixedItems[this.getKey(key)] = value;
        });
        return chromeStorage.set(prefixedItems);
      },
      remove: (keys: string[]) => chromeStorage.remove(keys.map(key => this.getKey(key))),
      clear: () => chromeStorage.clear()
    };
  }

  /**
   * Get prefixed key
   */
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  /**
   * Remove prefix from key
   */
  private removePrefix(key: string): string {
    return this.prefix && key.startsWith(`${this.prefix}:`)
      ? key.substring(this.prefix.length + 1)
      : key;
  }

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T, expiresIn?: number): Promise<void> {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expires: expiresIn ? Date.now() + expiresIn : undefined
      };

      const storage = this.getStorageApi();
      await storage.set({ [key]: item });
    } catch (error) {
      console.error('Storage set error:', error);
      throw new Error(`Failed to set storage item: ${key}`);
    }
  }

  /**
   * Get a value from storage
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const storage = this.getStorageApi();
      const result = await storage.get([key]);
      const prefixedKey = this.getKey(key);
      const item = result[prefixedKey] || result[key];

      if (!item) {
        return defaultValue;
      }

      // Handle legacy values (non-StorageItem format)
      if (typeof item !== 'object' || !('value' in item)) {
        return item as T;
      }

      const storageItem = item as StorageItem<T>;

      // Check if item has expired
      if (storageItem.expires && Date.now() > storageItem.expires) {
        await this.remove(key);
        return defaultValue;
      }

      return storageItem.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  /**
   * Get multiple values from storage
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | undefined>> {
    try {
      const storage = this.getStorageApi();
      const result = await storage.get(keys);
      const output: Record<string, T | undefined> = {};

      keys.forEach(key => {
        const prefixedKey = this.getKey(key);
        const item = result[prefixedKey] || result[key];

        if (!item) {
          output[key] = undefined;
          return;
        }

        // Handle legacy values
        if (typeof item !== 'object' || !('value' in item)) {
          output[key] = item as T;
          return;
        }

        const storageItem = item as StorageItem<T>;

        // Check if item has expired
        if (storageItem.expires && Date.now() > storageItem.expires) {
          this.remove(key); // Don't await to avoid blocking
          output[key] = undefined;
          return;
        }

        output[key] = storageItem.value;
      });

      return output;
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      const output: Record<string, T | undefined> = {};
      keys.forEach(key => {
        output[key] = undefined;
      });
      return output;
    }
  }

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<void> {
    try {
      const storage = this.getStorageApi();
      await storage.remove([key]);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw new Error(`Failed to remove storage item: ${key}`);
    }
  }

  /**
   * Remove multiple values from storage
   */
  async removeMultiple(keys: string[]): Promise<void> {
    try {
      const storage = this.getStorageApi();
      await storage.remove(keys);
    } catch (error) {
      console.error('Storage removeMultiple error:', error);
      throw new Error(`Failed to remove storage items: ${keys.join(', ')}`);
    }
  }

  /**
   * Clear all storage (or all prefixed items if prefix is set)
   */
  async clear(): Promise<void> {
    try {
      const storage = this.getStorageApi();
      await storage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Check if a key exists in storage
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys with optional prefix filter
   */
  async keys(): Promise<string[]> {
    try {
      if (this.type === 'localStorage') {
        const keys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            if (this.prefix) {
              if (key.startsWith(`${this.prefix}:`)) {
                keys.push(this.removePrefix(key));
              }
            } else {
              keys.push(key);
            }
          }
        }
        return keys;
      }

      // For Chrome storage, we need to get all items first
      const chromeStorage = this.type === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const allItems = await chromeStorage.get();
      const keys = Object.keys(allItems);

      if (this.prefix) {
        return keys
          .filter(key => key.startsWith(`${this.prefix}:`))
          .map(key => this.removePrefix(key));
      }

      return keys;
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  }

  /**
   * Get storage usage information
   */
  async getUsage(): Promise<{ bytesInUse: number; quotaBytes?: number }> {
    try {
      if (this.type === 'localStorage') {
        let bytesInUse = 0;
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            const value = window.localStorage.getItem(key);
            if (value) {
              bytesInUse += key.length + value.length;
            }
          }
        }
        return { bytesInUse };
      }

      // Chrome storage
      const chromeStorage = this.type === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const usage = await chromeStorage.getBytesInUse();
      const quotaBytes = this.type === 'sync'
        ? chrome.storage.sync.QUOTA_BYTES
        : chrome.storage.local.QUOTA_BYTES;

      return { bytesInUse: usage, quotaBytes };
    } catch (error) {
      console.error('Storage usage error:', error);
      return { bytesInUse: 0 };
    }
  }

  /**
   * Listen for storage changes
   */
  onChanged(callback: (changes: Record<string, chrome.storage.StorageChange>) => void): () => void {
    if (this.type === 'localStorage') {
      const handler = (event: StorageEvent) => {
        if (event.key && event.newValue !== event.oldValue) {
          const key = this.prefix ? this.removePrefix(event.key) : event.key;
          const changes: Record<string, chrome.storage.StorageChange> = {};
          changes[key] = {
            oldValue: event.oldValue ? JSON.parse(event.oldValue) : undefined,
            newValue: event.newValue ? JSON.parse(event.newValue) : undefined
          };
          callback(changes);
        }
      };

      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    // Chrome storage
    const handler = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === this.type) {
        const filteredChanges: Record<string, chrome.storage.StorageChange> = {};

        Object.entries(changes).forEach(([key, change]) => {
          const unprefixedKey = this.prefix ? this.removePrefix(key) : key;
          if (!this.prefix || key.startsWith(`${this.prefix}:`)) {
            filteredChanges[unprefixedKey] = change;
          }
        });

        if (Object.keys(filteredChanges).length > 0) {
          callback(filteredChanges);
        }
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }
}

// Default storage instances
export const syncStorage = new StorageManager({ type: 'sync' });
export const localStorageManager = new StorageManager({ type: 'local' });
export const webStorage = new StorageManager({ type: 'localStorage' });

// Utility functions for common operations
export const storage = {
  /**
   * Set a value with automatic storage type detection
   */
  async set<T>(key: string, value: T, options?: { type?: StorageType; expiresIn?: number }): Promise<void> {
    const manager = new StorageManager({ type: options?.type });
    return manager.set(key, value, options?.expiresIn);
  },

  /**
   * Get a value with automatic storage type detection
   */
  async get<T>(key: string, defaultValue?: T, type?: StorageType): Promise<T | undefined> {
    const manager = new StorageManager({ type });
    return manager.get(key, defaultValue);
  },

  /**
   * Remove a value with automatic storage type detection
   */
  async remove(key: string, type?: StorageType): Promise<void> {
    const manager = new StorageManager({ type });
    return manager.remove(key);
  },

  /**
   * Clear storage with automatic type detection
   */
  async clear(type?: StorageType): Promise<void> {
    const manager = new StorageManager({ type });
    return manager.clear();
  }
};

export default StorageManager;
