import React, { useRef, useEffect } from 'react';

/**
 * Single layer role picker with proper event handling
 * @param {Object} props - Component props
 * @param {Object} props.role - Role configuration object with id and label
 * @param {string} props.value - Currently selected value
 * @param {Array} props.layerOptions - Available layer options
 * @param {Function} props.onChange - Callback when selection changes
 */
const LayerRolePicker = ({ role, value, layerOptions, onChange }) => {
  const pickerRef = useRef(null);

  // Set up change listener
  useEffect(() => {
    const picker = pickerRef.current;
    if (picker) {
      const handleChange = (e) => {
        onChange(role.id, e.target.value);
      };
      picker.addEventListener('change', handleChange);
      return () => picker.removeEventListener('change', handleChange);
    }
  }, [role.id, onChange]);

  // Display text for the picker
  const displayText = value || 'None';

  return (
    <div className="form-field form-field-inline">
      <sp-field-label size="s">{role.label}</sp-field-label>
      <div className="picker-wrapper">
        <span className="picker-value">{displayText}</span>
        <sp-picker ref={pickerRef} size="s">
          <sp-menu slot="options">
            <sp-menu-item value="">None</sp-menu-item>
            {layerOptions.map((layer) => (
              <sp-menu-item key={layer.id} value={layer.name}>
                {layer.fullPath || layer.name}
              </sp-menu-item>
            ))}
          </sp-menu>
        </sp-picker>
      </div>
    </div>
  );
};

export default LayerRolePicker;
