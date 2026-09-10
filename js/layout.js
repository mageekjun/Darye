// 모든 페이지 공통 헤더/푸터. body의 data-page 값으로 현재 메뉴를 표시한다.

(function(){
  const NAV = [
    { id:"community", label:"커뮤니티", href:"community.html" },
    { id:"curator",   label:"취향 큐레이터", href:"curator.html" },
    { id:"shop",      label:"샵", href:"shop.html" },
  ];

  const active = document.body.getAttribute("data-page") || "";
  const query = new URLSearchParams(location.search).get("q") || "";

  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `
    <div class="top-row">
      <a class="brand" href="index.html">
        <img class="logo-img light-only" src="assets/logo-h.png" width="488" height="240" alt="다례 茶禮">
        <img class="logo-img dark-only" src="assets/logo-h-dark.png" width="488" height="240" alt="" aria-hidden="true">
      </a>
      <nav class="main-nav" aria-label="주요 메뉴">
        ${NAV.map(n => `<a href="${n.href}"${n.id === active ? ' class="is-active" aria-current="page"' : ""}>${n.label}</a>`).join("")}
      </nav>
      <form class="search" role="search" action="shop.html">
        <input type="search" name="q" id="global-search" placeholder="차 이름·효능으로 찾기" value="${query.replace(/"/g,"&quot;")}" aria-label="차 검색">
        <button type="submit" aria-label="검색">검색</button>
      </form>
      <a class="scrap-link" href="shop.html?scrapped=1" aria-label="찜한 차 보기">🔖 <span id="scrap-count">0</span></a>
    </div>
  `;
  document.body.insertBefore(header, document.body.firstChild);

  const footer = document.createElement("footer");
  footer.className = "foot";
  footer.innerHTML = `
    <div class="wrap">
      <div class="foot-lockup">
        <img class="light-only" src="assets/logo-lockup.png" width="420" height="689" alt="다례 茶禮 — Tea for a better life">
        <img class="dark-only" src="assets/logo-lockup-dark.png" width="420" height="689" alt="" aria-hidden="true">
      </div>
      <p class="foot-signature">차, 이제 검색하지 말고 물어보세요.</p>
      <div class="foot-row">
        <span>다례(茶禮)</span>
        <span>MVP 테스트 버전 · 실제 결제·배송은 연결되어 있지 않습니다</span>
      </div>
    </div>
  `;
  document.body.appendChild(footer);

  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.id = "toast";
  document.body.appendChild(toastEl);

  const count = document.getElementById("scrap-count");
  if(count) count.textContent = getScraps().length;
})();
