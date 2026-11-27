// backend/apps/workers/utils/workerOptions.js
//
// Choices of a daily worker profile. The frontend reads them from
// GET /api/workers/options, so the form and the filters always match.

export const MAX_OFFERS = 5;
export const MAX_CITIES = 20;
export const MAX_SPECIALTIES = 10;
export const MAX_CUSTOM_SPECIALTIES = 5;

export const BIO_MAX = 1000;
export const OFFER_DESCRIPTION_MAX = 800;
export const CUSTOM_TEXT_MAX = 60;
export const GUARANTEE_MAX = 120;
export const DIPLOMA_MAX = 120;
export const NAME_MAX = 50;

export const MAX_EXPERIENCE_YEARS = 60;
export const MAX_PRICE = 1000000;
export const MAX_TEAM_SIZE = 50;

// Where the worker accepts jobs.
export const COVERAGE = ["cities", "morocco"];

// Days are stored as keys, Monday first.
export const WORK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Languages spoken (no Amazigh: see the product decision of round 43).
export const LANGUAGES = ["ar", "fr", "en"];

// How the price is given.
//   day    a price per working day          (price required)
//   task   a fixed price for the whole job  ("from" price, optional)
//   hour   a price per hour                 (price required)
//   m2     a price per square metre         (price required)
//   quote  price after seeing the job       (no price)
export const PRICE_TYPES = ["day", "task", "hour", "m2", "quote"];
export const PRICE_REQUIRED = new Set(["day", "hour", "m2"]);

// When the worker is paid.
export const PAYMENT_TIMINGS = ["daily", "end", "agreed"];

// Who buys the materials.
export const MATERIALS = ["client", "included", "either"];

export const TEAM_MODES = ["alone", "team"];

export const CONTACT_PREFERENCES = ["both", "call", "whatsapp"];

export const AVAILABILITY = ["available", "busy"];

export const PROFILE_STATUSES = ["active", "hidden"];

// Shown on the profile and used for the default picture (no account photo).
export const GENDERS = ["male", "female"];

// A place where clients can come: workshop, shop or garage (with a map location).
export const WORKPLACE_KINDS = ["workshop", "shop", "garage"];
export const WORKPLACE_NAME_MAX = 80;
export const WORKPLACE_ADDRESS_MAX = 160;
// Photos of the workshop / shop / garage.
export const WORKPLACE_MAX_IMAGES = 4;

// Public list sorts.
export const SORTS = ["newest", "priceAsc", "priceDesc", "experience", "available"];

export const HOURS_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
