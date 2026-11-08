/* WIUC 2026 Bratislava: schedule helper. Plain JS, no build step. */
(function () {
  "use strict";

  var DATA = window.WIUC_DATA || { schools: [], events: [] };
  var EXTRA = window.WIUC_EXTRA || [];

  // ------------------------------------------------------------ static data
  var VENUES = {
    "gopass":       { name: "GOPASS Aréna",                         addr: "Trnavská cesta 29" },
    "domsportu":    { name: "Dom športu",                           addr: "Junácka 8" },
    "peugeot":      { name: "PEUGEOT Aréna (Aegon Arena)",          addr: "Príkopova 6" },
    "padel":        { name: "Aurial Padel Bratislava",              addr: "Bajkalská 7" },
    "pasienky":     { name: "Pasienky / Jama",                      addr: "Trnavská cesta 33" },
    "tk-inter":     { name: "Tenisový klub Inter Bratislava",       addr: "Trnavská cesta 33" },
    "tk-slovan":    { name: "TK Slovan Bratislava",                 addr: "Odbojárov 3" },
    "kalinciakova": { name: "ZŠ Kalinčiakova, futbalové ihrisko",   addr: "Kalinčiakova 12" },
    "stu-cas":      { name: "Mladá Garda (STU CAŠ)",                 addr: "Račianska 103" },
    "rovny":        { name: "Hala prof. Rovného (FTVŠ UK)",         addr: "Nábr. arm. gen. L. Svobodu 9" },
    "mlynska-lf":   { name: "Mlynská dolina LF / ŠKP",              addr: "Staré Grunty 36" },
    "mlynska-prif": { name: "Mlynská dolina PRIF / MATFYZ",         addr: "Staré Grunty 36" },
    "pionierska":   { name: "Hala Pionierska",                      addr: "Pionierska 16" },
    "plavaren":     { name: "Plaváreň Pasienky",                    addr: "Junácka 4" }
  };

  // zone colour c (stripe palette), optional darker text colour t for light zones
  var SPORTS = {
    football:    { sk: "Futbal",       en: "Football",     c: "#24a75b", t: "#1b7d44" },
    futsal:      { sk: "Futsal",       en: "Futsal",       c: "#ffc315", t: "#8a6a00" },
    basketball:  { sk: "Basketbal",    en: "Basketball",   c: "#ee792c", t: "#b4530f" },
    volleyball:  { sk: "Volejbal",     en: "Volleyball",   c: "#e93a3f", t: "#c0232a" },
    handball:    { sk: "Hádzaná",      en: "Handball",     c: "#674381" },
    rugby:       { sk: "Rugby 7s",     en: "Rugby 7s",     c: "#ee1953", t: "#c20f42" },
    floorball:   { sk: "Florbal",      en: "Floorball",    c: "#0e5ea5" },
    tennis:      { sk: "Tenis",        en: "Tennis",       c: "#008fb3", t: "#007392" },
    padel:       { sk: "Padel",        en: "Padel",        c: "#88b54e", t: "#4f7a1d" },
    badminton:   { sk: "Bedminton",    en: "Badminton",    c: "#1f40e6" },
    tabletennis: { sk: "Stolný tenis", en: "Table tennis", c: "#c2185b" },
    swimming:    { sk: "Plávanie",     en: "Swimming",     c: "#22b8f0", t: "#0b7fa8" },
    athletics:   { sk: "Atletika",     en: "Athletics",    c: "#c98a00", t: "#8a5f00" },
    ceremony:    { sk: "Ceremoniál",   en: "Ceremony",     c: "#051c2c" }
  };

  var DAYS = [
    { d: "2026-11-04", sk: "Streda",  en: "Wed", skShort: "St", num: "4. 11." },
    { d: "2026-11-05", sk: "Štvrtok", en: "Thu", skShort: "Št", num: "5. 11." },
    { d: "2026-11-06", sk: "Piatok",  en: "Fri", skShort: "Pi", num: "6. 11." },
    { d: "2026-11-07", sk: "Sobota",  en: "Sat", skShort: "So", num: "7. 11." }
  ];

  // organiser PDFs for sports that are not in the sheets
  var PDFS = [
    { sport: "badminton",   sk: "Bedminton: rozpis (PDF)",       en: "Badminton schedule (PDF)",   url: "https://drive.google.com/file/d/1EdxLuea1NPzeKq2XtPV2qebw3dt3Ujnj/view" },
    { sport: "tabletennis", sk: "Stolný tenis: rozpis (PDF)",    en: "Table tennis timetable (PDF)", url: "https://drive.google.com/file/d/1kEBQwLrrpMUpSL5WpCIWMJbyYrlPzDxN/view" },
    { sport: "swimming",    sk: "Plávanie: štartová listina 5. 11. (PDF)", en: "Swimming start list 5 Nov (PDF)", url: "https://drive.google.com/file/d/1P8Ox7-PUbO2oysOwBJkIKaTnIDJ-CLQN/view" },
    { sport: "swimming",    sk: "Plávanie: štartová listina 6. 11. (PDF)", en: "Swimming start list 6 Nov (PDF)", url: "https://drive.google.com/file/d/1HynBruuPasKHimUrNcHxunIbeAtYFRvj/view" },
    { sport: "athletics",   sk: "Atletika: štartové listiny (PDF)", en: "Athletics entry lists (PDF)", url: "https://drive.google.com/file/d/1WJp2ut4cz7t-wqiyX7NtEt3lwX5nALOW/view" }
  ];
  var SOURCE_URL = "https://drive.google.com/drive/folders/1g98fxlj3ZIp15Tsytcrvea8Z9117FwRZ";
  var OFFICIAL_URL = "https://www.wiusc.com/11th-wiuc-bratislava-2026/";
  // ------------------------------------------------------------ rules (from the organiser's General Rules PDF) and parties
  var VENUE_PHOTOS = {
    "gopass": {
      "title": "Slovakia bratislava Gopass Aréna",
      "author": "Arne Müseler",
      "license": "CC BY-SA 4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Slovakia_bratislava_Gopass_Ar%C3%A9na.jpg"
    },
    "pasienky": {
      "title": "Slovakia bratislava Štadión Pasienky",
      "author": "Arne Müseler / www.arne-mueseler.com",
      "license": "CC BY-SA 3.0 DE",
      "source": "https://commons.wikimedia.org/wiki/File:Slovakia_bratislava_%C5%A0tadi%C3%B3n_Pasienky.jpg"
    },
    "peugeot": {
      "title": "Sibamac arena",
      "author": "Jakub Homoľa",
      "license": "CC BY 3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Sibamac_arena.JPG"
    },
    "plavaren": {
      "title": "PLAVÁREŇ PASIENKY - panoramio",
      "author": "Andrej Neuherz",
      "license": "CC BY-SA 3.0",
      "source": "https://commons.wikimedia.org/wiki/File:PLAV%C3%81RE%C5%87_PASIENKY_-_panoramio.jpg"
    },
    "kalinciakova": {
      "title": "Kalinčiakova 12 04",
      "author": "Wizzard",
      "license": "CC BY-SA 4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Kalin%C4%8Diakova_12_04.jpg"
    },
    "stu-cas": {
      "title": "Študentský domov Mladá garda",
      "author": "Midnight Runner",
      "license": "CC BY-SA 4.0",
      "source": "https://commons.wikimedia.org/wiki/File:%C5%A0tudentsk%C3%BD_domov_Mlad%C3%A1_garda.jpg"
    },
    "rovny": {
      "title": "VSJZ Bratislava 12",
      "author": "Jozef Kotulič",
      "license": "CC BY 3.0",
      "source": "https://commons.wikimedia.org/wiki/File:VSJZ_Bratislava_12.JPG"
    }
  };
  var RULES_PDF = "assets/General_Rules_WIUC_2026.pdf";
  var RULES_KEY = {
    sk: [
      "Na športovisko príďte aspoň 30 minút pred začiatkom a nahláste sa u oficiála súťaže.",
      "Uvedené časy sú časy začiatku. Pri meškaní môže byť zápas automaticky kontumovaný.",
      "Akreditačnú kartu noste viditeľne. Bez nej vás na športovisko nepustia.",
      "Poistenie si zabezpečte sami, organizátor ho neposkytuje.",
      "Na športoviskách je zakázaný alkohol aj fajčenie.",
      "Noste si fľašu z uvítacieho balíčka. Plastové fľaše sa nerozdávajú, voda z kohútika je pitná."
    ],
    en: [
      "Arrive at the venue at least 30 minutes before the start and report to the competition official.",
      "Published times are starting times. Late arrival may mean automatic forfeit.",
      "Wear your accreditation card visibly. Without it you cannot enter the sports centres.",
      "Arrange your own insurance; the organisers do not provide it.",
      "Alcohol and smoking are prohibited at sports venues.",
      "Bring the bottle from your welcome pack. No plastic bottles are handed out; tap water is safe to drink."
    ]
  };
  var RULES = [
    { sk: { t: "Pravidlá súťaže", li: [
        "Hráč nesmie v tej istej súťaži reprezentovať viac ako jeden tím. Porušenie znamená kontumáciu oboch zápasov, v ktorých hral.",
        "Tímy musia prísť na určené športovisko aspoň 30 minút pred plánovaným začiatkom a nahlásiť sa príslušnému oficiálovi súťaže.",
        "Zverejnené časy sú časy začiatku. Meškanie môže znamenať automatickú kontumáciu zápasu.",
        "Pre nabitý program sa zápasy môžu hrať na hrubý čas (hodiny sa nezastavujú).",
        "Neúctivé správanie k rozhodcom, zapisovateľom alebo súperom môže viesť ku kontumácii zápasu.",
        "Organizačný výbor môže za porušenie pravidiel diskvalifikovať hráčov, trénerov, funkcionárov, fanúšikov alebo aj celú univerzitu.",
        "Politické vyhlásenia a demonštrácie sú počas podujatia zakázané.",
        "Obťažovanie a diskriminácia na základe pohlavia, rodovej identity, sexuálnej orientácie, fyzických vlastností, zdravotného postihnutia, etnického či národného pôvodu alebo politických názorov sa netolerujú."] },
      en: { t: "Competition rules", li: [
        "Players may not represent more than one team in the same competition. A breach results in forfeiture of both matches in which the player took part.",
        "Teams must arrive at their assigned venue at least 30 minutes before the scheduled start and report to the relevant competition official.",
        "Published match times are starting times. Late arrival may result in automatic forfeiture of the match.",
        "Matches may be played with a running clock due to the tight schedule.",
        "Disrespectful behaviour towards referees, table officials or opponents may result in forfeiture of the match.",
        "The Organising Committee may disqualify players, coaches, officials, supporters or, where appropriate, an entire university for breaches of the rules.",
        "Political statements or demonstrations are prohibited during the event.",
        "Harassment or discrimination based on sex, gender identity, sexual orientation, physical characteristics, disability, ethnicity, national origin or political views will not be tolerated."] } },
    { sk: { t: "Akreditačné karty", p: ["Akreditačnú kartu vydáva IUSF po akreditácii. Potvrdzuje vašu totožnosť a to, kam máte prístup."], li: [
        "Kartu noste viditeľne, aby ju ochranka a personál vedeli rýchlo skontrolovať.",
        "Na športoviská sa dostanú len držitelia oficiálnej akreditačnej karty WIUC 2026.",
        "Karta je osobná a neprenosná."] },
      en: { t: "Accreditation cards", p: ["An accreditation card is an official document issued by IUSF after accreditation. It confirms your identity and access entitlements."], li: [
        "Wear your card visibly so security and event staff can check access quickly.",
        "Only holders of an official WIUC 2026 accreditation card may enter sports centres.",
        "Cards are personal and non-transferable."] } },
    { sk: { t: "Vstup na športoviská", p: ["Z bezpečnostných a kapacitných dôvodov môže byť vstup do niektorých športovísk obmedzený. Prednosť majú športovci, ktorí práve hrajú. Keď je športovisko plné, ďalších ľudí už nemusia pustiť dnu. Po zápase prosím uvoľnite hraciu plochu aj športovisko pre ďalšie tímy. Vstup na vonkajšie športoviská môže byť z bezpečnostných dôvodov obmedzený."] },
      en: { t: "Access to sports venues", p: ["For safety and capacity reasons, admission to some sports centres may be limited. Priority goes to athletes scheduled to compete. Once a venue is full, further admission may be refused. After your match, please leave the playing area or venue to make room for the next teams. Access to outdoor venues may also be restricted for safety reasons."] } },
    { sk: { t: "Poistenie a zdravotná pomoc", p: ["IUSF ani organizátori WIUC neposkytujú zdravotné poistenie. Každý účastník musí mať poistenie sám alebo cez svoju univerzitu či tím. Počas zápasov je na športoviskách prítomná záchranka, zdravotníci alebo prvá pomoc."] },
      en: { t: "Insurance and medical assistance", p: ["IUSF and the WIUC organisers do not provide medical insurance. Every participant must be insured, individually or through their university or team. Ambulance, medical or first-aid staff are present at venues during matches."] } },
    { sk: { t: "Rešpekt, fair play a spoločné priestory", li: [
        "Správajte sa slušne k súperom, rozhodcom, dobrovoľníkom, personálu hotelov aj ostatným hosťom.",
        "Hrajte férovo, myslite na bezpečnosť a rešpektujte rozhodnutia rozhodcov a pravidlá jednotlivých športov.",
        "Pri návrate do ubytovania buďte potichu. Šetrite izby, vybavenie a spoločné priestory.",
        "Na športoviskách je zakázané piť alkohol a fajčiť. Dodržiavajte pravidlá každého športoviska."] },
      en: { t: "Respect, sportsmanship and shared spaces", li: [
        "Treat opponents, referees, volunteers, hotel staff and other guests with courtesy.",
        "Play fairly, put safety first and follow referees' decisions and sport-specific regulations.",
        "Keep noise down when returning to your accommodation. Respect rooms, equipment and shared facilities.",
        "Alcohol and smoking are prohibited at sports venues. Follow all venue rules."] } },
    { sk: { t: "Rešpekt k personálu", p: ["Všetky tímy sa musia k rozhodcom, zapisovateľom, dobrovoľníkom a organizátorom správať s rešpektom. Rovnaký rešpekt očakávame od personálu voči všetkým účastníkom. O sankciách za porušenie pravidiel rozhoduje organizačný výbor."] },
      en: { t: "Respect for staff", p: ["All teams must treat referees, table officials, volunteers and organising staff with respect. Staff are expected to show the same respect to all participants. The Organising Committee decides sanctions for rule violations."] } },
    { sk: { t: "Udržujte športoviská čisté", p: ["Čistota je zodpovednosť každého. Nechajte športoviská, šatne, toalety a všetky priestory WIUC čisté a upratané. Používajte koše, odneste si fľaše aj obaly od jedla a šatňu nechajte pripravenú pre ďalší tím."] },
      en: { t: "Keep our sports centres clean", p: ["Keeping the facilities clean is everyone's job. Leave sports centres, changing rooms, toilets and all WIUC areas clean and tidy. Use the bins, take away bottles and food packaging, and leave changing rooms ready for the next teams."] } },
    { sk: { t: "Najprv voda", p: ["Voda z kohútika je na Slovensku veľmi kvalitná a bezpečne pitná. Kvôli udržateľnosti organizátori nerozdávajú plastové fľaše. Každý účastník dostane v uvítacom balíčku znovupoužiteľnú fľašu. Noste si ju so sebou a naplňte ju pred zápasom."] },
      en: { t: "Water first", p: ["Tap water in Slovakia is of very high quality and safe to drink. With sustainability in mind, the organisers do not hand out plastic bottles. Everyone gets a reusable bottle in the welcome pack. Bring it along and fill it before your matches."] } },
    { sk: { t: "Osobné veci", p: ["Cennosti si dobre strážte a každú udalosť nahláste personálu podujatia."] },
      en: { t: "Personal belongings", p: ["Keep your valuables secure and report any incident to event staff."] } },
    { sk: { t: "Informácie a kontakty", p: ["Každá delegácia vyplní súbor „Entry List Accreditation“ s telefónnym číslom s WhatsAppom pre vedúceho delegácie a pre zodpovednú osobu za každý šport. Informácie počas turnaja chodia na tieto kontakty. IUSF nezodpovedá za nesprávne alebo chýbajúce čísla."] },
      en: { t: "Information and contacts", p: ["Each delegation completes the \u201cEntry List Accreditation\u201d file with a WhatsApp number for the head of delegation and for the person responsible for each sport. Tournament messages go to these contacts. IUSF is not responsible for wrong or missing numbers."] } },
    { sk: { t: "Priateľstvo a flexibilita", p: ["WIUC má spájať univerzity, budovať priateľstvá a vzájomné porozumenie. Prichádzajte načas a buďte trpezliví, ak sa program alebo organizácia nečakane zmení.", "Organizátori môžu vylúčiť účastníka, ktorý tieto pravidlá vážne poruší, aby podujatie zostalo bezpečné a príjemné pre všetkých."] },
      en: { t: "Friendship and flexibility", p: ["WIUC aims to foster friendship and understanding among universities. Arrive on time and stay patient and flexible if the schedule or organisation changes unexpectedly.", "The organisers may exclude anyone who seriously breaks these rules, to keep the event safe, respectful and welcoming for everyone."] } },
    { sk: { t: "Reklama a organizácia", p: ["Propagovať športové či iné podujatia univerzity, klubu alebo tretej strany na športoviskách WIUC 2026 sa dá len s predchádzajúcim súhlasom IUSF.", "Za organizáciu zodpovedá IUSC Committee a WIUSF Federation SSD a r.l. Registráciou súhlasíte s týmito pravidlami. Rozhodcov určujú organizátori."] },
      en: { t: "Advertising and organisation", p: ["Promoting sporting or other events of a university, club or third party at WIUC 2026 venues requires prior consent from IUSF.", "The IUSC Committee and WIUSF Federation SSD a r.l. are responsible for the Championships. Registration means acceptance of these rules. Referees are appointed by the organising staff."] } }
  ];

  var PARTY_URL = "https://site.fourvenues.com/en/wiuc-official-party-2026";
  var PARTIES = [
    { d: "2026-11-05", club: "Neptune Club Bratislava", addr: "Kolárska 473/3, Bratislava" },
    { d: "2026-11-06", club: "Neptune Club Bratislava", addr: "Kolárska 473/3, Bratislava" },
    { d: "2026-11-07", club: "A4 Studio Bratislava", addr: "Trnavská cesta 39, Bratislava", final: true }
  ];


  var CEREMONY = { sport: "ceremony", cat: "X", day: "2026-11-05", time: "19:00", venue: "gopass", court: null,
    a: { label: "", school: null }, b: { label: "", school: null }, pool: "", stage: "", game: "", resA: "", resB: "", all: true };

  var I18N = {
    sk: {
      pickTitle: "Vyberte svoju univerzitu",
      pickLead: "Uvidíte všetky jej zápasy, športy a miesta. Výber si stránka zapamätá.",
      search: "Hľadať univerzitu alebo krajinu",
      slovak: "Slovenské univerzity",
      all: "Všetky univerzity",
      noSchool: "Žiadna univerzita nezodpovedá hľadaniu.",
      allMatches: "Celý rozpis",
      venues: "Miesta",
      change: "Zmeniť",
      today: "Dnes",
      now: "Teraz",
      live: "Prebieha",
      next: "Nasleduje",
      done: "Odohrané",
      men: "muži", women: "ženy", mixed: "mix",
      court: "kurt", pitch: "ihrisko", hall: "hala",
      group: "Skupina",
      map: "Trasa",
      nextTitle: "Najbližší zápas",
      nowOn: "Prebieha",
      inMin: "o {m} min",
      inHours: "o {h} h {m} min",
      tomorrow: "zajtra",
      route: "Trasa MHD",
      noEvents: "V tento deň nemá vaša univerzita žiadny zápas v rozpise.",
      noEventsSport: "V tento deň nemá vaša univerzita zápas v tomto športe.",
      playoff: "Play-off podľa postupu",
      playoffNote: "Súperi sa doplnia podľa výsledkov v skupinách. Toto sú všetky zápasy, ktoré sa v tomto športe hrajú.",
      squad: "tím",
      sportsOf: "Športy",
      pdfTitle: "Individuálne športy (len PDF organizátora)",
      pdfLead: "Bedminton, stolný tenis, plávanie a atletiku organizátor zverejnil len ako PDF. Pre STU sú tieto riadky doplnené ručne.",
      venuesLead: "Všetky športoviská turnaja. Trasa otvorí cestu MHD z miesta, kde ste.",
      playsHere: "Hrá sa tu",
      allLead: "Všetky zápasy turnaja. Filtrujte podľa dňa a športu.",
      source: "Zdroj: verejné rozpisy organizátora (Google Sheets). Vygenerované",
      official: "Oficiálna stránka WIUC",
      results: "Výsledky a prípadné zmeny časov sú v rozpisoch organizátora.",
      back: "Späť na výber",
      mine: "Moja univerzita",
      navMine: "Moje zápasy",
      navAll: "Celý rozpis",
      navVenues: "Miesta",
      navPick: "Univerzity",
      navRules: "Pravidlá",
      tabMine: "Moje", tabAll: "Rozpis", tabTables: "Tabuľky", tabVenues: "Miesta", tabMore: "Viac", tabPick: "Univerzity",
      navTables: "Tabuľky",
      navPlayoff: "Play-off",
      segGroups: "Skupiny", segPlayoff: "Play-off pavúk",
      playoffTitle: "Play-off pavúk",
      playoffLead: "Kto s kým hrá vo vyraďovacej časti. Víťazi sa posúvajú podľa výsledkov v rozpise.",
      playoffRules: "Poradie zo skupín sa doplní, až keď sa dohrá celá skupina. Pri remíze (penalty) sa víťaz doplní, keď ho zapíše organizátor. Rugby a tenis majú iný formát, nájdete ich v rozpise.",
      noPlayoff: "Pre tento šport zatiaľ nie je play-off.",
      seeBracket: "Pozrieť pavúk",
      rQ: "Kvalifikácia", rR16: "Osemfinále", rQF: "Štvrťfinále", rSF: "Semifinále", rF: "Finále",
      finalGame: "Finále", thirdGame: "O 3. miesto",
      winnerOf: "Víťaz zápasu {n}", sfWinner: "Víťaz semifinále", sfLoser: "Porazený v semifinále", tba: "Doplní organizátor",
      poolPlace: "{p}. sk. {g}", gameNo: "Zápas {n}",
      tablesTitle: "Tabuľky skupín",
      tablesLead: "Poradie v skupinách počítané z výsledkov v rozpise. Je orientačné, záväzné je u organizátora.",
      tablesRules: "Body: futbal, futsal, hádzaná, florbal a rugby 3 za výhru, 1 za remízu; basketbal 2 za výhru, 1 za prehru; volejbal 3 za 2:0, 2 za 2:1, 1 za 1:2.",
      thTeam: "Univerzita", thP: "Z", thW: "V", thD: "R", thL: "P", thScore: "Skóre", thPts: "Body",
      thTitle: "Z = zápasy, V = výhry, R = remízy, P = prehry",
      noTables: "Pre tento šport zatiaľ nie sú skupiny.",
      group: "Skupina",
      cal: "Pridať do kalendára",

      allDaysShort: "Všetky dni",
      navGame: "Hra",
      result: "Výsledok",
      updated: "Rozpis sa zmenil.",
      reload: "Načítať nový",
      navParty: "Párty",
      rulesTitle: "Pravidlá WIUC 2026",
      rulesLead: "Všeobecné pravidlá organizátora v skratke a celé. Záväzné je anglické znenie v PDF.",
      rulesKey: "Najdôležitejšie",
      rulesAll: "Všetky pravidlá",
      rulesPdf: "Pôvodné pravidlá v angličtine (PDF)",
      partyTitle: "Oficiálne párty WIUC",
      partyLead: "Vstup do klubov treba rezervovať a zaplatiť vopred. Počet miest je obmedzený.",
      partyBook: "Rezervovať vstupenky",
      partyBring: "Na vstup si prineste",
      partyBringList: ["doklad totožnosti", "akreditačnú kartu WIUC", "QR kód rezervácie"],
      partyFinal: "Veľká záverečná párty",
      ceremony: "Otvárací ceremoniál a spoločná fotografia",
      allSchools: "všetky univerzity",
      count: "zápasov"
    },
    en: {
      pickTitle: "Pick your university",
      pickLead: "You will see all its matches, sports and venues. The page remembers your choice.",
      search: "Search university or country",
      slovak: "Slovak universities",
      all: "All universities",
      noSchool: "No university matches your search.",
      allMatches: "Full schedule",
      venues: "Venues",
      change: "Change",
      today: "Today",
      now: "Now",
      live: "Live",
      next: "Up next",
      done: "Played",
      men: "men", women: "women", mixed: "mixed",
      court: "court", pitch: "pitch", hall: "hall",
      group: "Pool",
      map: "Route",
      nextTitle: "Next match",
      nowOn: "Live now",
      inMin: "in {m} min",
      inHours: "in {h} h {m} min",
      tomorrow: "tomorrow",
      route: "Public transport",
      noEvents: "Your university has no scheduled match on this day.",
      noEventsSport: "Your university has no match in this sport on this day.",
      playoff: "Play-off, depending on progression",
      playoffNote: "Opponents are filled in from the pool results. These are all matches played in this sport.",
      squad: "team",
      sportsOf: "Sports",
      pdfTitle: "Individual sports (organiser PDFs only)",
      pdfLead: "Badminton, table tennis, swimming and athletics were published only as PDFs. For STU the rows are entered by hand.",
      venuesLead: "All venues of the championship. Route opens public transport directions from where you are.",
      playsHere: "Played here",
      allLead: "All matches of the championship. Filter by day and sport.",
      source: "Source: organiser's public schedules (Google Sheets). Generated",
      official: "Official WIUC page",
      results: "Results and time changes are in the organiser's schedules.",
      back: "Back to the list",
      mine: "My university",
      navMine: "My matches",
      navAll: "Full schedule",
      navVenues: "Venues",
      navPick: "Universities",
      navRules: "Rules",
      tabMine: "Mine", tabAll: "Schedule", tabTables: "Tables", tabVenues: "Venues", tabMore: "More", tabPick: "Universities",
      navTables: "Tables",
      navPlayoff: "Play-off",
      segGroups: "Groups", segPlayoff: "Play-off bracket",
      playoffTitle: "Play-off bracket",
      playoffLead: "Who plays whom in the knockout stage. Winners move on from the results in the schedule.",
      playoffRules: "Pool places are filled in only once the whole pool has finished. After a draw (penalties) the winner appears once the organisers enter it. Rugby and tennis use a different format; see the schedule.",
      noPlayoff: "No play-off for this sport yet.",
      seeBracket: "See the bracket",
      rQ: "Qualification", rR16: "Round of 16", rQF: "Quarter-finals", rSF: "Semi-finals", rF: "Finals",
      finalGame: "Final", thirdGame: "3rd place",
      winnerOf: "Winner of game {n}", sfWinner: "Semi-final winner", sfLoser: "Semi-final loser", tba: "To be confirmed",
      poolPlace: "{p}{o} in pool {g}", gameNo: "Game {n}",
      tablesTitle: "Group tables",
      tablesLead: "Pool standings calculated from the results in the schedule. Indicative only; the organisers' standings are binding.",
      tablesRules: "Points: football, futsal, handball, floorball and rugby 3 for a win, 1 for a draw; basketball 2 for a win, 1 for a loss; volleyball 3 for 2:0, 2 for 2:1, 1 for 1:2.",
      thTeam: "University", thP: "P", thW: "W", thD: "D", thL: "L", thScore: "Score", thPts: "Pts",
      thTitle: "P = played, W = won, D = drawn, L = lost",
      noTables: "No groups for this sport yet.",
      group: "Pool",
      cal: "Add to calendar",

      allDaysShort: "All days",
      navGame: "Game",
      result: "Result",
      updated: "The schedule has changed.",
      reload: "Load the new one",
      navParty: "Parties",
      rulesTitle: "WIUC 2026 rules",
      rulesLead: "The organiser's general rules, in short and in full. The PDF is the binding version.",
      rulesKey: "Most important",
      rulesAll: "All rules",
      rulesPdf: "Original rules (PDF)",
      partyTitle: "Official WIUC parties",
      partyLead: "Club entry has to be booked and paid in advance. Places are limited.",
      partyBook: "Book tickets",
      partyBring: "Bring to the door",
      partyBringList: ["your ID", "your WIUC badge", "the reservation QR code"],
      partyFinal: "The big final party",
      ceremony: "Opening ceremony and group photo",
      allSchools: "all universities",
      count: "matches"
    }
  };

  // ------------------------------------------------------------ state
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var state = {
    lang: store.get("wiuc.lang") || "sk",
    school: store.get("wiuc.school") || null,
    day: null,
    sport: store.get("wiuc.sport") || "all"
  };
  function t(k) { return (I18N[state.lang] && I18N[state.lang][k]) || I18N.sk[k] || k; }
  function nSports(n) {
    if (state.lang !== "sk") return n + " " + (n === 1 ? "sport" : "sports");
    return n + " " + (n === 1 ? "šport" : n >= 2 && n <= 4 ? "športy" : "športov");
  }
  function nMatches(n) {
    if (state.lang !== "sk") return n + " " + (n === 1 ? "match" : "matches");
    return n + " " + (n === 1 ? "zápas" : n >= 2 && n <= 4 ? "zápasy" : "zápasov");
  }
  function sportName(k) { var s = SPORTS[k]; return s ? s[state.lang] || s.sk : k; }
  function dayName(d) { var x = DAYS.filter(function (q) { return q.d === d; })[0]; return x ? (state.lang === "sk" ? x.sk : x.en) : d; }

  var EVENTS = DATA.events.concat(EXTRA).concat([CEREMONY]);
  EVENTS.forEach(function (e, i) { e.idx = i; });
  EVENTS.sort(function (a, b) { return (a.day + a.time).localeCompare(b.day + b.time) || a.sport.localeCompare(b.sport); });
  var SCHOOLS = {};
  DATA.schools.forEach(function (s) { SCHOOLS[s.id] = s; });

  var NOW_OVERRIDE = (function () {
    var m = /[?&]now=(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(location.search);
    return m ? { d: m[1], t: m[2] } : null;
  })();
  function todayISO() {
    if (NOW_OVERRIDE) return NOW_OVERRIDE.d;
    var n = new Date();
    return n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function nowHM() { if (NOW_OVERRIDE) return NOW_OVERRIDE.t; var n = new Date(); return pad(n.getHours()) + ":" + pad(n.getMinutes()); }
  function defaultDay() {
    var td = todayISO();
    if (DAYS.some(function (d) { return d.d === td; })) return td;
    if (td < DAYS[0].d) return DAYS[0].d;
    return DAYS[DAYS.length - 1].d;
  }

  // ------------------------------------------------------------ helpers
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function h(strings) {
    // tiny tagged template: values are escaped unless wrapped in raw()
    var out = strings[0];
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i];
      out += (v && v.__raw) ? v.v : esc(v);
      out += strings[i];
    }
    return out;
  }
  function raw(v) { return { __raw: true, v: v }; }
  function mapsUrl(vid) {
    var v = VENUES[vid];
    if (!v) return "#";
    return "https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=" + encodeURIComponent(v.name.replace(/\s*\(.*\)$/, "") + ", " + v.addr + ", Bratislava");
  }
  function involves(ev, sid) {
    return !!sid && ((ev.a && ev.a.school === sid) || (ev.b && ev.b.school === sid));
  }
  function schoolSports(sid) {
    var set = {};
    EVENTS.forEach(function (e) { if (involves(e, sid)) set[e.sport] = true; });
    return Object.keys(set);
  }
  function catLabel(cat) {
    return cat === "M" ? t("men") : cat === "W" ? t("women") : cat === "X" ? t("mixed") : "";
  }
  function courtLabel(ev) {
    if (!ev.court) return "";
    var word = (ev.sport === "tennis" || ev.sport === "padel") ? t("court") :
               (ev.sport === "football" || ev.sport === "rugby") ? t("pitch") : t("hall");
    return word + " " + ev.court;
  }
  function durationMin(sport) {
    return { football: 60, rugby: 30, basketball: 40, volleyball: 60, handball: 40, futsal: 30, floorball: 40, tennis: 60, padel: 45, badminton: 30, tabletennis: 60, swimming: 270, athletics: 45, ceremony: 120 }[sport] || 45;
  }
  function addMin(hm, m) {
    var p = hm.split(":"), x = (+p[0]) * 60 + (+p[1]) + m;
    return pad(Math.floor(x / 60) % 24) + ":" + pad(x % 60);
  }
  function statusOf(ev) {
    if (ev.day !== todayISO()) return ev.day < todayISO() ? "past" : "";
    var now = nowHM();
    if (now >= addMin(ev.time, durationMin(ev.sport))) return "past";
    if (now >= ev.time) return "live";
    return "";
  }
  function sideLabel(side, sid, ev) {
    if (!side) return "";
    var individual = ev && (ev.sport === "tennis" || ev.sport === "padel");
    if (side.school && SCHOOLS[side.school]) {
      var name = SCHOOLS[side.school].name;
      if (side.school === sid) name = shortName(name);
      else if (individual) {
        // the organiser's short label ("Victor Babeș 1 - Name") reads better than the full name
        var m = /^(.*?)\s*-\s*/.exec(side.label || "");
        if (m) name = m[1].replace(/\s*\d$/, "").trim() || name;
      }
      var extra = [];
      if (side.squad && !individual) extra.push(t("squad") + " " + side.squad);
      return { name: name, player: side.player || "", extra: extra.join(", "), me: side.school === sid };
    }
    return { name: side.label || "", player: side.player || "", extra: "", me: false };
  }
  function shortName(name) {
    var m = {
      "Slovak University of Technology in Bratislava": "STU Bratislava",
      "Comenius University Bratislava": "UK Bratislava",
      "Bratislava University of Economics and Business": "EUBA"
    };
    return m[name] || name;
  }

  // ------------------------------------------------------------ routing
  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/").filter(Boolean);
    if (parts[0] === "s" && parts[1] && SCHOOLS[parts[1]]) {
      state.school = parts[1];
      store.set("wiuc.school", parts[1]);
      return { view: parts[2] || "school", school: parts[1] };
    }
    if (parts[0] === "all") return { view: "all" };
    if (parts[0] === "venues") return { view: "venues" };
    if (parts[0] === "rules") return { view: "rules" };
    if (parts[0] === "tables") return { view: "tables" };
    if (parts[0] === "zapas" && parts[1] && parts[2]) return { view: "live", day: parts[1], hm: parts[2] };
    if (parts[0] === "playoff") {
      // #/playoff/<sport> opens one sport, then the address settles on #/playoff so the chips keep working
      if (parts[1] && SPORTS[parts[1]]) {
        state.sport = parts[1]; store.set("wiuc.sport", parts[1]);
        try { history.replaceState(null, "", "#/playoff"); } catch (e) {}
      }
      return { view: "playoff" };
    }
    if (parts[0] === "party") return { view: "party" };
    if (parts[0] === "pick") return { view: "pick" };
    if (state.school && SCHOOLS[state.school]) return { view: "school", school: state.school };
    return { view: "pick" };
  }
  function go(path) { location.hash = "#/" + path; }

  // ------------------------------------------------------------ views
  var app = document.getElementById("app");

  function render(keepScroll) {
    if (!state.day) state.day = defaultDay();
    var r = route();
    document.documentElement.lang = state.lang;
    document.getElementById("langBtn").textContent = state.lang === "sk" ? "EN" : "SK";
    document.getElementById("brandSub").textContent = state.lang === "sk" ? "Neoficiálny pomocník · 4. až 8. 11." : "Unofficial helper · 4 to 8 Nov";
    renderMenu(r.view);
    if (r.view === "pick") renderPick();
    else if (r.view === "all") renderAll();
    else if (r.view === "venues") renderVenues();
    else if (r.view === "rules") renderRules();
    else if (r.view === "tables") renderTables();
    else if (r.view === "playoff") renderPlayoff();
    else if (r.view === "live") renderLive(r.day, r.hm);
    else if (r.view === "party") renderParty();
    else renderSchool(r.school);
    renderFoot();
    if (keepScroll !== true) window.scrollTo(0, 0);
  }

  // header menu: always one tap back to your matches, the full schedule, venues or the list
  // bottom tab bar on phones: the four places people go most, the rest under "More"
  function renderTabbar(view) {
    var bar = document.getElementById("tabbar");
    if (!bar) return;
    var hasSchool = state.school && SCHOOLS[state.school];
    var first = hasSchool ? ["school", "#/s/" + state.school, t("tabMine"), "star"] : ["pick", "#/pick", t("tabPick"), "star"];
    var tabs = [first, ["all", "#/all", t("tabAll"), "list"], ["tables", "#/tables", t("tabTables"), "table"], ["venues", "#/venues", t("tabVenues"), "pin"]];
    var tabView = view === "playoff" ? "tables" : view === "live" ? "school" : view;
    var inTabs = tabs.some(function (x) { return x[0] === tabView; });
    bar.innerHTML = tabs.map(function (x) {
      var on = x[0] === tabView;
      return h`<a href="${x[1]}" class="${on ? "on" : ""}"${raw(on ? ' aria-current="page"' : "")}>${raw(icon(x[3]))}<span>${x[2]}</span></a>`;
    }).join("") + h`<button type="button" data-more class="${inTabs ? "" : "on"}" aria-controls="menu">${raw(icon("more"))}<span>${t("tabMore")}</span></button>`;
  }
  function renderMenu(view) {
    var items = [];
    if (state.school && SCHOOLS[state.school]) items.push(["school", "#/s/" + state.school, t("navMine")]);
    items.push(["all", "#/all", t("navAll")], ["tables", "#/tables", t("navTables")], ["playoff", "#/playoff", t("navPlayoff")], ["venues", "#/venues", t("navVenues")], ["rules", "#/rules", t("navRules")], ["party", "#/party", t("navParty")], ["game", "hra/", t("navGame")], ["pick", "#/pick", t("navPick")]);
    renderTabbar(view);
    var menu = document.getElementById("menu");
    if (!menu) return;
    var head = h`<p class="menu-head"><button class="menu-close" type="button" aria-label="${state.lang === "sk" ? "Zavrieť menu" : "Close menu"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>WIUC 2026 Bratislava<small>${state.lang === "sk" ? "Neoficiálny pomocník · 4. až 8. 11." : "Unofficial helper · 4 to 8 Nov"}</small></p>`;
    menu.innerHTML = head + items.map(function (it) {
      var on = it[0] === view || (it[0] === "tables" && view === "playoff");
      return h`<a href="${it[1]}" class="m-${it[0]}${on ? " on" : ""}"${raw(on ? ' aria-current="page"' : "")}>${it[2]}</a>`;
    }).join("");
  }

  function renderFoot() {
    document.getElementById("footSource").innerHTML =
      h`${t("source")} ${DATA.generated || ""}. <a href="${SOURCE_URL}" target="_blank" rel="noopener">Google Drive</a> · <a href="${OFFICIAL_URL}" target="_blank" rel="noopener">${t("official")}</a>. ${t("results")}`;
    var author = document.getElementById("footAuthor");
    if (author) author.textContent = state.lang === "sk" ? "Vytvoril Daniel Floris." : "Made by Daniel Floris.";
    document.getElementById("footCredit").innerHTML =
      h`${state.lang === "sk" ? "Fotografia" : "Photograph"}: <a href="https://commons.wikimedia.org/w/index.php?curid=119460999" target="_blank" rel="noopener">Panoramic view from Bratislava castle</a>, Lukáš Perný, CC BY-SA 4.0, Wikimedia Commons.`;
  }

  // ------------------------------------------------------------ icons (authored SVG, one stroke weight)
  var ICON = {
    pin: '<path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    dir: '<path d="M7 17L17 7M9 7h8v8"/>',
    cal: '<rect x="4" y="5" width="16" height="15"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    table: '<rect x="3" y="4" width="18" height="16"/><path d="M3 9h18M3 14.5h18M9 9v11"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    swap: '<path d="M7 4v14M4 15l3 3 3-3M17 20V6M14 9l3-3 3 3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    live: '<circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 000 11.4M17.7 6.3a8 8 0 010 11.4"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    football: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4.3 3.1-1.6 5h-5.4l-1.6-5z"/>',
    futsal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    basketball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M6 5.5c3 3 3 10 0 13M18 5.5c-3 3-3 10 0 13"/>',
    volleyball: '<circle cx="12" cy="12" r="9"/><path d="M12 3c-4 4-4 10 0 18M4.5 8.5c5 .5 10 3 14.5 8M4.5 15.5c5-.5 10-3 14.5-8"/>',
    handball: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/>',
    rugby: '<path d="M4 20C4 10 14 4 20 4c0 6-6 16-16 16z"/><path d="M9 15l6-6M10 12l2 2M12 10l2 2"/>',
    floorball: '<circle cx="12" cy="12" r="9"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01" stroke-width="3"/>',
    tennis: '<circle cx="10" cy="9" r="6"/><path d="M14.5 13.5L20 19M7 6.5c2 1 4 3.5 5 6.5"/>',
    padel: '<rect x="5" y="3" width="10" height="12" rx="5"/><path d="M10 15v6M8 8h.01M12 8h.01M10 11h.01" stroke-width="3"/>',
    badminton: '<path d="M14 4l6 6-8 8-4-4z"/><circle cx="8" cy="16" r="2"/><path d="M6 18l-2 2"/>',
    tabletennis: '<circle cx="10" cy="10" r="6"/><path d="M14 14l5 5"/><circle cx="19" cy="7" r="1.5"/>',
    swimming: '<path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="16" cy="7" r="2"/><path d="M4 11l5-3 4 3"/>',
    athletics: '<rect x="3" y="7" width="18" height="10" rx="5"/><rect x="7" y="10" width="10" height="4" rx="2"/>',
    ceremony: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || "") + '</svg>';
  }
  function unitWord(ev) {
    if (!ev.court) return "";
    var w = (ev.sport === "tennis" || ev.sport === "padel") ? t("court") :
            (ev.sport === "football" || ev.sport === "rugby") ? t("pitch") : t("hall");
    return w;
  }

  // ---- school picker
  function renderPick() {
    var q = "";
    app.innerHTML = h`
      <div class="pick-head">
        <img src="assets/panoramic-view-from-bratislava-castle.jpg" width="1920" height="864" alt="${state.lang === "sk" ? "Bratislava od hradu: Most SNP, Dunaj a Petržalka" : "Bratislava from the castle: the SNP bridge, the Danube and Petržalka"}" decoding="async">
        <div class="scrim" aria-hidden="true"></div>
        <div class="page page-plain"><h1>${t("pickTitle")}</h1><p class="lead">${t("pickLead")}</p></div>
      </div>
      <div class="page page-plain">
      <div class="search-wrap">${raw(icon("search"))}<input class="search" id="q" type="search" placeholder="${t("search")}" autocomplete="off" aria-label="${t("search")}"></div>
      <div id="schoolList"></div>
      </div>`;
    var input = document.getElementById("q");
    function draw() {
      var ql = q.trim().toLowerCase();
      var list = DATA.schools.filter(function (s) {
        return !ql || (s.name + " " + s.country + " " + shortName(s.name)).toLowerCase().indexOf(ql) >= 0;
      });
      var sk = list.filter(function (s) { return s.country === "Slovakia"; });
      var rest = list.filter(function (s) { return s.country !== "Slovakia"; });
      var html = "";
      function item(s) {
        var cls = "school-btn" + (s.id === state.school ? " home" : "");
        return h`<li><button class="${cls}" data-id="${s.id}" type="button"><span class="name">${s.name}</span><span class="country">${s.country}</span></button></li>`;
      }
      if (!list.length) html = h`<p class="empty">${t("noSchool")}</p>`;
      if (sk.length) html += h`<h2>${t("slovak")}</h2><ul class="school-list">${raw(sk.map(item).join(""))}</ul>`;
      if (rest.length) html += h`<h2>${t("all")}</h2><ul class="school-list">${raw(rest.map(item).join(""))}</ul>`;
      document.getElementById("schoolList").innerHTML = html;
    }
    input.addEventListener("input", function () { q = input.value; draw(); });
    document.getElementById("schoolList").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-id]");
      if (b) go("s/" + b.getAttribute("data-id"));
    });
    draw();
  }

  // ---- shared: gate strip (days) + capsule filters (sports) + sign rows
  function dayTabs(countFn, allCount) {
    var allGate = allCount == null ? "" : h`<button class="gate gate-all${state.day === "all" ? " on" : ""}" data-day="all" role="tab" aria-selected="${state.day === "all"}" type="button">
        <span>${t("allDaysShort")}</span><b>4–7</b><span class="n">${allCount}</span></button>`;
    return h`<div class="gates"><div class="gates-inner${allGate ? " with-all" : ""}" role="tablist">${raw(allGate)}${raw(DAYS.map(function (d) {
      var n = countFn ? countFn(d.d) : null;
      var isToday = d.d === todayISO();
      var cls = "gate" + (d.d === state.day ? " on" : "") + (isToday ? " today" : "");
      return h`<button class="${cls}" data-day="${d.d}" role="tab" aria-selected="${d.d === state.day}" type="button">
        <span>${state.lang === "sk" ? d.sk : d.en}</span><b>${d.num.split(".")[0]}.</b><span class="n">${n != null ? n : ""}</span></button>`;
    }).join(""))}</div></div>`;
  }
  function sportChips(sports, counts) {
    var all = h`<button class="chip${state.sport === "all" ? " on" : ""}" data-sport="all" type="button">${state.lang === "sk" ? "Všetko" : "All"}</button>`;
    return h`<div class="chips">${raw(all)}${raw(sports.map(function (s) {
      var c = SPORTS[s] ? SPORTS[s].c : "#888";
      var n = counts && counts[s] ? h`<span class="cnt">${counts[s]}</span>` : "";
      return h`<button class="chip${state.sport === s ? " on" : ""}" data-sport="${s}" type="button" style="--z:${c}"><span class="dot"></span>${sportName(s)}${raw(n)}</button>`;
    }).join(""))}</div>`;
  }
  // one delegated handler for day tabs and sport chips (registered once at boot)
  app.addEventListener("click", function (e) {
    var tb = e.target.closest("[data-day]");
    var cal = e.target.closest("[data-cal]");
    if (cal) {
      var n = +cal.getAttribute("data-cal");
      var ev = EVENTS.filter(function (x) { return x.idx === n; })[0];
      if (ev) downloadCalendar([ev], state.school, "wiuc-2026-" + ev.sport + "-" + ev.day.slice(8) + "-" + ev.time.replace(":", "") + ".ics");
      return;
    }
    var ch = e.target.closest("[data-sport]");
    if (!tb && !ch) return;
    if (tb) state.day = tb.getAttribute("data-day");
    if (ch) { state.sport = ch.getAttribute("data-sport"); store.set("wiuc.sport", state.sport); }
    var y = window.scrollY;
    render(true);
    window.scrollTo(0, y);
  });

  function resultOf(ev) {
    var a = ev.resA || "", b = ev.resB || "";
    if (a && b) return a + " : " + b;
    return a || b;
  }
  function eventCard(ev, sid, markNext) {
    var st = statusOf(ev);
    if (markNext && !st) st = "next";
    var result = resultOf(ev);
    if (result) st = "done";
    var A = sideLabel(ev.a, sid, ev), B = sideLabel(ev.b, sid, ev);
    var sp = SPORTS[ev.sport] || { c: "#888" };
    var badge = result ? h`<span class="badge score">${t("result")} ${result}</span>${raw(ev.sets && ev.sets.length ? h` <span class="sets">(${ev.sets.join(", ")})</span>` : "")}` :
                st === "live" ? h`<span class="badge live">${t("live")}</span>` :
                st === "next" ? h`<span class="badge next">${t("next")}</span>` : "";
    var logged = !result && liveOn(ev) ? loggedScore(ev) : "";
    if (logged) badge = h`<span class="badge logged" title="${L("Skóre zo zápisu tímu", "Score from the team's log")}">${logged}</span>`;
    var cat = catLabel(ev.cat);
    var meta = [];
    var v = VENUES[ev.venue];
    if (v) meta.push(h`<a href="${mapsUrl(ev.venue)}" target="_blank" rel="noopener">${raw(icon("pin"))}${v.name}</a>`);
    if (ev.pool && !ev.extra) meta.push(esc(t("group") + " " + ev.pool));
    if (ev.stage && !ev.extra) meta.push(esc(ev.stage));
    if (liveOn(ev)) meta.push(h`<a class="live-link" href="${liveHref(ev)}">${raw(icon("live"))}${state.lang === "sk" ? "Priebeh zápasu" : "Match log"}</a>`);
    var match;
    if (ev.sport === "ceremony") {
      match = h`<div class="match">${t("ceremony")}</div>`;
    } else if (!B.name && !B.player) {
      match = h`<div class="match"><span class="${A.me ? "me" : ""}">${A.name}</span>${A.player ? raw(' <span class="player">' + esc(A.player) + "</span>") : ""}</div>` +
              (ev.stage ? h`<div class="note">${ev.stage}</div>` : "");
    } else {
      function side(S) {
        var s = h`<span class="${S.me ? "me" : ""}">${S.name || "?"}</span>`;
        if (S.extra) s += h` <span class="player squad">(${S.extra})</span>`;
        if (S.player) s += h` <span class="player">${S.player}</span>`;
        return s;
      }
      match = h`<div class="match">${raw(side(A))} <span class="vs">vs</span> ${raw(side(B))}</div>`;
    }
    var plate = ev.court
      ? h`<a class="plate" href="${mapsUrl(ev.venue)}" target="_blank" rel="noopener" aria-label="${unitWord(ev)} ${ev.court}, ${t("map")}">${ev.court}<small>${unitWord(ev)}${raw(icon("dir"))}</small></a>`
      : h`<a class="plate" href="${mapsUrl(ev.venue)}" target="_blank" rel="noopener" aria-label="${t("map")}">${raw(icon("arrow"))}<small>${t("map")}</small></a>`;
    return h`<li class="ev ${st}" style="--z:${sp.c};--zt:${sp.t || sp.c}">
      <div class="time">${ev.time}</div>
      <div class="zone" style="background:${sp.c}">${raw(icon(ev.sport))}</div>
      <div class="main">
        <div class="sport">${sportName(ev.sport)}${cat ? raw(' <span class="cat">· ' + esc(cat) + '</span>') : ""} ${raw(badge)}</div>
        ${raw(badge ? '<div class="badge-row">' + badge + "</div>" : "")}
        ${raw(match)}
        <div class="meta">${raw(meta.join(" · "))}${raw(ev.sport === "ceremony" || st === "past" || st === "done" ? "" : h`<button class="cal-btn" type="button" data-cal="${ev.idx}" aria-label="${t("cal")}: ${sportName(ev.sport)} ${ev.time}" title="${t("cal")}">${raw(icon("cal"))}</button>`)}</div>
      </div>
      ${raw(plate)}</li>`;
  }

  function eventList(list, sid) {
    if (!list.length) return "";
    var nextIdx = -1;
    if (list[0].day === todayISO()) {
      for (var i = 0; i < list.length; i++) { if (!statusOf(list[i]) && !resultOf(list[i])) { nextIdx = i; break; } }
    }
    return h`<ul class="events">${raw(list.map(function (e, i) { return eventCard(e, sid, i === nextIdx); }).join(""))}</ul>`;
  }

  // ---- rules
  function renderRules() {
    var L = state.lang;
    var keys = RULES_KEY[L].map(function (k) { return h`<li>${k}</li>`; }).join("");
    var secs = RULES.map(function (r) {
      var x = r[L];
      return h`<section class="rule">
        <h2>${x.t}</h2>
        ${raw((x.p || []).map(function (q) { return h`<p>${q}</p>`; }).join(""))}
        ${raw(x.li ? "<ul>" + x.li.map(function (q) { return h`<li>${q}</li>`; }).join("") + "</ul>" : "")}
      </section>`;
    }).join("");
    var back = "#/" + (state.school ? "s/" + state.school : "pick");
    app.innerHTML = h`
      ${raw(destPanel(t("rulesTitle"), t("rulesLead"), back, state.school ? t("mine") : t("back")))}
      <div class="page page-plain">
        <h2 class="sec-title">${t("rulesKey")}</h2>
        <ul class="keys">${raw(keys)}</ul>
        <h2 class="sec-title">${t("rulesAll")}</h2>
        <div class="rules">${raw(secs)}</div>
        <p class="rules-pdf"><a href="${RULES_PDF}" target="_blank" rel="noopener">${t("rulesPdf")}</a></p>
      </div>`;
  }

  // ---- parties
  function renderParty() {
    var L = state.lang;
    var nights = PARTIES.map(function (n) {
      var day = DAYS.filter(function (q) { return q.d === n.d; })[0];
      var num = n.d.slice(8).replace(/^0/, "");
      var map = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(n.club + ", " + n.addr);
      return h`<div class="night${n.final ? " final" : ""}">
        <div class="ndate"><b>${num}.</b><span>${day ? (L === "sk" ? day.sk : day.en) : ""}</span></div>
        <div class="nbody">
          ${raw(n.final ? h`<div class="nfinal">${t("partyFinal")}</div>` : "")}
          <div class="vname">${n.club}</div>
          <div class="addr">${n.addr}</div>
        </div>
        <a class="plate" href="${map}" target="_blank" rel="noopener" aria-label="${n.club}, ${t("map")}">${raw(icon("pin"))}${t("map")}</a>
      </div>`;
    }).join("");
    var back = "#/" + (state.school ? "s/" + state.school : "pick");
    app.innerHTML = h`
      ${raw(destPanel(t("partyTitle"), t("partyLead"), back, state.school ? t("mine") : t("back")))}
      <div class="page page-plain">
        <div class="party">
          <div class="nights">${raw(nights)}</div>
          <div class="party-side">
            <a class="btn primary big" href="${PARTY_URL}" target="_blank" rel="noopener">${t("partyBook")} ${raw(icon("arrow"))}</a>
            <h2 class="sec-title">${t("partyBring")}</h2>
            <ul class="bring">${raw(t("partyBringList").map(function (q) { return h`<li>${q}</li>`; }).join(""))}</ul>
          </div>
        </div>
      </div>`;
  }
  // ---- group tables, calculated from the results in the schedule
  var TABLE_SPORTS = ["football", "futsal", "basketball", "volleyball", "handball", "floorball", "rugby"];
  function teamKey(side) { return side.school ? side.school + "|" + (side.squad || "") : "?" + (side.label || ""); }
  function pointsFor(sport, mine, theirs) {
    if (sport === "volleyball") return mine === 2 ? (theirs === 0 ? 3 : 2) : (mine === 1 ? 1 : 0);
    if (sport === "basketball") return mine > theirs ? 2 : 1;
    return mine > theirs ? 3 : (mine === theirs ? 1 : 0);
  }
  function standings(sport) {
    var pools = {};
    EVENTS.forEach(function (e) {
      if (e.sport !== sport || !e.pool || e.extra) return;
      if (!e.a.school && !e.b.school) return;
      var k = e.cat + "|" + e.pool;
      var pool = pools[k] = pools[k] || { cat: e.cat, pool: e.pool, teams: {}, games: [] };
      [e.a, e.b].forEach(function (sd) {
        var key = teamKey(sd);
        if (!pool.teams[key]) pool.teams[key] = { side: sd, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 };
      });
      pool.games.push(e);
    });
    Object.keys(pools).forEach(function (k) {
      var pool = pools[k];
      pool.games.forEach(function (e) {
        if (e.resA === "" || e.resB === "" || isNaN(+e.resA) || isNaN(+e.resB)) return;
        var A = pool.teams[teamKey(e.a)], B = pool.teams[teamKey(e.b)], ra = +e.resA, rb = +e.resB;
        [[A, ra, rb], [B, rb, ra]].forEach(function (x) {
          var T = x[0], m = x[1], o = x[2];
          T.p++; T.f += m; T.a += o; T.pts += pointsFor(sport, m, o);
          if (m > o) T.w++; else if (m < o) T.l++; else T.d++;
        });
      });
      pool.rows = Object.keys(pool.teams).map(function (key) { return pool.teams[key]; }).sort(function (x, y) {
        return y.pts - x.pts || (y.f - y.a) - (x.f - x.a) || y.f - x.f || x.l - y.l;
      });
    });
    return Object.keys(pools).map(function (k) { return pools[k]; })
      .sort(function (x, y) { return x.cat.localeCompare(y.cat) || x.pool.localeCompare(y.pool); });
  }
  function renderTables() {
    var sport = TABLE_SPORTS.indexOf(state.sport) >= 0 ? state.sport : null;
    if (!sport && state.school) sport = TABLE_SPORTS.filter(function (k) { return schoolSports(state.school).indexOf(k) >= 0; })[0];
    sport = sport || "futsal";
    var chips = h`<div class="chips">${raw(TABLE_SPORTS.map(function (k) {
      var sp = SPORTS[k] || { c: "#888" };
      return h`<button class="chip${k === sport ? " on" : ""}" data-sport="${k}" type="button" style="--z:${sp.c}"><span class="dot"></span>${sportName(k)}</button>`;
    }).join(""))}</div>`;
    var pools = standings(sport);
    var mine = state.school;
    var body = pools.length ? pools.map(function (pool) {
      var hasDraw = sport !== "basketball" && sport !== "volleyball";
      var rows = pool.rows.map(function (T, i) {
        var L = sideLabel(T.side, mine, null);
        var me = T.side.school && T.side.school === mine;
        return h`<tr class="${me ? "me" : ""}"><td class="pos">${i + 1}.</td><td class="team" title="${L.name}${L.extra ? " (" + L.extra + ")" : ""}"><span class="tname">${L.name}${raw(L.extra ? h` <span class="squad">(${L.extra})</span>` : "")}</span></td>
          <td>${T.p}</td><td>${T.w}</td>${raw(hasDraw ? h`<td>${T.d}</td>` : "")}<td>${T.l}</td><td class="score">${T.f}:${T.a}</td><td class="pts">${T.pts}</td></tr>`;
      }).join("");
      return h`<section class="table-card">
        <h2>${sportName(sport)} · ${catLabel(pool.cat)} · ${t("group")} ${pool.pool}</h2>
        <table class="standings"><thead><tr><th class="pos">#</th><th class="team">${t("thTeam")}</th>
          <th title="${t("thTitle")}">${t("thP")}</th><th>${t("thW")}</th>${raw(hasDraw ? h`<th>${t("thD")}</th>` : "")}<th>${t("thL")}</th><th class="score">${t("thScore")}</th><th class="pts">${t("thPts")}</th></tr></thead>
          <tbody>${raw(rows)}</tbody></table></section>`;
    }).join("") : h`<div class="empty"><p>${t("noTables")}</p></div>`;
    var back = "#/" + (state.school ? "s/" + state.school : "pick");
    app.innerHTML = h`
      ${raw(destPanel(t("tablesTitle"), t("tablesLead"), back, state.school ? t("mine") : t("back")))}
      <div class="page page-plain">
        ${raw(segSwitch("tables"))}
        ${raw(chips)}
        <div class="tables-grid">${raw(body)}</div>
        <p class="tables-note">${t("tablesRules")}</p>
      </div>`;
  }

  // ---- play-off bracket, built from the knockout rows of the schedule
  // The organiser writes "(9)" for "winner of game 9", "1A" for "winner of pool A" and leaves the finals empty.
  var PLAYOFF_SPORTS = ["football", "futsal", "basketball", "volleyball", "handball", "floorball"];
  var ROUND_RE = [/qualif/i, /1\/8/, /quarter/i, /semi/i, /3\/4|3rd|third/i, /final/i];   // first match wins
  var ROUND_KEY = ["rQ", "rR16", "rQF", "rSF", "rF", "rF"];
  function roundOf(stage) {
    for (var i = 0; i < ROUND_RE.length; i++) if (ROUND_RE[i].test(stage || "")) return i;
    return -1;
  }
  function scoreOf(e) {
    var a = e.resA, b = e.resB;
    if (a === "" || b === "" || a == null || b == null || isNaN(+a) || isNaN(+b)) return null;
    return [+a, +b];
  }
  function bracketFor(sport, cat) {
    var rows = EVENTS.filter(function (e) { return e.sport === sport && e.cat === cat && !e.pool && !e.extra && !e.all; });
    rows.forEach(function (e) { e._r = roundOf(e.stage); });
    // a row whose round name got lost in the sheet takes the round of the other rows that day
    rows.forEach(function (e) {
      if (e._r >= 0) return;
      var seen = {};
      rows.forEach(function (x) { if (x._r >= 0 && x.day === e.day) seen[x._r] = (seen[x._r] || 0) + 1; });
      var best = -1;
      Object.keys(seen).forEach(function (k) { if (best < 0 || seen[k] > seen[best]) best = +k; });
      e._r = best;
    });
    rows = rows.filter(function (e) { return e._r >= 0; });
    if (!rows.length) return null;
    var count = {}, games = {};
    rows.forEach(function (e) { if (e.game) count[e.game] = (count[e.game] || 0) + 1; });
    rows.forEach(function (e) { if (e.game && count[e.game] === 1) games[e.game] = e; });
    var semis = rows.filter(function (e) { return e._r === 3; });
    var pools = null;
    function poolSide(place, letter) {
      pools = pools || standings(sport);
      var pool = pools.filter(function (q) { return q.cat === cat && q.pool === letter; })[0];
      if (!pool || !pool.games.length || !pool.games.every(scoreOf)) return null;
      var T = pool.rows[place - 1];
      if (!T) return null;
      var level = pool.rows.filter(function (x) { return x !== T && x.pts === T.pts; }).length;
      return level ? null : T.side;           // level on points: the organiser's tie-break decides
    }
    function sideOf(e, k, depth) {
      var sd = e[k] || {};
      if (sd.school) return sd;
      if (depth > 8) return null;
      var lab = (sd.label || "").trim(), m;
      if ((m = /^\((\d+)\)$/.exec(lab))) return winnerOf(games[m[1]], depth + 1);
      if ((m = /^([1-4])([A-Z])$/.exec(lab))) return poolSide(+m[1], m[2]);
      if (!lab && e._r >= 4 && semis.length === 2) {
        var sf = semis[k === "a" ? 0 : 1];
        return e._r === 4 ? loserOf(sf, depth + 1) : winnerOf(sf, depth + 1);
      }
      return null;
    }
    function winnerOf(e, depth) {
      var sc = e && scoreOf(e);
      if (!sc || sc[0] === sc[1]) return null;
      return sideOf(e, sc[0] > sc[1] ? "a" : "b", depth);
    }
    function loserOf(e, depth) {
      var sc = e && scoreOf(e);
      if (!sc || sc[0] === sc[1]) return null;
      return sideOf(e, sc[0] > sc[1] ? "b" : "a", depth);
    }
    function openLabel(e, k) {
      var lab = ((e[k] || {}).label || "").trim(), m;
      if ((m = /^\((\d+)\)$/.exec(lab))) return t("winnerOf").replace("{n}", m[1]);
      if ((m = /^([1-4])([A-Z])$/.exec(lab))) return t("poolPlace").replace("{p}", m[1]).replace("{o}", ["st", "nd", "rd", "th"][+m[1] - 1]).replace("{g}", m[2]);
      if (!lab && e._r >= 4) return semis.length === 2 ? t(e._r === 4 ? "sfLoser" : "sfWinner") : t("tba");
      return lab.replace(/\*+$/, "") || "?";
    }
    // order inside a round: game number, else the lowest game it is fed from, else time
    function feedKey(e) {
      if (e.game) return +e.game;
      var n = [e.a, e.b].map(function (sd) { var m = /^\((\d+)\)/.exec((sd && sd.label) || ""); return m ? +m[1] : 999; });
      return Math.min(n[0], n[1]) + 0.5;
    }
    semis.sort(function (x, y) { return feedKey(x) - feedKey(y) || (x.day + x.time).localeCompare(y.day + y.time); });
    var cols = {};
    rows.forEach(function (e) {
      var c = Math.min(e._r, 4);
      (cols[c] = cols[c] || []).push(e);
    });
    return Object.keys(cols).map(Number).sort(function (a, b) { return a - b; }).map(function (c) {
      var list = cols[c].sort(function (x, y) {
        if (c === 4) return y._r - x._r;                       // final before the 3rd-place game
        return feedKey(x) - feedKey(y) || (x.day + x.time).localeCompare(y.day + y.time);
      });
      return { name: t(ROUND_KEY[c]), games: list.map(function (e) {
        return {
          e: e,
          no: e._r === 5 ? "F" : e._r === 4 ? "3rd" : (e.game || ""),
          title: e._r === 5 ? t("finalGame") : e._r === 4 ? t("thirdGame") : (e.game ? t("gameNo").replace("{n}", e.game) : ""),
          sides: ["a", "b"].map(function (k) { return { side: sideOf(e, k, 0), open: openLabel(e, k) }; }),
          score: scoreOf(e)
        };
      }) };
    });
  }
  function playoffSports() {
    return PLAYOFF_SPORTS.filter(function (k) { return bracketFor(k, "M") || bracketFor(k, "W"); });
  }
  function segSwitch(on) {
    return h`<nav class="seg" aria-label="${t("navTables")}">
      <a href="#/tables" class="${on === "tables" ? "on" : ""}"${raw(on === "tables" ? ' aria-current="page"' : "")}>${t("segGroups")}</a>
      <a href="#/playoff" class="${on === "playoff" ? "on" : ""}"${raw(on === "playoff" ? ' aria-current="page"' : "")}>${t("segPlayoff")}</a>
    </nav>`;
  }
  function renderPlayoff() {
    var sports = playoffSports();
    var sport = sports.indexOf(state.sport) >= 0 ? state.sport : null;
    if (!sport && state.school) sport = sports.filter(function (k) { return schoolSports(state.school).indexOf(k) >= 0; })[0];
    sport = sport || sports[0] || "football";
    var mine = state.school;
    var chips = h`<div class="chips">${raw(sports.map(function (k) {
      var sp = SPORTS[k] || { c: "#888" };
      return h`<button class="chip${k === sport ? " on" : ""}" data-sport="${k}" type="button" style="--z:${sp.c}"><span class="dot"></span>${sportName(k)}</button>`;
    }).join(""))}</div>`;
    var sp = SPORTS[sport] || { c: "#888" };
    var body = ["M", "W"].map(function (cat) {
      var rounds = bracketFor(sport, cat);
      if (!rounds) return "";
      var cols = rounds.map(function (r) {
        var boxes = r.games.map(function (g) {
          var e = g.e, sc = g.score, win = sc && sc[0] !== sc[1] ? (sc[0] > sc[1] ? 0 : 1) : -1;
          var sides = g.sides.map(function (x, i) {
            var L = x.side ? sideLabel(x.side, mine, e) : null;
            var name = L ? L.name + (L.extra ? " (" + L.extra + ")" : "") : x.open;
            var me = !!(x.side && x.side.school && x.side.school === mine);
            var cls = "bx-side" + (L ? "" : " open") + (win === i ? " win" : win >= 0 ? " lose" : "") + (me ? " me" : "");
            return h`<div class="${cls}"><span class="bx-name" title="${name}">${name}</span>${raw(sc ? h`<b class="bx-score">${sc[i]}</b>` : "")}</div>`;
          }).join("");
          var v = VENUES[e.venue];
          return h`<li class="bx${e.day === todayISO() && statusOf(e) === "live" ? " is-live" : ""}" data-game="${g.no}">
            <div class="bx-head"><span>${dayName(e.day)} ${e.time}</span><span>${g.title}</span></div>
            ${raw(sides)}
            ${raw(v ? h`<a class="bx-where" href="${mapsUrl(e.venue)}" target="_blank" rel="noopener">${raw(icon("pin"))}${v.name}</a>` : "")}
          </li>`;
        }).join("");
        return h`<div class="round"><h3>${r.name}</h3><ol class="round-games">${raw(boxes)}</ol></div>`;
      }).join("");
      return h`<section class="bracket" style="--z:${sp.c}"><h2>${sportName(sport)} · ${catLabel(cat)}</h2>
        <div class="bracket-scroll" tabindex="0"><div class="rounds">${raw(cols)}</div></div></section>`;
    }).join("") || h`<div class="empty"><p>${t("noPlayoff")}</p></div>`;
    var back = "#/" + (state.school ? "s/" + state.school : "pick");
    app.innerHTML = h`
      ${raw(destPanel(t("playoffTitle"), t("playoffLead"), back, state.school ? t("mine") : t("back")))}
      <div class="page page-plain">
        ${raw(segSwitch("playoff"))}
        ${raw(chips)}
        ${raw(body)}
        <p class="tables-note">${t("playoffRules")}</p>
      </div>`;
  }

  // ---- live match log for STU football, backed by tools/live.gs (a Google Apps Script on a Sheet)
  // Every entry is a row: lineup, k1 (kick-off), h1 (half-time), k2 (second half), ft, goal, ogoal, yellow, red, sub.
  // The clock, the score and who is on the pitch are worked out from the rows, so everyone sees the same.
  // the Apps Script /exec address (Sheet "WIUC 2026 - zapis STU futbal" in the owner's Drive); empty keeps the feature hidden
  var LIVE_URL = "https://script.google.com/macros/s/AKfycbwcQHh0VU4bk4DGCVGZPk81MzfmboxuiIi7OGHCTiIFZxcbcIGnKxuyMYpjbCNiJB5O/exec";
  var LIVE_TEAM = {
    school: "slovak-university-of-technology-in-bratislava", sport: "football",
    roster: [[2, "Fabian"], [3, "Galanda"], [4, "Kotulič"], [5, "Maťoška"], [6, "Jurík"], [8, "Hájnik"], [9, "Drobný"], [10, "Komora"],
      [11, "Cibira"], [12, "Chorvát"], [13, "Hmam"], [14, "Strečanský"], [15, "Šimorka"], [17, "Volf"], [18, "Šebeň"], [19, "Orihel"],
      [20, "Baláž"], [21, "Buchel"], [22, "Tanyasi"], [30, "Šága"]],
    lineup: [30, 2, 18, 6, 21, 5, 8, 14, 15, 11, 9], gk: 30, half: 22.5
  };
  var live = { rows: [], roster: null, loaded: false, at: "", msg: "", picking: null, sel: { a: "", b: "" },
               lineupSel: null, unlocking: false, editRoster: false, ev: null, key: "", timer: 0, tick: 0, busy: false };
  function L(sk, en) { return state.lang === "sk" ? sk : en; }
  function liveUrl() { return typeof window.WIUC_LIVE_URL === "string" ? window.WIUC_LIVE_URL : LIVE_URL; }
  function liveOn(ev) { return !!liveUrl() && !!ev && ev.sport === LIVE_TEAM.sport && involves(ev, LIVE_TEAM.school); }
  function liveHref(ev) { return "#/zapas/" + ev.day + "/" + ev.time.replace(":", ""); }
  function nowMs() { return Date.now() + (window.__liveSkew || 0); }
  function livePin() { return store.get("wiuc.livePin") || ""; }
  function liveQueue() { try { return JSON.parse(store.get("wiuc.liveQueue")) || []; } catch (e) { return []; } }
  function setQueue(q) { store.set("wiuc.liveQueue", JSON.stringify(q)); }
  function liveId() { return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function teamMatches(day) {
    return EVENTS.filter(function (e) { return e.day === day && liveOn(e); });
  }
  function nearest(list, hm) {
    var m = minutesOf(hm), best = null;
    list.forEach(function (e) { if (!best || Math.abs(minutesOf(e.time) - m) < Math.abs(minutesOf(best.time) - m)) best = e; });
    return best && Math.abs(minutesOf(best.time) - m) <= 180 ? best : null;
  }
  // rows of this match: keyed "football|day|time" when the log was started; a later time change still finds them
  function liveKeyFor(ev, rows) {
    var day = ev.day, mine = teamMatches(day), keys = {};
    rows.forEach(function (r) { var p = r.match.split("|"); if (p[0] === ev.sport && p[1] === day) keys[r.match] = p[2]; });
    var found = Object.keys(keys).filter(function (k) { return nearest(mine, keys[k]) === ev; })
      .sort(function (a, b) { return Math.abs(minutesOf(keys[a]) - minutesOf(ev.time)) - Math.abs(minutesOf(keys[b]) - minutesOf(ev.time)); })[0];
    return found || ev.sport + "|" + ev.day + "|" + ev.time;
  }
  function allRows() {
    var rows = live.rows.map(function (r) { return Object.assign({}, r); }), ids = {};
    rows.forEach(function (r) { ids[r.id] = true; });
    liveQueue().forEach(function (op) {
      if (op.op === "add") op.rows.forEach(function (r) { if (!ids[r.id]) { rows.push(Object.assign({ deleted: 0 }, r)); ids[r.id] = true; } });
    });
    liveQueue().forEach(function (op) {
      if (op.op === "del") rows.forEach(function (r) { if (op.ids.indexOf(r.id) >= 0) r.deleted = 1; });
    });
    return rows;
  }
  function liveRoster() {
    var q = liveQueue().filter(function (op) { return op.op === "roster"; }).pop();
    var list = q ? q.roster : live.roster;
    if (list && list.length) return list.map(function (p) { return [+p.n, p.name]; });
    return LIVE_TEAM.roster;
  }
  function pname(n) {
    var p = liveRoster().filter(function (x) { return String(x[0]) === String(n); })[0];
    return p ? p[0] + " " + p[1] : String(n || "?");
  }
  function deriveLive(rows, key) {
    var list = rows.filter(function (r) { return r.match === key && !r.deleted; })
      .sort(function (a, b) { return a.ts - b.ts || (a.id < b.id ? -1 : 1); });
    var d = { list: list, score: [0, 0], phase: "pre", k1: null, k2: null, lineup: null, gk: "", half: LIVE_TEAM.half,
              field: [], stats: {} };
    function st(n) { return d.stats[n] = d.stats[n] || { g: 0, y: 0, r: 0 }; }
    list.forEach(function (r) {
      if (r.type === "lineup") {
        d.lineup = r; d.field = (r.a || "").split(",").filter(Boolean); d.gk = r.b || ""; d.half = +r.note || LIVE_TEAM.half;
      } else if (r.type === "k1") { d.phase = "h1"; d.k1 = r; }
      else if (r.type === "h1") d.phase = "ht";
      else if (r.type === "k2") { d.phase = "h2"; d.k2 = r; }
      else if (r.type === "ft") { d.phase = "ft"; d.ftNote = r.note || ""; }   // note: e.g. "penalty 2 : 3"
      else if (r.type === "goal") { d.score[0]++; if (r.a) st(r.a).g++; }
      else if (r.type === "ogoal") d.score[1]++;
      else if (r.type === "yellow") { st(r.a).y++; if (st(r.a).y >= 2) d.field = d.field.filter(function (n) { return n !== r.a; }); }
      else if (r.type === "red") { st(r.a).r++; d.field = d.field.filter(function (n) { return n !== r.a; }); }
      else if (r.type === "sub") {
        d.field = d.field.filter(function (n) { return n !== r.a; });
        if (r.b && d.field.indexOf(r.b) < 0) d.field.push(r.b);
        if (r.a === d.gk) d.gk = r.b;
      }
    });
    return d;
  }
  // minutes since the half started; a half can be 22.5 minutes, so the second half starts at 23'
  function halfElapsed(d) {
    var start = d.phase === "h1" ? d.k1 : d.phase === "h2" ? d.k2 : null;
    return start ? Math.max(0, (nowMs() - start.ts) / 60000) : -1;
  }
  // nobody entered half-time or full time: stop the clock instead of counting 50+16'
  function liveOverdue(d) { var el = halfElapsed(d); return el >= 0 && el > d.half + 15; }
  function liveMinute(d) {
    var el = halfElapsed(d);
    if (el < 0) return "";
    var base = d.phase === "h2" ? d.half : 0, cap = Math.ceil(base + d.half);
    var x = Math.floor(base + el) + 1;
    if (liveOverdue(d)) return String(cap);
    return x <= cap ? String(x) : cap + "+" + (x - cap);
  }
  function clockText(d) {
    if (d.phase === "pre") return L("Pred zápasom", "Before kick-off");
    if (d.phase === "ht") return L("Polčas", "Half-time");
    if (d.phase === "ft") return L("Koniec zápasu", "Full time") + (d.ftNote ? " · " + d.ftNote : "");
    if (liveOverdue(d)) return d.phase === "h1" ? L("1. polčas asi skončil", "First half probably over") : L("Zápas asi skončil", "Match probably over");
    return (d.phase === "h1" ? L("1. polčas", "1st half") : L("2. polčas", "2nd half")) + " · " + liveMinute(d) + "'";
  }
  function rowText(r) {
    switch (r.type) {
      case "lineup": return L("Základná zostava", "Starting line-up") + ": " + (r.a || "").split(",").filter(Boolean).length + " " + L("hráčov", "players");
      case "k1": return L("Výkop", "Kick-off");
      case "h1": return L("Koniec 1. polčasu", "Half-time");
      case "k2": return L("Začiatok 2. polčasu", "Second half starts");
      case "ft": return L("Koniec zápasu", "Full time") + (r.note ? " · " + r.note : "");
      case "goal": return L("Gól STU", "STU goal") + ": " + (r.a ? pname(r.a) : "?") + (r.b ? " (" + L("asistencia", "assist") + " " + pname(r.b) + ")" : "");
      case "ogoal": return L("Gól súpera", "Opponent goal");
      case "yellow": return L("Žltá karta", "Yellow card") + ": " + pname(r.a);
      case "red": return L("Červená karta", "Red card") + ": " + pname(r.a);
      case "sub": return L("Striedanie", "Substitution") + ": " + L("von", "off") + " " + pname(r.a) + ", " + L("dnu", "on") + " " + pname(r.b);
    }
    return r.type;
  }
  var NEXT_PHASE = { pre: ["k1", "Výkop", "Kick-off"], h1: ["h1", "Koniec 1. polčasu", "Half-time"], ht: ["k2", "Začiatok 2. polčasu", "Start 2nd half"], h2: ["ft", "Koniec zápasu", "Full time"] };

  function liveFetch() {
    var url = liveUrl();
    if (!url) return;
    fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) return;
        var first = !live.loaded;
        var before = JSON.stringify(live.rows);
        live.offline = false;
        live.rows = (j.rows || []).map(function (r) { return Object.assign({}, r, { ts: +r.ts, deleted: +r.deleted ? 1 : 0, a: String(r.a || ""), b: String(r.b || ""), minute: String(r.minute || "") }); });
        live.roster = j.roster || null; live.loaded = true; live.at = nowHM();
        if (!/^#\/zapas\//.test(location.hash)) {
          if (JSON.stringify(live.rows) !== before) { var y = window.scrollY; render(true); window.scrollTo(0, y); }
          return;
        }
        if (first || (!live.picking && !live.unlocking && !live.editRoster && !live.lineupSel)) { if (first) live.lineupSel = null; liveRerender(); }
      }).catch(function () { if (!live.loaded && !live.offline) { live.offline = true; liveRerender(); } });
  }
  // schedule views ask for the log at most once a minute
  function liveEnsure() {
    if (!liveUrl() || (live.fetchedAt && Date.now() - live.fetchedAt < 60000)) return;
    live.fetchedAt = Date.now();
    liveFetch();
  }
  function rowsByMatch() {
    var by = {};
    allRows().forEach(function (r) { if (!r.deleted && r.match) (by[r.match] = by[r.match] || []).push(r); });
    return by;
  }
  function eventOfKey(key) {
    var p = key.split("|");
    return p.length === 3 ? nearest(teamMatches(p[1]), p[2]) : null;
  }
  // "1 : 1 · prebieha" in schedule order (the organiser may list STU second)
  function loggedScore(ev) {
    liveEnsure();
    if (!live.loaded) return "";
    var rows = allRows(), key = liveKeyFor(ev, rows), d = deriveLive(rows, key);
    if (!d.k1 && !d.score[0] && !d.score[1]) return "";
    var mineFirst = ev.a && ev.a.school === LIVE_TEAM.school;
    var x = mineFirst ? d.score[0] : d.score[1], y = mineFirst ? d.score[1] : d.score[0];
    return x + " : " + y + " · " + (d.phase === "ft" || (d.phase === "h2" && liveOverdue(d)) ? L("zápis", "log") : L("prebieha", "live"));
  }
  // goals, assists, cards and matches played over every logged match
  function playerTotals() {
    var tot = {}, by = rowsByMatch();
    function T(n) { return tot[n] = tot[n] || { g: 0, as: 0, y: 0, r: 0, m: 0 }; }
    Object.keys(by).forEach(function (key) {
      var played = {};
      by[key].forEach(function (r) {
        if (r.type === "lineup") (r.a || "").split(",").filter(Boolean).forEach(function (n) { played[n] = true; });
        else if (r.type === "sub" && r.b) played[r.b] = true;
        else if (r.type === "goal") { if (r.a) T(r.a).g++; if (r.b) T(r.b).as++; }
        else if (r.type === "yellow" && r.a) T(r.a).y++;
        else if (r.type === "red" && r.a) T(r.a).r++;
      });
      Object.keys(played).forEach(function (n) { T(n).m++; });
    });
    return Object.keys(tot).map(function (n) { return Object.assign({ n: n }, tot[n]); })
      .sort(function (a, b) { return b.g - a.g || b.as - a.as || b.m - a.m || a.n - b.n; });
  }
  // the latest logged match scheduled before this one (by the schedule, not by device clocks)
  function lastMatchCard(currentKey, cur) {
    var by = rowsByMatch(), best = null, bestAt = "", curAt = cur.day + " " + cur.time;
    Object.keys(by).forEach(function (k) {
      var e = eventOfKey(k);
      if (k === currentKey || !e || e === cur) return;
      var at = e.day + " " + e.time;
      if (at < curAt && at > bestAt) { best = k; bestAt = at; }
    });
    if (!best) return "";
    var ev = eventOfKey(best), d = deriveLive(allRows(), best);
    var us = LIVE_TEAM.school, A = sideLabel(ev.a, us, ev), B = sideLabel(ev.b, us, ev);
    var them = A.me ? B.name : A.name;
    var goals = d.list.filter(function (r) { return r.type === "goal"; })
      .map(function (r) { return (r.minute ? r.minute + "' " : "") + (r.a ? pname(r.a).replace(/^\d+\s+/, "") : "?"); });
    return h`<a class="live-last" href="${liveHref(ev)}">
      <span class="ll-head">${L("Posledný zápas", "Last match")} · ${dayName(ev.day)} ${ev.time}${d.phase === "ft" || liveOverdue(d) ? "" : " · " + L("prebieha", "live")}</span>
      <b class="ll-score">STU ${d.score[0]} : ${d.score[1]} ${them}</b>
      ${raw(goals.length ? h`<span class="ll-goals">${L("Góly STU", "STU goals")}: ${goals.join(", ")}</span>` : "")}
    </a>`;
  }
  function statsTable() {
    var list = playerTotals();
    if (!list.length) return "";
    var rows = list.map(function (x) {
      return h`<tr><td class="st-name">${pname(x.n)}</td> <td>${x.g}</td> <td>${x.as}</td> <td>${x.y}</td> <td>${x.r}</td> <td>${x.m}</td></tr>`;
    }).join(" ");
    return h`<section class="live-stats-wrap"><h2>${L("Turnaj spolu", "Tournament totals")}</h2>
      <table class="live-stats"><thead><tr><th class="st-name">${L("Hráč", "Player")}</th>
        <th title="${L("Góly", "Goals")}">${L("G", "G")}</th><th title="${L("Asistencie", "Assists")}">${L("A", "A")}</th>
        <th title="${L("Žlté karty", "Yellow cards")}"><span class="card-y"></span></th><th title="${L("Červené karty", "Red cards")}"><span class="card-r"></span></th>
        <th title="${L("Odohrané zápasy", "Matches played")}">${L("Z", "M")}</th></tr></thead>
        <tbody>${raw(rows)}</tbody></table></section>`;
  }
  function livePost(body) {
    return fetch(liveUrl(), { method: "POST", body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function liveFlush() {
    if (live.busy) return Promise.resolve();
    var q = liveQueue();
    if (!q.length || !livePin()) return Promise.resolve();
    live.busy = true;
    var op = q[0];
    return livePost(Object.assign({ pin: livePin() }, op)).then(function (j) {
      live.busy = false;
      if (j && j.ok) {
        if (op.op === "add") op.rows.forEach(function (r) { if (!live.rows.some(function (x) { return x.id === r.id; })) live.rows.push(Object.assign({ deleted: 0 }, r)); });
        if (op.op === "del") live.rows.forEach(function (r) { if (op.ids.indexOf(r.id) >= 0) r.deleted = 1; });
        if (op.op === "roster") live.roster = op.roster;
        setQueue(liveQueue().slice(1));
        liveRerender();
        return liveFlush();
      }
      if (j && j.error === "pin") { store.set("wiuc.livePin", ""); live.msg = L("PIN už neplatí. Zadajte ho znova.", "The PIN is no longer valid. Enter it again."); liveRerender(); }
    }).catch(function () { live.busy = false; liveRerender(); });
  }
  function liveAdd(row) {
    row.id = liveId(); row.ts = nowMs(); row.match = live.key;
    row.minute = row.minute || ""; row.a = row.a || ""; row.b = row.b || ""; row.note = row.note || "";
    var q = liveQueue(); q.push({ op: "add", rows: [row] }); setQueue(q);
    liveRerender(); liveFlush();
  }
  function liveRerender() {
    if (!/^#\/zapas\//.test(location.hash)) return;
    var y = window.scrollY; render(true); window.scrollTo(0, y);
  }
  function liveTimers() {
    if (!live.timer) live.timer = setInterval(function () {
      if (!/^#\/zapas\//.test(location.hash)) { clearInterval(live.timer); clearInterval(live.tick); live.timer = live.tick = 0; return; }
      if (!document.hidden) { liveFetch(); liveFlush(); }
    }, 20000);
    if (!live.tick) live.tick = setInterval(function () {
      var c = document.querySelector(".live-clock");
      if (c && live.ev) c.textContent = clockText(deriveLive(allRows(), live.key));
    }, 1000);
  }

  function renderLive(day, hm) {
    var hhmm = hm.slice(0, 2) + ":" + hm.slice(2, 4);
    var ev = liveUrl() ? nearest(teamMatches(day), hhmm) : null;
    var back = "#/" + (state.school ? "s/" + state.school : "pick");
    if (!ev) {
      app.innerHTML = h`${raw(destPanel(L("Priebeh zápasu", "Match log"), "", back, t("mine")))}
        <div class="page page-plain"><div class="empty"><p>${L("Tento zápas sa nezapisuje.", "This match has no live log.")}</p></div></div>`;
      return;
    }
    if (live.ev !== ev) { live.ev = ev; live.loaded = false; live.offline = false; live.picking = null; live.lineupSel = null; live.msg = ""; liveFetch(); }
    liveTimers();
    var rows = allRows();
    live.key = liveKeyFor(ev, rows);
    var d = deriveLive(rows, live.key);
    var writer = !!livePin();
    var canWrite = writer && (live.loaded || live.offline);   // wait for the log, so a line-up is not asked for twice
    var us = LIVE_TEAM.school, A = sideLabel(ev.a, us, ev), B = sideLabel(ev.b, us, ev);
    var mineFirst = A.me;
    var them = mineFirst ? B.name : A.name;
    var v = VENUES[ev.venue];
    var roster = liveRoster();

    function player(n, extraCls) {
      var s = d.stats[n] || {}, cls = extraCls || "";
      var name = (roster.filter(function (x) { return String(x[0]) === String(n); })[0] || [n, ""])[1];
      return h`<li data-num="${n}" class="${cls}"><b>${n}</b> <span class="pn">${name}</span>${raw(String(n) === String(d.gk) ? h` <span class="gk" title="${L("Brankár", "Goalkeeper")}">${L("B", "GK")}</span>` : "")}${raw(s.g ? h` <span class="goals" title="${L("Góly", "Goals")}">${raw(icon("football"))}${s.g > 1 ? "×" + s.g : ""}</span>` : "")}${raw(s.y ? h` <span class="card-y" title="${L("Žltá karta", "Yellow card")}"></span>` : "")}${raw(s.r || s.y > 1 ? h` <span class="card-r" title="${L("Červená karta", "Red card")}"></span>` : "")}</li>`;
    }
    var squad;
    if (d.lineup) {
      var bench = roster.map(function (x) { return String(x[0]); }).filter(function (n) { return d.field.indexOf(n) < 0; });
      squad = h`<h2>${L("Na ihrisku", "On the pitch")} <small>${d.field.length}</small></h2><ul class="live-field">${raw(d.field.map(function (n) { return player(n); }).join(""))}</ul>
        <h2>${L("Lavička", "Bench")}</h2><ul class="live-bench">${raw(bench.map(function (n) { return player(n); }).join(""))}</ul>`;
    } else {
      squad = h`<h2>${L("Súpiska", "Squad")}</h2><ul class="live-roster">${raw(roster.map(function (x) { return player(String(x[0])); }).join(""))}</ul>`;
    }
    var timeline = d.list.slice().reverse().map(function (r) {
      var ic = r.type === "goal" || r.type === "ogoal" ? icon("football") : r.type === "sub" ? icon("swap") : r.type === "yellow" ? '<span class="card-y"></span>' : r.type === "red" ? '<span class="card-r"></span>' : icon("clock");
      return h`<li class="tl-${r.type}"><span class="tl-min">${r.minute ? r.minute + "'" : ""}</span><span class="tl-ic">${raw(ic)}</span><span class="tl-txt">${rowText(r)}</span>${raw(writer ? h`<button type="button" class="tl-del" data-live="del" data-id="${r.id}" aria-label="${L("Zmazať záznam", "Delete entry")}">×</button>` : "")}</li>`;
    }).join("") || h`<li class="tl-empty">${L("Zatiaľ bez záznamov.", "No entries yet.")}</li>`;

    function picks(group, list, sel, multi) {
      return h`<div class="live-pick" data-group="${group}">${raw(list.map(function (n) {
        var on = multi ? sel.indexOf(String(n)) >= 0 : String(sel) === String(n);
        var nm = (roster.filter(function (x) { return String(x[0]) === String(n); })[0] || [n, ""])[1];
        return h`<button type="button" data-num="${n}" class="${on ? "on" : ""}" aria-pressed="${on ? "true" : "false"}"><b>${n}</b><span>${nm}</span></button>`;
      }).join(""))}</div>`;
    }
    var write = "";
    if (canWrite) {
      var all = roster.map(function (x) { return String(x[0]); });
      var benchNow = all.filter(function (n) { return d.field.indexOf(n) < 0 && !(d.stats[n] && d.stats[n].r); });
      var fieldNow = d.lineup ? d.field : all;
      var inner;
      if (live.lineupSel || !d.lineup) {
        if (!live.lineupSel) {
          var prev = live.rows.filter(function (r) { return r.type === "lineup" && !r.deleted; }).sort(function (a, b) { return a.ts - b.ts; }).pop();
          live.lineupSel = (d.lineup ? d.field : prev ? prev.a.split(",") : LIVE_TEAM.lineup.map(String)).filter(Boolean);
        }
        var gkDefault = d.gk || (live.lineupSel.indexOf(String(LIVE_TEAM.gk)) >= 0 ? String(LIVE_TEAM.gk) : "");
        inner = h`<h2>${L("Základná zostava", "Starting line-up")} <small>${live.lineupSel.length}</small></h2>
          ${raw(picks("lineup", all, live.lineupSel, true))}
          <div class="live-row"><label>${L("Brankár", "Goalkeeper")} <select id="liveGk">${raw('<option value="">-</option>' + live.lineupSel.map(function (n) { return h`<option value="${n}"${raw(n === gkDefault ? " selected" : "")}>${pname(n)}</option>`; }).join(""))}</select></label>
          <label>${L("Polčas (min)", "Half (min)")} <input id="liveHalf" type="number" min="5" max="45" step="0.5" value="${d.half}" inputmode="decimal"></label></div>
          <div class="live-row"><button type="button" class="btn primary" data-live="lineup-save">${L("Uložiť zostavu", "Save line-up")}</button>${raw(d.lineup ? h`<button type="button" class="btn" data-live="cancel">${L("Zrušiť", "Cancel")}</button>` : "")}</div>`;
      } else if (live.picking) {
        var tp = live.picking, la = "", lb = "", ga = [], gb = [];
        if (tp === "goal") { la = L("Strelec", "Scorer"); ga = fieldNow; lb = L("Asistencia (nepovinné)", "Assist (optional)"); gb = fieldNow.filter(function (n) { return n !== live.sel.a; }); }
        if (tp === "sub") { la = L("Ide von", "Off"); ga = fieldNow; lb = L("Ide dnu", "On"); gb = benchNow; }
        if (tp === "yellow" || tp === "red") { la = L("Hráč", "Player"); ga = all; }
        inner = h`<h2>${rowText({ type: tp, a: "", b: "" }).split(":")[0]}</h2>
          ${raw(la ? h`<p class="live-lab">${la}</p>${raw(picks("a", ga, live.sel.a))}` : "")}
          ${raw(lb ? h`<p class="live-lab">${lb}</p>${raw(picks("b", gb, live.sel.b))}` : "")}
          <div class="live-row"><label>${L("Minúta", "Minute")} <input id="liveMin" type="text" inputmode="numeric" value="${liveMinute(d)}" size="5"></label></div>
          <div class="live-row"><button type="button" class="btn primary" data-live="save">${L("Uložiť", "Save")}</button><button type="button" class="btn" data-live="cancel">${L("Zrušiť", "Cancel")}</button></div>`;
      } else if (live.editRoster) {
        inner = h`<h2>${L("Súpiska", "Squad")}</h2><p class="live-lab">${L("Jeden hráč na riadok: číslo a meno.", "One player per line: number and name.")}</p>
          <textarea id="liveRoster" rows="12">${roster.map(function (x) { return x[0] + " " + x[1]; }).join("\n")}</textarea>
          <div class="live-row"><button type="button" class="btn primary" data-live="roster-save">${L("Uložiť súpisku", "Save squad")}</button><button type="button" class="btn" data-live="cancel">${L("Zrušiť", "Cancel")}</button></div>`;
      } else {
        var np = NEXT_PHASE[d.phase];
        inner = h`<div class="live-actions">
            ${raw(np ? h`<button type="button" class="btn primary phase" data-live="${np[0]}">${L(np[1], np[2])}</button>` : "")}
            <button type="button" class="btn act-goal" data-live="goal">${L("Gól STU", "STU goal")}</button>
            <button type="button" class="btn" data-live="ogoal">${L("Gól súpera", "Opponent goal")}</button>
            <button type="button" class="btn" data-live="sub">${L("Striedanie", "Substitution")}</button>
            <button type="button" class="btn" data-live="yellow"><span class="card-y"></span> ${L("Žltá", "Yellow")}</button>
            <button type="button" class="btn" data-live="red"><span class="card-r"></span> ${L("Červená", "Red")}</button>
          </div>
          <div class="live-row small">
            <button type="button" class="btn" data-live="undo"${raw(d.list.length ? "" : " disabled")}>${L("Vrátiť posledný záznam", "Undo last entry")}</button>
            <button type="button" class="btn" data-live="relineup">${L("Upraviť zostavu", "Edit line-up")}</button>
            <button type="button" class="btn" data-live="roster">${L("Upraviť súpisku", "Edit squad")}</button>
          </div>`;
      }
      var q = liveQueue().length;
      write = h`<section class="live-write">${raw(inner)}
        ${raw(q ? h`<p class="live-queue">${L("Neodoslané záznamy", "Unsent entries")}: ${q} <button type="button" class="btn" data-live="retry">${L("Skúsiť znova", "Try again")}</button></p>` : "")}</section>`;
    }
    var foot = writer
      ? h`<p class="live-foot">${L("Zapisujete ako tím.", "You are writing for the team.")} <button type="button" class="linkish" data-live="lock">${L("Prestať zapisovať", "Stop writing")}</button></p>`
      : live.unlocking
        ? h`<div class="live-foot live-unlock"><label>PIN <input id="livePin" type="password" inputmode="numeric" autocomplete="off"></label><button type="button" class="btn primary" data-live="pin-ok">${L("Odomknúť zápis", "Unlock")}</button><button type="button" class="btn" data-live="cancel">${L("Zrušiť", "Cancel")}</button></div>`
        : h`<p class="live-foot"><button type="button" class="linkish" data-live="unlock">${L("Zapisovať (pre tím)", "Write the log (team only)")}</button></p>`;

    app.innerHTML = h`
      ${raw(destPanel(A.name + " vs " + B.name, dayName(ev.day) + " " + ev.time + (v ? " · " + v.name : ""), back, t("mine")))}
      <div class="page page-plain live-page">
        <section class="live-board" style="--z:${(SPORTS.football || {}).c}">
          <div class="live-teams"><span class="me">${shortName(SCHOOLS[us].name)}</span><b class="live-score">${d.score[0]} : ${d.score[1]}</b><span>${them}</span></div>
          <p class="live-clock">${clockText(d)}</p>
          <p class="live-upd">${live.loaded ? L("Aktualizované", "Updated") + " " + live.at + " · " + L("obnovuje sa samo", "refreshes by itself") : live.offline ? L("Bez spojenia, skúšam znova", "Offline, trying again") : L("Načítavam…", "Loading…")}</p>
        </section>
        ${raw(live.msg ? h`<p class="live-msg" role="alert">${live.msg}</p>` : "")}
        ${raw(d.phase === "pre" ? lastMatchCard(live.key, ev) : "")}
        ${raw(write)}
        <div class="live-cols">
          <div class="live-side"><section class="live-squad">${raw(squad)}</section>${raw(statsTable())}</div>
          <section class="live-tl"><h2>${L("Priebeh", "Timeline")}</h2><ol class="live-timeline">${raw(timeline)}</ol></section>
        </div>
        ${raw(foot)}
      </div>`;
  }

  app.addEventListener("click", function (e) {
    var num = e.target.closest(".live-pick [data-num]");
    var b = e.target.closest("[data-live]");
    if (!num && !b) return;
    if (num) {
      var g = num.parentNode.getAttribute("data-group"), n = num.getAttribute("data-num");
      if (g === "lineup") {
        var i = live.lineupSel.indexOf(n);
        if (i >= 0) live.lineupSel.splice(i, 1); else live.lineupSel.push(n);
      } else live.sel[g] = live.sel[g] === n ? "" : n;
      liveRerender();
      return;
    }
    var act = b.getAttribute("data-live");
    var d = deriveLive(allRows(), live.key);
    live.msg = "";
    if (act === "unlock") { live.unlocking = true; }
    else if (act === "pin-ok") {
      var pin = (document.getElementById("livePin") || {}).value || "";
      livePost({ pin: pin, op: "check" }).then(function (j) {
        if (j && j.ok) { store.set("wiuc.livePin", pin); live.unlocking = false; live.msg = ""; }
        else live.msg = L("Nesprávny PIN.", "Wrong PIN.");
        liveRerender(); liveFlush();
      }).catch(function () { live.msg = L("PIN sa nepodarilo overiť. Skontrolujte pripojenie a skúste znova.", "Could not check the PIN. Check your connection and try again."); liveRerender(); });
      return;
    }
    else if (act === "lock") { store.set("wiuc.livePin", ""); }
    else if (act === "cancel") { live.unlocking = false; live.picking = null; live.editRoster = false; live.lineupSel = null; live.sel = { a: "", b: "" }; }
    else if (act === "lineup-save") {
      var gk = (document.getElementById("liveGk") || {}).value || "";
      var half = parseFloat(String((document.getElementById("liveHalf") || {}).value || "").replace(",", ".")) || LIVE_TEAM.half;
      var sel = live.lineupSel.slice().sort(function (x, y) { return x - y; });
      live.lineupSel = null;
      liveAdd({ type: "lineup", a: sel.join(","), b: sel.indexOf(gk) >= 0 ? gk : "", note: String(half) });
      return;
    }
    else if (act === "k1" || act === "h1" || act === "k2" || act === "ft") { liveAdd({ type: act, minute: act === "k1" ? "" : act === "k2" ? "" : liveMinute(d) }); return; }
    else if (act === "goal" || act === "sub" || act === "yellow" || act === "red") { live.picking = act; live.sel = { a: "", b: "" }; }
    else if (act === "ogoal") { live.picking = "ogoal"; live.sel = { a: "", b: "" }; }
    else if (act === "save") {
      var tp = live.picking, a = live.sel.a, bb = live.sel.b;
      if ((tp === "sub" && (!a || !bb)) || ((tp === "yellow" || tp === "red") && !a)) {
        live.msg = tp === "sub" ? L("Vyberte, kto ide von a kto dnu.", "Pick who goes off and who comes on.") : L("Vyberte hráča.", "Pick a player.");
      } else {
        var min = ((document.getElementById("liveMin") || {}).value || "").trim().slice(0, 8);
        live.picking = null; live.sel = { a: "", b: "" };
        liveAdd({ type: tp, a: a, b: bb, minute: min });
        return;
      }
    }
    else if (act === "undo" || act === "del") {
      var id = act === "del" ? b.getAttribute("data-id") : (d.list[d.list.length - 1] || {}).id;
      if (!id) return;
      var q = liveQueue(), queued = false;
      q.forEach(function (op) { if (op.op === "add") { var before = op.rows.length; op.rows = op.rows.filter(function (r) { return r.id !== id; }); if (op.rows.length !== before) queued = true; } });
      q = q.filter(function (op) { return op.op !== "add" || op.rows.length; });
      if (!queued) q.push({ op: "del", ids: [id] });
      setQueue(q); liveRerender(); liveFlush();
      return;
    }
    else if (act === "relineup") { live.lineupSel = null; live.lineupSel = d.field.slice(); }
    else if (act === "roster") { live.editRoster = true; }
    else if (act === "roster-save") {
      var lines = ((document.getElementById("liveRoster") || {}).value || "").split(/\n/);
      var list = lines.map(function (l) { var m = /^\s*(\d{1,3})\s+(.+?)\s*$/.exec(l); return m ? { n: m[1], name: m[2] } : null; }).filter(Boolean);
      live.editRoster = false;
      if (list.length) { var qq = liveQueue(); qq.push({ op: "roster", roster: list }); setQueue(qq); liveFlush(); }
    }
    else if (act === "retry") { liveRerender(); liveFlush(); return; }
    liveRerender();
  });

  // ---- calendar export (.ics) of your university's matches
  function icsStamp(day, hm, addMinutes) {
    // Bratislava is UTC+1 in November (no daylight saving during the championship)
    var d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10), +hm.slice(0, 2) - 1, +hm.slice(3, 5) + (addMinutes || 0)));
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }
  function icsText(x) { return String(x || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function downloadCalendar(list, sid, fileName) {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WIUC 2026 helper//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:WIUC 2026"];
    var now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    list.forEach(function (e) {
      var v = VENUES[e.venue];
      var A = sideLabel(e.a, sid, e), B = sideLabel(e.b, sid, e);
      var title = sportName(e.sport) + (e.cat ? " " + catLabel(e.cat) : "") + ": " + (e.sport === "ceremony" ? t("ceremony") : A.name + (B.name ? " vs " + B.name : ""));
      var place = v ? v.name + ", " + v.addr + ", Bratislava" : "";
      var desc = [e.court ? unitWord(e) + " " + e.court : "", e.pool ? t("group") + " " + e.pool : "", e.stage || "", location.origin + location.pathname + (sid ? "#/s/" + sid : "")].filter(Boolean).join("\n");
      lines.push("BEGIN:VEVENT", "UID:" + (e.id || (e.day + e.time + e.sport + e.idx)) + "@wiuc2026", "DTSTAMP:" + now,
        "DTSTART:" + icsStamp(e.day, e.time), "DTEND:" + icsStamp(e.day, e.time, durationMin(e.sport)),
        "SUMMARY:" + icsText(title), "LOCATION:" + icsText(place), "DESCRIPTION:" + icsText(desc),
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText(title), "TRIGGER:-PT30M", "END:VALARM", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    var blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  // ---- "next match" card at the top of the university view
  function minutesOf(hm) { return (+hm.slice(0, 2)) * 60 + (+hm.slice(3, 5)); }
  function nextMatch(sid) {
    var today = todayISO(), now = minutesOf(nowHM());
    var last = DAYS[DAYS.length - 1].d;
    if (today > last) return null;
    // with a sport picked, the next match of that sport
    var list = EVENTS.filter(function (e) { return involves(e, sid) && !resultOf(e) && (state.sport === "all" || e.sport === state.sport); })
      .sort(function (a, b) { return (a.day + a.time).localeCompare(b.day + b.time); });
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.day < today) continue;
      if (e.day === today && now >= minutesOf(e.time) + durationMin(e.sport)) continue;
      return e;
    }
    return null;
  }
  function nextCard(sid, where) {
    var e = nextMatch(sid);
    if (!e) return "";
    var today = todayISO(), now = minutesOf(nowHM()), start = minutesOf(e.time);
    var when;
    if (e.day === today && now >= start) when = t("nowOn");
    else if (e.day === today) {
      var d = start - now, hh = Math.floor(d / 60), mm = d % 60;
      when = hh ? t("inHours").replace("{h}", hh).replace("{m}", mm) : t("inMin").replace("{m}", mm);
    } else {
      var tomorrow = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10) + 1)).toISOString().slice(0, 10);
      when = e.day === tomorrow ? t("tomorrow") : dayName(e.day);
    }
    when = when.charAt(0).toUpperCase() + when.slice(1);
    var sp = SPORTS[e.sport] || { c: "#888" };
    var v = VENUES[e.venue];
    var A = sideLabel(e.a, sid, e), B = sideLabel(e.b, sid, e);
    var who = B.name ? (A.me ? B.name : A.name) : "";
    var live = e.day === today && now >= start;
    return h`<section class="next-card ${where}${live ? " is-live" : ""}" style="--z:${sp.c}">
      <div class="next-when"><span>${t("nextTitle")}</span><b>${when}</b></div>
      <div class="next-body">
        <div class="next-time">${e.time}</div>
        <div class="next-what">
          <div class="next-sport">${sportName(e.sport)}${raw(e.cat ? h` <span class="cat">· ${catLabel(e.cat)}</span>` : "")}</div>
          ${raw(who ? h`<div class="next-vs">vs ${who}</div>` : "")}
          <div class="next-where">${v ? v.name : ""}${raw(e.court ? h` · ${unitWord(e)} ${e.court}` : "")}</div>
        </div>
      </div>
      <div class="next-actions">
        <a class="btn primary route" href="${mapsUrl(e.venue)}" target="_blank" rel="noopener">${raw(icon("pin"))} ${t("route")}</a>
        <button class="btn cal" type="button" data-cal="${e.idx}" aria-label="${t("cal")}">${raw(icon("cal"))}<span class="lbl"> ${t("cal")}</span></button>
      </div>
    </section>`;
  }
  function destPanel(title, lead, backHref, backLabel, sub) {
    return h`<div class="dest"><div class="dest-inner">
      <div><h1>${title}</h1>${raw(sub ? h`<p class="lead sub">${sub}</p>` : "")}<p class="lead">${lead}</p></div>
      <a class="btn" href="${backHref}">${backLabel}</a>
    </div></div>`;
  }

  // ---- school view
  // "Football: your university has no match on Wednesday." with a way out
  function onDayWords(d) {
    var sk = { "2026-11-04": "v stredu", "2026-11-05": "vo štvrtok", "2026-11-06": "v piatok", "2026-11-07": "v sobotu", "all": "počas turnaja" };
    var en = { "2026-11-04": "on Wednesday", "2026-11-05": "on Thursday", "2026-11-06": "on Friday", "2026-11-07": "on Saturday", "all": "during the championship" };
    return (state.lang === "sk" ? sk : en)[d] || d;
  }
  function emptyState() {
    var when = onDayWords(state.day);
    var msg = state.sport === "all"
      ? (state.lang === "sk" ? "Vaša univerzita " + when + " nehrá žiadny zápas." : "Your university has no match " + when + ".")
      : (state.lang === "sk" ? sportName(state.sport) + ": vaša univerzita " + when + " nehrá žiadny zápas." : sportName(state.sport) + ": your university has no match " + when + ".");
    var actions = [];
    if (state.sport !== "all") actions.push(h`<button class="btn" type="button" data-sport="all">${state.lang === "sk" ? "Zobraziť všetky športy" : "Show all sports"}</button>`);
    if (state.day !== "all") actions.push(h`<button class="btn" type="button" data-day="all">${t("allDaysShort")}</button>`);
    return h`<div class="empty"><p>${msg}</p>${raw(actions.length ? '<div class="empty-actions">' + actions.join("") + "</div>" : "")}</div>`;
  }
  function renderSchool(sid) {
    var s = SCHOOLS[sid];
    var sports = schoolSports(sid);
    var mine = EVENTS.filter(function (e) { return involves(e, sid) || e.all; });
    var myCats = {};
    mine.forEach(function (e) { myCats[e.sport + "/" + e.cat] = true; });
    var playoff = EVENTS.filter(function (e) {
      return !e.extra && !e.all && !e.a.school && !e.b.school && myCats[e.sport + "/" + e.cat];
    });
    if (state.sport !== "all" && sports.indexOf(state.sport) < 0) state.sport = "all";

    function dayCount(d) {
      var n = mine.filter(function (e) { return e.day === d; }).length;
      if (!n && playoff.some(function (e) { return e.day === d; })) return "play-off";
      return n;
    }
    var allDays = state.day === "all";
    function onDay(e) { return allDays || e.day === state.day; }
    var sportCounts = {};
    mine.forEach(function (e) { if (onDay(e) && !e.all) sportCounts[e.sport] = (sportCounts[e.sport] || 0) + 1; });

    function dayBody(day, withHead) {
      var dayList = mine.filter(function (e) { return e.day === day && (state.sport === "all" || e.sport === state.sport || e.all); });
      var poList = playoff.filter(function (e) { return e.day === day && (state.sport === "all" || e.sport === state.sport); });
      if (!dayList.length && !poList.length) return "";
      if (withHead && !dayList.some(function (e) { return !e.all; }) && !poList.length) return "";
      var d = DAYS.filter(function (q) { return q.d === day; })[0];
      var out = withHead ? h`<h2 class="day-head">${state.lang === "sk" ? d.sk : d.en} ${d.num} <small>(${(function (n) { return n ? nMatches(n) : t("playoff"); })(dayList.filter(function (e) { return !e.all; }).length)})</small></h2>` : "";
      out += eventList(dayList, sid);
      if (poList.length) {
        var groups = {};
        poList.forEach(function (e) { var k = e.sport + "/" + e.cat; (groups[k] = groups[k] || []).push(e); });
        out += Object.keys(groups).map(function (k) {
          var g = groups[k], first = g[0], v = VENUES[first.venue];
          return h`<details class="playoff"><summary>${raw(icon("chev"))}${t("playoff")}: ${sportName(first.sport)} ${catLabel(first.cat)} · ${nMatches(g.length)}, ${v ? v.name : ""} ${state.lang === "sk" ? "od" : "from"} ${first.time}</summary>
            <p class="day-note">${t("playoffNote")}${raw(PLAYOFF_SPORTS.indexOf(first.sport) >= 0 ? h` <a href="#/playoff/${first.sport}">${t("seeBracket")}</a>` : "")}</p>${raw(eventList(g, sid))}</details>`;
        }).join("");
      }
      return out;
    }

    var body = allDays ? DAYS.map(function (d) { return dayBody(d.d, true); }).join("") : dayBody(state.day, false);
    if (!body) {
      body = emptyState();
    }
    var todayN = mine.filter(function (e) { return onDay(e) && !e.all; }).length;
    var lead = s.country + " · " + nSports(sports.length) + " · " + nMatches(todayN);
    var links = "";
    app.innerHTML = h`
      <div class="page">
      <aside class="side"><div class="side-in">
      ${raw(destPanel(shortName(s.name), lead, "#/pick", t("change"), shortName(s.name) === s.name ? "" : s.name))}
      ${raw(nextCard(sid, "in-side"))}
      ${raw(dayTabs(dayCount, mine.filter(function (e) { return !e.all; }).length))}
      ${raw(sportChips(sports, sportCounts))}
      ${raw(links)}
      </div></aside>
      <div id="list" class="board">${raw(nextCard(sid, "in-board"))}${raw(body)}</div>
      <div class="pdf-block">
      <h2>${t("pdfTitle")}</h2><p class="day-note">${t("pdfLead")}</p>
      <ul class="pdf-list">${raw(PDFS.map(function (p) {
        return h`<li><a href="${p.url}" target="_blank" rel="noopener">${state.lang === "sk" ? p.sk : p.en}</a></li>`; }).join(""))}</ul>
      </div>
      </div>`;
  }

  // ---- all matches
  function renderAll() {
    var sports = Object.keys(SPORTS).filter(function (k) { return EVENTS.some(function (e) { return e.sport === k && !e.extra; }); });
    if (state.day === "all") state.day = defaultDay();
    var dayEvents = EVENTS.filter(function (e) { return e.day === state.day && !e.extra; });
    var counts = {};
    dayEvents.forEach(function (e) { counts[e.sport] = (counts[e.sport] || 0) + 1; });
    var list = dayEvents.filter(function (e) { return state.sport === "all" || e.sport === state.sport; });
    var byVenue = {};
    list.forEach(function (e) { var k = e.venue || "?"; (byVenue[k] = byVenue[k] || []).push(e); });
    var body = Object.keys(byVenue).map(function (k) {
      var v = VENUES[k];
      return h`<h2>${v ? v.name : "?"} <small>(${nMatches(byVenue[k].length)})</small></h2>${raw(eventList(byVenue[k], state.school))}`;
    }).join("");
    var backHref = "#/" + (state.school ? "s/" + state.school : "pick");
    app.innerHTML = h`
      <div class="page">
      <aside class="side"><div class="side-in">
      ${raw(destPanel(t("allMatches"), t("allLead"), backHref, state.school ? t("mine") : t("back")))}
      ${raw(dayTabs(function (d) { return EVENTS.filter(function (e) { return e.day === d && !e.extra; }).length; }))}
      ${raw(sportChips(sports, counts))}
      </div></aside>
      <div class="board">${raw(body || h`<p class="empty">${t("noEvents")}</p>`)}</div>
      </div>`;
  }

  // ---- venues
  function renderVenues() {
    function card(k) {
      var v = VENUES[k];
      var sports = {};
      EVENTS.forEach(function (e) { if (e.venue === k) sports[e.sport] = true; });
      var todayN = EVENTS.filter(function (e) { return e.venue === k && (state.day === "all" || e.day === state.day); }).length;
      var ph = VENUE_PHOTOS[k];
      return h`<div class="venue${ph ? " has-photo" : ""}">
        ${raw(ph ? h`<img class="vphoto" src="assets/venues/${k}.jpg" alt="${v.name}" loading="lazy" decoding="async">` : "")}
        <div class="vbody">
          <div class="vname">${v.name}</div>
          <div class="addr">${v.addr}, Bratislava</div>
          <div class="vsports">${Object.keys(sports).map(sportName).join(", ")}${todayN ? " · " + (state.day === "all" ? t("allDaysShort") : dayName(state.day)) + ": " + nMatches(todayN) : ""}</div>
        </div>
        <a class="plate" href="${mapsUrl(k)}" target="_blank" rel="noopener" aria-label="${v.name}, ${t("map")}">${raw(icon("pin"))}${t("map")}</a>
      </div>`;
    }
    var withPhoto = Object.keys(VENUES).filter(function (k) { return VENUE_PHOTOS[k]; }).map(card).join("");
    var noPhoto = Object.keys(VENUES).filter(function (k) { return !VENUE_PHOTOS[k]; }).map(card).join("");
    app.innerHTML = h`
      ${raw(destPanel(t("venues"), t("venuesLead"), "#/" + (state.school ? "s/" + state.school : "pick"), state.school ? t("mine") : t("back")))}
      <div class="page page-plain"><div class="venue-grid">${raw(withPhoto)}</div><div class="venue-grid venue-grid-plain">${raw(noPhoto)}</div>
      <p class="photo-credits">${state.lang === "sk" ? "Fotografie" : "Photographs"}: ${raw(Object.keys(VENUE_PHOTOS).map(function (k) {
        var c = VENUE_PHOTOS[k];
        return h`<a href="${c.source}" target="_blank" rel="noopener">${VENUES[k] ? VENUES[k].name : k}</a> (${c.author}, ${c.license})`;
      }).join(" · "))}, Wikimedia Commons.</p></div>`;
  }

  // ------------------------------------------------------------ boot
  document.getElementById("langBtn").addEventListener("click", function () {
    state.lang = state.lang === "sk" ? "en" : "sk";
    store.set("wiuc.lang", state.lang);
    render();
  });
  window.addEventListener("hashchange", function () { setMenu(false); render(); track(); });

  // anonymous visit counting (GoatCounter, no cookies): one count per view, e.g. /tables or /s/<university>
  function track() {
    if (!window.goatcounter || !window.goatcounter.count) return;
    window.goatcounter.count({ path: "/" + location.hash.replace(/^#\/?/, ""), title: document.title });
  }
  window.wiucTrack = track;
  track();

  // side menu on phones and tablets
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    document.getElementById("menuBtn").setAttribute("aria-expanded", open ? "true" : "false");
  }
  document.getElementById("menuBtn").addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
  document.getElementById("menuScrim").addEventListener("click", function () { setMenu(false); });
  document.getElementById("tabbar").addEventListener("click", function (e) { if (e.target.closest("[data-more]")) setMenu(!document.body.classList.contains("menu-open")); });
  document.getElementById("menu").addEventListener("click", function (e) { if (e.target.closest("a, .menu-close")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  render();
  function checkForUpdate() {
    if (document.hidden || !window.fetch || location.protocol === "file:") return;
    fetch("data.js?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (txt) {
      var m = /"generated":"([^"]+)"/.exec(txt || "");
      if (!m || m[1] === DATA.generated || document.getElementById("updateBar")) return;
      var bar = document.createElement("div");
      bar.id = "updateBar";
      bar.className = "update-bar";
      bar.innerHTML = h`<span>${t("updated")}</span><button class="btn primary" type="button">${t("reload")}</button>`;
      bar.querySelector("button").addEventListener("click", function () { location.reload(); });
      document.body.appendChild(bar);
    }).catch(function () {});
  }
  setInterval(checkForUpdate, 5 * 60000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) checkForUpdate(); });

  setInterval(function () { if (route().view !== "pick") { var y = window.scrollY; render(true); window.scrollTo(0, y); } }, 60000);
})();
