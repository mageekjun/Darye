(function(){

  let profile = loadLocalProfile();
  let selTaste = [], selCaffeine = null, selPurpose = [];

  if(profile){
    selTaste = profile.taste.slice();
    selCaffeine = profile.caffeine;
    selPurpose = profile.purpose.slice();
  }

  // ---------------- 진단 문항 (레퍼런스 프로토타입 로직 그대로) ----------------
  function renderChips(container, opts, selectedArr, multi, onChange){
    container.innerHTML = "";
    opts.forEach(opt=>{
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = opt.label;
      const pressed = multi ? selectedArr.includes(opt.id) : selectedArr === opt.id;
      b.setAttribute("aria-pressed", pressed ? "true" : "false");
      b.addEventListener("click", ()=>{
        if(multi){
          const idx = selectedArr.indexOf(opt.id);
          if(idx >= 0){ selectedArr.splice(idx,1); }
          else{
            if(selectedArr.length >= 2) selectedArr.shift();
            selectedArr.push(opt.id);
          }
        } else {
          onChange.setVal(opt.id);
        }
        onChange.render();
      });
      container.appendChild(b);
    });
  }

  function renderQuiz(){
    renderChips($("#taste-chips"), TASTE_OPTS, selTaste, true, { render: renderQuiz });
    renderChips($("#caffeine-chips"), CAFFEINE_OPTS, selCaffeine, false, {
      setVal:(v)=>{ selCaffeine = v; }, render: renderQuiz
    });
    renderChips($("#purpose-chips"), PURPOSE_OPTS, selPurpose, true, { render: renderQuiz });

    const ready = selTaste.length > 0 && !!selCaffeine && selPurpose.length > 0;
    $("#btn-submit").disabled = !ready;
  }

  // ---------------- 결과 ----------------
  function renderResult(){
    $("#result-summary").textContent = profileSummary(profile);

    const ranked = rankedTeas(profile);
    const picks = $("#top-picks");
    const rest = $("#rest-grid");
    picks.innerHTML = "";
    rest.innerHTML = "";
    ranked.slice(0,3).forEach(t => picks.appendChild(teaCardEl(t, profile)));
    ranked.slice(3).forEach(t => rest.appendChild(teaCardEl(t, profile)));
  }

  function showQuiz(){
    $("#screen-result").hidden = true;
    $("#screen-quiz").hidden = false;
    renderQuiz();
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function showResult(){
    $("#screen-quiz").hidden = true;
    $("#screen-result").hidden = false;
    renderResult();
  }

  $("#btn-submit").addEventListener("click", ()=>{
    profile = { taste: selTaste.slice(), caffeine: selCaffeine, purpose: selPurpose.slice() };
    saveLocalProfile(profile);
    showResult();
    toast("취향을 반영한 큐레이션이에요");
  });

  $("#btn-retake").addEventListener("click", ()=>{
    selTaste = []; selCaffeine = null; selPurpose = [];
    showQuiz();
  });

  if(profile) showResult();
  else showQuiz();

})();
