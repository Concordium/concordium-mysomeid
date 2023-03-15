import React from 'react';

import {
  FormControl,
  InputLabel,
  Input,
  Box,
} from "@mui/material";

import {
  Button,
  TextField
} from 'src/components/ui';

type WizardNavProps = {
  prev?: string;
  next?: string;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  sx?: any;
};

export const WizardNav = ({ sx, prev, next, onPrev, onNext, prevDisabled, nextDisabled}: WizardNavProps) => (
  <Box sx={{display: 'flex', ...sx}}>
    {prev ?
      <Button {...{
        type: "button",
        className: "previous",
        variant: "secondary",
        onClick: onPrev ?? undefined,
        disabled: !!prevDisabled,
      }}>
        {prev}
      </Button> : undefined
    }
    {next ?
      <Button {...{
        type: !onNext ? "submit" : undefined,
        onClick: onNext ?? undefined,
        className: 'next',
        variant: 'primary',
        disabled: !!nextDisabled,
        sx: {
          marginLeft: 'auto',
        }
      }}>
        {next}
      </Button> : undefined
    }
  </Box>
);
