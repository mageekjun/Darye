// 모든 페이지 공통 헤더/푸터. body의 data-page 값으로 현재 메뉴를 표시한다.

(function(){
  const NAV = [
    { id:"community", label:"커뮤니티", href:"community.html" },
    { id:"curator",   label:"취향 큐레이터", href:"curator.html" },
    { id:"shop",      label:"샵", href:"shop.html" },
  ];

  // 다례 심볼 (assets/logo.svg와 동일). currentColor를 쓰기 위해 인라인으로 넣는다.
  const LOGO_MARK = `
    <svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M31 28.5C27.5 19 32 9 41 7c4 6-2.5 17.5-10 21.5Z"/>
        <path d="M41 7c-4.6 5.4-8 12.6-10 21.5"/>
        <path d="M9.5 30H44c7 0 11.5-5 13-14.5"/>
        <path d="M10 30c0 9.4 7.6 17 17 17s17-7.6 17-17"/>
      </g>
    </svg>
  `;

  const active = document.body.getAttribute("data-page") || "";
  const query = new URLSearchParams(location.search).get("q") || "";

  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `
    <div class="top-row">
      <a class="brand" href="index.html" aria-label="다례 홈으로">
        ${LOGO_MARK}
        <span class="brand-type">
          <span class="brand-ko">다례</span>
          <span class="brand-hanja">茶禮</span>
        </span>
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
        ${LOGO_MARK}
        <div class="brand-ko">다례</div>
        <div class="brand-hanja">茶禮</div>
        <div class="foot-tagline">TEA FOR A BETTER LIFE</div>
      </div>
      <div class="foot-row">
        <span>차, 이제 검색하지 말고 물어보세요.</span>
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
