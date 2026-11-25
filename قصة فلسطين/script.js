/* ==========================================================================
   فلسطين | حكاية لا تنتهي — interaction layer
   - 15-scene cinematic deck
   - sourced scene dialogs + full credits
   - optional looping music, started only by the intro call to action
   - mouse-only fading red trail (disabled on touch / small screens / reduced motion)
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------------------ */

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const pad2 = (value) => String(value).padStart(2, "0");
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));

  const externalLink = (url, label) =>
    '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + "</a>";

  const isTypingTarget = (target) =>
    Boolean(target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]'));

  const anyDialogOpen = () => Boolean(document.querySelector("dialog[open]"));

  /* ------------------------------------------------------------------------
     Persistent references
     ------------------------------------------------------------------------ */

  const body = document.body;
  const deck = $("#deck");
  const slides = $$("#deck .slide");
  const total = slides.length;

  const els = {
    countCurrent: $("#countCurrent"),
    railFill: $("#railFill"),
    railDots: $("#railDots"),
    railCurrent: $("#railCurrent"),
    railChapter: $("#railChapter"),
    prevBtn: $("#prevBtn"),
    nextBtn: $("#nextBtn"),
    navHint: $("#navHint"),
    chapterDialog: $("#chapterDialog"),
    chapterDialogTitle: $("#chapterDialogTitle"),
    chapterDialogBody: $("#chapterDialogBody"),
    chapterKicker: $("#chapterDialog .dialog__kicker"),
    creditsDialog: $("#creditsDialog"),
    creditsDialogBody: $("#creditsDialogBody"),
    muteToggle: $("#muteToggle"),
    audio: $("#music")
  };

  const dots = [];
  let index = 0;
  let started = false;
  let navHintTimer = 0;
  let shiftTimer = 0;

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reduceMotionQuery.matches;

  /* ------------------------------------------------------------------------
     Source links
     ------------------------------------------------------------------------ */

  const S = {
    unispalHistory: {
      label: "الأمم المتحدة — تاريخ القضية الفلسطينية",
      url: "https://www.un.org/unispal/history/",
      note: "تسلسل زمني ووثائق وقرارات أممية."
    },
    res181: {
      label: "قرار الجمعية العامة 181 (II) — خطة التقسيم",
      url: "https://www.un.org/unispal/document/auto-insert-185393/",
      note: "النص الرسمي للقرار الصادر في 29 تشرين الثاني/نوفمبر 1947."
    },
    res242: {
      label: "قرار مجلس الأمن 242 (1967)",
      url: "https://www.un.org/unispal/document/auto-insert-184858/",
      note: "النص الرسمي، 22 تشرين الثاني/نوفمبر 1967."
    },
    oslo: {
      label: "وثائق أوسلو — الأمم المتحدة",
      url: "https://www.un.org/unispal/document/auto-insert-180015/",
      note: "اتفاقيات 1993 وملاحقها في أرشيف الأمم المتحدة."
    },
    unrwaRefugees: {
      label: "الأونروا — لاجئو فلسطين",
      url: "https://www.unrwa.org/palestine-refugees",
      note: "أرقام اللاجئين المسجلين والمخيمات وأقاليم العمليات."
    },
    unrwaGaza: {
      label: "الأونروا — قطاع غزة",
      url: "https://www.unrwa.org/where-we-work/gaza-strip",
      note: "سياق العمليات والاحتياجات الإنسانية في غزة."
    },
    ochaGaza: {
      label: "مكتب الأمم المتحدة لتنسيق الشؤون الإنسانية — غزة",
      url: "https://www.ochaopt.org/location/gaza",
      note: "تحديثات إنسانية دورية؛ الأرقام تتغير باستمرار."
    },
    ochaOpt: {
      label: "مكتب تنسيق الشؤون الإنسانية — الأرض الفلسطينية المحتلة",
      url: "https://www.ochaopt.org/",
      note: "تقارير عن الحماية والوصول والاحتياجات الإنسانية."
    },
    unescoJerusalem: {
      label: "اليونسكو — البلدة القديمة في القدس وأسوارها",
      url: "https://whc.unesco.org/en/list/148",
      note: "إدراج 1981، ثم قائمة التراث المهدد بالخطر 1982."
    },
    unescoJericho: {
      label: "اليونسكو — أريحا القديمة / تل السلطان",
      url: "https://whc.unesco.org/en/list/1687",
      note: "موقع تراث عالمي مُدرج عام 2023."
    },
    unescoBattir: {
      label: "اليونسكو — فلسطين: أرض الزيتون والكروم في بتير",
      url: "https://whc.unesco.org/en/list/1492",
      note: "مشهد ثقافي زراعي مُدرج عام 2014."
    },
    unesoTatreez: {
      label: "اليونسكو — فن التطريز في فلسطين",
      url: "https://ich.unesco.org/en/RL/the-art-of-embroidery-in-palestine-practices-skills-knowledge-and-rituals-01722",
      note: "قائمة التراث الثقافي غير المادي، إدراج 2021."
    },
    icrc: {
      label: "اللجنة الدولية للصليب الأحمر — إسرائيل والأراضي المحتلة",
      url: "https://www.icrc.org/en/where-we-work/israel-and-occupied-territories",
      note: "القانون الدولي الإنساني وحماية المدنيين."
    },
    blBalfour: {
      label: "المكتبة البريطانية — وعد بلفور",
      url: "https://www.bl.uk/collection-items/balfour-declaration",
      note: "الوثيقة الأصلية وتاريخها، 2 تشرين الثاني/نوفمبر 1917."
    },
    metDress: {
      label: "متحف المتروبوليتان — ثوب رام الله",
      url: "https://www.metmuseum.org/art/collection/search/82693",
      note: "ثوب قرية من رام الله، القرن التاسع عشر."
    }
  };

  /* ------------------------------------------------------------------------
     Image credits
     Author, license and Commons page for every photograph used on the site.
     ------------------------------------------------------------------------ */

  const IMAGE_CREDITS = {
    "intro/olive-harvest-2015.jpg": {
      title: "Palestinian farmers harvesting olives, November 2015",
      author: "TrickyH",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Palestinian_farmers_harvesting_olives,_November_2015.jpg",
      note: "مزارعون في منطقة جنين، تشرين الثاني/نوفمبر 2015."
    },
    "geography/jericho-panorama.jpg": {
      title: "Jericho from Tell es-Sultan 03",
      author: "Davide Mauro",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Jericho_from_Tell_es-Sultan_03.jpg",
      note: "سهل أريحا من تل السلطان."
    },
    "geography/nablus-old-city.jpg": {
      title: "Nablus old city 5",
      author: "Mohammad Hijjawi",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Nablus_old_city_5.jpg",
      note: "زقاق في البلدة القديمة في نابلس."
    },
    "geography/acre-coast.jpg": {
      title: "A view of Acre from the sea",
      author: "Shlomo Roded (שלמה רודד)",
      license: "CC BY 2.5",
      licenseUrl: "https://creativecommons.org/licenses/by/2.5",
      pageUrl: "https://commons.wikimedia.org/wiki/File:117143_a_view_of_acre_from_the_sea_PikiWiki_Israel.jpg",
      note: "مدينة عكا من البحر."
    },
    "jerusalem/dome-of-the-rock.jpg": {
      title: "Jerusalem Dome of the rock BW 14",
      author: "Berthold Werner",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Jerusalem_Dome_of_the_rock_BW_14.JPG",
      note: "قبة الصخرة من فوق أسطح البلدة القديمة."
    },
    "history/tell-es-sultan.jpg": {
      title: "Tell es-Sultan, Jericho, Palestine2",
      author: "Diego Delso",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Tell_es-Sultan,_Jericho,_Palestine2.jpg",
      note: "تل السلطان في أريحا."
    },
    "history/sebastia-colonnade.jpg": {
      title: "Part of the colonnade which once encircled Samaria",
      author: "Scan by NYPL (New York Public Library)",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Part_of_the_colonnade_which_once_encircled_Samaria._On_the_south_side,_near_to_the_west_end,_a_great_number_of_columns_are_still_standing_(NYPL_b10607452-80417).jpg",
      note: "صورة أرشيفية لأعمدة سبسطية."
    },
    "ottoman/watermelon-market-1900.jpg": {
      title: "Watermelon market. Jerusalem. approximately 1900 to 1920",
      author: "American Colony (Jerusalem). Photo Dept.",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Watermelon_market._Jerusalem._approximately_1900_to_1920._matpc.05613.II.jpg",
      note: "سوق البطيخ في القدس، نحو 1900–1920."
    },
    "ottoman/jaffa-gate-1900.jpg": {
      title: "Jerusalem Jaffator um 1900",
      author: "مؤلف غير معروف",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Jerusalem_Jaffator_um_1900.jpg",
      note: "باب الخليل (باب يافا) في القدس، نحو 1900."
    },
    "mandate/mandate-police-1947.jpg": {
      title: "British Mandate of Palestine-1947",
      author: "Hans Pinn",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:British_Mandate_of_Palestine-1947.jpg",
      note: "شرطي بريطاني يفحص أوراق المارة في القدس، 1947."
    },
    "mandate/balfour-declaration.jpg": {
      title: "Balfour declaration unmarked",
      author: "Government of the United Kingdom",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Balfour_declaration_unmarked.jpg",
      note: "نسخة من وعد بلفور، 2 تشرين الثاني/نوفمبر 1917."
    },
    "mandate/jaffa-boats-1930s.jpg": {
      title: "Jaffa. Moored boats",
      author: "مؤلف غير معروف",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Jaffa._Moored_boats.jpg",
      note: "قوارب راسية في ميناء يافا، الثلاثينيات."
    },
    "partition/un-partition-plan-1947-ar.png": {
      title: "UN Partition Plan For Palestine 1947 Arabic",
      author: "Drork / Wikimedia Commons",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:UN_Partition_Plan_For_Palestine_1947_Arabic.png",
      note: "خريطة تاريخية عربية لخطة التقسيم 1947، وليست خريطة الوضع الحالي."
    },
    "nakba/fleeing-jaffa-1948.jpg": {
      title: "Palestinians fleeing Jaffa 1948",
      author: "UN Archives — photographer unknown",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Palestinians_fleeing_Jaffa_1948.jpg",
      note: "لاجئون يغادرون يافا، 1948."
    },
    "nakba/jericho-schools-1948.jpg": {
      title: "After the exodus (Nakba), the first school classes in Jericho were held in the open air",
      author: "UNRWA Archive — photographer unknown",
      license: "CC BY-SA 3.0 IGO",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/igo/deed.en",
      pageUrl: "https://commons.wikimedia.org/wiki/File:After_the_exodus_(Nakba),_the_first_school_classes_in_Jericho_were_held_in_the_open_air.jpg",
      note: "صفوف في الهواء الطلق في أريحا بعد النكبة."
    },
    "refugees/ein-el-hilweh-camp.jpg": {
      title: "Palestinian refugees in Ein El Hilweh refugee camp in Lebanon",
      author: "Myrtle Winter Chaumeny / UNRWA",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Palestinian_refugees_in_Ein_El_Hilweh_refugee_camp_in_Lebanon.jpg",
      note: "مخيم عين الحلوة في لبنان، صورة أرشيفية يُعتقد أنها من 1948."
    },
    "refugees/refugee-girl-sidon.jpg": {
      title: "A Palestine refugee girl carries her sleeping baby sister in the newly formed Mia Mia camp, near Sidon, Lebanon",
      author: "UNRWA Archive — photographer unknown",
      license: "CC BY-SA 3.0 IGO",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/igo/deed.en",
      pageUrl: "https://commons.wikimedia.org/wiki/File:A_Palestine_refugee_girl_carries_her_sleeping_baby_sister_in_the_newly_formed_Mia_Mia_camp,_near_the_ancient_port_of_Sidon,_Lebanon.jpg",
      note: "مخيم المية مية قرب صيدا، لبنان."
    },
    "1967/six-day-war-map.jpg": {
      title: "1967 Six Day War — The Jordan salient",
      author: "U.S. Military Academy, Department of History",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:1967_Six_Day_War_-_The_Jordan_salient.jpg",
      note: "خريطة تاريخية للجبهة الأردنية، بالإنجليزية."
    },
    "occupation/abu-dis-barrier.jpg": {
      title: "Israeli West Bank barrier, Abu Dis 1",
      author: "Mohammad Hijjawi",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Israeli_West_Bank_barrier,_Abu_Dis_1.jpg",
      note: "الجدار عند أبو ديس، الضفة الغربية."
    },
    "national-movement/arafat-un.jpg": {
      title: "Yasser Arafat, ds.03056",
      author: "Bernard Gotfryd / Library of Congress",
      license: "Public domain / ملك عام",
      licenseUrl: "",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Yasser_Arafat,_ds.03056.jpg",
      note: "ياسر عرفات متحدثًا في الأمم المتحدة."
    },
    "gaza/gaza-beach.jpg": {
      title: "Gaza Beach 9.8.2010 27",
      author: "Gisha.org / Mohammed Yousif Azaiza",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Gaza_Beach_9.8.2010_27.jpg",
      note: "عائلات على شاطئ غزة، 2010."
    },
    "gaza/gaza-harbor-2007.jpg": {
      title: "2007 Gaza — 5323908000",
      author: "Marcin Monko",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:2007_Gaza_-_5323908000.jpg",
      note: "مرفأ غزة وقوارب الصيد، 2007."
    },
    "gaza/unrwa-shelter-2025.jpg": {
      title: "UNRWA staff member comforts a distressed child at a school shelter in Nuseirat camp, Gaza Strip",
      author: "Ashraf Amra / UNRWA",
      license: "CC BY-SA 3.0 IGO",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/igo/deed.en",
      pageUrl: "https://commons.wikimedia.org/wiki/File:UNRWA_staff_member_comforts_a_distressed_child_at_a_school_shelter_in_Nuseirat_camp,_Gaza_Strip.jpg",
      note: "مخيم النصيرات، صورة من أرشيف الأونروا نُشرت في آذار/مارس 2025."
    },
    "heritage/embroidery-detail.jpg": {
      title: "A hand Palestinian embroidery",
      author: "Aseel zm",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:A_hand_Palestinian_embroidery.jpg",
      note: "تطريز يدوي من الخليل."
    },
    "heritage/ramallah-dress.jpg": {
      title: "Ramallah Dress (Palestinian Thobe)-2",
      author: "The Metropolitan Museum of Art",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Ramallah_Dress_(Palestinian_Thobe)-2.jpg",
      note: "ثوب قرية من رام الله، القرن التاسع عشر."
    },
    "heritage/keffiyeh-loom.jpg": {
      title: "Palestinian keffiyeh loom",
      author: "TrickyH",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Palestinian_keffiyeh_loom.jpg",
      note: "نول الكوفية في مصنع حرباوي، الخليل."
    },
    "heritage/dabke.jpg": {
      title: "Palestinian girls dancing traditional Dabke",
      author: "Sarah Canbel",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Palestinian_girls_dancing_traditional_Dabke.jpg",
      note: "دبكة فلسطينية."
    },
    "heritage/maqluba.jpg": {
      title: "Maqloubeh",
      author: "Nasib Bitar",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Maqloubeh.JPG",
      note: "المقلوبة مع اللبن والسلطة."
    },
    "heritage/pottery-workshop.jpg": {
      title: "Palestinian Pottery workshop, Nablus Road, Jerusalem",
      author: "Neshan Balian / Nbalian",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Palestinian_Pottery_workshop,_Nablus_Road,_Jerusalem.jpg",
      note: "ورشة الفخار الفلسطيني في القدس، تأسست 1922."
    },
    "ending/tubas-sunset.jpg": {
      title: "طوباس — منطقة عينون",
      author: "Abdallah Khader",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:%D8%B7%D9%88%D8%A8%D8%A7%D8%B3_%D9%85%D9%86%D8%B7%D9%82%D8%A9_%D8%B9%D9%8A%D9%86%D9%88%D9%86%D9%A4.jpg",
      note: "غروب في منطقة طوباس."
    }
  };

  /* ------------------------------------------------------------------------
     Chapter documentation
     ------------------------------------------------------------------------ */

  const CHAPTERS = [
    {
      title: "المقدمة",
      summary:
        "مدخل بصري إلى فلسطين بوصفها أرضًا وشعبًا وذاكرة. لا تحاول هذه الرحلة اختزال الحكاية في خبر واحد، بل تقترب من جغرافيا المكان وتاريخه ومن ثقافة أهله وحياتهم اليومية.",
      notes:
        "الصور المستخدمة فوتوغرافية وموثقة. تواريخ الصور الأرشيفية تقريبية حيث يذكر المصدر ذلك، والخرائط التاريخية لا تمثل الوضع الحالي.",
      sources: [S.unispalHistory, S.unrwaRefugees],
      images: ["intro/olive-harvest-2015.jpg"]
    },
    {
      title: "الأرض",
      summary:
        "بين البحر المتوسط غربًا ونهر الأردن شرقًا، تتوزع بيئات متنوعة: سهل ساحلي، وجبال وسطى، وغور وأودية، وبادية في الجنوب. هذا التنوع شكّل الزراعة والقرى والمدن وطرق الحياة عبر أجيال.",
      notes:
        "خريطة الموقع في هذا المشهد رسم توضيحي مصمم للمشروع، وليست خريطة سياسية ولا تمثل حدودًا دولية.",
      sources: [S.unescoJericho, S.unescoBattir],
      images: [
        "geography/jericho-panorama.jpg",
        "geography/nablus-old-city.jpg",
        "geography/acre-coast.jpg"
      ]
    },
    {
      title: "القدس",
      summary:
        "القدس مدينة ذات تاريخ طويل، تحتضن في بلدتها القديمة وأسوارها مواقع مقدسة لدى المسلمين والمسيحيين واليهود. أدرجت اليونسكو البلدة القديمة وأسوارها على قائمة التراث العالمي عام 1981، ثم على قائمة التراث المهدد بالخطر عام 1982.",
      notes:
        "تظل قضايا الوضع النهائي للقدس موضع خلاف سياسي دولي؛ يعرض هذا المشهد البعد الحضاري والديني والثقافي للمدينة.",
      sources: [S.unescoJerusalem, S.unispalHistory],
      images: ["jerusalem/dome-of-the-rock.jpg"]
    },
    {
      title: "التاريخ",
      summary:
        "فلسطين أرض تحمل طبقات من التاريخ: مواقع كنعانية ورومانية وبيزنطية وإسلامية وعثمانية. في أريحا، يُعدّ تل السلطان من أقدم المواقع المأهولة في العالم، وقد أُدرج على قائمة التراث العالمي عام 2023.",
      notes:
        "الآثار لا تروي حضارة واحدة، بل تعاقبًا طويلًا من الاستيطان والحكم والتبادل الثقافي.",
      sources: [S.unescoJericho, S.unispalHistory],
      images: ["history/tell-es-sultan.jpg", "history/sebastia-colonnade.jpg"]
    },
    {
      title: "العهد العثماني",
      summary:
        "بين 1517 و1917 كانت فلسطين جزءًا من الدولة العثمانية. تشكّلت خلال هذه القرون حياة مدينية وريفية ارتبطت بالزراعة والأسواق والحرف، وكان الزيتون والصابون والتجارة جزءًا من الاقتصاد المحلي.",
      notes:
        "الصور من أرشيف American Colony في القدس، وتواريخها التقريبية كما وردت في المصدر. لا تعكس الصورة الواحدة تنوع الحياة في فترة كاملة.",
      sources: [S.unispalHistory, S.blBalfour],
      images: ["ottoman/watermelon-market-1900.jpg", "ottoman/jaffa-gate-1900.jpg"]
    },
    {
      title: "الانتداب",
      summary:
        "بعد الحرب العالمية الأولى، أقرّت عصبة الأمم الانتداب البريطاني على فلسطين عام 1922. شهدت الفترة وعد بلفور عام 1917، والهجرة الصهيونية، وتصاعد الحركة الوطنية الفلسطينية، وثورة 1936–1939، وصولًا إلى قرار التقسيم عام 1947.",
      notes:
        "وعد بلفور وثيقة بريطانية صادرة في 2 تشرين الثاني/نوفمبر 1917، وليست قرارًا أمميًا. صور الأرشيف توثق الحياة اليومية والوجود البريطاني في تلك الفترة.",
      sources: [S.blBalfour, S.unispalHistory, S.res181],
      images: [
        "mandate/mandate-police-1947.jpg",
        "mandate/balfour-declaration.jpg",
        "mandate/jaffa-boats-1930s.jpg"
      ]
    },
    {
      title: "التقسيم",
      summary:
        "في 29 تشرين الثاني/نوفمبر 1947، أصدرت الجمعية العامة للأمم المتحدة القرار 181، متضمنًا توصية بتقسيم فلسطين إلى دولتين عربية ويهودية، مع نظام دولي خاص للقدس. صوّت 33 عضوًا مع القرار، و13 ضده، وامتنع 10.",
      notes:
        "قبلت الوكالة اليهودية الخطة، ورفضها الجانب العربي. لم تُنفَّذ خطة القدس الدولية، ودخلت المنطقة مسار الحرب بعد القرار. الخريطة المعروضة وثيقة تاريخية من 1947 وليست خريطة الوضع الحالي.",
      sources: [S.res181, S.unispalHistory],
      images: ["partition/un-partition-plan-1947-ar.png"]
    },
    {
      title: "النكبة",
      summary:
        "خلال حرب 1947–1949، شهد الفلسطينيون تهجيرًا واسعًا وفقدانًا للمنازل والأراضي والقرى، وأصبح مئات الآلاف لاجئين. تشير الأونروا إلى نزوح أكثر من 700 ألف فلسطيني بين نيسان/أبريل وآب/أغسطس 1948.",
      notes:
        "لا تُعرض في هذا المشهد صور جسدية أو مشاهد دموية. المفتاح في المشهد رمز للذاكرة والعودة، وليس دليلًا ماديًا على ملكية كل عائلة.",
      sources: [S.unrwaRefugees, S.unispalHistory],
      images: ["nakba/fleeing-jaffa-1948.jpg", "nakba/jericho-schools-1948.jpg"]
    },
    {
      title: "اللجوء",
      summary:
        "امتدت تجربة اللجوء الفلسطيني عبر أجيال وفي بلدان متعددة. تسجل الأونروا نحو 5.9 مليون لاجئ فلسطيني، يعيش نحو ثلثهم في 58 مخيمًا معترفًا به، بينما يحمل كثيرون ذاكرة البيوت والقرى التي تركوها.",
      notes:
        "الأرقام المذكورة هي أرقام اللاجئين المسجلين لدى الأونروا، وليست إحصاءً لكل الفلسطينيين. خريطة أقاليم العمليات رسم توضيحي، ولا تمثل أعدادًا أو حدودًا سياسية.",
      sources: [S.unrwaRefugees, S.unrwaGaza],
      images: ["refugees/ein-el-hilweh-camp.jpg", "refugees/refugee-girl-sidon.jpg"]
    },
    {
      title: "حرب 1967",
      summary:
        "في يونيو 1967، خاضت إسرائيل حربًا ضد مصر وسوريا والأردن، واحتلت خلالها الضفة الغربية بما فيها القدس الشرقية وقطاع غزة، إضافة إلى سيناء والجولان. صدر قرار مجلس الأمن 242 في 22 تشرين الثاني/نوفمبر 1967، مؤكدًا مبدأ عدم جواز الاستيلاء على الأرض بالقوة.",
      notes:
        "خريطة المشهد وثيقة تاريخية إنجليزية للجبهة الأردنية، وتوضح محاور القتال لا الحدود الحالية. لا تُستخدم الخريطة لتحديد وضع قانوني أو سياسي معاصر.",
      sources: [S.res242, S.unispalHistory],
      images: ["1967/six-day-war-map.jpg"]
    },
    {
      title: "الاحتلال",
      summary:
        "منذ 1967، أثّرت سياسات الاحتلال والاستيطان والقيود على الحركة والحواجز وجدار الفصل ومصادرة الأراضي في حياة الفلسطينيين ووصولهم إلى التعليم والعمل والخدمات. ويُعدّ القانون الدولي الإنساني المستوطنات في الأراضي المحتلة غير قانونية.",
      notes:
        "يستخدم المشهد تعبير «جدار الفصل» الشائع في التقارير الدولية؛ وتصفه إسرائيل بأنه جدار أمني. الصورة توثق الجدار عند أبو ديس ولا تعرض مشاهد عنف.",
      sources: [S.icrc, S.ochaOpt],
      images: ["occupation/abu-dis-barrier.jpg"]
    },
    {
      title: "النضال الوطني",
      summary:
        "شهد التاريخ الفلسطيني محطات متعددة من العمل الوطني والسياسي والشعبي: تأسيس منظمة التحرير الفلسطينية عام 1964، والانتفاضة الأولى عام 1987، وإعلان الاستقلال عام 1988، واتفاقيات أوسلو عام 1993، والانتفاضة الثانية عام 2000.",
      notes:
        "هذه محطات أساسية وليست سردًا كاملًا. تختلف القراءات السياسية لتلك الأحداث، بينما تواريخ المحطات الأساسية موثقة في وثائق الأمم المتحدة.",
      sources: [S.oslo, S.unispalHistory],
      images: ["national-movement/arafat-un.jpg"]
    },
    {
      title: "غزة",
      summary:
        "غزة ليست خبرًا عابرًا أو رقمًا؛ إنها مجتمع له ذاكرة وثقافة وعائلات وبيوت ومدارس وأسواق. واجه سكانها حصارًا وحروبًا وأزمات إنسانية متعاقبة، بلغت مستويات كارثية خلال الحرب الأخيرة.",
      notes:
        "لا يعرض هذا المشهد أرقام ضحايا أو نازحين ثابتة لأنها تتغير. للاطلاع على الأرقام المحدثة تُستخدم تقارير OCHA والأونروا، وآخر مراجعة للنص: نوفمبر 2026.",
      sources: [S.ochaGaza, S.unrwaGaza, S.icrc],
      images: [
        "gaza/gaza-beach.jpg",
        "gaza/gaza-harbor-2007.jpg",
        "gaza/unrwa-shelter-2025.jpg"
      ]
    },
    {
      title: "الهوية والتراث",
      summary:
        "تعيش فلسطين في تفاصيلها اليومية: التطريز والدبكة والموسيقى والمطبخ الشعبي وأشجار الزيتون والحرف والقصائد. أُدرج فن التطريز الفلسطيني على قائمة التراث الثقافي غير المادي لليونسكو عام 2021، كما أُدرج مشهد بتير الزراعي عام 2014.",
      notes:
        "الثقافة الفلسطينية حيّة ومتنوعة، ولا تُختزل في رمز واحد. الصور توثق تفاصيل من التطريز واللباس والكوفية والدبكة والمطبخ والفخار.",
      sources: [S.unescoTatreez, S.unescoBattir, S.metDress],
      images: [
        "heritage/embroidery-detail.jpg",
        "heritage/ramallah-dress.jpg",
        "heritage/keffiyeh-loom.jpg",
        "heritage/dabke.jpg",
        "heritage/maqluba.jpg",
        "heritage/pottery-workshop.jpg"
      ]
    },
    {
      title: "الخاتمة",
      summary:
        "قد تتغير الأماكن، وتمر السنوات، لكن الحكايات التي تسكن الذاكرة لا تنتهي. تبقى فلسطين أرضًا وذاكرة وهوية وثقافة وإنسانًا، وتبقى الحكاية مفتوحة على من يحملها بعدنا.",
      notes:
        "هذا المشهد خاتمة تحريرية وليس استنتاجًا سياسيًا. تعود المصادر الأساسية إلى وثائق الأمم المتحدة والأونروا واليونسكو واللجنة الدولية للصليب الأحمر.",
      sources: [S.unispalHistory, S.unrwaRefugees],
      images: ["ending/tubas-sunset.jpg"]
    }
  ];

  /* ------------------------------------------------------------------------
     Deck
     ------------------------------------------------------------------------ */

  function parseHash() {
    const match = window.location.hash.match(/^#s(\d{1,2})$/);
    if (!match) return null;
    const value = Number(match[1]) - 1;
    return value >= 0 && value < total ? value : null;
  }

  function buildDots() {
    if (!els.railDots) return;
    const fragment = document.createDocumentFragment();
    slides.forEach((slide, i) => {
      const chapter = slide.dataset.chapter || "مشهد " + (i + 1);
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rail__dot";
      button.dataset.label = pad2(i + 1) + " · " + chapter;
      button.setAttribute("aria-label", "الانتقال إلى المشهد " + (i + 1) + ": " + chapter);
      button.addEventListener("click", () => goTo(i));
      item.appendChild(button);
      fragment.appendChild(item);
      dots.push(button);
    });
    els.railDots.appendChild(fragment);
  }

  function updateInterface() {
    const current = index + 1;
    if (els.countCurrent) els.countCurrent.textContent = pad2(current);
    if (els.railCurrent) els.railCurrent.textContent = pad2(current);
    if (els.railChapter) els.railChapter.textContent = slides[index].dataset.chapter || "";
    if (els.railFill) els.railFill.style.transform = "scaleY(" + (current / total) + ")";

    if (els.prevBtn) els.prevBtn.disabled = index === 0;
    if (els.nextBtn) els.nextBtn.disabled = index === total - 1;

    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });
  }

  function announce() {
    const live = $("#slideAnnouncer");
    if (live) {
      live.textContent = "المشهد " + (index + 1) + " من " + total + ": " + (slides[index].dataset.chapter || "");
    }
  }

  function primeSlide(slide) {
    if (!slide) return;
    $$("img", slide).forEach((image) => {
      if (image.dataset.primed === "1") return;
      image.dataset.primed = "1";
      if (image.loading === "lazy") image.loading = "eager";
      if (!image.complete && typeof image.decode === "function") {
        image.decode().catch(() => {});
      }
    });
  }

  function primeAround(center) {
    [center - 1, center, center + 1, center + 2].forEach((i) => {
      if (i >= 0 && i < total) primeSlide(slides[i]);
    });
  }

  function triggerThread() {
    body.classList.remove("is-shifting");
    void body.offsetWidth;
    body.classList.add("is-shifting");
    window.clearTimeout(shiftTimer);
    shiftTimer = window.setTimeout(() => body.classList.remove("is-shifting"), 900);
  }

  function hideHint() {
    if (els.navHint) els.navHint.classList.add("is-hidden");
    window.clearTimeout(navHintTimer);
  }

  function showHint() {
    if (!els.navHint) return;
    els.navHint.classList.remove("is-hidden");
    window.clearTimeout(navHintTimer);
    navHintTimer = window.setTimeout(hideHint, 7000);
  }

  function goTo(target, options) {
    const settings = options || {};
    if (typeof target !== "number" || Number.isNaN(target)) return;
    target = Math.max(0, Math.min(total - 1, target));
    if (target === index && !settings.force) return;

    const previous = slides[index];
    const next = slides[target];
    const focusWasInside = previous.contains(document.activeElement);

    previous.classList.remove("is-active");
    previous.classList.add("is-leaving");
    previous.setAttribute("aria-hidden", "true");
    previous.setAttribute("inert", "");
    window.setTimeout(() => previous.classList.remove("is-leaving"), 1000);

    next.classList.remove("is-leaving");
    next.removeAttribute("inert");
    next.removeAttribute("aria-hidden");
    next.classList.remove("is-active");
    void next.offsetWidth;
    next.classList.add("is-active");

    const inner = $(".slide__inner", next);
    if (inner) inner.scrollTop = 0;

    index = target;
    updateInterface();
    primeAround(index);
    triggerThread();
    announce();

    if (settings.hash !== false) {
      try {
        window.history.replaceState(null, "", "#s" + (index + 1));
      } catch (error) {
        /* file:// or restricted history — navigation still works */
      }
    }

    if (!settings.keepHint) hideHint();

    if (focusWasInside) {
      const heading = next.querySelector("h1, h2");
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    }
  }

  function initDeck() {
    buildDots();
    const fromHash = parseHash();
    if (fromHash !== null) index = fromHash;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      if (active) {
        slide.removeAttribute("aria-hidden");
        slide.removeAttribute("inert");
      } else {
        slide.setAttribute("aria-hidden", "true");
        slide.setAttribute("inert", "");
      }
    });

    updateInterface();
    primeAround(index);
  }

  /* ------------------------------------------------------------------------
     Dialogs
     ------------------------------------------------------------------------ */

  function openDialog(dialog, trigger) {
    if (!dialog) return;
    const alreadyOpen = document.querySelector("dialog[open]");
    if (alreadyOpen && alreadyOpen !== dialog) {
      if (typeof alreadyOpen.close === "function") alreadyOpen.close();
      else alreadyOpen.removeAttribute("open");
    }
    dialog._returnFocus = trigger || document.activeElement;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    body.classList.add("has-dialog");
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function imageCreditItem(file) {
    const credit = IMAGE_CREDITS[file];
    if (!credit) return "";
    const license = credit.licenseUrl
      ? externalLink(credit.licenseUrl, credit.license)
      : esc(credit.license);
    return (
      "<li>" +
        "<b>" + esc(credit.author) + "</b>" +
        "<small><bdi>" + esc(credit.title) + "</bdi></small>" +
        "<small>" + license + " · " + externalLink(credit.pageUrl, "صفحة الصورة على ويكيميديا كومنز") + "</small>" +
        (credit.note ? "<small>" + esc(credit.note) + "</small>" : "") +
      "</li>"
    );
  }

  function buildChapterBody(chapter) {
    const sources = chapter.sources.map((source) =>
      "<li>" + externalLink(source.url, source.label) +
        (source.note ? "<span>" + esc(source.note) + "</span>" : "") +
      "</li>"
    ).join("");

    const images = chapter.images.map(imageCreditItem).join("");

    return (
      "<p>" + esc(chapter.summary) + "</p>" +
      (chapter.notes ? '<p class="dialog-note">' + esc(chapter.notes) + "</p>" : "") +
      '<section class="dialog-section"><h3>المصادر</h3><ul class="source-list">' + sources + "</ul></section>" +
      '<section class="dialog-section"><h3>صور المشهد وحقوقها</h3><ul class="image-credit-list">' + images + "</ul></section>" +
      '<p class="dialog-signature">من صنع <b>ملك عبدالسلام زايدة</b> · آخر مراجعة للنص: نوفمبر 2026</p>'
    );
  }

  function openChapter(chapterIndex, trigger) {
    const chapter = CHAPTERS[chapterIndex];
    if (!chapter) return;
    const kicker = "المصادر والصور · مشهد " + pad2(chapterIndex + 1);
    if (els.chapterKicker) els.chapterKicker.textContent = kicker;
    if (els.chapterDialogTitle) els.chapterDialogTitle.textContent = chapter.title;
    if (els.chapterDialogBody) els.chapterDialogBody.innerHTML = buildChapterBody(chapter);
    openDialog(els.chapterDialog, trigger);
  }

  function buildCreditsBody() {
    const groups = CHAPTERS.map((chapter, i) => {
      if (!chapter.images.length) return "";
      return (
        '<div class="credit-group">' +
          "<h4>" + pad2(i + 1) + " · " + esc(chapter.title) + "</h4>" +
          '<ul class="image-credit-list">' + chapter.images.map(imageCreditItem).join("") + "</ul>" +
        "</div>"
      );
    }).join("");

    const coreSources = [S.unispalHistory, S.res181, S.res242, S.oslo, S.unrwaRefugees, S.unrwaGaza,
      S.ochaGaza, S.ochaOpt, S.unescoJerusalem, S.unescoJericho, S.unescoBattir, S.unescoTatreez,
      S.icrc, S.blBalfour, S.metDress];

    return (
      '<section class="dialog-section">' +
        "<h3>عن المشروع</h3>" +
        "<p>«فلسطين | حكاية لا تنتهي» تجربة وثائقية تفاعلية من خمسة عشر مشهدًا، تحاول الجمع بين الصورة والتاريخ والذاكرة والثقافة في نص عربي موجز. صُممت التجربة لتعمل من دون خادم أو مكتبات خارجية، وكل الصور والخطوط مستضافة محليًا.</p>" +
      "</section>" +
      '<section class="dialog-section">' +
        "<h3>المنهجية والتحقق</h3>" +
        "<p>تعتمد النصوص على وثائق الأمم المتحدة والأونروا واليونسكو واللجنة الدولية للصليب الأحمر والمكتبة البريطانية ومتحف المتروبوليتان. تمت مراجعة الروابط في نوفمبر 2026، وتجنب عرض أرقام ضحايا أو نازحين متغيرة داخل المشاهد.</p>" +
        '<p class="dialog-note">الخرائط التاريخية (1947 و1967) وثائق أرشيفية وليست خرائط للوضع الحالي. خريطة الموقع وخريطة أقاليم الأونروا رسمان توضيحيان صُمما للمشروع، ولا يمثلان حدودًا سياسية. لا يحتوي المشروع على صور مولّدة بالذكاء الاصطناعي.</p>' +
      "</section>" +
      '<section class="dialog-section">' +
        "<h3>الموسيقى</h3>" +
        "<p>لا يُضمَّن أي تسجيل صوتي محمي داخل المشروع. تبدأ الموسيقى فقط عند ضغط «ابدأ الحكاية»، ثم تستمر في حلقة متواصلة أثناء التنقل بين المشاهد، مع زر صغير لكتم الصوت. لإضافة الأغنية ضع ملفًا باسم <code dir=\"ltr\">palestine-song.mp3</code> داخل <code dir=\"ltr\">assets/audio/</code>؛ وإن لم يكن موجودًا يعمل الموقع بصمت من دون أي أخطاء.</p>" +
      "</section>" +
      '<section class="dialog-section">' +
        "<h3>الخطوط والتقنيات</h3>" +
        "<p>الخط المستخدم هو IBM Plex Sans Arabic، بترخيص SIL Open Font License، مع نسخ محلية من الأوزان 300–700. بُني الموقع بـ HTML وCSS وJavaScript فقط، ولا يستخدم أدوات تتبع أو طلبات خارجية أثناء التشغيل.</p>" +
      "</section>" +
      '<section class="dialog-section"><h3>المصادر الأساسية</h3><ul class="source-list">' +
        coreSources.map((source) =>
          "<li>" + externalLink(source.url, source.label) +
            (source.note ? "<span>" + esc(source.note) + "</span>" : "") +
          "</li>"
        ).join("") +
      "</ul></section>" +
      '<section class="dialog-section"><h3>حقوق الصور</h3>' +
        "<p>الصور من ويكيميديا كومنز، مع ذكر المؤلف والترخيص ورابط الصفحة الأصلية لكل صورة. جرى تصغير نسخ العرض لأغراض الأداء فقط. الحقوق تبقى لأصحابها وفق تراخيص كل صورة.</p>" +
        groups +
      "</section>" +
      '<p class="dialog-signature">من صنع <b>ملك عبدالسلام زايدة</b> · آخر مراجعة: نوفمبر 2026</p>'
    );
  }

  function openCredits(trigger) {
    if (els.creditsDialogBody) els.creditsDialogBody.innerHTML = buildCreditsBody();
    openDialog(els.creditsDialog, trigger);
  }

  function bindDialogs() {
    $$("dialog").forEach((dialog) => {
      $$("[data-close]", dialog).forEach((button) => {
        button.addEventListener("click", () => closeDialog(dialog));
      });
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
      dialog.addEventListener("close", () => {
        if (!document.querySelector("dialog[open]")) body.classList.remove("has-dialog");
        const returnFocus = dialog._returnFocus;
        if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === "function") {
          returnFocus.focus({ preventScroll: true });
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Music — one looping track, started by the intro call to action
     ------------------------------------------------------------------------ */

  const SONG_SRC = "assets/audio/palestine-song.mp3";
  const POSITION_KEY = "palestine-story-song-position";
  const START_VOLUME = 0.3;
  let musicStarted = false;
  let musicUnavailable = false;
  let lastPositionSave = 0;

  function updateMuteUI() {
    if (!els.muteToggle) return;
    const silent = els.audio.muted || els.audio.volume === 0;
    const use = $("use", els.muteToggle);
    if (use) use.setAttribute("href", silent ? "#i-volume-off" : "#i-volume");
    els.muteToggle.classList.toggle("is-muted", silent);
    els.muteToggle.setAttribute("aria-pressed", silent ? "true" : "false");
    els.muteToggle.setAttribute("aria-label", silent ? "إعادة صوت الموسيقى" : "كتم صوت الموسيقى");
    els.muteToggle.title = silent ? "إعادة صوت الموسيقى" : "كتم صوت الموسيقى";
  }

  function readSavedPosition() {
    try {
      const saved = Number(window.sessionStorage.getItem(POSITION_KEY));
      return Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch (error) {
      return 0;
    }
  }

  function savePosition() {
    if (!musicStarted) return;
    try {
      window.sessionStorage.setItem(POSITION_KEY, String(els.audio.currentTime || 0));
    } catch (error) {
      /* storage may be unavailable */
    }
  }

  function applySavedPosition() {
    const saved = readSavedPosition();
    if (!saved) return;
    try {
      const duration = els.audio.duration;
      if (!Number.isFinite(duration) || saved < duration - 1) els.audio.currentTime = saved;
    } catch (error) {
      /* seeking is not possible yet */
    }
  }

  // Called by the first click on «ابدأ الحكاية» — a real user gesture, so the
  // browser's autoplay policy is satisfied. Navigation never touches the audio.
  function startMusic() {
    if (musicUnavailable) return;

    els.audio.loop = true;
    els.audio.volume = START_VOLUME;

    if (!musicStarted) {
      musicStarted = true;
      // The MP3 supplied by the author is tried first; the MP4 is a fallback.
      if (!els.audio.querySelector("source")) els.audio.src = SONG_SRC;
      els.audio.preload = "auto";
      els.audio.addEventListener("loadedmetadata", applySavedPosition, { once: true });
    }

    const result = els.audio.play();
    if (result && typeof result.catch === "function") {
      // Missing file, unsupported codec or a blocked gesture: stay silent.
      result.catch(() => { musicUnavailable = true; });
    }
  }

  function toggleMute() {
    const silent = els.audio.muted || els.audio.volume === 0;
    els.audio.muted = !silent;
    if (!els.audio.muted && els.audio.volume === 0) els.audio.volume = START_VOLUME;
    updateMuteUI();
  }

  function initMusic() {
    els.audio.loop = true;
    els.audio.volume = START_VOLUME;

    const startButton = $("#startStory");
    if (startButton) startButton.addEventListener("click", startMusic);

    if (els.muteToggle) els.muteToggle.addEventListener("click", toggleMute);

    els.audio.addEventListener("timeupdate", () => {
      if (els.audio.paused) return;
      const now = Date.now();
      if (now - lastPositionSave < 2000) return;
      lastPositionSave = now;
      savePosition();
    });
    els.audio.addEventListener("pause", savePosition);
    els.audio.addEventListener("ended", () => {
      // Safety net for servers that cannot report a finite duration.
      try { els.audio.currentTime = 0; } catch (error) { /* ignore */ }
      const again = els.audio.play();
      if (again && typeof again.catch === "function") again.catch(() => {});
    });
    els.audio.addEventListener("error", () => { musicUnavailable = true; });
    els.audio.addEventListener("volumechange", updateMuteUI);
    window.addEventListener("pagehide", savePosition);

    updateMuteUI();
  }

  /* ------------------------------------------------------------------------
     Mouse-only trailing lines
     ------------------------------------------------------------------------ */

  function initCursorLines() {
    const canvas = $("#cursor-lines");
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    let enabled = false;
    let points = [];
    let frame = 0;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    const lifetime = 620;

    function resizeCanvas() {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(viewportWidth * ratio);
      canvas.height = Math.round(viewportHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function drawLayer(offsetX, offsetY, strength, width) {
      const now = performance.now();
      for (let i = 1; i < points.length; i += 1) {
        const from = points[i - 1];
        const to = points[i];
        const age = now - to.t;
        if (age >= lifetime) continue;
        const fade = 1 - age / lifetime;
        const alpha = Math.max(0, fade) * strength;
        if (alpha <= 0.008) continue;
        context.strokeStyle = "rgba(139, 57, 53, " + alpha.toFixed(3) + ")";
        context.lineWidth = width * (0.65 + fade * 0.55);
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(from.x + offsetX, from.y + offsetY);
        context.lineTo(to.x + offsetX, to.y + offsetY);
        context.stroke();
      }
    }

    function draw() {
      frame = 0;
      const now = performance.now();
      points = points.filter((point) => now - point.t < lifetime);
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      if (points.length > 1) {
        drawLayer(0, 0, 0.58, 1.35);
        drawLayer(5, -4, 0.24, 0.85);
      }
      if (points.length > 1) frame = window.requestAnimationFrame(draw);
    }

    function pushPoint(x, y) {
      const now = performance.now();
      const last = points[points.length - 1];
      if (last) {
        const distance = Math.hypot(x - last.x, y - last.y);
        if (distance < 1.4 && now - last.t < 18) return;
        if (distance > 28) {
          const steps = Math.ceil(distance / 16);
          for (let step = 1; step < steps; step += 1) {
            points.push({
              x: last.x + ((x - last.x) * step) / steps,
              y: last.y + ((y - last.y) * step) / steps,
              t: now - (steps - step) * 7
            });
          }
        }
      }
      points.push({ x, y, t: now });
      if (points.length > 180) points.splice(0, points.length - 180);
      if (!frame) frame = window.requestAnimationFrame(draw);
    }

    function onPointerMove(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      pushPoint(event.clientX, event.clientY);
    }

    function onPointerLeave() {
      if (points.length > 2) points = points.slice(-2);
    }

    function setEnabled(nextEnabled) {
      if (nextEnabled === enabled) return;
      enabled = nextEnabled;
      if (enabled) {
        canvas.style.display = "";
        resizeCanvas();
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.documentElement.addEventListener("mouseleave", onPointerLeave);
      } else {
        canvas.style.display = "none";
        window.removeEventListener("pointermove", onPointerMove);
        document.documentElement.removeEventListener("mouseleave", onPointerLeave);
        points = [];
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        context.clearRect(0, 0, viewportWidth, viewportHeight);
      }
    }

    function evaluate() {
      setEnabled(finePointer.matches && window.innerWidth > 1024 && !reducedMotion);
    }

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        evaluate();
        if (enabled) resizeCanvas();
      }, 160);
    }, { passive: true });

    if (typeof finePointer.addEventListener === "function") {
      finePointer.addEventListener("change", evaluate);
    }

    if (typeof reduceMotionQuery.addEventListener === "function") {
      reduceMotionQuery.addEventListener("change", (event) => {
        reducedMotion = event.matches;
        evaluate();
      });
    }

    evaluate();
  }

  /* ------------------------------------------------------------------------
     Input bindings
     ------------------------------------------------------------------------ */

  function bindInput() {
    // A short viewport lets the active slide scroll internally. In that case
    // wheel / swipe gestures belong to the content until it reaches an edge.
    function activeScroller() {
      const slide = slides[index];
      if (!slide) return null;
      const inner = $(".slide__inner", slide);
      if (!inner) return null;
      const overflowY = window.getComputedStyle(inner).overflowY;
      if (overflowY !== "auto" && overflowY !== "scroll") return null;
      if (inner.scrollHeight - inner.clientHeight < 3) return null;
      return inner;
    }

    function scrollerCanMove(scroller, direction) {
      if (!scroller) return false;
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (max < 3) return false;
      return direction > 0 ? scroller.scrollTop < max - 2 : scroller.scrollTop > 2;
    }

    if (els.prevBtn) els.prevBtn.addEventListener("click", () => goTo(index - 1));
    if (els.nextBtn) els.nextBtn.addEventListener("click", () => goTo(index + 1));

    document.addEventListener("click", (event) => {
      const goButton = event.target.closest("[data-go]");
      if (goButton) {
        const target = Number(goButton.dataset.go);
        if (!Number.isNaN(target)) goTo(target);
        return;
      }
      const sourceButton = event.target.closest(".js-sources");
      if (sourceButton) {
        openChapter(Number(sourceButton.dataset.chapter) - 1, sourceButton);
      }
    });

    const creditsButton = $("#creditsOpen");
    if (creditsButton) creditsButton.addEventListener("click", () => openCredits(creditsButton));

    document.addEventListener("keydown", (event) => {
      if (anyDialogOpen() || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.repeat) return;

      const inControl = event.target.closest && event.target.closest("button, a, label");
      const isSpace = event.code === "Space" || event.key === " ";
      if (isSpace && inControl) return;

      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
        case "PageDown": {
          const scroller = activeScroller();
          if (scrollerCanMove(scroller, 1)) {
            event.preventDefault();
            const step = event.key === "PageDown" ? scroller.clientHeight * 0.85 : 90;
            scroller.scrollBy({ top: step, behavior: reducedMotion ? "auto" : "smooth" });
            break;
          }
          event.preventDefault();
          goTo(index + 1);
          break;
        }
        case "ArrowUp":
        case "ArrowLeft":
        case "PageUp": {
          const scroller = activeScroller();
          if (scrollerCanMove(scroller, -1)) {
            event.preventDefault();
            const step = event.key === "PageUp" ? scroller.clientHeight * 0.85 : 90;
            scroller.scrollBy({ top: -step, behavior: reducedMotion ? "auto" : "smooth" });
            break;
          }
          event.preventDefault();
          goTo(index - 1);
          break;
        }
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(total - 1);
          break;
        default:
          if (isSpace) {
            const scroller = activeScroller();
            if (scrollerCanMove(scroller, 1)) {
              event.preventDefault();
              scroller.scrollBy({
                top: scroller.clientHeight * 0.85,
                behavior: reducedMotion ? "auto" : "smooth"
              });
              break;
            }
            event.preventDefault();
            goTo(index + 1);
          }
      }
    });

    let wheelTotal = 0;
    let wheelResetTimer = 0;
    let wheelCooldown = 0;
    window.addEventListener("wheel", (event) => {
      if (anyDialogOpen() || event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      if (scrollerCanMove(activeScroller(), direction)) return; // native in-slide scroll

      if (event.cancelable) event.preventDefault();

      const now = performance.now();
      if (now < wheelCooldown) return;

      wheelTotal += event.deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => { wheelTotal = 0; }, 180);

      if (Math.abs(wheelTotal) > 42) {
        wheelTotal = 0;
        wheelCooldown = now + 850;
        goTo(index + direction);
      }
    }, { passive: false });

    let touchStart = null;
    deck.addEventListener("touchstart", (event) => {
      if (anyDialogOpen() || event.touches.length !== 1) {
        touchStart = null;
        return;
      }
      if (event.target.closest("button, a, input, label, select, textarea")) {
        touchStart = null;
        return;
      }
      const touch = event.touches[0];
      const scroller = activeScroller();
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        scrollTop: scroller ? scroller.scrollTop : null
      };
    }, { passive: true });

    deck.addEventListener("touchend", (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      const elapsed = Date.now() - touchStart.time;
      const scroller = activeScroller();
      const scrolledInside = scroller && touchStart.scrollTop !== null &&
        Math.abs(scroller.scrollTop - touchStart.scrollTop) > 4;
      touchStart = null;
      if (elapsed > 900) return;
      if (scrolledInside) return;
      if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      if (dy < 0) goTo(index + 1);
      else goTo(index - 1);
    }, { passive: true });

    const skipLink = $(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (event) => {
        event.preventDefault();
        goTo(0);
        const heading = $("#s1 h1");
        if (heading) {
          if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      });
    }

    window.addEventListener("hashchange", () => {
      const target = parseHash();
      if (target !== null && target !== index) goTo(target, { keepHint: true });
    });

    if (typeof reduceMotionQuery.addEventListener === "function") {
      reduceMotionQuery.addEventListener("change", (event) => {
        reducedMotion = event.matches;
      });
    }
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */

  function markReady() {
    if (body.classList.contains("is-ready")) return;
    body.classList.remove("is-loading");
    body.classList.add("is-ready");

    const active = slides[index];
    if (active) {
      active.classList.remove("is-active");
      void active.offsetWidth;
      active.classList.add("is-active");
    }

    primeAround(index);
    showHint();
  }

  function installLiveRegion() {
    const live = document.createElement("p");
    live.id = "slideAnnouncer";
    live.className = "sr-only";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    body.appendChild(live);
  }

  function init() {
    if (started) return;
    started = true;
    installLiveRegion();
    initDeck();
    initMusic();
    bindDialogs();
    bindInput();
    initCursorLines();

    const heroImage = $("#s1 img");
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const heroReady = heroImage && typeof heroImage.decode === "function"
      ? heroImage.decode().catch(() => {})
      : Promise.resolve();

    Promise.race([Promise.allSettled([fontsReady, heroReady]), wait(1600)])
      .then(() => wait(220))
      .then(markReady);

    // Failsafe: never leave the visitor behind the loading veil.
    window.setTimeout(markReady, 3200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
