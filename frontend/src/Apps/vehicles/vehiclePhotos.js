// src/Apps/vehicles/vehiclePhotos.js
// Photos of the vehicle / moto categories ("Explore categories").
//
// 1. A local copy in src/assets/vehicles/<name>.jpg is used first (loaded
//    with import.meta.glob, so a missing file never breaks the build).
//    Run `npm run vehicle-photos` once to download them all there.
// 2. Otherwise the free Unsplash photo below is shown (Unsplash License:
//    free to use, no permission or credit required).
// 3. If neither loads, the tile shows its icon.

const files = import.meta.glob("../../assets/vehicles/*.{jpg,jpeg,png,webp}", { eager: true, import: "default" });

export const VEHICLE_PHOTOS = Object.fromEntries(
    Object.entries(files).map(([path, url]) => [
        path
            .split("/")
            .pop()
            .replace(/\.[^.]+$/, ""),
        url,
    ]),
);

// name -> Unsplash photo (page id and image address). Photographers are
// listed for credit, which the license does not require.
export const VEHICLE_PHOTO_SOURCES = {
    "all-cars": { id: "OJ3qvN24AhE", image: "https://images.unsplash.com/photo-1760976396211-5546ce83a400", by: "Omar Ramadan" },
    "city-car": { id: "MaMC5zV7uhs", image: "https://images.unsplash.com/photo-1525883405167-fc4e76c7713a", by: "Joshua Hanks" },
    sedan: { id: "NMcOwovVXaI", image: "https://images.unsplash.com/photo-1560267806-265372a71e48", by: "Jason Garcia" },
    suv: { id: "28Lmg9YaTFY", image: "https://images.unsplash.com/photo-1632137923943-c41af86682f5", by: "Stephen Andrews" },
    "4x4": { id: "fORHNebixhE", image: "https://images.unsplash.com/photo-1577911679126-cbe61945ddde", by: "Skyler Smith" },
    estate: { id: "ktBuvhjVTts", image: "https://images.unsplash.com/photo-1562865155-43cb87ba00db", by: "Brandon Hoogenboom" },
    coupe: { id: "M09yaKs0z1I", image: "https://images.unsplash.com/photo-1618480483701-c31ac5590db4", by: "Caspar Rae" },
    convertible: { id: "R57Z9McmjAQ", image: "https://images.unsplash.com/photo-1531938082025-efdb69fbd925", by: "Kayle Kaupanger" },
    minivan: { id: "9g02bqvfoq0", image: "https://images.unsplash.com/photo-1514899307441-bee613d8e6e7", by: "Nick Karvounis" },
    van: { id: "shMymEhk86g", image: "https://images.unsplash.com/photo-1579992822406-2092a7bd5a36", by: "Norbert Kundrak" },
    pickup: { id: "Bt02pzZSlsk", image: "https://images.unsplash.com/photo-1547269257-ee55681ca2cd", by: "Ken Wyatt" },
    "all-motos": { id: "u9ObX2DVaos", image: "https://images.unsplash.com/photo-1728272873764-1f93687e2544", by: "Duc Van" },
    motorcycle: { id: "7xwxqzjt6CY", image: "https://images.unsplash.com/photo-1721461043344-9fb9bd5fbdf3", by: "Topique SL" },
    scooter: { id: "wV4dMcCTgMk", image: "https://images.unsplash.com/photo-1565016083194-f0cc352f2962", by: "Unsplash" },
    bicycle: { id: "u24twBm25J8", image: "https://images.unsplash.com/photo-1521377134373-49b242b5fd0e", by: "Linda Xu" },
    "kick-scooter": { id: "8wpsHMThs6Q", image: "https://images.unsplash.com/photo-1625817827559-d76482541660", by: "Unsplash" },
    tricycle: { id: "b_baCKk3VbQ", image: "https://images.unsplash.com/photo-1572351886151-7dd9c1210cc8", by: "Unsplash" },
    // Spare parts page banner.
    "parts-banner": { id: "evobURW3hE4", image: "https://images.unsplash.com/photo-1778087432647-b84c500cc302", by: "Osmany M Leyva Aldana" },
};

/** Photo of a category: local copy, else the Unsplash photo (small, cropped), else "". */
export function vehiclePhoto(name, { width = 320, height = 220 } = {}) {
    if (VEHICLE_PHOTOS[name]) return VEHICLE_PHOTOS[name];
    const source = VEHICLE_PHOTO_SOURCES[name];
    return source ? `${source.image}?w=${width}&h=${height}&fit=crop&auto=format&q=70` : "";
}
