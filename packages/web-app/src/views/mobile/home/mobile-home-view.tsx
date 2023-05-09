import { useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import { MobileHeader } from "../view-proof/mobile-header";
import { AspectBox } from "src/views/desktop/new-proof/aspect-box";
import HomeShieldPng from './home-shield.png';

export const MobileHomeView = ({ }) => {
  const [w, setWidth] = useState(0);
  const background = 'linear-gradient(130deg, rgba(23,87,222,1) 0%, rgba(31,164,254,1) 31%, rgba(43,173,255,1) 70%, rgba(119,208,255,1) 100%)';
  const boxShadow = '0px -2px 60px -1px rgba(0,0,0,0.43)';

  const onWidth = useCallback((w: number) => {
    setWidth(w);
  }, []);

  return (
    <Box sx={{}}>
      <AspectBox id="background-panel" aspect={1.25} sx={{
        background: 'rgb(45, 155, 240)',
        width: '100%',
      }} onWidth={onWidth}>
        <MobileHeader />
      </AspectBox>

      {/* Proof Panel */}
      <Box sx={{ width: '100%', display: 'flex', placeContent: 'center', marginTop: `-${Math.abs(Math.round(w))}px` }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '-24px' }}>

          <Box display="flex" flexDirection="column" alignItems="center" sx={{ minHeight: '67vh', color: 'white', background: 'white', boxShadow, borderRadius: '32px', textAlign: 'center', margin: '32px', marginTop: '0px', padding: '16px' }} >

            <Box sx={{
              background: `url(${HomeShieldPng})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              width: `${200 / 2}px`,
              height: `${247 / 2}px`,
              marginLeft: '11px',
              marginTop: '40px',
            }} />

            <Typography display="block" sx={{ fontSize: '18px', color: 'black', margin: '24px 16px 0px 16px', fontWeight: 400, lineHeight: '1.3', float: 'left' }}>
            Sorry, as of right now, it is only possible to use mysome.id for verifying profiles on a PC with a Chromium browser installed.<br/>
(ie. Chrome, Opera, Brave or Edge)
            </Typography>
          </Box>



        </Box>
      </Box>
    </Box>
  );
};

