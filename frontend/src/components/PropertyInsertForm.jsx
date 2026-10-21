// import React, { useRef, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import axiosInstance from '../api/axiosInstance';

// import {
//     updateField,
//     setImages,
//     setErrors,
// } from '../redux/reducers/insertProperty/propertyFormSlice';

// import {
//     Box,
//     Typography,
//     Divider,
//     Stack,
//     Chip,
//     Paper,
//     Snackbar,
//     Alert,
// } from '@mui/material';

// import PropertyInsertFormOwnerInfo from './PropertyInsertFormOwnerInfo';
// import PropertyInsertFormDetails from './PropertyInsertFormDetails';
// import PropertyInsertFormImages from './PropertyInsertFormImages';
// import PropertyInsertFormPublish from './PropertyInsertFormPublish';
// import PropertyInsertFormDescription from "./PropertyInsertFormDescription"

// // Section header
// const SectionHeader = ({ icon, title, subtitle, number }) => (
//     <Box sx={{ mb: 3 }}>
//         <Stack direction="row" spacing={1.5} alignItems="center">
//             <Box
//                 sx={{
//                     width: 44,
//                     height: 44,
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     borderRadius: '12px',
//                     bgcolor: '#eef2ff',
//                     color: '#4f46e5',
//                     flexShrink: 0,
//                     fontWeight: 700,
//                     fontSize: '1.1rem',
//                 }}
//             >
//                 {icon}
//             </Box>

//             <Box sx={{ flex: 1, minWidth: 0 }}>
//                 <Typography
//                     variant="h6"
//                     sx={{
//                         fontWeight: 750,
//                         color: '#172033',
//                         fontSize: '1.08rem',
//                     }}
//                 >
//                     {title}
//                 </Typography>

//                 <Typography
//                     variant="body2"
//                     sx={{ color: '#7b8497', mt: 0.3 }}
//                 >
//                     {subtitle}
//                 </Typography>
//             </Box>

//             <Chip
//                 label={`0${number}`}
//                 size="small"
//                 sx={{
//                     fontWeight: 700,
//                     color: '#4f46e5',
//                     bgcolor: '#f3f4ff',
//                     borderRadius: '8px',
//                 }}
//             />
//         </Stack>

//         <Divider sx={{ mt: 2.5, borderColor: '#edf0f5' }} />
//     </Box>
// );

// // Section container
// const SectionPaper = ({ children }) => (
//     <Paper
//         elevation={0}
//         sx={{
//             p: { xs: 2.5, sm: 3.5, md: 4 },
//             mb: 3,
//             border: '1px solid #e9edf4',
//             borderRadius: '16px',
//             bgcolor: '#ffffff',
//             boxShadow: '0 3px 12px rgba(15, 23, 42, 0.025)',
//         }}
//     >
//         {children}
//     </Paper>
// );

// export default function PropertyInsertForm({ onAddProperty }) {
//     const dispatch = useDispatch();

//     const formData = useSelector(
//         (state) => state.propertyForm.formData
//     );

//     const errors = useSelector(
//         (state) => state.propertyForm.errors
//     );

//     const [loading, setLoading] = useState(false);

//     const [notification, setNotification] = useState({
//         open: false,
//         message: '',
//         severity: 'success',
//     });

//     const fileInputRef = useRef(null);

//     const propertyTypes = [
//         'Apartment',
//         'House',
//         'Villa',
//         'Studio',
//         'Room',
//         'Store',
//         'Office',
//         'Land',
//         'Warehouse',
//     ];

//     const fieldSx = {
//         '& .MuiOutlinedInput-root': {
//             borderRadius: '10px',
//             backgroundColor: '#ffffff',
//             transition: 'all 0.2s ease',
//             '& fieldset': {
//                 borderColor: '#dfe3eb',
//             },
//             '&:hover fieldset': {
//                 borderColor: '#93a9f9',
//             },
//             '&.Mui-focused fieldset': {
//                 borderColor: '#4f46e5',
//                 borderWidth: '1.5px',
//             },
//         },
//         '& .MuiInputLabel-root.Mui-focused': {
//             color: '#4f46e5',
//         },
//     };

//     // Update Redux form fields
//     const handleChange = (e) => {
//         dispatch(
//             updateField({
//                 name: e.target.name,
//                 value: e.target.value,
//             })
//         );
//     };

//     const handleRoleChange = (_, value) => {
//         if (value !== null) {
//             dispatch(updateField({ name: 'role', value }));
//         }
//     };

//     const handleListingTypeChange = (_, value) => {
//         if (value !== null) {
//             dispatch(updateField({ name: 'listingType', value }));
//         }
//     };

//     // Select and validate images
//     const handleImageChange = (e) => {
//         const selectedFiles = Array.from(e.target.files || []);
//         const currentImages = formData.images || [];

//         console.log(
//             '[Frontend] Files selected:',
//             selectedFiles.map((file) => ({
//                 name: file.name,
//                 type: file.type,
//                 size: file.size,
//             }))
//         );

//         const validFiles = selectedFiles.filter(
//             (file) =>
//                 ['image/jpeg', 'image/png', 'image/webp'].includes(
//                     file.type
//                 ) &&
//                 file.size <= 5 * 1024 * 1024
//         );

//         const remaining = Math.max(0, 15 - currentImages.length);
//         const newImages = validFiles
//             .slice(0, remaining)
//             .map((file) => ({
//                 file,
//                 url: URL.createObjectURL(file),
//             }));

//         if (selectedFiles.length !== validFiles.length) {
//             setNotification({
//                 open: true,
//                 message:
//                     'Some images were rejected. Use JPG, PNG, or WEBP images up to 5 MB each.',
//                 severity: 'warning',
//             });
//         }

//         if (validFiles.length > remaining) {
//             setNotification({
//                 open: true,
//                 message: 'You can upload a maximum of 15 images.',
//                 severity: 'warning',
//             });
//         }

//         console.log(
//             '[Frontend] Valid images:',
//             newImages.map(({ file }) => ({
//                 name: file.name,
//                 type: file.type,
//                 size: file.size,
//             }))
//         );

//         dispatch(setImages([...currentImages, ...newImages]));

//         // Allow selecting the same file again.
//         e.target.value = '';
//     };

//     // Remove an image from the selected list
//     const handleRemoveImage = (index) => {
//         const image = (formData.images || [])[index];

//         if (image?.url) {
//             URL.revokeObjectURL(image.url);
//         }

//         dispatch(
//             setImages(
//                 (formData.images || []).filter(
//                     (_, imageIndex) => imageIndex !== index
//                 )
//             )
//         );
//     };

//     // Validate and submit the property
//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (loading) return;

//         const validationErrors = {};

//         const requiredFields = [
//             'firstName',
//             'lastName',
//             'phone',
//             'title',
//             'listingType',
//             'propertyType',
//             'city',
//             'price',
//             'surface',
//         ];

//         requiredFields.forEach((key) => {
//             if (!String(formData[key] ?? '').trim()) {
//                 validationErrors[key] = 'This field is required';
//             }
//         });

//         const numericFields = [
//             'price',
//             'surface',
//             'rooms',
//             'salons',
//             'bathrooms',
//             'floor',
//             'syndicateFees',
//         ];

//         numericFields.forEach((key) => {
//             const value = formData[key];

//             if (value === '' || value === null || value === undefined) {
//                 if (key === 'price' || key === 'surface') {
//                     validationErrors[key] = 'This field is required';
//                 }
//                 return;
//             }

//             const number = Number(value);

//             if (!Number.isFinite(number) || number < 0) {
//                 validationErrors[key] =
//                     'Enter a valid non-negative number';
//             } else if (key === 'surface' && number <= 0) {
//                 validationErrors[key] =
//                     'Surface must be greater than zero';
//             }
//         });

//         if (
//             formData.email &&
//             !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
//         ) {
//             validationErrors.email = 'Enter a valid email address';
//         }

//         if (formData.mapLink) {
//             try {
//                 const url = new URL(formData.mapLink);

//                 if (!['http:', 'https:'].includes(url.protocol)) {
//                     throw new Error('Invalid URL protocol');
//                 }
//             } catch {
//                 validationErrors.mapLink = 'Enter a valid map URL';
//             }
//         }

//         if ((formData.images || []).length > 15) {
//             validationErrors.images = 'Maximum 15 images allowed';
//         }

//         dispatch(setErrors(validationErrors));

//         if (Object.keys(validationErrors).length > 0) {
//             console.warn(
//                 '[Frontend] Validation errors:',
//                 validationErrors
//             );

//             setNotification({
//                 open: true,
//                 message: 'Please correct the highlighted fields.',
//                 severity: 'error',
//             });

//             return;
//         }

//         // Check the selected images in Redux.
//         console.log(
//             '[Frontend] Images in Redux before submission:',
//             (formData.images || []).map((image) => ({
//                 name: image?.file?.name,
//                 type: image?.file?.type,
//                 size: image?.file?.size,
//                 isFile: image?.file instanceof File,
//             }))
//         );

//         // Build multipart FormData.
//         const payload = new FormData();

//         Object.entries(formData).forEach(([key, value]) => {
//             if (key === 'images') {
//                 (value || []).forEach((image) => {
//                     if (image?.file instanceof File) {
//                         payload.append('images', image.file);

//                         console.log('[Frontend] Appended image:', {
//                             name: image.file.name,
//                             type: image.file.type,
//                             size: image.file.size,
//                         });
//                     } else {
//                         console.warn(
//                             '[Frontend] Skipped invalid image:',
//                             image
//                         );
//                     }
//                 });
//             } else if (value !== null && value !== undefined) {
//                 payload.append(key, String(value));
//             }
//         });

//         // FormData is best inspected through its entries.
//         console.log(
//             '[Frontend] Final FormData entries:',
//             [...payload.entries()].map(([key, value]) => [
//                 key,
//                 value instanceof File
//                     ? {
//                           name: value.name,
//                           type: value.type,
//                           size: value.size,
//                       }
//                     : value,
//             ])
//         );

//         console.log(
//             '[Frontend] Number of image files in FormData:',
//             payload.getAll('images').length
//         );

//         try {
//             setLoading(true);

//             console.log(
//                 '[Frontend] Sending POST /property/insert'
//             );

//             // Do not manually set Content-Type for FormData.
//             // The browser/Axios should generate the multipart boundary.
//             const response = await axiosInstance.post(
//                 '/property/insert',
//                 payload
//             );

//             console.log(
//                 '[Frontend] Property created:',
//                 response.data
//             );

//             setNotification({
//                 open: true,
//                 message:
//                     response.data?.message ||
//                     'Property published successfully!',
//                 severity: 'success',
//             });

//             // Optional callback if the parent needs the new property.
//             if (typeof onAddProperty === 'function') {
//                 onAddProperty(response.data.property);
//             }
//         } catch (error) {
//             console.error(
//                 '[Frontend] Failed to publish property:',
//                 {
//                     message: error.message,
//                     status: error.response?.status,
//                     response: error.response?.data,
//                 }
//             );

//             setNotification({
//                 open: true,
//                 message:
//                     error.response?.data?.message ||
//                     'Failed to publish property. Please try again.',
//                 severity: 'error',
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="flex bg-gray-100/70 m-9 border-[1px] border-gray-200 rounded-[15px]">
//             <Box
//                 sx={{
//                     width: '100%',
//                     maxWidth: 1100,
//                     mx: 'auto',
//                     py: { xs: 2, md: 4 },
//                     px: { xs: 1, sm: 2 },
//                 }}
//             >
//                 {/* Page heading */}
//                 <Box sx={{ mb: 4, px: { xs: 1, sm: 0 } }}>
//                     <Stack
//                         direction="row"
//                         alignItems="center"
//                         spacing={1}
//                         sx={{ mb: 1.5 }}
//                     >
//                         <Chip
//                             label="PROPERTY MARKETPLACE"
//                             size="small"
//                             sx={{
//                                 bgcolor: '#eef2ff',
//                                 color: '#4f46e5',
//                                 fontWeight: 750,
//                                 fontSize: '0.68rem',
//                                 letterSpacing: '0.6px',
//                                 borderRadius: '6px',
//                             }}
//                         />
//                     </Stack>

//                     <Typography
//                         variant="h4"
//                         sx={{
//                             fontWeight: 800,
//                             letterSpacing: '-0.8px',
//                             color: '#172033',
//                             fontSize: {
//                                 xs: '1.8rem',
//                                 sm: '2.25rem',
//                             },
//                             mb: 1,
//                         }}
//                     >
//                         Publish a Property
//                     </Typography>

//                     <Typography
//                         variant="body1"
//                         sx={{
//                             color: '#737e91',
//                             maxWidth: 650,
//                             lineHeight: 1.8,
//                         }}
//                     >
//                         Add your property details, provide accurate contact
//                         information, and showcase your property to potential
//                         buyers and tenants.
//                     </Typography>

//                     <Stack
//                         direction="row"
//                         spacing={1}
//                         alignItems="center"
//                         sx={{ mt: 2 }}
//                     >
//                         <Box
//                             component="span"
//                             sx={{
//                                 color: '#10b981',
//                                 fontWeight: 700,
//                                 fontSize: '1.1rem',
//                             }}
//                         >
//                             ✓
//                         </Box>

//                         <Typography
//                             variant="caption"
//                             sx={{ color: '#64748b' }}
//                         >
//                             Fields marked with * are required
//                         </Typography>
//                     </Stack>
//                 </Box>

//                 {/* Property form */}
//                 <Box component="form" onSubmit={handleSubmit}>
//                     <PropertyInsertFormOwnerInfo
//                         formData={formData}
//                         errors={errors}
//                         handleChange={handleChange}
//                         handleRoleChange={handleRoleChange}
//                         fieldSx={fieldSx}
//                         SectionPaper={SectionPaper}
//                         SectionHeader={SectionHeader}
//                     />

//                     <PropertyInsertFormDetails
//                         formData={formData}
//                         errors={errors}
//                         handleChange={handleChange}
//                         handleListingTypeChange={handleListingTypeChange}
//                         propertyTypes={propertyTypes}
//                         fieldSx={fieldSx}
//                         SectionPaper={SectionPaper}
//                         SectionHeader={SectionHeader}
//                     />
//                     <PropertyInsertFormDescription
//                         formData={formData}
//                         errors={errors}
//                         handleChange={handleChange}
//                         fieldSx={fieldSx}
//                         SectionPaper={SectionPaper}
//                         SectionHeader={SectionHeader}
//                     />
//                     <PropertyInsertFormImages
//                         formData={formData}
//                         fileInputRef={fileInputRef}
//                         handleImageChange={handleImageChange}
//                         handleRemoveImage={handleRemoveImage}
//                         SectionPaper={SectionPaper}
//                         SectionHeader={SectionHeader}
//                     />

//                     <PropertyInsertFormPublish loading={loading} />
//                 </Box>
//             </Box>

//             {/* Success and error notifications */}
//             <Snackbar
//                 open={notification.open}
//                 autoHideDuration={5000}
//                 onClose={() =>
//                     setNotification((previous) => ({
//                         ...previous,
//                         open: false,
//                     }))
//                 }
//                 anchorOrigin={{
//                     vertical: 'top',
//                     horizontal: 'right',
//                 }}
//             >
//                 <Alert
//                     severity={notification.severity}
//                     variant="filled"
//                     onClose={() =>
//                         setNotification((previous) => ({
//                             ...previous,
//                             open: false,
//                         }))
//                     }
//                     sx={{ width: '100%' }}
//                 >
//                     {notification.message}
//                 </Alert>
//             </Snackbar>
//         </div>
//     );
// }
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../api/axiosInstance";

import {
    updateField,
    setImages,
    setErrors,
} from "../redux/reducers/insertProperty/propertyFormSlice";

import {
    Box,
    Typography,
    Divider,
    Stack,
    Chip,
    Paper,
    Snackbar,
    Alert,
} from "@mui/material";

import PropertyInsertFormOwnerInfo from "./PropertyInsertFormOwnerInfo";
import PropertyInsertFormDetails from "./PropertyInsertFormDetails";
import PropertyInsertFormImages from "./PropertyInsertFormImages";
import PropertyInsertFormPublish from "./PropertyInsertFormPublish";
import PropertyInsertFormDescription from "./PropertyInsertFormDescription";

// Section header
const SectionHeader = ({ icon, title, subtitle, number }) => (
    <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "12px",
                    bgcolor: "#eef2ff",
                    color: "#4f46e5",
                    flexShrink: 0,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                }}
            >
                {icon}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 750,
                        color: "#172033",
                        fontSize: "1.08rem",
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#7b8497", mt: 0.3 }}
                >
                    {subtitle}
                </Typography>
            </Box>

            <Chip
                label={`0${number}`}
                size="small"
                sx={{
                    fontWeight: 700,
                    color: "#4f46e5",
                    bgcolor: "#f3f4ff",
                    borderRadius: "8px",
                }}
            />
        </Stack>

        <Divider sx={{ mt: 2.5, borderColor: "#edf0f5" }} />
    </Box>
);

// Section container
const SectionPaper = ({ children }) => (
    <Paper
        elevation={0}
        sx={{
            p: { xs: 2.5, sm: 3.5, md: 4 },
            mb: 3,
            border: "1px solid #e9edf4",
            borderRadius: "16px",
            bgcolor: "#ffffff",
            boxShadow: "0 3px 12px rgba(15, 23, 42, 0.025)",
        }}
    >
        {children}
    </Paper>
);

export default function PropertyInsertForm({ onAddProperty }) {
    const dispatch = useDispatch();

    const formData = useSelector(
        (state) => state.propertyForm.formData
    );

    const errors = useSelector(
        (state) => state.propertyForm.errors
    );

    const [loading, setLoading] = useState(false);

    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const fileInputRef = useRef(null);

    const propertyTypes = [
        "Apartment",
        "House",
        "Villa",
        "Studio",
        "Room",
        "Store",
        "Office",
        "Land",
        "Warehouse",
        "Commercial space",
        "Commercial store",
        "Garage",
        "other",

    ];

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            transition: "all 0.2s ease",
            "& fieldset": {
                borderColor: "#dfe3eb",
            },
            "&:hover fieldset": {
                borderColor: "#93a9f9",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#4f46e5",
                borderWidth: "1.5px",
            },
        },
        "& .MuiInputLabel-root.Mui-focused": {
            color: "#4f46e5",
        },
    };

    // Update Redux form fields, including checkbox values.
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        dispatch(
            updateField({
                name,
                value: type === "checkbox" ? checked : value,
            })
        );
    };

    const handleRoleChange = (_, value) => {
        if (value !== null) {
            dispatch(
                updateField({
                    name: "role",
                    value,
                })
            );
        }
    };

    const handleListingTypeChange = (_, value) => {
        if (value !== null) {
            dispatch(
                updateField({
                    name: "listingType",
                    value,
                })
            );
        }
    };

    // Select and validate images.
    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const currentImages = formData.images || [];

        const validFiles = selectedFiles.filter(
            (file) =>
                ["image/jpeg", "image/png", "image/webp"].includes(
                    file.type
                ) &&
                file.size <= 5 * 1024 * 1024
        );

        const remaining = Math.max(0, 15 - currentImages.length);

        const newImages = validFiles
            .slice(0, remaining)
            .map((file) => ({
                file,
                url: URL.createObjectURL(file),
            }));

        if (selectedFiles.length !== validFiles.length) {
            setNotification({
                open: true,
                message:
                    "Some images were rejected. Use JPG, PNG, or WEBP images up to 5 MB each.",
                severity: "warning",
            });
        }

        if (validFiles.length > remaining) {
            setNotification({
                open: true,
                message: "You can upload a maximum of 15 images.",
                severity: "warning",
            });
        }

        dispatch(setImages([...currentImages, ...newImages]));

        // Allow selecting the same file again.
        e.target.value = "";
    };

    // Remove an image from the selected list.
    const handleRemoveImage = (index) => {
        const image = (formData.images || [])[index];

        if (image?.url) {
            URL.revokeObjectURL(image.url);
        }

        dispatch(
            setImages(
                (formData.images || []).filter(
                    (_, imageIndex) => imageIndex !== index
                )
            )
        );
    };

    // Validate and submit the property.
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const validationErrors = {};

        const requiredFields = [
            "firstName",
            "lastName",
            "phone",
            "title",
            "listingType",
            "propertyType",
            "city",
            "price",
            "surface",
        ];

        requiredFields.forEach((key) => {
            if (!String(formData[key] ?? "").trim()) {
                validationErrors[key] = "This field is required";
            }
        });

        // Validate numeric fields, including rental costs.
        const numericFields = [
            "price",
            "surface",
            "rooms",
            "salons",
            "bathrooms",
            "floor",
            "syndicateFees",
            "deposit",
            "mediatorFee",
        ];

        numericFields.forEach((key) => {
            const value = formData[key];

            if (
                value === "" ||
                value === null ||
                value === undefined
            ) {
                if (key === "price" || key === "surface") {
                    validationErrors[key] = "This field is required";
                }
                return;
            }

            const number = Number(value);

            if (!Number.isFinite(number) || number < 0) {
                validationErrors[key] =
                    "Enter a valid non-negative number";
            } else if (key === "surface" && number <= 0) {
                validationErrors[key] =
                    "Surface must be greater than zero";
            }
        });

        if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            validationErrors.email = "Enter a valid email address";
        }

        if (formData.mapLink) {
            try {
                const url = new URL(formData.mapLink);

                if (!["http:", "https:"].includes(url.protocol)) {
                    throw new Error("Invalid URL protocol");
                }
            } catch {
                validationErrors.mapLink = "Enter a valid map URL";
            }
        }

        if ((formData.images || []).length > 15) {
            validationErrors.images = "Maximum 15 images allowed";
        }

        dispatch(setErrors(validationErrors));

        if (Object.keys(validationErrors).length > 0) {
            setNotification({
                open: true,
                message: "Please correct the highlighted fields.",
                severity: "error",
            });
            return;
        }

        // Provide defaults for the new rental fields.
        const submissionData = {
            ...formData,
            rentWithContract: formData.rentWithContract ?? false,
            mortgageAgreement: formData.mortgageAgreement ?? false,
            deposit: formData.deposit ?? 0,
            mediatorFee: formData.mediatorFee ?? 0,
        };

        // Build multipart FormData.
        const payload = new FormData();

        Object.entries(submissionData).forEach(([key, value]) => {
            if (key === "images") {
                (value || []).forEach((image) => {
                    if (image?.file instanceof File) {
                        payload.append("images", image.file);
                    }
                });
            } else if (value !== null && value !== undefined) {
                payload.append(key, String(value));
            }
        });

        try {
            setLoading(true);

            const response = await axiosInstance.post(
                "/property/insert",
                payload
            );

            setNotification({
                open: true,
                message:
                    response.data?.message ||
                    "Property published successfully!",
                severity: "success",
            });

            if (typeof onAddProperty === "function") {
                onAddProperty(response.data?.property);
            }
        } catch (error) {
            console.error("[Frontend] Failed to publish property:", {
                message: error.message,
                status: error.response?.status,
                response: error.response?.data,
            });

            setNotification({
                open: true,
                message:
                    error.response?.data?.message ||
                    "Failed to publish property. Please try again.",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-100/70 m-9 border-[1px] border-gray-200 rounded-[15px]">
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 1100,
                    mx: "auto",
                    py: { xs: 2, md: 4 },
                    px: { xs: 1, sm: 2 },
                }}
            >
                {/* Page heading */}
                <Box sx={{ mb: 4, px: { xs: 1, sm: 0 } }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1.5 }}
                    >
                        <Chip
                            label="PROPERTY MARKETPLACE"
                            size="small"
                            sx={{
                                bgcolor: "#eef2ff",
                                color: "#4f46e5",
                                fontWeight: 750,
                                fontSize: "0.68rem",
                                letterSpacing: "0.6px",
                                borderRadius: "6px",
                            }}
                        />
                    </Stack>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: "-0.8px",
                            color: "#172033",
                            fontSize: {
                                xs: "1.8rem",
                                sm: "2.25rem",
                            },
                            mb: 1,
                        }}
                    >
                        Publish a Property
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: "#737e91",
                            maxWidth: 650,
                            lineHeight: 1.8,
                        }}
                    >
                        Add your property details, provide accurate contact
                        information, and showcase your property to potential
                        buyers and tenants.
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 2 }}
                    >
                        <Box
                            component="span"
                            sx={{
                                color: "#10b981",
                                fontWeight: 700,
                                fontSize: "1.1rem",
                            }}
                        >
                            ✓
                        </Box>

                        <Typography
                            variant="caption"
                            sx={{ color: "#64748b" }}
                        >
                            Fields marked with * are required
                        </Typography>
                    </Stack>
                </Box>

                {/* Property form */}
                <Box component="form" onSubmit={handleSubmit}>
                    <PropertyInsertFormOwnerInfo
                        formData={formData}
                        errors={errors}
                        handleChange={handleChange}
                        handleRoleChange={handleRoleChange}
                        fieldSx={fieldSx}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormDetails
                        formData={formData}
                        errors={errors}
                        handleChange={handleChange}
                        handleListingTypeChange={handleListingTypeChange}
                        propertyTypes={propertyTypes}
                        fieldSx={fieldSx}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormDescription
                        formData={formData}
                        errors={errors}
                        handleChange={handleChange}
                        fieldSx={fieldSx}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormImages
                        formData={formData}
                        fileInputRef={fileInputRef}
                        handleImageChange={handleImageChange}
                        handleRemoveImage={handleRemoveImage}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormPublish loading={loading} />
                </Box>
            </Box>

            {/* Success and error notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={() =>
                    setNotification((previous) => ({
                        ...previous,
                        open: false,
                    }))
                }
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    onClose={() =>
                        setNotification((previous) => ({
                            ...previous,
                            open: false,
                        }))
                    }
                    sx={{ width: "100%" }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </div>
    );
}
