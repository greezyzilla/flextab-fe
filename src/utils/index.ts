// Export all utilities
export * from './storage';
export * from './tab';

// Export window utilities with explicit names to avoid conflicts
export type { WindowInfo as WindowData } from './window';
export {
  WindowCreator,
  WindowManipulator,
  WindowLayoutManager,
  WindowUtils,
  WindowEventManager,
  windowManager,
  windowCreator,
  windowManipulator,
  windowLayoutManager,
  windowUtils,
  windowEventManager
} from './window';

// Re-export WindowManager with alias to avoid conflict
export { WindowManager as WindowMgr } from './window';
