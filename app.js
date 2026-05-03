const wars = window.DIET_WARS || [];
const links = window.CONTRADICTION_LINKS || [];
const storagePrefix = "diet-wars:";
const assetVersion = "202605012205";

function imageSrc(path) {
  return path || "";
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
  return Number(day) + Number(localStorage.getItem(`${storagePrefix}shuffle`) || 0);
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

function cardTemplate(war, size = "normal") {
  const href = `war.html?id=${encodeURIComponent(war.id)}`;
  return `
    <a class="topic-card ${size}" href="${href}">
      <span class="thumb"><img src="${imageSrc(war.image)}" alt="" loading="lazy"></span>
      <span class="card-body">
        <span class="badge">${war.badge}</span>
        <strong>${war.title}</strong>
        <span class="kicker">${war.kicker}</span>
        <span class="scoreline">
          <span>${war.comments} komentarzy</span>
          <span>${war.votes} głosów</span>
          <span>${war.heat}°C</span>
        </span>
      </span>
    </a>
  `;
}

function renderHome() {
  const ordered = seededShuffle(wars, dailySeed())
    .sort((a, b) => Math.floor(b.heat / 10) - Math.floor(a.heat / 10));
  const lead = ordered[0];
  const leadStory = $("#leadStory");
  if (!leadStory) return;

  leadStory.innerHTML = `
    <a class="lead-link" href="war.html?id=${lead.id}">
      <span class="lead-image"><img src="${imageSrc(lead.image)}" alt=""></span>
      <span class="lead-copy">
        <span class="badge">${lead.badge}</span>
        <h1>${lead.title}</h1>
        <p>${lead.summary}</p>
        <span class="scoreline"><span>${lead.comments} komentarzy</span><span>${lead.votes} głosów</span></span>
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
  $("#tickerItems").innerHTML = ordered.slice(0, 12).map(item => `<a href="war.html?id=${item.id}">${item.title}</a>`).join("");

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
    return `<a class="map-link" href="war.html?id=${from}"><span>${a.title}</span><em>${label}</em><span>${b.title}</span></a>`;
  }).join("");
  canvas.innerHTML = `
    <div class="map-nodes">
      ${featured.map((item, index) => `
        <a class="map-node tone-${index % 5}" href="war.html?id=${item.id}">
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
      <h2>Sondaż: po której stronie jesteś?</h2>
      <div class="poll-actions">
        <button class="poll-button" data-side="a" ${poll.chosen ? "disabled" : ""}>${war.sideA}</button>
        <button class="poll-button" data-side="b" ${poll.chosen ? "disabled" : ""}>${war.sideB}</button>
      </div>
      <div class="poll-bars">
        <div><span>${war.sideA}</span><strong>${aPct}%</strong><i style="width:${aPct}%"></i></div>
        <div><span>${war.sideB}</span><strong>${bPct}%</strong><i style="width:${bPct}%"></i></div>
      </div>
      <p>${total} oddanych głosów lokalnie w tej przeglądarce.</p>
    </section>
  `;
}

function getComments(id) {
  const seeded = [
    { id: "seed-1", side: "a", author: "Czytelnik", text: "Po tej stronie przekonuje mnie ostrożność: w zdrowiu publicznym nawet niewielkie ryzyko może mieć duże znaczenie, jeśli dotyczy milionów ludzi.", likes: 18 },
    { id: "seed-2", side: "b", author: "Analityczna", text: "Po drugiej stronie ważny jest kontekst. Bez rozróżnienia dawki, jakości produktu i stylu życia każdy spór zmienia się w hasło z social mediów.", likes: 12 }
  ];
  return readJson(`comments:${id}`, seeded)
    .map((comment, index) => ({
      ...comment,
      side: comment.side === "b" ? "b" : (comment.side === "a" ? "a" : (index % 2 ? "b" : "a")),
      likes: Number(comment.likes) || 0
    }))
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
  const comments = getComments(war.id);
  const groups = {
    a: comments.filter(comment => comment.side === "a"),
    b: comments.filter(comment => comment.side === "b")
  };
  const renderColumn = (side, title) => {
    const items = groups[side];
    return `
      <div class="comment-column ${side === "a" ? "red" : "blue"}">
        <div class="comment-column-head">
          <span>${side === "a" ? "Za" : "Przeciw"}</span>
          <h3>${title}</h3>
          <small>${items.length} komentarzy, najmocniejsze na górze</small>
        </div>
        <div class="comment-list">
          ${items.length ? items.map((comment, index) => `
            <article class="comment ${index === 0 ? "top-comment" : ""}">
              <div>
                ${index === 0 ? `<em>Najmocniejszy głos tej strony</em>` : ""}
                <strong>${comment.author}</strong>
                <p>${comment.text}</p>
              </div>
              <button class="like-button" data-comment="${comment.id}" type="button" aria-label="${hasLikedComment(war.id, comment.id) ? "Ten komentarz jest już polubiony" : "Polub komentarz"}" ${hasLikedComment(war.id, comment.id) ? "disabled" : ""}>
                <span aria-hidden="true">👍</span> ${comment.likes}
              </button>
            </article>
          `).join("") : `<p class="empty-comments">Tu czeka miejsce na pierwszy mocny argument.</p>`}
        </div>
      </div>
    `;
  };

  return `
    <section class="comments-panel">
      <h2>Komentarze</h2>
      <form class="comment-form" id="commentForm">
        <fieldset class="comment-side-picker">
          <legend>Po której stronie komentujesz?</legend>
          <label><input type="radio" name="side" value="a" checked> ${war.sideA}</label>
          <label><input type="radio" name="side" value="b"> ${war.sideB}</label>
        </fieldset>
        <input name="author" maxlength="40" placeholder="Podpis" required>
        <textarea name="text" maxlength="500" placeholder="Dodaj argument, pytanie albo kontrargument" required></textarea>
        <button class="primary-button" type="submit">Opublikuj</button>
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
        <h2>Argumenty za</h2>
        <h3>${war.authorityA || ""}</h3>
        ${war.argumentsFor.map(item => `<p>${item}</p>`).join("")}
      </div>
      <div class="corner blue">
        <h2>Argumenty przeciw</h2>
        <h3>${war.authorityB || ""}</h3>
        ${war.argumentsAgainst.map(item => `<p>${item}</p>`).join("")}
      </div>
    </section>

    <section class="conflict-panel">
      <div>
        <h2>Dlaczego ta sprzeczność istnieje?</h2>
        ${(war.contradiction || []).map(item => `<p>${item}</p>`).join("")}
      </div>
      <aside>
        <h2>Moim zdaniem</h2>
        <p>${war.conclusion || "Tu pojawi się Twój wniosek po opracowaniu sporu."}</p>
        <strong>${war.question || "Kto ma rację?"}</strong>
      </aside>
    </section>

    <section class="sources-panel">
      <h2>Materiały źródłowe</h2>
      <div class="source-list">
        ${war.sources.map(([name, url]) => `<a href="${url}" target="_blank" rel="noreferrer">${name}</a>`).join("")}
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
    const comments = getComments(war.id);
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

  $all(".like-button").forEach(button => {
    button.addEventListener("click", () => {
      if (hasLikedComment(war.id, button.dataset.comment)) return;
      const comments = getComments(war.id);
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

renderHome();
renderDetail();
renderAdmin();
