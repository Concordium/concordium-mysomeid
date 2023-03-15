import {
  ReactNode,
} from "react";

import {
  Box,
  Paper,
  Typography,
  Container,
} from "@mui/material";

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
    maxWidth: 'unset',
    paddingLeft: '96px',
    paddingRight: '96px',
  },          
});

export const ViewContainer = ({title, children, subtitle, sx, paperSX}: {title: string, subtitle?: string | ReactNode, sx?: any, paperSX?: any, children: ReactNode}) => (<>
  <Box id="view-container" sx={theme => ({
    background: 'linear-gradient(0deg, rgba(21,23,51,1) 0%, rgba(31,35,72,1) 64%, rgba(28,32,66,1) 100%)',
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

/*export const ViewContainerSmaller = ({title, children, subtitle, paperSX}: {title: string, subtitle?: string, paperSX?: any, children: ReactNode}) => (<>
  <Box sx={theme => ({
    color: 'rgb(48,53,73)',
    [theme.breakpoints.up(0)]: {
      paddingTop: '40px',
      paddingBottom: '72px',
      minHeight: '200px',
    },
    [theme.breakpoints.up(960)]: {
      paddingTop: '48px',
      paddingBottom: '75px',
      minHeight: '200px',
    },
    [theme.breakpoints.up(1280)]: {
      paddingBottom: '75px',
      minHeight: '200px',
    },
    [theme.breakpoints.up(1440)]: {
      paddingBottom: '75px',
      minHeight: '200px',
    },
  })}>
    <Container sx={containerSx}>
      <Box>
        <Typography variant="h1">{title}</Typography>
        {subtitle ?
          <Typography variant="subtitle1" sx={theme => ({
            display: 'none',
            marginTop: '6px',
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
      marginTop: '-100px',
    },
    [theme.breakpoints.up(600)]: {
      marginTop: '-84px',
    },
    [theme.breakpoints.up(640)]: {
      marginTop: '-84px',
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
      <Paper elevation={2} sx={theme => ({
        color: '#303549',
        backgroundColor: '#FFFFFF',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        marginBottom: '4px',
        paddingBottom: '16px',
        paddingLeft: '32px',
        paddingRight: '32px',
        paddingTop: '16px',
        [theme.breakpoints.up(0)]: {
          //  minHeight: '200px',
        },
        [theme.breakpoints.up(640)]: {
          // minHeight: '220px',
        },
        [theme.breakpoints.up(1280)]: {
          // minHeight: '248px',
        },
        [theme.breakpoints.up(1440)]: {
          // minHeight: '294px',
        },
        ...(paperSX ?? {}),
      })}>
        {children}
      </Paper>
    </Container>
  </Box></>
);*/
