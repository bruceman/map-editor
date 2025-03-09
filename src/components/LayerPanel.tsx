import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useEditorStore } from '../store/editorStore';
import { useLanguageStore } from '../store/languageStore';

const LayerPanel = () => {
  const {
    layers,
    currentLayer,
    addLayer,
    removeLayer,
    setCurrentLayer,
    moveLayer,
    toggleLayerVisibility,
  } = useEditorStore();

  const { t } = useLanguageStore();

  // 获取最大的图层编号
  const getNextLayerNumber = () => {
    const numbers = layers.map(layer => {
      const match = layer.name.match(/Layer (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    return Math.max(0, ...numbers) + 1;
  };

  // 添加新图层
  const handleAddLayer = () => {
    const nextNumber = getNextLayerNumber();
    addLayer(`Layer ${nextNumber}`);
  };

  return (
    <Paper sx={{ p: 2, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>{t('layers')}</Typography>
        <Tooltip title={t('addLayer')}>
          <IconButton onClick={handleAddLayer} size="small">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {layers.map((layer, index) => (
          <ListItemButton
            key={layer.id}
            selected={layer.id === currentLayer}
            onClick={() => setCurrentLayer(layer.id)}
            sx={{
              mb: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: layer.id === currentLayer ? 'primary.main' : 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemText 
              primary={layer.name}
              sx={{ 
                '& .MuiListItemText-primary': {
                  fontWeight: layer.id === currentLayer ? 'bold' : 'normal',
                }
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={layer.visible ? t('hideLayer') : t('showLayer')}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                >
                  {layer.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={t('moveLayerUp')}>
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'up');
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUpIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={t('moveLayerDown')}>
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'down');
                    }}
                    disabled={index === layers.length - 1}
                  >
                    <ArrowDownIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={t('deleteLayer')}>
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                    disabled={layers.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};

export default LayerPanel; 