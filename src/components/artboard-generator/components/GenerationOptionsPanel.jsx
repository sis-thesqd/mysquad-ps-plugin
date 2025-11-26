import React from 'react';

/**
 * Generation options panel for configuring layout and API settings
 */
const GenerationOptionsPanel = ({ options, onOptionsChange }) => {
  const handleChange = (field, value) => {
    onOptionsChange({
      ...options,
      [field]: value,
    });
  };

  const handleNumberChange = (field, e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleChange(field, value);
    }
  };

  return (
    <div className="generation-options-panel">
      <div className="panel-header">
        <sp-label size="l">Generation Options</sp-label>
        <sp-body size="s" class="panel-description">
          Configure API endpoint and artboard layout settings.
        </sp-body>
      </div>

      <div className="options-section">
        <sp-label size="m">API Settings</sp-label>
        
        <div className="form-field">
          <sp-field-label size="s">Sizes API Endpoint</sp-field-label>
          <sp-textfield
            size="s"
            value={options.apiEndpoint || ''}
            placeholder="https://api.example.com/sizes"
            onInput={(e) => handleChange('apiEndpoint', e.target.value)}
          />
          <sp-body size="xs" class="field-hint">
            Enter the URL that returns artboard size configurations in JSON format.
          </sp-body>
        </div>
      </div>

      <div className="options-section">
        <sp-label size="m">Layout Settings</sp-label>

        <div className="form-row">
          <div className="form-field">
            <sp-field-label size="s">Columns</sp-field-label>
            <sp-number-field
              size="s"
              value={options.columns || 4}
              min={1}
              max={10}
              onInput={(e) => handleNumberChange('columns', e)}
            />
          </div>

          <div className="form-field">
            <sp-field-label size="s">Gap (px)</sp-field-label>
            <sp-number-field
              size="s"
              value={options.gap || 100}
              min={0}
              max={500}
              step={10}
              onInput={(e) => handleNumberChange('gap', e)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <sp-field-label size="s">Group Gap (px)</sp-field-label>
            <sp-number-field
              size="s"
              value={options.groupGap || 300}
              min={0}
              max={1000}
              step={50}
              onInput={(e) => handleNumberChange('groupGap', e)}
            />
          </div>

          <div className="form-field">
            <sp-field-label size="s">Start X (px)</sp-field-label>
            <sp-number-field
              size="s"
              value={options.startX || 2500}
              min={0}
              max={10000}
              step={100}
              onInput={(e) => handleNumberChange('startX', e)}
            />
          </div>
        </div>
      </div>

      <div className="options-section">
        <sp-label size="m">Type Order</sp-label>
        <sp-body size="xs" class="field-hint">
          Artboards will be grouped and sorted in this order.
        </sp-body>

        <div className="type-order-list">
          {(options.typeOrder || ['social', 'display', 'video', 'email', 'print', 'web', 'other']).map((type, index) => (
            <sp-badge key={type} size="s" variant="neutral">
              {index + 1}. {type}
            </sp-badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenerationOptionsPanel;

