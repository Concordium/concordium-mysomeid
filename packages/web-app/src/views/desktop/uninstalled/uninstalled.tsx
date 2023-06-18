import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PrimaryButton } from 'src/components';
import { ViewContainer } from 'src/components/view-container';
import {
    paperSX
} from 'src/themes/index';
import {
    useAnalytics
} from 'src/hooks/use-analytics';

export const UninstalledView = () => {
    const analytics = useAnalytics();
    const [searchArgs] = useSearchParams();
    const newUid = searchArgs.get('uid') ?? '';
    const [uid, setUid] = useState(newUid ?? '');
    const [notified, setNotified] = useState(false);

    useEffect(() => {
        if ( uid !== newUid && newUid ) {
            setUid(newUid);
            analytics.setUniqueId(newUid);
        }
    }, [uid, newUid]);

    useEffect(() => {
        if ( notified || !uid ) {
            return;
        }
        analytics.track({t: 'uninstalled'});
        setNotified(true);
    }, [notified, uid]);

    return (
        <ViewContainer title="" subtitle="" paperSX={{
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 130,
            paddingBottom: 0,
            padding: 0,
        }}>
        <Box sx={{display: 'flex', flexDirection: 'row'}}>
          <Paper elevation={2} sx={{...paperSX, marginLeft: 0, textAlign: 'center'}}>
            <Typography variant="h3" gutterBottom={true} sx={{marginTop: '32px'}}>
                Thank you for using mysome.id
            </Typography>
            <Typography variant="body1" gutterBottom={true}>
                We are sorry to see you go and we would kindly ask if you would spend a minute or two to give us feedback on how
                we can improve our service.
            </Typography>

            <PrimaryButton sx={{
                borderRadius: '100px',
                fontSize: '18px !important',
                fontWeight: '500 !important',
                padding: '22px !important',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: '32px',
                marginBottom: '32px',
            }} onClick={() => {
                analytics.track({t: 'click-tell-improve'});
                window.open(process.env.REACT_APP_UNINSTALL_SURVEY ?? 'https://j0nt81fw3f5.typeform.com/to/FgIQWsTt', '_self');
            }} >
                Tell us how to improve
            </PrimaryButton>
                
          </Paper>
        </Box>
      </ViewContainer>
    );    
};

