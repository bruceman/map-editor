import { Box } from '@mui/material';
import { Stage, Layer, Rect, Image } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import ToolBar from './ToolBar';
import useImage from 'use-image';
import { useThemeStore } from '../App';
import { KonvaEventObject } from 'konva/lib/Node';

interface TileImageProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const TileImage = ({ src, x, y, width, height }: TileImageProps) => {
  const [image] = useImage(src);
  return <Image image={image} x={x} y={y} width={width} height={height} />;
};

const MapEditor = () => {
  const {
    mapWidth,
    mapHeight,
    scale,
    gridVisible,
    gridStyle,
    tileSize,
    layers,
    currentLayer,
    tiles,
    selectedTiles,
    addTileToLayer,
    setStageRef,
    isErasing,
    removeTileFromLayer,
  } = useEditorStore();

  const { isDarkMode } = useThemeStore();

  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (stageRef.current) {
      setStageRef(stageRef.current);
    }
  }, [stageRef, setStageRef]);

  // 计算舞台尺寸和初始位置
  useEffect(() => {
    const width = window.innerWidth - 560;
    const height = window.innerHeight - 100;
    setStageSize({ width, height });
    
    // 计算使地图居中的位置
    const centerX = (width - mapWidth * scale) / 2;
    const centerY = (height - mapHeight * scale) / 2;
    setStagePos({ x: centerX, y: centerY });
  }, [mapWidth, mapHeight, scale]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (!currentLayer) return;
    if (!isErasing && selectedTiles.length === 0) return;

    const stage = e.target.getStage();
    if (!stage) return;
    
    const point = stage.getPointerPosition();
    if (!point) return;
    
    // 转换点击坐标到相对于stage的坐标
    const x = (point.x - stagePos.x) / scale;
    const y = (point.y - stagePos.y) / scale;
    
    // 检查是否在地图范围内
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
      return;
    }

    // 对齐到网格
    const gridX = Math.floor(x / tileSize) * tileSize;
    const gridY = Math.floor(y / tileSize) * tileSize;

    if (isErasing) {
      // 找到当前图层
      const layer = layers.find(l => l.id === currentLayer);
      if (!layer) return;

      // 找到点击位置的tile
      const clickedTile = layer.tiles.find(
        tile => tile.x === gridX && tile.y === gridY
      );

      // 如果找到了tile，就删除它
      if (clickedTile) {
        removeTileFromLayer(currentLayer, clickedTile.id);
      }
    } else {
      // 添加选中的tile到当前图层
      selectedTiles.forEach(tileId => {
        addTileToLayer(currentLayer, tileId, gridX, gridY);
      });
    }
  };

  const renderGrid = () => {
    if (!gridVisible) return null;

    const gridLines = [];
    const numRows = Math.ceil(mapHeight / tileSize);
    const numCols = Math.ceil(mapWidth / tileSize);

    // Vertical lines
    for (let i = 0; i <= numCols; i++) {
      gridLines.push(
        <Rect
          key={`v${i}`}
          x={i * tileSize}
          y={0}
          width={1}
          height={mapHeight}
          stroke="#ccc"
          strokeWidth={1}
          dash={gridStyle === 'dashed' ? [5, 5] : undefined}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= numRows; i++) {
      gridLines.push(
        <Rect
          key={`h${i}`}
          x={0}
          y={i * tileSize}
          width={mapWidth}
          height={1}
          stroke="#ccc"
          strokeWidth={1}
          dash={gridStyle === 'dashed' ? [5, 5] : undefined}
        />
      );
    }

    return gridLines;
  };

  return (
    <Box sx={{ 
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      backgroundColor: 'background.default',
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 2
      }}>
        <ToolBar />
      </Box>
      <Box sx={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <Box sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: isDarkMode ? '#1e1e1e' : '#e0e0e0',
          backgroundImage: isDarkMode 
            ? 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)'
            : 'linear-gradient(45deg, #d8d8d8 25%, transparent 25%), linear-gradient(-45deg, #d8d8d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d8d8d8 75%), linear-gradient(-45deg, transparent 75%, #d8d8d8 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }} />
        <Box sx={{
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 2,
          p: 2,
          '& .konvajs-content': {
            cursor: isErasing ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18" stroke="red" stroke-width="2"/><line x1="6" y1="18" x2="18" y2="6" stroke="red" stroke-width="2"/></svg>') 12 12, none` : 'default',
          }
        }}>
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scale={{ x: scale, y: scale }}
            position={stagePos}
            draggable={!isErasing}
            onDragEnd={(e) => {
              setStagePos(e.target.position());
            }}
            onClick={handleStageClick}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={mapWidth}
                height={mapHeight}
                fill={isDarkMode ? '#2d2d2d' : 'white'}
                stroke={isDarkMode ? '#666' : '#999'}
              />
              {renderGrid()}
            </Layer>
            {[...layers].reverse().map((layer) => (
              <Layer key={layer.id} visible={layer.visible} width={mapWidth} height={mapHeight}>
                {layer.tiles.map((tile) => {
                  const tileData = tiles.find(t => t.id === tile.tileId);
                  if (!tileData) return null;
                  
                  return (
                    <TileImage
                      key={tile.id}
                      src={tileData.src}
                      x={tile.x}
                      y={tile.y}
                      width={tileSize}
                      height={tileSize}
                    />
                  );
                })}
              </Layer>
            ))}
          </Stage>
        </Box>
      </Box>
    </Box>
  );
};

export default MapEditor; 