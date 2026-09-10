(function(){

  const params = new URLSearchParams(location.search);
  const query = (params.get("q") || "").trim();
  const onlyScrapped = params.get("scrapped") === "1";
  const profile = loadLocalProfile();

  let activeCat = params.get("cat") && CATEGORIES.includes(params.get("cat")) ? params.get("cat") : "all";

  // 검색: 이름·원산지·카테고리·효능·맛 특징까지 훑는다
  function matchesQuery(tea){
    if(!query) return true;
    const haystack = [
      tea.name, tea.origin, tea.category, tea.effect, tea.story,
      ...tea.taste.map(t => TASTE_LABEL[t]),
      CAFFEINE_LABEL[tea.caffeine],
    ].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  function visibleTeas(){
    return TEAS.filter(t =>
      matchesQuery(t) &&
      (activeCat === "all" || t.category === activeCat) &&
      (!onlyScrapped || isScrapped(t.id))
    );
  }

  function renderHead(){
    if(onlyScrapped){
      $("#shop-title").textContent = "찜한 차";
      $("#shop-desc").textContent = "이 브라우저에 저장된 찜 목록입니다.";
    } else if(query){
      $("#shop-title").textContent = `'${query}' 검색 결과`;
      $("#shop-desc").textContent = "이름·원산지·효능·맛 특징에서 찾았습니다.";
    }
  }

  function renderTabs(){
    const tabs = $("#cat-tabs");
    const cats = ["all", ...CATEGORIES];
    tabs.innerHTML = cats.map(c => `
      <button type="button" data-cat="${c}" aria-pressed="${c === activeCat ? "true" : "false"}">${c === "all" ? "전체" : c}</button>
    `).join("");
  }

  function renderGrid(){
    const grid = $("#shop-grid");
    grid.innerHTML = "";
    const list = visibleTeas();
    if(!list.length){
      grid.innerHTML = onlyScrapped
        ? `<p class="empty-note">아직 찜한 차가 없어요. 마음에 드는 차의 상세 페이지에서 찜해보세요.</p>`
        : `<p class="empty-note">조건에 맞는 차가 없어요. 다른 카테고리나 검색어로 찾아보세요.</p>`;
      return;
    }
    list.forEach(t => grid.appendChild(teaCardEl(t, profile)));
  }

  $("#cat-tabs").addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-cat]");
    if(!btn) return;
    activeCat = btn.getAttribute("data-cat");
    renderTabs();
    renderGrid();
  });

  renderHead();
  renderTabs();
  renderGrid();

})();
