// import { useMediaQuery, useTheme } from '@mui/material';
// import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';
import { MobileOpenAppOrAppStore } from 'src/components/mobile-open-app-or-appstore';
import { useDevice } from 'src/hooks/use-device';
  
export const MobileHomeView = ({}) => {
  const {
    id
  } = useParams();

  const {
    isMobile,
    androidDevice,
    // iOSDevice,
  } = useDevice();

  return <MobileOpenAppOrAppStore device={androidDevice ? 'Android' : 'iOS'} id={id} />
};

