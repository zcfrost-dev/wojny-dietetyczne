const rawWars = window.DIET_WARS || [];
const links = window.CONTRADICTION_LINKS || [];
const i18n = window.WD_I18N || { ui: { pl: {}, en: {} }, wars: { en: {} } };
const storagePrefix = "diet-wars:";
const assetVersion = "202605012205";
const pageSeed = Math.floor(Math.random() * 100000);
const params = new URLSearchParams(location.search);
const requestedLang = params.get("lang") || localStorage.getItem(`${storagePrefix}lang`) || "pl";
const currentLang = requestedLang === "en" ? "en" : "pl";
localStorage.setItem(`${storagePrefix}lang`, currentLang);

function t(key) {
  return i18n.ui?.[currentLang]?.[key] || i18n.ui?.pl?.[key] || key;
}

function localizedWar(war) {
  if (currentLang !== "en") return war;
  const translated = i18n.wars?.en?.[war.id];
  return translated ? { ...war, ...translated } : war;
}

const wars = rawWars.map(localizedWar);

function withLangUrl(url) {
  if (currentLang !== "en") return url;
  const [base, hash = ""] = url.split("#");
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}lang=en${hash ? `#${hash}` : ""}`;
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-lang-href]").forEach(link => {
    link.href = withLangUrl(link.getAttribute("href"));
  });
  document.querySelectorAll(".category-nav a").forEach((link, index) => {
    const labels = i18n.ui?.[currentLang]?.categories;
    if (Array.isArray(labels) && labels[index]) link.textContent = labels[index];
  });
}

function initLanguageSwitch() {
  const button = $("#languageToggle");
  if (!button) return;
  button.textContent = currentLang === "en" ? "🌐 PL" : "🌐 EN";
  button.setAttribute("aria-label", currentLang === "en" ? "Przełącz na polski" : "Switch to English");
  button.addEventListener("click", () => {
    const next = currentLang === "en" ? "pl" : "en";
    localStorage.setItem(`${storagePrefix}lang`, next);
    const nextParams = new URLSearchParams(location.search);
    if (next === "en") nextParams.set("lang", "en");
    else nextParams.delete("lang");
    const query = nextParams.toString();
    location.href = `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
  });
}

function imageSrc(path) {
  return path || "";
}

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  const normalized = [];

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    if (Array.isArray(source)) {
      const [name, url] = source;
      if (name && url) normalized.push([name, url]);
      continue;
    }
    if (source && typeof source === "object") {
      const name = source.name || source.title || source.label;
      const url = source.url || source.href || source.link;
      if (name && url) normalized.push([name, url]);
      continue;
    }
    if (typeof source === "string") {
      const next = sources[index + 1];
      if (typeof next === "string" && /^https?:\/\//i.test(next)) {
        normalized.push([source, next]);
        index += 1;
      }
    }
  }

  return normalized;
}

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function slugify(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function seededShuffle(items, seed) {
  const list = [...items];
  let value = seed;
  for (let i = list.length - 1; i > 0; i--) {
    value = (value * 9301 + 49297) % 233280;
    const j = Math.floor((value / 233280) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function dailySeed() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return Number(day) + pageSeed + Number(localStorage.getItem(`${storagePrefix}shuffle`) || 0);
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(`${storagePrefix}${key}`)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
}

function debateScore(war) {
  const comments = getComments(war);
  const points = comments.reduce((result, comment) => {
    const side = comment.side === "b" ? "b" : "a";
    result[side] += Number(comment.likes) || 0;
    return result;
  }, { a: 0, b: 0 });
  const total = points.a + points.b;
  const aPct = total ? Math.round((points.a / total) * 100) : 50;
  const bPct = total ? 100 - aPct : 50;
  const winner = points.a === points.b ? "Remis" : (points.a > points.b ? war.sideA : war.sideB);

  return { ...points, total, aPct, bPct, winner };
}

function discussionCount(war) {
  return getComments(war).reduce((total, comment) => {
    return total + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0);
  }, 0);
}

function scoreTemplate(war, compact = false) {
  const score = debateScore(war);
  return `
    <span class="debate-score ${compact ? "compact" : ""}">
      <span class="winner-label">${score.winner === "Remis" ? t("winnerDraw") : `${t("winnerPrefix")} ${score.winner}`}</span>
      <span class="score-bars" aria-label="${t("scoreAria")}: ${t("for").toLowerCase()} ${score.aPct}%, ${t("against").toLowerCase()} ${score.bPct}%">
        <i class="side-a" style="width:${score.aPct}%"></i>
        <i class="side-b" style="width:${score.bPct}%"></i>
      </span>
      <span class="score-values"><b>${t("for")} ${score.a}</b><b>${t("against")} ${score.b}</b></span>
    </span>
  `;
}

function verdictForWar(war) {
  const generic = {
    pl: {
      risk: "Zależy od dawki i kontekstu",
      known: "Najważniejsze są jakość produktu, częstotliwość i stan zdrowia konkretnej osoby.",
      disputed: "Eksperci różnie ważą badania obserwacyjne, mechanizmy biologiczne i praktykę kliniczną.",
      watch: "Uważaj na porady, które obiecują prostą odpowiedź dla każdego organizmu."
    },
    en: {
      risk: "Depends on dose and context",
      known: "Product quality, frequency and individual health status matter most.",
      disputed: "Experts weigh observational studies, biological mechanisms and clinical practice differently.",
      watch: "Be careful with advice that promises one simple answer for every body."
    }
  };
  const verdicts = {
    "mieso-rak-czy-mit": {
      pl: {
        risk: "Najwyższe przy mięsie przetworzonym",
        known: "Przetworzone mięso jest najczęściej łączone z ryzykiem raka jelita grubego.",
        disputed: "Spór dotyczy głównie świeżego mięsa, dawki, stylu życia i jakości badań.",
        watch: "Nie wrzucaj do jednego worka parówek, boczku i świeżego steku."
      },
      en: {
        risk: "Highest with processed meat",
        known: "Processed meat is most often linked with colorectal cancer risk.",
        disputed: "The debate is mostly about fresh meat, dose, lifestyle and study quality.",
        watch: "Do not put sausages, bacon and fresh steak into one category."
      }
    },
    "tluszcze-czy-weglowodany": {
      pl: {
        risk: "Skrajności są bardziej ryzykowne niż makro",
        known: "Deficyt energii i jakość jedzenia zwykle znaczą więcej niż sama etykieta low-fat lub low-carb.",
        disputed: "Jedni akcentują insulinę i głód, inni kalorie, sytość i trwałość diety.",
        watch: "Dieta, której nie utrzymasz, rzadko wygra po roku."
      },
      en: {
        risk: "Extremes matter more than macros",
        known: "Energy balance and food quality often matter more than the low-fat or low-carb label.",
        disputed: "Some stress insulin and hunger, others calories, satiety and adherence.",
        watch: "A diet you cannot sustain rarely wins after a year."
      }
    },
    "ile-jajek-mozna-zjesc-dziennie": {
      pl: {
        risk: "Indywidualne, szczególnie przy sercu",
        known: "Jajka są odżywcze, ale reakcja cholesterolu nie jest u wszystkich taka sama.",
        disputed: "Spór dotyczy tego, kiedy cholesterol z diety jest praktycznie ważny.",
        watch: "Przy chorobach serca i wysokim LDL nie traktuj cudzych wyników jak własnych."
      },
      en: {
        risk: "Individual, especially for heart risk",
        known: "Eggs are nutrient-dense, but cholesterol response differs between people.",
        disputed: "The dispute is when dietary cholesterol is practically important.",
        watch: "With heart disease or high LDL, do not treat someone else's results as yours."
      }
    },
    "post-przerywany-leczy-czy-niszczy": {
      pl: {
        risk: "Może pomagać, ale nie każdemu",
        known: "Post często działa przez ograniczenie jedzenia i lepszą kontrolę apetytu.",
        disputed: "Mniej jasne są długoterminowe skutki i przewaga nad zwykłym deficytem.",
        watch: "Uważaj przy zaburzeniach odżywiania, ciąży, lekach i chorobach przewlekłych."
      },
      en: {
        risk: "May help, but not everyone",
        known: "Fasting often works by limiting intake and improving appetite control.",
        disputed: "Long-term effects and superiority over regular calorie deficit are less clear.",
        watch: "Be cautious with eating disorders, pregnancy, medication and chronic illness."
      }
    },
    "sol-niszczy-serce-i-naczynia-krwionosne-czy-ratuje-zycie": {
      pl: {
        risk: "Nadmiar szkodzi szczególnie przy ciśnieniu",
        known: "U wielu osób ograniczenie sodu pomaga obniżać ciśnienie tętnicze.",
        disputed: "Spór dotyczy niedoborów, sportu, potliwości i indywidualnej wrażliwości.",
        watch: "Hasło 'sól jest dobra' bez dawki jest tak samo słabe jak 'sól to trucizna'."
      },
      en: {
        risk: "Excess is risky, especially with blood pressure",
        known: "For many people, reducing sodium helps lower blood pressure.",
        disputed: "The dispute involves deficiency, exercise, sweating and individual sensitivity.",
        watch: "'Salt is good' without dose is as weak as 'salt is poison'."
      }
    },
    "deficyt-kaloryczny-wszystko-czy-za-malo": {
      pl: {
        risk: "Prawda biologiczna, ale nie cała praktyka",
        known: "Bez deficytu energii masa ciała zwykle nie spada.",
        disputed: "Spór dotyczy głodu, adaptacji, hormonów i tego, jak ten deficyt utrzymać.",
        watch: "Samo 'jedz mniej' bywa prawdziwe, ale często bezużyteczne bez strategii."
      },
      en: {
        risk: "Biologically true, practically incomplete",
        known: "Without an energy deficit, body weight usually does not drop.",
        disputed: "The dispute is hunger, adaptation, hormones and how to sustain the deficit.",
        watch: "'Eat less' may be true, but often useless without a strategy."
      }
    },
    "keto-na-pewno-odchudza-ale-czy-jest-niebezpieczna-dla-zdrowia": {
      pl: {
        risk: "Skuteczne dla części osób, trudne długoterminowo",
        known: "Keto może szybko obniżać masę i apetyt, zwłaszcza na początku.",
        disputed: "Spór dotyczy trwałości, lipidów, błonnika, niedoborów i interpretacji wyników.",
        watch: "Nie myl szybkiej zmiany wagi z pełnym obrazem zdrowia."
      },
      en: {
        risk: "Effective for some, hard long-term",
        known: "Keto can quickly reduce weight and appetite, especially early on.",
        disputed: "The debate is sustainability, lipids, fiber, deficiencies and interpreting results.",
        watch: "Do not confuse fast weight change with the full health picture."
      }
    },
    "autofagia-przelom-czy-marketing": {
      pl: {
        risk: "Mechanizm prawdziwy, obietnice często przesadzone",
        known: "Autofagia istnieje biologicznie i jest ważna dla komórek.",
        disputed: "Spór dotyczy tego, ile postu u ludzi daje klinicznie mierzalne korzyści.",
        watch: "Nagroda Nobla za mechanizm nie oznacza dowodu na każdą dietetyczną obietnicę."
      },
      en: {
        risk: "Real mechanism, often oversold",
        known: "Autophagy is biologically real and important for cells.",
        disputed: "The dispute is how much fasting in humans produces clinically measurable benefits.",
        watch: "A Nobel Prize for a mechanism is not proof for every diet promise."
      }
    },
    "dieta-dabrowskiej-leczy-czy-szkodzi": {
      pl: {
        risk: "Krótki reset może ukrywać koszt",
        known: "Bardzo niska kaloryczność może dawać szybkie efekty i poprawę samopoczucia.",
        disputed: "Spór dotyczy niedoborów, cukru, białka i tego, co dzieje się po zakończeniu.",
        watch: "Detoks to mocne słowo, które często zastępuje konkretne mechanizmy."
      },
      en: {
        risk: "A short reset may hide a cost",
        known: "Very low calories can produce quick effects and better short-term wellbeing.",
        disputed: "The dispute is deficiencies, sugar, protein and what happens afterwards.",
        watch: "'Detox' is a strong word that often replaces concrete mechanisms."
      }
    },
    "nowy-temat-1778094688005": {
      pl: {
        risk: "Największe przy cukrze płynnym i przetworzonym",
        known: "Cukier łatwo zjeść w nadmiarze, a pełnowartościowe węglowodany działają inaczej niż słodycze.",
        disputed: "Spór dotyczy granicy między cukrem, skrobią i produktami pełnymi błonnika.",
        watch: "Nie stawiaj znaku równości między napojem słodzonym a kaszą, warzywami czy owocem."
      },
      en: {
        risk: "Highest with liquid and processed sugar",
        known: "Sugar is easy to overconsume, while whole-food carbs behave differently from sweets.",
        disputed: "The debate is where sugar, starch and fiber-rich foods should be separated.",
        watch: "Do not equate a sweet drink with groats, vegetables or fruit."
      }
    }
  };
  return verdicts[war.id]?.[currentLang] || verdicts[war.id]?.pl || generic[currentLang] || generic.pl;
}

function cardTemplate(war, size = "normal") {
  const href = withLangUrl(`war.html?id=${encodeURIComponent(war.id)}`);
  const compactScore = size === "rail";
  const score = debateScore(war);
  const commentCount = discussionCount(war);
  const verdict = verdictForWar(war);
  return `
    <a class="topic-card ${size}" href="${href}">
      <span class="thumb"><img src="${imageSrc(war.image)}" alt="" loading="lazy"></span>
      <span class="card-body">
        <span class="badge">${war.badge}</span>
        <strong>${war.title}</strong>
        <span class="kicker">${war.kicker}</span>
        <span class="risk-pill">${t("risk")}: ${verdict.risk}</span>
        ${scoreTemplate(war, compactScore)}
        <span class="scoreline">
          <span>${commentCount} ${t("commentWord")}</span>
          <span>${score.total} ${t("totalVotes")}</span>
        </span>
      </span>
    </a>
  `;
}

function renderHome() {
  const ordered = seededShuffle(wars, dailySeed())
    .sort((a, b) => Math.floor(b.heat / 10) - Math.floor(a.heat / 10));
  const lead = ordered[0];
  const leadVerdict = verdictForWar(lead);
  const leadScore = debateScore(lead);
  const leadCommentCount = discussionCount(lead);
  const leadStory = $("#leadStory");
  if (!leadStory) return;

  leadStory.innerHTML = `
    <a class="lead-link" href="${withLangUrl(`war.html?id=${lead.id}`)}">
      <span class="lead-image"><img src="${imageSrc(lead.image)}" alt=""></span>
      <span class="lead-copy">
        <span class="badge">${lead.badge}</span>
        <h1>${lead.title}</h1>
        <p>${lead.summary}</p>
        <span class="risk-pill inverse">${t("risk")}: ${leadVerdict.risk}</span>
        ${scoreTemplate(lead)}
        <span class="scoreline"><span>${leadCommentCount} ${t("commentWord")}</span><span>${leadScore.total} ${t("totalVotes")}</span></span>
      </span>
    </a>
  `;

  $("#sidePromos").innerHTML = ordered.slice(1, 3).map(item => cardTemplate(item, "underlead")).join("");
  const rankingList = $("#rankingList");
  if (rankingList) {
    rankingList.innerHTML = ordered
      .slice(3, 9)
      .map(item => cardTemplate(item, "rail")).join("");
  }
  $("#tickerItems").innerHTML = ordered.slice(0, 12).map(item => `<a href="${withLangUrl(`war.html?id=${item.id}`)}">${item.title}</a>`).join("");

  let visible = 12;
  const renderGrid = () => {
    $("#topicGrid").innerHTML = ordered.slice(0, visible).map(item => cardTemplate(item)).join("");
    $("#loadMoreBtn").hidden = visible >= ordered.length;
  };
  renderGrid();

  $("#loadMoreBtn").addEventListener("click", () => {
    visible = Math.min(visible + 8, ordered.length);
    renderGrid();
  });

  $("#shuffleBtn").addEventListener("click", () => {
    const current = Number(localStorage.getItem(`${storagePrefix}shuffle`) || 0);
    localStorage.setItem(`${storagePrefix}shuffle`, String(current + 1));
    location.reload();
  });

  renderMap();
}

function renderMap() {
  const canvas = $("#mapCanvas");
  if (!canvas) return;
  const featured = seededShuffle(wars, dailySeed() + 17).slice(0, 14);
  const byId = Object.fromEntries(wars.map(item => [item.id, item]));
  const linkHtml = links.map(([from, to, label]) => {
    const a = byId[from];
    const b = byId[to];
    if (!a || !b) return "";
    return `<a class="map-link" href="${withLangUrl(`war.html?id=${from}`)}"><span>${a.title}</span><em>${label}</em><span>${b.title}</span></a>`;
  }).join("");
  canvas.innerHTML = `
    <div class="map-nodes">
      ${featured.map((item, index) => `
        <a class="map-node tone-${index % 5}" href="${withLangUrl(`war.html?id=${item.id}`)}">
          <strong>${item.tags[0]}</strong>
          <span>${item.sideA} / ${item.sideB}</span>
        </a>
      `).join("")}
    </div>
    <div class="map-links">${linkHtml}</div>
  `;
}

function findCurrentWar() {
  const params = new URLSearchParams(location.search);
  return wars.find(item => item.id === params.get("id")) || wars[0];
}

function getPoll(id) {
  return readJson(`poll:${id}`, { a: 0, b: 0, chosen: null });
}

function renderPoll(war) {
  const poll = getPoll(war.id);
  const total = poll.a + poll.b;
  const aPct = total ? Math.round((poll.a / total) * 100) : 50;
  const bPct = 100 - aPct;
  return `
    <section class="poll-panel">
      <h2>${t("pollTitle")}</h2>
      <div class="poll-actions">
        <button class="poll-button" data-side="a" ${poll.chosen ? "disabled" : ""}>${war.sideA}</button>
        <button class="poll-button" data-side="b" ${poll.chosen ? "disabled" : ""}>${war.sideB}</button>
      </div>
      <div class="poll-bars">
        <div><span>${war.sideA}</span><strong>${aPct}%</strong><i style="width:${aPct}%"></i></div>
        <div><span>${war.sideB}</span><strong>${bPct}%</strong><i style="width:${bPct}%"></i></div>
      </div>
      <p>${total} ${t("localVotes")}</p>
    </section>
  `;
}

function seedCommentsForWar(war) {
  if (Array.isArray(war.seedComments) && war.seedComments.length) {
    return war.seedComments;
  }
  return [
    { id: "seed-a-1", side: "a", author: "Czytelnik", text: "Po tej stronie przekonuje mnie ostrożność: w zdrowiu publicznym nawet niewielkie ryzyko może mieć duże znaczenie, jeśli dotyczy milionów ludzi.", likes: 18 },
    { id: "seed-b-1", side: "b", author: "Analityczna", text: "Po drugiej stronie ważny jest kontekst. Bez rozróżnienia dawki, jakości produktu i stylu życia każdy spór zmienia się w hasło z social mediów.", likes: 12 }
  ];
}

function normalizeReply(reply, index) {
  return {
    id: reply.id || `reply-${index + 1}`,
    author: reply.author || "Czytelnik",
    text: reply.text || "",
    likes: Number(reply.likes) || 0
  };
}

function normalizeComment(comment, index) {
  return {
    ...comment,
    id: comment.id || `comment-${index + 1}`,
    side: comment.side === "b" ? "b" : (comment.side === "a" ? "a" : (index % 2 ? "b" : "a")),
    likes: Number(comment.likes) || 0,
    replies: Array.isArray(comment.replies) ? comment.replies.map(normalizeReply).filter(reply => reply.text) : []
  };
}

function getComments(war) {
  const seedComments = seedCommentsForWar(war).map(normalizeComment);
  const storedComments = readJson(`comments:${war.id}`, null);
  const storedList = Array.isArray(storedComments) ? storedComments.map(normalizeComment) : [];
  const storedById = Object.fromEntries(storedList.map(comment => [comment.id, comment]));
  const localComments = storedList.filter(comment => !String(comment.id || "").startsWith("seed-"));
  const mergedComments = storedList.length
    ? [
      ...seedComments.map(comment => {
        const storedComment = storedById[comment.id];
        const localReplies = (storedComment?.replies || []).filter(reply => String(reply.id || "").startsWith("local-reply-"));
        return {
          ...comment,
          likes: Math.max(Number(comment.likes) || 0, Number(storedComment?.likes) || 0),
          replies: [...comment.replies, ...localReplies]
        };
      }),
      ...localComments
    ]
    : seedComments;

  return mergedComments
    .map(normalizeComment)
    .sort((a, b) => b.likes - a.likes);
}

function getLikedComments(id) {
  const liked = readJson(`liked-comments:${id}`, []);
  return Array.isArray(liked) ? liked : [];
}

function hasLikedComment(warId, commentId) {
  return getLikedComments(warId).includes(commentId);
}

function markCommentLiked(warId, commentId) {
  const liked = new Set(getLikedComments(warId));
  liked.add(commentId);
  writeJson(`liked-comments:${warId}`, Array.from(liked));
}

function renderComments(war) {
  const comments = getComments(war);
  const groups = {
    a: comments.filter(comment => comment.side === "a"),
    b: comments.filter(comment => comment.side === "b")
  };
  const renderReplies = comment => `
    <div class="reply-thread">
      ${(comment.replies || []).map(reply => `
        <article class="comment-reply">
          <strong>${reply.author}</strong>
          <p>${reply.text}</p>
        </article>
      `).join("")}
      <form class="reply-form" data-comment="${comment.id}">
        <input name="author" maxlength="40" placeholder="${t("signature")}" required>
        <input name="text" maxlength="280" placeholder="${t("replyPlaceholder")}" required>
        <button type="submit">${t("reply")}</button>
      </form>
    </div>
  `;
  const renderColumn = (side, title) => {
    const items = groups[side];
    return `
      <div class="comment-column ${side === "a" ? "red" : "blue"}">
        <div class="comment-column-head">
          <span>${side === "a" ? t("for") : t("against")}</span>
          <h3>${title}</h3>
          <small>${items.length} ${t("commentsStrongest")}</small>
        </div>
        <div class="comment-list">
          ${items.length ? items.map((comment, index) => `
            <article class="comment ${index === 0 ? "top-comment" : ""}">
              <div>
                ${index === 0 ? `<em>${t("strongestVoice")}</em>` : ""}
                <strong>${comment.author}</strong>
                <p>${comment.text}</p>
                ${renderReplies(comment)}
              </div>
              <button class="like-button" data-comment="${comment.id}" type="button" aria-label="${hasLikedComment(war.id, comment.id) ? t("likedAlready") : t("likeComment")}" ${hasLikedComment(war.id, comment.id) ? "disabled" : ""}>
                <span aria-hidden="true">👍</span> ${comment.likes}
              </button>
            </article>
          `).join("") : `<p class="empty-comments">${t("emptyComments")}</p>`}
        </div>
      </div>
    `;
  };

  return `
    <section class="comments-panel">
      <h2>${t("comments")}</h2>
      <form class="comment-form" id="commentForm">
        <fieldset class="comment-side-picker">
          <legend>${t("commentLegend")}</legend>
          <label><input type="radio" name="side" value="a" checked> ${war.sideA}</label>
          <label><input type="radio" name="side" value="b"> ${war.sideB}</label>
        </fieldset>
        <input name="author" maxlength="40" placeholder="${t("signature")}" required>
        <textarea name="text" maxlength="500" placeholder="${t("addArgument")}" required></textarea>
        <button class="primary-button" type="submit">${t("publish")}</button>
      </form>
      <div class="comment-columns">
        ${renderColumn("a", war.sideA)}
        ${renderColumn("b", war.sideB)}
      </div>
    </section>
  `;
}

function renderDetail() {
  const detail = $("#detail");
  if (!detail) return;
  const war = findCurrentWar();
  const sources = normalizeSources(war.sources);
  document.title = `${war.title} - Wojny Dietetyczne`;
  detail.innerHTML = `
    <article class="war-hero">
      <div class="war-photo"><img src="${imageSrc(war.image)}" alt=""></div>
      <div class="war-title">
        <span class="badge">${war.badge}</span>
        <p class="eyebrow">${war.category}</p>
        <h1>${war.title}</h1>
        <h2>${war.hook || war.kicker}</h2>
        <p>${war.summary}</p>
        <div class="versus"><span>${war.sideA}</span><b>VS</b><span>${war.sideB}</span></div>
      </div>
    </article>

    <section class="argument-ring">
      <div class="corner red">
        <h2>${t("argumentsFor")}</h2>
        <h3>${war.authorityA || ""}</h3>
        ${war.argumentsFor.map(item => `<p>${item}</p>`).join("")}
      </div>
      <div class="corner blue">
        <h2>${t("argumentsAgainst")}</h2>
        <h3>${war.authorityB || ""}</h3>
        ${war.argumentsAgainst.map(item => `<p>${item}</p>`).join("")}
      </div>
    </section>

    <section class="conflict-panel">
      <div>
        <h2>${t("whyConflict")}</h2>
        ${(war.contradiction || []).map(item => `<p>${item}</p>`).join("")}
      </div>
      <aside>
        <h2>${t("myView")}</h2>
        <p>${war.conclusion || "Tu pojawi się Twój wniosek po opracowaniu sporu."}</p>
        <strong>${war.question || "Kto ma rację?"}</strong>
      </aside>
    </section>

    <section class="sources-panel">
      <h2>${t("sourceMaterials")}</h2>
      <div class="source-list">
        ${sources.length ? sources.map(([name, url]) => `<a href="${url}" target="_blank" rel="noreferrer">${name}</a>`).join("") : `<p>${t("noSources")}</p>`}
      </div>
    </section>

    ${renderPoll(war)}
    ${renderComments(war)}
  `;

  $all(".poll-button").forEach(button => {
    button.addEventListener("click", () => {
      const poll = getPoll(war.id);
      if (poll.chosen) return;
      const side = button.dataset.side;
      poll[side] += 1;
      poll.chosen = side;
      writeJson(`poll:${war.id}`, poll);
      renderDetail();
    });
  });

  $("#commentForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const comments = getComments(war);
    comments.push({
      id: `local-${Date.now()}`,
      side: form.side.value === "b" ? "b" : "a",
      author: form.author.value.trim(),
      text: form.text.value.trim(),
      likes: 0
    });
    writeJson(`comments:${war.id}`, comments);
    renderDetail();
  });

  $all(".reply-form").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const comments = getComments(war);
      const comment = comments.find(item => item.id === form.dataset.comment);
      if (!comment) return;
      comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
      comment.replies.push({
        id: `local-reply-${Date.now()}`,
        author: form.author.value.trim(),
        text: form.text.value.trim(),
        likes: 0
      });
      writeJson(`comments:${war.id}`, comments);
      renderDetail();
    });
  });

  $all(".like-button").forEach(button => {
    button.addEventListener("click", () => {
      if (hasLikedComment(war.id, button.dataset.comment)) return;
      const comments = getComments(war);
      const item = comments.find(comment => comment.id === button.dataset.comment);
      if (!item) return;
      item.likes += 1;
      markCommentLiked(war.id, item.id);
      writeJson(`comments:${war.id}`, comments);
      renderDetail();
    });
  });
}

function renderAdmin() {
  const form = $("#topicForm");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const title = data.get("title").trim();
    const entry = {
      id: slugify(title),
      title,
      kicker: data.get("kicker").trim(),
      badge: data.get("badge").trim(),
      category: data.get("category").trim(),
      sideA: data.get("sideA").trim(),
      sideB: data.get("sideB").trim(),
      votes: 0,
      comments: 0,
      heat: 50,
      image: `https://picsum.photos/seed/${slugify(title)}/900/600`,
      tags: [slugify(data.get("category").trim())],
      summary: data.get("kicker").trim(),
      argumentsFor: data.get("argumentsFor").split("\n").map(row => row.trim()).filter(Boolean),
      argumentsAgainst: data.get("argumentsAgainst").split("\n").map(row => row.trim()).filter(Boolean),
      sources: data.get("sources").split("\n").map(row => {
        const [name, url] = row.split("|").map(part => part.trim());
        return [name || "Źródło", url || ""];
      }).filter(row => row[1])
    };
    $("#generatedOutput").value = JSON.stringify(entry, null, 2);
  });
}

function renderProposalForm() {
  const form = $(".proposal-form");
  if (!form) return;
  const status = $("#proposalStatus");
  const isLocalPreview = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isLocalPreview) return;

  form.addEventListener("submit", event => {
    event.preventDefault();
    const proposals = readJson("battle-proposals", []);
    const data = Object.fromEntries(new FormData(form).entries());
    proposals.push({ ...data, createdAt: new Date().toISOString() });
    writeJson("battle-proposals", proposals);
    form.reset();
    if (status) {
      status.textContent = "Zapisano lokalnie w tej przeglądarce. Po publikacji na Netlify propozycje będą wpadać do Forms.";
    }
  });
}

applyStaticTranslations();
initLanguageSwitch();
renderHome();
renderDetail();
renderAdmin();
renderProposalForm();
