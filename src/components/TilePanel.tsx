import {
  Box,
  Button,
  IconButton,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete, Add, SelectAll } from '@mui/icons-material';
import { useEditorStore } from '../store/editorStore';
import { useState, useRef, useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';

interface TilesetDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onConfirm: (tiles: Array<{ id: string; src: string; width: number; height: number }>) => void;
}

const TilesetDialog = ({ open, onClose, imageUrl, onConfirm }: TilesetDialogProps) => {
  const { t } = useLanguageStore();
  const [tileWidth, setTileWidth] = useState(64);
  const [tileHeight, setTileHeight] = useState(64);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTiles, setSelectedTiles] = useState<boolean[][]>([]);
  const [gridDimensions, setGridDimensions] = useState({ rows: 0, cols: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      
      const cols = Math.floor(img.width / tileWidth);
      const rows = Math.floor(img.height / tileHeight);
      setGridDimensions({ rows, cols });
      setSelectedTiles(Array(rows).fill(0).map(() => Array(cols).fill(false)));
    };
  }, [imageUrl, open, tileWidth, tileHeight]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const col = Math.floor((x * scaleX) / tileWidth);
    const row = Math.floor((y * scaleY) / tileHeight);

    if (row < gridDimensions.rows && col < gridDimensions.cols) {
      // 如果已经选中，则取消选中；如果未选中，则选中
      const newSelectedTiles = selectedTiles.map((r, i) =>
        r.map((c, j) => (i === row && j === col ? !c : c))
      );
      
      setSelectedTiles(newSelectedTiles);
      redrawCanvas(newSelectedTiles);
    }
  };

  const redrawCanvas = (newSelectedTiles: boolean[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除整个画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 使用缓存的图片对象
    if (imageRef.current) {
      // 绘制原始图片
      ctx.drawImage(imageRef.current, 0, 0);

      // 绘制网格
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridDimensions.rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * tileHeight);
        ctx.lineTo(canvas.width, i * tileHeight);
        ctx.stroke();
      }

      for (let i = 0; i <= gridDimensions.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileWidth, 0);
        ctx.lineTo(i * tileWidth, canvas.height);
        ctx.stroke();
      }

      // 绘制选中标记
      ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
      newSelectedTiles.forEach((row, i) => {
        row.forEach((selected, j) => {
          if (selected) {
            ctx.fillRect(j * tileWidth, i * tileHeight, tileWidth, tileHeight);
          }
        });
      });
    }
  };

  const handleSelectAll = () => {
    // 检查是否所有的 tile 都已经被选中
    const isAllSelected = selectedTiles.every(row => row.every(cell => cell));
    
    // 如果全部选中，则取消全选；否则全选
    const newSelectedTiles = Array(gridDimensions.rows)
      .fill(0)
      .map(() => Array(gridDimensions.cols).fill(!isAllSelected));
    
    setSelectedTiles(newSelectedTiles);
    redrawCanvas(newSelectedTiles);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tiles: Array<{ id: string; src: string; width: number; height: number }> = [];
    const img = new Image();
    img.src = imageUrl;

    // 按顺序遍历所有选中的 tiles
    for (let i = 0; i < selectedTiles.length; i++) {
      for (let j = 0; j < selectedTiles[i].length; j++) {
        if (selectedTiles[i][j]) {
          const tileCanvas = document.createElement('canvas');
          tileCanvas.width = tileWidth;
          tileCanvas.height = tileHeight;
          const tileCtx = tileCanvas.getContext('2d', { willReadFrequently: true });
          if (!tileCtx) continue;

          // 设置透明背景
          tileCtx.clearRect(0, 0, tileWidth, tileHeight);
          
          // 直接从原图中截取
          tileCtx.drawImage(
            img,
            j * tileWidth,
            i * tileHeight,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight
          );

          tiles.push({
            id: `tile-${Date.now()}-${i}-${j}`,
            src: tileCanvas.toDataURL('image/png'),
            width: tileWidth,
            height: tileHeight,
          });
        }
      }
    }

    onConfirm(tiles);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('addTileset')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', paddingTop: '6px' }}>
          <TextField
            label={t('tileWidth')}
            type="number"
            size="small"
            value={tileWidth}
            onChange={(e) => setTileWidth(Number(e.target.value))}
          />
          <TextField
            label={t('tileHeight')}
            type="number"
            size="small"
            value={tileHeight}
            onChange={(e) => setTileHeight(Number(e.target.value))}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<SelectAll />}
            onClick={handleSelectAll}
          >
            {selectedTiles.every(row => row.every(cell => cell)) ? t('cancelSelectAll') : t('selectAll')}
          </Button>
        </Box>
        <Box
          sx={{
            width: '100%',
            overflow: 'auto',
            border: '1px solid #ccc',
            borderRadius: 1,
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={handleConfirm} variant="contained">
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TilePanel = () => {
  const {
    tiles,
    selectedTiles,
    addTile,
    removeTile,
    selectTile,
    deselectTile,
    tileSize,
    setTileSize,
  } = useEditorStore();
  const { t } = useLanguageStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tilesetDialogOpen, setTilesetDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.error(t('noFileSelected'));
      return;
    }

    setIsLoading(true);
    try {
      const file = files[0];
      if (!file || !(file instanceof File)) {
        throw new Error(t('invalidFile'));
      }

      if (!file.type.startsWith('image/')) {
        throw new Error(t('selectImageFile'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result || typeof e.target.result !== 'string') {
          throw new Error(t('loadError'));
        }
        setCurrentImageUrl(e.target.result);
        setTilesetDialogOpen(true);
      };

      reader.onerror = () => {
        throw new Error(t('fileReadError') + ': ' + reader.error?.message);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error loading tileset:', error);
      alert(error instanceof Error ? error.message : t('loadingTilesetError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTilesetConfirm = (newTiles: Array<{ id: string; src: string; width: number; height: number }>) => {
    newTiles.forEach(tile => addTile(tile));
    setTilesetDialogOpen(false);
  };

  const handleTileClick = (tileId: string) => {
    // 检查 tile 是否已经被选中
    if (selectedTiles.includes(tileId)) {
      // 如果已经选中，则取消选中
      deselectTile(tileId);
    } else {
      // 如果未选中，则先清除其他选中的 tile，再选中当前 tile
      selectedTiles.forEach(id => deselectTile(id));
      selectTile(tileId);
    }
  };

  return (
    <Box sx={{ 
      p: 2,
      height: '100vh',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('mapEditor')}</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {t('addTileset')}
        </Button>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileSelect}
        />
      </Box>

      <TextField
        label={t('tileSize')}
        type="number"
        size="small"
        value={tileSize}
        onChange={(e) => setTileSize(Number(e.target.value))}
        sx={{ mb: 2, width: '100%' }}
      />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          overflowY: 'auto',
          padding: 0.5,
          alignContent: 'flex-start',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#666',
            },
          },
        }}
      >
        {tiles.map((tile) => (
          <Box
            key={tile.id}
            sx={{
              width: '48px',
              height: '48px',
              border: (theme) =>
                selectedTiles.includes(tile.id)
                  ? `2px solid ${theme.palette.primary.main}`
                  : '2px solid transparent',
              borderRadius: 1,
              cursor: 'pointer',
              position: 'relative',
              '&:hover': {
                '& .delete-button': {
                  display: 'flex',
                },
              },
            }}
            onClick={() => handleTileClick(tile.id)}
          >
            <img
              src={tile.src}
              alt={`Tile ${tile.id}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '2px',
              }}
            />
            <IconButton
              className="delete-button"
              size="small"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                display: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                '&:hover': {
                  backgroundColor: '#fff',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                removeTile(tile.id);
              }}
            >
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Box sx={{ 
        mt: 2, 
        pt: 1, 
        borderTop: 1, 
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          {t('totalTiles').replace('{count}', tiles.length.toString())}
        </Typography>
      </Box>

      <TilesetDialog
        open={tilesetDialogOpen}
        onClose={() => setTilesetDialogOpen(false)}
        imageUrl={currentImageUrl}
        onConfirm={handleTilesetConfirm}
      />
    </Box>
  );
};

export default TilePanel; 