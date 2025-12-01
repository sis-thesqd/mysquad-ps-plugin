/**
 * Component exports
 */

// UI components
export { default as Header } from './ui/Header';
export { default as TabNavigation } from './ui/TabNavigation';
export { default as SubTabNavigation } from './ui/SubTabNavigation';

// Feature components
export { default as FolderDetailsCard } from './folder-details/components/FolderDetailsCard';
export { default as TaskDetailsCard } from './task-details/components/TaskDetailsCard';
export { default as ActionsCard } from './actions/components/ActionsCard';
export { default as TaskSearchDialog } from './folder-details/components/TaskSearchDialog';

// Artboard Generator
export { ArtboardGeneratorTab } from './artboard-generator';

// Hooks
export { useFolderDetails } from './folder-details/hooks/useFolderDetails';

// API utilities
export {
  extractTaskIdFromPath,
  getTaskDetails,
  getCurrentDocumentPath,
} from './folder-details/api/folderApi';
