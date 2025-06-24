import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { debounce } from 'lodash';

// Types for layers and positions
export interface Layer {
  id: string;
  type: string;
  position: { x: number; y: number };
  scale: number;
  rotation?: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  version: number;
  texturePath: string;
}

export interface Point {
  x: number;
  y: number;
  type: string; // e.g., "hospital", "bakery", "school", "open"
  name?: string;
}

interface CityCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: number;
  initialLayers?: Layer[];
  mapPoints?: Point[];
  onLayerSelect?: (layer: Layer | null) => void;
  onLayerUpdate?: (layers: Layer[]) => void;
}

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DEFAULT_BG_COLOR = 0xc2e3f8; // Light blue background

const CityCanvas: React.FC<CityCanvasProps> = ({
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  backgroundColor = DEFAULT_BG_COLOR,
  initialLayers = [],
  mapPoints = [],
  onLayerSelect,
  onLayerUpdate,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const layersRef = useRef<Map<string, PIXI.DisplayObject>>(new Map());
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);

  // Texture cache to avoid reloading
  const textureCache = useRef<Map<string, PIXI.Texture>>(new Map());

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current) return;

    // Clean up any existing application
    if (appRef.current) {
      appRef.current.destroy(true);
    }

    // Create a new PIXI Application
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add the canvas to the DOM
    canvasRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;

    // Create a container for all layers
    const layerContainer = new PIXI.Container();
    app.stage.addChild(layerContainer);

    // Set up responsive scaling
    const updateScale = () => {
      if (!canvasRef.current || !app.view) return;
      
      const containerWidth = canvasRef.current.clientWidth;
      const newScale = containerWidth / width;
      
      setScale(newScale);
      
      // Update the canvas size
      app.renderer.resize(containerWidth, containerWidth * (height / width));
      
      // Scale the stage to maintain aspect ratio
      app.stage.scale.set(newScale);
    };

    // Initial scale update
    updateScale();

    // Update scale on window resize
    const handleResize = debounce(updateScale, 100);
    window.addEventListener('resize', handleResize);

    // Mark as ready
    setIsReady(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [width, height, backgroundColor]);

  // Load and render layers whenever they change
  useEffect(() => {
    if (!isReady || !appRef.current) return;

    const renderLayers = async () => {
      // Clear existing layers
      layersRef.current.forEach((displayObject) => {
        displayObject.parent?.removeChild(displayObject);
      });
      layersRef.current.clear();

      // Sort layers by zIndex
      const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

      // Render each layer
      for (const layer of sortedLayers) {
        if (!layer.visible) continue;

        try {
          let texture: PIXI.Texture;

          // Use cached texture if available
          if (textureCache.current.has(layer.texturePath)) {
            texture = textureCache.current.get(layer.texturePath)!;
          } else {
            // Load the texture
            texture = await PIXI.Assets.load(layer.texturePath);
            textureCache.current.set(layer.texturePath, texture);
          }

          // Create sprite
          const sprite = new PIXI.Sprite(texture);
          sprite.position.set(layer.position.x, layer.position.y);
          sprite.scale.set(layer.scale);
          sprite.rotation = layer.rotation || 0;
          sprite.alpha = layer.opacity;
          sprite.interactive = !layer.locked;
          sprite.cursor = layer.locked ? 'default' : 'pointer';

          // Add to stage and store reference
          appRef.current!.stage.addChild(sprite);
          layersRef.current.set(layer.id, sprite);

          // Set up interaction if not locked
          if (!layer.locked) {
            sprite.on('pointerdown', () => {
              setSelectedLayerId(layer.id);
              if (onLayerSelect) onLayerSelect(layer);
            });
          }
        } catch (error) {
          console.error(`Failed to load texture for layer ${layer.id}:`, error);
        }
      }
    };

    // Debounce rendering to avoid too frequent updates
    const debouncedRender = debounce(renderLayers, 100);
    debouncedRender();

    return () => {
      debouncedRender.cancel();
    };
  }, [layers, isReady, onLayerSelect]);

  // Render map points (predefined locations)
  useEffect(() => {
    if (!isReady || !appRef.current || mapPoints.length === 0) return;

    const pointsContainer = new PIXI.Container();
    appRef.current.stage.addChild(pointsContainer);

    // Create a simple circle for each point
    mapPoints.forEach(point => {
      const graphics = new PIXI.Graphics();
      
      // Different colors based on point type
      let color;
      switch (point.type) {
        case 'hospital':
          color = 0xff0000; // Red
          break;
        case 'bakery':
          color = 0xffa500; // Orange
          break;
        case 'school':
          color = 0x0000ff; // Blue
          break;
        case 'open':
        default:
          color = 0x00ff00; // Green
      }
      
      graphics.beginFill(color, 0.5);
      graphics.drawCircle(0, 0, 15);
      graphics.endFill();
      
      // Add a border
      graphics.lineStyle(2, 0xffffff);
      graphics.drawCircle(0, 0, 15);
      
      graphics.position.set(point.x, point.y);
      graphics.alpha = 0.7;
      graphics.interactive = true;
      graphics.cursor = 'pointer';
      
      // Show point info on hover
      if (point.name) {
        graphics.on('mouseover', () => {
          // Could add tooltip here in the future
        });
      }
      
      pointsContainer.addChild(graphics);
    });

    return () => {
      if (pointsContainer.parent) {
        pointsContainer.parent.removeChild(pointsContainer);
      }
    };
  }, [mapPoints, isReady]);

  // Layer management functions
  const addLayer = useCallback((newLayer: Omit<Layer, 'id'>) => {
    const id = `layer_${Date.now()}`;
    const layer = { ...newLayer, id };
    
    setLayers(prev => {
      const updated = [...prev, layer as Layer];
      if (onLayerUpdate) onLayerUpdate(updated);
      return updated;
    });
    
    return id;
  }, [onLayerUpdate]);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => {
      const updated = prev.filter(layer => layer.id !== id);
      if (onLayerUpdate) onLayerUpdate(updated);
      return updated;
    });
    
    // Clear selection if the removed layer was selected
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
      if (onLayerSelect) onLayerSelect(null);
    }
  }, [selectedLayerId, onLayerUpdate, onLayerSelect]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      );
      if (onLayerUpdate) onLayerUpdate(updated);
      return updated;
    });
  }, [onLayerUpdate]);

  // Export image function (placeholder for now)
  const exportImage = useCallback(() => {
    if (!appRef.current) return null;
    return appRef.current.renderer.extract.canvas().toDataURL('image/png');
  }, []);

  return (
    <div className="canvas-container" style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div 
        ref={canvasRef} 
        className="pixi-canvas relative w-full"
        style={{ 
          aspectRatio: `${width}/${height}`,
          minWidth: '800px',
          backgroundColor: '#c2e3f8',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
        }}
      />
      {/* Debug info - can be removed in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1">
          Canvas: {width}x{height} | Scale: {scale.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default CityCanvas;
