import {
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';

import {
  Typography,
  Box,
} from '@mui/material';

export function AspectBox({onRef, id, sx, aspect, onClick, onWidth, children}: {onRef?: ((ref: any) => void), id: string, sx: any, aspect: number, onClick?: (e: any) => void, onWidth?: (v: number) => void, children?: any,}) {
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
    onWidth && onWidth(w);
    console.log("Width / Height : ", {w,h});
  }, [ref]);

  useEffect(() => {
    onRef && onRef(ref);
  }, [ref, ref.current]);

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
      onWidth && onWidth(w);

      setWH({
        w,
        h,
      });
    });
    observer.observe(div);
    return () => observer.disconnect();
  }, [ref]);
  
  return (
    <Box {...{sx: (sx ? sx : {}), height: `${((wh?.w ?? 0) * aspect)}px`, id, ref, onClick}}>
      {children}
    </Box>
  );
}
