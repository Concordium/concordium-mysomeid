import { useEffect } from 'react';

import { Box, Typography } from '@mui/material';

/* import {
  useDevice     
} from 'src/hooks/use-device'; */

import {
  getUrlHandlerUrl,
  getAppStoreUrlForDevice,
} from 'src/constants';

export function MobileOpenAppOrAppStore ({device, id}: {device: 'Android' | 'iOS', id: string}) {
  const ts = new Date().getTime();
  const tolerence = 1250;
  useEffect(() => {
    window.location.href = getUrlHandlerUrl(device, 'view/' + id + '?id=' + id);
  }, [id]);

  useEffect(() => {
      const timeout = setTimeout( () => {
          const dt = new Date().getTime() - ts;
          if (dt > (2 * tolerence)) {
              // The app were installed.
              return;
          } else {
              // That was too fast so we can assume they don't have the app.
              window.open(getAppStoreUrlForDevice(device), "_blank");
          }
      }, tolerence);

      return () => {
          clearTimeout(timeout);
      };
  }, []);
  
  return (
    <Box sx={{
        position: 'fixed',
        display: 'flex',
        top: 0, left: 0, right: 0, bottom: 0,
        placeContent: 'center',
        alignItems: 'center',
        background: 'white'
    }}>
      <Box sx={{minHeight: '300px'}}>
          <Typography>
              Opening the mysome.id app
          </Typography>
      </Box>
    </Box>
  );
}
