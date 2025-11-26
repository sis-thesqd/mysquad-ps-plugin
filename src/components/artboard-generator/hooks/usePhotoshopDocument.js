import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to get artboards and layers from the current Photoshop document
 * @returns {Object} Document info including artboards and layers
 */
export const usePhotoshopDocument = () => {
  const [artboards, setArtboards] = useState([]);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentId, setDocumentId] = useState(null);

  /**
   * Check if a layer is an artboard using batchPlay
   */
  const checkIfArtboard = async (layerId, batchPlay) => {
    try {
      const result = await batchPlay([
        {
          _obj: 'get',
          _target: [
            { _ref: 'layer', _id: layerId },
          ],
          _options: { dialogOptions: 'dontDisplay' },
        },
      ], { synchronousExecution: false });
      
      const layerDesc = result[0];
      // Artboards have artboardEnabled: true in their descriptor
      return layerDesc?.artboardEnabled === true;
    } catch (e) {
      console.warn('Error checking artboard status:', e);
      return false;
    }
  };

  /**
   * Get artboard bounds using batchPlay
   */
  const getArtboardBounds = async (layerId, batchPlay) => {
    try {
      const result = await batchPlay([
        {
          _obj: 'get',
          _target: [
            { _ref: 'layer', _id: layerId },
          ],
          _options: { dialogOptions: 'dontDisplay' },
        },
      ], { synchronousExecution: false });
      
      const layerDesc = result[0];
      const rect = layerDesc?.artboard?.artboardRect;
      
      if (rect) {
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.right - rect.left,
          height: rect.bottom - rect.top,
        };
      }
      return null;
    } catch (e) {
      console.warn('Error getting artboard bounds:', e);
      return null;
    }
  };

  /**
   * Recursively collect layer groups from a layer tree
   */
  const collectLayerGroups = (layerList, parentName = '') => {
    const groups = [];
    
    for (const layer of layerList) {
      if (layer.kind === 'group' || layer.typename === 'LayerSet') {
        const fullName = parentName ? `${parentName}/${layer.name}` : layer.name;
        groups.push({
          id: layer.id,
          name: layer.name,
          fullPath: fullName,
        });
        
        // Recursively get nested groups
        if (layer.layers && layer.layers.length > 0) {
          groups.push(...collectLayerGroups(layer.layers, fullName));
        }
      }
    }
    
    return groups;
  };

  /**
   * Fetch artboards and layers from the document
   */
  const fetchDocumentInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const photoshop = require('photoshop');
      const app = photoshop?.app;
      const batchPlay = photoshop?.action?.batchPlay;
      
      if (!app) {
        setArtboards([]);
        setLayers([]);
        setDocumentId(null);
        setLoading(false);
        return;
      }
      
      const doc = app.activeDocument;

      if (!doc) {
        setArtboards([]);
        setLayers([]);
        setDocumentId(null);
        setLoading(false);
        return;
      }

      setDocumentId(doc.id);

      // Get all artboards
      const documentArtboards = [];
      const documentLayers = [];

      // Iterate through top-level layers to find artboards
      console.log('Document layers:', doc.layers.length);
      
      for (const layer of doc.layers) {
        // Use batchPlay to check if this layer is an artboard
        const isArtboard = await checkIfArtboard(layer.id, batchPlay);
        
        console.log('Layer:', layer.name, 'id:', layer.id, 'isArtboard:', isArtboard);
        
        if (isArtboard) {
          // Get artboard bounds via batchPlay
          const bounds = await getArtboardBounds(layer.id, batchPlay);
          
          documentArtboards.push({
            id: layer.id,
            name: layer.name,
            bounds: bounds,
          });

          // Get layers within this artboard
          if (layer.layers && layer.layers.length > 0) {
            const artboardLayers = collectLayerGroups(layer.layers);
            artboardLayers.forEach((l) => {
              documentLayers.push({
                ...l,
                artboardId: layer.id,
                artboardName: layer.name,
              });
            });
          }
        } else if (layer.kind === 'group' || layer.typename === 'LayerSet') {
          // Also collect top-level groups that aren't artboards
          documentLayers.push({
            id: layer.id,
            name: layer.name,
            fullPath: layer.name,
            artboardId: null,
            artboardName: null,
          });
          
          if (layer.layers && layer.layers.length > 0) {
            const nestedLayers = collectLayerGroups(layer.layers, layer.name);
            documentLayers.push(...nestedLayers.map((l) => ({
              ...l,
              artboardId: null,
              artboardName: null,
            })));
          }
        }
      }

      console.log('Found artboards:', documentArtboards.length, documentArtboards);
      setArtboards(documentArtboards);
      setLayers(documentLayers);
    } catch (err) {
      console.error('Error fetching document info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get layers for a specific artboard
   */
  const getLayersForArtboard = useCallback((artboardName) => {
    if (!artboardName) return [];
    return layers.filter(
      (layer) => layer.artboardName === artboardName || layer.artboardId === null
    );
  }, [layers]);

  /**
   * Refresh document info
   */
  const refresh = useCallback(() => {
    fetchDocumentInfo();
  }, [fetchDocumentInfo]);

  // Initial fetch
  useEffect(() => {
    fetchDocumentInfo();
  }, [fetchDocumentInfo]);

  return {
    artboards,
    layers,
    loading,
    error,
    documentId,
    getLayersForArtboard,
    refresh,
  };
};

export default usePhotoshopDocument;

