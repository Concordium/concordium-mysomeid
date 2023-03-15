import { Box, useMediaQuery, useTheme } from "@mui/material";
import Paper from "@mui/material/Paper/Paper";
import { useParams } from "react-router-dom";
import { ViewContainer } from "src/components";
import { Navi } from "src/components/navi";
import { paperSX } from "src/themes";
import { ViewProof } from "./view-proof";

export const ViewMyProofView = ({}) => {
    const {
      id
    } = useParams();
  
    const theme = useTheme();
    // const ltsm = useMediaQuery(theme.breakpoints.down('sm'));
    const ltmd = useMediaQuery(theme.breakpoints.down('md'));
  
    return (
        <ViewContainer title={'Your Proof'}
            subtitle={<Navi path={[['Home', '/home'], ['Proof']]} />}
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
                    <ViewProof {...{id}} />
                </Box>
            </Paper>
        </ViewContainer>
    );
};