import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedinIcon from '@mui/icons-material/LinkedIn';
import ResumeIcon from '@mui/icons-material/Description'
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const toggleDrawer = (value: boolean) => () => {
    setOpen(value);
  };

  const menuItems = [
    { text: 'Home', href: '/' },
    { text: 'Transient', href: '/transient' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={RouterLink} to={item.href}>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ bgcolor: '#15121fff' }}>

        <Stack direction="row" justifyContent="space-between">
            <Toolbar>
              {isMobile && (
                <IconButton color="inherit" edge="start" onClick={toggleDrawer(true)} sx={{ mr: 2 }}>
                <MenuIcon />
                </IconButton>
              )}
              {!isMobile && menuItems.map((item) => (
                <Typography
                key={item.text}
                  component={RouterLink}
                  to={item.href}
                sx={{ color: '#fff', textDecoration: 'none', ml: 2, mr: 4, fontWeight: 500 }}
                >
                {item.text}
                </Typography>
              ))}
            </Toolbar>
            <Stack direction="row" sx={{ mr: 2 }}>
              <Button
                color="inherit"
                aria-label="Pages Resume"
                component="a"
                href="/AustinVanBraeckel-Resume.pdf"
                target="_blank"
                sx={{ margin: 1.5, textTransform: "none", backgroundColor: '#ffffffff', color: '#15121fff', fontWeight: 500 }}
                onClick={() => {}}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box width={3}></Box> {/* used for spacing for visual purposes */}
                  <Typography sx={{fontWeight: 500}}>Résumé</Typography>
                  <ResumeIcon />
                  <Box width={3}></Box> {/* used for spacing for visual purposes */}
                </Stack>
              </Button>
              <IconButton
                color="inherit"
                aria-label="GitHub"
                onClick={() => window.open("https://github.com/avanbraeckel", '_blank', 'noopener,noreferrer')}
              >
                <GitHubIcon />
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="LinkedIn"
                onClick={() => window.open("https://www.linkedin.com/in/austin-van-braeckel-1002b1219/", '_blank', 'noopener,noreferrer')}
              >
                <LinkedinIcon />
              </IconButton>
            </Stack>
        </Stack>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Navbar;
