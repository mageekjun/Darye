(function(){

  // 8문항 — 각 항목이 실제 채점에 쓰인다. help는 왜 묻는지 설명.
  const QUESTIONS = [
    { key:"taste", multi:true, max:2, opts:TASTE_OPTS,
      q:"어떤 맛에 끌리세요?",
      help:"최대 2개까지 고를 수 있어요. 가장 크게 반영되는 항목입니다." },
    { key:"body", opts:BODY_OPTS,
      q:"입안에 남는 무게감은 어느 정도가 좋으세요?",
      help:"같은 찻잎도 바디감에 따라 인상이 크게 달라집니다. 물처럼 산뜻한 차와 커피처럼 묵직한 차의 차이예요." },
    { key:"aroma", opts:AROMA_OPTS,
      q:"향은 어느 정도가 좋으세요?",
      help:"향이 강한 차는 첫인상이 좋지만 매일 마시기엔 부담이 될 수 있습니다." },
    { key:"caffeine", opts:CAFFEINE_OPTS,
      q:"카페인은 어떠세요?",
      help:"같은 찻잎이라도 수확 시기와 우리는 온도에 따라 카페인 양이 달라집니다." },
    { key:"time", opts:TIME_OPTS,
      q:"주로 언제 드실 건가요?",
      help:"시간대에 따라 어울리는 차가 다릅니다. 저녁이라면 무카페인 쪽으로 무게를 둡니다." },
    { key:"purpose", multi:true, max:2, opts:PURPOSE_OPTS,
      q:"차를 찾게 된 이유는 무엇인가요?",
      help:"최대 2개까지 고를 수 있어요. 효능 중심으로 추천을 조정합니다." },
    { key:"effort", opts:EFFORT_OPTS,
      q:"우리는 데 얼마나 정성을 들이실 수 있나요?",
      help:"아무리 좋은 차도 손이 많이 가면 결국 손이 안 갑니다. 실제 생활 패턴에 맞춰 고르세요." },
    { key:"level", opts:LEVEL_OPTS,
      q:"차를 얼마나 마셔보셨나요?",
      help:"입문자에게는 호불호가 갈리는 차를 앞세우지 않습니다." },
  ];

  let profile = loadLocalProfile();
  let step = 0;
  let answers = {};

  function resetAnswers(){
    answers = {};
    QUESTIONS.forEach(q => { answers[q.key] = q.multi ? [] : null; });
  }
  resetAnswers();

  // ---------------- 진단 화면 ----------------
  function isAnswered(q){
    const v = answers[q.key];
    return q.multi ? v.length > 0 : !!v;
  }

  function renderStep(){
    const q = QUESTIONS[step];
    const pct = Math.round((step / QUESTIONS.length) * 100);

    $("#quiz-bar").style.width = pct + "%";
    $(".quiz-progress").setAttribute("aria-valuenow", String(pct));
    $("#quiz-count").textContent = `${step + 1} / ${QUESTIONS.length}`;
    $("#quiz-q").textContent = q.q;
    $("#quiz-help").textContent = q.help;
    $("#quiz-options").setAttribute("aria-label", q.q);

    const box = $("#quiz-options");
    box.innerHTML = "";
    q.opts.forEach(opt=>{
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = opt.label;
      const selected = q.multi ? answers[q.key].includes(opt.id) : answers[q.key] === opt.id;
      b.setAttribute("aria-pressed", selected ? "true" : "false");
      b.addEventListener("click", ()=> choose(q, opt.id));
      box.appendChild(b);
    });

    $("#btn-prev").hidden = step === 0;
    $("#btn-next").disabled = !isAnswered(q);
    $("#btn-next").textContent = step === QUESTIONS.length - 1 ? "내 큐레이션 보기" : "다음";
  }

  function choose(q, id){
    if(q.multi){
      const list = answers[q.key];
      const i = list.indexOf(id);
      if(i >= 0) list.splice(i, 1);
      else{
        if(list.length >= q.max) list.shift();
        list.push(id);
      }
      renderStep();
    } else {
      answers[q.key] = id;
      renderStep();
      // 단일 선택은 고르면 바로 다음 문항으로 넘어간다
      setTimeout(next, 220);
    }
  }

  function next(){
    if(!isAnswered(QUESTIONS[step])) return;
    if(step < QUESTIONS.length - 1){
      step += 1;
      renderStep();
      window.scrollTo({ top:0, behavior:"smooth" });
    } else {
      profile = {
        taste: answers.taste.slice(),
        body: answers.body,
        aroma: answers.aroma,
        caffeine: answers.caffeine,
        time: answers.time,
        purpose: answers.purpose.slice(),
        effort: answers.effort,
        level: answers.level,
      };
      saveLocalProfile(profile);
      showResult();
      toast("8가지 기준으로 정렬했어요");
    }
  }

  function prev(){
    if(step === 0) return;
    step -= 1;
    renderStep();
  }

  // ---------------- 결과 화면 ----------------
  function pickCard(tea){
    const wrap = document.createElement("div");
    wrap.className = "pick-item";
    wrap.appendChild(teaCardEl(tea, profile));
    const reasons = matchReasons(tea, profile);
    if(reasons.length){
      const box = document.createElement("div");
      box.className = "reason-row";
      box.innerHTML = reasons.map(r => `<span class="reason-chip">${r}</span>`).join("");
      wrap.appendChild(box);
    }
    return wrap;
  }

  function renderResult(){
    $("#result-summary").textContent = profileSummary(profile);
    const ranked = rankedTeas(profile);
    const picks = $("#top-picks");
    const rest = $("#rest-grid");
    picks.innerHTML = "";
    rest.innerHTML = "";
    ranked.slice(0,3).forEach(t => picks.appendChild(pickCard(t)));
    ranked.slice(3).forEach(t => rest.appendChild(teaCardEl(t, profile)));
  }

  function showQuiz(){
    $("#screen-result").hidden = true;
    $("#screen-quiz").hidden = false;
    renderStep();
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function showResult(){
    $("#screen-quiz").hidden = true;
    $("#screen-result").hidden = false;
    renderResult();
  }

  $("#btn-next").addEventListener("click", next);
  $("#btn-prev").addEventListener("click", prev);
  $("#btn-retake").addEventListener("click", ()=>{
    resetAnswers();
    step = 0;
    showQuiz();
  });

  if(profile) showResult();
  else showQuiz();

})();
