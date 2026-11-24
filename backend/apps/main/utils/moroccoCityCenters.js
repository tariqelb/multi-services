// backend/apps/main/utils/moroccoCityCenters.js
//
// Approximate centre of the Moroccan cities offered in the frontend city list
// (src/data/moroccanCities.js). Used to place a listing on the map when its
// publisher gave a city but no exact location: the marker is flagged as
// approximate. Shared by every service.

const CENTERS = {
    agadir: [30.4278, -9.5981],
    "ain harrouda": [33.6376, -7.4479],
    "ait melloul": [30.3342, -9.4972],
    "ait ourir": [31.5640, -7.6630],
    "al hoceima": [35.2517, -3.9372],
    azemmour: [33.2875, -8.3420],
    azilal: [31.9617, -6.5717],
    azrou: [33.4342, -5.2213],
    "beni ansar": [35.2656, -2.9311],
    "beni mellal": [32.3373, -6.3498],
    benslimane: [33.6189, -7.1210],
    benguerir: [32.2300, -7.9500],
    berkane: [34.9200, -2.3200],
    berrechid: [33.2655, -7.5875],
    biougra: [30.2150, -9.3730],
    "bni yakhlef": [33.6600, -7.3200],
    boujdour: [26.1253, -14.4842],
    boulemane: [33.3622, -4.7303],
    bouskoura: [33.4489, -7.6486],
    bouznika: [33.7890, -7.1597],
    casablanca: [33.5731, -7.5898],
    chefchaouen: [35.1688, -5.2636],
    chichaoua: [31.5400, -8.7600],
    dakhla: [23.6848, -15.9580],
    "dar bouazza": [33.5300, -7.8100],
    "dcheira el jihadia": [30.3730, -9.5300],
    drargua: [30.4400, -9.4800],
    "ech-challalate": [33.6900, -7.3100],
    "el hajeb": [33.6928, -5.3711],
    "el jadida": [33.2316, -8.5007],
    "el kelaa des sraghna": [32.0581, -7.4103],
    errachidia: [31.9314, -4.4246],
    essaouira: [31.5085, -9.7595],
    fes: [34.0181, -5.0078],
    figuig: [32.1093, -1.2290],
    fnideq: [35.8497, -5.3573],
    "fquih ben salah": [32.5000, -6.6900],
    guelmim: [28.9870, -10.0574],
    guercif: [34.2257, -3.3536],
    ifrane: [33.5228, -5.1106],
    imintanoute: [31.1700, -8.8500],
    imzouren: [35.1448, -3.8505],
    inezgane: [30.3553, -9.5370],
    jerada: [34.3117, -2.1636],
    "kelaat m'gouna": [31.2400, -6.1300],
    kenitra: [34.2610, -6.5802],
    khemisset: [33.8241, -6.0663],
    khenifra: [32.9394, -5.6675],
    khouribga: [32.8811, -6.9063],
    "ksar el kebir": [35.0017, -5.9093],
    laayoune: [27.1253, -13.1625],
    lahraouyine: [33.5400, -7.5300],
    larache: [35.1932, -6.1557],
    lqliaa: [30.3000, -9.4600],
    "m'diq": [35.6858, -5.3253],
    marrakesh: [31.6295, -7.9811],
    martil: [35.6167, -5.2750],
    mehdya: [34.2580, -6.6500],
    meknes: [33.8935, -5.5547],
    midelt: [32.6852, -4.7451],
    missour: [33.0500, -3.9900],
    mohammedia: [33.6866, -7.3830],
    nador: [35.1681, -2.9335],
    ouarzazate: [30.9189, -6.8934],
    "oued zem": [32.8630, -6.5730],
    ouezzane: [34.7970, -5.5830],
    oujda: [34.6814, -1.9086],
    "oulad teima": [30.3950, -9.2100],
    rabat: [34.0209, -6.8416],
    safi: [32.2994, -9.2372],
    sale: [34.0331, -6.7985],
    sefrou: [33.8300, -4.8350],
    settat: [33.0010, -7.6166],
    "sidi bennour": [32.6500, -8.4300],
    "sidi ifni": [29.3797, -10.1730],
    "sidi kacem": [34.2260, -5.7070],
    "sidi slimane": [34.2648, -5.9255],
    "sidi taibi": [34.1900, -6.6900],
    skhirat: [33.8500, -7.0300],
    "souk el arbaa": [34.6833, -5.9833],
    "souk sebt ouled nemma": [32.2950, -6.7000],
    tafraout: [29.7194, -8.9750],
    tanger: [35.7595, -5.8340],
    "tan-tan": [28.4380, -11.1032],
    taounate: [34.5358, -4.6400],
    taourirt: [34.4073, -2.8973],
    taroudant: [30.4703, -8.8770],
    taza: [34.2100, -4.0100],
    temara: [33.9287, -6.9063],
    tetouan: [35.5889, -5.3626],
    tifelt: [33.8940, -6.3060],
    tinghir: [31.5150, -5.5328],
    tiznit: [29.6974, -9.7316],
    youssoufia: [32.2463, -8.5294],
    zagora: [30.3324, -5.8384],
};

// Other spellings people type.
const ALIASES = {
    marrakech: "marrakesh",
    fez: "fes",
    tangier: "tanger",
    tangiers: "tanger",
    sala: "sale",
    "ben guerir": "benguerir",
    "kelaa des sraghna": "el kelaa des sraghna",
    "dar bouazza (tamaris)": "dar bouazza",
    tamaris: "dar bouazza",
    tantan: "tan-tan",
    mdiq: "m'diq",
    ouazzane: "ouezzane",
    dcheira: "dcheira el jihadia",
    "el aaiun": "laayoune",
};

const normalize = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[’`]/g, "'")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

/** { lat, lng } of the city centre, or null when the city is unknown. */
export function cityCenter(city) {
    const key = normalize(city);
    const point = CENTERS[key] || CENTERS[ALIASES[key]];
    return point ? { lat: point[0], lng: point[1] } : null;
}

export default cityCenter;
