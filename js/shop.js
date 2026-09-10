(function(){

  const params = new URLSearchParams(location.search);
  const query = (params.get("q") || "").trim();
  const onlyScrapped = params.get("scrapped") === "1";
  const profile = loadLocalProfile();

  const paramGroup = params.get("group");
  const paramCat = params.get("cat");
  let activeGroup = GROUPS.some(g => g.id === paramGroup) ? paramGroup : "all";
  let activeCat = "all";

  // ?cat=녹차 처럼 소분류로 바로 들어오면 그 소분류를 가진 대분류를 열어준다
  if(paramCat){
    const owner = PRODUCTS.find(p => p.category === paramCat);
    if(owner){
      if(activeGroup === "all") activeGroup = owner.group;
      activeCat = paramCat;
    }
  }

  // 검색: 이름·원산지·분류·설명까지 훑는다
  function matchesQuery(p){
    if(!query) return true;
    const extra = isTool(p)
      ? [p.material, p.capacity, p.usage]
      : [...p.taste.map(t => TASTE_LABEL[t]), CAFFEINE_LABEL[p.caffeine], p.brew];
    return [p.name, p.origin, p.category, p.effect, p.story, ...extra]
      .join(" ").toLowerCase().includes(query.toLowerCase());
  }

  function visibleProducts(){
    return PRODUCTS.filter(p =>
      matchesQuery(p) &&
      (activeGroup === "all" || p.group === activeGroup) &&
      (activeCat === "all" || p.category === activeCat) &&
      (!onlyScrapped || isScrapped(p.id))
    );
  }

  function renderHead(){
    const group = GROUPS.find(g => g.id === activeGroup);
    if(onlyScrapped){
      $("#shop-title").textContent = "찜한 상품";
      $("#shop-desc").textContent = "이 브라우저에 저장된 찜 목록입니다.";
    } else if(query){
      $("#shop-title").textContent = `'${query}' 검색 결과`;
      $("#shop-desc").textContent = "이름·원산지·효능·재질에서 찾았습니다.";
    } else if(group){
      $("#shop-title").textContent = group.label;
      $("#shop-desc").textContent = group.id === "tool"
        ? "다관·찻잔부터 우림 도구까지, 차를 제대로 마시기 위한 도구."
        : `${group.label} ${PRODUCTS.filter(p=>p.group===group.id).length}종을 분류별로 모았습니다.`;
    } else {
      $("#shop-title").textContent = "전체 둘러보기";
      $("#shop-desc").textContent = `국내차·해외차·차 도구 ${PRODUCTS.length}종. 취향 진단을 마치면 일치율이 함께 표시됩니다.`;
    }
  }

  function renderGroupTabs(){
    const tabs = [{ id:"all", label:"전체" }, ...GROUPS];
    $("#group-tabs").innerHTML = tabs.map(g => `
      <button type="button" data-group="${g.id}" aria-pressed="${g.id === activeGroup ? "true" : "false"}">
        ${g.icon ? g.icon + " " : ""}${g.label}
      </button>
    `).join("");
  }

  function renderCatChips(){
    const cats = activeGroup === "all" ? [] : categoriesOf(activeGroup);
    const row = $("#cat-chips");
    row.hidden = cats.length === 0;
    if(!cats.length) return;
    row.innerHTML = [["all","전체"], ...cats.map(c => [c, c])].map(([id, label]) => `
      <button type="button" class="filter-chip" data-cat="${id}" aria-pressed="${id === activeCat ? "true" : "false"}">${label}</button>
    `).join("");
  }

  function renderGrid(){
    const grid = $("#shop-grid");
    grid.innerHTML = "";
    const list = visibleProducts();
    $("#shop-count").textContent = `${list.length}종`;
    if(!list.length){
      grid.innerHTML = onlyScrapped
        ? `<p class="empty-note">아직 찜한 상품이 없어요. 상세 페이지에서 찜해보세요.</p>`
        : `<p class="empty-note">조건에 맞는 상품이 없어요. 다른 분류나 검색어로 찾아보세요.</p>`;
      return;
    }
    list.forEach(p => grid.appendChild(teaCardEl(p, profile)));
  }

  function renderAll(){
    renderHead();
    renderGroupTabs();
    renderCatChips();
    renderGrid();
  }

  $("#group-tabs").addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-group]");
    if(!btn) return;
    activeGroup = btn.getAttribute("data-group");
    activeCat = "all";
    renderAll();
  });

  $("#cat-chips").addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-cat]");
    if(!btn) return;
    activeCat = btn.getAttribute("data-cat");
    renderCatChips();
    renderGrid();
  });

  renderAll();

})();
