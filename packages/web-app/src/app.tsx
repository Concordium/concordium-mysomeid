import {default as pkg} from "../package.json";
import "./style.scss";
import {
  useCallback,
} from "react";
import {
  Route,
  Navigate,
  Routes,
} from "react-router-dom";
import {
  Box, Typography,
} from "@mui/material";
import {
  Messages,
  AppHeader,
} from "src/components";
import {
  useCCDContext
} from 'src/hooks';
import {
  useDevice
} from "./hooks/use-device";
import {
  MobileViewProofView
} from './views/mobile/view-proof/view-proof-mobile';
import {
  HomeView
} from 'src/views/desktop/home';
import {
  NewProofView
} from 'src/views/desktop/new-proof';
import {
  MobileHomeView
} from 'src/views/mobile/home';
import {
  ViewProofView,
  ViewMyProofView,
} from 'src/views/desktop/view-proof';
import {
  staticBg,
} from 'src/themes/theme';

function App() {
  const {
    isConnected,
    installed,
    connect,
    disconnect,
  } = useCCDContext();

  const {
    isMobile,
  } = useDevice();

  const onToggleConnect = useCallback(() => {
    if ( isConnected ) {
      disconnect();
    } else {
      connect();
    }
  }, []);

  return (
    <>
      <Messages />
      <Typography sx={{position: 'fixed', left: '8px', bottom: '6px', textAlign: 'left', fontSize: '9px', fontFamily: 'sans-serif', color: '#777777', userSelect: 'none'}}>{pkg.version}</Typography>
      <Box component="div" sx={{flex: 1}}>
      {!isMobile ?
        <>
          <AppHeader {...{isConnected, isInstalled: installed, onToggleConnect}}/>
          <Routes>
            <Route path="/home" element={<>
              <HomeView />
            </>} />
            <Route path="/create" element={<Navigate to="/create/1" />} />
            <Route path="/create/*" element={
              <NewProofView />
            } />
            <Route path="/view/:id/:decryptionKey" element={<ViewProofView/>} />
            <Route path="/v/:id/:decryptionKey" element={<ViewProofView/>} />
            <Route path="/my-proof/:id/:decryptionKey" element={<ViewMyProofView/>} />          
            <Route path="*" element={<Navigate to="/home"/>} />
          </Routes>
        </> :
        <Routes>
          <Route path="/home" element={<MobileHomeView />} />
          <Route path="/view/:id/:decryptionKey" element={<MobileViewProofView/>} />
          <Route path="/v/:id/:decryptionKey" element={<MobileViewProofView/>} />          
          <Route path="*" element={<Navigate to="/home"/>} />
        </Routes>
      }
      </Box>
    </>
  );
}

export default App;
