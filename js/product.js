(function(){

  const params = new URLSearchParams(location.search);
  const tea = productById(params.get("id"));
  const profile = loadLocalProfile();

  if(!tea){
    $("#product-main").innerHTML = `
      <div style="grid-column:1/-1; padding:40px 0; text-align:center; color:var(--muted);">
        상품을 찾을 수 없습니다. <a href="shop.html" style="color:var(--brand); text-decoration:underline;">샵으로 돌아가기</a>
      </div>
    `;
    return;
  }

  document.title = `${tea.name} — 다례(茶禮)`;

  // ---------------- GALLERY ----------------
  let activeImageIdx = 0;
  const style = categoryStyle(tea.category);
  const images = tea.images || [];

  function renderGallery(){
    const main = $("#gallery-main");
    if(!main) return;
    const file = images[activeImageIdx];
    main.innerHTML = `<span class="thumb-emoji" aria-hidden="true">${style.icon}</span>` +
      (file ? `<img src="${commonsUrl(file, 900)}" alt="" onerror="this.remove()">` : "");
    $$(".gallery-thumb").forEach((b,i) => b.setAttribute("aria-pressed", i === activeImageIdx ? "true" : "false"));
  }

  // ---------------- MAIN RENDER ----------------
  function render(){
    $("#crumb").innerHTML = `
      <a href="index.html#shop">샵</a> · ${tea.category} · <span>${tea.name}</span>
    `;

    const thumbsHtml = images.length > 1
      ? `<div class="gallery-thumbs" id="gallery-thumbs">${images.map((file,i) => `
          <button type="button" class="gallery-thumb" data-idx="${i}" aria-pressed="${i===0?"true":"false"}">
            <span class="thumb-emoji" aria-hidden="true">${style.icon}</span>
            <img src="${commonsUrl(file, 160)}" alt="" onerror="this.remove()">
          </button>
        `).join("")}</div>`
      : "";

    const main = $("#product-main");
    main.innerHTML = `
      <div class="gallery" style="--accent:${style.accent}; --accent-light:${style.light};">
        <div class="gallery-main" id="gallery-main"></div>
        ${thumbsHtml}
      </div>
      <div class="buy-panel">
        <div class="buy-brand">다례 · ${tea.category}</div>
        <h1 class="buy-title">${tea.name}</h1>
        <div class="buy-origin">${tea.origin}</div>
        ${(profile && !isTool(tea)) ? `<div class="buy-match"><span class="match-badge">${matchPercent(tea, profile)}% 일치</span></div>` : ""}
        <div class="buy-effect">${tea.effect}</div>
        <div class="option-block">
          <label class="option-label" for="opt-weight">${isTool(tea) ? "구성" : "용량"}</label>
          <select class="option-select" id="opt-weight">
            ${tea.options.map((o,i) => `<option value="${i}">${o.weight} · ${formatWon(o.price)}</option>`).join("")}
          </select>
        </div>
        <div class="buy-price-row">
          <span class="buy-price" id="buy-price">${formatWon(tea.options[0].price)}</span>
          <span class="buy-weight" id="buy-weight">${tea.options[0].weight}</span>
        </div>
        <div class="buy-cta-row">
          <button type="button" class="scrap-toggle" data-action="scrap" aria-pressed="${isScrapped(tea.id)?"true":"false"}">${isScrapped(tea.id) ? "🔖 찜함" : "🔖 찜하기"}</button>
          <button type="button" class="btn clay" data-action="buy">구매하기</button>
        </div>
        <div class="mvp-note">MVP 테스트 단계로 실제 결제·배송은 연결되어 있지 않습니다.</div>
      </div>
    `;
    renderGallery();

    const priceRow = `<tr><td>구성·가격</td><td>${tea.options.map(o => `${o.weight} ${formatWon(o.price)}`).join(" / ")}</td></tr>`;
    const specRows = isTool(tea)
      ? `<tr><td>재질</td><td>${tea.material}</td></tr>
         <tr><td>규격</td><td>${tea.capacity}</td></tr>
         <tr><td>쓰는 법</td><td>${tea.usage}</td></tr>
         ${priceRow}`
      : `<tr><td>효능</td><td>${tea.effect}</td></tr>
         <tr><td>맛 특징</td><td>${tea.taste.map(t=>TASTE_LABEL[t]).join(", ")}</td></tr>
         <tr><td>바디감</td><td>${BODY_LABEL[tea.body]}</td></tr>
         <tr><td>향</td><td>${AROMA_LABEL[tea.aroma]}</td></tr>
         <tr><td>카페인</td><td>${CAFFEINE_LABEL[tea.caffeine]}</td></tr>
         <tr><td>어울리는 때</td><td>${tea.time.map(t=>TIME_LABEL[t]).join(", ")}</td></tr>
         <tr><td>우리는 법</td><td>${tea.brew}</td></tr>
         ${priceRow}`;
    $("#spec-section").innerHTML = `
      <h2>상세 정보</h2>
      <table class="kv-table">${specRows}</table>
      <div class="story">${tea.story}</div>
    `;

    const sameCat = PRODUCTS.filter(p => p.id !== tea.id && p.category === tea.category);
    const sameGroup = PRODUCTS.filter(p => p.id !== tea.id && p.group === tea.group);
    const relatedList = (sameCat.length ? sameCat : sameGroup).slice(0,4);
    const relatedSection = $("#related-section");
    if(relatedList.length){
      const heading = isTool(tea) ? "함께 보면 좋은 도구" : "함께 보면 좋은 차";
      relatedSection.innerHTML = `<h2>${heading}</h2><div class="shop-grid" id="related-grid"></div>`;
      const grid = $("#related-grid");
      relatedList.forEach(t => grid.appendChild(teaCardEl(t, profile)));
    }

    const barHtml = `
      <button type="button" class="scrap-toggle" data-action="scrap" aria-pressed="${isScrapped(tea.id)?"true":"false"}">${isScrapped(tea.id) ? "🔖 찜함" : "🔖 찜하기"}</button>
      <button type="button" class="btn clay" data-action="buy">구매하기</button>
    `;
    const bar = $("#sticky-buy-bar");
    bar.innerHTML = barHtml;
    bar.hidden = false;
  }

  render();

  // ---------------- WIRE UP ----------------
  function selectedOption(){
    const sel = $("#opt-weight");
    return tea.options[sel ? Number(sel.value) : 0];
  }

  document.addEventListener("change", (e)=>{
    if(e.target.id !== "opt-weight") return;
    const opt = selectedOption();
    $("#buy-price").textContent = formatWon(opt.price);
    $("#buy-weight").textContent = opt.weight;
  });

  document.addEventListener("click", (e)=>{
    const thumb = e.target.closest(".gallery-thumb");
    if(thumb){
      activeImageIdx = Number(thumb.getAttribute("data-idx"));
      renderGallery();
      return;
    }
    const action = e.target.closest("[data-action]");
    if(!action) return;
    if(action.getAttribute("data-action") === "buy"){
      const opt = selectedOption();
      toast(`${opt.weight} ${formatWon(opt.price)} — 구매 연동은 다음 버전에서 제공돼요`);
    }
    if(action.getAttribute("data-action") === "scrap"){
      const scrapped = toggleScrap(tea.id);
      $$('[data-action="scrap"]').forEach(b=>{
        b.setAttribute("aria-pressed", scrapped ? "true" : "false");
        b.textContent = scrapped ? "🔖 찜함" : "🔖 찜하기";
      });
      const count = $("#scrap-count");
      if(count) count.textContent = getScraps().length;
      toast(scrapped ? "찜 목록에 담았어요" : "찜 목록에서 뺐어요");
    }
  });

})();
