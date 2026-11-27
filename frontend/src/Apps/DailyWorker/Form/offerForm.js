// src/Apps/DailyWorker/Form/offerForm.js
// Trade offer of the worker form <-> API.

export const emptyOffer = () => ({
    key: Math.random().toString(36).slice(2),
    trade: "",
    customTrade: "",
    specialties: [],
    customSpecialties: [],
    experienceYears: "",
    diploma: "",
    priceType: "day",
    price: "",
    paymentTiming: "daily",
    depositRequired: false,
    depositPercent: "",
    materials: "client",
    visitFree: true,
    visitFee: "",
    guarantee: "",
    description: "",
});

/** API offer -> form offer. */
export const offerToForm = (offer) => ({
    ...emptyOffer(),
    _id: offer.id,
    trade: offer.trade,
    customTrade: offer.customTrade || "",
    specialties: offer.specialties || [],
    customSpecialties: offer.customSpecialties || [],
    experienceYears: String(offer.experienceYears ?? ""),
    diploma: offer.diploma || "",
    priceType: offer.priceType,
    price: offer.price != null ? String(offer.price) : "",
    paymentTiming: offer.paymentTiming,
    depositRequired: Boolean(offer.deposit?.required),
    depositPercent: offer.deposit?.percent != null ? String(offer.deposit.percent) : "",
    materials: offer.materials || "client",
    visitFree: offer.visit?.free !== false,
    visitFee: offer.visit?.fee != null ? String(offer.visit.fee) : "",
    guarantee: offer.guarantee || "",
    description: offer.description || "",
});

/** Form offer -> API body. */
export const offerToBody = (offer) => {
    const body = { ...offer };
    delete body.key;
    return body;
};
