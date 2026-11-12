/* ATD Academy — Advanced Case Bank v25
 * Original independent CPTD-style practice. Not official ATD examination content.
 * Every case is a four-stage single-best-decision story.
 * Correct positions are exactly balanced across A-D because each case uses every position once.
 */
(function(){
 "use strict";
 const VERSION="case-v25";
 const STOP=new Set("a an the and or of to in on at for from by with is are was were be been being what which who how should would could can do does did this that these those your their its our before after into about when while than then".split(" "));
 const clean=s=>String(s??"").replace(/\s+/g," ").trim();
 const words=s=>clean(s).toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>2&&!STOP.has(w));
 const short=(s,n=105)=>{s=clean(s).replace(/[.!?]+$/,"");return s.length<=n?s:s.slice(0,n).replace(/\s+\S*$/,"")+"…";};
 const badDistractor=/\b(ignore|hide|blame|unrelated|random|automatically|without discussion|skip all|remove all|never|always|only and ignore|publicly challenge|give less attention|force every|claim success solely)\b/i;
 const titleFor=(m,id)=>m.lessons.find(l=>l[0]===id)?.[1]||m.name;
 function semanticTarget(m,q){
  const source=new Set(words(q.q+" "+q.why+" "+(q.opts?.[q.answer]||"")));
  let best=m.lessons[0]?.[0]||m.id,bestScore=-1;
  for(const l of m.lessons){
   const corpus=words([l[1],l[2],l[3],l[4],l[7]].join(" "));
   let score=0;for(const w of corpus)if(source.has(w))score++;
   if(score>bestScore){bestScore=score;best=l[0];}
  }
  return best;
 }
 function rotate(choices,correctIndex,targetIndex){
  const out=Array(4),offset=(targetIndex-correctIndex+4)%4;
  choices.forEach((x,i)=>out[(i+offset)%4]=x);
  return {choices:out,answer:targetIndex};
 }
 function genericInitialMistakes(topic,action,seed){
  const a=short(action,82),t=short(topic,52);
  const pools=[
   [
    "Use the preferred solution for "+t+" immediately, then evaluate whether "+a+" worked after full rollout.",
    "Collect more opinions about "+t+" but postpone defining the decision criteria, owner, or expected outcome.",
    "Launch a general training response for "+t+" before confirming whether the barrier is knowledge, process, or environment."
   ],
   [
    "Ask the most senior stakeholder to choose the response for "+t+" before comparing the available evidence.",
    "Pilot "+a+" mainly to measure participation and satisfaction, without defining the workplace behavior that should change.",
    "Keep the current approach to "+t+" because changing it now could disrupt the schedule, then review problems at the end."
   ],
   [
    "Select the fastest available response to "+t+" and use later feedback to determine whether the original problem was understood.",
    "Broaden the intervention around "+t+" so every possible concern is covered, even if the target outcome becomes less specific.",
    "Treat manager support for "+a+" as sufficient evidence that the response will work for employees in practice."
   ],
   [
    "Delay the decision about "+t+" until every stakeholder agrees, without setting a decision owner or evidence threshold.",
    "Choose the lowest-cost response to "+t+" first and evaluate effectiveness only if performance remains below target.",
    "Standardize "+a+" across all teams before checking whether local work conditions change the decision."
   ]
  ];
  return pools[seed%pools.length];
 }
 function initialChoices(m,q,target,seed){
  const correct=clean(q.opts?.[q.answer]||"Review the evidence and choose the response that best addresses the stated performance need.");
  const original=(q.opts||[]).filter((_,i)=>i!==q.answer).map(clean).filter(Boolean);
  const fallback=genericInitialMistakes(titleFor(m,target),correct,seed),correctWords=correct.split(/\s+/).length;
  const distractors=[];
  for(let i=0;i<3;i++){
   const candidate=original[i],candidateWords=candidate?candidate.split(/\s+/).length:0;
   const comparable=candidateWords>=Math.max(7,correctWords-5)&&candidateWords<=correctWords+8;
   distractors.push(candidate&&!badDistractor.test(candidate)&&comparable?candidate:fallback[i]);
  }
  return [correct,...distractors];
 }
 function evidenceUpdates(seed,topic,action,why){
  const t=short(topic,58),a=short(action,88),r=short(why,105);
  const stage2=[
   "The team is ready to act, but a frontline manager says the proposed response may conflict with normal workflow. The sponsor still wants a quick decision.",
   "A stakeholder supports the direction, but asks what evidence shows the response addresses the original problem rather than adding activity.",
   "Two affected groups interpret the proposed response differently, and one group says the current plan does not reflect its operating conditions.",
   "The sponsor asks for a faster launch, while the team has not yet tested an assumption behind the proposed response.",
   "A manager agrees with the goal but says the response will require resources that were not considered in the first discussion.",
   "Employees accept the intent, but their examples suggest the original problem may have more than one cause.",
   "The initial recommendation gains support, but a second stakeholder provides evidence that challenges part of the team's first assumption.",
   "The project can proceed, but leaders disagree about who owns the next decision and which evidence should determine success."
  ][seed%8];
  const stage3=[
   "A limited pilot is completed. One indicator improves, but another team reports a new constraint that could affect whether the result transfers.",
   "Early implementation data are mixed: the intended behavior appears in some situations but disappears when workload increases.",
   "The response is used for several weeks. Participation is strong, but the workplace outcome connected to the case is not yet consistently improving.",
   "The first group responds well, while a comparable group using the same approach shows little change in the target outcome.",
   "Managers report that the response is practical, but employees are applying it inconsistently in the situations where it matters most.",
   "Initial data suggest progress, but the team discovers that a process change occurred at the same time and may explain part of the result.",
   "The pilot meets its activity targets, but the evidence on actual performance is incomplete and varies across locations.",
   "The implementation is on schedule, but one unintended consequence appears in a connected team and could offset the original benefit."
  ][(seed+3)%8];
  const stage4=[
   "Leaders are now deciding whether to scale, adjust, or stop the response. They need a defensible conclusion about what changed and what remains uncertain.",
   "The sponsor wants a final recommendation for the next cycle. The team must distinguish confirmed impact from assumptions and decide what to adjust.",
   "The initiative is being considered for wider use. Evidence supports part of the original rationale, but not every expected outcome.",
   "Budget for the next phase is being decided. Leaders need a clear account of results, limitations, ownership, and the next measurement point.",
   "The team must close the pilot and hand off the next phase. Some evidence is encouraging, but the conditions for successful transfer are not yet stable.",
   "Senior leaders request a scale decision. The case now includes positive evidence, unresolved risks, and a need for accountable follow-up.",
   "The next planning cycle begins. The team must decide what to retain, what to modify, and what evidence is still needed before claiming success.",
   "The intervention has reached a decision point. Stakeholders need a transparent recommendation that links the original issue to observed outcomes and remaining gaps."
  ][(seed+5)%8];
  return {stage2:stage2+" Case focus: "+t+".",stage3:stage3+" The original response was: "+a+".",stage4:stage4+" Case focus: "+t+". Decision principle: "+r+"."};
 }
 function stage1Choices(topic,action,seed){
  const t=short(topic,54),a=short(action,82);
  const correct="Confirm the new constraint with affected people, test the assumption behind "+a+", and agree what evidence will justify the next decision.";
  const wrong=[
   "Proceed with "+a+" at full scale because stakeholder support is already available, and review the constraint after rollout.",
   "Replace the response with broad training about "+t+" before determining whether the new concern reflects skill, process, or system conditions.",
   "Pause work on "+t+" until all stakeholders agree on every detail, without defining a decision owner or evidence threshold."
  ];
  if(seed%2) [wrong[0],wrong[2]]=[wrong[2],wrong[0]];
  return [correct,...wrong];
 }
 function stage2Choices(topic,action,seed){
  const t=short(topic,54),a=short(action,82);
  const correct="Compare the new performance evidence with the original outcome and constraint, then modify "+a+" only where the evidence shows a need.";
  const wrong=[
   "Treat positive participation or reaction to "+t+" as sufficient proof that the workplace problem has been solved.",
   "Keep "+a+" unchanged because it was approved at the start, and explain inconsistent results as normal implementation variation.",
   "Change several parts of the response at once so the next result improves faster, without preserving a baseline for comparison."
  ];
  if(seed%3===1) [wrong[0],wrong[1]]=[wrong[1],wrong[0]];
  if(seed%3===2) [wrong[1],wrong[2]]=[wrong[2],wrong[1]];
  return [correct,...wrong];
 }
 function stage3Choices(topic,action,why,seed){
  const t=short(topic,54),a=short(action,75),r=short(why,85);
  const correct="Document the observed impact and its limits, agree the adjustment and owner, and set a follow-up measure tied to "+t+".";
  const wrong=[
   "Scale "+a+" because some evidence is positive, and treat the remaining uncertainty as an issue for the next annual review.",
   "Report the strongest available result as the final outcome for "+t+" and omit limitations that could weaken the conclusion that "+r.toLowerCase()+".",
   "Commission a new general learning initiative before deciding whether the unresolved gap is caused by capability, workflow, incentives, or another condition."
  ];
  if(seed%2) [wrong[1],wrong[2]]=[wrong[2],wrong[1]];
  return [correct,...wrong];
 }
 function buildCase(m,x,caseIndex,globalIndex){
  const q={q:clean(x[0]),opts:(x[1]||[]).map(clean),answer:Number(x[2]),why:clean(x[3])};
  const target=semanticTarget(m,q),topic=titleFor(m,target),action=clean(q.opts[q.answer]),updates=evidenceUpdates(globalIndex,topic,action,q.why);
  const raw=[
   {label:"Diagnose & decide",context:q.q,prompt:"Which response is the strongest first decision in this case?",choices:initialChoices(m,q,target,globalIndex),why:q.why},
   {label:"New stakeholder evidence",context:updates.stage2,prompt:"Which next action best tests whether the proposed response will work under the new constraint?",choices:stage1Choices(topic,action,globalIndex),why:"The new evidence should be tested before the response is scaled or replaced."},
   {label:"Implementation challenge",context:updates.stage3,prompt:"Which decision best uses the implementation evidence now available?",choices:stage2Choices(topic,action,globalIndex),why:"Implementation evidence should be compared with the original outcome and constraints before changes are made."},
   {label:"Evaluate & adjust",context:updates.stage4,prompt:"Which final action best supports a responsible scale, adjust, or stop decision?",choices:stage3Choices(topic,action,q.why,globalIndex),why:"A defensible recommendation separates observed impact from uncertainty and assigns the next action and measure."}
  ];
  const stages=raw.map((s,step)=>{
   const targetIndex=(globalIndex+step)%4;
   const rotated=rotate(s.choices,0,targetIndex);
   return {...s,choices:rotated.choices,answer:rotated.answer};
  });
  return {id:m.id+"-v25-"+(caseIndex+1),moduleId:m.id,target,title:topic,sourceStem:q.q,why:q.why,stages};
 }
 const BANK={};let globalIndex=0;
 for(const m of DATA.modules){
  const src=DATA.advanced?.[m.id]||[];
  if(!src.length)continue;
  BANK[m.id]=src.slice(0,3).map((x,i)=>buildCase(m,x,i,globalIndex++));
 }
 function priorityIds(m){try{return window.ATDRules?.priorityGaps?.(m)||[];}catch{return [];}}
 function gapRelevance(c,m,gaps){
  if(!gaps.length)return 0;
  const caseWords=new Set(words(c.sourceStem+" "+c.why+" "+c.title));
  let best=0;
  for(const id of gaps){
   const l=m.lessons.find(x=>x[0]===id);if(!l)continue;
   const gapWords=words([l[1],l[2],l[3],l[4],l[7]].join(" "));
   let overlap=0;for(const w of gapWords)if(caseWords.has(w))overlap++;
   if(id===c.target)overlap+=20;
   best=Math.max(best,overlap);
  }
  return best;
 }
 function orderedCases(m){
  const gaps=priorityIds(m);
  return (BANK[m.id]||[]).map(c=>({...c,adaptiveScore:gapRelevance(c,m,gaps)}))
   .sort((a,b)=>b.adaptiveScore-a.adaptiveScore||a.id.localeCompare(b.id));
 }
 caseQuestions=function(m){return orderedCases(m);};
 function ensureSession(m){
  if(sess&&sess.stage==="advanced-case-v25"&&sess.mid===m.id)return;
  if(state.caseDraft?.mid===m.id&&state.caseDraft?.version&&state.caseDraft.version!==VERSION){state.legacyCaseDraft=state.caseDraft;delete state.caseDraft;}
  const prev=state.caseDraft;
  sess={mid:m.id,stage:"advanced-case-v25",caseIndex:0,step:0,selected:null,submitted:false,points:0,maxPoints:0,history:[],finished:false,caseVersion:VERSION};
  if(prev?.mid===m.id&&prev.version===VERSION)Object.assign(sess,prev,{finished:false,caseVersion:VERSION});
 }
 function persist(){
  state.caseDraft={mid:sess.mid,stage:sess.stage,caseIndex:sess.caseIndex,step:sess.step,selected:sess.selected,submitted:sess.submitted,points:sess.points,maxPoints:sess.maxPoints,history:sess.history.slice(),version:VERSION};
  save();
 }
 function stageOf(m){const cases=caseQuestions(m),c=cases[sess.caseIndex];return {cases,c,stage:c?.stages?.[sess.step]};}
 showAdvanced=function(m){
  const cases=caseQuestions(m);
  if(!cases.length){$("body").innerHTML='<div class="panel">'+msg("No Advanced Case Bank v25 scenarios are available for this capability.","لا توجد حالات متقدمة v25 لهذه القدرة.")+'</div>';return;}
  ensureSession(m);
  if(sess.finished){showCaseResult(m);return;}
  const {c,stage}=stageOf(m);if(!c||!stage)return;
  const priority=priorityIds(m),isGap=priority.includes(c.target),isAdaptive=!isGap&&priority.length>0&&c.adaptiveScore>0,chosen=sess.selected;
  $("body").innerHTML='<div class="panel qBox advancedV25"><span class="pill">'+msg("ADVANCED · CASE BANK v25","المتقدم · بنك الحالات v25")+'</span>'+
   '<h1>'+msg("Applied Talent Development Decisions","قرارات تطبيقية في تطوير المواهب")+'</h1>'+
   '<p class="muted">'+msg("Each case evolves through four different decisions. Select ONE best response at each stage. Cases related to your unresolved learning gaps are shown first when available.","كل حالة تتطور عبر أربعة قرارات مختلفة. اختر إجابة واحدة هي الأفضل في كل مرحلة. تظهر الحالات المرتبطة بفجواتك غير المغلقة أولاً عندما تكون متاحة.")+'</p>'+
   '<div class="questionMeta"><span>'+msg("Case ","الحالة ")+(sess.caseIndex+1)+" / "+cases.length+" · "+msg("Stage ","المرحلة ")+(sess.step+1)+' / 4</span><span class="skillTag">'+esc(stage.label)+'</span></div>'+
   '<div class="barOuter"><div class="barInner" style="width:'+(100*(sess.caseIndex*4+sess.step+1)/(cases.length*4))+'%"></div></div>'+
   '<div class="advancedCaseTarget"><b>'+esc(c.target+" · "+c.title)+'</b>'+(isGap?'<span>'+msg("Priority gap match","مرتبط بفجوة أولوية")+'</span>':isAdaptive?'<span>'+msg("Prioritized from your gaps","مُرتّب حسب فجواتك")+'</span>':'')+'</div>'+
   '<h2 class="chapter">'+esc(stage.context)+'</h2><h3>'+esc(stage.prompt)+'</h3>'+
   stage.choices.map((opt,i)=>'<button class="answer '+(chosen===i?"selected ":"")+(sess.submitted&&i===stage.answer?"correct ":"")+(sess.submitted&&chosen===i&&i!==stage.answer?"wrong ":"")+'" '+(sess.submitted?"disabled":"")+' onclick="selectAdvancedV25('+i+')"><b>'+String.fromCharCode(65+i)+'.</b> '+esc(opt)+'</button>').join("")+
   (sess.submitted?'<div class="feedback"><b>'+msg("Decision feedback","تفسير القرار")+'</b><p>'+esc(stage.why)+'</p><p><b>'+msg("Best response: ","أفضل استجابة: ")+'</b>'+esc(stage.choices[stage.answer])+'</p><p>'+msg("This stage: ","نتيجة المرحلة: ")+(chosen===stage.answer?"1 / 1":"0 / 1")+'</p></div>':"")+
   '<div class="testTools">'+(sess.submitted?'<button class="btn primary" onclick="advanceAdvancedV25()">'+(sess.caseIndex===cases.length-1&&sess.step===3?msg("Finish cases","إنهاء الحالات"):msg("Continue →","متابعة →"))+'</button>':'<button class="btn primary" '+(chosen===null?"disabled":"")+' onclick="submitAdvancedV25()">'+msg("Submit decision","تأكيد القرار")+'</button>')+
   '<button class="btn" onclick="restartCases()">'+msg("Restart cases","إعادة الحالات")+'</button></div></div>';
 };
 window.selectAdvancedV25=function(i){if(!sess||sess.submitted)return;sess.selected=i;persist();render();};
 window.submitAdvancedV25=function(){
  if(!sess||sess.submitted||sess.selected===null)return;
  const m=DATA.modules.find(x=>x.id===sess.mid),{c,stage}=stageOf(m),correct=sess.selected===stage.answer;
  sess.points+=correct?1:0;sess.maxPoints+=1;
  sess.history.push({caseId:c.id,caseIndex:sess.caseIndex,target:c.target,step:sess.step,choice:sess.selected,answer:stage.answer,correct});
  sess.submitted=true;persist();render();
 };
 window.advanceAdvancedV25=function(){
  if(!sess?.submitted)return;
  const m=DATA.modules.find(x=>x.id===sess.mid),cases=caseQuestions(m);
  if(sess.step<3)sess.step++;
  else if(sess.caseIndex<cases.length-1){sess.caseIndex++;sess.step=0;}
  else{
   sess.finished=true;
   const score=sess.points/Math.max(1,sess.maxPoints),previous=state.attempts?.[m.id+":advanced"];
   if(previous){state.attemptHistory??=[];state.attemptHistory.push({capability:m.id,stage:"advanced",...previous});}
   const a={score,rawPoints:sess.points,maxPoints:sess.maxPoints,questionCount:sess.history.length,caseVersion:VERSION,ts:new Date().toISOString(),history:sess.history.slice(),caseIds:cases.map(x=>x.id),adaptiveTargets:cases.map(x=>x.target)};
   state.attempts[m.id+":advanced"]=a;state.caseHistory??=[];state.caseHistory.push({mid:m.id,...a});
   delete state.caseDraft;state.view="advanced";state.lastResume={mid:m.id,stage:"advanced",completed:true};save();render();showCaseResult(m);return;
  }
  sess.selected=null;sess.submitted=false;persist();render();
 };
 restartCases=function(){delete state.caseDraft;sess=null;save();render();};
 showCaseResult=function(m){
  const a=state.attempts?.[m.id+":advanced"];
  if(!a||a.caseVersion!==VERSION){$("body").innerHTML='<div class="panel">'+msg("No completed Case Bank v25 result found.","لا توجد نتيجة مكتملة لبنك الحالات v25.")+'</div>';return;}
  const cases=caseQuestions(m),byId=new Map(cases.map(x=>[x.id,x]));
  const rows=(a.history||[]).map(h=>{
   const c=byId.get(h.caseId)||cases[h.caseIndex],stage=c?.stages?.[h.step];if(!c||!stage)return "";
   return '<div class="lesson advancedReview"><span class="skillTag">'+msg("Case ","الحالة ")+(h.caseIndex+1)+" · "+msg("Stage ","المرحلة ")+(h.step+1)+'</span>'+
    '<h4>'+esc(c.target+" · "+c.title)+'</h4><p>'+esc(stage.context)+'</p>'+
    '<p><b>'+msg("Your decision: ","قرارك: ")+'</b>'+esc(stage.choices[h.choice]||"—")+'</p>'+
    '<p><b>'+msg("Best response: ","أفضل استجابة: ")+'</b>'+esc(stage.choices[stage.answer])+'</p>'+
    '<div class="feedback">'+esc(stage.why)+'</div></div>';
  }).join("");
  $("body").innerHTML='<div class="panel qBox advancedV25"><span class="pill">'+msg("CASE BANK v25 COMPLETE","اكتمل بنك الحالات v25")+'</span>'+
   '<h1>'+msg("Professional judgment results","نتائج الحكم المهني")+'</h1><div class="score">'+a.rawPoints+" / "+a.maxPoints+'</div>'+
   '<p>'+msg("Score: ","النتيجة: ")+Math.round(a.score*100)+'% · '+msg("Required: above 70%","المطلوب: أعلى من 70%")+'</p>'+
   '<p class="muted">'+msg("This score reflects four-stage simulated decisions. It is independent practice, not an official ATD examination score.","هذه النتيجة تقيس قرارات محاكاة عبر أربع مراحل. وهي تدريب مستقل وليست نتيجة رسمية لامتحان ATD.")+'</p>'+
   rows+'<div class="actionBar"><button class="btn" onclick="atdStartNewAssessment(\''+m.id+'\',\'advanced\')">'+msg("Practice a new v25 attempt","بدء محاولة v25 جديدة")+'</button><button class="btn" onclick="view(\'material\')">'+msg("Open lessons","فتح الدروس")+'</button></div></div>';
 };
 window.ATDAdvancedCaseV25={version:VERSION,bank:BANK,casesFor:orderedCases,semanticTarget,gapRelevance};
})();
