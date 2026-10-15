import React from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Stack,
    Chip,
} from '@mui/material';

export default function PropertyInsertFormImages({
    formData,
    fileInputRef,
    handleImageChange,
    handleRemoveImage,
    SectionPaper,
    SectionHeader,
}) {
    const images = formData.images || [];

    return (
        <SectionPaper>
            <SectionHeader
                icon="📷"
                title="Property Images"
                subtitle="Make your listing stand out with quality photos."
                number={3}
            />

            <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: '2px dashed #c7d2fe',
                    borderRadius: '14px',
                    px: 2,
                    py: { xs: 4, sm: 5 },
                    textAlign: 'center',
                    bgcolor: '#f8faff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: '#6366f1',
                        bgcolor: '#f0f4ff',
                    },
                }}
            >
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '18px',
                        bgcolor: '#e8edff',
                        color: '#4f46e5',
                        fontSize: '26px',
                    }}
                >
                    📤
                </Box>

                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 750, color: '#263248', mb: 0.7 }}
                >
                    Click to upload your property images
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: '#778399', mb: 2 }}
                >
                    Select up to 15 images to showcase your property.
                </Typography>

                <Button
                    variant="outlined"
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                    sx={{
                        borderRadius: '9px',
                        textTransform: 'none',
                        fontWeight: 700,
                        borderColor: '#c7d2fe',
                        color: '#4f46e5',
                        px: 3,
                        py: 1,
                    }}
                >
                    Browse Files
                </Button>

                <Typography
                    variant="caption"
                    display="block"
                    sx={{ color: '#98a2b3', mt: 2 }}
                >
                    JPG, JPEG, PNG or WEBP · Maximum 5 MB per image
                </Typography>
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleImageChange}
            />

            {images.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 750, color: '#263248' }}
                        >
                            Selected Images
                        </Typography>

                        <Chip
                            size="small"
                            label={`${images.length}/15 images`}
                            sx={{ bgcolor: '#eef2ff', color: '#4f46e5' }}
                        />
                    </Stack>

                    <Grid container spacing={2}>
                        {images.map((image, index) => (
                            <Grid
                                size={{ xs: 6, sm: 4, md: 3 }}
                                key={`${image.file.name}-${index}`}
                            >
                                <Box
                                    sx={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={image.url}
                                        alt={image.file.name}
                                        sx={{
                                            display: 'block',
                                            width: '100%',
                                            height: 120,
                                            objectFit: 'cover',
                                        }}
                                    />

                                    <Button
                                        size="small"
                                        onClick={() => handleRemoveImage(index)}
                                        sx={{
                                            position: 'absolute',
                                            top: 5,
                                            right: 5,
                                            minWidth: 0,
                                            px: 1,
                                            bgcolor: 'rgba(255,255,255,0.95)',
                                            color: '#dc2626',
                                            fontSize: '0.7rem',
                                            '&:hover': {
                                                bgcolor: '#ffffff',
                                            },
                                        }}
                                    >
                                        Remove
                                    </Button>

                                    {index === 0 && (
                                        <Chip
                                            label="Main"
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 6,
                                                left: 6,
                                                height: 23,
                                                bgcolor: '#4f46e5',
                                                color: '#ffffff',
                                                fontWeight: 700,
                                            }}
                                        />
                                    )}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </SectionPaper>
    );
}
