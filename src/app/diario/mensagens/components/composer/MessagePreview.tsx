/**
 * Preview de mensagem com formatação WhatsApp.
 */

'use client';
import { useMemo } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { ContentCopy, Check, Image, InsertDriveFile, AudioFile, Videocam, LocationOn, Person } from '@mui/icons-material';
import { useState } from 'react';
import { whatsappToHtml, WHATSAPP_PREVIEW_STYLES } from '../../utils/formatWhatsApp';
import { TipoMensagemMedia } from '../../types';

interface MessagePreviewProps {
  text: string;
  mediaType?: TipoMensagemMedia;
  mediaUrl?: string;
  mediaFilename?: string;
  locationName?: string;
  contactName?: string;
  showCopyButton?: boolean;
  variant?: 'bubble' | 'card';
}

export function MessagePreview({
  text,
  mediaType = 'text',
  mediaUrl,
  mediaFilename,
  locationName,
  contactName,
  showCopyButton = true,
  variant = 'bubble',
}: MessagePreviewProps) {
  const [copied, setCopied] = useState(false);

  const htmlContent = useMemo(() => whatsappToHtml(text), [text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const renderMediaPreview = () => {
    if (mediaType === 'text' || !mediaType) return null;

    const iconMap: Record<TipoMensagemMedia, React.ReactNode> = {
      text: null,
      image: <Image sx={{ fontSize: 48, color: 'grey.400' }} />,
      document: <InsertDriveFile sx={{ fontSize: 48, color: 'grey.400' }} />,
      audio: <AudioFile sx={{ fontSize: 48, color: 'grey.400' }} />,
      video: <Videocam sx={{ fontSize: 48, color: 'grey.400' }} />,
      location: <LocationOn sx={{ fontSize: 48, color: 'error.main' }} />,
      contact: <Person sx={{ fontSize: 48, color: 'primary.main' }} />,
      sticker: <Image sx={{ fontSize: 48, color: 'grey.400' }} />,
    };

    if (mediaType === 'image' && mediaUrl) {
      return (
        <Box sx={{ mb: 1 }}>
          <img
            src={mediaUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: 200,
              borderRadius: 8,
              objectFit: 'cover',
            }}
          />
        </Box>
      );
    }

    if (mediaType === 'location') {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            mb: 1,
            bgcolor: 'grey.100',
            borderRadius: 1,
          }}
        >
          {iconMap.location}
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {locationName || 'Localização'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Localização compartilhada
            </Typography>
          </Box>
        </Box>
      );
    }

    if (mediaType === 'contact') {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            mb: 1,
            bgcolor: 'grey.100',
            borderRadius: 1,
          }}
        >
          {iconMap.contact}
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {contactName || 'Contato'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cartão de contato
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          mb: 1,
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        {iconMap[mediaType]}
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {mediaFilename || `Arquivo ${mediaType}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {mediaType === 'document' ? 'Documento' : mediaType === 'audio' ? 'Áudio' : 'Vídeo'}
          </Typography>
        </Box>
      </Box>
    );
  };

  if (variant === 'bubble') {
    return (
      <Box sx={{ position: 'relative', maxWidth: 360 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: '#dcf8c6',
            borderRadius: '8px 8px 0 8px',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: -8,
              bottom: 0,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 0 8px 8px',
              borderColor: 'transparent transparent #dcf8c6 transparent',
            },
          }}
        >
          {renderMediaPreview()}

          {text && (
            <Box
              sx={{
                ...WHATSAPP_PREVIEW_STYLES.container,
                '& strong': WHATSAPP_PREVIEW_STYLES.strong,
                '& em': WHATSAPP_PREVIEW_STYLES.em,
                '& del': WHATSAPP_PREVIEW_STYLES.del,
                '& code.wa-mono': WHATSAPP_PREVIEW_STYLES.code,
                '& pre.wa-code-block': WHATSAPP_PREVIEW_STYLES.codeBlock,
                '& blockquote.wa-quote': WHATSAPP_PREVIEW_STYLES.quote,
                '& ul.wa-list': WHATSAPP_PREVIEW_STYLES.list,
                '& a.wa-link': WHATSAPP_PREVIEW_STYLES.link,
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}

          {!text && mediaType === 'text' && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              Nenhuma mensagem para visualizar
            </Typography>
          )}

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 0.5,
              color: 'rgba(0,0,0,0.45)',
              fontSize: '11px',
            }}
          >
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>

        {showCopyButton && text && (
          <Tooltip title={copied ? 'Copiado!' : 'Copiar texto'}>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Variant: card
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Preview da Mensagem
        </Typography>
        {showCopyButton && text && (
          <Tooltip title={copied ? 'Copiado!' : 'Copiar texto'}>
            <IconButton size="small" onClick={handleCopy}>
              {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {renderMediaPreview()}

      {text ? (
        <Box
          sx={{
            ...WHATSAPP_PREVIEW_STYLES.container,
            '& strong': WHATSAPP_PREVIEW_STYLES.strong,
            '& em': WHATSAPP_PREVIEW_STYLES.em,
            '& del': WHATSAPP_PREVIEW_STYLES.del,
            '& code.wa-mono': WHATSAPP_PREVIEW_STYLES.code,
            '& pre.wa-code-block': WHATSAPP_PREVIEW_STYLES.codeBlock,
            '& blockquote.wa-quote': WHATSAPP_PREVIEW_STYLES.quote,
            '& ul.wa-list': WHATSAPP_PREVIEW_STYLES.list,
            '& a.wa-link': WHATSAPP_PREVIEW_STYLES.link,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          Nenhuma mensagem para visualizar
        </Typography>
      )}
    </Paper>
  );
}
