import React from 'react';
import {
  Typography,
  Container,
  Button,
  Box,
  SvgIcon,
  InputBase
} from '@mui/material';

import {InputCaption} from '../input-caption';

type TextFieldProps = {
	label: string;
	placeholder?: string;
	error?: boolean;
	helpText?: string;
	type?: string;
	name?: string;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDragStart?: (e: React.DragEvent<HTMLInputElement>) => void;
	onDrop?: (e: React.DragEvent<HTMLInputElement>) => void;
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
	value?: string;
	readOnly?: boolean;
	errorText?: string;
	errorTextColor?: string;
	decorate?: string;
	sx?: any;
	disabled?: boolean;
};

export const TextField = ({
		label,
		placeholder,
		error,
		helpText,
		type: type='text',
		name,
		onBlur,
		onChange,
		onDragStart,
		onDrop,
		onFocus,
		value,
		readOnly,
		errorText,
		disabled,
		errorTextColor,
		sx,
		decorate,
	}: TextFieldProps) => {
	return (
		<Box sx={theme => ({
			color: 'rgb(48, 53, 73)',
			...(sx ?? {}),
		})}>
			<InputCaption {...{label, helpText}} />
			<Box sx={{
        padding: '8px 12px',
		    border: '1px solid rgb(234, 235, 239)',
		    borderRadius: '6px',
		    marginBottom: '4px',
			}}>
				<Box sx={{
			    display: 'flex',
			    alignItems: 'center',
			    marginBottom: '2px',
				}}>
					<InputBase {...{
						disabled,
						sx:{
					    color: sx?.color ?? 'rgb(48, 53, 73)',
					    lineHeight: '1.4375em',
					    boxSizing: 'border-box',
					    position: 'relative',
					    cursor: 'text',
					    display: 'inline-flex',
					    alignItems: 'center',
					    flex: '1 1 0%',
					    padding: '0',
						
					    '&.MuiInputBase-root': {
						    padding: '0',
					    },
					    ">.MuiInputBase-input": {
					    	padding: '5px 0 4px',
					    }
					  },
			  		onBlur,
						onChange,
						onDragStart,
						onDrop,
						onFocus,
						value,
						style: {padding: '0 !important'},
						readOnly,
						type,
					}} /> 
					{decorate ? <Box>{decorate}</Box> : undefined}
				</Box>
			</Box>
			{errorText ? <Box sx={{height: 0, color:  errorTextColor ?? 'red'}}>
				<Box>{errorText}</Box>
			</Box> : undefined}
    </Box>
	);
};
