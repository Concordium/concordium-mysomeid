import {
    Box,
    Typography
} from '@mui/material';
// import MySoMeIDLogo1 from 'src/images/logo-white.svg';
import MobileLogo from './mobile-logo.png';

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
                marginTop: '72px',
            }}>
                <Box id="logo" sx={{
                    width: '173px',
                    height: '58px',
                    backgroundSize: 'contain !important',
                    backgroundRepeat: 'no-repeat !important',
                    background: `url(${MobileLogo})`,
                    marginRight: '4px',
                }} />
            </Box>
        </Box>
    );
};
