// ==========================================
// 1. RealEstateBanner Component (Cleaned)
// ==========================================
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import propertiesBgImage from '../assets/properties_bg_image.jpeg';
import { useNavigate } from 'react-router-dom';

export default function RealEstateBanner() {
  const navigate = useNavigate();

  return (
    <Box 
      component="section" 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '400px', 
        backgroundImage: `url(${propertiesBgImage})`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1
        }
      }}
    >
    <Box sx={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex',justifyContent: 'flex-end', flexDirection: 'column', gap: 3 }}>
        <div className="flex w-full justify-end">
                
                {/* Back Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{
                    textTransform: 'none',
                    color: '#ffffff',
                    backgroundColor: 'rgba(30, 58, 138, 0.8)',
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    '&:hover': {
                        backgroundColor: 'rgba(30, 58, 138, 1)',
                    }
                    }}
                >
                    Back to
                </Button>
            </Box>

        </div>

        {/* Main Banner Content */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Box sx={{ textAlign: 'left', color: '#ffef45', maxWidth: '600px' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.4 }}>
              Comprehensive Real Estate Platform <br />
              For Buying, Selling, and Renting Properties <br />
              Across All Cities in Morocco
            </Typography>
            <Typography variant="body1" sx={{ color: '#ffef45', fontWeight: 500 }}>
              Thousands of trusted real estate offers with ease and security.
            </Typography>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

