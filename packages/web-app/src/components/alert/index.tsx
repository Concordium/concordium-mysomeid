import { Box, Typography } from "@mui/material";

type AlertArgs = {
    children: any;
    sx?: any;
};

export const ErrorAlert = ({children, sx}: AlertArgs) => {
    return (
        <Box sx={{
            width: '100%',
            background: 'red',
            display: 'flex',
            padding: '16px',
            alignCenter: 'auto',
            borderRadius: '16px',
            ...(sx ?? {}),
        }}>
            <Typography sx={{ width: '100%', fontSize: '16px', lineHeight: '18px', textAlign: 'center', color: 'white' }}>
                <strong>{children}</strong>
            </Typography>
        </Box>
    );
};

export const MessageAlert = ({children, sx}: AlertArgs) => {
    return (
        <Box sx={{
            width: '100%',
            background: 'green',
            maxWidth: '830px', 
            display: 'flex',
            padding: '16px',
            alignCenter: 'auto',
            borderRadius: '16px',
            ...(sx ?? {}),
        }}>
            <Typography sx={{ width: '100%', fontSize: '16px', lineHeight: '18px', textAlign: 'center', color: 'white' }}>
                <strong>{children}</strong>
            </Typography>
        </Box>
    );
};