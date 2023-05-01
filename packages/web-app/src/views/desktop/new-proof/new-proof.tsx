import { useCallback, useEffect, useState } from "react";
import HorizontalLinearStepper from "./horizontal-linear-stepper";
import {
  useNavigate,
  useParams,
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
import { useTemplateStore } from "./template-store";

const steps = () => [
  'Provide Info',
  'Connect ID',
  'Create Proof',
  'Finalize',
];

function Content({onSubmit, step, setGotoStep}) {  
  const {installed: browserExtInstalled} = useExtension();

  const pages = [
    Page1,
    Page2,
    Page3,
    Page4,
  ];

  const nPages = pages.length;
  const Page = pages[step];

  const nextPage = useCallback(() => {
    if ( step + 1 >= nPages ) throw new Error('Out of bounds');
    setGotoStep(step + 1);
  }, [step, nPages]);

  const previousPage = useCallback(() => {
    if ( step - 1 < 0 ) throw new Error('Out of bounds');
    setGotoStep(step - 1);
  }, [step, nPages]);

  if (!Page) {
    return null;
  }

  return <>
    <HorizontalLinearStepper {...{key: "stepper", steps: steps(), activeStep: step, style: {
      opacity: (!browserExtInstalled ? 0.3 : 1)
    }}} />
    <Box sx={{paddingTop: '24px'}}>
      <Page {...{
        nextPage: step >= nPages - 1 ? onSubmit : nextPage,
        previousPage: previousPage,
        ...(step >= nPages - 1 ? {handleSubmit: onSubmit} : {})
      }} />
    </Box>
  </>;
}

export function NewProof({}){
  const template = useTemplateStore();
  const navigate = useNavigate();
  const {
    step: _step,
  } = useParams();
  const step = Number.parseInt(_step ?? '1') - 1;

  const setGotoStep = useCallback((pageIndex: number) => {
    const pathname = `/create/${pageIndex + 1}`;
    const search = template.getSearchArgs();
    navigate({
      pathname,
      search,
    });
  }, [template]);

  return (
    <Box sx={{backgroundColor: 'white', paddingTop: '24px'}}>
      <Content {...{
        onSubmit: () => {},
        step,
        setGotoStep
      }} />
    </Box>
  );
} 
