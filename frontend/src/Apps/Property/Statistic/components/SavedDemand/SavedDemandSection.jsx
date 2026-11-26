// Property › Statistics › "Saved demand": what people save, per kind of
// listing (properties, roommate announcements, hotels & riads).
// Alerts are in their own tab ("Alert demand").

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack } from "@mui/material";
import { BookmarkBorderOutlined, HomeWorkOutlined, HotelOutlined, PeopleAltOutlined } from "@mui/icons-material";

import { RangeSelect, SectionHeader } from "../../../../../Components/Analytics/AnalyticsUI";
import SavedDemandPanel from "../../../../../Components/Analytics/SavedDemandPanel";
import TypeChips from "../../../../../Components/Analytics/TypeChips";
import SavedPropertyDemandSection from "../PropertyDemand/SavedPropertyDemandSection";

export default function SavedDemandSection() {
    const { t } = useTranslation();
    const [type, setType] = useState("properties");
    const [range, setRange] = useState("30d");

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<BookmarkBorderOutlined />}
                title={t("savedStats.title", "Saved demand")}
                subtitle={t("savedStats.subtitle", "What people save, by kind of listing.")}
            >
                <RangeSelect value={range} onChange={setRange} />
            </SectionHeader>

            <TypeChips
                value={type}
                onChange={setType}
                options={[
                    { value: "properties", label: t("savedStats.types.properties", "Properties"), icon: <HomeWorkOutlined /> },
                    { value: "roommate", label: t("savedStats.types.roommate", "Roommate announcements"), icon: <PeopleAltOutlined /> },
                    { value: "establishment", label: t("savedStats.types.establishment", "Hotels & riads"), icon: <HotelOutlined /> },
                ]}
            />

            {type === "properties" ? (
                <SavedPropertyDemandSection range={range} />
            ) : (
                <SavedDemandPanel key={type} url="/property/dashboard/saved-listing-demand" params={{ range, type }} />
            )}
        </Stack>
    );
}
