import React, { Component, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { LoadingIndicator } from 'src/components';

export const WizardLoading = ({title, subtitle}: {title: string, subtitle: string}) => {
  return (
    <Box sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginLeft: '8px',
        marginRight: 'auto',
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
          <Typography variant="h5" sx={{fontWeight: 600}}>
            {title}
          </Typography>
          <Typography display="block" sx={{textAlign: 'center', lineHeight: '1.3', float: 'left'}}>
            {subtitle}
          </Typography>
          <br />
          <br />
          <LoadingIndicator />
        </Box>
      </Box>
    </Box>

  );
}
