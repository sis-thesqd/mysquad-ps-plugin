import React, { useMemo } from 'react';
import { groupByType } from '../services/artboardGenerator';
import SizeButton from './SizeButton';

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

