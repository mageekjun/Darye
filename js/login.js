(function(){

  // 이미 로그인한 상태면 마이페이지로
  if(currentUser()){
    location.replace("mypage.html");
    return;
  }

  const params = new URLSearchParams(location.search);
  // 이 브라우저에 계정이 하나도 없으면 회원가입부터 보여준다
  let mode = params.get("mode") === "signup" || getAccounts().length === 0 ? "signup" : "login";

  const tabs = $("#auth-tabs");
  const input = $("#nickname");
  const msg = $("#auth-msg");
  const submit = $("#auth-submit");

  function renderMode(){
    $$("[data-mode]", tabs).forEach(b =>
      b.setAttribute("aria-pressed", b.getAttribute("data-mode") === mode ? "true" : "false"));
    submit.textContent = mode === "signup" ? "다례 시작하기" : "로그인";
    input.placeholder = mode === "signup" ? "2~12자" : "가입할 때 쓴 닉네임";
    msg.textContent = "";
    msg.className = "auth-msg";
  }

  function showError(text){
    msg.textContent = text;
    msg.className = "auth-msg is-error";
    input.focus();
  }

  tabs.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-mode]");
    if(!btn) return;
    mode = btn.getAttribute("data-mode");
    renderMode();
  });

  $("#auth-form").addEventListener("submit", (e)=>{
    e.preventDefault();
    const result = mode === "signup" ? signUp(input.value) : signIn(input.value);
    if(!result.ok){
      showError(result.error);
      return;
    }
    // 취향 진단을 아직 안 했다면 가입 직후 자연스럽게 이어준다
    const next = (mode === "signup" && !loadLocalProfile()) ? "curator.html" : "mypage.html";
    location.href = next;
  });

  renderMode();
  input.focus();

})();
