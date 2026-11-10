/* ATD Academy v30 — universal lesson design + adaptive learner path.
 * Enriches existing curriculum; it does not invent official ATD source claims.
 */
(function(){
 "use strict";
 const PILOTS=new Set(["1.2","2.2","3.4"]);
 const t=(en,ar)=>state.lang==="ar"?ar:en;
 const e=s=>esc(String(s??""));
 function lessonData(id){const x=lessonFor(id);return x?{m:x.m,l:x.l}:null;}
 function evidence(id){return window.ATDRules?.lessonEvidence(id)||{level:"not-assessed",resolved:false,studied:!!state.done?.[id]};}
 function directDecision(l){
  const q=String(l[4]||"").trim();
  if(q)return q;
  return t("What workplace decision would show this capability in practice?","ما القرار المهني الذي يثبت تطبيق هذه القدرة؟");
 }
 function principle(l){
  return String(l[7]||l[2]||"").trim();
 }
 function bestAction(l){
  return Array.isArray(l[5])&&Number.isInteger(l[6])?String(l[5][l[6]]||"").trim():"";
 }
 function storyText(l){
  const application=String(l[3]||"").trim();
  if(application)return application;
  const best=bestAction(l);
  return t(
   "Talent Development situation: a TD professional must make a decision about "+String(l[1]).toLowerCase()+". A sound response would be: "+best,
   "موقف في تطوير المواهب: يحتاج أخصائي تطوير المواهب لاتخاذ قرار يتعلق بـ«"+String(l[1])+"». الاستجابة الأنسب هي: "+best
  );
 }
 function levelChip(ev){
  const label=window.ATDRules?.levelLabel(ev.level,state.lang)||ev.level;
  return '<span class="adaptiveLevel level-'+e(ev.level)+'">'+e(label)+'</span>';
 }
 function nextEvidenceText(ev){
  if(ev.level==="demonstrated")return t("You have assessment and application evidence for this lesson.","لديك دليل تقييم وتطبيق لهذه الفكرة.");
  if(ev.level==="proficient")return t("Mastery evidence is strong. Advanced application can demonstrate transfer.","دليل الإتقان قوي. التطبيق المتقدم يثبت نقل التعلم.");
  if(ev.resolved)return t("The learning gap is resolved. Continue to Mastery when your pathway is ready.","تم إغلاق فجوة التعلم. انتقل إلى الإتقان عندما يصبح المسار جاهزاً.");
  if(ev.studied)return t("You studied this lesson. Pass the knowledge check to resolve the gap.","درست هذا الدرس. اجتز أسئلة الفهم لإغلاق الفجوة.");
  return t("Use the explanation, workplace situation and knowledge check to build evidence.","استخدم الشرح والموقف العملي وأسئلة الفهم لبناء دليل على التعلم.");
 }
 function teacherPanel(l,ev,isPilot){
  const rationale=principle(l),decision=directDecision(l),best=bestAction(l);
  return '<section class="adaptiveTeacher '+(isPilot?'adaptivePilot':'')+'">'+
   '<div class="adaptiveTeacherTop"><div><span class="adaptiveEyebrow">'+
   (isPilot?t("ADAPTIVE PILOT · TEACHER MODE","تجربة تكيفية · وضع المعلّم"):t("TEACHER MODE","وضع المعلّم"))+
   '</span><h4>'+t("Make the idea easier to use","خلّي الفكرة أسهل للتطبيق")+'</h4></div>'+levelChip(ev)+'</div>'+
   '<div class="adaptiveTeacherGrid">'+
    '<div class="adaptiveMini"><b>1 · '+t("What decision are you learning to make?","ما القرار الذي تتعلم اتخاذه؟")+'</b><p>'+e(decision)+'</p></div>'+
    '<div class="adaptiveMini"><b>2 · '+t("Decision principle","مبدأ القرار")+'</b><p>'+e(rationale)+'</p></div>'+
    '<div class="adaptiveMini"><b>3 · '+t("A good response looks like","كيف تبدو الاستجابة الجيدة؟")+'</b><p>'+e(best||rationale)+'</p></div>'+
   '</div>'+
   '<details class="adaptiveDeep"><summary>'+t("Need more guidance? Open the teacher explanation","بدك مساعدة أكثر؟ افتح شرح المعلّم")+'</summary>'+
    '<div class="adaptiveDeepBody"><p><b>'+t("Use this when:","استخدم الفكرة عندما:")+'</b> '+e(decision.replace(/\?$/,"."))+'</p>'+
    '<ol><li>'+t("Identify the actual workplace outcome or constraint before choosing an intervention.","حدد نتيجة العمل أو القيد الحقيقي قبل اختيار التدخل.")+'</li>'+
    '<li>'+t("Apply the lesson principle to the evidence in the situation—not to a preferred activity.","طبّق مبدأ الدرس على أدلة الموقف، وليس على النشاط المفضل مسبقاً.")+'</li>'+
    '<li>'+t("Check whether the resulting behavior or work evidence improved.","تحقق من تحسن السلوك أو دليل الأداء بعد التطبيق.")+'</li></ol>'+
    '<p class="small muted">'+t("This guidance is built from the lesson's existing concept, question and rationale; it is not an official ATD exam explanation.","هذا الشرح مبني على مفهوم الدرس وسؤاله وتفسيره الموجود في الأكاديمية، وليس شرحاً رسمياً لامتحان ATD.")+'</p></div></details>'+
   '<div class="adaptiveEvidenceNote"><b>'+t("Your evidence status:","حالة الدليل:")+'</b> '+e(nextEvidenceText(ev))+'</div>'+
  '</section>';
 }
 function enhanceLesson(card){
  const id=card.id?.replace(/^lesson-/,"").replace(/-/g,".");
  const data=id&&lessonData(id);if(!data)return;
  const {m,l}=data,ev=evidence(id),isPilot=PILOTS.has(m.id);
  card.classList.toggle("adaptiveResolved",!!ev.resolved);
  card.classList.toggle("adaptiveStudied",!!ev.studied&&!ev.resolved);
  card.classList.toggle("adaptivePriority",window.ATDRules?.priorityGaps(m).includes(id));
  const header=card.querySelector(".row");
  if(header&&!card.querySelector(".adaptiveLessonStatus")){
   const status=document.createElement("div");status.className="adaptiveLessonStatus";
   status.innerHTML=(window.ATDRules?.priorityGaps(m).includes(id)?'<span class="adaptivePriorityTag">'+t("Priority gap","فجوة ذات أولوية")+'</span>':"")+levelChip(ev);
   header.insertAdjacentElement("afterend",status);
  }
  const hook=card.querySelector(".learnblock.hook");
  if(hook){
   const label=hook.querySelector(".learnlabel");
   if(label)label.textContent=t("1 · SIMPLE EXPLANATION","1 · الشرح المبسط");
  }
  const example=card.querySelector(".learnblock.example");
  if(example){
   const label=example.querySelector(".learnlabel");
   if(label)label.textContent=t("2 · TALENT DEVELOPMENT WORKPLACE SITUATION","2 · موقف من بيئة تطوير المواهب");
   // Preserve the existing source-grounded application generated by the curriculum.
  }
  const micro=card.querySelector(".microCheck");
  if(micro){
   const lbl=micro.querySelector(".learnlabel");if(lbl)lbl.textContent=t("4 · CHECK YOUR DECISION","4 · تحقق من قرارك");
  }
  if(!card.querySelector(".adaptiveTeacher")&&!card.querySelector(".eiTeacher")){
   const wrap=document.createElement("div");wrap.innerHTML=teacherPanel(l,ev,isPilot);
   const panel=wrap.firstElementChild;
   if(micro)micro.insertAdjacentElement("beforebegin",panel);
   else (example||hook||header)?.insertAdjacentElement("afterend",panel);
  }
  const footer=card.querySelector(".lessonFooter");
  if(footer){
   const status=footer.querySelector(".status");
   if(status)status.textContent=ev.resolved?
    t("✓ Gap resolved · evidence recorded","✓ تم إغلاق الفجوة · يوجد دليل"):
    ev.studied?t("Studied · knowledge evidence still needed","تمت الدراسة · ما زال دليل الفهم مطلوباً"):
    t("Not yet studied","لم تتم الدراسة بعد");
   const btn=footer.querySelector("button");
   if(btn&&!ev.resolved){
    if(ev.studied){btn.textContent=t("Studied ✓","تمت الدراسة ✓");btn.disabled=true;}
    else {btn.textContent=t("Mark as studied","تحديد كمدروس");btn.disabled=false;}
   }else if(btn&&ev.resolved){btn.textContent=t("Evidence complete ✓","الدليل مكتمل ✓");btn.disabled=true;}
  }
 }
 function enhanceLessonButtons(root,m){
  root.querySelectorAll(".moduleLessonBtn").forEach(button=>{
   const id=button.textContent.match(/\d+\.\d+\.\d+/)?.[0];if(!id)return;
   const ev=evidence(id),priority=window.ATDRules?.priorityGaps(m).includes(id);
   button.classList.toggle("atdLessonCompleted",!!ev.resolved);
   button.classList.toggle("done",!!ev.resolved);
   button.classList.toggle("adaptiveStudiedBtn",!!ev.studied&&!ev.resolved);
   button.classList.toggle("adaptivePriorityBtn",!!priority&&!ev.resolved);
   button.querySelector(".atdDoneMarker")?.remove();
   if(ev.resolved){
    const badge=document.createElement("span");badge.className="atdDoneMarker";badge.textContent=t("✓ Gap resolved","✓ تم الإغلاق");button.append(badge);
   }else if(ev.studied){
    const badge=document.createElement("span");badge.className="adaptiveStudiedMarker";badge.textContent=t("Studied","مدروس");button.append(badge);
   }
  });
 }
 function adaptivePath(m){
  const p=window.ATDRules?.profile(m);if(!p)return "";
  const diag=window.ATDRules.validAttempt(m,"diagnostic");
  let body="";
  if(!diag){
   body='<p>'+t("Start the Diagnostic Exam. The Academy will use your responses to identify which lessons need attention.","ابدأ التقييم التشخيصي. ستستخدم الأكاديمية إجاباتك لتحديد الدروس التي تحتاج تركيزاً.")+'</p>'+
   '<button class="btn primary" onclick="view(\'diagnostic\')">'+t("Start diagnostic","ابدأ التشخيص")+' →</button>';
  }else if(p.priorityGaps.length){
   body='<p>'+t("You do not need to study every lesson equally. Start with these evidence-based priorities:","لا تحتاج دراسة كل الدروس بنفس العمق. ابدأ بهذه الأولويات المبنية على الأدلة:")+'</p>'+
    '<div class="adaptiveRecommendations">'+p.priorityGaps.slice(0,4).map(id=>{const x=lessonData(id);return '<button class="adaptiveRecommendation" onclick="openLesson(\''+id+'\')"><b>'+e(id)+'</b><span>'+e(x?.l[1]||id)+'</span><small>'+e(window.ATDRules.levelLabel(evidence(id).level,state.lang))+'</small></button>';}).join("")+'</div>';
  }else if(!window.ATDRules.canAdvanced(m)){
   body='<p>'+t("No unresolved diagnostic gaps remain. Continue to the Mastery Check to validate your decisions at a higher level.","لا توجد فجوات تشخيصية غير مغلقة. انتقل إلى اختبار الإتقان للتحقق من قراراتك بمستوى أعلى.")+'</p>'+
   '<button class="btn primary" onclick="view(\'mastery\')">'+t("Go to Mastery Check","الانتقال إلى الإتقان")+' →</button>';
  }else{
   body='<p>'+t("Mastery evidence is ready. Use Advanced Scenarios to demonstrate application in workplace decisions.","دليل الإتقان جاهز. استخدم السيناريوهات المتقدمة لإثبات التطبيق في قرارات العمل.")+'</p>'+
   '<button class="btn primary" onclick="view(\'advanced\')">'+t("Open Advanced Scenarios","فتح السيناريوهات المتقدمة")+' →</button>';
  }
  return '<section class="panel adaptivePathPanel"><div class="adaptiveTeacherTop"><div><span class="adaptiveEyebrow">'+t("YOUR ADAPTIVE PATH","مسارك التكيفي")+'</span><h2>'+t("Study what the evidence says you need","ادرس ما تشير الأدلة أنك تحتاجه")+'</h2></div><span class="adaptiveGapCount">'+p.priorityGaps.length+" "+t("priority gaps","فجوات أولوية")+'</span></div>'+body+'</section>';
 }
 function enhanceDashboard(m){
  const root=document.getElementById("body");if(!root||root.querySelector(".adaptivePathPanel"))return;
  const html=adaptivePath(m);if(!html)return;
  const wrap=document.createElement("div");wrap.innerHTML=html;
  const hero=root.querySelector(".dashHero");if(hero)hero.insertAdjacentElement("afterend",wrap.firstElementChild);else root.prepend(wrap.firstElementChild);
  root.querySelectorAll(".gapLine").forEach(line=>{
   const id=line.textContent.match(/\d+\.\d+\.\d+/)?.[0];if(!id)return;
   const ev=evidence(id),status=line.querySelector("span");
   if(status){status.textContent=window.ATDRules.levelLabel(ev.level,state.lang);status.className=ev.resolved?"good":"warn";}
  });
 }
 function enhanceSidebar(){
  document.querySelectorAll("#sidebar .sideBtn").forEach(button=>{
   const id=button.querySelector("b")?.textContent?.trim().match(/^\d+\.\d+/)?.[0],m=DATA.modules.find(x=>x.id===id);if(!m)return;
   const done=window.ATDRules?.moduleStatus(m).completed;
   button.classList.toggle("atdModuleCompleted",!!done);
   const badge=button.querySelector(".atdModuleDoneLabel");
   if(done&&!badge){const b=document.createElement("span");b.className="atdModuleDoneLabel";b.textContent=t("✓ Passed","✓ ناجح");button.append(b);}
   else if(!done&&badge)badge.remove();
  });
 }
 function enhance(){
  if(!window.ATDRules)return;
  const m=typeof mod==="function"?mod():null;if(!m)return;
  if(state.view==="material"){
   const root=document.getElementById("body");if(root){enhanceLessonButtons(root,m);root.querySelectorAll(".lesson").forEach(enhanceLesson);}
  }
  if(state.view==="dashboard")enhanceDashboard(m);
  enhanceSidebar();
 }
 const previous=render;
 render=function(){previous();enhance();};
 window.ATDAdaptiveLearning={enhance,lessonEvidence:evidence};
 render();
})();
