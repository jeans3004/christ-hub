/**
 * Seletor de emojis simples (sem dependências externas).
 */

'use client';
import { useState, useMemo } from 'react';
import {
  Box,
  Popover,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import { EmojiEmotions, Search } from '@mui/icons-material';

// Categorias de emojis comuns
const EMOJI_CATEGORIES = [
  {
    name: 'Carinhas',
    icon: '😀',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  },
  {
    name: 'Gestos',
    icon: '👋',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'],
  },
  {
    name: 'Objetos',
    icon: '📚',
    emojis: ['📱', '💻', '🖥️', '🖨️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '📷', '📸', '📹', '🎥', '📽️', '🎬', '📼', '🔍', '🔎', '💡', '🔦', '🏮', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮'],
  },
  {
    name: 'Natureza',
    icon: '🌸',
    emojis: ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥'],
  },
  {
    name: 'Símbolos',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '✅', '❌', '❓', '❗', '💯', '🔥', '💥', '💢', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🎵', '🎶', '🔔', '🔕', '📣', '📢'],
  },
  {
    name: 'Escola',
    icon: '📝',
    emojis: ['📝', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '🔏', '🔐', '🔒', '🔓', '📐', '📏', '📌', '📍', '✂️', '🗃️', '🗄️', '🗑️', '🎒', '👨‍🏫', '👩‍🏫', '👨‍🎓', '👩‍🎓', '🏫', '📅', '📆', '🗓️', '📇', '🗒️', '🗂️', '📋', '📁', '📂'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  buttonSize?: 'small' | 'medium' | 'large';
  anchorOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' | 'center' };
}

export function EmojiPicker({
  onSelect,
  disabled = false,
  buttonSize = 'medium',
  anchorOrigin = { vertical: 'top', horizontal: 'left' },
}: EmojiPickerProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filteredEmojis = useMemo(() => {
    if (!searchTerm) {
      return EMOJI_CATEGORIES[activeTab].emojis;
    }
    // Busca em todas as categorias quando há termo de busca
    return EMOJI_CATEGORIES.flatMap((cat) => cat.emojis).slice(0, 60);
  }, [activeTab, searchTerm]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
  };

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    // Não fecha o picker para permitir múltiplas seleções
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Inserir emoji">
        <span>
          <IconButton
            size={buttonSize}
            onClick={handleClick}
            disabled={disabled}
            sx={{ borderRadius: 1 }}
          >
            <EmojiEmotions />
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        transformOrigin={{
          vertical: anchorOrigin.vertical === 'top' ? 'bottom' : 'top',
          horizontal: anchorOrigin.horizontal,
        }}
      >
        <Box sx={{ width: 320, maxHeight: 400 }}>
          {/* Busca */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar emoji..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Tabs de categorias */}
          {!searchTerm && (
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 40,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 40,
                  minWidth: 40,
                  padding: 1,
                },
              }}
            >
              {EMOJI_CATEGORIES.map((cat, index) => (
                <Tab
                  key={cat.name}
                  icon={<span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>}
                  aria-label={cat.name}
                  title={cat.name}
                />
              ))}
            </Tabs>
          )}

          {/* Grid de emojis */}
          <Box
            sx={{
              p: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 0.5,
              maxHeight: 250,
              overflow: 'auto',
            }}
          >
            {filteredEmojis.map((emoji, index) => (
              <Box
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                sx={{
                  fontSize: '1.5rem',
                  padding: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {emoji}
              </Box>
            ))}
          </Box>

          {/* Categoria atual */}
          {!searchTerm && (
            <Box sx={{ px: 1.5, py: 0.5, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                {EMOJI_CATEGORIES[activeTab].name}
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}
