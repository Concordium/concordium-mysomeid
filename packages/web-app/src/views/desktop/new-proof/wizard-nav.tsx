import {
  Box,
} from "@mui/material";

import {
  Button, HtmlTooltip,
} from 'src/components';

type WizardNavProps = {
  prev?: string;
  next?: string;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  nextDisabledReason?: string | null;
  sx?: any;
  extraButton?: string;
  onExtraButton?: () => void;
  extraButtonDisabled?: boolean;
};

export const WizardNav = ({ sx, prev, next, onPrev, onNext, prevDisabled, nextDisabled, nextDisabledReason, extraButton, onExtraButton, extraButtonDisabled }: WizardNavProps) => (
  <Box sx={{ display: 'flex', ...sx }}>
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

    {next ? <ButtonWithTooltip {...{
      tooltip: nextDisabledReason,
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
    </ButtonWithTooltip> : undefined}
  </Box>
);

const ButtonWithTooltip = ({ children, tooltip: title, type, disabled, onClick, sx }: { children: string, tooltip?: string, type?: string, onClick?: () => void, disabled: boolean, sx?: any }) => {
  if (disabled && title?.length > 0) {
    return (
      <HtmlTooltip
        {...{title}}
      >
        <Box sx={{
          padding: '6px 12px 6px 12px',
          alignItems: 'center',
          color: 'white',
          borderRadius: '4px',
          background: 'rgb(1,22,236)',
          fontFamily: 'Golos-UI,Inter,Arial',
          fontWeight: 500,
          fontSize: '16px',
          height: '36px',
          lineHeight: '24px',
          minWidth: '64px',
          opacity: 0.2,
          userSelect: 'none',
          cursor: 'pointer',
          sx: {
            ...(sx ?? {})
          },
        }}>
          {children}
        </Box>
      </HtmlTooltip>
    );
  }

  return (
    <Button {...{
      type,
      onClick,
      className: 'next',
      variant: 'primary',
      disabled,
      sx: {
        ...(sx ?? {})
      },
    }}>
      {children}
    </Button>
  );
};