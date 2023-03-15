const validate = values => {
  const errors = {} as any;
  if (!values.name) {
    errors.name = 'Required';
  }
  /*if (!values.lastName) {
    errors.lastName = 'Required';
  }*/
  /*if (!values.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }*/
  if (!values.template) {
    errors.template = 'Required: Chose/click a template';
  }

  if(!values.tokenName){
    errors.tokenName = 'Required';
  } else if(!/^[a-z0-9\s]+$/i.test(values.tokenName)){
    errors.tokenName = 'Only alphanumeric symbols in token Name';
  }

  if( !values.symbol ) {
    errors.symbol = 'Required';
  } else if(!/^[a-z0-9]+$/i.test(values.symbol)){
    errors.symbol = 'Only alphanumeric letters in symbol';
  }

  if (!values.maxTokenSupply) {
    errors.maxTokenSupply = 'Required';
  }else if(!/^[0-9]+$/i.test(values.maxTokenSupply)) {
    errors.maxTokenSupply = 'Invalid Max token supply';
  }

  if(!values.initProjectAPY) {
    errors.initProjectAPY = 'Required';
  } else if(!/^[0-9]+$/i.test(values.initProjectAPY)) {
    errors.initProjectAPY = 'Invalid initial project APY';
  }

  return errors;
};

export default validate;