(function(){

  const user = currentUser();
  if(!user){
    location.replace("login.html");
    return;
  }

  const profile = loadLocalProfile();

  // ---------------- 프로필 ----------------
  $("#profile-head").innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar" aria-hidden="true">${user.nickname.slice(0,1)}</div>
      <div class="profile-body">
        <h1>${user.nickname}님</h1>
        <p class="profile-meta">${user.joinedAt} 가입 · 체험용 계정</p>
      </div>
      <button type="button" class="btn light profile-logout" id="btn-logout">로그아웃</button>
    </div>
    <p class="mvp-note">비밀번호 없이 닉네임만 쓰는 MVP 테스트 계정입니다. 이 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
  `;

  $("#btn-logout").addEventListener("click", ()=>{
    signOut();
    location.href = "index.html";
  });

  // ---------------- 내 취향 ----------------
  const tasteSection = $("#taste-section");
  if(profile){
    tasteSection.innerHTML = `
      <div class="section-head">
        <div>
          <h2>내 취향</h2>
          <p class="section-sub">${profileSummary(profile)}</p>
        </div>
        <a class="more-link" href="curator.html">다시 진단하기 →</a>
      </div>
      <div class="shop-grid cols-3" id="taste-picks"></div>
    `;
    const picks = $("#taste-picks");
    rankedTeas(profile).slice(0,3).forEach(t => picks.appendChild(teaCardEl(t, profile)));
  } else {
    tasteSection.innerHTML = `
      <div class="section-head"><div><h2>내 취향</h2></div></div>
      <div class="empty-card">
        <p>아직 취향 진단을 하지 않으셨어요. 3가지만 알려주시면 14종 중에서 맞는 차를 골라드립니다.</p>
        <a class="btn clay" href="curator.html">1분 취향 진단 시작하기</a>
      </div>
    `;
  }

  // ---------------- 찜한 차 ----------------
  const scrapSection = $("#scrap-section");
  const scrapped = TEAS.filter(t => isScrapped(t.id));
  scrapSection.innerHTML = `
    <div class="section-head">
      <div>
        <h2>찜한 차</h2>
        <p class="section-sub">${scrapped.length}종</p>
      </div>
      <a class="more-link" href="shop.html">샵 둘러보기 →</a>
    </div>
    <div class="shop-grid" id="scrap-grid"></div>
  `;
  const grid = $("#scrap-grid");
  if(scrapped.length){
    scrapped.forEach(t => grid.appendChild(teaCardEl(t, profile)));
  } else {
    grid.innerHTML = `<p class="empty-note">아직 찜한 차가 없어요. 상품 상세 페이지에서 찜해보세요.</p>`;
  }

})();
