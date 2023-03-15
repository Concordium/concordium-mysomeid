import {
  Box,
} from "@mui/material";

import {
  Button,
} from 'src/components';

type WizardNavProps = {
  prev?: string;
  next?: string;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  sx?: any;
  extraButton?: string;
  onExtraButton?: () => void;
  extraButtonDisabled?: boolean;
}; 

export const WizardNav = ({ sx, prev, next, onPrev, onNext, prevDisabled, nextDisabled, extraButton, onExtraButton, extraButtonDisabled}: WizardNavProps) => (
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
    {!!extraButton ?
      <Button {...{
        type: "button",
        onClick: onExtraButton,
        className: 'next',
        variant: 'secondary',
        disabled: !!extraButtonDisabled,
        sx: {
          marginLeft: 'auto',
          marginRight: '30px',
        }
      }}>
        {extraButton}
      </Button> : undefined}
    {next ?
      <Button {...{
        type: !onNext ? "submit" : undefined,
        onClick: onNext ?? undefined,
        className: 'next',
        variant: 'primary',
        disabled: !!nextDisabled,
        sx: {
          marginLeft: !extraButton ? 'auto' : undefined,
        }
      }}>
        {next}
      </Button> : undefined
    }
  </Box>
);
