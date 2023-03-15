import FormControl from '@mui/material/FormControl';

import {
  DesktopDatePicker
} from '@mui/x-date-pickers/DesktopDatePicker';

import {
  LocalizationProvider
} from '@mui/x-date-pickers/LocalizationProvider';

import {
  AdapterDateFns
} from '@mui/x-date-pickers/AdapterDateFns';

import {
  Box,
  MenuItem,
} from "@mui/material";
 
import {
  TextField,
  TertiaryButton,
  PrimaryButton,
  Select,
} from 'src/components';

import MUITextField from '@mui/material/TextField';

export const renderButtonField = ({
  label,
  labelText,
  buttonText,
  buttonEnabled,
  input,
  meta,
  ...custom
}) => {
  const { touched, invalid, error }  = meta;
  const Component = !!input.value ? PrimaryButton : TertiaryButton;
  const h = '46px';
  return <Component sx={{
              marginTop: '4px',
              height: h,
              minHeight: h,
               ...(custom?.sx ?? {}),
            }}
            onClick={custom.onClick}
            children={<>{buttonText}</>}
          />;
}

export const renderStaticTextField = ({
  label,
  input,
  meta,
  ...custom
}) => {
  const { touched, invalid, error }  = meta;
  // debugger;
  return (
    <>
      <TextField
        label={label}
        // placeholder={label}
        error={touched && invalid}
        sx={{
          color: '#8a8d9a',
        }}
        helpText={error}
        type="text"
        readOnly={true}
        value={custom.static}
        decorate={custom.decorate}
      />
    </>
  );
}

export const renderTextField = ({
  label,
  input,
  meta: { touched, invalid, error },
  ...custom
}) => {
  return <TextField
    label={label}
    placeholder={label}
    error={touched && invalid}
    errorText={custom.errorText}
    {...input}
    {...custom}
  />;
};

export const renderSelect = ({
  label,
  input,
  meta: { touched, invalid, error },
  ...custom
}) => {
  //console.log('select input ', input);
  //console.log('select custom ', custom);
  return <Select {...{
            label,
            error: touched && invalid,
            helpText: touched && error,
            items: undefined,
            disabled: false,
            ...input,
            ...custom,
            children: custom.options.map(x => <MenuItem {...{
                                                key: `select-${custom.name}-${x.value}`,
                                                value: x.value,
                                                children: x.label
                                              }}/>),
          }}/>
};


// title, defaultValue, value, disabled, onChange, onValue, children
export const renderDateSelect = ({
  label,
  input,
  meta: { touched, invalid, error },
  ...custom
}) => {
  function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
  }
  function formatDate(date: Date) {
    const rv = [
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
      date.getFullYear(),
    ].join('/');
    console.log("format", rv);
    return rv;
  }
  const titleToId = (title: string, type: string) => {
    if ( !title ) {
      title = 'undefined';
    }
    while ( title.indexOf(' ') >= 0 ) {
      title = title.replace(' ', '-');
    }
    return "settings-" + title.toLowerCase() + '-' + type.toLowerCase();
  };

  return (
    <FormControl variant="standard" >
      <Box id="container" sx={{display: 'flex', flexDirection: 'row', marginTop: '4px', width: '100%'}}>
        <LocalizationProvider id="localization" dateAdapter={AdapterDateFns} sx={{width: '100%'}}>
          <DesktopDatePicker {...{
            id: titleToId(label, 'date-picker'),
            inputFormat: "MM/dd/yyyy",
            renderInput: (params) => <MUITextField {...{...params, sx: {...(params?.sx ?? {}), width: '100%'}}} />,
            ...input,
            ...custom,
          }}/>
        </LocalizationProvider>
        {custom?.children ? <Box sx={{display: 'flex', flexDirection: 'row', marginTop: '56px', marginLeft: '8px'}}>
          {custom?.children}
        </Box> : undefined}
      </Box>
    </FormControl>
  );
};