// import React from 'react';
// import { Box, Typography, Card, CardActionArea, CardMedia } from '@mui/material';

// export default function CategoryCard({ title, image, width = '410px', height = '215px' }) {
//   return (
//     <Card 
//       sx={{ 
//         width: width,
//         flex: `0 0 ${width}`,
//         borderRadius: '12px', 
//         overflow: 'hidden', 
//         boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
//         border: '2px solid rgba(37, 99, 235, 0.8)',
//         transition: 'transform 0.3s ease',
//         '&:hover': { transform: 'scale(1.03)' }
//       }}
//     >
//       <CardActionArea sx={{ position: 'relative', height: height }}>
//         <CardMedia
//           component="img"
//           image={image}
//           alt={title}
//           sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
//         />
//         <Box 
//           sx={{
//             position: 'absolute',
//             bottom: 0,
//             left: 0,
//             right: 0,
//             backgroundColor: 'rgba(30, 58, 138, 0.85)',
//             py: 0.8,
//             textAlign: 'center',
//           }}
//         >
//           <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 700 }}>
//             {title}
//           </Typography>
//         </Box>
//       </CardActionArea>
//     </Card>
//   );
// }

import React from "react";
import {
    Box,
    Typography,
    Card,
    CardActionArea,
    CardMedia,
} from "@mui/material";

export default function CategoryCard({
    title,
    image,
    width = "100%",
    height = 140,
}) {
    return (
        <Card
            sx={{
                width,
                height,
                minWidth: 0,
                position: "relative",
                borderRadius: 2,
                overflow: "hidden",
                boxSizing: "border-box",
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
                transition: "box-shadow 0.25s ease, transform 0.25s ease",
                "&:hover": {
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.16)",
                    transform: "translateY(-3px)",
                },
            }}
        >
            <CardActionArea
                sx={{
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    display: "block",
                    overflow: "hidden",
                }}
            >
                <CardMedia
                    component="img"
                    image={image}
                    alt={title}
                    sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.35s ease",
                        "&:hover": {
                            transform: "scale(1.05)",
                        },
                    }}
                />

                {/* Dark gradient for readable text */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: "45% 0 0",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        px: 1,
                        pb: 1,
                        background:
                            "linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.85))",
                        boxSizing: "border-box",
                    }}
                >
                    <Typography
                        component="span"
                        sx={{
                            width: "100%",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: {
                                xs: "0.5rem",
                                sm: "0.975rem",
                            },
                            lineHeight: 1.3,
                            textAlign: "center",
                            overflowWrap: "anywhere",
                            textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                        }}
                    >
                        {title}
                    </Typography>
                </Box>
            </CardActionArea>
        </Card>
    );
}
