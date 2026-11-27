// src/Apps/vehicles/Requests/VehicleRequestDetailsPage.jsx
//
// One vehicle request (/vehicles/requests/:id).
//   Seeker (owner): the request, its replies with each professional's contact
//     and linked listing, "Share my contact", close / renew / delete.
//   Professional: the request (the seeker's contact stays hidden), and
//     "I have a match": a message and optionally one of my listings. Once the
//     seeker shares their contact, it shows here.

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import VehicleRequestCard from "./VehicleRequestCard";
import { CLOSE_REASONS, MY_REQUESTS_PATH, REQUEST_API, listingPrice } from "./vehicleRequestOptions";
import VisitProfileButton from "../../../Components/Profile/VisitProfileButton";
import { useGoBack } from "../../../Components/navigation/navHistory";

const waLink = (number) => `https://wa.me/${String(number || "").replace(/\D/g, "")}`;

/** Call / WhatsApp / Email buttons. */
function ContactButtons({ contact }) {
    const { t } = useTranslation();
    if (!contact) return null;
    return (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {contact.phone && (
                <Button size="small" variant="outlined" startIcon={<PhoneOutlinedIcon />} href={`tel:${contact.phone}`} sx={{ textTransform: "none" }}>
                    <bdi dir="ltr">{contact.phone}</bdi>
                </Button>
            )}
            {contact.whatsappNumber && (
                <Button size="small" variant="outlined" color="success" startIcon={<WhatsAppIcon />} href={waLink(contact.whatsappNumber)} target="_blank" rel="noopener noreferrer" sx={{ textTransform: "none" }}>
                    {t("requests.details.whatsapp", "WhatsApp")}
                </Button>
            )}
            {contact.email && (
                <Button size="small" variant="outlined" startIcon={<EmailOutlinedIcon />} href={`mailto:${contact.email}`} sx={{ textTransform: "none" }}>
                    {contact.email}
                </Button>
            )}
        </Stack>
    );
}

/** A listing linked to a reply. */
function LinkedListing({ listing }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    if (!listing) return null;
    return (
        <Card variant="outlined" sx={{ borderRadius: "12px", mt: 1.5, maxWidth: 460 }}>
            <CardActionArea onClick={() => navigate(listing.link)} sx={{ display: "flex", justifyContent: "flex-start", alignItems: "stretch" }}>
                <Box sx={{ width: 96, minHeight: 72, flexShrink: 0, bgcolor: "#E2E8F0", backgroundImage: listing.image ? `url(${getImageUrl(listing.image)})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                <Box sx={{ p: 1.25, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
                        {t("requests.details.proposed", "Proposed listing")}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                        {listing.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                        {[listingPrice(listing, t, i18n.language), listing.city].filter(Boolean).join(" · ")}
                    </Typography>
                </Box>
            </CardActionArea>
        </Card>
    );
}

export default function VehicleRequestDetailsPage() {
    const { t, i18n } = useTranslation();
    const isRTL = (i18n.resolvedLanguage || i18n.language || "").startsWith("ar");
    const { id } = useParams();
    const goBack = useGoBack("/vehicles/requests/board");
    const location = useLocation();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(
        location.state?.created ? t("requests.details.created", "Your request is published. It was sent to {{count}} professional(s); new ones see it on the requests board.", { count: location.state.recipients ?? 0 }) : ""
    );
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`${REQUEST_API}/${id}`)
            .then(({ data: body }) => !cancelled && (setData(body), setError("")))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("requests.details.loadError", "Unable to load this request.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [id, reloadKey, t]);

    const reload = (message) => {
        if (message) setNotice(message);
        setReloadKey((key) => key + 1);
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={pagePaddingSx}>
            <Button startIcon={<ArrowBackRoundedIcon sx={{ transform: isRTL ? "scaleX(-1)" : "none" }} />} onClick={() => goBack()} sx={{ textTransform: "none", mb: 2 }}>
                {t("requests.details.back", "Back")}
            </Button>

            {notice && (
                <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2.5, borderRadius: "12px" }}>
                    {notice}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px" }}>
                    {error}
                </Alert>
            )}

            {data && (
                <Stack spacing={3}>
                    <VehicleRequestCard request={data.request} badges={!data.isOwner && data.matchesMyProfile ? <Chip size="small" color="primary" variant="outlined" label={t("requests.details.matchesYou", "Matches your settings")} /> : null} />

                    {data.isOwner ? (
                        <OwnerView data={data} onChanged={reload} />
                    ) : (
                        <ProfessionalView data={data} onChanged={reload} />
                    )}
                </Stack>
            )}
        </Box>
    );
}

/* --------------------------------------------------
   Seeker
-------------------------------------------------- */

function OwnerView({ data, onChanged }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { request, responses } = data;
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [closing, setClosing] = useState(false);
    const [reason, setReason] = useState("found");
    const [deleting, setDeleting] = useState(false);

    const act = async (key, call, message) => {
        setBusy(key);
        setError("");
        try {
            await call();
            onChanged(message);
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("requests.details.actionError", "Something went wrong. Please try again."));
        } finally {
            setBusy("");
        }
    };

    return (
        <>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                {request.status === "active" && (
                    <Button variant="outlined" startIcon={<DoneAllRoundedIcon />} onClick={() => setClosing(true)} sx={{ textTransform: "none" }}>
                        {t("requests.details.close", "Close (I found it / not needed)")}
                    </Button>
                )}
                <Button
                    variant="outlined"
                    startIcon={busy === "renew" ? <CircularProgress size={16} /> : <AutorenewRoundedIcon />}
                    disabled={Boolean(busy)}
                    onClick={() => act("renew", () => axiosInstance.post(`${REQUEST_API}/${request.id}/renew`), t("requests.details.renewed", "Renewed for 30 days."))}
                    sx={{ textTransform: "none" }}
                >
                    {request.status === "active" ? t("requests.details.extend", "Extend 30 days") : t("requests.details.reopen", "Reopen for 30 days")}
                </Button>
                <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleting(true)} sx={{ textTransform: "none" }}>
                    {t("requests.details.delete", "Delete")}
                </Button>
            </Stack>

            <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
                    <ForumOutlinedIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {t("requests.details.replies", "Replies ({{count}})", { count: responses.length })}
                    </Typography>
                </Stack>
                <Alert severity="info" icon={<LockOutlinedIcon />} sx={{ mb: 2, borderRadius: "12px" }}>
                    {t("requests.details.privacy", "Professionals don't see your phone or email. Contact them directly, or share your contact with the ones you choose.")}
                </Alert>

                {responses.length === 0 ? (
                    <Box sx={{ py: 5, px: 2, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: "16px", bgcolor: "#F8FAFC" }}>
                        <Typography sx={{ color: "#475569", fontWeight: 600 }}>
                            {request.status === "active"
                                ? t("requests.details.noRepliesYet", "No reply yet. You will get a notification as soon as a professional replies.")
                                : t("requests.details.noReplies", "No reply.")}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {responses.map((response) => {
                            const who = response.responder;
                            const name = who ? [who.firstName, who.lastName].filter(Boolean).join(" ") : t("requests.details.deletedUser", "Deleted account");
                            return (
                                <Card key={response.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: "16px" }}>
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.25 }}>
                                        <Avatar src={who?.profileImage ? getImageUrl(who.profileImage) : undefined}>{name.charAt(0)}</Avatar>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography sx={{ fontWeight: 800 }} noWrap>
                                                {who?.businessName || name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                                                {[who?.businessName ? name : "", who?.businessType ? t(`requests.business.${who.businessType}`) : "", new Date(response.createdAt).toLocaleDateString()]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </Typography>
                                        </Box>
                                        {!response.readAt && <Chip size="small" color="error" label={t("requests.details.new", "New")} />}
                                        {/* The professional's vehicles profile: listings, reviews, portfolio */}
                                        {who?.id && (
                                            <VisitProfileButton service="vehicles" userId={who.id} variant="text" size="small" fullWidth={false} sx={{ textTransform: "none", flexShrink: 0 }} />
                                        )}
                                    </Stack>

                                    <Typography dir="auto" sx={{ whiteSpace: "pre-line", color: "#1E293B" }}>{response.message}</Typography>
                                    <LinkedListing listing={response.listing} />

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2, justifyContent: "space-between", alignItems: { sm: "center" } }}>
                                        <ContactButtons contact={who?.contact} />
                                        {response.contactShared ? (
                                            <Chip color="success" icon={<VerifiedRoundedIcon />} label={t("requests.details.shared", "Your contact is shared")} sx={{ fontWeight: 700 }} />
                                        ) : (
                                            <Button
                                                variant="contained"
                                                startIcon={busy === response.id ? <CircularProgress size={16} color="inherit" /> : <ContactPhoneOutlinedIcon />}
                                                disabled={Boolean(busy) || !who}
                                                onClick={() =>
                                                    act(response.id, () => axiosInstance.post(`${REQUEST_API}/${request.id}/responses/${response.id}/share`), t("requests.details.sharedNotice", "Your contact details were sent to {{name}}.", { name: who?.businessName || name }))
                                                }
                                                sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                                            >
                                                {t("requests.details.share", "Share my contact")}
                                            </Button>
                                        )}
                                    </Stack>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            <Dialog open={closing} onClose={() => setClosing(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>{t("requests.details.closeTitle", "Close this request?")}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                        {t("requests.details.closeText", "Professionals will no longer see it. You can reopen it later.")}
                    </Typography>
                    <TextField select fullWidth label={t("requests.details.reason", "Reason")} value={reason} onChange={(event) => setReason(event.target.value)}>
                        {CLOSE_REASONS.map((value) => (
                            <MenuItem key={value} value={value}>
                                {t(`requests.closeReasons.${value}`)}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClosing(false)} sx={{ textTransform: "none" }}>
                        {t("requests.cancel", "Cancel")}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setClosing(false);
                            act("close", () => axiosInstance.patch(`${REQUEST_API}/${request.id}`, { status: "closed", closedReason: reason }), t("requests.details.closed", "Request closed."));
                        }}
                        sx={{ textTransform: "none" }}
                    >
                        {t("requests.details.confirmClose", "Close the request")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleting} onClose={() => setDeleting(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>{t("requests.details.deleteTitle", "Delete this request?")}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {t("requests.details.deleteText", "The request and its replies are deleted for good.")}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleting(false)} sx={{ textTransform: "none" }}>
                        {t("requests.cancel", "Cancel")}
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={async () => {
                            setDeleting(false);
                            setBusy("delete");
                            try {
                                await axiosInstance.delete(`${REQUEST_API}/${request.id}`);
                                navigate(MY_REQUESTS_PATH, { replace: true });
                            } catch (requestError) {
                                setError(requestError.response?.data?.message || t("requests.details.actionError", "Something went wrong. Please try again."));
                                setBusy("");
                            }
                        }}
                        sx={{ textTransform: "none" }}
                    >
                        {t("requests.details.delete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

/* --------------------------------------------------
   Professional
-------------------------------------------------- */

// My vehicles and spare parts, to propose one in a reply.
const LISTING_SOURCES = [
    { kind: "vehicle", url: "/vehicles/mine", pick: (body) => body?.vehicles || [] },
    { kind: "part", url: "/vehicles/parts/mine", pick: (body) => body?.parts || [] },
];

function ProfessionalView({ data, onChanged }) {
    const { t } = useTranslation();
    const { request, myResponse, seeker } = data;
    const [message, setMessage] = useState("");
    const [listing, setListing] = useState("");
    const [listings, setListings] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const canReply = !myResponse && request.status === "active";

    // My listings, to propose one.
    useEffect(() => {
        if (!canReply) return undefined;
        let cancelled = false;
        Promise.allSettled(LISTING_SOURCES.map((source) => axiosInstance.get(source.url).then(({ data: body }) => source.pick(body).map((item) => ({ ...item, kind: source.kind })))))
            .then((results) => {
                if (cancelled) return;
                setListings(results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])).filter((item) => (item.status || "Available") === "Available"));
            });
        return () => {
            cancelled = true;
        };
    }, [canReply]);

    const send = async () => {
        if (message.trim().length < 10) {
            setError(t("requests.details.messageTooShort", "Write a short message (10 characters at least)."));
            return;
        }
        setSending(true);
        setError("");
        const [kind, id] = listing ? listing.split(":") : [];
        try {
            await axiosInstance.post(`${REQUEST_API}/${request.id}/responses`, { message: message.trim(), listing: kind ? { kind, id } : undefined });
            onChanged(t("requests.details.replySent", "Your reply was sent. You will be notified if they share their contact."));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("requests.details.replyError", "Unable to send your reply."));
            setSending(false);
        }
    };

    return (
        <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px" }}>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                {t("requests.details.postedBy", "{{name}} posted this request. Their contact details stay private until they choose to share them with you.", { name: seeker?.name || "—" })}
            </Typography>

            {myResponse ? (
                <Box>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>{t("requests.details.yourReply", "Your reply")}</Typography>
                    <Typography dir="auto" sx={{ whiteSpace: "pre-line", color: "#1E293B" }}>{myResponse.message}</Typography>
                    <LinkedListing listing={myResponse.listing} />
                    <Box sx={{ mt: 2.5 }}>
                        {myResponse.seekerContact ? (
                            <Alert severity="success" icon={<ContactPhoneOutlinedIcon />} sx={{ borderRadius: "12px", "& .MuiAlert-message": { width: "100%" } }}>
                                <Typography sx={{ fontWeight: 700, mb: 1 }}>{t("requests.details.contactYou", "{{name}} shared their contact with you:", { name: myResponse.seekerContact.name })}</Typography>
                                <ContactButtons contact={myResponse.seekerContact} />
                            </Alert>
                        ) : (
                            <Alert severity="info" sx={{ borderRadius: "12px" }}>
                                {t("requests.details.waiting", "Sent. You will be notified when they share their contact details.")}
                            </Alert>
                        )}
                    </Box>
                </Box>
            ) : canReply ? (
                <Stack spacing={2}>
                    <Typography sx={{ fontWeight: 800 }}>{t("requests.details.haveMatch", "I have a match")}</Typography>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        multiline
                        minRows={3}
                        label={t("requests.details.yourMessage", "Your message")}
                        placeholder={t("requests.details.messagePlaceholder", "Describe what you have: price, availability, visit…")}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        slotProps={{ htmlInput: { maxLength: 1000 } }}
                        helperText={`${message.length}/1000`}
                    />
                    <TextField select label={t("requests.details.attach", "Propose one of my listings (optional)")} value={listing} onChange={(event) => setListing(event.target.value)}>
                        <MenuItem value="">{t("requests.details.noListing", "No listing")}</MenuItem>
                        {listings.map((item) => (
                            <MenuItem key={`${item.kind}:${item._id}`} value={`${item.kind}:${item._id}`}>
                                {[item.title, item.city].filter(Boolean).join(" · ")}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Box>
                        <Button variant="contained" startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />} disabled={sending} onClick={send} sx={{ textTransform: "none", fontWeight: 700 }}>
                            {t("requests.details.send", "Send my reply")}
                        </Button>
                    </Box>
                </Stack>
            ) : (
                <Alert severity="warning">{t("requests.details.notActive", "This request is no longer active.")}</Alert>
            )}
        </Card>
    );
}
