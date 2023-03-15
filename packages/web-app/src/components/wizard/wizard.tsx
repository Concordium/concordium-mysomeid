import "./wizard.scss";

import {
  Box,
  CircularProgress,
  Backdrop,
} from "@mui/material";

// import { Fade } from '@mui/material';
import { styled } from '@mui/material/styles';

const ModalBackdrop = styled(Backdrop, {
  name: 'daobuilder',
  slot: 'Backdrop',
  overridesResolver: (props, styles) => {
    return styles.backdrop;
  },
})({
  zIndex: 99999,
});

export function Wizard({}) {

  return (
    <ModalBackdrop
      sx={{ color: '#FFF', zIndex: 99999 }}
      open={!0}
      invisible={!1}
      onClick={() => {
        console.log("backlog clicked");
      }}
    >
      <CircularProgress color="inherit" />

      <Box sx={{
        bgcolor: 'background.paper',
        boxShadow: 1,
        borderRadius: 2,
        p: 2,
        minWidth: 300,
      }}>
        <Box sx={{ color: 'text.secondary' }}>Sessions</Box>
        <Box sx={{ color: 'text.primary', fontSize: 34, fontWeight: 'medium' }}>
          98.3 K
        </Box>
        <Box
          sx={{
            color: 'success.dark',
            display: 'inline',
            fontWeight: 'bold',
            mx: 0.5,
            fontSize: 14,
          }}
        >
          +18.77%
        </Box>
        <Box sx={{ color: 'text.secondary', display: 'inline', fontSize: 14 }}>
          vs. last week
        </Box>
      </Box>

    </ModalBackdrop>
  );
}
