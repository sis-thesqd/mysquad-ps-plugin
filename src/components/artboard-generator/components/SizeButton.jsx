import React from 'react';
import { determineSourceType } from '../services/artboardGenerator';

/**
 * Source type icons for visual identification
 */
const SOURCE_TYPE_ICONS = {
  landscape: '▭ ',
  portrait: '▯ ',
  square: '□ ',
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
      <span className="size-source-icon">{SOURCE_TYPE_ICONS[sourceType]}</span>
      <span className="size-name">{size.name}</span>
      <span className="size-dimensions">{size.width}×{size.height}</span>
      {size.requiresBleed && <span className="size-badge">Print</span>}
    </button>
  );
};

export default SizeButton;
