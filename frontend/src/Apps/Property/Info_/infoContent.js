// Text of the public pages: About, Contact, Privacy policy, Terms of use.
// Edit freely. Each section: { heading, paragraphs: [], list: [] }.
//
// The Privacy policy and Terms describe what the application does today.
// They are a starting point, not legal advice: have them reviewed (in
// Morocco, Law 09-08 on personal data and the CNDP apply).

export const CONTACT_EMAIL = "eltariq37@gmail.com";
export const LAST_UPDATED = "2026-11-21";

const content = {
    en: {
        nav: { about: "About", contact: "Contact", privacy: "Privacy", terms: "Terms", openApp: "Open the app", login: "Log in" },
        updated: "Last updated",
        onThisPage: "On this page",
        about: {
            title: "About MultiServices",
            subtitle: "One place in Morocco to find a home, a roommate, a hotel or a riad.",
            sections: [
                {
                    heading: "What we do",
                    paragraphs: [
                        "MultiServices helps people in Morocco find and publish places to live and stay: properties for sale or rent, furnished rentals, rooms to share, hotels, riads and guesthouses.",
                        "Anyone can publish for free after verifying their email and WhatsApp number, so visitors can contact real people directly.",
                    ],
                },
                {
                    heading: "What you can do",
                    list: [
                        "Browse properties, furnished rentals, roommate announcements and establishments, on a list or on a map.",
                        "Save the listings you like and create alerts: we notify you by email or WhatsApp when a matching listing is published.",
                        "Publish and manage your own listings, and see how many people viewed or contacted them.",
                        "Read the Knowledge Center: practical guides and videos about buying, renting and owning property in Morocco.",
                        "See listings from other Moroccan real-estate websites, with a link to the original ad.",
                    ],
                },
                {
                    heading: "Our principles",
                    list: [
                        "Verified publishers: an email and a WhatsApp number are verified before publishing.",
                        "Direct contact: you talk to the publisher, we do not take a commission.",
                        "Moderation: reported or misleading publications can be removed and accounts suspended.",
                        "Three languages: English, French and Arabic.",
                    ],
                },
                {
                    heading: "What comes next",
                    paragraphs: [
                        "More services are being prepared on the same platform: cars, drivers, delivery, daily workers and companies.",
                    ],
                },
            ],
        },
        contact: {
            title: "Contact us",
            subtitle: "A question, a problem with a listing or an idea? We read every message.",
            emailLabel: "Email",
            emailText: "The fastest way to reach us. We usually answer within two working days.",
            feedbackLabel: "Feedback and reports",
            feedbackText: "Logged in? Use the Feedback page to report a bug, a suspicious listing or a user, with screenshots.",
            feedbackButton: "Open the Feedback page",
            socialLabel: "Social media",
            locationLabel: "Location",
            location: "Morocco",
            tipsHeading: "To help us answer quickly",
            tips: [
                "Write the link of the listing or the page concerned.",
                "For an account question, write from the email address of your account.",
                "Never send your password: we will never ask for it.",
            ],
        },
        privacy: {
            title: "Privacy policy",
            subtitle: "What we collect, why, and how you stay in control.",
            sections: [
                {
                    heading: "1. Who we are",
                    paragraphs: [
                        "MultiServices is a listings platform based in Morocco. For any question about your data, write to us at the email address on the Contact page.",
                    ],
                },
                {
                    heading: "2. What we collect",
                    list: [
                        "Account: first and last name, email address, password (stored encrypted, never readable), language.",
                        "Contact numbers: phone number and WhatsApp number, and whether they are verified.",
                        "Profile (optional): photo, address, biography.",
                        "Publications: the details, photos, location and video links of the listings you publish, and their status.",
                        "Activity: listings you save, alerts you create, reviews you write, feedback and reports you send (with attachments).",
                        "Usage statistics: pages visited and time spent, clicks on listings, and clicks on Call / WhatsApp / Email buttons. They are linked to a random visitor ID stored in your browser and, when you are logged in, to your account.",
                    ],
                },
                {
                    heading: "3. Why we use it",
                    list: [
                        "To create and secure your account and keep you logged in.",
                        "To show your publications, with your contact number, to visitors.",
                        "To send the emails and WhatsApp/SMS messages you ask for: verification codes, alerts, password reset, account notices.",
                        "To moderate the platform: prevent fraud, handle reports, suspend accounts that break the rules.",
                        "To understand how the platform is used and improve it (statistics shown to publishers and administrators).",
                    ],
                },
                {
                    heading: "4. What other people see",
                    paragraphs: [
                        "Your published listings, your name, your public profile (photo, biography, reviews) and the contact number of your listings are visible to visitors. Your email is shown only if you choose to show it on a listing. Your password, address and statistics are never public.",
                    ],
                },
                {
                    heading: "5. Services we rely on",
                    list: [
                        "Image hosting (Cloudinary) for profile and listing photos.",
                        "An SMS and WhatsApp messaging provider to send verification codes and alerts.",
                        "An email provider to send emails.",
                        "YouTube, when a listing or an article includes a video, and Google Maps links for locations.",
                    ],
                    paragraphs: [
                        "These services only receive what they need to do their job. We do not sell your data and we do not show advertising.",
                    ],
                },
                {
                    heading: "6. Cookies and browser storage",
                    list: [
                        "A login cookie (\"token\"), required to keep you logged in. It cannot be read by scripts and expires after 24 hours.",
                        "A random visitor ID in your browser storage, used for the statistics described above.",
                        "Your language choice, in your browser storage.",
                    ],
                    paragraphs: ["We do not use advertising or third-party tracking cookies."],
                },
                {
                    heading: "7. How long we keep it",
                    list: [
                        "Your account and publications: as long as your account exists.",
                        "When you delete your account, it is scheduled for deletion and permanently removed after 30 days. Logging in during these 30 days cancels the deletion.",
                        "Some records may be kept longer when required by law or to handle a dispute or a report.",
                    ],
                },
                {
                    heading: "8. Your rights",
                    paragraphs: [
                        "You can see and correct your information in Settings, change your notification choices, and delete your account at any time. You can also ask us for a copy of your data, its correction or deletion, or object to a use of it, by writing to the email on the Contact page.",
                        "If you live in Morocco, Law 09-08 on the protection of personal data gives you these rights, and you can also contact the CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel).",
                    ],
                },
                {
                    heading: "9. Security",
                    paragraphs: [
                        "Passwords are encrypted, connections use HTTPS, login attempts and verification codes are limited, and only administrators can see statistics. No system is perfectly secure: use a strong password that you use nowhere else.",
                    ],
                },
                {
                    heading: "10. Changes",
                    paragraphs: ["We will update this page when our practices change, and change the date above. Important changes will be announced in the application."],
                },
            ],
        },
        terms: {
            title: "Terms of use",
            subtitle: "The rules for using MultiServices, in plain words.",
            sections: [
                {
                    heading: "1. Accepting these terms",
                    paragraphs: ["By creating an account or using MultiServices, you accept these terms. If you do not accept them, please do not use the platform."],
                },
                {
                    heading: "2. Your account",
                    list: [
                        "Give true information and keep your email and numbers up to date.",
                        "Keep your password secret. You are responsible for what is done with your account.",
                        "One person, one account. Accounts created to get around a suspension will be closed.",
                    ],
                },
                {
                    heading: "3. Publishing",
                    list: [
                        "Publish only places you are allowed to offer (as owner, agent or agency), with true information, prices and photos.",
                        "Use your own photos, or photos you have the right to use.",
                        "Keep your listings up to date: mark them as sold, rented or inactive when they are no longer available.",
                        "You remain responsible for your listings and for any agreement you make with other users.",
                        "You allow us to display your listings and photos on the platform and to adapt them (size, format) for display.",
                    ],
                },
                {
                    heading: "4. Not allowed",
                    list: [
                        "Fake, misleading or duplicate listings, bait prices, or listings for places that do not exist.",
                        "Asking for payments or deposits before a visit, or any other scam.",
                        "Discriminatory, offensive or illegal content, or content that is not about housing or accommodation.",
                        "Harassing users, collecting their contact details for other purposes, or sending spam.",
                        "Copying the platform's content automatically, or trying to break its security.",
                    ],
                },
                {
                    heading: "5. Our role",
                    paragraphs: [
                        "MultiServices puts people in contact. We are not a party to the sale, rental or stay, we do not check every listing before it is published, and we do not hold any money. Always visit a place and check documents before paying anything.",
                        "Listings from other websites are shown with a link to the original ad; the original website is responsible for them.",
                        "Knowledge Center content is general information, not legal or financial advice.",
                    ],
                },
                {
                    heading: "6. Moderation and suspension",
                    paragraphs: [
                        "We may remove a publication or suspend an account that breaks these terms or the law, or after reports from other users. A suspended user cannot log in and their publications are hidden. You can contact us if you think a decision is a mistake.",
                    ],
                },
                {
                    heading: "7. Availability and liability",
                    paragraphs: [
                        "We do our best to keep the platform available and correct, but we cannot promise it will always work without interruption or errors. Within the limits allowed by law, we are not responsible for losses caused by listings, by other users, or by an interruption of the service.",
                    ],
                },
                {
                    heading: "8. Ending",
                    paragraphs: ["You can delete your account at any time from Settings (see the Privacy policy for the 30-day delay)."],
                },
                {
                    heading: "9. Changes and law",
                    paragraphs: [
                        "We may update these terms; the date above shows the latest version. These terms are governed by Moroccan law.",
                    ],
                },
            ],
        },
        signupNotice: { before: "By creating an account you accept the", terms: "Terms of use", and: "and the", privacy: "Privacy policy" },
    },

    fr: {
        nav: { about: "À propos", contact: "Contact", privacy: "Confidentialité", terms: "Conditions", openApp: "Ouvrir l'application", login: "Se connecter" },
        updated: "Dernière mise à jour",
        onThisPage: "Sur cette page",
        about: {
            title: "À propos de MultiServices",
            subtitle: "Un seul endroit au Maroc pour trouver un logement, un colocataire, un hôtel ou un riad.",
            sections: [
                {
                    heading: "Ce que nous faisons",
                    paragraphs: [
                        "MultiServices aide les personnes au Maroc à trouver et publier des lieux où vivre et séjourner : biens à vendre ou à louer, locations meublées, chambres en colocation, hôtels, riads et maisons d'hôtes.",
                        "Tout le monde peut publier gratuitement après avoir vérifié son e-mail et son numéro WhatsApp : les visiteurs contactent ainsi de vraies personnes, directement.",
                    ],
                },
                {
                    heading: "Ce que vous pouvez faire",
                    list: [
                        "Parcourir les biens, locations meublées, annonces de colocation et établissements, en liste ou sur une carte.",
                        "Enregistrer vos annonces préférées et créer des alertes : nous vous prévenons par e-mail ou WhatsApp dès qu'une annonce correspond.",
                        "Publier et gérer vos annonces, et voir combien de personnes les ont vues ou vous ont contacté.",
                        "Lire le Centre de connaissances : guides et vidéos pratiques sur l'achat, la location et la propriété au Maroc.",
                        "Voir des annonces d'autres sites immobiliers marocains, avec un lien vers l'annonce d'origine.",
                    ],
                },
                {
                    heading: "Nos principes",
                    list: [
                        "Annonceurs vérifiés : un e-mail et un numéro WhatsApp sont vérifiés avant de publier.",
                        "Contact direct : vous parlez à l'annonceur, nous ne prenons aucune commission.",
                        "Modération : les publications signalées ou trompeuses peuvent être retirées et les comptes suspendus.",
                        "Trois langues : anglais, français et arabe.",
                    ],
                },
                {
                    heading: "Et ensuite",
                    paragraphs: ["D'autres services sont en préparation sur la même plateforme : voitures, chauffeurs, livraison, travailleurs journaliers et entreprises."],
                },
            ],
        },
        contact: {
            title: "Nous contacter",
            subtitle: "Une question, un problème avec une annonce ou une idée ? Nous lisons chaque message.",
            emailLabel: "E-mail",
            emailText: "Le moyen le plus rapide de nous joindre. Nous répondons en général sous deux jours ouvrables.",
            feedbackLabel: "Avis et signalements",
            feedbackText: "Connecté ? Utilisez la page Avis pour signaler un bug, une annonce suspecte ou un utilisateur, avec des captures d'écran.",
            feedbackButton: "Ouvrir la page Avis",
            socialLabel: "Réseaux sociaux",
            locationLabel: "Localisation",
            location: "Maroc",
            tipsHeading: "Pour une réponse rapide",
            tips: [
                "Indiquez le lien de l'annonce ou de la page concernée.",
                "Pour une question sur votre compte, écrivez depuis l'adresse e-mail de votre compte.",
                "N'envoyez jamais votre mot de passe : nous ne le demanderons jamais.",
            ],
        },
        privacy: {
            title: "Politique de confidentialité",
            subtitle: "Ce que nous collectons, pourquoi, et comment vous gardez le contrôle.",
            sections: [
                { heading: "1. Qui sommes-nous", paragraphs: ["MultiServices est une plateforme d'annonces basée au Maroc. Pour toute question sur vos données, écrivez-nous à l'adresse e-mail de la page Contact."] },
                {
                    heading: "2. Ce que nous collectons",
                    list: [
                        "Compte : prénom et nom, adresse e-mail, mot de passe (stocké chiffré, jamais lisible), langue.",
                        "Numéros de contact : numéro de téléphone et numéro WhatsApp, et s'ils sont vérifiés.",
                        "Profil (facultatif) : photo, adresse, biographie.",
                        "Publications : détails, photos, localisation et liens vidéo des annonces que vous publiez, et leur statut.",
                        "Activité : annonces enregistrées, alertes créées, avis rédigés, retours et signalements envoyés (avec pièces jointes).",
                        "Statistiques d'utilisation : pages visitées et temps passé, clics sur les annonces et sur les boutons Appeler / WhatsApp / E-mail. Elles sont liées à un identifiant de visiteur aléatoire stocké dans votre navigateur et, si vous êtes connecté, à votre compte.",
                    ],
                },
                {
                    heading: "3. Pourquoi nous les utilisons",
                    list: [
                        "Créer et sécuriser votre compte et vous garder connecté.",
                        "Afficher vos publications, avec votre numéro de contact, aux visiteurs.",
                        "Envoyer les e-mails et messages WhatsApp/SMS que vous demandez : codes de vérification, alertes, réinitialisation du mot de passe, avis concernant votre compte.",
                        "Modérer la plateforme : prévenir la fraude, traiter les signalements, suspendre les comptes qui enfreignent les règles.",
                        "Comprendre l'utilisation de la plateforme et l'améliorer (statistiques montrées aux annonceurs et aux administrateurs).",
                    ],
                },
                { heading: "4. Ce que les autres voient", paragraphs: ["Vos annonces publiées, votre nom, votre profil public (photo, biographie, avis) et le numéro de contact de vos annonces sont visibles par les visiteurs. Votre e-mail n'est affiché que si vous le choisissez sur une annonce. Votre mot de passe, votre adresse et vos statistiques ne sont jamais publics."] },
                {
                    heading: "5. Services utilisés",
                    list: [
                        "Hébergement d'images (Cloudinary) pour les photos de profil et d'annonces.",
                        "Un fournisseur de messages SMS et WhatsApp pour les codes de vérification et les alertes.",
                        "Un fournisseur d'e-mails pour l'envoi des e-mails.",
                        "YouTube, lorsqu'une annonce ou un article contient une vidéo, et des liens Google Maps pour les localisations.",
                    ],
                    paragraphs: ["Ces services ne reçoivent que ce dont ils ont besoin. Nous ne vendons pas vos données et n'affichons pas de publicité."],
                },
                {
                    heading: "6. Cookies et stockage du navigateur",
                    list: [
                        "Un cookie de connexion (« token »), nécessaire pour rester connecté. Il n'est pas lisible par les scripts et expire après 24 heures.",
                        "Un identifiant de visiteur aléatoire dans le stockage du navigateur, pour les statistiques décrites ci-dessus.",
                        "Votre choix de langue, dans le stockage du navigateur.",
                    ],
                    paragraphs: ["Nous n'utilisons pas de cookies publicitaires ni de traceurs tiers."],
                },
                {
                    heading: "7. Durée de conservation",
                    list: [
                        "Votre compte et vos publications : tant que votre compte existe.",
                        "Lorsque vous supprimez votre compte, sa suppression est programmée et définitive après 30 jours. Se connecter pendant ces 30 jours annule la suppression.",
                        "Certaines données peuvent être conservées plus longtemps lorsque la loi l'exige ou pour traiter un litige ou un signalement.",
                    ],
                },
                {
                    heading: "8. Vos droits",
                    paragraphs: [
                        "Vous pouvez consulter et corriger vos informations dans Paramètres, modifier vos choix de notifications et supprimer votre compte à tout moment. Vous pouvez aussi nous demander une copie de vos données, leur rectification ou leur suppression, ou vous opposer à un usage, en écrivant à l'e-mail de la page Contact.",
                        "Si vous résidez au Maroc, la loi 09-08 relative à la protection des données personnelles vous accorde ces droits, et vous pouvez également saisir la CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel).",
                    ],
                },
                { heading: "9. Sécurité", paragraphs: ["Les mots de passe sont chiffrés, les connexions utilisent HTTPS, les tentatives de connexion et les codes de vérification sont limités, et seuls les administrateurs voient les statistiques. Aucun système n'est parfaitement sûr : utilisez un mot de passe fort que vous n'utilisez nulle part ailleurs."] },
                { heading: "10. Modifications", paragraphs: ["Nous mettrons cette page à jour si nos pratiques changent, en modifiant la date ci-dessus. Les changements importants seront annoncés dans l'application."] },
            ],
        },
        terms: {
            title: "Conditions d'utilisation",
            subtitle: "Les règles d'utilisation de MultiServices, en termes simples.",
            sections: [
                { heading: "1. Acceptation", paragraphs: ["En créant un compte ou en utilisant MultiServices, vous acceptez ces conditions. Si vous ne les acceptez pas, merci de ne pas utiliser la plateforme."] },
                {
                    heading: "2. Votre compte",
                    list: [
                        "Donnez des informations exactes et gardez votre e-mail et vos numéros à jour.",
                        "Gardez votre mot de passe secret. Vous êtes responsable de ce qui est fait avec votre compte.",
                        "Une personne, un compte. Les comptes créés pour contourner une suspension seront fermés.",
                    ],
                },
                {
                    heading: "3. Publier",
                    list: [
                        "Publiez uniquement des biens que vous êtes autorisé à proposer (propriétaire, agent ou agence), avec des informations, prix et photos exacts.",
                        "Utilisez vos propres photos, ou des photos que vous avez le droit d'utiliser.",
                        "Tenez vos annonces à jour : marquez-les vendues, louées ou inactives lorsqu'elles ne sont plus disponibles.",
                        "Vous restez responsable de vos annonces et de tout accord conclu avec d'autres utilisateurs.",
                        "Vous nous autorisez à afficher vos annonces et photos sur la plateforme et à les adapter (taille, format) pour l'affichage.",
                    ],
                },
                {
                    heading: "4. Interdit",
                    list: [
                        "Les annonces fausses, trompeuses ou en double, les prix d'appel, ou les biens qui n'existent pas.",
                        "Demander un paiement ou un acompte avant une visite, ou toute autre arnaque.",
                        "Les contenus discriminatoires, offensants ou illégaux, ou sans rapport avec le logement ou l'hébergement.",
                        "Harceler des utilisateurs, collecter leurs coordonnées à d'autres fins ou envoyer du spam.",
                        "Copier automatiquement le contenu de la plateforme ou tenter d'en contourner la sécurité.",
                    ],
                },
                {
                    heading: "5. Notre rôle",
                    paragraphs: [
                        "MultiServices met les personnes en relation. Nous ne sommes pas partie à la vente, à la location ou au séjour, nous ne vérifions pas chaque annonce avant publication et nous ne détenons aucun argent. Visitez toujours un bien et vérifiez les documents avant de payer quoi que ce soit.",
                        "Les annonces d'autres sites sont affichées avec un lien vers l'annonce d'origine ; le site d'origine en est responsable.",
                        "Le contenu du Centre de connaissances est une information générale, pas un conseil juridique ou financier.",
                    ],
                },
                { heading: "6. Modération et suspension", paragraphs: ["Nous pouvons retirer une publication ou suspendre un compte qui enfreint ces conditions ou la loi, ou à la suite de signalements. Un utilisateur suspendu ne peut plus se connecter et ses publications sont masquées. Contactez-nous si vous pensez qu'une décision est une erreur."] },
                { heading: "7. Disponibilité et responsabilité", paragraphs: ["Nous faisons de notre mieux pour que la plateforme soit disponible et exacte, sans pouvoir garantir l'absence d'interruptions ou d'erreurs. Dans les limites permises par la loi, nous ne sommes pas responsables des pertes causées par les annonces, par d'autres utilisateurs ou par une interruption du service."] },
                { heading: "8. Fin", paragraphs: ["Vous pouvez supprimer votre compte à tout moment depuis Paramètres (voir le délai de 30 jours dans la Politique de confidentialité)."] },
                { heading: "9. Modifications et droit applicable", paragraphs: ["Nous pouvons mettre à jour ces conditions ; la date ci-dessus indique la dernière version. Ces conditions sont régies par le droit marocain."] },
            ],
        },
        signupNotice: { before: "En créant un compte, vous acceptez les", terms: "Conditions d'utilisation", and: "et la", privacy: "Politique de confidentialité" },
    },

    ar: {
        nav: { about: "من نحن", contact: "اتصل بنا", privacy: "الخصوصية", terms: "الشروط", openApp: "فتح التطبيق", login: "تسجيل الدخول" },
        updated: "آخر تحديث",
        onThisPage: "في هذه الصفحة",
        about: {
            title: "عن MultiServices",
            subtitle: "مكان واحد في المغرب للعثور على سكن أو شريك سكن أو فندق أو رياض.",
            sections: [
                {
                    heading: "ماذا نفعل",
                    paragraphs: [
                        "تساعد MultiServices الناس في المغرب على إيجاد ونشر أماكن للسكن والإقامة: عقارات للبيع أو الكراء، شقق مفروشة، غرف للسكن المشترك، فنادق ورياضات ودور ضيافة.",
                        "يمكن لأي شخص النشر مجاناً بعد التحقق من بريده الإلكتروني ورقم واتساب، ليتواصل الزوار مع أشخاص حقيقيين مباشرة.",
                    ],
                },
                {
                    heading: "ما يمكنك فعله",
                    list: [
                        "تصفح العقارات والشقق المفروشة وإعلانات السكن المشترك والمؤسسات، في قائمة أو على الخريطة.",
                        "حفظ الإعلانات التي تعجبك وإنشاء تنبيهات: نخبرك عبر البريد أو واتساب عند نشر إعلان مطابق.",
                        "نشر إعلاناتك وإدارتها، ومعرفة عدد من شاهدها أو تواصل معك.",
                        "قراءة مركز المعرفة: أدلة ومقاطع فيديو عملية حول الشراء والكراء والملكية في المغرب.",
                        "مشاهدة إعلانات من مواقع عقارية مغربية أخرى، مع رابط إلى الإعلان الأصلي.",
                    ],
                },
                {
                    heading: "مبادئنا",
                    list: [
                        "ناشرون موثقون: يتم التحقق من البريد الإلكتروني ورقم واتساب قبل النشر.",
                        "تواصل مباشر: تتحدث مع الناشر، ولا نأخذ أي عمولة.",
                        "الإشراف: يمكن حذف المنشورات المبلغ عنها أو المضللة وتعليق الحسابات.",
                        "ثلاث لغات: الإنجليزية والفرنسية والعربية.",
                    ],
                },
                { heading: "ما القادم", paragraphs: ["خدمات أخرى قيد التحضير على نفس المنصة: السيارات، السائقون، التوصيل، العمال اليوميون والشركات."] },
            ],
        },
        contact: {
            title: "اتصل بنا",
            subtitle: "سؤال، مشكلة في إعلان أو فكرة؟ نقرأ كل رسالة.",
            emailLabel: "البريد الإلكتروني",
            emailText: "أسرع طريقة للتواصل معنا. نرد عادة خلال يومي عمل.",
            feedbackLabel: "الملاحظات والبلاغات",
            feedbackText: "هل أنت مسجل الدخول؟ استخدم صفحة الملاحظات للإبلاغ عن خلل أو إعلان مشبوه أو مستخدم، مع لقطات الشاشة.",
            feedbackButton: "فتح صفحة الملاحظات",
            socialLabel: "وسائل التواصل الاجتماعي",
            locationLabel: "الموقع",
            location: "المغرب",
            tipsHeading: "لكي نجيبك بسرعة",
            tips: [
                "اكتب رابط الإعلان أو الصفحة المعنية.",
                "لسؤال عن حسابك، راسلنا من البريد الإلكتروني المرتبط بحسابك.",
                "لا ترسل كلمة المرور أبداً: لن نطلبها منك أبداً.",
            ],
        },
        privacy: {
            title: "سياسة الخصوصية",
            subtitle: "ما الذي نجمعه، ولماذا، وكيف تبقى متحكماً في بياناتك.",
            sections: [
                { heading: "1. من نحن", paragraphs: ["MultiServices منصة إعلانات مقرها المغرب. لأي سؤال حول بياناتك، راسلنا على البريد الإلكتروني الموجود في صفحة اتصل بنا."] },
                {
                    heading: "2. ما الذي نجمعه",
                    list: [
                        "الحساب: الاسم الشخصي والعائلي، البريد الإلكتروني، كلمة المرور (مخزنة مشفرة ولا يمكن قراءتها)، اللغة.",
                        "أرقام التواصل: رقم الهاتف ورقم واتساب، وهل تم التحقق منهما.",
                        "الملف الشخصي (اختياري): الصورة، العنوان، النبذة.",
                        "المنشورات: تفاصيل وصور وموقع وروابط فيديو الإعلانات التي تنشرها، وحالتها.",
                        "النشاط: الإعلانات المحفوظة، التنبيهات، التقييمات، الملاحظات والبلاغات المرسلة (مع المرفقات).",
                        "إحصائيات الاستخدام: الصفحات المزارة والوقت المستغرق، النقرات على الإعلانات وعلى أزرار الاتصال وواتساب والبريد. ترتبط بمعرّف زائر عشوائي مخزن في متصفحك، وبحسابك عند تسجيل الدخول.",
                    ],
                },
                {
                    heading: "3. لماذا نستخدمها",
                    list: [
                        "لإنشاء حسابك وتأمينه والإبقاء على تسجيل دخولك.",
                        "لعرض منشوراتك مع رقم التواصل للزوار.",
                        "لإرسال الرسائل التي تطلبها عبر البريد أو واتساب أو SMS: رموز التحقق، التنبيهات، إعادة تعيين كلمة المرور، إشعارات الحساب.",
                        "للإشراف على المنصة: منع الاحتيال، معالجة البلاغات، تعليق الحسابات المخالفة.",
                        "لفهم استخدام المنصة وتحسينها (إحصائيات تُعرض على الناشرين والمسؤولين).",
                    ],
                },
                { heading: "4. ما يراه الآخرون", paragraphs: ["إعلاناتك المنشورة واسمك وملفك العام (الصورة، النبذة، التقييمات) ورقم التواصل في إعلاناتك ظاهرة للزوار. لا يظهر بريدك الإلكتروني إلا إذا اخترت ذلك في إعلان. كلمة المرور والعنوان والإحصائيات ليست عامة أبداً."] },
                {
                    heading: "5. الخدمات التي نعتمد عليها",
                    list: [
                        "استضافة الصور (Cloudinary) لصور الملف الشخصي والإعلانات.",
                        "مزود رسائل SMS وواتساب لإرسال رموز التحقق والتنبيهات.",
                        "مزود بريد إلكتروني لإرسال الرسائل.",
                        "يوتيوب عندما يحتوي إعلان أو مقال على فيديو، وروابط خرائط Google للمواقع.",
                    ],
                    paragraphs: ["لا تتلقى هذه الخدمات إلا ما تحتاجه للقيام بعملها. لا نبيع بياناتك ولا نعرض إعلانات تجارية."],
                },
                {
                    heading: "6. ملفات تعريف الارتباط وتخزين المتصفح",
                    list: [
                        "ملف تسجيل الدخول («token») ضروري للبقاء متصلاً. لا يمكن للسكربتات قراءته وتنتهي صلاحيته بعد 24 ساعة.",
                        "معرّف زائر عشوائي في تخزين المتصفح، للإحصائيات المذكورة أعلاه.",
                        "اختيار اللغة، في تخزين المتصفح.",
                    ],
                    paragraphs: ["لا نستخدم ملفات تعريف ارتباط إعلانية أو أدوات تتبع من أطراف ثالثة."],
                },
                {
                    heading: "7. مدة الاحتفاظ",
                    list: [
                        "حسابك ومنشوراتك: طالما بقي حسابك موجوداً.",
                        "عند حذف حسابك، تتم جدولة الحذف ويُحذف نهائياً بعد 30 يوماً. تسجيل الدخول خلال هذه المدة يلغي الحذف.",
                        "قد يُحتفظ ببعض البيانات مدة أطول إذا اقتضى القانون ذلك أو لمعالجة نزاع أو بلاغ.",
                    ],
                },
                {
                    heading: "8. حقوقك",
                    paragraphs: [
                        "يمكنك الاطلاع على معلوماتك وتصحيحها من الإعدادات، وتغيير خيارات الإشعارات، وحذف حسابك في أي وقت. يمكنك أيضاً طلب نسخة من بياناتك أو تصحيحها أو حذفها أو الاعتراض على استخدامها عبر البريد الإلكتروني في صفحة اتصل بنا.",
                        "إذا كنت مقيماً في المغرب، يمنحك القانون 09-08 المتعلق بحماية المعطيات ذات الطابع الشخصي هذه الحقوق، ويمكنك أيضاً اللجوء إلى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP).",
                    ],
                },
                { heading: "9. الأمان", paragraphs: ["كلمات المرور مشفرة، والاتصالات تستخدم HTTPS، ومحاولات تسجيل الدخول ورموز التحقق محدودة، والإحصائيات لا يراها إلا المسؤولون. لا يوجد نظام آمن تماماً: استخدم كلمة مرور قوية لا تستعملها في مكان آخر."] },
                { heading: "10. التعديلات", paragraphs: ["سنحدّث هذه الصفحة عند تغيّر ممارساتنا مع تغيير التاريخ أعلاه. سيتم الإعلان عن التغييرات المهمة داخل التطبيق."] },
            ],
        },
        terms: {
            title: "شروط الاستخدام",
            subtitle: "قواعد استخدام MultiServices بكلمات بسيطة.",
            sections: [
                { heading: "1. قبول الشروط", paragraphs: ["بإنشاء حساب أو استخدام MultiServices فإنك تقبل هذه الشروط. إذا لم تقبلها، يرجى عدم استخدام المنصة."] },
                {
                    heading: "2. حسابك",
                    list: [
                        "قدّم معلومات صحيحة وحافظ على تحديث بريدك وأرقامك.",
                        "احتفظ بكلمة المرور سرية. أنت مسؤول عما يتم بحسابك.",
                        "شخص واحد، حساب واحد. ستُغلق الحسابات المنشأة للتحايل على التعليق.",
                    ],
                },
                {
                    heading: "3. النشر",
                    list: [
                        "انشر فقط أماكن يحق لك عرضها (مالك أو وسيط أو وكالة)، بمعلومات وأسعار وصور صحيحة.",
                        "استخدم صورك الخاصة أو صوراً يحق لك استعمالها.",
                        "حافظ على تحديث إعلاناتك: ضع علامة مباع أو مكترى أو غير نشط عندما لا يعود متاحاً.",
                        "تبقى مسؤولاً عن إعلاناتك وعن أي اتفاق تبرمه مع مستخدمين آخرين.",
                        "تسمح لنا بعرض إعلاناتك وصورك على المنصة وتكييفها (الحجم والصيغة) للعرض.",
                    ],
                },
                {
                    heading: "4. الممنوع",
                    list: [
                        "الإعلانات الوهمية أو المضللة أو المكررة، والأسعار الخادعة، أو أماكن غير موجودة.",
                        "طلب دفعة أو عربون قبل الزيارة، أو أي نوع من الاحتيال.",
                        "المحتوى التمييزي أو المسيء أو غير القانوني، أو غير المتعلق بالسكن والإقامة.",
                        "مضايقة المستخدمين أو جمع بياناتهم لأغراض أخرى أو إرسال رسائل مزعجة.",
                        "نسخ محتوى المنصة آلياً أو محاولة اختراق أمانها.",
                    ],
                },
                {
                    heading: "5. دورنا",
                    paragraphs: [
                        "تربط MultiServices بين الأشخاص. لسنا طرفاً في البيع أو الكراء أو الإقامة، ولا نراجع كل إعلان قبل نشره، ولا نحتفظ بأي أموال. زر المكان دائماً وتحقق من الوثائق قبل دفع أي مبلغ.",
                        "تُعرض إعلانات المواقع الأخرى مع رابط إلى الإعلان الأصلي، والموقع الأصلي مسؤول عنها.",
                        "محتوى مركز المعرفة معلومات عامة وليس استشارة قانونية أو مالية.",
                    ],
                },
                { heading: "6. الإشراف والتعليق", paragraphs: ["يمكننا حذف منشور أو تعليق حساب يخالف هذه الشروط أو القانون، أو بعد بلاغات من مستخدمين آخرين. لا يمكن للمستخدم المعلّق تسجيل الدخول وتُخفى منشوراته. تواصل معنا إذا اعتقدت أن القرار خاطئ."] },
                { heading: "7. التوفر والمسؤولية", paragraphs: ["نبذل جهدنا لتبقى المنصة متاحة وصحيحة، دون أن نضمن خلوها من الانقطاعات أو الأخطاء. في حدود ما يسمح به القانون، لسنا مسؤولين عن الخسائر الناتجة عن الإعلانات أو عن مستخدمين آخرين أو عن انقطاع الخدمة."] },
                { heading: "8. إنهاء الاستخدام", paragraphs: ["يمكنك حذف حسابك في أي وقت من الإعدادات (انظر مهلة 30 يوماً في سياسة الخصوصية)."] },
                { heading: "9. التعديلات والقانون المطبق", paragraphs: ["قد نحدّث هذه الشروط؛ ويشير التاريخ أعلاه إلى آخر نسخة. تخضع هذه الشروط للقانون المغربي."] },
            ],
        },
        signupNotice: { before: "بإنشاء حساب فإنك توافق على", terms: "شروط الاستخدام", and: "و", privacy: "سياسة الخصوصية" },
    },
};

export function getInfoContent(language) {
    const lang = String(language || "en").split("-")[0];
    return content[lang] || content.en;
}
