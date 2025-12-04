import React, { useMemo, useCallback } from 'react';
import { SOURCE_TYPES, ASPECT_RATIO_THRESHOLDS } from '../../../config';

/**
 * Determines the aspect ratio category of an artboard
 * @param {Object} artboard - Artboard with bounds
 * @returns {string} - 'landscape', 'portrait', or 'square'
 */
const getArtboardCategory = (artboard) => {
  if (!artboard?.bounds) return 'unknown';
  const { width, height } = artboard.bounds;
  const ratio = width / height;
  
  if (ratio < ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX) return 'portrait';
  if (ratio > ASPECT_RATIO_THRESHOLDS.SQUARE_MAX) return 'landscape';
  return 'square';
};

/**
 * Check if artboard matches the expected category
 * @param {Object} artboard - Artboard with bounds  
 * @param {string} expectedCategory - Expected category id
 * @returns {boolean}
 */
const isMatchingAspectRatio = (artboard, expectedCategory) => {
  return getArtboardCategory(artboard) === expectedCategory;
};

/**
 * Category icons/emojis for each source type
 */
const CATEGORY_ICONS = {
  landscape: '🖼️',
  portrait: '📱',
  square: '⬜',
};

/**
 * Instagram-style artboard selector
 * Shows artboards grouped by aspect ratio with smart matching indicators
 */
const ArtboardSelector = ({ 
  artboards, 
  sourceConfig, 
  onConfigChange,
  onRefresh,
  refreshing
}) => {

  // Handle artboard selection for a category
  const handleSelectArtboard = useCallback((categoryId, artboardName) => {
    const currentSelection = sourceConfig[categoryId]?.artboard;
    const newSelection = currentSelection === artboardName ? '' : artboardName;
    
    onConfigChange({
      ...sourceConfig,
      [categoryId]: {
        ...sourceConfig[categoryId],
        artboard: newSelection,
      },
    });
  }, [sourceConfig, onConfigChange]);

  // Group artboards by their natural aspect ratio
  const artboardsByCategory = useMemo(() => {
    const grouped = { landscape: [], portrait: [], square: [] };
    
    artboards.forEach(ab => {
      const category = getArtboardCategory(ab);
      if (grouped[category]) {
        grouped[category].push(ab);
      }
    });
    
    return grouped;
  }, [artboards]);

  // Get count of selected artboards
  const selectedCount = useMemo(() => {
    return SOURCE_TYPES.filter(s => sourceConfig[s.id]?.artboard).length;
  }, [sourceConfig]);

  return (
    <div className="artboard-selector">
      <div className="selector-header">
        <sp-body size="xs" class="selector-hint">
          {selectedCount}/3 sources selected
        </sp-body>
        <button 
          type="button" 
          className="refresh-btn"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh artboards"
        >
          {refreshing ? '...' : '↻'}
        </button>
      </div>

      {SOURCE_TYPES.map((sourceType) => {
        const selectedArtboard = sourceConfig[sourceType.id]?.artboard;
        const hasSelection = !!selectedArtboard;

        return (
          <div key={sourceType.id} className="selector-category">
            {/* Category Header - Simple text */}
            <div className="category-header">
              <span className="category-icon">{CATEGORY_ICONS[sourceType.id]}</span>
              <span className="category-label">{sourceType.label}</span>
              {hasSelection && <span className="category-check">✓</span>}
            </div>

            {/* Artboard Pills */}
            <div className="artboard-pills">
              {artboards.length === 0 ? (
                <sp-body size="xs" class="no-artboards">No artboards</sp-body>
              ) : (
                artboards.map((ab) => {
                  const isSelected = selectedArtboard === ab.name;
                  const isMatching = isMatchingAspectRatio(ab, sourceType.id);
                  
                  return (
                    <button
                      key={ab.id}
                      type="button"
                      className={`artboard-pill ${isSelected ? 'artboard-pill--selected' : ''} ${isMatching ? 'artboard-pill--matching' : ''}`}
                      onClick={() => handleSelectArtboard(sourceType.id, ab.name)}
                      title={ab.name}
                    >
                      {isMatching && <span className="match-indicator">●</span>}
                      <span className="pill-name">{ab.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ArtboardSelector;

