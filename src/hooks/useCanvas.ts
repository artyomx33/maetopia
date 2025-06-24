import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

// Import types from CityCanvas component
import { Layer, Point } from '../components/CityCanvas';

// Type for history actions
type HistoryAction = {
  type: 'add' | 'remove' | 'update' | 'move' | 'reorder';
  layerId?: string;
  before?: Partial<Layer> | null;
  after?: Partial<Layer> | null;
  timestamp: number;
};

// Maximum history stack size
const MAX_HISTORY_SIZE = 20;

interface UseCanvasOptions {
  initialLayers?: Layer[];
  onChange?: (layers: Layer[]) => void;
  autoSave?: boolean;
  autoSaveDebounce?: number;
}

/**
 * Custom hook for managing canvas state including layers, selection, and history
 */
const useCanvas = ({
  initialLayers = [],
  onChange,
  autoSave = false,
  autoSaveDebounce = 500,
}: UseCanvasOptions = {}) => {
  // State for layers, selected layer, and points
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [mapPoints, setMapPoints] = useState<Point[]>([]);
  
  // History state for undo/redo
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isBatchingActions, setIsBatchingActions] = useState<boolean>(false);
  
  // Ref to track if we're currently in an undo/redo operation
  const isUndoRedoInProgress = useRef<boolean>(false);
  
  // Get the currently selected layer
  const selectedLayer = selectedLayerId 
    ? layers.find(layer => layer.id === selectedLayerId) || null 
    : null;

  // Handle layer changes with optional auto-save
  const handleLayerChange = useCallback((newLayers: Layer[]) => {
    setLayers(newLayers);
    if (onChange && autoSave) {
      debouncedOnChange(newLayers);
    } else if (onChange) {
      onChange(newLayers);
    }
  }, [onChange, autoSave]);

  // Debounced onChange for auto-save
  const debouncedOnChange = useCallback(
    debounce((newLayers: Layer[]) => {
      onChange?.(newLayers);
    }, autoSaveDebounce),
    [onChange, autoSaveDebounce]
  );

  // Add a history action
  const addHistoryAction = useCallback((action: Omit<HistoryAction, 'timestamp'>) => {
    if (isUndoRedoInProgress.current || isBatchingActions) return;
    
    setHistory(prev => {
      // If we're not at the end of history, truncate it
      const newHistory = prev.slice(0, historyIndex + 1);
      
      // Add the new action
      const updatedHistory = [
        ...newHistory, 
        { ...action, timestamp: Date.now() }
      ];
      
      // Limit history size
      if (updatedHistory.length > MAX_HISTORY_SIZE) {
        return updatedHistory.slice(updatedHistory.length - MAX_HISTORY_SIZE);
      }
      
      return updatedHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex, isBatchingActions]);

  // Start batching history actions (for compound operations)
  const startBatch = useCallback(() => {
    setIsBatchingActions(true);
  }, []);

  // End batching and add a compound history action
  const endBatch = useCallback(() => {
    setIsBatchingActions(false);
  }, []);

  // Add a new layer
  const addLayer = useCallback((newLayer: Omit<Layer, 'id'>) => {
    const id = `layer_${Date.now()}`;
    const layer = { ...newLayer, id } as Layer;
    
    setLayers(prev => {
      const updated = [...prev, layer];
      return updated;
    });
    
    // Add to history
    addHistoryAction({
      type: 'add',
      layerId: id,
      after: layer,
    });
    
    handleLayerChange([...layers, layer]);
    return id;
  }, [layers, addHistoryAction, handleLayerChange]);

  // Remove a layer
  const removeLayer = useCallback((id: string) => {
    const layerToRemove = layers.find(layer => layer.id === id);
    
    if (!layerToRemove) return;
    
    setLayers(prev => {
      const updated = prev.filter(layer => layer.id !== id);
      handleLayerChange(updated);
      return updated;
    });
    
    // Add to history
    addHistoryAction({
      type: 'remove',
      layerId: id,
      before: layerToRemove,
    });
    
    // Clear selection if the removed layer was selected
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  }, [layers, selectedLayerId, addHistoryAction, handleLayerChange]);

  // Update a layer
  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    const layerToUpdate = layers.find(layer => layer.id === id);
    
    if (!layerToUpdate) return;
    
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      );
      handleLayerChange(updated);
      return updated;
    });
    
    // Add to history
    addHistoryAction({
      type: 'update',
      layerId: id,
      before: layerToUpdate,
      after: { ...layerToUpdate, ...updates },
    });
  }, [layers, addHistoryAction, handleLayerChange]);

  // Move a layer to a new position
  const moveLayer = useCallback((id: string, position: { x: number; y: number }) => {
    const layerToMove = layers.find(layer => layer.id === id);
    
    if (!layerToMove) return;
    
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === id ? { ...layer, position } : layer
      );
      handleLayerChange(updated);
      return updated;
    });
    
    // Add to history
    addHistoryAction({
      type: 'move',
      layerId: id,
      before: { position: layerToMove.position },
      after: { position },
    });
  }, [layers, addHistoryAction, handleLayerChange]);

  // Reorder layers (change zIndex)
  const reorderLayers = useCallback((orderedIds: string[]) => {
    const layerMap = new Map(layers.map(layer => [layer.id, layer]));
    const oldLayers = [...layers];
    
    setLayers(prev => {
      // Create a new array with updated zIndex values
      const updated = orderedIds
        .map((id, index) => {
          const layer = layerMap.get(id);
          return layer ? { ...layer, zIndex: index } : null;
        })
        .filter((layer): layer is Layer => layer !== null);
      
      handleLayerChange(updated);
      return updated;
    });
    
    // Add to history
    addHistoryAction({
      type: 'reorder',
      before: { layers: oldLayers },
      after: { layers: layers.map((layer, index) => ({ ...layer, zIndex: index })) },
    });
  }, [layers, addHistoryAction, handleLayerChange]);

  // Select a layer
  const selectLayer = useCallback((id: string | null) => {
    setSelectedLayerId(id);
  }, []);

  // Undo the last action
  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    
    const action = history[historyIndex];
    isUndoRedoInProgress.current = true;
    
    try {
      switch (action.type) {
        case 'add':
          if (action.layerId) {
            setLayers(prev => {
              const updated = prev.filter(layer => layer.id !== action.layerId);
              handleLayerChange(updated);
              return updated;
            });
          }
          break;
          
        case 'remove':
          if (action.before && action.layerId) {
            setLayers(prev => {
              const updated = [...prev, action.before as Layer];
              handleLayerChange(updated);
              return updated;
            });
          }
          break;
          
        case 'update':
        case 'move':
          if (action.before && action.layerId) {
            setLayers(prev => {
              const updated = prev.map(layer => 
                layer.id === action.layerId 
                  ? { ...layer, ...action.before } 
                  : layer
              );
              handleLayerChange(updated);
              return updated;
            });
          }
          break;
          
        case 'reorder':
          if (action.before && 'layers' in action.before) {
            setLayers(action.before.layers as Layer[]);
            handleLayerChange(action.before.layers as Layer[]);
          }
          break;
      }
    } finally {
      isUndoRedoInProgress.current = false;
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex, handleLayerChange]);

  // Redo the last undone action
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const action = history[historyIndex + 1];
    isUndoRedoInProgress.current = true;
    
    try {
      switch (action.type) {
        case 'add':
          if (action.after) {
            setLayers(prev => {
              const updated = [...prev, action.after as Layer];
              handleLayerChange(updated);
              return updated;
            });
          }
          break;
          
        case 'remove':
          if (action.layerId) {
            setLayers(prev => {
              const updated = prev.filter(layer => layer.id !== action.layerId);
              handleLayerChange(updated);
              return updated;
            });
          }
          break;
          
        case 'update':
        case 'move':
          if (action.after && action.layerId) {
            setLayers(prev => {
              const updated = prev.map(layer => 
                layer.id === action.layerId 
                  ? { ...layer, ...action.after } 
                  : layer
              );
              handleLayerChange(updated);
              return updated;
            });
          }
          break;
          
        case 'reorder':
          if (action.after && 'layers' in action.after) {
            setLayers(action.after.layers as Layer[]);
            handleLayerChange(action.after.layers as Layer[]);
          }
          break;
      }
    } finally {
      isUndoRedoInProgress.current = false;
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex, handleLayerChange]);

  // Set map points
  const setPoints = useCallback((points: Point[]) => {
    setMapPoints(points);
  }, []);

  // Clear all layers
  const clearLayers = useCallback(() => {
    const oldLayers = [...layers];
    
    setLayers([]);
    handleLayerChange([]);
    setSelectedLayerId(null);
    
    // Add to history
    addHistoryAction({
      type: 'remove',
      before: { layers: oldLayers },
    });
  }, [layers, addHistoryAction, handleLayerChange]);

  // Check if undo is available
  const canUndo = historyIndex >= 0;
  
  // Check if redo is available
  const canRedo = historyIndex < history.length - 1;

  return {
    // State
    layers,
    selectedLayer,
    selectedLayerId,
    mapPoints,
    history,
    historyIndex,
    canUndo,
    canRedo,
    
    // Layer management
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    reorderLayers,
    selectLayer,
    clearLayers,
    
    // Map points
    setPoints,
    
    // History management
    undo,
    redo,
    startBatch,
    endBatch,
  };
};

export default useCanvas;
