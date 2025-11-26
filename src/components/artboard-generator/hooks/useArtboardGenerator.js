import { useState, useCallback, useEffect } from 'react';
import { fetchSizes, DEFAULT_SIZES } from '../api/sizesApi';
import { generateArtboards, DEFAULT_PRINT_SETTINGS, DEFAULT_LAYOUT_OPTIONS } from '../services/artboardGenerator';

/**
 * Default source configuration template
 */
const DEFAULT_SOURCE_CONFIG = {
  landscape: {
    artboard: '',
    layers: {
      background: null,
      title: null,
      overlays: null,
      cornerTopLeft: null,
      cornerTopRight: null,
      cornerBottomLeft: null,
      cornerBottomRight: null,
    },
  },
  portrait: {
    artboard: '',
    layers: {
      background: null,
      title: null,
      overlays: null,
      cornerTopLeft: null,
      cornerTopRight: null,
      cornerBottomLeft: null,
      cornerBottomRight: null,
    },
  },
  square: {
    artboard: '',
    layers: {
      background: null,
      title: null,
      overlays: null,
      cornerTopLeft: null,
      cornerTopRight: null,
      cornerBottomLeft: null,
      cornerBottomRight: null,
    },
  },
};

/**
 * Default generation options
 */
const DEFAULT_OPTIONS = {
  apiEndpoint: '',
  ...DEFAULT_LAYOUT_OPTIONS,
};

/**
 * Hook for managing artboard generator state and operations
 */
export const useArtboardGenerator = () => {
  // Source configuration state
  const [sourceConfig, setSourceConfig] = useState(DEFAULT_SOURCE_CONFIG);
  
  // Generation options state
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  
  // Print settings state
  const [printSettings, setPrintSettings] = useState(DEFAULT_PRINT_SETTINGS);
  
  // Sizes state - initialize with defaults
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [sizesError, setSizesError] = useState(null);
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' });
  const [generationError, setGenerationError] = useState(null);
  const [generatedArtboards, setGeneratedArtboards] = useState([]);

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
   * Validate configuration before generation
   */
  const validateConfig = useCallback(() => {
    const errors = [];

    // Check if at least one source is configured
    const hasSource = ['landscape', 'portrait', 'square'].some(
      (type) => sourceConfig[type]?.artboard
    );
    if (!hasSource) {
      errors.push('At least one source artboard must be configured');
    }

    return errors;
  }, [sourceConfig]);

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
      const results = await generateArtboards(
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
      setGenerationError(`Cannot generate ${size.name}: no source artboard configured for this orientation`);
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setProgress({ current: 0, total: 1, name: size.name });

    try {
      const results = await generateArtboards(
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
    setSourceConfig(DEFAULT_SOURCE_CONFIG);
    setOptions(DEFAULT_OPTIONS);
    setPrintSettings(DEFAULT_PRINT_SETTINGS);
    setSizes([]);
    setSizesError(null);
    setGenerationError(null);
    setGeneratedArtboards([]);
  }, []);

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
    loadDefaultSizes,
    clearSizes,
    
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
  };
};

export default useArtboardGenerator;
