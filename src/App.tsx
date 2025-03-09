import { Box, ThemeProvider, createTheme } from '@mui/material';
import MapEditor from './components/MapEditor';
import LayerPanel from './components/LayerPanel';
import TilePanel from './components/TilePanel';
import { useState, useMemo } from 'react';
import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

function App() {
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const { isDarkMode } = useThemeStore();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
        },
      }),
    [isDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        overflow: 'hidden',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}>
        <Box sx={{ 
          width: 280, 
          borderRight: 1, 
          borderColor: 'divider',
          overflow: 'auto',
          bgcolor: 'background.paper',
        }}>
          <TilePanel />
        </Box>
        
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}>
          <MapEditor />
        </Box>

        <Box sx={{ 
          display: 'flex',
          bgcolor: 'background.paper',
        }}>
          <Box
            onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
            sx={{
              width: 16,
              borderLeft: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&::after': {
                content: '""',
                width: 0,
                height: 0,
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderLeft: isLayerPanelOpen ? '4px solid #999' : 'none',
                borderRight: !isLayerPanelOpen ? '4px solid #999' : 'none',
                transition: 'transform 0.2s ease',
                transform: isLayerPanelOpen ? 'translateX(1px)' : 'translateX(-1px)',
              }
            }}
          />
          {isLayerPanelOpen && (
            <Box sx={{ 
              width: 280,
              borderLeft: 1,
              borderColor: 'divider',
              overflow: 'auto',
              bgcolor: 'background.paper',
            }}>
              <LayerPanel />
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
