import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchSizes, fetchSizesByTaskId, clearSizesCache } from '../api/sizesApi';
import { generateArtboards, DEFAULT_PRINT_SETTINGS, DEFAULT_LAYOUT_OPTIONS } from '../services/artboardGenerator';
import { DEFAULT_SIZES, DEFAULT_SOURCE_CONFIG } from '../../../config';
import { getCachedTaskSizes, getCacheAgeString, getCachedGeneratorConfig, setCachedGeneratorConfig, clearCachedGeneratorConfig } from '../../../utils/storage';
import {
  createArtboardByDuplication,
  generateArtboardsBatch,
  LAYER_NAMES
} from '../services/batchArtboardService';

/**
 * Default generation options
 */
const DEFAULT_OPTIONS = {
  apiEndpoint: '',
  ...DEFAULT_LAYOUT_OPTIONS,
  useBatchMethod: true, // Use the new batch duplication method by default
};

/**
 * Get layer names from options or use defaults
 * @param {Object} options - Generation options
 * @returns {Array<string>} Layer names to transform
 */
const getLayerNamesFromOptions = (options) => [
  options.overlayLayerName || LAYER_NAMES.OVERLAY,
  options.textLayerName || LAYER_NAMES.TEXT,
  options.backgroundLayerName || LAYER_NAMES.BACKGROUND,
];

/**
 * Hook for managing artboard generator state and operations
 * @param {Object} options - Hook options
 * @param {string} options.taskId - Optional task ID to fetch sizes from
 */
export const useArtboardGenerator = ({ taskId } = {}) => {
  // Track previous taskId to detect changes
  const prevTaskIdRef = useRef(null);

  // Source configuration state - initialize from cache if available
  const [sourceConfig, setSourceConfigState] = useState(() => {
    if (taskId) {
      const cached = getCachedGeneratorConfig(taskId);
      if (cached?.sourceConfig) {
        console.log('[useArtboardGenerator] Loaded cached sourceConfig for task:', taskId);
        return cached.sourceConfig;
      }
    }
    return DEFAULT_SOURCE_CONFIG;
  });

  // Generation options state - initialize from cache if available
  const [options, setOptionsState] = useState(() => {
    if (taskId) {
      const cached = getCachedGeneratorConfig(taskId);
      if (cached?.options) {
        console.log('[useArtboardGenerator] Loaded cached options for task:', taskId);
        return { ...DEFAULT_OPTIONS, ...cached.options };
      }
    }
    return DEFAULT_OPTIONS;
  });

  // Print settings state - initialize from cache if available
  const [printSettings, setPrintSettingsState] = useState(() => {
    if (taskId) {
      const cached = getCachedGeneratorConfig(taskId);
      if (cached?.printSettings) {
        console.log('[useArtboardGenerator] Loaded cached printSettings for task:', taskId);
        return cached.printSettings;
      }
    }
    return DEFAULT_PRINT_SETTINGS;
  });

  // Sizes state - initialize from task sizes cache if available, otherwise empty
  const [sizes, setSizes] = useState(() => {
    if (taskId) {
      const cached = getCachedTaskSizes(taskId);
      if (cached?.sizes) {
        console.log('[useArtboardGenerator] Loaded cached sizes for task:', taskId);
        return cached.sizes;
      }
    }
    // Return empty array - user must load sizes from task or API
    // return DEFAULT_SIZES; // Commented out - don't use defaults
    return [];
  });
  const [sizesLoading, setSizesLoading] = useState(false);
  const [sizesError, setSizesError] = useState(null);
  const [taskName, setTaskName] = useState(() => {
    if (taskId) {
      const cached = getCachedTaskSizes(taskId);
      if (cached?.taskName) {
        return cached.taskName;
      }
    }
    return '';
  });
  const [sizesCachedAt, setSizesCachedAt] = useState(() => {
    if (taskId) {
      const cached = getCachedTaskSizes(taskId);
      if (cached?.cachedAt) {
        return cached.cachedAt;
      }
    }
    return null;
  });
  const [sizesFromCache, setSizesFromCache] = useState(() => {
    if (taskId) {
      const cached = getCachedTaskSizes(taskId);
      return !!cached;
    }
    return false;
  });

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' });
  const [generationError, setGenerationError] = useState(null);
  const [generatedArtboards, setGeneratedArtboards] = useState([]);

  // Load cached config and sizes when taskId changes
  useEffect(() => {
    if (taskId && taskId !== prevTaskIdRef.current) {
      console.log('[useArtboardGenerator] TaskId changed from', prevTaskIdRef.current, 'to', taskId);

      // Load generator config (sourceConfig, options, printSettings)
      const cachedConfig = getCachedGeneratorConfig(taskId);
      if (cachedConfig) {
        console.log('[useArtboardGenerator] Found cached config for task:', taskId, cachedConfig);
        if (cachedConfig.sourceConfig) {
          setSourceConfigState(cachedConfig.sourceConfig);
        }
        if (cachedConfig.options) {
          setOptionsState(prev => ({ ...prev, ...cachedConfig.options }));
        }
        if (cachedConfig.printSettings) {
          setPrintSettingsState(cachedConfig.printSettings);
        }
      } else {
        // Reset to defaults for new task without cache
        console.log('[useArtboardGenerator] No cached config for task, using defaults');
        setSourceConfigState(DEFAULT_SOURCE_CONFIG);
        setOptionsState(DEFAULT_OPTIONS);
        setPrintSettingsState(DEFAULT_PRINT_SETTINGS);
      }

      // Load cached sizes for this task
      const cachedSizes = getCachedTaskSizes(taskId);
      if (cachedSizes) {
        console.log('[useArtboardGenerator] Found cached sizes for task:', taskId, cachedSizes);
        setSizes(cachedSizes.sizes || []);
        setTaskName(cachedSizes.taskName || '');
        setSizesCachedAt(cachedSizes.cachedAt || null);
        setSizesFromCache(true);
      } else {
        // Reset sizes for new task without cache - empty until loaded
        console.log('[useArtboardGenerator] No cached sizes for task, starting empty');
        setSizes([]);
        setTaskName('');
        setSizesCachedAt(null);
        setSizesFromCache(false);
      }

      prevTaskIdRef.current = taskId;
    }
  }, [taskId]);

  // Wrapper for setSourceConfig that also persists to storage
  const setSourceConfig = useCallback((newConfig) => {
    setSourceConfigState(newConfig);
    if (taskId) {
      const cached = getCachedGeneratorConfig(taskId) || {};
      setCachedGeneratorConfig(taskId, {
        ...cached,
        sourceConfig: typeof newConfig === 'function' ? newConfig(sourceConfig) : newConfig,
      });
    }
  }, [taskId, sourceConfig]);

  // Wrapper for setOptions that also persists to storage
  const setOptions = useCallback((newOptions) => {
    setOptionsState(newOptions);
    if (taskId) {
      const cached = getCachedGeneratorConfig(taskId) || {};
      setCachedGeneratorConfig(taskId, {
        ...cached,
        options: typeof newOptions === 'function' ? newOptions(options) : newOptions,
      });
    }
  }, [taskId, options]);

  // Wrapper for setPrintSettings that also persists to storage
  const setPrintSettings = useCallback((newSettings) => {
    setPrintSettingsState(newSettings);
    if (taskId) {
      const cached = getCachedGeneratorConfig(taskId) || {};
      setCachedGeneratorConfig(taskId, {
        ...cached,
        printSettings: typeof newSettings === 'function' ? newSettings(printSettings) : newSettings,
      });
    }
  }, [taskId, printSettings]);

  /**
   * Fetch sizes from linked ClickUp task
   * @param {Object} options - Load options
   * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
   */
  const loadSizesFromTask = useCallback(async ({ forceRefresh = false } = {}) => {
    console.log('[loadSizesFromTask] Button clicked, taskId:', taskId, 'forceRefresh:', forceRefresh);
    
    if (!taskId) {
      console.log('[loadSizesFromTask] No taskId, showing error');
      setSizesError('No task linked to this file');
      return;
    }

    setSizesLoading(true);
    setSizesError(null);

    try {
      console.log('[loadSizesFromTask] Calling fetchSizesByTaskId...');
      const result = await fetchSizesByTaskId(taskId, { forceRefresh });
      console.log('[loadSizesFromTask] Got result:', result);
      setSizes(result.sizes);
      setTaskName(result.taskName);
      setSizesCachedAt(result.cachedAt);
      setSizesFromCache(result.fromCache);
    } catch (error) {
      console.error('[loadSizesFromTask] Error:', error);
      setSizesError(error.message);
      setSizes([]);
      setSizesCachedAt(null);
      setSizesFromCache(false);
    } finally {
      setSizesLoading(false);
    }
  }, [taskId]);

  /**
   * Force refresh sizes from task (bypass cache)
   */
  const refreshSizesFromTask = useCallback(async () => {
    return loadSizesFromTask({ forceRefresh: true });
  }, [loadSizesFromTask]);

  /**
   * Get human-readable cache age
   */
  const getCacheAge = useCallback(() => {
    return getCacheAgeString(sizesCachedAt);
  }, [sizesCachedAt]);

  /**
   * Fetch sizes from API endpoint
   */
  const loadSizes = useCallback(async () => {
    if (!options.apiEndpoint) {
      setSizesError('Please enter an API endpoint URL');
      return;
    }

    setSizesLoading(true);
    setSizesError(null);

    try {
      const fetchedSizes = await fetchSizes(options.apiEndpoint);
      setSizes(fetchedSizes);
    } catch (error) {
      setSizesError(error.message);
      setSizes([]);
    } finally {
      setSizesLoading(false);
    }
  }, [options.apiEndpoint]);

  /**
   * Load default/preset sizes
   */
  const loadDefaultSizes = useCallback(() => {
    setSizes(DEFAULT_SIZES);
    setSizesError(null);
  }, []);

  /**
   * Clear loaded sizes
   */
  const clearSizes = useCallback(() => {
    setSizes([]);
    setSizesError(null);
  }, []);

  /**
   * Validate configuration before generation with detailed, actionable errors
   */
  const validateConfig = useCallback(() => {
    const errors = [];

    // Check if at least one source is configured
    const hasSource = ['landscape', 'portrait', 'square'].some(
      (type) => sourceConfig[type]?.artboard
    );
    if (!hasSource) {
      errors.push('⚠️ No source artboards configured. Select at least one source artboard to begin.');
      return errors; // Return early if no sources at all
    }

    // Check if any sizes can be generated with current config
    if (hasSource && sizes.length > 0) {
      const orientationDetails = {
        landscape: { count: 0, examples: [] },
        portrait: { count: 0, examples: [] },
        square: { count: 0, examples: [] },
      };

      // Collect orientation needs with examples
      sizes.forEach(size => {
        const ratio = size.width / size.height;
        let orientation;
        if (ratio < 0.85) orientation = 'portrait';
        else if (ratio > 1.15) orientation = 'landscape';
        else orientation = 'square';

        orientationDetails[orientation].count++;
        if (orientationDetails[orientation].examples.length < 3) {
          orientationDetails[orientation].examples.push(size.name);
        }
      });

      // Check for missing sources with detailed info
      Object.entries(orientationDetails).forEach(([orientation, details]) => {
        if (details.count > 0 && !sourceConfig[orientation]?.artboard) {
          const icon = orientation === 'landscape' ? '▭' : orientation === 'portrait' ? '▯' : '□';
          const exampleText = details.examples.length > 0
            ? ` (e.g., ${details.examples.join(', ')}${details.count > details.examples.length ? '...' : ''})`
            : '';
          errors.push(
            `${icon} Missing ${orientation} source needed for ${details.count} size${details.count !== 1 ? 's' : ''}${exampleText}`
          );
        }
      });
    }

    return errors;
  }, [sourceConfig, sizes]);

  /**
   * Check if a specific size can be generated (has required source)
   */
  const canGenerateSize = useCallback((size) => {
    const aspectRatio = size.width / size.height;
    let sourceType;
    if (aspectRatio < 0.85) {
      sourceType = 'portrait';
    } else if (aspectRatio > 1.15) {
      sourceType = 'landscape';
    } else {
      sourceType = 'square';
    }
    return !!sourceConfig[sourceType]?.artboard;
  }, [sourceConfig]);

  /**
   * Generate artboards for all sizes
   */
  const generate = useCallback(async () => {
    const validationErrors = validateConfig();
    if (validationErrors.length > 0) {
      setGenerationError(validationErrors.join('\n'));
      return;
    }

    // Filter sizes to only those that can be generated
    const generatableSizes = sizes.filter(canGenerateSize);
    
    if (generatableSizes.length === 0) {
      setGenerationError('No sizes can be generated with current source configuration');
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setProgress({ current: 0, total: generatableSizes.length, name: '' });

    try {
      let results;
      
      if (options.useBatchMethod) {
        // Use the new batch duplication method
        results = await generateArtboardsBatch(
          generatableSizes,
          sourceConfig,
          {
            ...options,
            printSettings,
          },
          (current, total, name) => {
            setProgress({ current, total, name });
          }
        );
      } else {
        // Use the original method
        results = await generateArtboards(
        generatableSizes,
        sourceConfig,
        {
          ...options,
          printSettings,
        },
        (current, total, name) => {
          setProgress({ current, total, name });
        }
      );
      }

      setGeneratedArtboards(results);
    } catch (error) {
      setGenerationError(error.message);
    } finally {
      setGenerating(false);
    }
  }, [sizes, sourceConfig, options, printSettings, validateConfig, canGenerateSize]);

  /**
   * Generate a single artboard for one size
   */
  const generateSingle = useCallback(async (size) => {
    if (!canGenerateSize(size)) {
      const aspectRatio = size.width / size.height;
      let orientation;
      if (aspectRatio < 0.85) orientation = 'portrait ▯';
      else if (aspectRatio > 1.15) orientation = 'landscape ▭';
      else orientation = 'square □';

      setGenerationError(
        `Cannot generate "${size.name}" (${size.width}×${size.height}): Missing ${orientation} source artboard. ` +
        `Please select a ${orientation.split(' ')[0]} source in the configuration panel.`
      );
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setProgress({ current: 0, total: 1, name: size.name });

    try {
      let results;
      
      if (options.useBatchMethod) {
        // Use the new batch duplication method for single artboard
        const aspectRatio = size.width / size.height;
        let sourceType;
        if (aspectRatio < 0.85) {
          sourceType = 'portrait';
        } else if (aspectRatio > 1.15) {
          sourceType = 'landscape';
        } else {
          sourceType = 'square';
        }
        
        const source = sourceConfig[sourceType];
        
        const result = await createArtboardByDuplication({
          sourceArtboardName: source.artboard,
          targetSize: size,
          layerNames: getLayerNamesFromOptions(options),
        });
        
        results = [result];
      } else {
        // Use the original method
        results = await generateArtboards(
        [size],
        sourceConfig,
        {
          ...options,
          printSettings,
        },
        (current, total, name) => {
          setProgress({ current, total, name });
        }
      );
      }

      setGeneratedArtboards((prev) => [...prev, ...results]);
    } catch (error) {
      setGenerationError(error.message);
    } finally {
      setGenerating(false);
    }
  }, [sourceConfig, options, printSettings, canGenerateSize]);

  /**
   * Reset all state to defaults
   */
  const reset = useCallback(() => {
    setSourceConfigState(DEFAULT_SOURCE_CONFIG);
    setOptionsState(DEFAULT_OPTIONS);
    setPrintSettingsState(DEFAULT_PRINT_SETTINGS);
    setSizes([]);
    setSizesError(null);
    setGenerationError(null);
    setGeneratedArtboards([]);
    // Also clear cached config for this task
    if (taskId) {
      clearCachedGeneratorConfig(taskId);
    }
  }, [taskId]);

  return {
    // Source configuration
    sourceConfig,
    setSourceConfig,
    
    // Options
    options,
    setOptions,
    
    // Print settings
    printSettings,
    setPrintSettings,
    
    // Sizes
    sizes,
    sizesLoading,
    sizesError,
    loadSizes,
    loadSizesFromTask,
    refreshSizesFromTask,
    loadDefaultSizes,
    clearSizes,
    taskName,
    sizesCachedAt,
    sizesFromCache,
    getCacheAge,
    
    // Generation
    generating,
    progress,
    generationError,
    generatedArtboards,
    generate,
    generateSingle,
    canGenerateSize,
    validateConfig,
    
    // Utilities
    reset,
    taskId,
  };
};

export default useArtboardGenerator;
