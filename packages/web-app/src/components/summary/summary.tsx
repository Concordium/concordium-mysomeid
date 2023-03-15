import {
  // Grid,
  Typography,
  // TextField,
  // Button,
  Box
} from '@mui/material';

import {
  LoadingIndicator
} from 'src/components';

export function SummaryFrame({title, sx, children}: {title?: string, sx?: any, children?: any}) {
  return (
    <Box id="summary" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginRight: 'auto',
      width: '100%',
      ...sx,
    }}>
      <Box sx={{
            border: '1px solid rgb(48, 53, 73)',
            borderRadius: '4px',
            width: '100%',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
      >
        {title &&
          <Typography variant="h5" sx={{}}>
            {title}
          </Typography>
        }
        {children}
      </Box>
    </Box>
  );
} 


export function SummarySection({height, contentHidden, loading, children}: {height?: number, contentHidden?: boolean, loading?: boolean, children: any}) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: height ? `${height}px` : undefined,
    }}>
      {!!loading ?? <Box sx={{
        position: 'absolute',
        placeSelf: 'center',
        justifySelf: 'center',
        alignSelf: 'center'
      }}>
        <LoadingIndicator />
      </Box>}
      <Box sx={{
        marginTop: '24px',
        padding: '8px',
        width: '100%',
        visibility: contentHidden ? 'hidden' : undefined,
      }}>
        <Box component="ul" sx={{
          maxWidth: '50%',
          padding: 0,
          overflow: 'hidden',
          listStyle: 'none',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}


export function SummaryItem({index, name, value}: {index: number, name: string, value: string}) {
  if ( name === 'break' ) {
    return <span style={{display: 'block', height: '32px'}} key={"summary-break-" + index} />;
  }
  return (
    <Box component="li" key={'summary-item-' + index} sx={{
      marginTop: index > 0 ? '6px' : undefined,
      "&:before": {
        float: 'left',
        width: 0,
        whiteSpace: 'nowrap',
        color: 'black',
        content: value !== 'no-dots' ? `"${[...Array(200).keys()].map(_ => '. ').join('')}"` : undefined,
      }
    }}>
      <Box component="span" sx={{
        background: 'white',
        paddingRight: '6px',
      }} >{name}</Box>
      {
        value !== 'no-dots' ? 
          <Box component="span" sx={{
            float: 'right',
            background: 'white',
            paddingLeft: '6px',
          }} >{value}</Box>
          : 
          undefined
      }
    </Box>
  );
}

export function Summary({title, summary, sx, subHeader, contentHidden, loading, addHeight}: {title?: string, summary: any[], sx?: any, subHeader?: any, contentHidden?: boolean, loading?: boolean, addHeight?: number}) {
  const boxHeight = 24 + 16 + summary.reduce((acc, {name, value}, index) => {
    acc += name === 'break' ? 30 : 18;
    return acc;
  }, 0) + (addHeight ?? 0);

  return (
    <SummaryFrame {...{sx, title: title ?? 'Summary'}}>
      {subHeader ? subHeader() : undefined}
      <SummarySection {...{loading, height: boxHeight}}>  
        {summary.map(({name, value}, index) => 
          <SummaryItem key={"summary item " + index} {...{index, name, value}}/>)}
      </SummarySection>
    </SummaryFrame>
  );
}