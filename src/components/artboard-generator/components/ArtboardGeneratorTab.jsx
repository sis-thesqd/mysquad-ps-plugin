import React, { useState } from 'react';
import SourceConfigPanel from './SourceConfigPanel';
import GenerationOptionsPanel from './GenerationOptionsPanel';
import PrintSettingsPanel from './PrintSettingsPanel';
import SizesPreview from './SizesPreview';
import SubTabNavigation from '../../ui/SubTabNavigation';
import { usePhotoshopDocument } from '../hooks/usePhotoshopDocument';
import { useArtboardGenerator } from '../hooks/useArtboardGenerator';
import { config } from '../../../config';

/**
 * Main artboard generator tab component
 */
const ArtboardGeneratorTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('sources');
  
  // Document data
  const { artboards, layers, loading: docLoading, refresh: refreshDoc } = usePhotoshopDocument();
  
  // Generator state
  const {
    sourceConfig,
    setSourceConfig,
    options,
    setOptions,
    printSettings,
    setPrintSettings,
    sizes,
    sizesLoading,
    sizesError,
    loadSizes,
    loadDefaultSizes,
    clearSizes,
    generating,
    progress,
    generationError,
    generate,
    generateSingle,
    validateConfig,
  } = useArtboardGenerator();

  const validationErrors = validateConfig();
  const canGenerate = validationErrors.length === 0 && !generating && !docLoading;

  return (
    <div className="artboard-generator-tab">
      {/* Header Section */}
      <div className="generator-header">
        <div className="header-title">
          <sp-label size="l">Artboard Generator</sp-label>
          <sp-action-button size="s" quiet onClick={refreshDoc} disabled={docLoading}>
            {docLoading ? 'Refreshing...' : 'Refresh Document'}
          </sp-action-button>
        </div>
        
        {docLoading && (
          <sp-progress-bar indeterminate size="s" label="Loading document..."></sp-progress-bar>
        )}
        
        {!docLoading && artboards.length === 0 && (
          <sp-body size="s" class="warning-text">
            No artboards found in document. Create source artboards first.
          </sp-body>
        )}
      </div>

      {/* Sub-tabs Navigation */}
      <SubTabNavigation tabs={config.generatorSubTabs} activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {/* Panel Content */}
      <div className="generator-content">
        {activeSubTab === 'sources' && (
          <SourceConfigPanel
            artboards={artboards}
            layers={layers}
            sourceConfig={sourceConfig}
            onConfigChange={setSourceConfig}
          />
        )}

        {activeSubTab === 'options' && (
          <GenerationOptionsPanel
            options={options}
            onOptionsChange={setOptions}
          />
        )}

        {activeSubTab === 'print' && (
          <PrintSettingsPanel
            settings={printSettings}
            onSettingsChange={setPrintSettings}
          />
        )}
      </div>

      {/* Sizes Section */}
      <div className="sizes-section">
        <div className="sizes-actions">
          <sp-button
            size="s"
            variant="secondary"
            onClick={loadSizes}
            disabled={sizesLoading || !options.apiEndpoint}
          >
            {sizesLoading ? 'Loading...' : 'Fetch Sizes'}
          </sp-button>
          <sp-button
            size="s"
            variant="secondary"
            onClick={loadDefaultSizes}
            disabled={sizesLoading}
          >
            Use Defaults
          </sp-button>
        </div>

        {sizesError && (
          <sp-body size="s" class="error-text">
            {sizesError}
          </sp-body>
        )}

        <SizesPreview 
          sizes={sizes} 
          onClear={clearSizes} 
          onGenerateSingle={generateSingle}
          sourceConfig={sourceConfig}
          disabled={generating || docLoading}
        />
      </div>

      {/* Generation Section */}
      <div className="generation-section">
        {generating && (
          <div className="generation-progress">
            <sp-body size="s">
              Generating: {progress.name} ({progress.current}/{progress.total})
            </sp-body>
            <sp-progress-bar
              value={(progress.current / progress.total) * 100}
              size="s"
            ></sp-progress-bar>
          </div>
        )}

        {generationError && (
          <sp-body size="s" class="error-text">
            {generationError}
          </sp-body>
        )}

        {validationErrors.length > 0 && !generating && (
          <div className="validation-warnings">
            {validationErrors.map((error, index) => (
              <sp-body key={index} size="xs" class="warning-text">
                • {error}
              </sp-body>
            ))}
          </div>
        )}

        <sp-button
          variant="cta"
          onClick={generate}
          disabled={!canGenerate}
        >
          {generating ? 'Generating...' : 'Generate Artboards'}
        </sp-button>
      </div>
    </div>
  );
};

export default ArtboardGeneratorTab;

