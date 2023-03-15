import * as React from 'react';
import {
  Box,
} from '@mui/material';
import {
  useConfig
} from './hooks/use-config';

export const SectionBackground = ({bg}: {bg?: 'dark' | 'light'}) => {
  const config = useConfig();
  return (
  <Box id="section-background" sx={{
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
  }}>  
    <Box sx={{
      background: !bg || bg === 'light' ?
        'linear-gradient(0deg, rgba(231,229,229,1) 0%, rgba(255,255,255,1) 64%, rgba(255,255,255,1) 100%)' :
        "linear-gradient(0deg, rgba(31,35,72,1) 0%, rgba(31,35,72,1) 64%, rgba(28,32,66,1) 100%)",
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }}/>
  </Box>);
}
