// 모든 페이지가 함께 쓰는 공통 로직 (카테고리 스타일, 매칭 스코어링, 카드 렌더링)

const CATEGORY_STYLE = {
  "녹차":     { icon:"🍵", accent:"#2e5339", light:"#e4ece3" },
  "발효차":   { icon:"🫖", accent:"#6b4a2f", light:"#ecdfd0" },
  "우롱차":   { icon:"🍂", accent:"#8a6a2f", light:"#f0e6cf" },
  "홍차":     { icon:"☕", accent:"#b1502e", light:"#f3e2d8" },
  "화차":     { icon:"🌸", accent:"#a15a7a", light:"#f2e0ea" },
  "과일청차": { icon:"🍊", accent:"#c07a1e", light:"#f7e6cc" },
  "허브차":   { icon:"🌿", accent:"#3f7a52", light:"#e1efe4" },
};
const CATEGORIES = Object.keys(CATEGORY_STYLE);

const TASTE_LABEL = Object.fromEntries(TASTE_OPTS.map(o=>[o.id,o.label]));
const PURPOSE_LABEL = Object.fromEntries(PURPOSE_OPTS.map(o=>[o.id,o.label]));
const CAFFEINE_LABEL = { need:"카페인 있음", free:"무카페인", any:"약함/상관없음" };

const $ = (sel, root) => (root||document).querySelector(sel);
const $$ = (sel, root) => Array.from((root||document).querySelectorAll(sel));

function toast(msg){
  const t = $("#toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
}

// 위키미디어 커먼즈(CC 라이선스) 파일명을 실제 이미지 URL로 변환
function commonsUrl(filename, width){
  if(!filename) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width || 600}`;
}

function categoryStyle(category){
  return CATEGORY_STYLE[category] || { icon:"🍵", accent:"#2e5339", light:"#e4ece3" };
}

function applyCategoryStyle(el, category){
  const s = categoryStyle(category);
  el.style.setProperty("--accent", s.accent);
  el.style.setProperty("--accent-light", s.light);
  return s;
}

function formatWon(price){
  return price.toLocaleString("ko-KR") + "원";
}

// 목록 카드에 쓰는 기준가 — 가장 싼 용량의 가격
function basePrice(tea){
  return Math.min(...tea.options.map(o => o.price));
}

// ---------------- 취향 프로필 ----------------
function loadLocalProfile(){
  try{
    const raw = localStorage.getItem("dahye_profile");
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function saveLocalProfile(p){
  try{ localStorage.setItem("dahye_profile", JSON.stringify(p)); }catch(e){}
}
function profileSummary(profile){
  return `${profile.taste.map(t=>TASTE_LABEL[t]).join("·")} / ${CAFFEINE_LABEL[profile.caffeine]} / ${profile.purpose.map(p=>PURPOSE_LABEL[p]).join("·")}`;
}

function scoreTea(tea, profile){
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
function matchPercent(tea, profile){
  const maxPossible = 3*2 + 2 + 2*2; // rough ceiling for display
  const s = scoreTea(tea, profile);
  return Math.min(97, Math.round((s / maxPossible) * 100));
}
function rankedTeas(profile){
  return TEAS.slice().sort((a,b)=> scoreTea(b, profile) - scoreTea(a, profile));
}

// ---------------- 체험용 계정 ----------------
// MVP 테스트용이라 비밀번호를 받지 않는다. 닉네임만 이 브라우저에 저장하며
// 실제 인증이 아니므로 서버로 전송되는 정보도 없다.
function getAccounts(){
  try{ return JSON.parse(localStorage.getItem("dahye_accounts") || "[]"); }catch(e){ return []; }
}
function saveAccounts(list){
  try{ localStorage.setItem("dahye_accounts", JSON.stringify(list)); }catch(e){}
}
function currentUser(){
  let id = null;
  try{ id = localStorage.getItem("dahye_session"); }catch(e){ return null; }
  if(!id) return null;
  return getAccounts().find(a => a.id === id) || null;
}
function validateNickname(nickname){
  const name = (nickname || "").trim();
  if(name.length < 2) return { ok:false, error:"닉네임은 2자 이상 입력해 주세요." };
  if(name.length > 12) return { ok:false, error:"닉네임은 12자까지 쓸 수 있어요." };
  return { ok:true, name };
}
function signUp(nickname){
  const v = validateNickname(nickname);
  if(!v.ok) return v;
  const accounts = getAccounts();
  if(accounts.some(a => a.nickname === v.name)){
    return { ok:false, error:"이 브라우저에 같은 닉네임이 이미 있어요. 로그인해 주세요." };
  }
  const account = {
    id: "u-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    nickname: v.name,
    joinedAt: new Date().toISOString().slice(0, 10),
  };
  accounts.push(account);
  saveAccounts(accounts);
  try{ localStorage.setItem("dahye_session", account.id); }catch(e){}
  return { ok:true, account };
}
function signIn(nickname){
  const v = validateNickname(nickname);
  if(!v.ok) return v;
  const account = getAccounts().find(a => a.nickname === v.name);
  if(!account) return { ok:false, error:"이 브라우저에 그 닉네임으로 만든 계정이 없어요." };
  try{ localStorage.setItem("dahye_session", account.id); }catch(e){}
  return { ok:true, account };
}
function signOut(){
  try{ localStorage.removeItem("dahye_session"); }catch(e){}
}

// ---------------- 찜하기 (로컬 저장) ----------------
function getScraps(){
  try{ return JSON.parse(localStorage.getItem("dahye_scraps") || "[]"); }catch(e){ return []; }
}
function isScrapped(id){ return getScraps().includes(id); }
function toggleScrap(id){
  let list = getScraps();
  if(list.includes(id)) list = list.filter(x => x !== id);
  else list.push(id);
  try{ localStorage.setItem("dahye_scraps", JSON.stringify(list)); }catch(e){}
  return list.includes(id);
}

// ---------------- 카드 ----------------
// 샵 그리드 / 큐레이션 추천 / 관련 상품 목록이 공유하는 상품 카드
function teaCardEl(tea, profile){
  const el = document.createElement("a");
  el.className = "tea-card";
  el.href = `product.html?id=${tea.id}`;
  const style = applyCategoryStyle(el, tea.category);
  const badge = profile ? `<span class="match-badge">${matchPercent(tea, profile)}% 일치</span>` : "";
  const thumbFile = tea.images && tea.images[0];
  const photo = thumbFile ? `<img src="${commonsUrl(thumbFile, 480)}" alt="" loading="lazy" onerror="this.remove()">` : "";
  el.innerHTML = `
    <div class="tea-thumb" aria-hidden="true"><span class="thumb-emoji">${style.icon}</span>${photo}${badge}</div>
    <div class="tea-body">
      <div class="name">${tea.name}</div>
      <div class="origin">${tea.origin}</div>
      <div class="tag-row">
        <span class="tag">${tea.category}</span>
        <span class="tag">${CAFFEINE_LABEL[tea.caffeine]}</span>
      </div>
      <div class="tea-price">${formatWon(basePrice(tea))} <span class="price-from">부터</span></div>
    </div>
  `;
  return el;
}

// 커뮤니티 콘텐츠 카드. 좋아요·스크랩은 이 브라우저에만 남는 본인 반응이며 공유 카운트가 아니다.
function postCardEl(post){
  const el = document.createElement("article");
  el.className = "post-card";
  const style = applyCategoryStyle(el, post.category);
  const photo = post.image ? `<img src="${commonsUrl(post.image, 640)}" alt="" loading="lazy" onerror="this.remove()">` : "";
  el.innerHTML = `
    <button type="button" class="post-open" data-post="${post.id}">
      <span class="post-thumb" aria-hidden="true"><span class="thumb-emoji">${style.icon}</span>${photo}</span>
      <span class="post-body">
        <span class="post-cat">${post.category}</span>
        <span class="post-title">${post.title}</span>
        <span class="post-summary">${post.summary}</span>
        <span class="post-meta">다례 팀 · ${post.date} · ${post.readMin}분 분량</span>
      </span>
    </button>
    <div class="post-proof">
      <button type="button" class="proof-btn" data-like="${post.id}" aria-pressed="false">♡ <span>0</span></button>
      <button type="button" class="proof-btn static" data-comment="${post.id}">💬 0</button>
      <button type="button" class="proof-btn" data-scrap-post="${post.id}" aria-pressed="false">🔖 <span>0</span></button>
    </div>
  `;
  return el;
}

// 좋아요/스크랩 토글 — 어느 페이지에서든 같은 방식으로 동작
function wirePostReactions(){
  const state = {};
  document.addEventListener("click", (e)=>{
    const likeBtn = e.target.closest("[data-like]");
    const scrapBtn = e.target.closest("[data-scrap-post]");
    const btn = likeBtn || scrapBtn;
    if(btn){
      const key = (likeBtn ? "like:" : "scrap:") + btn.getAttribute(likeBtn ? "data-like" : "data-scrap-post");
      state[key] = !state[key];
      btn.setAttribute("aria-pressed", state[key] ? "true" : "false");
      const count = btn.querySelector("span");
      if(count) count.textContent = state[key] ? "1" : "0";
      if(likeBtn) btn.firstChild.textContent = state[key] ? "♥ " : "♡ ";
      return;
    }
    if(e.target.closest("[data-comment]") || e.target.closest("[data-post]")){
      toast("콘텐츠 상세 페이지는 다음 업데이트에서 제공됩니다");
    }
  });
}
