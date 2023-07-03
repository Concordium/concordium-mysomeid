import { Box, useMediaQuery, useTheme } from "@mui/material";
import Paper from "@mui/material/Paper/Paper";
import { useParams } from "react-router-dom";
import { ViewContainer } from "src/components";
import { Navi } from "src/components/navi";
import { paperSX } from "src/themes";
import { ViewProof } from "./view-proof";
import { useAnalytics } from "src/hooks/use-analytics";
import { useEffect } from "react";

export const ViewMyProofView = ({ }) => {
    const {
        id,
        decryptionKey: decryptionKeyEncoded
    } = useParams();

    const decryptionKey = decryptionKeyEncoded !== 'null' ? decodeURIComponent(decryptionKeyEncoded) : null;

    const theme = useTheme();
    // const ltsm = useMediaQuery(theme.breakpoints.down('sm'));
    const ltmd = useMediaQuery(theme.breakpoints.down('md'));

    const analytics = useAnalytics();

    useEffect(() => {
      analytics.track({t: 'view-my-proof-desktop'});
    }, []);
  
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
            <Paper elevation={2} sx={{ ...paperSX, marginLeft: 0 }}>
                <Box sx={{ padding: !ltmd ? 1 : 0, display: 'flex', flexDirection: 'column' }}>
                    <ViewProof {...{ id, decryptionKey }} />
                </Box>
            </Paper>
        </ViewContainer>
    );
};