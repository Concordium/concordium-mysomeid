import {
  TextField,
  Select,
} from 'src/components/ui';

export const renderTextField = (props) => {
  // console.log({props});
  const {
    label,
    input,
    meta: { touched, invalid, error },
    ...custom
  } = props;
  return <TextField
    label={label}
    placeholder={label}
    error={touched && invalid}
    helperText={touched && error}
    {...input}
    {...custom}
  />; 
};

export const renderSelect = (props) => {
  const {
    label,
    input,
    meta: { touched, invalid, error },
    ...custom
  } = props;

  return <Select
    label={label}
    placeholder={label}
    error={touched && invalid}
    helperText={touched && error}
    {...input}
    {...custom}
  />;  
};
