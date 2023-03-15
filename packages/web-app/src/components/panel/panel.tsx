import { Box } from '@mui/material';

import {PanelTitle} from '../panel-title/panel-title';

export const Panel = ({children, title, sx}: any) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        p: 3,
        m: 3,
        bgcolor: "background.paper",
        borderRadius: 4,
        ...(sx ?? {}),
      }}>
      {title ? <PanelTitle text={title} /> : undefined}
      {children}
    </Box>
  );
};
