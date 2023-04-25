// import React, {useState} from "react";

import {
	// Grid,
	Box,
	Paper,
	// CardActions,
	CardContent,
	Typography
} from '@mui/material';

import {Button} from 'src/components';

export function SelectTemplate({index, handleClick, sel, deac, headline, subtitle, body}) {
	const selectedSx = s => ({border: s ? 'solid 1px #4bb3d6' : 'solid 1px #e0e0e0'});
	return (
		<Box key={`template-${index + 1}`} onClick={handleClick} sx={{
		    marginLeft: (index > 0 ? '11px' : undefined),
		    marginRight: (index < 2 ? '11px' : undefined),
				display: 'flex',
				flexGrow: 1,
				flexBasis: 0,
				minWidth: 0
			}} >
			<Paper elevation={0} sx={{
				minWidth: 275,
				display: 'flex',
		    flexDirection: 'column',
				...selectedSx(sel),
				...( sel ? {
					boxShadow: '0px 0px 8px #4bb3d6',
				} : {} ),
			}}>
				<CardContent>
					{/*<Typography sx={{fontSize: 14, marginBottom: '8px', color: 'black'}}>
						{state}
					</Typography>*/}
					<Typography sx={{fontSize: '24px', marginBottom: '2px'}} variant="h5" component="div" color="black">
						{headline}
					</Typography>
					<Typography sx={{ mb: 1.5, marginBottom: '24px' }} color="text.secondary">
						{subtitle}
					</Typography>
					<Typography variant="body2" sx={{lineHeight: '1.4'}} color="text.secondary">
						{body}
					</Typography>
				</CardContent>
				<Box sx={{display: 'flex', placeContent: 'center', marginTop: 'auto', marginBottom: '16px'}}>
					<Button variant="secondary"
						disabled={sel || deac}
						sx={{
							border: !sel && !deac ? `1px solid ${'black'}` : undefined,
					    borderRadius: '4px',
						}}>
						{deac ? 'Deactivated' : !sel ? 'Select' : 'Selected'}
					</Button>
				</Box>
	    </Paper>
		</Box>
	);
}
