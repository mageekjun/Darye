(function(){

  const profile = loadLocalProfile();
  const featured = FEED_POSTS[0];

  // ---------------- HERO ----------------
  function renderHero(){
    const hero = $("#hero");
    const style = categoryStyle(featured.category);
    const photo = featured.image
      ? `<img src="${commonsUrl(featured.image, 1000)}" alt="" onerror="this.remove()">` : "";

    const promo = profile
      ? `<div class="promo-card">
           <div class="promo-eyebrow">내 취향 큐레이션</div>
           <h2>취향에 맞는 차를<br>이미 골라뒀어요</h2>
           <div class="promo-profile">${profileSummary(profile)}</div>
           <a class="btn light" href="curator.html">추천 결과 보기</a>
         </div>`
      : `<div class="promo-card">
           <div class="promo-eyebrow">1분 취향 진단</div>
           <h2>당신에게 맞는 차를<br>찾아드릴게요</h2>
           <p>맛·카페인·마시는 목적 3가지만 알려주시면 14종 중에서 골라드립니다.</p>
           <a class="btn clay" href="curator.html">취향 진단 시작하기</a>
         </div>`;

    hero.innerHTML = `
      <button type="button" class="feature-card" data-post="${featured.id}"
        style="--accent:${style.accent}; --accent-light:${style.light};">
        <span class="feature-emoji" aria-hidden="true">${style.icon}</span>
        ${photo}
        <span class="feature-scrim"></span>
        <span class="feature-text">
          <span class="feature-cat">${featured.category}</span>
          <h2>${featured.title}</h2>
          <span class="feature-meta">다례 팀 · ${featured.date} · ${featured.readMin}분 분량</span>
        </span>
      </button>
      ${promo}
    `;
  }

  // ---------------- SHORTCUTS ----------------
  function renderShortcuts(){
    const row = $("#shortcut-row");
    // 대분류를 앞에 세우고, 자주 찾는 소분류를 뒤에 붙인다
    const POPULAR = ["녹차", "홍차", "허브차", "약차", "다관"];
    const items = [
      { icon:"🎯", label:"취향 진단", href:"curator.html", accent:"#b1502e", light:"#f3e2d8" },
      ...GROUPS.map(g => {
        const s = categoryStyle(g.id === "tool" ? "다관" : "녹차");
        return { icon:g.icon, label:g.label, href:`shop.html?group=${g.id}`, accent:s.accent, light:s.light };
      }),
      ...POPULAR.map(c => {
        const s = categoryStyle(c);
        return { icon:s.icon, label:c, href:`shop.html?cat=${encodeURIComponent(c)}`, accent:s.accent, light:s.light };
      }),
      { icon:"🔖", label:"찜한 상품", href:"shop.html?scrapped=1", accent:"#6b6558", light:"#e8e3d5" },
    ];
    row.innerHTML = items.map(i => `
      <a class="shortcut" href="${i.href}" style="--accent:${i.accent}; --accent-light:${i.light};">
        <span class="sc-icon" aria-hidden="true">${i.icon}</span>
        <span>${i.label}</span>
      </a>
    `).join("");
  }

  // ---------------- SECTIONS ----------------
  function renderPosts(){
    const grid = $("#home-posts");
    FEED_POSTS.slice(1, 4).forEach(p => grid.appendChild(postCardEl(p)));
  }

  function renderCuratorSection(){
    if(!profile) return;
    const section = $("#curator-section");
    section.hidden = false;
    section.innerHTML = `
      <div class="result-head">
        <div>
          <h2>당신을 위한 큐레이션</h2>
          <div class="rh-sub">${profileSummary(profile)}</div>
        </div>
        <a class="retake" href="curator.html">취향 다시 설정</a>
      </div>
      <div class="top-pick-row" id="home-picks"></div>
    `;
    const row = $("#home-picks");
    rankedTeas(profile).slice(0,3).forEach(t => row.appendChild(teaCardEl(t, profile)));
  }

  function renderShopPreview(){
    const grid = $("#home-shop");
    // 국내차·해외차·차 도구를 섞어 보여줘 대분류가 있다는 걸 첫 화면에서 알린다
    const list = profile
      ? [...rankedTeas(profile).slice(0,6), ...TOOLS.slice(0,2)]
      : [...TEAS.filter(t=>t.group==="domestic").slice(0,3),
         ...TEAS.filter(t=>t.group==="overseas").slice(0,3),
         ...TOOLS.slice(0,2)];
    list.forEach(t => grid.appendChild(teaCardEl(t, profile)));
  }

  renderHero();
  renderShortcuts();
  renderPosts();
  renderCuratorSection();
  renderShopPreview();
  wirePostReactions();

})();
