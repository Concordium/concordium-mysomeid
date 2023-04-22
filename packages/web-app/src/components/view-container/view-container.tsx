import {
  ReactNode,
} from "react";

import {
  Box,
  Paper,
  Typography,
  Container,
} from "@mui/material";

import {
  staticHeaderBg 
} from 'src/themes/theme';

const containerSx = theme => ({
  flex: 1,
  flexDirection: 'column',
  display: 'flex',
  [theme.breakpoints.up(0)]: {
    paddingLeft: '20px',
    paddingRight: '20px',
  },
  [theme.breakpoints.up(640)]: {
    paddingLeft: '20px',
    paddingRight: '20px',
  },
  [theme.breakpoints.up(760)]: {
    paddingLeft: '48px',
    paddingRight: '48px',
  },
  [theme.breakpoints.up(960)]: {
    paddingLeft: '96px',
    paddingRight: '96px',
  },
  [theme.breakpoints.up(1280)]: {
    paddingLeft: '20px',
    paddingRight: '20px',
  },
  [theme.breakpoints.up(1440)]: {
    maxWidth: '1440px',
    paddingLeft: '96px',
    paddingRight: '96px',
  },          
});

export const ViewContainer = ({title, children, subtitle, sx, paperSX}: {title: string, subtitle?: string | ReactNode, sx?: any, paperSX?: any, children: ReactNode}) => (<>
  <Box id="view-container" sx={theme => ({
    background: staticHeaderBg,
    color: 'white',
    paddingTop: '130px',
    [theme.breakpoints.up(0)]: {
      paddingTop: '130px',
      paddingBottom: '72px',
      minHeight: '200px',
    },
    [theme.breakpoints.up(960)]: {
      paddingTop: '130px',
      paddingBottom: '80px',
      minHeight: '200px',
    },
    [theme.breakpoints.up(1280)]: {
      paddingBottom: '94px',
      minHeight: '200px',
    },
    [theme.breakpoints.up(1440)]: {
      paddingBottom: '92px',
      minHeight: '200px',
    },
  })}>
    <Container id="view-container-container" sx={containerSx}>
      <Box id="view-container-box">
        <Typography variant="h1" sx={{fontWeight: 400,}}>{title}</Typography>
        {subtitle ?
          <Typography variant="subtitle1" sx={theme => ({
            display: 'none',
            marginTop: '6px',
            fontWeight: 400,
            [theme.breakpoints.up(960)]: {
              display: 'initial',
            },
          })}>{subtitle}</Typography>
          :
          undefined}
      </Box>
    </Container>
  </Box>
  
  <Box sx={theme => ({
    flex: 1,
    flexDirection: 'column',
    display: 'flex',
    [theme.breakpoints.up(0)]: {
      marginTop: '-64px',
    },
    [theme.breakpoints.up(600)]: {
      marginTop: '-64px',
    },
    [theme.breakpoints.up(640)]: {
      marginTop: '-64px',
    },
    [theme.breakpoints.up(960)]: {
      marginTop: '-74px',
    },
    [theme.breakpoints.up(1280)]: {
      marginTop: '-64px',
    },
    [theme.breakpoints.up(1440)]: {
      marginTop: '-58px',
    },
  })}>
    <Container sx={containerSx}>
      {children}
    </Container>
  </Box></>
);

