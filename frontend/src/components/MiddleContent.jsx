import React from 'react';
import { Box, Typography, Grid, Card, CardActionArea, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function MiddleContent({ activeNav }) {
  const navigate = useNavigate();

  const services = [
    {
      title: 'Properties',
      description: 'Buy, Sell & Rent Properties',
      details: 'Explore thousands of verified residential and commercial properties available for immediate purchase, sale, or lease in your area.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500',
      path: '/properties',
    },
    {
      title: 'Cars',
      description: 'Buy, Sell & Rent Vehicles',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500',
      details: 'Browse a wide selection of brand new and pre-owned cars, trucks, and SUVs with transparent pricing and direct owner contacts.',
    },
    {
      title: 'Services',
      description: 'Find Companies & Offices',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500',
      details: 'Connect with certified local professionals, corporate offices, agencies, and businesses ready to cater to your project requirements.',
    },
    {
      title: 'Delivery Man',
      description: 'Hire a Delivery Person',
      image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=500',
      details: 'Book reliable on-demand couriers and delivery riders for fast, secure package transport and local errand execution.',
    },
    {
      title: 'Transporter',
      description: 'Book Transport Services',
      image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=500',
      details: 'Access heavy-duty trucks, moving vans, and logistics transport providers for smooth relocation and cargo delivery.',
    },
    {
      title: 'Driver',
      description: 'Hire a Personal Driver',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=500',
      details: 'Hire professional, vetted private drivers for daily commutes, special occasions, out-of-town trips, or personal chauffeuring.',
    },
  ];

  const handleCardClick = (service) => {
    if (service.path) {
      navigate(service.path);
    }
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f9fafb', p: { xs: 3, sm: 4 }, minHeight: 'calc(100vh - 4rem)' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            {activeNav} Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
            Select a service category below to manage listings and requests.
          </Typography>
        </Box>
      </Box>

      {/* Grid Container */}
      <Grid container spacing={3} sx={{ justifyContent: 'center', alignItems: 'stretch', p: 3 }}>
        {services.map((service, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card 
              sx={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                overflow: 'hidden', 
                width: '490px',
                maxWidth: '440px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover .hover-media': {
                  filter: 'blur(4px) brightness(0.4)',
                  transform: 'scale(1.05)',
                },
                '&:hover .hover-details': {
                  opacity: 1,
                  transform: 'translateY(0)',
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleCardClick(service)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
              >
                
                {/* Image Container */}
                <Box sx={{ position: 'relative', height: 240, width: '100%', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={service.image}
                    alt={service.title}
                    className="hover-media"
                    sx={{ 
                      height: '100%', 
                      width: '100%',
                      objectFit: 'cover', 
                      transition: 'all 0.4s ease-in-out' 
                    }}
                  />
                  
                  {/* Hover Overlay Details */}
                  <Box 
                    className="hover-details"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      opacity: 0,
                      transform: 'translateY(10px)',
                      transition: 'all 0.4s ease-in-out',
                      zIndex: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500, lineHeight: 1.6 }}>
                      {service.details}
                    </Typography>
                  </Box>
                </Box>

                {/* Content Section */}
                <CardContent sx={{ width: '100%', bgcolor: 'white', p: 3.5, height: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '1.15rem' }}>
                    {service.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                    {service.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}