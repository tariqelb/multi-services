
// import { useCallback, useEffect, useState } from "react";
// import {
//     Alert,
//     Box,
//     Card,
//     CardContent,
//     CircularProgress,
//     Pagination,
//     Stack,
//     Typography,
// } from "@mui/material";

// import {
//     ResponsiveContainer,
//     BarChart,
//     Bar,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
// } from "recharts";

// import axiosInstance from "../../../api/axiosInstance";
// import { useNavigate } from "react-router-dom";

// const API_URL = "/property/clicks";

// const COLORS = {
//     primary: "#064e3b",
//     green: "#059669",
//     lightGreen: "#d1fae5",
//     border: "#e5e7eb",
// };



// function SummaryCard({ title, value, icon, subtitle }) {
//     return (
//         <Card
//             elevation={0}
//             sx={{
//                 width: "100%",
//                 minWidth: 0,
//                 border: `1px solid ${COLORS.border}`,
//                 borderRadius: 2.5,
//                 background: "#fff",
//                 transition: "all 0.2s ease",
//                 "&:hover": {
//                     borderColor: COLORS.green,
//                     boxShadow: "0 5px 18px rgba(6, 78, 59, 0.07)",
//                     transform: "translateY(-2px)",
//                 },
//             }}
//         >
//             <CardContent
//                 sx={{
//                     p: { xs: 2, md: 2.5 },
//                     "&:last-child": { pb: { xs: 2, md: 2.5 } },
//                 }}
//             >
//                 <Stack
//                     direction="row"
//                     alignItems="center"
//                     spacing={2}
//                 >
//                     {/* Icon */}
//                     <Box
//                         sx={{
//                             width: 52,
//                             height: 52,
//                             minWidth: 52,
//                             borderRadius: 2,
//                             bgcolor: "#ecfdf5",
//                             color: COLORS.primary,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             fontSize: "1.5rem",
//                             fontWeight: 800,
//                         }}
//                     >
//                         {icon}
//                     </Box>

//                     {/* Information */}
//                     <Box minWidth={0} flex={1}>
//                         <Typography
//                             color="text.secondary"
//                             fontWeight={600}
//                             fontSize="0.82rem"
//                             noWrap
//                         >
//                             {title}
//                         </Typography>

//                         <Typography
//                             fontWeight={900}
//                             color={COLORS.primary}
//                             sx={{
//                                 fontSize: {
//                                     xs: "1.45rem",
//                                     md: "1.75rem",
//                                 },
//                                 lineHeight: 1.4,
//                             }}
//                         >
//                             {Number(value || 0).toLocaleString()}
//                         </Typography>

//                         {subtitle && (
//                             <Typography
//                                 color="text.secondary"
//                                 fontSize="0.72rem"
//                                 noWrap
//                             >
//                                 {subtitle}
//                             </Typography>
//                         )}
//                     </Box>
//                 </Stack>
//             </CardContent>
//         </Card>
//     );
// }


// function AnalyticsChart({ title, data, description }) {
//     return (
//         <Card
//             elevation={0}
//             sx={{
//                 width: "100%",
//                 minWidth: 0,
//                 height: 390,
//                 border: `1px solid ${COLORS.border}`,
//                 borderRadius: 3,
//                 overflow: "hidden",
//             }}
//         >
//             <CardContent
//                 sx={{
//                     p: { xs: 2, md: 3 },
//                     height: "100%",
//                     display: "flex",
//                     flexDirection: "column",
//                     "&:last-child": { pb: 3 },
//                 }}
//             >
//                 <Box mb={2}>
//                     <Typography
//                         fontWeight={800}
//                         fontSize="1rem"
//                         color="#1e293b"
//                     >
//                         {title}
//                     </Typography>

//                     <Typography
//                         variant="body2"
//                         color="text.secondary"
//                         mt={0.5}
//                         fontSize="0.8rem"
//                     >
//                         {description}
//                     </Typography>
//                 </Box>

//                 <Box
//                     sx={{
//                         width: "100%",
//                         minWidth: 0,
//                         flex: 1,
//                         minHeight: 0,
//                     }}
//                 >
//                     {data?.length ? (
//                         <ResponsiveContainer
//                             width="100%"
//                             height="100%"
//                             minWidth={0}
//                         >
//                             <BarChart
//                                 data={data}
//                                 margin={{
//                                     top: 15,
//                                     right: 15,
//                                     left: -15,
//                                     bottom: 35,
//                                 }}
//                             >
//                                 <CartesianGrid
//                                     strokeDasharray="3 3"
//                                     vertical={false}
//                                     stroke="#e2e8f0"
//                                 />

//                                 <XAxis
//                                     dataKey="name"
//                                     interval={0}
//                                     angle={-25}
//                                     textAnchor="end"
//                                     height={65}
//                                     tick={{
//                                         fontSize: 11,
//                                         fill: "#64748b",
//                                     }}
//                                     axisLine={{ stroke: "#cbd5e1" }}
//                                     tickLine={false}
//                                 />

//                                 <YAxis
//                                     allowDecimals={false}
//                                     tick={{
//                                         fontSize: 11,
//                                         fill: "#64748b",
//                                     }}
//                                     axisLine={false}
//                                     tickLine={false}
//                                     width={35}
//                                 />

//                                 <Tooltip
//                                     cursor={{ fill: "#f0fdf4" }}
//                                     contentStyle={{
//                                         borderRadius: 10,
//                                         border: "1px solid #e5e7eb",
//                                         boxShadow:
//                                             "0 4px 15px rgba(0,0,0,0.08)",
//                                         fontSize: "0.85rem",
//                                     }}
//                                     formatter={(value) => [
//                                         `${value} clicks`,
//                                         "Clicks",
//                                     ]}
//                                 />

//                                 <Bar
//                                     dataKey="clicks"
//                                     fill={COLORS.green}
//                                     radius={[6, 6, 0, 0]}
//                                     maxBarSize={55}
//                                 />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     ) : (
//                         <Box
//                             height="100%"
//                             display="flex"
//                             alignItems="center"
//                             justifyContent="center"
//                         >
//                             <Typography
//                                 color="text.secondary"
//                                 fontSize="0.9rem"
//                             >
//                                 No click data available yet.
//                             </Typography>
//                         </Box>
//                     )}
//                 </Box>
//             </CardContent>
//         </Card>
//     );
// }



// function PropertyClickCard({ property }) {
//     const navigate = useNavigate();

//     const formatDate = (date) => {
//         if (!date) return "Unknown";

//         const parsedDate = new Date(date);

//         return Number.isNaN(parsedDate.getTime())
//             ? "Unknown"
//             : parsedDate.toLocaleString();
//     };

//     const formatPrice = (price) => {
//         if (price == null) return "Not specified";

//         return `${Number(price).toLocaleString()} MAD`;
//     };

//     const details = [
//         {
//             label: "Property type",
//             value: property.propertyType || "Unknown",
//         },
//         {
//             label: "Listing type",
//             value: property.listingType || "Unknown",
//         },
//         {
//             label: "City",
//             value: property.city || "Unknown",
//         },
//         {
//             label: "Neighborhood",
//             value: property.neighborhood || "Unknown",
//         },
//         {
//             label: "Price",
//             value: formatPrice(property.price),
//         },
//         {
//             label: "First click",
//             value: formatDate(property.firstClickedAt),
//         },
//         {
//             label: "Last click",
//             value: formatDate(property.lastClickedAt),
//         },
//         {
//             label: "Last clicked by",
//             value: property.lastClickedBy || "Guest / anonymous",
//         },
//     ];

//     const handleClick = () => {
//         navigate(`/properties/${property.propertyId}`);
//     };

//     return (
//         <Card
//             elevation={0}
//             onClick={handleClick}
//             sx={{
//                 width: "100%",
//                 minWidth: 0,
//                 height: "100%",
//                 border: `1px solid ${COLORS.border}`,
//                 borderRadius: 2.5,
//                 cursor: "pointer",
//                 transition: "all 0.2s ease",
//                 "&:hover": {
//                     borderColor: COLORS.green,
//                     transform: "translateY(-3px)",
//                     boxShadow: "0 6px 20px rgba(6, 78, 59, 0.09)",
//                 },
//             }}
//         >
//             <CardContent
//                 sx={{
//                     p: 2.5,
//                     "&:last-child": { pb: 2.5 },
//                 }}
//             >
//                 {/* Header */}
//                 <Stack
//                     direction="row"
//                     alignItems="center"
//                     spacing={2}
//                 >
//                     <Box
//                         sx={{
//                             width: 44,
//                             height: 44,
//                             flexShrink: 0,
//                             borderRadius: 2,
//                             bgcolor: "#ecfdf5",
//                             color: COLORS.primary,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             fontSize: "1.35rem",
//                         }}
//                     >
//                         ⌂
//                     </Box>

//                     <Box minWidth={0} flex={1}>
//                         <Typography
//                             fontWeight={800}
//                             fontSize="0.95rem"
//                             color="#1e293b"
//                             sx={{
//                                 overflowWrap: "anywhere",
//                                 lineHeight: 1.4,
//                             }}
//                         >
//                             {property.title || "Untitled property"}
//                         </Typography>

//                         <Typography
//                             color="text.secondary"
//                             fontSize="0.78rem"
//                             mt={0.4}
//                             noWrap
//                         >
//                             {property.city || "Unknown city"}
//                             {property.neighborhood
//                                 ? ` · ${property.neighborhood}`
//                                 : ""}
//                         </Typography>
//                     </Box>
//                 </Stack>

//                 {/* Click statistics */}
//                 <Box
//                     sx={{
//                         mt: 2.5,
//                         p: 2,
//                         borderRadius: 2,
//                         bgcolor: "#ecfdf5",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                     }}
//                 >
//                     <Box>
//                         <Typography
//                             color="#065f46"
//                             fontWeight={800}
//                             fontSize="0.78rem"
//                         >
//                             Total engagement
//                         </Typography>

//                         <Typography
//                             color="#064e3b"
//                             fontWeight={900}
//                             fontSize="1.6rem"
//                             lineHeight={1.4}
//                         >
//                             {Number(
//                                 property.clickCount || 0
//                             ).toLocaleString()}
//                         </Typography>
//                     </Box>

//                     <Typography
//                         color="#059669"
//                         fontWeight={800}
//                         fontSize="0.85rem"
//                     >
//                         {Number(property.clickCount) === 1
//                             ? "Click"
//                             : "Clicks"}
//                     </Typography>
//                 </Box>

//                 {/* Property information */}
//                 <Box
//                     sx={{
//                         mt: 2,
//                         display: "grid",
//                         gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
//                         columnGap: 2,
//                         rowGap: 2,
//                     }}
//                 >
//                     {details.map((item) => (
//                         <Box key={item.label} minWidth={0}>
//                             <Typography
//                                 color="#334155"
//                                 fontSize="0.73rem"
//                                 fontWeight={800}
//                                 mb={0.4}
//                             >
//                                 {item.label}
//                             </Typography>

//                             <Typography
//                                 color="text.secondary"
//                                 fontWeight={400}
//                                 fontSize="0.8rem"
//                                 sx={{
//                                     overflowWrap: "anywhere",
//                                     lineHeight: 1.5,
//                                 }}
//                             >
//                                 {item.value}
//                             </Typography>
//                         </Box>
//                     ))}
//                 </Box>

//                 {/* IDs */}
//                 <Box
//                     sx={{
//                         mt: 2.5,
//                         pt: 1.5,
//                         borderTop: `1px solid ${COLORS.border}`,
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: 0.8,
//                     }}
//                 >
//                     <Typography
//                         color="text.secondary"
//                         fontSize="0.7rem"
//                         sx={{ overflowWrap: "anywhere" }}
//                     >
//                         Property ID: {property.propertyId || "Unknown"}
//                     </Typography>

//                     <Typography
//                         color="text.secondary"
//                         fontSize="0.7rem"
//                         sx={{ overflowWrap: "anywhere" }}
//                     >
//                         Owner ID: {property.propertyOwnerId || "Unknown"}
//                     </Typography>
//                 </Box>

//                 {/* Click hint */}
//                 <Typography
//                     color={COLORS.green}
//                     fontWeight={700}
//                     fontSize="0.75rem"
//                     textAlign="right"
//                     mt={1.5}
//                 >
//                     View property →
//                 </Typography>
//             </CardContent>
//         </Card>
//     );
// }


// export default function PropertyClicksSection() {
//     const [data, setData] = useState(null);
//     const [page, setPage] = useState(1);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");

//     const fetchAnalytics = useCallback(async () => {
//         try {
//             setLoading(true);
//             setError("");

//             const response = await axiosInstance.get(API_URL, {
//                 params: {
//                     page,
//                     limit: 8,
//                 },
//             });

//             setData(response.data);
//         } catch (err) {
//             console.error("Property click analytics error:", err);

//             setError(
//                 err.response?.data?.message ||
//                     "Unable to load property click analytics."
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, [page]);

//     useEffect(() => {
//         fetchAnalytics();
//     }, [fetchAnalytics]);

//     const summary = data?.summary || {};
//     const charts = data?.charts || {};
//     const properties = data?.properties || [];
//     const pagination = data?.pagination || {};

//     if (loading && !data) {
//         return (
//             <Box
//                 display="flex"
//                 justifyContent="center"
//                 alignItems="center"
//                 minHeight={350}
//             >
//                 <CircularProgress />
//             </Box>
//         );
//     }

//     return (
//         <Box
//             sx={{
//                 width: "100%",
//                 minWidth: 0,
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: { xs: 4, md: 5 },
//                 pb: 4,
//             }}
//         >
//             {/* Header */}
//             <Box>
//                 <Typography
//                     variant="h5"
//                     fontWeight={900}
//                     color={COLORS.primary}
//                     sx={{
//                         fontSize: { xs: "1.35rem", md: "1.65rem" },
//                     }}
//                 >
//                     Property Click Analytics
//                 </Typography>

//                 <Typography
//                     color="text.secondary"
//                     mt={1}
//                     fontSize="0.95rem"
//                 >
//                     Track engagement with properties published on your
//                     platform.
//                 </Typography>
//             </Box>

//             {error && <Alert severity="error">{error}</Alert>}

//             {/* Summary */}
//             <Box
//                 sx={{
//                     display: "grid",
//                     gridTemplateColumns: {
//                         xs: "repeat(2, minmax(0, 1fr))",
//                         lg: "repeat(3, minmax(0, 1fr))",
//                     },
//                     gap: 2,
//                     width: "100%",
//                 }}
//             >
//                 <SummaryCard
//                     title="Total clicks"
//                     value={summary.totalClicks}
//                     icon="↗"
//                 />

//                 <SummaryCard
//                     title="Tracked properties"
//                     value={summary.totalProperties}
//                     icon="⌂"
//                 />

//                 <SummaryCard
//                     title="Cities"
//                     value={summary.totalCities}
//                     icon="⌖"
//                 />
//             </Box>

//             {/* Charts */}
//             <Box>
//                 <Box mb={2.5}>
//                     <Typography
//                         fontWeight={800}
//                         fontSize="1.15rem"
//                         color="#1e293b"
//                     >
//                         Click Statistics
//                     </Typography>

//                     <Typography
//                         color="text.secondary"
//                         fontSize="0.85rem"
//                         mt={0.5}
//                     >
//                         Understand which properties and locations attract
//                         the most attention.
//                     </Typography>
//                 </Box>

//                 <Box
//                     sx={{
//                         display: "grid",
//                         gridTemplateColumns: {
//                             xs: "minmax(0, 1fr)",
//                             lg: "repeat(2, minmax(0, 1fr))",
//                         },
//                         gap: 3,
//                         width: "100%",
//                     }}
//                 >
//                     <AnalyticsChart
//                         title="Clicks by property type"
//                         description="Number of clicks for each property category."
//                         data={charts.propertyTypes}
//                     />

//                     <AnalyticsChart
//                         title="Clicks by listing type"
//                         description="Compare clicks on properties for sale and rent."
//                         data={charts.listingTypes}
//                     />

//                     <Box
//                         sx={{
//                             gridColumn: { xs: "auto", lg: "1 / -1" },
//                             width: "100%",
//                             minWidth: 0,
//                         }}
//                     >
//                         <AnalyticsChart
//                             title="Clicks by city"
//                             description="Number of clicks grouped by property location."
//                             data={charts.cities}
//                         />
//                     </Box>
//                 </Box>
//             </Box>

//             {/* Properties */}
//             <Box>
//                 <Box mb={3}>
//                     <Typography
//                         variant="h5"
//                         fontWeight={900}
//                         color={COLORS.primary}
//                         sx={{
//                             fontSize: { xs: "1.25rem", md: "1.5rem" },
//                         }}
//                     >
//                         Recently Clicked Properties
//                     </Typography>

//                     <Typography
//                         color="text.secondary"
//                         mt={1}
//                         fontSize="0.9rem"
//                     >
//                         View property details and their click statistics.
//                     </Typography>
//                 </Box>

//                 {loading && (
//                     <Box display="flex" justifyContent="center" py={4}>
//                         <CircularProgress size={30} />
//                     </Box>
//                 )}

//                 {!loading && properties.length === 0 && (
//                     <Alert severity="info">
//                         No property clicks have been recorded yet.
//                     </Alert>
//                 )}

//                 {!loading && properties.length > 0 && (
//                     <>
//                         <Box
//                             sx={{
//                                 display: "grid",
//                                 gridTemplateColumns: {
//                                     xs: "minmax(0, 1fr)",
//                                     sm: "repeat(2, minmax(0, 1fr))",
//                                     lg: "repeat(3, minmax(0, 1fr))",
//                                     xl: "repeat(4, minmax(0, 1fr))",
//                                 },
//                                 gap: 2.5,
//                                 width: "100%",
//                             }}
//                         >
//                             {properties.map((property) => (
//                                 <PropertyClickCard
//                                     key={property._id}
//                                     property={property}
//                                 />
//                             ))}
//                         </Box>

//                         {/* Pagination and results count */}
//                         <Box
//                             sx={{
//                                 mt: 5,
//                                 pt: 3,
//                                 borderTop: `1px solid ${COLORS.border}`,
//                                 display: "flex",
//                                 flexDirection: "column",
//                                 alignItems: "center",
//                                 gap: 2,
//                             }}
//                         >
//                             {pagination.totalPages > 1 && (
//                                 <Pagination
//                                     count={pagination.totalPages}
//                                     page={page}
//                                     onChange={(_, value) => setPage(value)}
//                                     color="success"
//                                     shape="rounded"
//                                     size="large"
//                                 />
//                             )}

//                             <Typography
//                                 color="text.secondary"
//                                 variant="body2"
//                                 textAlign="center"
//                                 fontSize="0.85rem"
//                             >
//                                 Showing {properties.length} of{" "}
//                                 {pagination.total || 0} tracked properties
//                             </Typography>
//                         </Box>
//                     </>
//                 )}
//             </Box>
//         </Box>
//     );
// }
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Pagination,
    Stack,
    Typography,
} from "@mui/material";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import axiosInstance from "../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";

const API_URL = "/property/clicks";

const COLORS = {
    primary: "#064e3b",
    green: "#059669",
    lightGreen: "#d1fae5",
    border: "#e5e7eb",
};



function SummaryCard({ title, value, icon, subtitle }) {
    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                minWidth: 0,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2.5,
                background: "#fff",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: COLORS.green,
                    boxShadow: "0 5px 18px rgba(6, 78, 59, 0.07)",
                    transform: "translateY(-2px)",
                },
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2, md: 2.5 },
                    "&:last-child": { pb: { xs: 2, md: 2.5 } },
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                >
                    {/* Icon */}
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            minWidth: 52,
                            borderRadius: 2,
                            bgcolor: "#ecfdf5",
                            color: COLORS.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            fontWeight: 800,
                        }}
                    >
                        {icon}
                    </Box>

                    {/* Information */}
                    <Box minWidth={0} flex={1}>
                        <Typography
                            color="text.secondary"
                            fontWeight={600}
                            fontSize="0.82rem"
                            noWrap
                        >
                            {title}
                        </Typography>

                        <Typography
                            fontWeight={900}
                            color={COLORS.primary}
                            sx={{
                                fontSize: {
                                    xs: "1.45rem",
                                    md: "1.75rem",
                                },
                                lineHeight: 1.4,
                            }}
                        >
                            {Number(value || 0).toLocaleString()}
                        </Typography>

                        {subtitle && (
                            <Typography
                                color="text.secondary"
                                fontSize="0.72rem"
                                noWrap
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}


function AnalyticsChart({ title, data, description }) {
    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                minWidth: 0,
                height: 390,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 3,
                overflow: "hidden",
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2, md: 3 },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:last-child": { pb: 3 },
                }}
            >
                <Box mb={2}>
                    <Typography
                        fontWeight={800}
                        fontSize="1rem"
                        color="#1e293b"
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                        fontSize="0.8rem"
                    >
                        {description}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    {data?.length ? (
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                        >
                            <BarChart
                                data={data}
                                margin={{
                                    top: 15,
                                    right: 15,
                                    left: -15,
                                    bottom: 35,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e2e8f0"
                                />

                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    height={65}
                                    tick={{
                                        fontSize: 11,
                                        fill: "#64748b",
                                    }}
                                    axisLine={{ stroke: "#cbd5e1" }}
                                    tickLine={false}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{
                                        fontSize: 11,
                                        fill: "#64748b",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />

                                <Tooltip
                                    cursor={{ fill: "#f0fdf4" }}
                                    contentStyle={{
                                        borderRadius: 10,
                                        border: "1px solid #e5e7eb",
                                        boxShadow:
                                            "0 4px 15px rgba(0,0,0,0.08)",
                                        fontSize: "0.85rem",
                                    }}
                                    formatter={(value) => [
                                        `${value} clicks`,
                                        "Clicks",
                                    ]}
                                />

                                <Bar
                                    dataKey="clicks"
                                    fill={COLORS.green}
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={55}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box
                            height="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Typography
                                color="text.secondary"
                                fontSize="0.9rem"
                            >
                                No click data available yet.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}



function PropertyClickCard({ property }) {
    const navigate = useNavigate();

    const formatDate = (date) => {
        if (!date) return "Unknown";

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? "Unknown"
            : parsedDate.toLocaleString();
    };

    const formatPrice = (price) => {
        if (price == null) return "Not specified";

        return `${Number(price).toLocaleString()} MAD`;
    };

    const details = [
        {
            label: "Property type",
            value: property.propertyType || "Unknown",
        },
        {
            label: "Listing type",
            value: property.listingType || "Unknown",
        },
        {
            label: "City",
            value: property.city || "Unknown",
        },
        {
            label: "Neighborhood",
            value: property.neighborhood || "Unknown",
        },
        {
            label: "Price",
            value: formatPrice(property.price),
        },
        {
            label: "First click",
            value: formatDate(property.firstClickedAt),
        },
        {
            label: "Last click",
            value: formatDate(property.lastClickedAt),
        },
        {
            label: "Last clicked by",
            value: property.lastClickedBy || "Guest / anonymous",
        },
    ];

    const handleClick = () => {
        navigate(`/properties/${property.propertyId}`);
    };

    return (
        <Card
            elevation={0}
            onClick={handleClick}
            sx={{
                width: "100%",
                minWidth: 0,
                height: "100%",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2.5,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: COLORS.green,
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(6, 78, 59, 0.09)",
                },
            }}
        >
            <CardContent
                sx={{
                    p: 3,
                    "&:last-child": { pb: 3 },
                }}
            >
                {/* Header */}
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            flexShrink: 0,
                            borderRadius: 2,
                            bgcolor: "#ecfdf5",
                            color: COLORS.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.35rem",
                        }}
                    >
                        ⌂
                    </Box>

                    <Box minWidth={0} flex={1}>
                        <Typography
                            fontWeight={800}
                            fontSize="0.95rem"
                            color="#1e293b"
                            sx={{
                                overflowWrap: "anywhere",
                                lineHeight: 1.4,
                            }}
                        >
                            {property.title || "Untitled property"}
                        </Typography>

                        <Typography
                            color="text.secondary"
                            fontSize="0.78rem"
                            mt={0.4}
                            noWrap
                        >
                            {property.city || "Unknown city"}
                            {property.neighborhood
                                ? ` · ${property.neighborhood}`
                                : ""}
                        </Typography>
                    </Box>
                </Stack>

                {/* Click statistics */}
                <Box
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "#ecfdf5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Box>
                        <Typography
                            color="#065f46"
                            fontWeight={800}
                            fontSize="0.78rem"
                        >
                            Total engagement
                        </Typography>

                        <Typography
                            color="#064e3b"
                            fontWeight={900}
                            fontSize="1.6rem"
                            lineHeight={1.4}
                        >
                            {Number(
                                property.clickCount || 0
                            ).toLocaleString()}
                        </Typography>
                    </Box>

                    <Typography
                        color="#059669"
                        fontWeight={800}
                        fontSize="0.85rem"
                    >
                        {Number(property.clickCount) === 1
                            ? "Click"
                            : "Clicks"}
                    </Typography>
                </Box>

                {/* Property information with borders and extra spacing */}
                <Box
                    sx={{
                        mt: 3,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    {details.map((item, index) => {
                        const isEven = index % 2 === 0;
                        const isLastRow = index >= details.length - 2;

                        return (
                            <Box
                                key={item.label}
                                sx={{
                                    p: 2,
                                    minWidth: 0,
                                    borderRight: isEven ? `1px solid ${COLORS.border}` : "none",
                                    borderBottom: !isLastRow ? `1px solid ${COLORS.border}` : "none",
                                    bgcolor: "#fafafa",
                                }}
                            >
                                <Typography
                                    color="#0f172a"
                                    fontSize="0.75rem"
                                    fontWeight={900}
                                    mb={0.5}
                                >
                                    {item.label} :
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    fontWeight={500}
                                    fontSize="0.8rem"
                                    sx={{
                                        overflowWrap: "anywhere",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {item.value}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* IDs */}
                <Box
                    sx={{
                        mt: 3,
                        pt: 2,
                        borderTop: `1px solid ${COLORS.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.8,
                    }}
                >
                    <Typography
                        color="text.secondary"
                        fontSize="0.7rem"
                        sx={{ overflowWrap: "anywhere" }}
                    >
                        Property ID: {property.propertyId || "Unknown"}
                    </Typography>

                    <Typography
                        color="text.secondary"
                        fontSize="0.7rem"
                        sx={{ overflowWrap: "anywhere" }}
                    >
                        Owner ID: {property.propertyOwnerId || "Unknown"}
                    </Typography>
                </Box>

                {/* Click hint */}
                <Typography
                    color={COLORS.green}
                    fontWeight={700}
                    fontSize="0.75rem"
                    textAlign="right"
                    mt={2}
                >
                    View property →
                </Typography>
            </CardContent>
        </Card>
    );
}


export default function PropertyClicksSection() {
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(API_URL, {
                params: {
                    page,
                    limit: 8,
                },
            });

            setData(response.data);
        } catch (err) {
            console.error("Property click analytics error:", err);

            setError(
                err.response?.data?.message ||
                    "Unable to load property click analytics."
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const summary = data?.summary || {};
    const charts = data?.charts || {};
    const properties = data?.properties || [];
    const pagination = data?.pagination || {};

    if (loading && !data) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={350}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: { xs: 4, md: 5 },
                pb: 4,
            }}
        >
            {/* Header */}
            <Box>
                <Typography
                    variant="h5"
                    fontWeight={900}
                    color={COLORS.primary}
                    sx={{
                        fontSize: { xs: "1.35rem", md: "1.65rem" },
                    }}
                >
                    Property Click Analytics
                </Typography>

                <Typography
                    color="text.secondary"
                    mt={1}
                    fontSize="0.95rem"
                >
                    Track engagement with properties published on your
                    platform.
                </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {/* Summary */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2,
                    width: "100%",
                }}
            >
                <SummaryCard
                    title="Total clicks"
                    value={summary.totalClicks}
                    icon="↗"
                />

                <SummaryCard
                    title="Tracked properties"
                    value={summary.totalProperties}
                    icon="⌂"
                />

                <SummaryCard
                    title="Cities"
                    value={summary.totalCities}
                    icon="⌖"
                />
            </Box>

            {/* Charts */}
            <Box>
                <Box mb={2.5}>
                    <Typography
                        fontWeight={800}
                        fontSize="1.15rem"
                        color="#1e293b"
                    >
                        Click Statistics
                    </Typography>

                    <Typography
                        color="text.secondary"
                        fontSize="0.85rem"
                        mt={0.5}
                    >
                        Understand which properties and locations attract
                        the most attention.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "minmax(0, 1fr)",
                            lg: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 3,
                        width: "100%",
                    }}
                >
                    <AnalyticsChart
                        title="Clicks by property type"
                        description="Number of clicks for each property category."
                        data={charts.propertyTypes}
                    />

                    <AnalyticsChart
                        title="Clicks by listing type"
                        description="Compare clicks on properties for sale and rent."
                        data={charts.listingTypes}
                    />

                    <Box
                        sx={{
                            gridColumn: { xs: "auto", lg: "1 / -1" },
                            width: "100%",
                            minWidth: 0,
                        }}
                    >
                        <AnalyticsChart
                            title="Clicks by city"
                            description="Number of clicks grouped by property location."
                            data={charts.cities}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Properties */}
            <Box>
                <Box mb={3}>
                    <Typography
                        variant="h5"
                        fontWeight={900}
                        color={COLORS.primary}
                        sx={{
                            fontSize: { xs: "1.25rem", md: "1.5rem" },
                        }}
                    >
                        Recently Clicked Properties
                    </Typography>

                    <Typography
                        color="text.secondary"
                        mt={1}
                        fontSize="0.9rem"
                    >
                        View property details and their click statistics.
                    </Typography>
                </Box>

                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={30} />
                    </Box>
                )}

                {!loading && properties.length === 0 && (
                    <Alert severity="info">
                        No property clicks have been recorded yet.
                    </Alert>
                )}

                {!loading && properties.length > 0 && (
                    <>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "minmax(0, 1fr)",
                                    sm: "repeat(2, minmax(0, 1fr))",
                                    lg: "repeat(3, minmax(0, 1fr))",
                                    xl: "repeat(4, minmax(0, 1fr))",
                                },
                                gap: 2.5,
                                width: "100%",
                            }}
                        >
                            {properties.map((property) => (
                                <PropertyClickCard
                                    key={property._id}
                                    property={property}
                                />
                            ))}
                        </Box>

                        {/* Pagination and results count */}
                        <Box
                            sx={{
                                mt: 5,
                                pt: 3,
                                borderTop: `1px solid ${COLORS.border}`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            {pagination.totalPages > 1 && (
                                <Pagination
                                    count={pagination.totalPages}
                                    page={page}
                                    onChange={(_, value) => setPage(value)}
                                    color="success"
                                    shape="rounded"
                                    size="large"
                                />
                            )}

                            <Typography
                                color="text.secondary"
                                variant="body2"
                                textAlign="center"
                                fontSize="0.85rem"
                            >
                                Showing {properties.length} of{" "}
                                {pagination.total || 0} tracked properties
                            </Typography>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}