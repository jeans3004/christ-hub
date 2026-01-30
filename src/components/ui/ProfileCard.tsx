'use client';

import { Avatar, Box, Card, CardContent, Typography, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

interface DetailItem {
  label: string;
  value: ReactNode;
}

interface ProfileCardProps {
  name: string;
  role?: string;
  email?: string;
  avatarUrl?: string;
  details?: DetailItem[];
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function ProfileCard({
  name,
  role,
  email,
  avatarUrl,
  details,
  children,
  sx,
}: ProfileCardProps) {
  return (
    <Card elevation={0} sx={sx}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 3 }}>
        <Avatar
          src={avatarUrl}
          alt={name}
          sx={{ width: 72, height: 72, mb: 2, fontSize: '1.5rem' }}
        >
          {getInitials(name)}
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        {role && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {role}
          </Typography>
        )}
        {email && (
          <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {email}
          </Typography>
        )}

        {details && details.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              width: '100%',
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {details.map((d, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {d.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {d.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {children}
      </CardContent>
    </Card>
  );
}
