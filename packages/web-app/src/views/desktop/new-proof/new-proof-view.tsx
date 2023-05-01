import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Navi } from 'src/components/navi';
import { ViewContainer } from 'src/components/view-container';
import {
  paperSX
} from 'src/themes/index';
import { NewProof } from '../new-proof/new-proof';
import { TemplateStoreContextProvider } from './template-store';
  
export const NewProofView = ({}) => {
  const theme = useTheme();
  // const ltsm = useMediaQuery(theme.breakpoints.down('sm'));
  const ltmd = useMediaQuery(theme.breakpoints.down('md'));
  return (
    <ViewContainer
      title={'Create Proof'}
      subtitle={<Navi path={[['Home', '/home'], ['Create Proof']]} />}
      paperSX={{
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        padding: 0,
      }}
    >
      <Paper elevation={2} sx={{...paperSX, marginLeft: 0}}>
        <Box sx={{padding: !ltmd ? 1 : 0, display: 'flex', flexDirection: 'column'}}>
          <TemplateStoreContextProvider>
            <NewProof />
          </TemplateStoreContextProvider>
        </Box>
      </Paper>
    </ViewContainer>
  );
}
