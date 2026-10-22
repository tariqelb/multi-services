import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MessageIcon from '@mui/icons-material/Message';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import HomeWorkIcon from "@mui/icons-material/HomeWork";

export default function Sidebar({ sidebarOpen, setSidebarOpen, activeNav, setActiveNav }) {
  const navigate = useNavigate();

  const navigationItems = [
      { name: "Home", icon: HomeIcon, path: "/" },
      // { name: "Search", icon: SearchIcon, path: "/properties" },
      { name: "Properties", icon: HomeWorkIcon, path: "/properties" },
      { name: "Publish", icon: CloudUploadIcon, path: "/properties/publish" },
      { name: "My Publication", icon: LibraryBooksIcon, path: "/mypublication" },
      { name: "Saved", icon: BookmarkIcon, path: "/saved" },
      { name: "Alert", icon: BookmarkIcon, path: "/alert" },
      // { name: "Messages", icon: MessageIcon, path: "/" },
      { name: "Notifications", icon: NotificationsIcon, path: "/" },
      { name: "Profile", icon: PersonIcon, path: "/profile" },
      { name: "Settings", icon: SettingsIcon, path: "/" },
  ];
  return (
    <Box 
      component="aside" 
      sx={{
          width: "260px",
          minWidth: "260px",
          maxWidth: "260px",
          flex: "0 0 260px",
          flexShrink: 0,

          bgcolor: "#0d3562",
          color: "#ffffff",
          display: {
              xs: sidebarOpen ? "flex" : "none",
              md: "flex",
          },
          flexDirection: "column",
          justifyContent: "space-between",

          height: "calc(100vh - 4rem)",
          position: "sticky",
          top: "4rem",
          zIndex: 20,
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          overflow: "hidden",
      }}
    >
      <Box sx={{ overflowY: 'auto', py: 2 }}>
        <List sx={{ px: 2 }}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;
            return (
              <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => { 
                    setActiveNav(item.name); 
                    setSidebarOpen(false); 
                    if (item.path) navigate(item.path);
                  }}
                  sx={{
                    borderRadius: '12px',
                    bgcolor: isActive ? '#0284c7' : 'transparent',
                    '&:hover': {
                      bgcolor: '#14539a',
                    },
                    py: 1.5,
                  }}
                >
                  <ListItemIcon sx={{ color: '#ffffff', minWidth: '40px' }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name} 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem', 
                      fontWeight: isActive ? 600 : 400 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
          <Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: '50%' }} />
          <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 500 }}>
            All systems online
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}