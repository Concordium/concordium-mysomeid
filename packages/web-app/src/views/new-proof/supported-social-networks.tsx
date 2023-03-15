// import * as React from 'react';
import { SvgIcon as MuiSvgIcon, styled, Box } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import MastodonIconSvg from 'src/images/mastodon-icon.svg';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TiktokIconSvg from 'src/images/tiktok-icon.svg';
import TelegramIcon from '@mui/icons-material/Telegram';

const CustomIcon = styled(MuiSvgIcon, {
    name: 'CustomIcon',
    shouldForwardProp: (prop) => prop !== 'fill',
})((props)=>(() => ({
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin:  'round',
    strokeWidth:  '2.25px',
})));

CustomIcon.defaultProps = {
    viewBox: '0 0 24 24',
    focusable: 'false',
    'aria-hidden': 'true',
};

const MastodonIcon = (props) => (
    <Box component="img" src={MastodonIconSvg} height={24} width={24}/>
);

const TikTokIcon = ({}) => (
    <Box component="img" src={TiktokIconSvg} height={24} width={24}/>
);
    
export const supportedSocialNetworks = [
    {
        displayName: 'Twitter',
        id: 'tw',
        pattern: '[*.]twitter.com/[username]',
        icon: <TwitterIcon/>,
        props: [
            'Twitter username',
        ],
    },
    {
        displayName: 'LinkedIn',
        id: 'li',
        pattern: '[*.]linkedin.com/in/[username]',
        icon: <LinkedInIcon />,
        props: [
            'LinkedIn User ID',
        ],
    },
    {
        displayName: 'Facebook',
        id: 'fb',
        icon: <FacebookIcon/>,
        pattern: '[*.]facebook.com/[username]',
        props: [
            'username',
        ],
    },
    {
        displayName: 'Instagram',
        id: 'in',
        icon: <InstagramIcon/>,
        pattern: '[*.]instagram.com/[username]',
        props: [
            'username',
        ],
    },
    {
        displayName: 'Mastodon',
        id: 'ma',
        icon: <MastodonIcon />,
        pattern: 'mastodon.social/@[username]',
        props: [
            'username',
        ],
    },
    {
        displayName: 'Youtube',
        id: 'yo',
        icon: <YouTubeIcon />,
        pattern: '[*.]youtube.com/channel/[username]',
        props: [
            'username',
        ],
    },
    {
        displayName: 'TikTok',
        id: 'tt',
        icon: <TikTokIcon />,
        pattern: '[*.]tiktok.com/@[username]',
        props: [
            'username',
        ],
    },
    {
        displayName: 'Telegram',
        id: 'te',
        icon: <TelegramIcon />,
        pattern: '[*.]telegram.org/z/#[username]',
        props: [
            'username',
        ],
    },
];
