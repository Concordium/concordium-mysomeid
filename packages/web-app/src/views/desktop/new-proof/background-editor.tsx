import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import VerifiedBy from 'src/assets/verified-by.png';
import QRCode from "react-qr-code";
import * as htmlToImage from 'html-to-image';
import { Button } from 'src/components/ui/button';
import DownloadIcon from '@mui/icons-material/Download';
import defaultBackground from 'src/images/background-default.png';
import {
  AspectBox
} from './aspect-box';
import { Command, createCommand } from '../view-proof/view-proof';

function px_pct_s(v: number, d: number): string {
  return ((v / d) * 100).toFixed(2) + '%';
}

function px_pct(v: number, d: number): number {
  return ((v / d) * 100);
}

function parseEvent(e: any, rect: any) {
  const { width: w, height: h, left, top } = rect;
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
const draggingEnabled = false;
const _dragOffset = { x: 0, y: 0 };
const factor = 1.33;
const box = {
  rw: px_pct(88 * factor, 1000),
  rh: px_pct(122 * factor, 250),
};

const BackgroundEditorControls = ({ lt620, lt800, imageInputRef, onImageChanged, onDownload, changeBackground, setDefaultBg, color }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: lt620 ? 'column' : 'row', marginBottom: !lt620 ? '24px' : '16px', marginTop: '8px' }}>
      <input ref={imageInputRef} accept="image/*" type="file" onChange={onImageChanged} style={{ display: 'none' }} />

      <Box sx={{ display: 'flex', flexDirection: 'row', height: "36px", alignItems: 'center', paddingTop: '16px' }}>
        <Button variant="weak" sx={{ minWidth: '32px', marginRight: '8px' }} onClick={onDownload}><DownloadIcon /></Button>
        <Button variant="weak" sx={{ minWidth: '148px', marginRight: '8px' }} onClick={changeBackground}>Change Background</Button>
        <Button variant="weak" sx={{ minWidth: '90px' }} onClick={setDefaultBg}>Default</Button>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'row', height: "36px", alignItems: 'center', paddingTop: '16px' }}>
        {/*color.map((color, index) => (
              <Box id={"col-" + index} key={`col-${index}`} sx={{cursor: 'pointer', marginLeft: '8px', marginTop: '2px', minWidth: '18px', width: '18px', height: '18px', background: color, border: selColor === index ? '1px solid black' : color === 'white' ? '1px solid #b0b0b0' : undefined, borderRadius: '24px'}} onClick={onColorClicked} />
          ))
          {!lt800 ? <Typography height="36px" variant="h6"  width="100%" textAlign="right" marginRight="8px" fontSize="0.5rem" display="flex" alignItems="center" justifyContent="right">Drag the proof to move it to a diffirent location</Typography>: undefined*/}
      </Box>
    </Box>
  );
};

function BackgroundEditorCanvas({ saveAndDl, getPic, id, bgImg, uri, widgetColor }) {
  const refEditor = useRef(null);
  const refTarget = useRef(null);
  const refShadow = useRef(null);
  // const refEditorContent = useRef(null);
  const [x, setX] = useState<string>('87.44%');
  const [y, setY] = useState<string>('34.03%');
  // const [subscribed, setSubscribed] = useState(false);
  const [/*drag*/, setDrag] = useState(false);
  const [/*dragOffset*/, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [shadowScale] = useState(1.6);

  const saveAndDownloadImpl = useCallback(() => {
    htmlToImage.toPng(refShadow?.current, {
      width: 1600,
      height: 400,
      canvasWidth: 1600,
      canvasHeight: 400,
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
        width: 1600,
        height: 400,
        canvasWidth: 1600,
        canvasHeight: 400,
        backgroundColor: 'white',
      });
    });
  }, [refShadow?.current]);

  const mv = useCallback(e => {
    if (!_drag) {
      // console.log('Drag ignore');
      return;
    }
    // console.log('Drag move');
    const rect = e.target.getBoundingClientRect();
    const { rx, ry } = parseEvent(e, rect);
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
    // console.log("res_x, res_y , ", { res_x, res_y });
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
    setDragOffset({ x: e.offsetX, y: e.offsetY });
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
    if (!draggingEnabled) {
      return;
    }
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
    <Box {...{ ref: refEditor, id: 'editor', sx: { overflow: 'hidden', background: "#F6F6F6", display: 'flex', width: '100%', boxShadow: '0px 0px 30px 2px rgba(0,0,0,0.16)' } }}>
      <AspectBox {...{
        id: "editor-content",
        aspect: 0.25,
        onWidth: (w: number) => {
          setScale(w / 1000);
        },
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
            size={Math.round(80 * factor * scale)}
            viewBox={`0 0 256 256`}
            style={{
              zIndex: 1,
              borderRadius: `${Math.round(1.125 * factor * scale)}px`,
              height: `${Math.round(80 * factor * scale)}px`,
              width: `${Math.round(80 * factor * scale)}px`,
              marginTop: `${Math.round(4 * factor * scale)}px`,
              padding: `${Math.round(4 * factor * scale)}px`,
              background: 'white',
            }}
          />

          <Box display="flex" sx={{ zIndex: 1, marginTop: 'auto', marginBottom: 'auto', width: '100%', placeItems: "center", justifyContent: "center", pointerEvents: 'none' }}>
            <Box sx={{
              background: `url(${VerifiedBy})`,
              width: `${Math.round(75 * factor * scale)}px`,
              height: `${Math.round((75 / 3) * factor * scale)}px`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              marginTop: `${Math.round(2 * factor * scale)}px`,
              marginLeft: `${Math.round(1 * factor * scale)}px`,
            }} />
          </Box>

          <Box sx={{
            width: `100%`,
            height: `0px`,
            zIndex: 0,
          }}>
            <Box sx={{
              width: '0',
              height: '0',
              borderLeft: `${Math.round(180 * factor * scale)}px solid transparent`,
              borderBottom: `${Math.round(140 * factor * scale)}px solid ${widgetColor}`,
              marginTop: `-${Math.round(134 * factor * scale)}px`,
              marginLeft: `-${Math.round(105 / 2 * factor * scale)}px`,
            }} />
          </Box>
        </Box>
      </AspectBox>
    </Box>

    <Box {...{
      id: 'editor-shadow', sx: {
        width: '1600px',
        height: '400px',
        marginLeft: '-999999999px',
        // marginLeft: '-1000px',
        marginTop: '-400px',
        overflow: 'hidden',
        position: 'abosolute',
        background: "#F6F6F6",
        display: 'flex'
      }
    }}>
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
          borderRadius: `${Math.round(6 * 1)}px`,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}>
          <QRCode
            id="qr-code-canvas"
            value={uri}
            size={Math.round(80 * factor * shadowScale)}
            viewBox={`0 0 256 256`}
            style={{
              zIndex: 1,
              borderRadius: `${Math.round(2.1 * factor * scale)}px`,
              height: `${Math.round(80 * factor * shadowScale)}px`,
              width: `${Math.round(80 * factor * shadowScale)}px`,
              marginTop: `${Math.round(4 * factor * shadowScale)}px`,
              pointerEvents: 'none',
              padding: `${Math.round(5 * factor * shadowScale)}px`,
              background: 'white',
            }}
          />

          <Box display="flex" sx={{ zIndex: 1, marginTop: 'auto', marginBottom: 'auto', width: '100%', placeItems: "center", justifyContent: "center", pointerEvents: 'none' }}>
            <Box sx={{
              background: `url(${VerifiedBy})`,
              width: `${Math.round(75 * factor * shadowScale)}px`,
              height: `${Math.round((75/3) * factor * shadowScale)}px`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              marginTop: `${Math.round(2 * factor * shadowScale)}px`,
              marginLeft: `${Math.round(1 * factor * shadowScale)}px`,
              pointerEvents: 'none',
              userSelect: 'none',
            }} />
          </Box>

          <Box sx={{
            width: `100%`,
            height: `0px`,
            zIndex: 0,
          }}>
            <Box sx={{
              width: '0',
              height: '0',
              borderLeft: `${Math.round(180 * factor * shadowScale)}px solid transparent`,
              borderBottom: `${Math.round(140 * factor * shadowScale)}px solid ${widgetColor}`,
              marginTop: `-${Math.round(134 * factor * shadowScale)}px`,
              marginLeft: `-${Math.round(105 / 2 * factor * shadowScale)}px`,
            }} />
          </Box>
        </Box>
      </Box>
    </Box>
  </>);
}

export function BackgroundEditor({ bgImg: _bgImg, getPic, id, uri, widgetColor }) {
  const theme = useTheme();

  const lt620 = useMediaQuery(theme.breakpoints.down(620));
  const lt800 = useMediaQuery(theme.breakpoints.down(800));

  const [manualBg, setManualBg] = useState<string | null>(null);
  const [bgImg, setBgImg] = useState(_bgImg ?? defaultBackground);

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [saveAndDl] = useState<Command>(createCommand());

  // const [selColor, setSelColor] = useState(0);
  /* const color = [
    'rgb(205, 90, 109)',
    '#79d179',
    '#54a9c5',
    '#e4b5e7',
    'grey',
    // 'white',
  ]; */

  /* const onColorClicked = useCallback((event: any) => {
    setSelColor(Number.parseInt(event.target.id.split('-')[1]));
  }, []); */

  useEffect(() => {
    if (!manualBg) {
      return;
    }
    setBgImg(manualBg);
  }, [manualBg]);

  const onImageChanged = useCallback((event: any) => {
    const data = event?.target?.files?.[0] ? URL.createObjectURL(event?.target?.files?.[0]) : null;
    setManualBg(data);
  }, []);

  const onDownload = useCallback(() => {
    saveAndDl.exec();
  }, [saveAndDl]);

  const changeBackground = useCallback(() => {
    imageInputRef?.current?.click();
  }, [imageInputRef]);

  const setDefaultBg = useCallback(() => {
    setBgImg(defaultBackground);
  }, []);

  return (
    <>
      <BackgroundEditorCanvas {...{
        saveAndDl,
        getPic,
        id,
        bgImg,
        uri,
        widgetColor,
      }} />
      <BackgroundEditorControls {...{
        lt620,
        lt800,
        imageInputRef,
        onImageChanged,
        onDownload,
        changeBackground,
        setDefaultBg,
        color: null,
      }} />
    </>
  );
}

export const downloadBase64File = (linkSource: string, fileName: string) => {
  const downloadLink = (document.getElementById('__imageDownload') ?? document.createElement("a")) as HTMLAnchorElement;
  downloadLink.id = "__imageDownload";
  downloadLink.href = linkSource;
  downloadLink.download = fileName;
  downloadLink.click();
};
