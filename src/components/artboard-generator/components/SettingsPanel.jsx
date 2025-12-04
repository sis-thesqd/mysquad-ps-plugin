import React, { useState, useRef, useEffect } from 'react';

/**
 * Compact settings panel that expands when clicked
 * Combines Generation Options and Print Settings into a single collapsible section
 */
const SettingsPanel = ({ options, onOptionsChange, printSettings, onPrintSettingsChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOptionChange = (field, value) => {
    onOptionsChange({
      ...options,
      [field]: value,
    });
  };

  const handleOptionNumberChange = (field, e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleOptionChange(field, value);
    }
  };

  const handlePrintChange = (field, value) => {
    onPrintSettingsChange({
      ...printSettings,
      [field]: value,
    });
  };

  const handlePrintNumberChange = (field, e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      handlePrintChange(field, value);
    }
  };

  // Summary text for collapsed state
  const getSummary = () => {
    const parts = [];
    if (options.columns !== 4) parts.push(`${options.columns} cols`);
    if (options.gap !== 100) parts.push(`${options.gap}px gap`);
    if (printSettings.bleed) parts.push(`${printSettings.bleed}" bleed`);
    return parts.length > 0 ? parts.join(' · ') : 'Default settings';
  };

  return (
    <div className="settings-panel">
      <button
        className={`settings-toggle ${isExpanded ? 'settings-toggle-expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="settings-icon">⚙</span>
        <span className="settings-label">Settings</span>
        <span className="settings-summary">{getSummary()}</span>
        <span className={`settings-chevron ${isExpanded ? 'settings-chevron-expanded' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="settings-content">
          {/* Layout Settings */}
          <div className="settings-group">
            <sp-label size="s" class="settings-group-label">Layout</sp-label>
            <div className="settings-row">
              <div className="settings-field">
                <sp-field-label size="xs">Columns</sp-field-label>
                <sp-number-field
                  size="s"
                  value={options.columns || 4}
                  min={1}
                  max={10}
                  onInput={(e) => handleOptionNumberChange('columns', e)}
                />
              </div>
              <div className="settings-field">
                <sp-field-label size="xs">Gap</sp-field-label>
                <sp-number-field
                  size="s"
                  value={options.gap || 100}
                  min={0}
                  max={500}
                  step={10}
                  onInput={(e) => handleOptionNumberChange('gap', e)}
                />
              </div>
              <div className="settings-field">
                <sp-field-label size="xs">Group Gap</sp-field-label>
                <sp-number-field
                  size="s"
                  value={options.groupGap || 300}
                  min={0}
                  max={1000}
                  step={50}
                  onInput={(e) => handleOptionNumberChange('groupGap', e)}
                />
              </div>
              <div className="settings-field">
                <sp-field-label size="xs">Start X</sp-field-label>
                <sp-number-field
                  size="s"
                  value={options.startX || 2500}
                  min={0}
                  max={10000}
                  step={100}
                  onInput={(e) => handleOptionNumberChange('startX', e)}
                />
              </div>
            </div>
          </div>

          {/* Print Settings */}
          <div className="settings-group">
            <sp-label size="s" class="settings-group-label">Print</sp-label>
            <div className="settings-row">
              <div className="settings-field">
                <sp-field-label size="xs">Bleed</sp-field-label>
                <sp-number-field
                  size="s"
                  value={printSettings.bleed || 0.125}
                  min={0}
                  max={1}
                  step={0.0625}
                  formatOptions='{"minimumFractionDigits": 3}'
                  onInput={(e) => handlePrintNumberChange('bleed', e)}
                />
              </div>
              <div className="settings-field">
                <sp-field-label size="xs">Unit</sp-field-label>
                <sp-picker
                  size="s"
                  value={printSettings.bleedUnit || 'inches'}
                  onInput={(e) => handlePrintChange('bleedUnit', e.target.value)}
                >
                  <sp-menu slot="options">
                    <sp-menu-item value="inches">in</sp-menu-item>
                    <sp-menu-item value="mm">mm</sp-menu-item>
                    <sp-menu-item value="pixels">px</sp-menu-item>
                  </sp-menu>
                </sp-picker>
              </div>
              <div className="settings-field">
                <sp-field-label size="xs">Mark Length</sp-field-label>
                <sp-number-field
                  size="s"
                  value={printSettings.cropMarkLength || 0.25}
                  min={0.1}
                  max={1}
                  step={0.0625}
                  onInput={(e) => handlePrintNumberChange('cropMarkLength', e)}
                />
              </div>
            </div>
          </div>

          {/* Advanced - API Endpoint */}
          <div className="settings-group">
            <sp-label size="s" class="settings-group-label">API Endpoint (optional)</sp-label>
            <sp-textfield
              size="s"
              value={options.apiEndpoint || ''}
              placeholder="https://api.example.com/sizes"
              onInput={(e) => handleOptionChange('apiEndpoint', e.target.value)}
              quiet
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
