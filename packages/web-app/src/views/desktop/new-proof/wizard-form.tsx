import React, { Component, useState } from 'react';
import PropTypes from 'prop-types';

type WizardFormProps = {
  onSubmit: (e: any) => void;
  onStep: (step: number) => void;
  nPages: number;
  step: number;
  Page: typeof React.Component; // (args: any) => React.ReactNode;
};

export const WizardForm = ({onSubmit, onStep, nPages, Page, step}: WizardFormProps) => {

  return null;
};
