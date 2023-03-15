import {
  Box
} from "@mui/material";
import {
  Link,
} from "react-router-dom";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const Navi = ({path}: {path: string[][]}) => {
  return (
    <Box key={JSON.stringify(path)} sx={{
      display: 'flex',
      flexDirection: 'row',
    }}>
      {path.map( ([x, to], i) => ([
            ...(i > 0 ? [<ChevronRightIcon key={`navi-${x}-${i}-chevron`} sx={{marginTop: '2.5px'}} />]: []),
            <Box key={`navi-${x}-${i}-item`}>
              {to !== undefined ?
                <Link to={to} style={{
                  textDecoration: 'none',
                }}>
                  <Box sx={{
                    color: 'white',
                  }}>
                    {x}
                  </Box>
                </Link>
                :
                <Box sx={{
                  color: 'white',
                }}>
                  {x}
                </Box>
              }
            </Box>
        ]))
      }
    </Box>
  );
};
