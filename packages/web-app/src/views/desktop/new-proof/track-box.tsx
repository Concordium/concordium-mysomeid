import Box, {BoxProps} from "@mui/material/Box";
import { useEffect, useRef, useState } from "react";

type TBoxCmdArgs = {
  width: number;
  height: number;
};

type TrackBoxArgs = {
  id: string;
  sx: any;
  children: ({width, height}: TBoxCmdArgs) => any; // string | JSX.Element | JSX.Element[];
};

export function TrackBox({id, sx, children}: TrackBoxArgs) {
  const ref = useRef(null);
  const [wh, setWH] = useState<{w: number, h: number} | null>(null);

  useEffect(() => {
    if ( !ref ) {
      return;
    }
    const {
      offsetWidth: w,
      offsetHeight: h,
      clientWidth,
      clientHeight,
    } = ref.current;
    setWH({
      w,
      h,
    });
  }, [ref]);

  useEffect(() => {
    if ( !ref ) {
      return;
    }
    const div = ref.current;
    const observer = new ResizeObserver((entries) => {
      if ( !entries.length ) {
        return;
      } 
      const entry = entries[entries.length - 1];
      const {
        width: w,
        height: h,
      } = entry.contentRect;
      setWH({
        w,
        h,
      });
    });
    observer.observe(div);
    return () => observer.disconnect();
  }, [ref]);
  
  return (
    <Box {...{sx: (sx ? sx : {}), id, ref}}>
      {children({width: wh?.w, height: wh?.h})}
    </Box>
  );
}
