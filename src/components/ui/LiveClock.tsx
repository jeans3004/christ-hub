'use client';

import { Typography, SxProps, Theme } from '@mui/material';
import { useState, useEffect } from 'react';

interface LiveClockProps {
  format?: '12h' | '24h';
  showDate?: boolean;
  sx?: SxProps<Theme>;
}

export default function LiveClock({ format = '24h', showDate = false, sx }: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: format === '12h',
  });

  const dateStr = showDate
    ? now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <Typography variant="h3" sx={{ fontFamily: "'Roboto Mono', 'Consolas', monospace", fontVariantNumeric: 'tabular-nums', ...sx }}>
        {timeStr}
      </Typography>
      {dateStr && (
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, textTransform: 'capitalize' }}>
          {dateStr}
        </Typography>
      )}
    </>
  );
}
