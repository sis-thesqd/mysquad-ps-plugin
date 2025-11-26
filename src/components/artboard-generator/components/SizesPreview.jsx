import React, { useMemo } from 'react';
import { groupByType, determineSourceType } from '../services/artboardGenerator';

/**
 * Single size button that generates one artboard when clicked
 */
const SizeButton = ({ size, onGenerate, disabled, sourceConfig }) => {
  const sourceType = determineSourceType(size.width / size.height);
  const hasSource = sourceConfig[sourceType]?.artboard;
  
  const sourceTypeIcons = {
    landscape: '▭',
    portrait: '▯',
    square: '□',
  };

  const handleClick = () => {
    if (hasSource && onGenerate) {
      onGenerate(size);
    }
  };

  return (
    <button
      className={`size-button ${!hasSource ? 'size-button-disabled' : ''} ${size.requiresBleed ? 'size-button-print' : ''}`}
      onClick={handleClick}
      disabled={disabled || !hasSource}
      title={!hasSource ? `No ${sourceType} source artboard configured` : `Generate ${size.name}`}
    >
      <span className="size-source-icon">{sourceTypeIcons[sourceType]}</span>
      <span className="size-name">{size.name}</span>
      <span className="size-dimensions">{size.width}×{size.height}</span>
      {size.requiresBleed && <span className="size-badge">Print</span>}
    </button>
  );
};

/**
 * Preview component showing loaded sizes as clickable buttons
 */
const SizesPreview = ({ sizes, onClear, onGenerateSingle, sourceConfig, disabled }) => {
  const groupedSizes = useMemo(() => {
    if (!sizes || sizes.length === 0) return {};
    return groupByType(sizes);
  }, [sizes]);

  const typeLabels = {
    social: 'Social Media',
    display: 'Display Ads',
    video: 'Video',
    email: 'Email',
    print: 'Print',
    web: 'Web',
    other: 'Other',
  };

  if (!sizes || sizes.length === 0) {
    return (
      <div className="sizes-preview sizes-empty">
        <sp-body size="s">No sizes loaded. Click "Use Defaults" to load standard sizes.</sp-body>
      </div>
    );
  }

  return (
    <div className="sizes-preview">
      <div className="sizes-header">
        <sp-label size="m">Click a size to generate ({sizes.length} available)</sp-label>
        <sp-action-button size="s" quiet onClick={onClear}>
          Clear
        </sp-action-button>
      </div>

      <div className="sizes-groups">
        {Object.entries(groupedSizes).map(([type, typeSizes]) => {
          if (!typeSizes || typeSizes.length === 0) return null;

          return (
            <div key={type} className="size-group">
              <sp-label size="s" class="group-label">
                {typeLabels[type] || type}
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

