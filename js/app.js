(function(){

  // ---------------- STATE ----------------
  let profile = null;          // {taste:[], caffeine:'', purpose:[]}
  let selTaste = [], selCaffeine = null, selPurpose = [];
  let activeFilter = "all";
  let feedProof = {};          // { [postId]: {liked:false, scrapped:false} } — 현재 방문자의 로컬 반응만 반영, 공유 카운트 없음

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
    const ranked = TEAS.slice().sort((a,b)=> scoreTea(b, profile) - scoreTea(a, profile)).slice(0,3);
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
    ranked.forEach(t => row.appendChild(teaCardEl(t, profile)));
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
    list.forEach(t => grid.appendChild(teaCardEl(t, profile)));
    $("#shop-count").textContent = `${list.length}종`;
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
