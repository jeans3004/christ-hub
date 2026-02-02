'use client';

import { Avatar, SxProps, Theme } from '@mui/material';

interface ColoredAvatarProps {
  name: string;
  src?: string;
  size?: number;
  sx?: SxProps<Theme>;
}

const letterColors: Record<string, string> = {
  A: '#EF4444', B: '#F97316', C: '#F59E0B', D: '#EAB308',
  E: '#84CC16', F: '#22C55E', G: '#10B981', H: '#14B8A6',
  I: '#06B6D4', J: '#0EA5E9', K: '#3B82F6', L: '#6366F1',
  M: '#8B5CF6', N: '#A855F7', O: '#D946EF', P: '#EC4899',
  Q: '#F43F5E', R: '#E11D48', S: '#BE123C', T: '#9F1239',
  U: '#059669', V: '#0D9488', W: '#0891B2', X: '#0284C7',
  Y: '#4F46E5', Z: '#7C3AED',
};

function getColorForName(name: string): string {
  const initial = name.charAt(0).toUpperCase();
  return letterColors[initial] || '#6B7280';
}

export default function ColoredAvatar({ name, src, size = 40, sx }: ColoredAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const bgColor = getColorForName(name);

  return (
    <Avatar
      src={src}
      sx={{
        width: size,
        height: size,
        backgroundColor: src ? 'transparent' : bgColor,
        color: '#FFFFFF',
        fontSize: size * 0.4,
        fontWeight: 600,
        ...sx,
      }}
    >
      {!src && initial}
    </Avatar>
  );
}
