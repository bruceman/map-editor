import {
  Box,
  Button,
  ButtonGroup,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  GridOn,
  GridOff,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  Upload,
  Image as ImageIcon,
  FormatColorFill,
  Shuffle,
  DeleteOutline,
  DarkMode,
  LightMode,
  AutoFixNormal,
  Translate,
} from '@mui/icons-material';
import { useEditorStore } from '../store/editorStore';
import { useThemeStore } from '../App';
import { useLanguageStore } from '../store/languageStore';
import { useState } from 'react';

const ToolBar = () => {
  const {
    mapWidth,
    mapHeight,
    scale,
    gridVisible,
    gridStyle,
    setMapSize,
    setScale,
    setGridVisible,
    setGridStyle,
    undo,
    redo,
    stageRef,
    currentLayer,
    selectedTiles,
    fillMapWithTile,
    randomDistributeTiles,
    clearLayerTiles,
    isErasing,
    toggleErasing,
  } = useEditorStore();

  const { isDarkMode, toggleTheme } = useThemeStore();
  const { t, currentLanguage, setLanguage } = useLanguageStore();

  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageSelect = (language: 'zh' | 'en') => {
    setLanguage(language);
    handleLanguageClose();
  };

  const handleExportImage = async () => {
    if (!stageRef) return;
    
    const dataUrl = stageRef.toDataURL();
    const link = document.createElement('a');
    link.download = 'map.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const state = useEditorStore.getState();
    const json = JSON.stringify({
      mapWidth: state.mapWidth,
      mapHeight: state.mapHeight,
      tileSize: state.tileSize,
      layers: state.layers,
      tiles: state.tiles,
    }, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'map.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('没有选择文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('文件读取失败');
        }

        const json = JSON.parse(e.target.result as string);
        console.log('解析的 JSON 数据:', json);
        
        // 验证导入的数据
        if (!json.mapWidth || !json.mapHeight || !json.tileSize || !Array.isArray(json.layers) || !Array.isArray(json.tiles)) {
          throw new Error(`数据格式验证失败:
            mapWidth: ${json.mapWidth},
            mapHeight: ${json.mapHeight},
            tileSize: ${json.tileSize},
            layers: ${!!json.layers},
            tiles: ${!!json.tiles}`
          );
        }

        // 更新地图尺寸
        setMapSize(json.mapWidth, json.mapHeight);
        
        // 更新编辑器状态
        const newState = {
          tileSize: json.tileSize,
          layers: json.layers,
          tiles: json.tiles,
          history: [],
          currentHistoryIndex: -1,
        };
        console.log('准备更新的状态:', newState);
        
        useEditorStore.setState((state) => ({
          ...state,
          ...newState
        }));

        // 清除文件输入，以便可以重新导入相同的文件
        event.target.value = '';
        
        console.log('导入成功');

      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败：' + (error instanceof Error ? error.message : '文件格式不正确'));
      }
    };

    reader.onerror = (error) => {
      console.error('文件读取错误:', error);
      alert('文件读取失败');
    };

    reader.readAsText(file);
  };

  const handleFillMap = () => {
    if (!currentLayer || selectedTiles.length === 0) return;
    fillMapWithTile(currentLayer, selectedTiles[0]);
  };

  const handleRandomDistribute = () => {
    if (!currentLayer || selectedTiles.length === 0) return;
    randomDistributeTiles(currentLayer, selectedTiles[0]);
  };

  return (
    <Box sx={{ 
      display: 'inline-flex',
      gap: 1, 
      alignItems: 'center',
      p: 1,
      backgroundColor: 'background.paper',
      borderRadius: 1,
      '& .MuiTextField-root': {
        bgcolor: 'background.paper',
      },
      '& .MuiOutlinedInput-root': {
        bgcolor: 'background.paper',
      },
      '& .MuiToggleButton-root': {
        bgcolor: 'background.paper',
      },
      '& .MuiButton-root': {
        bgcolor: 'background.paper',
      }
    }}>
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title={t('undo')}>
          <Button onClick={undo}>
            <Undo fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title={t('redo')}>
          <Button onClick={redo}>
            <Redo fontSize="small" />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup variant="outlined" size="small">
        <Tooltip title={t('zoomIn')}>
          <Button onClick={() => setScale(scale * 1.2)}>
            <ZoomIn fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title={t('zoomOut')}>
          <Button onClick={() => setScale(scale / 1.2)}>
            <ZoomOut fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title={t('defaultSize')}>
          <Button onClick={() => setScale(1)}>
            <span style={{ fontSize: '12px' }}>1:1</span>
          </Button>
        </Tooltip>
      </ButtonGroup>

      <TextField
        label={t('width')}
        type="number"
        size="small"
        value={mapWidth}
        onChange={(e) => setMapSize(Number(e.target.value), mapHeight)}
        sx={{ width: 80 }}
        InputProps={{ sx: { height: 30 } }}
      />

      <TextField
        label={t('height')}
        type="number"
        size="small"
        value={mapHeight}
        onChange={(e) => setMapSize(mapWidth, Number(e.target.value))}
        sx={{ width: 80 }}
        InputProps={{ sx: { height: 30 } }}
      />

      <ToggleButton
        value="grid"
        selected={gridVisible}
        onChange={() => setGridVisible(!gridVisible)}
        size="small"
        sx={{ padding: '4px' }}
      >
        {gridVisible ? <GridOn fontSize="small" /> : <GridOff fontSize="small" />}
      </ToggleButton>

      <ToggleButtonGroup
        value={gridStyle}
        exclusive
        onChange={(_, value) => value && setGridStyle(value)}
        size="small"
      >
        <ToggleButton value="solid" sx={{ padding: '4px 8px' }}>{t('solidLine')}</ToggleButton>
        <ToggleButton value="dashed" sx={{ padding: '4px 8px' }}>{t('dashedLine')}</ToggleButton>
      </ToggleButtonGroup>

      <ButtonGroup variant="outlined" size="small">
        <Tooltip title={t('exportJSON')}>
          <Button onClick={handleExportJson}>
            <Save fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title={t('importJSON')}>
          <Button component="label">
            <Upload fontSize="small" />
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImportJson}
            />
          </Button>
        </Tooltip>
        <Tooltip title={t('exportImage')}>
          <Button onClick={handleExportImage}>
            <ImageIcon fontSize="small" />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup variant="outlined" size="small">
        <Tooltip title={t('fillMap')}>
          <span>
            <Button
              onClick={handleFillMap}
              disabled={!currentLayer || selectedTiles.length === 0 || isErasing}
            >
              <FormatColorFill fontSize="small" />
            </Button>
          </span>
        </Tooltip>

        <Tooltip title={t('randomDistribute')}>
          <span>
            <Button
              onClick={handleRandomDistribute}
              disabled={!currentLayer || selectedTiles.length === 0 || isErasing}
            >
              <Shuffle fontSize="small" />
            </Button>
          </span>
        </Tooltip>

        <Tooltip title={isErasing ? t('cancelEraser') : t('eraser')}>
          <span>
            <Button
              onClick={toggleErasing}
              disabled={!currentLayer}
              sx={{
                '&.Mui-disabled': {
                  color: 'action.disabled',
                }
              }}
            >
              <AutoFixNormal fontSize="small" color={isErasing ? "error" : "inherit"} />
            </Button>
          </span>
        </Tooltip>

        <Tooltip title={t('clearLayer')}>
          <span>
            <Button
              onClick={() => currentLayer && clearLayerTiles(currentLayer)}
              disabled={!currentLayer}
            >
              <DeleteOutline fontSize="small" />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      <Tooltip title={isDarkMode ? t('toggleLightMode') : t('toggleDarkMode')}>
        <ToggleButton
          value="darkMode"
          selected={isDarkMode}
          onChange={toggleTheme}
          size="small"
          sx={{ padding: '4px' }}
        >
          {isDarkMode ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
        </ToggleButton>
      </Tooltip>

      <Tooltip title={t('language')}>
        <IconButton
          size="small"
          onClick={handleLanguageClick}
          sx={{ padding: '4px' }}
        >
          <Translate fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={languageMenuAnchor}
        open={Boolean(languageMenuAnchor)}
        onClose={handleLanguageClose}
      >
        <MenuItem
          onClick={() => handleLanguageSelect('zh')}
          selected={currentLanguage === 'zh'}
        >
          中文
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageSelect('en')}
          selected={currentLanguage === 'en'}
        >
          English
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ToolBar; 