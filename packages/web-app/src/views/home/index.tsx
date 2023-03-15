import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { ViewContainer } from 'src/components/view-container';
import {
    paperSX
} from 'src/themes/index';
import { MyProofs } from '../my-proofs/my-proofs';
  
export const HomeView = ({}) => {
    return (
        <ViewContainer title={'My Proofs'} subtitle="Your verified social media profiles" paperSX={{
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 130,
            paddingBottom: 0,
            padding: 0,
        }}>
        <Box sx={{display: 'flex', flexDirection: 'row'}}>
          <Paper elevation={2} sx={{...paperSX, marginLeft: 0}}>
            <MyProofs />
          </Paper>
        </Box>
      </ViewContainer>
    );
}
