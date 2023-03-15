// import { Box } from '@mui/material';

export const PanelTitle = ({text, children}: any) => {
  const title = text ?? children ?? 'undefined';
  return (
    <>
      <h1 >{title}</h1>
      <br />
    </>
  );
};
