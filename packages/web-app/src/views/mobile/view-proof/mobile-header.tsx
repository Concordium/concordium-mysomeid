import {
    Box,
    Typography
} from '@mui/material';
import MySoMeIDLogo1 from 'src/images/logo-white.svg';

export const MobileHeader = ({ }) => {

    return (
        <Box sx={{
            width: '100%',
            height: '0px',
            maxHeight: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '134px',
            }}>
                <Box id="logo" sx={{
                    width: '48px',
                    height: '48px',
                    backgroundSize: 'contain !important',
                    backgroundRepeat: 'no-repeat !important',
                    background: `url(${MySoMeIDLogo1})`,
                    letterSpacing: '2.1px',
                    marginRight: '4px',
                }} />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginLeft: '4px',
                }}>
                    <Typography component="h2" sx={{
                        color: 'white',
                        fontSize: '28px',
                        fontWeight: 400,
                        textAlign: 'center',
                    }}>
                        mysome.id
                    </Typography>
                    <Typography component="p" sx={{
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 400,
                        textAlign: 'center',
                    }}>
                        Powered by Concordium
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
