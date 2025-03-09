import { create } from 'zustand';
import { Stage } from 'konva/lib/Stage';

export interface Tile {
  id: string;
  src: string;
  width: number;
  height: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  tiles: Array<{
    id: string;
    tileId: string;
    x: number;
    y: number;
  }>;
}

interface HistoryState {
  layers: Array<{
    id: string;
    tiles: Layer['tiles'];
  }>;
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
}

interface EditorState {
  tiles: Tile[];
  selectedTiles: string[];
  layers: Layer[];
  currentLayer: string | null;
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  gridVisible: boolean;
  gridStyle: 'dashed' | 'solid' | 'none';
  scale: number;
  history: HistoryState[];
  currentHistoryIndex: number;
  stageRef: Stage | null;
  isErasing: boolean;
  
  // Actions
  addTile: (tile: Tile) => void;
  removeTile: (id: string) => void;
  selectTile: (id: string) => void;
  deselectTile: (id: string) => void;
  addLayer: (name?: string) => void;
  removeLayer: (id: string) => void;
  setCurrentLayer: (id: string) => void;
  setMapSize: (width: number, height: number) => void;
  setTileSize: (size: number) => void;
  setScale: (scale: number) => void;
  setGridStyle: (style: 'dashed' | 'solid' | 'none') => void;
  setGridVisible: (visible: boolean) => void;
  addTileToLayer: (layerId: string, tileId: string, x: number, y: number) => void;
  removeTileFromLayer: (layerId: string, tileInstanceId: string) => void;
  setStageRef: (stage: Stage | null) => void;
  updateLayers: (layers: Layer[]) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  toggleLayerVisibility: (layerId: string) => void;
  fillMapWithTile: (layerId: string, tileId: string) => void;
  undo: () => void;
  redo: () => void;
  addToHistory: () => void;
  randomDistributeTiles: (layerId: string, tileId: string) => void;
  clearLayerTiles: (layerId: string) => void;
  toggleErasing: () => void;
}

const addToHistoryHelper = (state: EditorState) => {
  const historyCopy = [...state.history.slice(0, state.currentHistoryIndex + 1)];
  const stateCopy = {
    layers: state.layers.map(layer => ({
      id: layer.id,
      tiles: JSON.parse(JSON.stringify(layer.tiles))
    })),
    mapWidth: state.mapWidth,
    mapHeight: state.mapHeight,
    tileSize: state.tileSize,
  };
  
  return {
    history: [...historyCopy, stateCopy],
    currentHistoryIndex: state.currentHistoryIndex + 1,
  };
};

export const useEditorStore = create<EditorState>((set, get) => {
  const initialState = {
    tiles: [],
    selectedTiles: [],
    layers: [{ id: '1', name: 'Layer 1', visible: true, tiles: [] }],
    currentLayer: '1',
    mapWidth: 832,
    mapHeight: 640,
    tileSize: 64,
    gridVisible: true,
    gridStyle: 'dashed' as const,
    scale: 1,
    history: [],
    currentHistoryIndex: -1,
    stageRef: null,
    isErasing: false,
  };

  // 在创建 store 时立即保存初始状态
  const stateWithHistory = {
    ...initialState,
    history: [
      {
        layers: initialState.layers.map(layer => ({
          id: layer.id,
          tiles: []
        })),
        mapWidth: initialState.mapWidth,
        mapHeight: initialState.mapHeight,
        tileSize: initialState.tileSize,
      },
    ],
    currentHistoryIndex: 0,
  };

  return {
    ...stateWithHistory,

    addTile: (tile) => set((state) => ({ tiles: [...state.tiles, tile] })),
    
    removeTile: (id) => set((state) => ({
      tiles: state.tiles.filter((t) => t.id !== id),
      selectedTiles: state.selectedTiles.filter((tId) => tId !== id),
    })),
    
    selectTile: (id) => set((state) => ({
      selectedTiles: [...state.selectedTiles, id],
    })),
    
    deselectTile: (id) => set((state) => ({
      selectedTiles: state.selectedTiles.filter((tId) => tId !== id),
    })),
    
    addLayer: (name) => set((state) => {
      const newLayer = {
        id: String(state.layers.length + 1),
        name: name || `Layer ${state.layers.length + 1}`,
        visible: true,
        tiles: [],
      };
      return {
        layers: [...state.layers, newLayer],
        currentLayer: newLayer.id,
      };
    }),
    
    removeLayer: (id) => set((state) => {
      if (state.layers.length === 1) return state;
      return {
        layers: state.layers.filter((layer) => layer.id !== id),
        currentLayer: state.currentLayer === id ? state.layers[0].id : state.currentLayer,
      };
    }),
    
    setCurrentLayer: (id) => set({ currentLayer: id }),
    
    setMapSize: (width, height) => set((state) => ({
      mapWidth: width,
      mapHeight: height,
      ...addToHistoryHelper({ ...state, mapWidth: width, mapHeight: height }),
    })),
    
    setTileSize: (size) => set((state) => ({
      tileSize: size,
      ...addToHistoryHelper({ ...state, tileSize: size }),
    })),
    
    setScale: (scale) => set({ scale }),
    
    setGridStyle: (style) => set({ gridStyle: style }),
    
    setGridVisible: (visible) => set({ gridVisible: visible }),
    
    addTileToLayer: (layerId, tileId, x, y) => set((state) => {
      const newLayers = state.layers.map((layer) => {
        if (layer.id === layerId) {
          return {
            ...layer,
            tiles: [...layer.tiles, {
              id: `${Date.now()}-${Math.random()}`,
              tileId,
              x,
              y,
            }],
          };
        }
        return layer;
      });
      
      const newState = { layers: newLayers };
      return {
        ...newState,
        ...addToHistoryHelper({ ...state, ...newState }),
      };
    }),
    
    removeTileFromLayer: (layerId, tileInstanceId) => set((state) => {
      const newLayers = state.layers.map((layer) => {
        if (layer.id === layerId) {
          return {
            ...layer,
            tiles: layer.tiles.filter((tile) => tile.id !== tileInstanceId),
          };
        }
        return layer;
      });
      
      const newState = { layers: newLayers };
      return {
        ...newState,
        ...addToHistoryHelper({ ...state, ...newState }),
      };
    }),
    
    setStageRef: (stage) => set({ stageRef: stage }),
    
    updateLayers: (layers) => set((state) => ({
      layers,
      ...addToHistoryHelper({ ...state, layers }),
    })),
    
    moveLayer: (layerId, direction) => set((state) => {
      const index = state.layers.findIndex(layer => layer.id === layerId);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === state.layers.length - 1)
      ) {
        return state;
      }

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(index, 1);
      newLayers.splice(newIndex, 0, removed);
      
      const newState = { layers: newLayers };
      return {
        ...newState,
        ...addToHistoryHelper({ ...state, ...newState }),
      };
    }),
    
    toggleLayerVisibility: (layerId) => set((state) => {
      const newLayers = state.layers.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      );
      
      const newState = { layers: newLayers };
      return {
        ...newState,
        ...addToHistoryHelper({ ...state, ...newState }),
      };
    }),
    
    fillMapWithTile: (layerId, tileId) => set((state) => {
      if (!layerId) return state;

      const rows = Math.floor(state.mapHeight / state.tileSize);
      const cols = Math.floor(state.mapWidth / state.tileSize);
      const newTiles: Layer['tiles'] = [];

      // 生成填充所有格子的tiles
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          newTiles.push({
            id: `tile-${Date.now()}-${Math.random()}`,
            tileId,
            x: col * state.tileSize,
            y: row * state.tileSize,
          });
        }
      }

      // 更新图层
      const newLayers = state.layers.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            tiles: newTiles,
          };
        }
        return layer;
      });

      const newState = { layers: newLayers };
      return {
        ...newState,
        ...addToHistoryHelper({ ...state, ...newState }),
      };
    }),
    
    addToHistory: () => set((state) => addToHistoryHelper(state)),
    
    undo: () => {
      const { currentHistoryIndex, history } = get();
      if (currentHistoryIndex > 0) {
        const previousState = history[currentHistoryIndex - 1];
        const currentState = get();
        
        // 将历史记录中的瓦片数据应用到当前图层
        const newLayers = currentState.layers.map(layer => {
          const historyLayer = previousState.layers.find(l => l.id === layer.id);
          return {
            ...layer,
            tiles: historyLayer ? historyLayer.tiles : layer.tiles,
          };
        });

        set({
          ...currentState,
          layers: newLayers,
          mapWidth: previousState.mapWidth,
          mapHeight: previousState.mapHeight,
          tileSize: previousState.tileSize,
          currentHistoryIndex: currentHistoryIndex - 1,
        });
      }
    },
    
    redo: () => {
      const { currentHistoryIndex, history } = get();
      if (currentHistoryIndex < history.length - 1) {
        const nextState = history[currentHistoryIndex + 1];
        const currentState = get();

        // 将历史记录中的瓦片数据应用到当前图层
        const newLayers = currentState.layers.map(layer => {
          const historyLayer = nextState.layers.find(l => l.id === layer.id);
          return {
            ...layer,
            tiles: historyLayer ? historyLayer.tiles : layer.tiles,
          };
        });

        set({
          ...currentState,
          layers: newLayers,
          mapWidth: nextState.mapWidth,
          mapHeight: nextState.mapHeight,
          tileSize: nextState.tileSize,
          currentHistoryIndex: currentHistoryIndex + 1,
        });
      }
    },
    
    randomDistributeTiles: (layerId, tileId) => set((state) => {
      if (!layerId) return state;

      const rows = Math.floor(state.mapHeight / state.tileSize);
      const cols = Math.floor(state.mapWidth / state.tileSize);
      const totalCells = rows * cols;
      
      // 找到当前图层
      const currentLayer = state.layers.find(layer => layer.id === layerId);
      if (!currentLayer) return state;

      // 创建所有可能的位置
      const allPositions: Array<{ x: number; y: number }> = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * state.tileSize;
          const y = row * state.tileSize;
          allPositions.push({ x, y });
        }
      }
      
      // 生成3到总格子数10%之间的随机数
      const maxTiles = Math.floor(totalCells * 0.1);
      const numTiles = Math.floor(Math.random() * (maxTiles - 3 + 1)) + 3;
      
      // 随机打乱位置数组
      for (let i = allPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
      }
      
      // 取前numTiles个位置
      const selectedPositions = allPositions.slice(0, numTiles);
      
      // 生成新的tiles列表，保留未被选中位置的原有tiles
      const newTiles: Layer['tiles'] = currentLayer.tiles.filter(tile => 
        !selectedPositions.some(pos => pos.x === tile.x && pos.y === tile.y)
      );

      // 添加新的随机tiles
      selectedPositions.forEach(pos => {
        newTiles.push({
          id: `tile-${Date.now()}-${Math.random()}`,
          tileId,
          x: pos.x,
          y: pos.y,
        });
      });

      // 更新图层
      const newLayers = state.layers.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            tiles: newTiles,
          };
        }
        return layer;
      });

      const newState = { layers: newLayers };
      return {
        ...newState,
        ...addToHistoryHelper({ ...state, ...newState }),
      };
    }),
    
    clearLayerTiles: (layerId) => set((state) => {
      const newLayers = state.layers.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            tiles: []
          };
        }
        return layer;
      });

      const newState = { layers: newLayers };
      return {
        ...newState,
        ...addToHistoryHelper({ ...state, ...newState }),
      };
    }),
    
    toggleErasing: () => set((state) => ({
      isErasing: !state.isErasing,
      selectedTiles: [], // 清空选中的tiles
    })),
  };
}); 