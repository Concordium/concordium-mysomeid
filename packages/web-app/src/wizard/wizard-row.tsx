import {
  Button,
  Panel,
  PanelTitle,
  Summary,
  PrimaryButton,
  Modal,
  Select,
} from 'src/components';

import {
  Box,
  Typography,
  MenuItem,
} from "@mui/material";

import {
  Field,
} from 'redux-form';
 
type WizardRowArgs = {
  sx?: any;
  name: string;
  desc: string;
  field?: any;
  fields?: any[];
};

export function WizardRow({sx, name, desc, field, fields}: WizardRowArgs) {
  return (
    <Box sx={{display: 'flex', flexDirection: 'column', ...(sx ?? {})}}>
      <Box sx={{display: 'flex', justifyContent: 'center'}}>

        <Box sx={{display: 'flex', flexBasis: 0, flexGrow: 1, flexDirection: 'column'}}>
          <Typography variant="h5" display="block" gutterBottom><strong>{name}</strong></Typography>
          <Typography variant="inherit" display="block" gutterBottom>{desc}</Typography>
        </Box>


        <Box sx={{display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1}}>
          <Box sx={{display: 'flex', flexDirection: 'row'}}>
            {field ? <Box sx={{display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1, marginRight: '8px'}}>
                <label style={{
                  ...(field.labelTextHidden ? {visibility: 'hidden'} : {})
                }}>{field.labelText}</label> 
                <Field {...field} />
              </Box> : undefined}

            {fields?.map((fieldArgs, idx) => {
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
                </Box>
              );
            })}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

