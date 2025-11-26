import React from 'react';

/**
 * Print settings panel for configuring bleed and crop marks
 */
const PrintSettingsPanel = ({ settings, onSettingsChange }) => {
  const handleChange = (field, value) => {
    onSettingsChange({
      ...settings,
      [field]: value,
    });
  };

  const handleNumberChange = (field, e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      handleChange(field, value);
    }
  };

  const handleColorChange = (channel, e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleChange('cropMarkColor', {
        ...settings.cropMarkColor,
        [channel]: Math.max(0, Math.min(255, value)),
      });
    }
  };

  return (
    <div className="print-settings-panel">
      <div className="panel-header">
        <sp-label size="l">Print Settings</sp-label>
        <sp-body size="s" class="panel-description">
          Configure bleed and crop mark settings for print artboards.
        </sp-body>
      </div>

      <div className="options-section">
        <sp-label size="m">Bleed Settings</sp-label>

        <div className="form-row">
          <div className="form-field">
            <sp-field-label size="s">Bleed Amount</sp-field-label>
            <sp-number-field
              size="s"
              value={settings.bleed || 0.125}
              min={0}
              max={1}
              step={0.0625}
              formatOptions='{"minimumFractionDigits": 3}'
              onInput={(e) => handleNumberChange('bleed', e)}
            />
          </div>

          <div className="form-field">
            <sp-field-label size="s">Bleed Unit</sp-field-label>
            <sp-picker
              size="s"
              value={settings.bleedUnit || 'inches'}
              onInput={(e) => handleChange('bleedUnit', e.target.value)}
            >
              <sp-menu slot="options">
                <sp-menu-item value="inches">Inches</sp-menu-item>
                <sp-menu-item value="mm">Millimeters</sp-menu-item>
                <sp-menu-item value="pixels">Pixels</sp-menu-item>
              </sp-menu>
            </sp-picker>
          </div>
        </div>
      </div>

      <div className="options-section">
        <sp-label size="m">Crop Marks</sp-label>

        <div className="form-row">
          <div className="form-field">
            <sp-field-label size="s">Mark Length</sp-field-label>
            <sp-number-field
              size="s"
              value={settings.cropMarkLength || 0.25}
              min={0.1}
              max={1}
              step={0.0625}
              formatOptions='{"minimumFractionDigits": 3}'
              onInput={(e) => handleNumberChange('cropMarkLength', e)}
            />
          </div>

          <div className="form-field">
            <sp-field-label size="s">Mark Weight (px)</sp-field-label>
            <sp-number-field
              size="s"
              value={settings.cropMarkWeight || 1}
              min={0.5}
              max={5}
              step={0.5}
              onInput={(e) => handleNumberChange('cropMarkWeight', e)}
            />
          </div>
        </div>

        <div className="form-field">
          <sp-field-label size="s">Mark Offset</sp-field-label>
          <sp-number-field
            size="s"
            value={settings.cropMarkOffset || 0.0625}
            min={0}
            max={0.5}
            step={0.0625}
            formatOptions='{"minimumFractionDigits": 4}'
            onInput={(e) => handleNumberChange('cropMarkOffset', e)}
          />
          <sp-body size="xs" class="field-hint">
            Gap between trim edge and crop mark (in bleed unit).
          </sp-body>
        </div>

        <div className="form-field">
          <sp-field-label size="s">Mark Color (RGB)</sp-field-label>
          <div className="color-inputs">
            <sp-number-field
              size="s"
              value={settings.cropMarkColor?.r || 0}
              min={0}
              max={255}
              placeholder="R"
              onInput={(e) => handleColorChange('r', e)}
            />
            <sp-number-field
              size="s"
              value={settings.cropMarkColor?.g || 0}
              min={0}
              max={255}
              placeholder="G"
              onInput={(e) => handleColorChange('g', e)}
            />
            <sp-number-field
              size="s"
              value={settings.cropMarkColor?.b || 0}
              min={0}
              max={255}
              placeholder="B"
              onInput={(e) => handleColorChange('b', e)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSettingsPanel;

