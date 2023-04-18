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
  Box,
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
} from './views/view-proof/view-proof-mobile';
import {
  HomeView
} from 'src/views/home';
import {
  NewProofView
} from 'src/views/new-proof';
import {
  MobileHomeView
} from 'src/views/mobile-home';
import {
  ViewProofView,
  ViewMyProofView,
} from 'src/views/view-proof';

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

  return !isMobile ? (
    <>
      {/* HACK: To make the overflow background match the top and bottom of the page when overscrolling */}
      <div style={{background: 'linear-gradient(0deg, rgb(255 255 255) 0%, rgb(255 255 255) 49%, rgba(29,32,64,1) 50%, rgba(29,32,64,1) 100%)', position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1}} />
      <Messages />
      <Box component="div" sx={{flex: 1}}>
        <AppHeader {...{isConnected, isInstalled: installed, onToggleConnect}}/>
        <Routes>
          <Route path="/home" element={<>
            <HomeView />
          </>} />
          <Route path="/create" element={<Navigate to="/create/1" />} />
          <Route path="/create/*" element={
            <NewProofView />
          } />
          <Route path="/view/:id" element={<ViewProofView/>} />
          <Route path="/v/:id" element={<ViewProofView/>} />
          <Route path="/my-proof/:id" element={<ViewMyProofView/>} />          
          <Route path="*" element={<Navigate to="/home"/>} />
        </Routes>
      </Box>
    </>
  ) : ( // Mobile 
    <>
      {/* HACK: To make the overflow background match the top and bottom of the page when overscrolling */}
      <div style={{background: 'linear-gradient(0deg, rgb(255 255 255) 0%, rgb(255 255 255) 49%, rgba(29,32,64,1) 50%, rgba(29,32,64,1) 100%)', position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1}} />
      <Messages />
      <Box component="div" sx={{flex: 1}}>
        {/*<AppHeader {...{isConnected, onToggleConnect}}/>*/}
        <Routes>
          <Route path="/home" element={<>
            <MobileHomeView />
          </>} />
          <Route path="/view/:id" element={<MobileViewProofView/>} />
          <Route path="/v/:id" element={<MobileViewProofView/>} />          
          <Route path="*" element={<Navigate to="/home"/>} />
        </Routes>
      </Box>
    </>
  );
}

export default App;
