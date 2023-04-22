import {
  SvgIcon,
  Select as _Select,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { defaultFontFamily } from "src/themes/theme";

export const InputCaption = ({label, helpText}) => {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '4px'
    }}>
      <Typography sx={{
        margin: '0px',
        fontFamily: defaultFontFamily,
        fontWeight: '400',
        letterSpacing: '0.009375rem',
        lineHeight: '143%',
        fontSize: '0.875rem',
        color: 'rgb(98, 103, 123)',
      }}>{label}</Typography>
      {helpText && helpText.length > 0 ?
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          marginLeft: '2px',
        }}>
          <Box sx={{
            display: 'inline-flex',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '16px',
            height: '16px',
          }}>
            <Button size="medium" sx={{
              display: 'flex',
              position: 'relative',
              boxSizing: 'border-box',
              backgroundColor: 'transparent',
              outline: '0',
              border: '0',
              margin: '0',
              padding: '0',
              cursor: 'pointer',
              userSelect: 'none',
              verticalAlign: 'middle',
              textAlign: 'center',
              flex: '0 0 auto',
              fontSize: '1.5rem',
              overflow: 'visible',
              color: '#8E92A',
              minWidth: '0',
              transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            }} style={{padding: '0 !important'}} >
              <SvgIcon sx={{
                userSelect: 'none',
                width: '1em',
                height: '1em',
                display: 'inline-block',
                fill: 'currentColor',
                flexShrink: '0',
                transition: 'fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                fontSize: '14px',
                color: '#A5A8B6',
                borderRadius: '50%',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </SvgIcon>
            </Button>
          </Box>
        </Box> : undefined}
    </Box>
  );
}
