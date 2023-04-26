import React, { useCallback, useEffect, useState } from "react";
import HorizontalLinearStepper from "./horizontal-linear-stepper";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Box
} from '@mui/material';

import {
  useExtension
} from 'src/hooks/use-extension';

import Page1 from './page-1';
import Page2 from './page-2';
import Page3 from './page-3';
import Page4 from './page-4';

import {
  useSearchParams
} from "src/hooks/use-search-params";
import { toBuffer } from "@concordium/web-sdk";

const steps = (template: string) => [
  'Provide Info',
  'Connect ID',
  'Create Proof',
  'Finalize',
];

function Content({templateData, onSubmit, step, setGotoStep}) {
  const nextPage = () => {
    // console.log('next step');
    if ( step + 1 >= nPages ) throw new Error('Out of bounds');
    setGotoStep(step + 1);
  };

  const previousPage = () => {
    // console.log('prev step');
    if ( step - 1 < 0 ) throw new Error('Out of bounds');
    setGotoStep(step - 1);
  };

  const pages = [
    Page1,
    Page2,
    Page3,
    Page4,
  ];

  const nPages = pages.length;
  const Page = pages[step];

  if (!Page) {
    return null;
  }

  const params = useSearchParams();
  const [template, setTemplate] = useState<any>(null);

  // Capture the template argument if present in arguments.
  useEffect(() => {
    if ( !params ) {
      return;
    }
    try {
      const base64Template = decodeURIComponent(params.get("template"));
      const stringTemplate = toBuffer(base64Template, 'base64').toString('utf8');
      const obj = params.get("template") ? JSON.parse(stringTemplate) : null;
      if ( obj ) {
        setTemplate(obj);
      } else {
        console.error("Failed to decode template");
      }
    } catch(e) {
      console.error("Failed to decode template", e);
      setTemplate(null);
    }
  }, [params]);

  const {installed: browserExtInstalled} = useExtension();

  return <>
    <HorizontalLinearStepper {...{key: "stepper", steps: steps(template), activeStep: step, style: {
      opacity: (!browserExtInstalled ? 0.3 : 1)
    }}} />
    <Box sx={{paddingTop: '24px'}}>
      <Page {...{
        template,
        nextPage: step >= nPages - 1 ? onSubmit : nextPage,
        previousPage: previousPage,
        ...(step >= nPages - 1 ? {handleSubmit: onSubmit} : {})
      }} />
    </Box>
  </>;
}

export function NewProof({}){
  const params = useSearchParams();
  const template = (params.has('template') ? params.get('template') ?? '' : '').trim();
  const location = useLocation();
  const navigate = useNavigate();

  const step = (Number.parseInt(location.pathname.split('/').pop()) ?? 0) - 1;

  const setGotoStep = useCallback((pageIndex) => {
    let url = '/create/' + (pageIndex + 1);
    if ( template && template.length > 0 ) {
      url += `?template=${template}`;
    }
    navigate(url);
  }, [template]);

  return (
    <Box sx={{backgroundColor: 'white', paddingTop: '24px'}}>
      <Content {...{onSubmit: () => {}, templateData: template, step, setGotoStep}} />
    </Box>
  );
} 
