import React, { useRef, useEffect } from 'react';

/**
 * Artboard picker with proper event handling
 * @param {Object} props - Component props
 * @param {string} props.sourceId - Source type identifier
 * @param {string} props.value - Currently selected artboard name
 * @param {Array} props.artboards - Available artboards
 * @param {Function} props.onChange - Callback when selection changes
 */
const ArtboardPicker = ({ sourceId, value, artboards, onChange }) => {
  const pickerRef = useRef(null);

  // Set up change listener
  useEffect(() => {
    const picker = pickerRef.current;
    if (picker) {
      const handleChange = (e) => {
        onChange(sourceId, e.target.value);
      };
      picker.addEventListener('change', handleChange);
      return () => picker.removeEventListener('change', handleChange);
    }
  }, [sourceId, onChange]);

  // Find display text
  const selectedArtboard = artboards.find((ab) => ab.name === value);
  const displayText = selectedArtboard
    ? `${selectedArtboard.name} (${selectedArtboard.bounds?.width}×${selectedArtboard.bounds?.height})`
    : 'Select artboard...';

  return (
    <div className="form-field">
      <sp-field-label size="s">Source Artboard</sp-field-label>
      <div className="picker-wrapper">
        <span className="picker-value">{displayText}</span>
        <sp-picker ref={pickerRef} size="s">
          <sp-menu slot="options">
            <sp-menu-item value="">Select artboard...</sp-menu-item>
            {artboards.map((ab) => (
              <sp-menu-item key={ab.id} value={ab.name}>
                {ab.name} ({ab.bounds?.width}×{ab.bounds?.height})
              </sp-menu-item>
            ))}
          </sp-menu>
        </sp-picker>
      </div>
    </div>
  );
};

export default ArtboardPicker;
