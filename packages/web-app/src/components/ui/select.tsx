import React from "react";

import {
  Select as MUI_Select,
  Box,
} from "@mui/material";

import { SelectChangeEvent } from '@mui/material/Select';

import {InputCaption} from './input-caption';

type ItemType = {
  value: any;
  label?: string;
};

type SelectProps = {
  id: string;
  labelId?: string;
  label: string;
  error?: string;
  helpText?: string;
  value: any;
  onChange: (e: any) => void;
  items?: ItemType[];
  disabled: boolean;
  children: React.ReactNode;
};

export function Select(props: SelectProps) {
  const {
    id,
    labelId,
    disabled,
    value,
    label,
    onChange,
    items,
    helpText,
    children,
    error,
  } = props;

  return (
    <Box sx={{
      color: 'rgb(48, 53, 73)',
      width: '100%',
    }}>
      <InputCaption {...{label, helpText}}/>
      <MUI_Select
        {...{
          id,
          labelId: labelId ?? id,
          disabled,
          value: value ?? '0',
          defaultValue: '0',
          label,
          onChange: (e) => {
            onChange(e.target.value);
          },
          variant: "outlined",
          className: "ui-select",
          sx: {
            width: '100%',
            height: '48px',
            padding: '8px 12px',
            border: '1px solid rgb(234, 235, 239)',
            borderRadius: '6px',
            marginBottom: '4px',
            '&.ui-select .MuiInputBase-input': {
              display: 'inline-flex',
              alignItems: 'center',
            },
            '&.ui-select .MuiOutlinedInput-input': {
              p: 0,
              backgroundColor: 'transparent',
              pr: '24px !important',
            },
            '&.ui-select .MuiOutlinedInput-notchedOutline': { display: 'none' },
            '&.ui-select .MuiSelect-icon': {
              color: 'text.primary',
            },
          },
        }}
      >
        {children}
      </MUI_Select>
    </Box>
  );
}

