import React from 'react';
import { Box, Typography } from '@mui/material';
import { LoadingIndicator } from './loading-indicator';

export const WizardLoading = ({title, subtitle, color,}: {title: string, subtitle: string, color: string}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: 'calc(100% - 131px)',
      position: 'absolute',
      justifyContent: 'center',
    }}>
      <Box sx={{
        display: 'flex',
        color,
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0',
        fontFamily: 'ClearSans',
        width: '100%',
      }}>
        <Box sx={{
              width: '100%',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
        >
          <Typography variant="h5" sx={{fontFamily: 'ClearSans'}}>
            {title}
          </Typography>
          <Typography display="block" sx={{textAlign: 'center', fontFamily: 'ClearSans', lineHeight: '1.3', float: 'left'}}>
            {subtitle}
          </Typography>
          <br />
          <LoadingIndicator />
        </Box>
      </Box>
    </Box>

  );
}
