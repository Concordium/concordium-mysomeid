import {logger} from '@mysomeid/chrome-ext-shared';
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useCallback, useState } from "react";
import {
  Route,
  Routes,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import {
  Box,
  Button,
  Typography
} from '@mui/material';
import {
  WizardLoading
} from './wizard-loading';
import {
  createWidgetMessageHandler,
  getMessageHandler
} from './messaging';
import Logo from './title-logo.png';
import {
  themeSX
} from './theme';

const TextButton = ({ onClick, children }: { onClick: () => void, children?: any }) => {
  return (
    <Button {...{ onClick }} disableRipple sx={{
      background: themeSX.colors.buttonTextBG,
      borderRadius: '100px',
      height: '42px',
      padding: `0px ${themeSX.size.s3}`,
      color: themeSX.text.medium.color,
      '&:hover': {
        background: themeSX.colors.buttonTextBGHover,
        color: themeSX.text.medium.color,
      },
    }}>
      {children}
    </Button>
  );
};

const PrimaryButton = ({ sx, onClick, children }: { sx?: any, onClick: () => void, children?: any }) => {
  return (
    <Button {...{ onClick }} disableRipple sx={{
      background: themeSX.colors.buttomBGPrimary,
      borderRadius: '100px',
      height: '42px',
      padding: `0px ${themeSX.size.s3}`,
      color: 'white',
      '&:hover': {
        background: themeSX.colors.buttomBGPrimaryHover,
        color: 'white',
        opacity: '0.8',
      },
      ...(sx ?? {}),
    }}>
      {children}
    </Button>
  );
};

const dev = false;

const NotVerified = ({ id, messageHandler }: { id: number | undefined, messageHandler: any }) => {
  const [params] = useSearchParams();

  const platform: 'li' = params.get("p") as 'li' ?? 'li';

  const words = {
    'li': {
      profileName: 'LinkedIn',
    }
  };

  const secureProfile = useCallback(() => {
    messageHandler.sendMessage('close-widget', 'content', {
      id
    });
    messageHandler.sendMessage('redirect', 'content', {});
  }, [id, messageHandler]);

  const cancel = useCallback(() => {
    messageHandler.sendMessage('close-widget', 'content', {
      id
    });
  }, [id, messageHandler]);

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', paddingTop: themeSX.size.s3, textAlign: 'center' }}>
        <Typography sx={themeSX.text.h2} component="h2">
          Your {words[platform]?.profileName ?? ''} profile is not verified.
        </Typography>

        <Typography sx={{ ...themeSX.text.medium, marginTop: themeSX.size.s3, padding: `0px ${themeSX.size.s2}` }}>
          Secure your account now by self-issuing a certificate to prove your account ownership.
          <br /><br />
          The certificate contains a cryptographic proof used to let other know that you are who you claim to be to prevent risks of identity theft and fraud.
        </Typography>
      </Box>

      <Box component="footer" sx={{ padding: `0px ${themeSX.size.s2}`, display: 'flex', marginTop: themeSX.size.s2, justifyContent: 'space-between', position: 'fixed', bottom: '0', left: '0', right: '0', marginBottom: themeSX.size.s2 }}>
        <TextButton onClick={cancel}>CANCEL</TextButton>
        <PrimaryButton onClick={secureProfile}>SECURE PROFILE</PrimaryButton>
      </Box>
    </>
  );
};

const FinalizeVerification = ({ id, messageHandler }: { id: number | undefined, messageHandler: any }) => {
  const [showAreYouSure, setAreYouSure] = useState(false);
  const cancel = useCallback(() => {
    setAreYouSure(true);
  }, []);

  const next = useCallback(() => {
    if (!showAreYouSure) {
      messageHandler.sendMessage('close-widget', 'content', {
        id,
        result: 'continue',
      });
    }
  }, [id, messageHandler, showAreYouSure]);

  return !showAreYouSure ? (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', paddingTop: themeSX.size.s3, textAlign: 'center' }}>
        <Typography sx={themeSX.text.h2} component="h2">
          Finalize Verification
        </Typography>

        <Typography sx={{ ...themeSX.text.medium, marginTop: themeSX.size.s3, padding: `0px ${themeSX.size.s2}` }}>
          Update your profile background picture with the one you just created to finalize the verification.
          <br /><br />
        </Typography>
      </Box>

      <Box component="footer" sx={{ padding: `0px ${themeSX.size.s2}`, display: 'flex', marginTop: themeSX.size.s2, justifyContent: 'space-between', position: 'fixed', bottom: '0', left: '0', right: '0', marginBottom: themeSX.size.s2 }}>
        <TextButton onClick={cancel}>CANCEL</TextButton>
        <PrimaryButton onClick={next}>UPDATE BACKGROUND</PrimaryButton>
      </Box>
    </>
  ) : (
    <Message {...{
      id, messageHandler, handler: (result: boolean) => {
        if (result) {
          messageHandler.sendMessage('close-widget', 'content', {
            id,
            result: 'cancel',
          });
        } else {
          setAreYouSure(false);
        }
      }, title: 'Are you sure?', message: 'If you do not update your background picture others will not be able to see that you are verified.', primary: 'Yes', secondary: 'Resume'
    }} />
  );
};

const Err = ({ id, messageHandler }: { id: number | undefined, messageHandler: any }) => {
  return (
    <Box>
      <Typography sx={themeSX.text.h2} component="h2">
        Invalid route requested
      </Typography>
    </Box>
  );
};

const MessageRoute = ({ id, messageHandler }: { id: number | undefined, messageHandler: any }) => {
  const [params] = useSearchParams();

  const title = (params.get("title") ?? '');
  const message = (params.get("message") ?? '');
  const secondary = (params.get("secondary") ?? '');
  const primary = (params.get("primary") ?? 'Okay');
  const primaryLink = (params.get("primary_link") ?? '');
  const loading = ['1', 'true'].indexOf(params.get('loading') ?? '') >= 0;
  const gotoButton = (params.get('goto_button') ?? '');
  const gotoLink = (params.get('goto_link') ?? '');

  return <Message {...{
    id,
    messageHandler,
    title, message,
    secondary,
    primary,
    primaryLink,
    loading,
    goto_button: gotoButton,
    gotoLink
  }} />
}

type MessageParams = {
  id: number | undefined;
  messageHandler: any;
  handler?: (v: boolean) => void;
  title?: string;
  message: string;
  secondary?: string;
  primary?: string;
  primaryLink?: string;
  loading?: boolean;
  goto_button?: string | null;
  gotoLink?: string | null;
};

const Message = ({
  id,
  messageHandler,
  handler,
  title,
  message,
  secondary,
  primary,
  primaryLink,
  loading,
  goto_button,
  gotoLink
}: MessageParams) => {
  const secondaryClick = useCallback(() => {
    !handler ? messageHandler.sendMessage('close-widget', 'content', {
      id,
      result: false,
    }) : handler(false);
  }, [handler, id, messageHandler]);

  const primaryClick = useCallback(() => {
    !handler ? messageHandler.sendMessage('close-widget', 'content', {
      id,
      result: true,
    }) : handler(true);
    if (primaryLink) {
      messageHandler.sendMessage('redirect', 'content', {
        url: primaryLink,
      });
    }
  }, [handler, id, messageHandler, primaryLink]);

  const gotoButtonClick = useCallback(() => {
    gotoLink && messageHandler.sendMessage('open-url', 'content', {
      url: gotoLink,
    });
  }, [gotoLink, messageHandler]);

  return (
    <>
      {!loading ?
        <Box sx={{ display: 'flex', flexDirection: 'column', paddingTop: themeSX.size.s3, textAlign: 'center' }}>
          {title ? <Typography sx={themeSX.text.h2} component="h2">
            {title}
          </Typography> : undefined}

          {message ? <Typography sx={{ ...themeSX.text.medium, marginTop: themeSX.size.s3, padding: `0px ${themeSX.size.s2}` }}>
            {message.split('<br/>').map((x: string, i: number) => {
              return <>
                {<span key={'line-' + i}>{x ?? ''}</span>}
                {(i < message.split('<br/>').length - 1) ? <br key={'line-br-' + i} /> : undefined}
              </>;
            })}
            <br /><br />
          </Typography> : undefined}
        </Box> : undefined}

      {loading ? (
        <WizardLoading {...{ title: title ?? 'Loading', subtitle: message, color: themeSX.text.h2.color }} />
      ) : undefined}

      {goto_button ? (
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', placeContent: 'center', paddingTop: '0px', textAlign: 'center' }}>
          <PrimaryButton sx={{ minWidth: '100px' }} onClick={gotoButtonClick}>{goto_button ?? 'Open'}</PrimaryButton>
        </Box>
      ) : undefined}

      <Box component="footer" sx={{ padding: `0px ${themeSX.size.s2}`, display: 'flex', marginTop: themeSX.size.s2, justifyContent: secondary ? 'space-between' : 'center', position: 'fixed', left: '0', right: '0', bottom: '0', marginBottom: themeSX.size.s2, }}>
        {secondary ? <TextButton onClick={secondaryClick}>{secondary}</TextButton> : undefined}
        {primary ? <PrimaryButton sx={{ minWidth: '100px' }} onClick={primaryClick}>{primary ?? 'Okay'}</PrimaryButton> : undefined}
      </Box>
    </>
  );
};

const Centered = ({ children }: { children: any }) => dev ? <Box sx={{
  position: 'fixed',
  left: 0, right: 0, top: 0, bottom: 0,
  background: 'grey',
  display: 'flex',
  alignItems: 'center',
  placeItems: 'center',
  justifyContent: 'center',
}}>{children}</Box> : children;

export const objToUrlParms = (obj: any) => Object.keys(obj).map(key => [key, obj[key]].join('=')).join('&');

const Header = ({ logoClick }: any) => {

  return <Box sx={{ width: '100%', height: '131px', background: themeSX.colors.headerBG, borderRadius: '7px' }}>
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: themeSX.size.s4,
    }}>
      <Box sx={{ display: 'flex' }} onClick={logoClick}>
        <img src={Logo} alt="logo" style={{
          height: '22vmin',
          marginTop: '-4px',
          pointerEvents: 'none',
        }} />
      </Box>
    </Box>
  </Box>;
}

const App = () => {
  const [id, setId] = useState<number | undefined>(undefined);

  const navigate = useNavigate();

  const [messageHandler] = useState(createWidgetMessageHandler((msg: any) => {
    const {
      to,
      // from,
      type,
      payload
    } = msg;

    // not for me.
    if (to !== 'injected-widget') {
      logger.log("Ignored message ", msg);
      return;
    }

    if (type === 'widget-create') {
      const { id } = payload;
      logger.log("set widget id " + id);
      setId(id);
      messageHandler.sendMessage("widget-created", 'content', { id });
    }

    if (type === 'widget-redirect') {
      const args = objToUrlParms({
        ...payload
      });
      navigate(`/message?${args}`);
    }
  })
  );

  const w = '100%'; // '366px';

  return (
    <Centered>
      <Box sx={{ width: w, padding: '3px', height: '503px', background: themeSX.colors.panelBG, borderRadius: themeSX.size.s1 }}>

        <Header />

        <Routes>
          <Route path="not-verified" element={<NotVerified {...{ id, messageHandler }} />} />
          <Route path="secure" element={<NotVerified {...{ id, messageHandler }} />} />

          <Route path="finalize" element={<FinalizeVerification {...{ id, messageHandler }} />} />

          <Route path="message" element={<MessageRoute {...{ id, messageHandler }} />} />

          <Route path="*" element={<Err {...{ id, messageHandler }} />} />

        </Routes>


      </Box>
    </Centered>
  );
}

export default App;
