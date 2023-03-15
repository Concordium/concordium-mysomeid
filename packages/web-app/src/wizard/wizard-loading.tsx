import * as React from 'react';

import {
  Box,
  Typography,
} from "@mui/material";

import {
  LoadingIndicator
} from 'src/components';

export function WizardLoading({loading}: {loading: boolean}): JSX.Element {
  return <>
    {loading ?
      <Box {...{
        sx: {
            position: 'absolute',
            display: 'flex',
            alignSelf: 'center',
            justifySelf: 'center',
            placeSelf: 'center',
            flexDirection: 'column',
            placeContent: 'center',
          }
        }}>
        <LoadingIndicator />
        <Typography variant="subtitle1" align="center">Loading</Typography>
      </Box>
    :
    null}
  </>
}

