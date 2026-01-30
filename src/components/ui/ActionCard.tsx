'use client';

import { Box, Card, CardActionArea, Typography, SxProps, Theme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ReactElement } from 'react';
import IconCircle from './IconCircle';

interface ActionCardProps {
  title: string;
  description?: string;
  icon: ReactElement;
  href?: string;
  onClick?: () => void;
  iconColor?: string;
  sx?: SxProps<Theme>;
}

export default function ActionCard({
  title,
  description,
  icon,
  href,
  onClick,
  iconColor,
  sx,
}: ActionCardProps) {
  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
      }}
    >
      <IconCircle icon={icon} color={iconColor} size="md" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          sx={{ fontWeight: 600, lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {description}
          </Typography>
        )}
      </Box>
      <ArrowForwardIcon
        sx={{
          fontSize: 18,
          color: 'text.secondary',
          flexShrink: 0,
          transition: 'transform 0.15s ease',
        }}
      />
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        '& .MuiCardActionArea-root:hover .MuiSvgIcon-root:last-of-type': {
          transform: 'translateX(3px)',
        },
        ...sx,
      }}
    >
      <CardActionArea
        {...(href ? { href } : {})}
        onClick={onClick}
        sx={{ borderRadius: 'inherit' }}
      >
        {content}
      </CardActionArea>
    </Card>
  );
}
