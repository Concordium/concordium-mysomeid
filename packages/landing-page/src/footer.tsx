import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import SvgIcon from '@mui/material/SvgIcon';
import GreyLogoSvg from './images/grey-logo.svg';

const FooterLink = ({icon}) => {
  const icons = {
    twitter: <svg viewBox="0 0 33 32" xmlns="https://twitter.com/DAOBuilder_com"><path d="M16.18 32a15.997 15.997 0 1 1 15.997-15.997 16.015 16.015 0 0 1-15.998 15.998Zm-8.838-8.862a10.835 10.835 0 0 0 5.862 1.717 10.423 10.423 0 0 0 8.077-3.545 11.256 11.256 0 0 0 2.803-7.335c0-.186 0-.347-.012-.495a7.715 7.715 0 0 0 1.909-1.98 7.647 7.647 0 0 1-2.197.602 3.823 3.823 0 0 0 1.674-2.112c-.75.445-1.571.76-2.427.928a3.826 3.826 0 0 0-6.513 3.486 10.89 10.89 0 0 1-7.88-4 3.827 3.827 0 0 0 1.184 5.105 3.815 3.815 0 0 1-1.733-.48v.048a3.84 3.84 0 0 0 3.067 3.756 3.8 3.8 0 0 1-1.726.066 3.825 3.825 0 0 0 3.572 2.655 7.697 7.697 0 0 1-5.66 1.583v.001Z"></path></svg>,
    github: <svg viewBox="0 0 33 32" xmlns="http://www.w3.org/2000/svg"><path d="M30.622 8.166a16.126 16.126 0 0 0-5.814-5.962 15.364 15.364 0 0 0-8.03-2.198c-2.824-.023-5.6.736-8.037 2.198A16.116 16.116 0 0 0 2.92 8.166a16.325 16.325 0 0 0-2.146 8.223 16.182 16.182 0 0 0 3.05 9.631 15.697 15.697 0 0 0 7.885 5.914.915.915 0 0 0 .834-.149.833.833 0 0 0 .27-.639l-.011-1.152c-.008-.726-.011-1.357-.011-1.893l-.478.091c-.382.063-.77.088-1.156.076a8.612 8.612 0 0 1-1.449-.15 3.199 3.199 0 0 1-1.395-.638 2.705 2.705 0 0 1-.916-1.313l-.208-.49a5.353 5.353 0 0 0-.655-1.089 2.534 2.534 0 0 0-.907-.81l-.145-.107c-.1-.074-.19-.16-.27-.256-.077-.09-.14-.19-.187-.299-.042-.1-.007-.182.104-.246.192-.079.399-.111.604-.096l.417.064c.373.102.723.276 1.032.512.413.288.758.667 1.01 1.109.275.533.672.99 1.156 1.333.4.289.875.448 1.364.458.398.006.796-.03 1.188-.107.323-.067.637-.175.936-.32a3.492 3.492 0 0 1 1.02-2.197c-.72-.072-1.433-.2-2.134-.384a8.39 8.39 0 0 1-1.959-.832 5.64 5.64 0 0 1-1.678-1.43 6.939 6.939 0 0 1-1.092-2.237 10.891 10.891 0 0 1-.428-3.196 6.307 6.307 0 0 1 1.647-4.396A5.863 5.863 0 0 1 8.357 6.8c.612-.101 1.24 0 1.792.288.599.228 1.18.503 1.738.821.368.227.663.42.885.576 2.618-.74 5.382-.74 8 0l.791-.512c.608-.374 1.25-.688 1.917-.938a2.672 2.672 0 0 1 1.686-.235 5.789 5.789 0 0 1 .168 4.352 6.308 6.308 0 0 1 1.646 4.396 11.016 11.016 0 0 1-.428 3.21c-.224.812-.6 1.571-1.103 2.238a5.854 5.854 0 0 1-1.687 1.42c-.617.36-1.274.64-1.959.832-.7.184-1.414.313-2.135.386.388.393.686.87.873 1.394.187.525.26 1.086.21 1.642v4.501a.869.869 0 0 0 .261.64.895.895 0 0 0 .823.148 15.694 15.694 0 0 0 7.884-5.914 16.186 16.186 0 0 0 3.048-9.655c.021-2.889-.72-5.73-2.145-8.223Z"></path></svg>,
    discord: <svg viewBox="0 0 33 32" xmlns="https://discord.gg/EQMAnz5sEF"><path d="M16.361 31.995a15.904 15.904 0 0 1-8.941-2.72A16.04 16.04 0 0 1 .689 19.224a16.158 16.158 0 0 1 0-6.448 15.908 15.908 0 0 1 2.399-5.72 16.04 16.04 0 0 1 7.049-5.793 15.91 15.91 0 0 1 3.002-.937 16.15 16.15 0 0 1 6.446 0 15.903 15.903 0 0 1 5.72 2.4 16.04 16.04 0 0 1 5.793 7.037c.411.971.725 1.981.936 3.015.433 2.127.433 4.32 0 6.448a15.909 15.909 0 0 1-2.399 5.72 16.04 16.04 0 0 1-7.037 5.794 15.91 15.91 0 0 1-6.237 1.256Zm-3.96-26.153a16.933 16.933 0 0 0-5.904.994l-.197.09a.024.024 0 0 0-.012.013l-.079.2a38.912 38.912 0 0 0-1.618 15.739l.025.233.186.144a18.106 18.106 0 0 0 8.2 3.302l.28.035h.026a.2.2 0 0 0 .186-.13l1.412-3.774a.198.198 0 0 0-.16-.266l-.433-.069a11.594 11.594 0 0 1-2.62-.728 9.743 9.743 0 0 1-2.843-1.78.048.048 0 0 1-.013-.052.048.048 0 0 1 .043-.031h.018c.15.056.32.12.48.184.361.151.731.281 1.108.39 1.917.459 3.881.693 5.853.696v-.026.036a25.315 25.315 0 0 0 5.848-.696c.377-.109.747-.24 1.109-.39.16-.063.32-.128.48-.184h.017a.047.047 0 0 1 .043.031.048.048 0 0 1-.013.052 9.7 9.7 0 0 1-2.838 1.774c-.843.343-1.723.587-2.623.726l-.433.067a.199.199 0 0 0-.16.265l1.412 3.783a.2.2 0 0 0 .185.13h.034l.281-.035a18.106 18.106 0 0 0 8.195-3.308l.185-.144.026-.234A38.913 38.913 0 0 0 26.47 7.14l-.078-.2a.024.024 0 0 0-.013-.013l-.197-.09a16.933 16.933 0 0 0-5.904-.994H18.01a.024.024 0 0 0-.022.035.024.024 0 0 0 .012.011l4.66 2.24a.023.023 0 0 1 .012.026.024.024 0 0 1-.022.02 24.503 24.503 0 0 0-12.587 0 .024.024 0 0 1-.022-.02.023.023 0 0 1 .013-.025l4.81-2.241a.024.024 0 0 0 .011-.011.023.023 0 0 0 .002-.016.024.024 0 0 0-.024-.02h-2.451Zm8.806 11.583a2.817 2.817 0 0 1-2.544-4.021c.28-.587.753-1.06 1.34-1.34.298-.143.619-.23.948-.26.085 0 .171-.01.258-.01a2.817 2.817 0 0 1 0 5.632h-.002Zm-9.735 0a2.817 2.817 0 0 1-2.544-4.021c.28-.587.753-1.06 1.34-1.34.298-.143.62-.23.948-.26.085 0 .172-.01.258-.01a2.817 2.817 0 0 1 2.55 4.021 2.844 2.844 0 0 1-1.341 1.34 2.77 2.77 0 0 1-1.21.27Z"></path></svg>,
    telegram: <svg viewBox="0 0 32 32" xmlns="https://web.telegram.org/k/#@DAOBuilder"><path d="M16 32A15.988 15.988 0 0 1 .318 19.18a16 16 0 0 1 21.7-17.999 16.004 16.004 0 0 1 .207 29.562A15.884 15.884 0 0 1 16 32.002Zm-.749-10.977 4.318 3.166a.886.886 0 0 0 .53.175.904.904 0 0 0 .883-.716l2.853-13.659a.858.858 0 0 0-.598-1h-.041a.862.862 0 0 0-.53.032L5.949 15.524A.61.61 0 0 0 6 16.68l4.243 1.262 1.6 5.035a.722.722 0 0 0 .449.467l.052.016h.192a.684.684 0 0 0 .3-.065.7.7 0 0 0 .218-.154L15.251 21v.023Z"></path></svg>,
    medium: <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z" fill="#a5a8b6"/> <path d="M11.7946 16.3039C11.8343 15.9019 11.6845 15.5046 11.3912 15.234L8.40336 11.5503V11H17.6807L24.8515 27.0952L31.1559 11H40V11.5503L37.4454 14.057C37.2251 14.2288 37.1159 14.5112 37.1615 14.7907V33.2093C37.1159 33.4888 37.2251 33.7712 37.4454 33.943L39.9402 36.4497V37H27.3912V36.4497L29.9757 33.8818C30.2297 33.622 30.2297 33.5456 30.2297 33.1481V18.2604L23.0439 36.9389H22.0728L13.7068 18.2604V30.779C13.6371 31.3053 13.8079 31.8351 14.1699 32.2158L17.5313 36.3886V36.9389H8V36.3886L11.3613 32.2158C11.7208 31.8345 11.8816 31.3011 11.7946 30.779V16.3039Z" fill="#383d51"/> </svg>,
  };

  const socialLinks = {
    twitter: "https://twitter.com/DAOBuilder_com",
    github: "",
    discord: "https://discord.gg/EQMAnz5sEF",
    telegram: "https://web.telegram.org/k/#@DAOBuilder",
    medium: "https://medium.com/@daobuilder",
  };

  return (
    <Link href={socialLinks[icon]} sx={theme => ({
      margin: '0px',
      fontFamily: 'Inter, Arial',
      fontWeight: '400',
      fontSize: '0.875rem',
      letterSpacing: '0.009375rem',
      color: 'rgb(234, 235, 239)',
      justifyContent: 'flex-start',
      alignItems: 'center',
      position: 'relative',
      textDecoration: 'none',
      boxSizing: 'border-box',
      textAlign: 'left',
      padding: '0px',
      display: 'block',
      width: 'unset',
      lineHeight: '0',    
      [theme.breakpoints.up(0)]: {
        marginRight: '26px',
      },
      [theme.breakpoints.up(960)]: {
        marginRight: '18px',
      },
    })}>
      <SvgIcon sx={theme => ({
        userSelect: 'none',
        width: '1em',
        height: '1em',
        display: 'inline-block',
        fill: 'currentcolor',
        flexShrink: '0',
        transition: 'fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        fontSize: '1.5rem',
        color: 'rgb(165, 168, 182)',
      })}>
        {icons[icon]}
      </SvgIcon>
    </Link>
  );
}

const Links = ({links}) => (
  <List key={'links-' + links.map(x => x.toLowerCase()).join('-')} sx={_ => ({
    listStyle: 'none',
    margin: '0px',
    position: 'relative',
    padding: '0px',
  })}>
    {links.map((x, i) => (
      <ListItem key={'footer-link-list-' + i}>
        <Link key={'footer-link-list-' + i + '-anchor'} component={Typography} underline="none" sx={{
          textDecoration: 'none',
          margin: '0px',
          fontWeight: '500',
          lineGHeight: '1.5rem',
          fontSize: '24px',
          letterSpacing: '1.24px',
          fontFamily: 'DIN Alternate Bold',
          color: '#636363',
        }}>{x}</Link>
      </ListItem>
    ))}
  </List>
);

export const Footer = ({}) => (
  <Box component="footer">
    <Box component="div" sx={(theme) => ({
      background: '#ECECEC',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      [theme.breakpoints.up(0)]: {
        padding: '40px 0px',
        minHeight: '280px',
      },
      [theme.breakpoints.up(640)]: {
        paddingTop: '40px',
        paddingBottom: '40px',
      },
      [theme.breakpoints.up(760)]: {
        minHeight: '210px',
        paddingTop: '66px',
        paddingBottom: '48px',
      },
      [theme.breakpoints.up(960)]: {
        padding: '0px',
        minHeight: '160px',
      },
    })}>
      <Container component="div" disableGutters sx={(theme) => ({
        [theme.breakpoints.up(1280)]: {
          justifyContent: 'space-between',
          paddingLeft: '73px',
          paddingRight: '73px',
        },
        [theme.breakpoints.up(960)]: {
          minHeight: '160px',
          paddingTop: '0px',
          paddingBottom: '0px',
          alignItems: 'center',
          flexDirection: 'row',
        },
        [theme.breakpoints.up(760)]: {
          minHeight: '210px',
          paddingTop: '66px',
          paddingBottom: '48px',
        },
        [theme.breakpoints.up(640)]: {
          paddingTop: '40px',
          paddingBottom: '40px',
        },
        [theme.breakpoints.up(0)]: {
          minHeight: '280px',
          paddingTop: '40px',
          paddingBottom: '40px',
          alignItems: 'flex start',
          flexDirection: 'column',
        },
        [theme.breakpoints.up(1440)]: {
          width: '1280px',
          padding: '0px',
        },
        marginLeft: 'auto',
        boxSizing: 'border-box',
        marginRight: 'auto',
        display: 'flex',
        height: '100%',
        width: '100%',
        background: '#ECECEC',
      })}>
        <Box sx={(theme) => ({
          [theme.breakpoints.up(960)]: {
            marginBottom: '0px',
          },
          [theme.breakpoints.up(0)]: {
            alignItems: 'center',
            marginBottom: '40px',
          },
          display: 'flex', 
        })}>
          <img src={GreyLogoSvg} alt="Logo" height={40} />
        </Box>
        <List sx={theme => ({
          listStyle: 'none',
          margin: '0px',
          position: 'relative',
          padding: '0px',
          fontSize: '24px',
          letterSpacing: '1.24px',
          fontFamily: 'DIN Alternate Bold',
          color: '#636363',
          [theme.breakpoints.up(0)]: {
            display: 'none',
            marginLeft: '0px',
          },
          [theme.breakpoints.up(760)]: {
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
          },
          [theme.breakpoints.up(960)]: {
            marginLeft: 'auto',
            width: 'auto',
          },
          [theme.breakpoints.up(1280)]: {
            justifyContent: 'flex-start',
          },
        })}>
          <ListItem sx={{whiteSpace: 'nowrap'}}>Docs</ListItem>
          <ListItem sx={{whiteSpace: 'nowrap'}}>Support</ListItem>
          <ListItem sx={{whiteSpace: 'nowrap'}}>FAQ</ListItem>
        </List>
      </Container>
    </Box>

    <Box component="div" sx={(theme) => ({
        background: 'linear-gradient(0deg, rgba(231,229,229,1) 0%, rgba(255,255,255,1) 64%, rgba(255,255,255,1) 100%)',
        [theme.breakpoints.up(960)]: {
          padding: '65px 0px 100px',
        },
        [theme.breakpoints.up(0)]: {
          padding: '40px 0px 100px',
        },
      })}
    >
      <Container disableGutters sx={theme => ({
        width: '100%',
        marginLeft: 'auto',
        boxSizing: 'border-box',
        marginRight: 'auto',
        display: 'block',
        [theme.breakpoints.up(0)]: {
          paddingLeft: '24px',
          paddingRight: '24px',
          maxWidth: '100%',
        },
        [theme.breakpoints.up(640)]: {
          paddingLeft: '32px',
          paddingRight: '32px',
        },
        [theme.breakpoints.up(960)]: {
          paddingLeft: '57px',
          paddingRight: '57px',
        },
        [theme.breakpoints.up(1280)]: {
          paddingLeft: '73px',
          paddingRight: '73px',
          maxWidth: '1280px',
        },
        [theme.breakpoints.up(1440)]: {
          width: '1280px',
          padding: '0px',
        },
      })}>
          <Box sx={theme => ({
            display: 'flex',
            justifyContent: 'space-between',
            [theme.breakpoints.up(0)]: {
              flexDirection: 'column',
            },
            [theme.breakpoints.up(960)]: {
              flexDirection: 'row',
            },
          })}>
            <Box sx={theme => ({
              flex: '1 1 0%',
              justifyContent: 'space-between',
              [theme.breakpoints.up(0)]: {
                display: 'none',
              },
              [theme.breakpoints.up(960)]: {
                display: 'flex',
              },
            })}>
              <Links links={['Docs', 'Terms of use', 'Privacy policy']} />
              <Links links={['Branding', 'Contract', 'Careers']} />
              <Links links={['Support', 'FAQ', 'Security']} />
              <Links links={['Concordium']} />
            </Box>
          </Box>
      </Container>
    </Box>
  </Box>);
