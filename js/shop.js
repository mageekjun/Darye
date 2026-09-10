// 홈 화면과 상품 상세 페이지가 함께 쓰는 공통 로직 (카테고리 스타일, 매칭 스코어링, 카드 렌더링)

const CATEGORY_STYLE = {
  "녹차":     { icon:"🍵", accent:"#2e5339", light:"#e4ece3" },
  "발효차":   { icon:"🫖", accent:"#6b4a2f", light:"#ecdfd0" },
  "우롱차":   { icon:"🍂", accent:"#8a6a2f", light:"#f0e6cf" },
  "홍차":     { icon:"☕", accent:"#b1502e", light:"#f3e2d8" },
  "화차":     { icon:"🌸", accent:"#a15a7a", light:"#f2e0ea" },
  "과일청차": { icon:"🍊", accent:"#c07a1e", light:"#f7e6cc" },
  "허브차":   { icon:"🌿", accent:"#3f7a52", light:"#e1efe4" },
};

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

function formatWon(price){
  return price.toLocaleString("ko-KR") + "원";
}

// 목록 카드에 쓰는 기준가 — 가장 싼 용량의 가격
function basePrice(tea){
  return Math.min(...tea.options.map(o => o.price));
}

function applyCategoryStyle(el, category){
  const s = CATEGORY_STYLE[category] || { icon:"🍵", accent:"#2e5339", light:"#e4ece3" };
  el.style.setProperty("--accent", s.accent);
  el.style.setProperty("--accent-light", s.light);
  return s;
}

function loadLocalProfile(){
  try{
    const raw = localStorage.getItem("dahye_profile");
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function saveLocalProfile(p){
  try{ localStorage.setItem("dahye_profile", JSON.stringify(p)); }catch(e){}
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

// 샵 그리드 / 큐레이션 추천 / 관련 상품 목록이 공유하는 카드. 클릭하면 상품 상세 페이지로 이동한다.
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
