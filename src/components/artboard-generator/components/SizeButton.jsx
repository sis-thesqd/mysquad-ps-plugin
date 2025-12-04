import React from 'react';
import { determineSourceType } from '../services/artboardGenerator';
import { SOURCE_TYPE_ICONS } from '../../../config';

const SOURCE_TYPE_LABELS = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  square: 'Square',
};

/**
 * Single size button that generates one artboard when clicked
 * @param {Object} props - Component props
 * @param {Object} props.size - Size configuration object
 * @param {Function} props.onGenerate - Callback when button is clicked
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Object} props.sourceConfig - Source artboard configuration
 */
const SizeButton = ({ size, onGenerate, disabled, sourceConfig }) => {
  const sourceType = determineSourceType(size.width / size.height);
  const hasSource = sourceConfig[sourceType]?.artboard;
  const isDisabled = disabled || !hasSource;

  const handleClick = () => {
    if (hasSource && onGenerate) {
      onGenerate(size);
    }
  };

  const getTooltip = () => {
    if (!hasSource) {
      return `Needs ${SOURCE_TYPE_LABELS[sourceType]} source`;
    }
    return `Generate ${size.name} (${size.width}×${size.height})`;
  };

  return (
    <div className={`size-button-wrapper ${!hasSource ? 'size-button-needs-source' : ''}`}>
      <button
        className={`size-button ${!hasSource ? 'size-button-disabled' : ''} ${size.requiresBleed ? 'size-button-print' : ''}`}
        onClick={handleClick}
        disabled={isDisabled}
        title={getTooltip()}
      >
        <span className="size-source-icon">{SOURCE_TYPE_ICONS[sourceType]}</span>
        <span className="size-name">{size.name}</span>
        <span className="size-dimensions">{size.width}×{size.height}</span>
        {size.requiresBleed && <span className="size-badge">Print</span>}
      </button>
      {!hasSource && (
        <span className="size-missing-source">
          Configure {SOURCE_TYPE_LABELS[sourceType]}
        </span>
      )}
    </div>
  );
};

export default SizeButton;
