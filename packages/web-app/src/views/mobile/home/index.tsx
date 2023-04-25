/*
import { useParams } from 'react-router-dom';
import { MobileOpenAppOrAppStore } from 'src/components/mobile-open-app-or-appstore';
import { useDevice } from 'src/hooks/use-device';
*/ 

export const MobileHomeView = ({}) => {
  /*
  const {
    id
  } = useParams();

  const {
    isMobile,
    androidDevice,
  } = useDevice();
  */

  // Since we go beta with no mobile app we will not redirect to app store.
  return null;

  // return <MobileOpenAppOrAppStore device={androidDevice ? 'Android' : 'iOS'} id={id} />
};

