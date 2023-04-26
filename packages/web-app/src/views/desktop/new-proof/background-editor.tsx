import {useState, useCallback, useEffect, useRef} from 'react';
import {
  useNavigate
} from 'react-router-dom';
import {
  connect,
  useDispatch,
} from 'react-redux';
import {
  reduxForm,
} from 'redux-form';
import validate from './validate';
import {
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  useCCDContext,
} from 'src/hooks';
import {
  WizardNav
} from './wizard-nav';
import {
  Certificate
} from './certificate';
import defaultBackground from 'src/images/background-default.png';
import logoSvg from 'src/images/logo-white.svg';
import {
  useSearchParams
} from 'src/hooks/use-search-params';
import toImg from 'react-svg-to-image';
import {
  useExtension
} from 'src/hooks/use-extension';
import formName, {selector} from './form-props';
import QRCode from "react-qr-code";
import { error } from 'src/slices/messages-slice';
import * as htmlToImage from 'html-to-image';
import {
  proofBaseUri,
} from 'src/constants';
import {
  TrackBox
} from './track-box';
import {
  WizardLoading
} from './wizard-loading';
import {
  AspectBox
} from './aspect-box';
import { Button } from 'src/components/ui/button';
import { Command, createCommand } from '../view-proof/view-proof';

function px_pct_s(v: number, d: number): string {
  return ((v / d) * 100).toFixed(2) + '%';
}

function px_pct(v: number, d: number): number {
  return ((v / d) * 100);
}

function parseEvent(e: any, rect: any) {
  const {width: w, height: h, left, top} = rect;
  const x = e.clientX - left;
  const y = e.clientY - top;
  const rx = ((x / (w ?? 0.0001)) * 100); // .toFixed(2) + '%';
  const ry = ((y / (h ?? 0.0001)) * 100); // .toFixed(2) + '%';
  return {
    x, y,
    rx, ry,
  };
}

let _drag = false;
const _dragOffset = {x: 0, y: 0};
const factor = 1.33;
const box = {
  rw: px_pct(102 * factor, 1000),
  rh: px_pct(136 * factor, 250),
};

export function BackgroundEditor({saveAndDl, getPic, id, bgImg, uri, widgetColor}) {
  const refEditor = useRef(null);
  const refTarget = useRef(null);
  const refShadow = useRef(null);
  const refEditorContent = useRef(null);
  const [x, setX] = useState<string>('86.04%');
  const [y, setY] = useState<string>('25.41%');
  const [subscribed, setSubscribed] = useState(false);
  const [drag, setDrag] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // console.log("bgImg ", bgImg );
  const shadowScale = 1;

  const saveAndDownloadImpl = useCallback(() => {
    htmlToImage.toPng(refShadow?.current, {
      width: 1000,
      height: 250,
      canvasWidth: 1000,
      canvasHeight: 250,
      backgroundColor: 'white',
    }).then((dataUrl) => {
        downloadBase64File(dataUrl, 'mysomeid-linkedin-proof-' + id + '.png');
    });
  }, [refShadow?.current, id, refShadow]);

  useEffect(() => {
    return saveAndDl?.subscribe(() => {
      saveAndDownloadImpl();
    });
  }, []);

  useEffect(() => {
    return getPic?.subscribe(() => {
      return htmlToImage.toPng(refShadow?.current, {
        width: 1000,
        height: 250,
        canvasWidth: 1000,
        canvasHeight: 250,
        backgroundColor: 'white',
      });
    });
  }, [refShadow?.current]);

  const mv = useCallback(e => {
    if ( !_drag ) {
      // console.log('Drag ignore');
      return;
    } 
    // console.log('Drag move');
    const rect = e.target.getBoundingClientRect();
    const {rx, ry} = parseEvent(e, rect);
    const dorx = ((_dragOffset.x / (rect.width ?? 0.0001)) * 100); // .toFixed(2) + '%';
    const dory = ((_dragOffset.y / (rect.height ?? 0.0001)) * 100); // .toFixed(2) + '%';
    const px = rx - dorx;
    const py = ry - dory;
    const so1x = px + box.rw > 100 ? 100 - (px + box.rw) : 0; // > 100 ? (100 - px + box.rw) : 0;
    const so1y = py + box.rh > 100 ? 100 - (py + box.rh) : 0; // > 100 ? (100 - py + box.rh) : 0;
    const so2x = px < 0 ? -px : 0; // > 100 ? (100 - px + box.rw) : 0;
    const so2y = py < 0 ? -py : 0;
    const res_x = `${(px + so1x + so2x).toFixed(2)}%`;
    const res_y = `${(py + so1y + so2y).toFixed(2)}%`;
    setX(res_x);
    setY(res_y);
  }, [_drag]);

  const dn = useCallback(e => {
    // console.log('Drag start');
    // console.log("e", e);
    _dragOffset.x = e.offsetX;
    _dragOffset.y = e.offsetY;
    // console.log("down", _dragOffset);
    // px_pct(102, 1000)
    _drag = true; 
    const rect = e.target.getBoundingClientRect();
    // const {rx, ry} = parseEvent(e, rect);
    setDragOffset({x: e.offsetX, y: e.offsetY});
    setDrag(true);
  }, [_drag]);

  const up = useCallback(e => {
    // console.log('Drag end');
    // console.log("up");
    _drag = false;
    setDrag(false);
  }, [_drag]);

  useEffect(() => {
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mouseup', up);
    };
  }, []);

  useEffect(() => {
    refEditor.current?.addEventListener('mousemove', mv);
    refTarget.current?.addEventListener('mousedown', dn);
    refEditor.current?.addEventListener('mouseup', up);
    return () => {
      refEditor.current?.removeEventListener('mousemove', mv);
      refEditor.current?.removeEventListener('mousedown', dn);
      refEditor.current?.removeEventListener('mouseup', up);
    };
  }, [refEditor.current]);

  return (<>
    <Box {...{ref: refEditor, id: 'editor', sx: { overflow: 'hidden', background: "#F6F6F6", display: 'flex', width: '100%', boxShadow: '0px 0px 30px 2px rgba(0,0,0,0.16)'}}}>
      <AspectBox {...{
        id: "editor-content",
        aspect: 0.25,
        onWidth: (w: number) => setScale(w / 1000),
        sx: {
          width: "100%",
          background: `url("${bgImg}")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        },
      }}>
          <Box ref={refTarget} sx={{
            width: `${box.rw}%`,
            height: `${box.rh}%`,
            left: x,
            top: y,
            position: `relative`,
            background: widgetColor,            
            pointerEvents: _drag ? 'none' : 'initial',
            borderRadius: `${Math.round(6 * scale)}px`,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            userSelect: 'none',
            cursor: 'grab',
          }}>
            <QRCode
              id="qr-code-canvas"
              value={uri}
              size={Math.round(94 * factor * scale)}
              viewBox={`0 0 256 256`}
              style={{
                height: `${Math.round(94 * factor * scale)}px`,
                width: `${Math.round(94 * factor * scale)}px`,
                marginTop: `${Math.round(4 * factor * scale)}px`,
                padding: `${Math.round(4 * factor * scale)}px`,
                background: 'white',
              }}
            />
            
            <Box display="flex" sx={{marginTop: 'auto', marginBottom: 'auto', width: '100%', placeItems: "center", justifyContent: "center", pointerEvents: 'none'}}>
              <Box sx={{
                background: `url(${logoSvg})`,
                width: `${Math.round(27 * factor * scale)}px`,
                height: `${Math.round(23 * factor * scale)}px`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                transform: 'scaleX(1.1)',
                marginRight: `${Math.round(8 * factor * scale)}px`,
                marginLeft: `${Math.round(-2 * factor * scale)}px`,
              }}/>
              <Typography sx={{fontSize: `${Math.round(8 * factor * scale)}px`, textAlign: 'center', color: 'white'}}>VERIFIED BY<br/>MYSOMEID</Typography>
            </Box>
          </Box>
      </AspectBox>
    </Box>

    <Box {...{id: 'editor-shadow', sx: {
      width: '1000px',
      height: '250px',
      marginLeft: '-999999999px',
      marginTop: '-250px',
      overflow: 'hidden',
      position: 'abosolute',
      background: "#F6F6F6",
      display: 'flex'
    }}}>
      <Box {...{
        ref: refShadow,
        id: "editor-shadow-content",
        sx: {
          width: "100%",
          background: `url("${bgImg}")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        },
      }}>
        <Box sx={{
            width: `${box.rw}%`,
            height: `${box.rh}%`,
            left: x,
            top: y,
            position: `relative`,
            background: widgetColor,            
            pointerEvents: _drag ? 'none' : 'initial',
            borderRadius: `${Math.round(6 * shadowScale)}px`,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}>
            <QRCode
              id="qr-code-canvas"
              value={uri}
              size={Math.round(94 * factor * shadowScale)}
              viewBox={`0 0 256 256`}
              style={{
                height: `${Math.round(94 * factor * shadowScale)}px`,
                width: `${Math.round(94 * factor * shadowScale)}px`,
                marginTop: `${Math.round(4 * factor * shadowScale)}px`,
                pointerEvents: 'none',
                padding: `${Math.round(5 * factor * shadowScale)}px`,
                background: 'white',
              }}
            />
            
            <Box display="flex" sx={{marginTop: 'auto', marginBottom: 'auto', width: '100%', placeItems: "center", justifyContent: "center", pointerEvents: 'none'}}>
              <Box sx={{
                background: `url(${logoSvg})`,
                width: `${Math.round(27 * factor * shadowScale)}px`,
                height: `${Math.round(23 * factor * shadowScale)}px`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                transform: 'scaleX(1.1)',
                marginRight: `${Math.round(8 * factor * shadowScale)}px`,
                marginLeft: `${Math.round(-2 * factor * shadowScale)}px`,
                pointerEvents: 'none',
                userSelect: 'none',
              }}/>
              <Typography sx={{fontSize: `${Math.round(8 * factor * shadowScale)}px`, textAlign: 'center', color: 'white'}}>VERIFIED BY<br/>MYSOMEID</Typography>
            </Box>
          </Box>
      </Box>
    </Box>
  </>);
}

export const downloadBase64File = (linkSource: string, fileName: string) => {
  const downloadLink = (document.getElementById('__imageDownload') ?? document.createElement("a")) as HTMLAnchorElement;
  downloadLink.id = "__imageDownload";
  downloadLink.href = linkSource;
  downloadLink.download = fileName;
  downloadLink.click();
};
