import {
  Box,
  Typography,
  Tooltip,
  TooltipProps,
  tooltipClasses,
  Button,
} from "@mui/material";
import { styled } from "@mui/styles";
import {
  Field,
} from 'redux-form';
import HelpIcon from '@mui/icons-material/Help';
 
export const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow placement="top" classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    color: '#ffffff',
    maxWidth: 340,
    fontSize: '14px',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#000",
  },
}));

type WizardFieldData = {
  error?: string;
  flexGrow: any;
  labelTextHidden: any;
  labelText: any;
}

type WizardRowArgs = {
  sx?: any;
  name: string;
  desc: string;
  field?: any;
  fields?: WizardFieldData[];
  tooltip?: any;
};

export function WizardRow({sx, name, desc, field, fields, tooltip}: WizardRowArgs) {
  return (
    <Box id="wizard-row" sx={{display: 'flex', flexDirection: 'column', minHeight: '88px', ...(sx ?? {})}}>
      <Box sx={{display: 'flex', justifyContent: 'center'}}>

        <Box sx={{display: 'flex', flexBasis: 0, flexGrow: 1, flexDirection: 'column'}}>
          <Typography variant="h5" display="block" gutterBottom sx={{display: 'inline-flex', alignItems: 'center'}}>
            <strong>{name}</strong>
            {tooltip ?
              <HtmlTooltip
                title={tooltip}
              >
                <Box sx={{display: 'inline-flex', marginLeft: 0.5, marginTop: '-6px'}}>
                  <HelpIcon sx={{width: '0.6em', height: '0.6em'}}/>
                </Box>
              </HtmlTooltip>
            : undefined}
          </Typography>
          <Typography variant="inherit" display="block" gutterBottom>
            {desc}
          </Typography>
        </Box>

        <Box sx={{display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1}}>
          <Box sx={{display: 'flex', flexDirection: 'row'}}>
            {[...(field ? [field] : []), ...(fields ? fields : [])].map((fieldArgs, idx) => {
              const flexGrow = fieldArgs.flexGrow ?? 1; 
              if ( fieldArgs.flexGrow !== undefined ) {
                delete fieldArgs.flexGrow;
              }
              return (
                <Box key={`wizard-row-${idx}`} sx={{display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow, marginRight: '8px'}}>
                  <label style={{
                    ...(fieldArgs.labelTextHidden ? {visibility: 'hidden'} : {})
                  }}>{fieldArgs.labelText}</label> 
                  <Field {...fieldArgs} />
                  {fieldArgs.error ? <Box sx={{
                    color: 'red',
                    fontSize: '12px',
                  }}>
                    {fieldArgs.error}
                  </Box> : undefined}
                </Box>
              );
            })}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

