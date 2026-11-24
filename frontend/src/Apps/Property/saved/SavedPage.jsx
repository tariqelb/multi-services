// src/Apps/Property/saved/SavedPage.jsx
// /saved — everything saved in the real estate service, in tabs:
// properties (the existing list), roommate announcements, hotels & riads.
// ?tab=roommates or ?tab=establishments opens that tab.
// (Vehicles have their own page: /vehicles/saved.)

import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Tab, Tabs } from "@mui/material";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import HotelOutlinedIcon from "@mui/icons-material/HotelOutlined";

import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import SavedPropertiesList from "./SavedPropertyList";
import SavedListingsTab from "./SavedListingsTab";

const TABS = ["properties", "roommates", "establishments"];

export default function SavedPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "properties";

    const changeTab = (_event, value) => setSearchParams(value === "properties" ? {} : { tab: value }, { replace: true });

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<BookmarkBorderRoundedIcon />}
                title={t("topbar.saved", "Saved")}
                subtitle={t("savedListings.pageSubtitle", "Properties, roommate announcements and hotels you saved, to compare and contact later.")}
            />

            <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={tab}
                    onChange={changeTab}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{ "& .MuiTab-root": { minHeight: 52, textTransform: "none", fontWeight: 600, fontSize: { xs: 13, sm: 15 } } }}
                >
                    <Tab value="properties" icon={<HomeWorkOutlinedIcon />} iconPosition="start" label={t("savedListings.tabProperties", "Properties")} />
                    <Tab value="roommates" icon={<PeopleAltOutlinedIcon />} iconPosition="start" label={t("savedListings.tabRoommates", "Roommates")} />
                    <Tab value="establishments" icon={<HotelOutlinedIcon />} iconPosition="start" label={t("savedListings.tabEstablishments", "Hotels & riads")} />
                </Tabs>
            </Box>

            {tab === "properties" && <SavedPropertiesList embedded />}
            {tab === "roommates" && <SavedListingsTab key="roommate" type="roommate" />}
            {tab === "establishments" && <SavedListingsTab key="establishment" type="establishment" />}
        </Box>
    );
}
