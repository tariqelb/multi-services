// import React from 'react';
// import { Box, Typography, CardActionArea } from '@mui/material';
// import CategoryCard from './CategoryCard';

// export default function RealEstateOption({ onSelectCategory, listRef }) {
//   const categories = [
//     { title: 'Apartment', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500' },
//     { title: 'House', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500' },
//     { title: 'Villa', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500' },
//     { title: 'Studio', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500' },
//     { title: 'Room', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500' },
//     { title: 'Store', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500' },
//     { title: 'Office', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500' },
//     { title: 'Land', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500' },
//     { title: 'Warehouse', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500' },
//   ];

//   const handleCategoryClick = (title) => {
//     // 1. Update category filter
//     onSelectCategory?.(title);

//     // 2. Scroll smoothly to the property list section
//     if (listRef?.current) {
//       listRef.current.scrollIntoView({
//         behavior: 'smooth',
//         block: 'start',
//       });
//     }
//   };

//   return (
//     <Box sx={{ px: { xs: 2, md: 6 }, py: 4 }}>
//       <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f0e0e' }}>
//         Explore Categories
//       </Typography>
      
//       <Box
//         sx={{
//           backgroundColor: 'white',
//           padding: { xs: 3, sm: 4, md: 5 },
//           margin: { xs: 1, sm: 2, md: 3 },
//           display: 'flex',
//           flexWrap: 'wrap',
//           justifyContent: 'space-around',
//           alignItems: 'center',
//           gap: 3,
//           borderRadius: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
//           width: 'auto',
//         }}
//       >
//         {categories.map((cat, index) => (
//           <Box 
//             key={index} 
//             onClick={() => handleCategoryClick(cat.title)}
//             sx={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
//           >
//             <CategoryCard 
//               title={cat.title} 
//               image={cat.image} 
//               width="420px" 
//               height="190px" 
//             />
//           </Box>
//         ))}
//       </Box>
//     </Box>
//   );
// }

import React from "react";
import { Box, Typography } from "@mui/material";
import CategoryCard from "./CategoryCard";

export default function RealEstateOption({ onSelectCategory, listRef }) {
    const categories = [
        {
            title: "All Properties",
            image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500",
        },
        {
            title: "Apartment",
            image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500",
        },
        {
            title: "House",
            image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500",
        },
        {
            title: "Villa",
            image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500",
        },
        {
            title: "Studio",
            image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500",
        },
        {
            title: "Room",
            image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500",
        },
        {
            title: "Store",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
        },
        {
            title: "Office",
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500",
        },
        {
            title: "Land",
            image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500",
        },
        {
            title: "Warehouse",
            image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500",
        },
        {
            title: "Commercial space",
            image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500",
        },
        {
            title: "Commercial store",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
        },
        {
            title: "Garage",
            image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500",
        },
        {
            title: "other",
            image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500",
        },
    ];

    const handleCategoryClick = (title) => {
        onSelectCategory?.(title);

        if (listRef?.current) {
            listRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    return (
        <Box sx={{ px: { xs: 2, md: 6 }, py: 4, width: "100%", boxSizing: "border-box" }}>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: "#0f0e0e",
                }}
            >
                Explore Categories
            </Typography>

<Box
    sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: "8px",
        width: "100%",
        boxSizing: "border-box",
        p: 1,
        borderRadius: "16px",
        backgroundColor: "white",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    }}
>
                {categories.map((cat) => (
                    <Box
                        key={cat.title}
                        onClick={() => handleCategoryClick(cat.title)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleCategoryClick(cat.title);
                            }
                        }}
sx={{
    flex: {
        xs: "0 0 calc(50% - 4px)",
        sm: "0 0 calc(33.333% - 6px)",
        md: "0 0 calc(25% - 6px)",
        lg: "0 0 calc(14.2857% - 7px)",
    },
    minWidth: 0,
    cursor: "pointer",
    borderRadius: "8px",
    overflow: "hidden",
    boxSizing: "border-box",
    transition: "transform 0.2s ease",
    "&:hover": {
        transform: "translateY(-2px)",
    },
}}
                    >
                        <CategoryCard
                            title={cat.title}
                            image={cat.image}
                            width="80%"
                            height="100px"
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
