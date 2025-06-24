import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faStore, 
  faHospital, 
  faTree, 
  faBench, 
  faDog, 
  faCat,
  faTrash,
  faLock,
  faLockOpen,
  faEye,
  faEyeSlash,
  faUndo,
  faRedo
} from '@fortawesome/free-solid-svg-icons';

import CityCanvas, { Layer, Point } from './CityCanvas';
import useCanvas from '../hooks/useCanvas';

// Placeholder map points for testing
const DEMO_MAP_POINTS: Point[] = [
  { x: 300, y: 400, type: 'hospital', name: 'City Hospital' },
  { x: 800, y: 300, type: 'school', name: 'Elementary School' },
  { x: 1200, y: 500, type: 'bakery', name: 'Sweet Bakery' },
  { x: 500, y: 700, type: 'open', name: 'Open Spot 1' },
  { x: 1500, y: 800, type: 'open', name: 'Open Spot 2' },
  { x: 1000, y: 900, type: 'open', name: 'Open Spot 3' },
];

// Asset definitions for the toolbar
const ASSETS = [
  { type: 'house', icon: faHome, name: 'House', texturePath: '/assets/placeholders/house_v1.svg', scale: 1, version: 1 },
  { type: 'shop', icon: faStore, name: 'Shop', texturePath: '/assets/placeholders/shop_v1.svg', scale: 1, version: 1 },
  { type: 'hospital', icon: faHospital, name: 'Hospital', texturePath: '/assets/placeholders/hospital_v1.svg', scale: 1.2, version: 1 },
  { type: 'tree', icon: faTree, name: 'Tree', texturePath: '/assets/placeholders/tree_v1.svg', scale: 0.8, version: 1 },
  { type: 'bench', icon: faBench, name: 'Bench', texturePath: '/assets/placeholders/bench_v1.svg', scale: 0.7, version: 1 },
  { type: 'dog', icon: faDog, name: 'Dog', texturePath: '/assets/placeholders/dog_v1.svg', scale: 0.6, version: 1 },
  { type: 'cat', icon: faCat, name: 'Cat', texturePath: '/assets/placeholders/cat_v1.svg', scale: 0.5, version: 1 },
];

// Main CityBuilder component
const CityBuilder: React.FC = () => {
  // Use our custom hook for canvas state management
  const { 
    layers,
    selectedLayer,
    selectedLayerId,
    mapPoints,
    canUndo,
    canRedo,
    addLayer,
    removeLayer,
    updateLayer,
    selectLayer,
    undo,
    redo,
    setPoints
  } = useCanvas({
    autoSave: true,
    autoSaveDebounce: 500,
  });

  // State for the currently selected asset from toolbar
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);
  
  // State for items in the storage bar
  const [storageItems, setStorageItems] = useState<Array<{ id: string, type: string, version: number }>>([]);

  // Load map points when component mounts
  useEffect(() => {
    setPoints(DEMO_MAP_POINTS);
  }, [setPoints]);

  // Handle asset selection from toolbar
  const handleAssetSelect = (assetType: string) => {
    setSelectedAssetType(assetType);
  };

  // Handle canvas click to place selected asset
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedAssetType) return;

    // Get click position relative to canvas
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    // Scale position to actual canvas dimensions (1920x1080)
    const scaleX = 1920 / canvasRect.width;
    const scaleY = 1080 / canvasRect.height;
    
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    // Find the selected asset
    const asset = ASSETS.find(a => a.type === selectedAssetType);
    if (!asset) return;
    
    // Add new layer
    addLayer({
      type: asset.type,
      position: { x: canvasX, y: canvasY },
      scale: asset.scale,
      opacity: 1,
      zIndex: layers.length, // Place on top
      locked: false,
      visible: true,
      version: asset.version,
      texturePath: asset.texturePath,
    });
  };

  // Handle adding item to storage bar
  const addToStorage = (type: string, version: number) => {
    setStorageItems(prev => [...prev, { id: `storage_${Date.now()}`, type, version }]);
  };

  // Handle removing item from storage bar
  const removeFromStorage = (id: string) => {
    setStorageItems(prev => prev.filter(item => item.id !== id));
  };

  // Handle layer visibility toggle
  const toggleLayerVisibility = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer) {
      updateLayer(id, { visible: !layer.visible });
    }
  };

  // Handle layer lock toggle
  const toggleLayerLock = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer) {
      updateLayer(id, { locked: !layer.locked });
    }
  };

  return (
    <div className="city-builder flex flex-col h-full">
      {/* Top Toolbar */}
      <div className="toolbar bg-white shadow-md p-3 mb-4 rounded-lg flex flex-wrap gap-2">
        {ASSETS.map(asset => (
          <div key={asset.type} className="group relative">
            <button
              className={`icon-button ${selectedAssetType === asset.type ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
              onClick={() => handleAssetSelect(asset.type)}
            >
              <FontAwesomeIcon icon={asset.icon} size="lg" />
            </button>
            <span className="tooltip">{asset.name}</span>
          </div>
        ))}
        
        <div className="border-l border-gray-300 mx-2" />
        
        {/* Undo/Redo Buttons */}
        <div className="group relative">
          <button
            className={`icon-button ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={undo}
            disabled={!canUndo}
          >
            <FontAwesomeIcon icon={faUndo} size="lg" />
          </button>
          <span className="tooltip">Undo</span>
        </div>
        
        <div className="group relative">
          <button
            className={`icon-button ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={redo}
            disabled={!canRedo}
          >
            <FontAwesomeIcon icon={faRedo} size="lg" />
          </button>
          <span className="tooltip">Redo</span>
        </div>
      </div>
      
      {/* Main Content Area with Canvas and Sidebar */}
      <div className="flex flex-1 gap-4 mb-4">
        {/* Canvas Area */}
        <div 
          className="flex-1 relative"
          onClick={handleCanvasClick}
        >
          <CityCanvas
            initialLayers={layers}
            mapPoints={mapPoints}
            onLayerSelect={selectLayer}
            onLayerUpdate={() => {/* Will be handled by useCanvas */}}
          />
          
          {/* Canvas Instructions */}
          {selectedAssetType && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full shadow-md">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon 
                  icon={ASSETS.find(a => a.type === selectedAssetType)?.icon || faHome} 
                  className="text-blue-600" 
                />
                <span>Click on the map to place</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar - Layer Controls */}
        {layers.length > 0 && (
          <div className="w-64 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
            <h3 className="font-bold mb-3 text-center">My City Items</h3>
            
            <div className="space-y-2">
              {layers.map(layer => {
                const asset = ASSETS.find(a => a.type === layer.type);
                return (
                  <div 
                    key={layer.id}
                    className={`p-2 rounded-lg border flex items-center gap-2 ${selectedLayerId === layer.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}
                    onClick={() => selectLayer(layer.id)}
                  >
                    {/* Item icon */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      {asset && <FontAwesomeIcon icon={asset.icon} />}
                    </div>
                    
                    {/* Item name */}
                    <div className="flex-1 text-sm">
                      {asset?.name || 'Item'} {layer.version > 1 ? `v${layer.version}` : ''}
                    </div>
                    
                    {/* Controls */}
                    <button 
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                    >
                      <FontAwesomeIcon icon={layer.visible ? faEye : faEyeSlash} size="sm" />
                    </button>
                    
                    <button 
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerLock(layer.id);
                      }}
                    >
                      <FontAwesomeIcon icon={layer.locked ? faLock : faLockOpen} size="sm" />
                    </button>
                    
                    <button 
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(layer.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Storage Bar */}
      <div className="storage-bar-container">
        <h3 className="text-sm font-medium mb-1 px-1">Storage</h3>
        <div className="storage-bar h-16">
          {storageItems.map(item => {
            const asset = ASSETS.find(a => a.type === item.type);
            return (
              <div 
                key={item.id} 
                className="storage-item w-12 h-12 flex items-center justify-center bg-white rounded-md shadow-sm m-1 cursor-grab"
              >
                {asset && <FontAwesomeIcon icon={asset.icon} />}
              </div>
            );
          })}
          
          {/* Empty state */}
          {storageItems.length === 0 && (
            <div className="flex items-center justify-center h-full w-full text-gray-400 italic text-sm">
              Drag items here to store them
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityBuilder;
