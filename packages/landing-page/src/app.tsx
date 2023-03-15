import React, { useEffect } from 'react';
import {
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import AppHeader from './app-header';
import {HeroSection} from './hero-section';
import {YourKeysSection} from './your-keys-section'
import {HowItWorksSection} from './how-it-works-section';
import {PreventFraudSection} from './prevent-fraud-section';
import {Box} from '@mui/material';
import { Footer } from './footer';
import { useConfig } from './hooks';

const Article = ({}) => (
  <Box component="article">
    <HeroSection />
    <YourKeysSection />
    <HowItWorksSection />
    <PreventFraudSection />
    <Footer />
  </Box>
);

const NewLocation = ({comps}: {comps: string[]}) => {
  const {
    id
  } = useParams();
  useEffect(() => {
    if ( !id ) {
      console.error('Not a valid id : ' + id );
      return;
    }
    const config = useConfig();
    const url = `${config.dappBaseUrl}/${comps.join('/')}/${id}`;
    console.log("Redirecting to url: " + url);
    window.location.href = url;
  }, [id]);
  return null;
};

const Main = ({}) => (
  <>
    <AppHeader/>
    <Box component="main" sx={{
        flex: '1 1 0%',
      }}>
      <Article />
    </Box>
  </>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />

      {/*
        The following is a way to redirect to view a proof of https://mysome.id to the app.
        This is a temporary solution until a gateway or is set up to achieve the same thigns on 
        a lower level.

        Can be disabled when building by setting REACT_APP_NO_REDIRECT_TO_PROOF=1
      */}
      {!process.env.REACT_APP_NO_REDIRECT_TO_PROOF ?
        <Route path="/v/:id" element={<NewLocation comps={["v"]} />} /> : undefined}
      {!process.env.REACT_APP_NO_REDIRECT_TO_PROOF ?
        <Route path="/view/:id" element={<NewLocation comps={["v"]} />} /> : undefined}

      {/* This is a route to capture all remaining paths and show the Main page. */}
      <Route path="*" element={<Main />} />
    </Routes>
  );
}
