import React from "react";

export function useDevice() {
  const [isMobile, setMobile] = React.useState<boolean | null>(null);
  const [androidDevice, setAndroidDevice] = React.useState<boolean | null>(null);
  const [iOSDevice, setIOSDevice] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobile = !!userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i);
    const ios = !!userAgent.match(/iPhone|iPad|iPod/i);
    const android = !!userAgent.match(/Android/i);
    // console.log({userAgent});
    setMobile(mobile);
    setIOSDevice(ios);
    setAndroidDevice(android);

    if ( process.env.REACT_APP_FORCE_IOS ) {
      setMobile(true);
      setIOSDevice(true);
      setAndroidDevice(false);
    }
  }, []);

  return {
    isMobile,
    androidDevice,
    iOSDevice
  };
}
