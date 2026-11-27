// backend/apps/workers/data/workerTrades.js
//
// Every trade a daily worker can offer, grouped, with its specialties.
// This list drives the publish form, the filters and the search, so a worker
// picks from it instead of typing (better search). When a trade is missing,
// the worker chooses "other" and types it (customTrade).
//
// Add a trade: { id, group, en, fr, ar, keywords, specialties: [{ id, en, fr, ar }] }
//   id        stable key stored in the database: never rename it
//   keywords  extra words people search with (Darija, other spellings)
//
// The frontend reads this list from GET /api/workers/options.

export const TRADE_GROUPS = [
    { id: "construction", en: "Construction", fr: "Gros œuvre", ar: "البناء" },
    { id: "finishing", en: "Finishing & decoration", fr: "Finitions et décoration", ar: "التشطيب والديكور" },
    { id: "networks", en: "Electricity, plumbing & cooling", fr: "Électricité, plomberie et froid", ar: "الكهرباء والترصيص والتبريد" },
    { id: "woodMetal", en: "Wood, aluminium & metal", fr: "Bois, aluminium et métal", ar: "الخشب والألومنيوم والحديد" },
    { id: "home", en: "Home services", fr: "Services à domicile", ar: "خدمات منزلية" },
    { id: "outdoor", en: "Garden, farm & outdoor", fr: "Jardin, agriculture et extérieur", ar: "الحدائق والفلاحة" },
    { id: "repair", en: "Repairs", fr: "Réparations", ar: "الإصلاحات" },
    { id: "moving", en: "Moving & handling", fr: "Déménagement et manutention", ar: "النقل والحمولة" },
    { id: "crafts", en: "Crafts, beauty & events", fr: "Artisanat, beauté et événements", ar: "الحرف والتجميل والحفلات" },
];

const s = (id, en, fr, ar) => ({ id, en, fr, ar });

export const WORKER_TRADES = [
    // ---------------------------------------------------------------- construction
    {
        id: "mason",
        group: "construction",
        en: "Mason",
        fr: "Maçon",
        ar: "بنّاء",
        keywords: ["bennay", "maallem", "maçonnerie", "construction", "بناء"],
        specialties: [
            s("walls", "Walls & bricks", "Murs et briques", "بناء الجدران والآجر"),
            s("concrete", "Concrete & slabs", "Béton et dalles", "الخرسانة والسقوف"),
            s("foundations", "Foundations", "Fondations", "الأساسات"),
            s("renovation", "Renovation", "Rénovation", "الترميم والإصلاح"),
            s("plastering", "Rendering (crépi)", "Enduit et crépi", "التلبيس (الكريبي)"),
            s("demolition", "Demolition", "Démolition", "الهدم"),
        ],
    },
    {
        id: "tiler",
        group: "construction",
        en: "Tiler",
        fr: "Carreleur",
        ar: "مبلّط (زلايجي)",
        keywords: ["zelayji", "zellige", "carrelage", "zellij", "زليج", "زلايجي"],
        specialties: [
            s("floor", "Floor tiles", "Carrelage sol", "تبليط الأرضيات"),
            s("wall", "Wall tiles", "Faïence murale", "تبليط الجدران"),
            s("zellige", "Zellige", "Zellige", "الزليج البلدي"),
            s("marble", "Marble", "Marbre", "الرخام"),
            s("granito", "Granito / terrazzo", "Granito", "الغرانيتو"),
            s("bathroom", "Bathrooms & kitchens", "Salles de bain et cuisines", "الحمامات والمطابخ"),
        ],
    },
    {
        id: "waterproofing",
        group: "construction",
        en: "Waterproofing & insulation",
        fr: "Étanchéité et isolation",
        ar: "العزل المائي والحراري",
        keywords: ["etancheite", "isolation", "terrasse", "عزل"],
        specialties: [
            s("roof", "Roofs & terraces", "Toitures et terrasses", "السطوح"),
            s("bathroom", "Bathrooms", "Salles de bain", "الحمامات"),
            s("thermal", "Thermal insulation", "Isolation thermique", "العزل الحراري"),
            s("tanks", "Water tanks & pools", "Réservoirs et piscines", "الخزانات والمسابح"),
        ],
    },
    {
        id: "labourer",
        group: "construction",
        en: "Building labourer",
        fr: "Manœuvre",
        ar: "عامل بناء (مساعد)",
        keywords: ["manoeuvre", "aide maçon", "mouwal", "عامل", "حمال"],
        specialties: [
            s("siteHelp", "Help on building sites", "Aide sur chantier", "المساعدة في الورش"),
            s("digging", "Digging", "Creusage", "الحفر"),
            s("carrying", "Carrying materials", "Transport de matériaux", "نقل مواد البناء"),
            s("siteCleaning", "Site cleaning", "Nettoyage de chantier", "تنظيف الورش"),
        ],
    },
    // ---------------------------------------------------------------- finishing
    {
        id: "painter",
        group: "finishing",
        en: "Painter",
        fr: "Peintre",
        ar: "صبّاغ",
        keywords: ["sebagh", "peinture", "صباغة"],
        specialties: [
            s("interior", "Interior painting", "Peinture intérieure", "الصباغة الداخلية"),
            s("exterior", "Exterior & facades", "Extérieur et façades", "الواجهات الخارجية"),
            s("decorative", "Decorative painting", "Peinture décorative", "الصباغة الديكورية"),
            s("wallpaper", "Wallpaper", "Papier peint", "ورق الجدران"),
            s("wood", "Wood & metal painting", "Peinture bois et métal", "صباغة الخشب والحديد"),
        ],
    },
    {
        id: "plasterer",
        group: "finishing",
        en: "Plasterer (gypsum)",
        fr: "Plâtrier (staff, gypse)",
        ar: "جبّاص",
        keywords: ["jebbass", "gebs", "platre", "placo", "faux plafond", "جبص", "جباص"],
        specialties: [
            s("ceiling", "False ceilings", "Faux plafonds", "الأسقف المستعارة"),
            s("decoration", "Gypsum decoration", "Décoration en plâtre", "ديكور الجبس"),
            s("placo", "Plasterboard (BA13)", "Plaques de plâtre (BA13)", "ألواح الجبس"),
            s("carving", "Carved plaster", "Plâtre sculpté", "النقش على الجبس"),
        ],
    },
    {
        id: "tadelakt",
        group: "finishing",
        en: "Tadelakt & lime coatings",
        fr: "Tadelakt et enduits à la chaux",
        ar: "تادلاكت والطلاء بالجير",
        keywords: ["tadlakt", "beton cire", "chaux", "تدلاكت"],
        specialties: [
            s("tadelakt", "Tadelakt", "Tadelakt", "تادلاكت"),
            s("waxedConcrete", "Waxed concrete", "Béton ciré", "الخرسانة المصقولة"),
            s("lime", "Lime coatings", "Enduits à la chaux", "الطلاء بالجير"),
        ],
    },
    // ---------------------------------------------------------------- networks
    {
        id: "electrician",
        group: "networks",
        en: "Electrician",
        fr: "Électricien",
        ar: "كهربائي",
        keywords: ["trisien", "electricite", "kahraba", "كهرباء", "تريسيان"],
        specialties: [
            s("installation", "New installation", "Installation neuve", "تركيب جديد"),
            s("repair", "Breakdowns & repairs", "Pannes et dépannage", "الأعطال والإصلاح"),
            s("panel", "Electrical panels", "Tableaux électriques", "اللوحات الكهربائية"),
            s("lighting", "Lighting", "Éclairage", "الإنارة"),
            s("industrial", "Industrial electricity", "Électricité industrielle", "الكهرباء الصناعية"),
        ],
    },
    {
        id: "plumber",
        group: "networks",
        en: "Plumber",
        fr: "Plombier",
        ar: "رصّاص (بلومبي)",
        keywords: ["plombi", "plomberie", "rassas", "بلومبي", "ترصيص"],
        specialties: [
            s("leaks", "Leaks", "Fuites d'eau", "تسربات المياه"),
            s("waterHeater", "Water heaters", "Chauffe-eau", "سخانات الماء"),
            s("sanitary", "Bathrooms & sanitary", "Sanitaires et salles de bain", "الأدوات الصحية والحمامات"),
            s("unclogging", "Unclogging", "Débouchage", "تسليك القنوات"),
            s("gas", "Gas installation", "Installation gaz", "تركيبات الغاز"),
            s("pumps", "Pumps & tanks", "Pompes et réservoirs", "المضخات والخزانات"),
        ],
    },
    {
        id: "hvac",
        group: "networks",
        en: "Air conditioning & refrigeration",
        fr: "Climatisation et froid",
        ar: "التكييف والتبريد",
        keywords: ["clim", "climatiseur", "frigoriste", "frigo", "كليماتيزور", "مكيف"],
        specialties: [
            s("acInstall", "AC installation", "Installation de climatiseurs", "تركيب المكيفات"),
            s("acService", "AC maintenance & gas refill", "Entretien et recharge gaz", "صيانة المكيفات وتعبئة الغاز"),
            s("fridges", "Fridges & freezers", "Réfrigérateurs et congélateurs", "الثلاجات والمجمدات"),
            s("coldRooms", "Cold rooms", "Chambres froides", "غرف التبريد"),
        ],
    },
    {
        id: "solar",
        group: "networks",
        en: "Solar installer",
        fr: "Installateur solaire",
        ar: "تركيب الطاقة الشمسية",
        keywords: ["panneau solaire", "photovoltaique", "pompage solaire", "طاقة شمسية"],
        specialties: [
            s("panels", "Solar panels", "Panneaux photovoltaïques", "الألواح الشمسية"),
            s("waterHeater", "Solar water heaters", "Chauffe-eau solaires", "سخانات شمسية"),
            s("pumping", "Solar pumping", "Pompage solaire", "الضخ بالطاقة الشمسية"),
        ],
    },
    {
        id: "satellite",
        group: "networks",
        en: "Satellite dish & TV installer",
        fr: "Installateur parabole et TV",
        ar: "مركّب الصحون الهوائية",
        keywords: ["parabole", "demo", "antenne", "برابول"],
        specialties: [
            s("dish", "Satellite dishes", "Paraboles", "الصحون الهوائية"),
            s("tv", "TV & wall mounting", "TV et fixation murale", "تركيب التلفاز"),
            s("network", "Internet & Wi-Fi cabling", "Câblage internet et Wi-Fi", "شبكات الإنترنت"),
        ],
    },
    {
        id: "security",
        group: "networks",
        en: "Cameras & alarms",
        fr: "Caméras et alarmes",
        ar: "كاميرات المراقبة والإنذار",
        keywords: ["camera", "surveillance", "alarme", "interphone", "كاميرا"],
        specialties: [
            s("cctv", "Security cameras", "Caméras de surveillance", "كاميرات المراقبة"),
            s("alarm", "Alarms", "Alarmes", "أجهزة الإنذار"),
            s("intercom", "Intercoms", "Interphones", "الأنترفون"),
        ],
    },
    // ---------------------------------------------------------------- wood & metal
    {
        id: "carpenter",
        group: "woodMetal",
        en: "Carpenter (wood)",
        fr: "Menuisier bois",
        ar: "نجّار",
        keywords: ["nejjar", "menuiserie", "bois", "نجارة"],
        specialties: [
            s("doors", "Doors & windows", "Portes et fenêtres", "الأبواب والنوافذ"),
            s("kitchens", "Kitchens", "Cuisines", "المطابخ"),
            s("wardrobes", "Wardrobes & dressing rooms", "Placards et dressings", "الخزائن"),
            s("furniture", "Furniture making & repair", "Meubles et réparation", "صناعة وإصلاح الأثاث"),
            s("parquet", "Wooden floors", "Parquet", "الباركيه"),
        ],
    },
    {
        id: "aluminium",
        group: "woodMetal",
        en: "Aluminium & PVC joiner",
        fr: "Menuisier aluminium et PVC",
        ar: "نجّار الألومنيوم",
        keywords: ["alu", "aluminium", "pvc", "baie vitree", "ألمنيوم"],
        specialties: [
            s("windows", "Windows & sliding doors", "Fenêtres et baies coulissantes", "النوافذ والأبواب المنزلقة"),
            s("kitchens", "Aluminium kitchens", "Cuisines en aluminium", "مطابخ الألومنيوم"),
            s("verandas", "Verandas & facades", "Vérandas et façades", "الفيرندا والواجهات"),
            s("shutters", "Rolling shutters", "Volets roulants", "الستائر المعدنية"),
        ],
    },
    {
        id: "welder",
        group: "woodMetal",
        en: "Welder & ironworker",
        fr: "Soudeur et ferronnier",
        ar: "حدّاد (لحّام)",
        keywords: ["haddad", "soudure", "fer forge", "ferronnerie", "حدادة", "لحام"],
        specialties: [
            s("gates", "Gates & doors", "Portails et portes", "البوابات والأبواب الحديدية"),
            s("grilles", "Window grilles & railings", "Grilles et garde-corps", "الشبابيك والدرابزين"),
            s("structures", "Metal structures", "Charpente métallique", "الهياكل الحديدية"),
            s("wroughtIron", "Wrought iron", "Fer forgé", "الحديد المطاوع"),
        ],
    },
    {
        id: "glazier",
        group: "woodMetal",
        en: "Glazier",
        fr: "Vitrier",
        ar: "زجّاج",
        keywords: ["vitre", "miroir", "verre", "زجاج"],
        specialties: [
            s("glass", "Window glass", "Vitrage", "زجاج النوافذ"),
            s("mirrors", "Mirrors", "Miroirs", "المرايا"),
            s("shower", "Shower screens", "Parois de douche", "فواصل الدوش"),
        ],
    },
    {
        id: "upholsterer",
        group: "woodMetal",
        en: "Upholsterer",
        fr: "Tapissier",
        ar: "منجّد",
        keywords: ["salon marocain", "sedari", "tapisserie", "صالون", "تنجيد"],
        specialties: [
            s("moroccanSalon", "Moroccan salons", "Salons marocains", "الصالون المغربي"),
            s("sofas", "Sofas & chairs", "Canapés et chaises", "الكنبات والكراسي"),
            s("curtains", "Curtains", "Rideaux", "الستائر"),
            s("mattresses", "Mattresses", "Matelas", "المطارح"),
        ],
    },
    // ---------------------------------------------------------------- home services
    {
        id: "cleaning",
        group: "home",
        en: "Cleaning",
        fr: "Ménage et nettoyage",
        ar: "التنظيف",
        keywords: ["menage", "femme de menage", "nettoyage", "khedama", "تنظيف", "خدامة"],
        specialties: [
            s("home", "Home cleaning", "Ménage à domicile", "تنظيف المنازل"),
            s("deep", "Deep cleaning", "Grand nettoyage", "التنظيف الشامل"),
            s("afterWorks", "After-works cleaning", "Nettoyage après travaux", "التنظيف بعد الأشغال"),
            s("offices", "Offices & shops", "Bureaux et commerces", "المكاتب والمحلات"),
            s("carpets", "Carpets & sofas", "Tapis et canapés", "الزرابي والكنبات"),
            s("windows", "Windows", "Vitres", "النوافذ"),
        ],
    },
    {
        id: "cook",
        group: "home",
        en: "Cook",
        fr: "Cuisinier / cuisinière",
        ar: "طبّاخ / طبّاخة",
        keywords: ["cuisine", "traiteur", "tabakha", "طبخ", "طباخة"],
        specialties: [
            s("homeMeals", "Home meals", "Repas à domicile", "الوجبات المنزلية"),
            s("events", "Parties & events", "Fêtes et événements", "الحفلات والمناسبات"),
            s("pastry", "Moroccan pastry", "Pâtisserie marocaine", "الحلويات المغربية"),
            s("bread", "Bread & msemen", "Pain et msemen", "الخبز والمسمن"),
        ],
    },
    {
        id: "homeCare",
        group: "home",
        en: "Elderly & home care",
        fr: "Aide à domicile",
        ar: "رعاية المسنين في المنزل",
        keywords: ["aide domicile", "garde malade", "personnes agees", "رعاية"],
        specialties: [
            s("elderly", "Elderly care", "Aide aux personnes âgées", "رعاية كبار السن"),
            s("sickCare", "Help for sick people", "Garde-malade", "مرافقة المرضى"),
            s("errands", "Errands & company", "Courses et compagnie", "قضاء الأغراض والمرافقة"),
        ],
    },
    {
        id: "childcare",
        group: "home",
        en: "Childcare",
        fr: "Garde d'enfants",
        ar: "رعاية الأطفال",
        keywords: ["nounou", "baby sitter", "garde enfants", "حاضنة"],
        specialties: [
            s("babysitting", "Babysitting", "Baby-sitting", "مجالسة الأطفال"),
            s("schoolPickup", "School pick-up", "Sortie d'école", "مرافقة الأطفال إلى المدرسة"),
            s("homework", "Homework help", "Aide aux devoirs", "المساعدة في الواجبات"),
        ],
    },
    {
        id: "pestControl",
        group: "home",
        en: "Pest control",
        fr: "Désinsectisation et dératisation",
        ar: "مكافحة الحشرات والقوارض",
        keywords: ["cafards", "punaises", "rats", "desinsectisation", "حشرات"],
        specialties: [
            s("insects", "Insects (cockroaches, bed bugs…)", "Insectes (cafards, punaises…)", "الحشرات"),
            s("rodents", "Rats & mice", "Rats et souris", "الفئران"),
            s("termites", "Termites", "Termites", "النمل الأبيض"),
        ],
    },
    // ---------------------------------------------------------------- outdoor
    {
        id: "gardener",
        group: "outdoor",
        en: "Gardener",
        fr: "Jardinier",
        ar: "بستاني",
        keywords: ["jardin", "jardinage", "gazon", "حديقة", "جردة"],
        specialties: [
            s("maintenance", "Garden maintenance", "Entretien de jardin", "صيانة الحدائق"),
            s("lawn", "Lawn", "Gazon", "العشب"),
            s("pruning", "Tree pruning", "Taille d'arbres", "تقليم الأشجار"),
            s("irrigation", "Watering systems", "Arrosage automatique", "أنظمة السقي"),
            s("landscaping", "Garden design", "Aménagement paysager", "تنسيق الحدائق"),
        ],
    },
    {
        id: "farmWorker",
        group: "outdoor",
        en: "Farm worker",
        fr: "Ouvrier agricole",
        ar: "عامل فلاحي",
        keywords: ["agriculture", "ferme", "fellah", "recolte", "فلاحة", "جني"],
        specialties: [
            s("harvest", "Harvest & picking", "Récolte et cueillette", "الجني والحصاد"),
            s("pruning", "Pruning", "Taille", "التقليم"),
            s("irrigation", "Irrigation", "Irrigation", "السقي"),
            s("greenhouses", "Greenhouses", "Serres", "البيوت البلاستيكية"),
            s("livestock", "Livestock", "Élevage", "تربية المواشي"),
        ],
    },
    {
        id: "pool",
        group: "outdoor",
        en: "Pool maintenance",
        fr: "Pisciniste",
        ar: "صيانة المسابح",
        keywords: ["piscine", "مسبح"],
        specialties: [
            s("cleaning", "Pool cleaning", "Nettoyage de piscine", "تنظيف المسابح"),
            s("treatment", "Water treatment", "Traitement de l'eau", "معالجة المياه"),
            s("equipment", "Pumps & filters", "Pompes et filtres", "المضخات والمصافي"),
        ],
    },
    {
        id: "wellDigger",
        group: "outdoor",
        en: "Well digger",
        fr: "Puisatier",
        ar: "حفّار الآبار",
        keywords: ["puits", "forage", "sondage", "بئر", "حفر"],
        specialties: [
            s("digging", "Well digging", "Creusage de puits", "حفر الآبار"),
            s("cleaning", "Well cleaning", "Curage de puits", "تنظيف الآبار"),
            s("septic", "Septic tanks", "Fosses septiques", "الحفر الصحية"),
        ],
    },
    // ---------------------------------------------------------------- repairs
    {
        id: "handyman",
        group: "repair",
        en: "Handyman",
        fr: "Bricoleur (homme à tout faire)",
        ar: "حرفي متعدد الخدمات",
        keywords: ["bricolage", "petits travaux", "montage meuble", "بريكولاج"],
        specialties: [
            s("smallRepairs", "Small repairs", "Petites réparations", "الإصلاحات الصغيرة"),
            s("assembly", "Furniture assembly", "Montage de meubles", "تركيب الأثاث"),
            s("mounting", "Hanging & mounting", "Fixations murales", "التثبيت على الجدران"),
        ],
    },
    {
        id: "appliances",
        group: "repair",
        en: "Appliance repair",
        fr: "Réparation électroménager",
        ar: "إصلاح الأجهزة المنزلية",
        keywords: ["machine a laver", "four", "frigo", "reparateur", "إصلاح"],
        specialties: [
            s("washingMachines", "Washing machines", "Machines à laver", "آلات الغسيل"),
            s("fridges", "Fridges", "Réfrigérateurs", "الثلاجات"),
            s("ovens", "Ovens & cookers", "Fours et cuisinières", "الأفران والطباخات"),
            s("tv", "TV & electronics", "TV et électronique", "التلفاز والإلكترونيات"),
        ],
    },
    {
        id: "mechanic",
        group: "repair",
        en: "Mechanic",
        fr: "Mécanicien",
        ar: "ميكانيكي",
        keywords: ["mecanique", "garage", "mikanisyan", "ميكانيك"],
        specialties: [
            s("car", "Car mechanics", "Mécanique auto", "ميكانيك السيارات"),
            s("moto", "Moto mechanics", "Mécanique moto", "ميكانيك الدراجات"),
            s("autoElectric", "Auto electricity", "Électricité auto", "كهرباء السيارات"),
            s("bodywork", "Bodywork & paint", "Tôlerie et peinture", "السمكرة والصباغة"),
            s("tyres", "Tyres", "Pneus", "العجلات"),
        ],
    },
    {
        id: "devices",
        group: "repair",
        en: "Phone & computer repair",
        fr: "Réparation téléphone et ordinateur",
        ar: "إصلاح الهواتف والحواسيب",
        keywords: ["gsm", "telephone", "pc", "informatique", "هاتف", "حاسوب"],
        specialties: [
            s("phones", "Phones", "Téléphones", "الهواتف"),
            s("computers", "Computers", "Ordinateurs", "الحواسيب"),
            s("software", "Software & installation", "Logiciels et installation", "البرامج والتثبيت"),
        ],
    },
    {
        id: "locksmith",
        group: "repair",
        en: "Locksmith",
        fr: "Serrurier",
        ar: "صانع الأقفال",
        keywords: ["serrure", "cle", "ouverture porte", "قفل", "ساروت"],
        specialties: [
            s("opening", "Door opening", "Ouverture de porte", "فتح الأبواب"),
            s("locks", "Lock change", "Changement de serrure", "تغيير الأقفال"),
            s("keys", "Key copies", "Reproduction de clés", "نسخ المفاتيح"),
        ],
    },
    // ---------------------------------------------------------------- moving
    {
        id: "mover",
        group: "moving",
        en: "Mover & porter",
        fr: "Déménageur et manutentionnaire",
        ar: "عمال الرحيل والحمالة",
        keywords: ["demenagement", "hammal", "chargement", "رحيل", "حمال"],
        specialties: [
            s("moving", "House moving", "Déménagement", "نقل الأثاث"),
            s("loading", "Loading & unloading", "Chargement et déchargement", "الشحن والتفريغ"),
            s("assembly", "Furniture dismantling & assembly", "Démontage et remontage", "فك وتركيب الأثاث"),
        ],
    },
    // ---------------------------------------------------------------- crafts
    {
        id: "tailor",
        group: "crafts",
        en: "Tailor & seamstress",
        fr: "Couturier / couturière",
        ar: "خيّاط / خيّاطة",
        keywords: ["couture", "caftan", "djellaba", "khiata", "خياطة", "قفطان"],
        specialties: [
            s("traditional", "Caftans & djellabas", "Caftans et djellabas", "القفطان والجلابة"),
            s("alterations", "Alterations", "Retouches", "التعديلات"),
            s("curtains", "Curtains & home textiles", "Rideaux et linge de maison", "الستائر والمفروشات"),
            s("embroidery", "Embroidery", "Broderie", "الطرز"),
        ],
    },
    {
        id: "beauty",
        group: "crafts",
        en: "Hairdresser & beauty (at home)",
        fr: "Coiffure et beauté à domicile",
        ar: "الحلاقة والتجميل في المنزل",
        keywords: ["coiffeuse", "coiffeur", "henna", "neggafa", "حلاقة", "حناء"],
        specialties: [
            s("hair", "Hairdressing", "Coiffure", "تصفيف الشعر"),
            s("barber", "Barber", "Barbier", "الحلاقة الرجالية"),
            s("henna", "Henna", "Henné", "النقش بالحناء"),
            s("makeup", "Make-up", "Maquillage", "الماكياج"),
        ],
    },
    {
        id: "events",
        group: "crafts",
        en: "Events staff",
        fr: "Personnel d'événements",
        ar: "خدمات الحفلات",
        keywords: ["serveur", "neggafa", "mariage", "fete", "نكافة", "عرس"],
        specialties: [
            s("waiter", "Waiter", "Serveur", "نادل"),
            s("neggafa", "Neggafa", "Neggafa", "النكافة"),
            s("setup", "Setup & decoration", "Installation et décoration", "التجهيز والتزيين"),
            s("dj", "DJ & music", "DJ et musique", "الموسيقى"),
        ],
    },
];

/** "Other": the worker types the trade himself. */
export const OTHER_TRADE = "other";

export const TRADE_IDS = new Set(WORKER_TRADES.map((trade) => trade.id));

export const tradeById = (id) => WORKER_TRADES.find((trade) => trade.id === id) || null;

/** Every word a trade can be found with (labels, specialties, keywords), lowercase. */
export function tradeSearchWords(tradeId) {
    const trade = tradeById(tradeId);
    if (!trade) return [];
    return [
        trade.en,
        trade.fr,
        trade.ar,
        ...(trade.keywords || []),
        ...trade.specialties.flatMap((specialty) => [specialty.en, specialty.fr, specialty.ar]),
    ];
}

export default WORKER_TRADES;
