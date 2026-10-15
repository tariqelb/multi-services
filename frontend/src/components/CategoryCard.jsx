import React from 'react';
import { Box, Typography, Card, CardActionArea, CardMedia } from '@mui/material';

export default function CategoryCard({ title, image, width = '410px', height = '215px' }) {
  return (
    <Card 
      sx={{ 
        width: width,
        flex: `0 0 ${width}`,
        borderRadius: '12px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '2px solid rgba(37, 99, 235, 0.8)',
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'scale(1.03)' }
      }}
    >
      <CardActionArea sx={{ position: 'relative', height: height }}>
        <CardMedia
          component="img"
          image={image}
          alt={title}
          sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(30, 58, 138, 0.85)',
            py: 0.8,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}