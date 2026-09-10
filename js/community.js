(function(){

  let activeCat = "all";

  function usedCategories(){
    return Array.from(new Set(FEED_POSTS.map(p => p.category)));
  }

  function renderTabs(){
    const tabs = $("#post-tabs");
    const cats = ["all", ...usedCategories()];
    tabs.innerHTML = cats.map(c => `
      <button type="button" data-cat="${c}" aria-pressed="${c === activeCat ? "true" : "false"}">${c === "all" ? "전체" : c}</button>
    `).join("");
  }

  function renderPosts(){
    const grid = $("#post-grid");
    grid.innerHTML = "";
    const list = activeCat === "all" ? FEED_POSTS : FEED_POSTS.filter(p => p.category === activeCat);
    if(!list.length){
      grid.innerHTML = `<p class="empty-note">아직 이 카테고리의 콘텐츠가 없어요.</p>`;
      return;
    }
    list.forEach(p => grid.appendChild(postCardEl(p)));
  }

  $("#post-tabs").addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-cat]");
    if(!btn) return;
    activeCat = btn.getAttribute("data-cat");
    renderTabs();
    renderPosts();
  });

  renderTabs();
  renderPosts();
  wirePostReactions();

})();
