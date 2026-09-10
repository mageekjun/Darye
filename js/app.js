(function(){

  const CATEGORY_STYLE = {
    "녹차":     { icon:"🍵", accent:"#2e5339", light:"#e4ece3" },
    "발효차":   { icon:"🫖", accent:"#6b4a2f", light:"#ecdfd0" },
    "우롱차":   { icon:"🍂", accent:"#8a6a2f", light:"#f0e6cf" },
    "홍차":     { icon:"☕", accent:"#b1502e", light:"#f3e2d8" },
    "화차":     { icon:"🌸", accent:"#a15a7a", light:"#f2e0ea" },
    "과일청차": { icon:"🍊", accent:"#c07a1e", light:"#f7e6cc" },
    "허브차":   { icon:"🌿", accent:"#3f7a52", light:"#e1efe4" },
  };

  const TASTE_LABEL = Object.fromEntries(TASTE_OPTS.map(o=>[o.id,o.label]));
  const PURPOSE_LABEL = Object.fromEntries(PURPOSE_OPTS.map(o=>[o.id,o.label]));
  const CAFFEINE_LABEL = { need:"카페인 있음", free:"무카페인", any:"약함/상관없음" };

  const $ = (sel, root) => (root||document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root||document).querySelectorAll(sel));

  function toast(msg){
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
  }

  function applyCategoryStyle(el, category){
    const s = CATEGORY_STYLE[category] || { icon:"🍵", accent:"#2e5339", light:"#e4ece3" };
    el.style.setProperty("--accent", s.accent);
    el.style.setProperty("--accent-light", s.light);
    return s;
  }

  // ---------------- STATE ----------------
  let profile = null;          // {taste:[], caffeine:'', purpose:[]}
  let selTaste = [], selCaffeine = null, selPurpose = [];
  let activeFilter = "all";
  let feedProof = {};          // { [postId]: {liked:false, scrapped:false} } — 현재 방문자의 로컬 반응만 반영, 공유 카운트 없음

  // ---------------- LOCAL STORAGE ----------------
  function loadLocalProfile(){
    try{
      const raw = localStorage.getItem("dahye_profile");
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }
  function saveLocalProfile(p){
    try{ localStorage.setItem("dahye_profile", JSON.stringify(p)); }catch(e){}
  }

  // ---------------- MATCHING (reused 그대로) ----------------
  function scoreTea(tea){
    if(!profile) return 0;
    let score = 0;
    tea.taste.forEach(t=>{ if(profile.taste.includes(t)) score += 3; });
    if(profile.caffeine === "need" && tea.caffeine === "need") score += 2;
    if(profile.caffeine === "free" && tea.caffeine === "free") score += 2;
    if(profile.caffeine === "any") score += 1;
    if(tea.caffeine === "any") score += 1;
    tea.purpose.forEach(p=>{ if(profile.purpose.includes(p)) score += 2; });
    return score;
  }
  function matchPercent(tea){
    const maxPossible = 3*2 + 2 + 2*2; // rough ceiling for display
    const s = scoreTea(tea);
    return Math.min(97, Math.round((s / maxPossible) * 100));
  }

  // ---------------- FEED ----------------
  function feedCardEl(post){
    const el = document.createElement("button");
    el.className = "feed-card";
    el.type = "button";
    const style = applyCategoryStyle(el, post.category);
    feedProof[post.id] = feedProof[post.id] || { liked:false, scrapped:false };

    el.innerHTML = `
      <div class="feed-main">
        <div class="feed-thumb" aria-hidden="true">${style.icon}</div>
        <div class="feed-body">
          <div class="feed-cat">${post.category}</div>
          <div class="feed-title">${post.title}</div>
          <div class="feed-summary">${post.summary}</div>
          <div class="feed-meta">다례 팀 · ${post.date}</div>
        </div>
      </div>
      <div class="feed-proof">
        <button type="button" class="proof-btn" data-like="${post.id}" aria-pressed="false">♡ <span>0</span></button>
        <button type="button" class="proof-btn static" data-comment="${post.id}">💬 0</button>
        <button type="button" class="proof-btn" data-scrap="${post.id}" aria-pressed="false">🔖 <span>0</span></button>
      </div>
    `;
    el.addEventListener("click", (e)=>{
      if(e.target.closest(".proof-btn")) return;
      toast("커뮤니티 상세 페이지는 다음 업데이트에서 제공됩니다");
    });
    return el;
  }

  function renderFeed(){
    const list = $("#feed-list");
    list.innerHTML = "";
    FEED_POSTS.forEach(p => list.appendChild(feedCardEl(p)));
  }

  function toggleProof(postId, kind, btn){
    const state = feedProof[postId];
    state[kind] = !state[kind];
    const count = btn.querySelector("span");
    const base = kind === "liked" ? "♡" : "🔖";
    const active = kind === "liked" ? "♥" : "🔖";
    btn.setAttribute("aria-pressed", state[kind] ? "true" : "false");
    if(count) count.textContent = state[kind] ? "1" : "0";
    if(kind === "liked") btn.firstChild.textContent = state[kind] ? active + " " : base + " ";
  }

  // ---------------- CURATOR CTA / RESULT ----------------
  function teaCardEl(tea, showMatch){
    const el = document.createElement("button");
    el.className = "tea-card";
    el.type = "button";
    el.addEventListener("click", ()=> openDetail(tea.id));
    const style = applyCategoryStyle(el, tea.category);
    const badge = showMatch ? `<span class="match-badge">${matchPercent(tea)}% 일치</span>` : "";
    const photo = tea.image ? `<img src="${tea.image}" alt="" loading="lazy" onerror="this.remove()">` : "";
    el.innerHTML = `
      <div class="tea-thumb" aria-hidden="true"><span class="thumb-emoji">${style.icon}</span>${photo}${badge}</div>
      <div class="tea-body">
        <div class="name">${tea.name}</div>
        <div class="origin">${tea.origin}</div>
        <div class="tag-row">
          <span class="tag">${tea.category}</span>
          <span class="tag">${CAFFEINE_LABEL[tea.caffeine]}</span>
        </div>
        <div class="tea-price">${tea.price}</div>
      </div>
    `;
    return el;
  }

  function renderCuratorCard(){
    const card = $("#curator-card");
    if(!profile){
      card.className = "curator-card";
      card.innerHTML = `
        <h2>당신에게 맞는 차를 찾아드릴게요</h2>
        <p>맛·카페인·마시는 목적, 딱 3가지만 알려주시면 14종의 차 중 지금 취향에 맞는 차를 골라드립니다.</p>
        <button type="button" class="btn clay" id="btn-open-onboarding">1분 취향 진단 시작하기</button>
      `;
      $("#btn-open-onboarding").addEventListener("click", ()=> openOverlay("overlay-onboarding"));
      return;
    }
    card.className = "curator-card curator-result";
    const ranked = TEAS.slice().sort((a,b)=> scoreTea(b) - scoreTea(a)).slice(0,3);
    const summary = `${profile.taste.map(t=>TASTE_LABEL[t]).join("·")} / ${CAFFEINE_LABEL[profile.caffeine]} / ${profile.purpose.map(p=>PURPOSE_LABEL[p]).join("·")}`;
    card.innerHTML = `
      <div class="cr-head">
        <div>
          <h2>당신을 위한 큐레이션</h2>
          <div class="cr-sub">${summary}</div>
        </div>
        <button type="button" class="retake" id="btn-retake">취향 다시 설정</button>
      </div>
      <div class="pick-row" id="pick-row"></div>
    `;
    const row = $("#pick-row", card);
    ranked.forEach(t => row.appendChild(teaCardEl(t, true)));
    $("#btn-retake", card).addEventListener("click", ()=>{
      selTaste = []; selCaffeine = null; selPurpose = [];
      renderOnboarding();
      openOverlay("overlay-onboarding");
    });
  }

  // ---------------- ONBOARDING ----------------
  function renderChips(container, opts, selectedArr, multi, onChange){
    container.innerHTML = "";
    opts.forEach(opt=>{
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = opt.label;
      const pressed = multi ? selectedArr.includes(opt.id) : selectedArr === opt.id;
      b.setAttribute("aria-pressed", pressed ? "true" : "false");
      b.addEventListener("click", ()=>{
        if(multi){
          const idx = selectedArr.indexOf(opt.id);
          if(idx >= 0){ selectedArr.splice(idx,1); }
          else{
            if(selectedArr.length >= 2) selectedArr.shift();
            selectedArr.push(opt.id);
          }
        } else {
          onChange.setVal(opt.id);
        }
        onChange.render();
      });
      container.appendChild(b);
    });
  }

  function renderOnboarding(){
    renderChips($("#taste-chips"), TASTE_OPTS, selTaste, true, { render: renderOnboarding });
    renderChips($("#caffeine-chips"), CAFFEINE_OPTS, selCaffeine, false, {
      setVal:(v)=>{ selCaffeine = v; }, render: renderOnboarding
    });
    renderChips($("#purpose-chips"), PURPOSE_OPTS, selPurpose, true, { render: renderOnboarding });

    const ready = selTaste.length > 0 && !!selCaffeine && selPurpose.length > 0;
    $("#btn-submit-onb").disabled = !ready;
  }

  function submitOnboarding(){
    profile = { taste: selTaste.slice(), caffeine: selCaffeine, purpose: selPurpose.slice() };
    saveLocalProfile(profile);
    closeOverlay("overlay-onboarding");
    renderCuratorCard();
    renderShopGrid();
    toast("취향을 반영한 큐레이션이에요");
  }

  function skipOnboarding(){
    closeOverlay("overlay-onboarding");
  }

  // ---------------- SHOP GRID ----------------
  function renderFilters(){
    const cats = ["all", ...Array.from(new Set(TEAS.map(t=>t.category)))];
    const row = $("#filter-row");
    row.innerHTML = "";
    cats.forEach(c=>{
      const b = document.createElement("button");
      b.className = "filter-chip";
      b.type = "button";
      b.textContent = c === "all" ? "전체" : c;
      b.setAttribute("aria-pressed", activeFilter === c ? "true":"false");
      b.addEventListener("click", ()=>{ activeFilter = c; renderFilters(); renderShopGrid(); });
      row.appendChild(b);
    });
  }

  function renderShopGrid(){
    const grid = $("#shop-grid");
    grid.innerHTML = "";
    const list = activeFilter === "all" ? TEAS : TEAS.filter(t=>t.category===activeFilter);
    list.forEach(t => grid.appendChild(teaCardEl(t, !!profile)));
    $("#shop-count").textContent = `${list.length}종`;
  }

  // ---------------- DETAIL SHEET ----------------
  function openDetail(id){
    const tea = TEAS.find(t=>t.id===id);
    if(!tea) return;
    const iconEl = $("#detail-icon");
    const style = applyCategoryStyle(iconEl, tea.category);
    iconEl.innerHTML = tea.image
      ? `<span class="thumb-emoji">${style.icon}</span><img src="${tea.image}" alt="" loading="lazy" onerror="this.remove()">`
      : style.icon;
    $("#detail-name").textContent = tea.name;
    $("#detail-origin").textContent = tea.origin + " · " + tea.category;
    $("#detail-match").textContent = profile ? `${matchPercent(tea)}% 일치` : "취향 미설정";
    $("#detail-match").style.display = profile ? "inline-block" : "none";
    $("#detail-effect").textContent = tea.effect;
    $("#detail-taste").textContent = tea.taste.map(t=>TASTE_LABEL[t]).join(", ");
    $("#detail-caffeine").textContent = CAFFEINE_LABEL[tea.caffeine];
    $("#detail-brew").textContent = tea.brew;
    $("#detail-price").textContent = tea.price;
    $("#detail-story").textContent = tea.story;
    openOverlay("overlay-detail");
  }

  // ---------------- OVERLAY HELPERS ----------------
  function openOverlay(id){ $("#"+id).hidden = false; }
  function closeOverlay(id){ $("#"+id).hidden = true; }

  // ---------------- WIRE UP ----------------
  document.addEventListener("click", (e)=>{
    const closeId = e.target.closest("[data-close]") && e.target.closest("[data-close]").getAttribute("data-close");
    if(closeId) closeOverlay(closeId);

    const likeBtn = e.target.closest("[data-like]");
    if(likeBtn) toggleProof(likeBtn.getAttribute("data-like"), "liked", likeBtn);

    const scrapBtn = e.target.closest("[data-scrap]");
    if(scrapBtn) toggleProof(scrapBtn.getAttribute("data-scrap"), "scrapped", scrapBtn);

    if(e.target.closest("[data-comment]")) toast("커뮤니티 페이지는 다음 업데이트에서 제공됩니다");
  });

  $("#btn-submit-onb").addEventListener("click", submitOnboarding);
  $("#btn-skip").addEventListener("click", skipOnboarding);
  $("#btn-feed-more").addEventListener("click", ()=> toast("커뮤니티 페이지는 다음 업데이트에서 제공됩니다"));
  $("#btn-buy").addEventListener("click", ()=> toast("MVP 테스트 단계입니다 — 구매 연동은 다음 버전에서 제공돼요"));

  // ---------------- INIT ----------------
  function init(){
    renderFeed();
    renderOnboarding();

    profile = loadLocalProfile();
    if(profile){
      selTaste = profile.taste.slice();
      selCaffeine = profile.caffeine;
      selPurpose = profile.purpose.slice();
    }
    renderCuratorCard();
    renderFilters();
    renderShopGrid();
  }

  init();
})();
