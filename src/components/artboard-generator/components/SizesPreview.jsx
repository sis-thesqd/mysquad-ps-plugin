import React, { useMemo, useState, useRef, useEffect } from 'react';
import { groupByType } from '../services/artboardGenerator';
import SizeButton from './SizeButton';

/**
 * Preview component showing loaded sizes as clickable buttons
 * with filtering and improved UX
 */
const SizesPreview = ({ sizes, onClear, onGenerateSingle, sourceConfig, disabled }) => {
  const [filterText, setFilterText] = useState('');
  const filterRef = useRef(null);

  // Handle filter input change with ref-based event handling for UXP
  useEffect(() => {
    const input = filterRef.current;
    if (!input) return;

    const handleInput = (e) => {
      setFilterText(e.target.value || '');
    };

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, []);

  // Filter and group sizes
  const { filteredSizes, groupedSizes, matchCount } = useMemo(() => {
    if (!sizes || sizes.length === 0) {
      return { filteredSizes: [], groupedSizes: {}, matchCount: 0 };
    }

    const searchTerm = filterText.toLowerCase().trim();
    const filtered = searchTerm
      ? sizes.filter(size =>
          size.name.toLowerCase().includes(searchTerm) ||
          size.type?.toLowerCase().includes(searchTerm) ||
          `${size.width}x${size.height}`.includes(searchTerm)
        )
      : sizes;

    return {
      filteredSizes: filtered,
      groupedSizes: groupByType(filtered),
      matchCount: filtered.length
    };
  }, [sizes, filterText]);

  const typeLabels = {
    social: 'Social Media',
    display: 'Display Ads',
    video: 'Video',
    email: 'Email',
    print: 'Print',
    web: 'Web',
    other: 'Other',
  };

  // Get orientation counts for info display
  const orientationCounts = useMemo(() => {
    const counts = { landscape: 0, portrait: 0, square: 0 };
    (filteredSizes || []).forEach(size => {
      const ratio = size.width / size.height;
      if (ratio < 0.85) counts.portrait++;
      else if (ratio > 1.15) counts.landscape++;
      else counts.square++;
    });
    return counts;
  }, [filteredSizes]);

  if (!sizes || sizes.length === 0) {
    return (
      <div className="sizes-preview sizes-empty">
        <div className="empty-state-icon">📐</div>
        <sp-body size="s">No sizes loaded yet</sp-body>
        <sp-body size="xs" class="empty-state-hint">
          Click "Fetch Sizes" or "Use Defaults" above to load artboard sizes
        </sp-body>
      </div>
    );
  }

  return (
    <div className="sizes-preview">
      <div className="sizes-header">
        <sp-label size="m">Sizes ({sizes.length} total)</sp-label>
        <sp-action-button size="s" quiet onClick={onClear}>
          Clear
        </sp-action-button>
      </div>

      {/* Filter input */}
      <div className="sizes-filter">
        <sp-textfield
          ref={filterRef}
          size="s"
          placeholder="Filter sizes by name, type, or dimensions..."
          value={filterText}
          quiet
        >
          <sp-icon slot="icon" name="ui:Magnify" size="s"></sp-icon>
        </sp-textfield>
        {filterText && (
          <sp-body size="xs" class="filter-count">
            {matchCount} of {sizes.length} sizes
          </sp-body>
        )}
      </div>

      {/* Orientation summary */}
      <div className="orientation-summary">
        <span className="orientation-chip" title="Landscape sizes">
          ▭ {orientationCounts.landscape}
        </span>
        <span className="orientation-chip" title="Portrait sizes">
          ▯ {orientationCounts.portrait}
        </span>
        <span className="orientation-chip" title="Square sizes">
          □ {orientationCounts.square}
        </span>
      </div>

      {/* No matches message */}
      {filterText && matchCount === 0 && (
        <div className="no-matches">
          <sp-body size="s">No sizes match "{filterText}"</sp-body>
        </div>
      )}

      <div className="sizes-groups">
        {Object.entries(groupedSizes).map(([type, typeSizes]) => {
          if (!typeSizes || typeSizes.length === 0) return null;

          return (
            <div key={type} className="size-group">
              <sp-label size="s" class="group-label">
                {typeLabels[type] || type} ({typeSizes.length})
              </sp-label>
              <div className="size-buttons">
                {typeSizes.map((size, index) => (
                  <SizeButton
                    key={`${size.name}-${index}`}
                    size={size}
                    onGenerate={onGenerateSingle}
                    disabled={disabled}
                    sourceConfig={sourceConfig || {}}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SizesPreview;
