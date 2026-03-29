import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const toggleDrawer = (value: boolean) => () => {
    setOpen(value);
  };

  const menuItems = [
    { text: 'Home', href: '/' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={toggleDrawer(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Home
          </Typography>
          {!isMobile && menuItems.map((item) => (
            <Typography
              key={item.text}
              component="a"
              href={item.href}
              sx={{ color: '#fff', textDecoration: 'none', ml: 2 }}
            >
              {item.text}
            </Typography>
          ))}
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Navbar;
