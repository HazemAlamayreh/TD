/* ATD Academy v30 — one source of truth for progression and evidence.
 * Historical attempts stay untouched. Manual completion = studied, not proof that a gap is resolved.
 */
(function(){
 "use strict";
 const VERSION="adaptive-rules-v30";
 const THRESHOLDS=Object.freeze({diagnostic:.80,mastery:.75,advanced:.70});
 const LEVELS=["not-assessed","emerging","developing","proficient","demonstrated"];
 const labels={
  "not-assessed":["Not assessed","غير مقيّم"],
  "emerging":["Emerging","ناشئ"],
  "developing":["Developing","قيد التطوير"],
  "proficient":["Proficient","متقن"],
  "demonstrated":["Demonstrated","مثبت بالتطبيق"]
 };
 const moduleFor=id=>DATA.modules.find(m=>m.lessons.some(l=>l[0]===id));
 function validAttempt(m,stage){
  const a=state.attempts?.[m.id+":"+stage];
  if(!a)return null;
  try{return typeof atdVersionMatches==="function"&&atdVersionMatches(a,stage,m)?a:null;}
  catch{return null;}
 }
 function answeredEvidence(m,stage,id){
  const a=validAttempt(m,stage);
  if(!a||!Array.isArray(a.answers))return {valid:false,total:0,answered:0,correct:0,allCorrect:false,wrong:false};
  let qs=[];try{qs=getQs(m,stage)||[];}catch{return {valid:false,total:0,answered:0,correct:0,allCorrect:false,wrong:false};}
  const indexes=[];qs.forEach((q,i)=>{if(q.target===id)indexes.push(i);});
  if(!indexes.length)return {valid:true,total:0,answered:0,correct:0,allCorrect:false,wrong:false};
  let answered=0,correct=0,wrong=false;
  for(const i of indexes){
   if(a.answers[i]!==undefined&&a.answers[i]!==null)answered++;
   if(a.answers[i]===qs[i].answer)correct++;
   else if(a.answers[i]!==undefined)wrong=true;
  }
  return {valid:true,total:indexes.length,answered,correct,allCorrect:correct===indexes.length,wrong};
 }
 function checkPassed(id){
  try{return typeof lessonCheckPassed==="function"&&lessonCheckPassed(id)===true;}catch{return false;}
 }
 function studied(id){
  return !!(state.manualReviewed?.[id]||state.studiedLessons?.[id]||state.lessonVisits?.[id]||state.done?.[id]);
 }
 function moduleAdvancedPass(m){
  const a=validAttempt(m,"advanced");return !!(a&&typeof a.score==="number"&&a.score>THRESHOLDS.advanced);
 }
 function lessonEvidence(id){
  const m=moduleFor(id);
  if(!m)return {id,level:"not-assessed",resolved:false,studied:false};
  const diagnostic=answeredEvidence(m,"diagnostic",id);
  const mastery=answeredEvidence(m,"mastery",id);
  const check=checkPassed(id),wasStudied=studied(id);
  let level="not-assessed";
  if(mastery.allCorrect&&moduleAdvancedPass(m))level="demonstrated";
  else if(mastery.allCorrect)level="proficient";
  else if(diagnostic.allCorrect||check)level="developing";
  else if(diagnostic.valid||mastery.valid||wasStudied)level="emerging";
  const resolved=LEVELS.indexOf(level)>=LEVELS.indexOf("developing");
  return {id,moduleId:m.id,level,resolved,studied:wasStudied,diagnostic,mastery,checkPassed:check,advancedPassed:moduleAdvancedPass(m)};
 }
 function identifiedGaps(m,stage){
  const a=validAttempt(m,stage);
  if(!a||!Array.isArray(a.answers))return [];
  let qs=[];try{qs=getQs(m,stage)||[];}catch{return [];}
  const ids=[];
  qs.forEach((q,i)=>{
   if(!q?.target||!m.lessons.some(l=>l[0]===q.target))return;
   if(a.answers[i]!==q.answer)ids.push(q.target);
  });
  return [...new Set(ids)];
 }
 function allIdentifiedGaps(m){
  return [...new Set([...identifiedGaps(m,"diagnostic"),...identifiedGaps(m,"mastery")])];
 }
 function priorityGaps(m){
  return allIdentifiedGaps(m).filter(id=>!lessonEvidence(id).resolved);
 }
 function recommendedLessons(m){
  if(!validAttempt(m,"diagnostic"))return [];
  const gaps=priorityGaps(m);
  if(gaps.length)return gaps;
  return m.lessons.filter(l=>{
   const e=lessonEvidence(l[0]);return e.level==="emerging";
  }).map(l=>l[0]).slice(0,3);
 }
 function scorePass(m,stage){
  const a=validAttempt(m,stage);
  return !!(a&&typeof a.score==="number"&&a.score>THRESHOLDS[stage]);
 }
 function canMaster(m){return !!validAttempt(m,"diagnostic")&&identifiedGaps(m,"diagnostic").every(id=>lessonEvidence(id).resolved);}
 function canAdvanced(m){return scorePass(m,"mastery");}
 function moduleStatus(m){
  const evidence=m.lessons.map(l=>lessonEvidence(l[0]));
  const lessons=evidence.length>0&&evidence.every(x=>x.resolved);
  const diag=scorePass(m,"diagnostic"),mastery=scorePass(m,"mastery"),advanced=scorePass(m,"advanced");
  return {diag,mastery,advanced,lessons,completed:diag&&mastery&&advanced&&lessons,evidence};
 }
 function draftProgress(m,stage,total){
  const d=state.draft;
  if(d?.mid!==m.id||d.stage!==stage)return 0;
  return total?Math.min(99,Math.round(100*(d.answers||[]).filter(x=>x!==undefined).length/total)):0;
 }
 function stageProgress(m,stage){
  if(stage==="diagnostic"){
   if(validAttempt(m,stage))return 100;
   let n=0;try{n=getQs(m,stage).length;}catch{}return draftProgress(m,stage,n);
  }
  if(stage==="review"){
   if(!validAttempt(m,"diagnostic"))return 0;
   const gaps=identifiedGaps(m,"diagnostic");
   if(!gaps.length)return 100;
   const done=gaps.filter(id=>lessonEvidence(id).resolved).length;
   return Math.round(100*done/gaps.length);
  }
  if(stage==="material"){
   if(!validAttempt(m,"diagnostic"))return 0;
   if(!m.lessons.length)return null;
   const done=m.lessons.filter(l=>lessonEvidence(l[0]).resolved).length;
   return Math.round(100*done/m.lessons.length);
  }
  if(stage==="mastery"){
   if(validAttempt(m,stage))return 100;
   let n=0;try{n=getQs(m,stage).length;}catch{}return draftProgress(m,stage,n);
  }
  if(stage==="advanced"){
   if(validAttempt(m,stage))return 100;
   const d=state.caseDraft;if(d?.mid!==m.id)return 0;
   let total=1;try{total=Math.max(1,Math.min(3,caseQuestions(m).length)*3);}catch{}
   return Math.min(99,Math.round(100*((d.history||[]).length/total)));
  }
  return 0;
 }
 function stagePassed(m,stage){
  if(stage==="diagnostic")return scorePass(m,stage);
  if(stage==="review")return !!validAttempt(m,"diagnostic")&&identifiedGaps(m,"diagnostic").every(id=>lessonEvidence(id).resolved);
  if(stage==="material")return m.lessons.length>0&&m.lessons.every(l=>lessonEvidence(l[0]).resolved);
  if(stage==="mastery"||stage==="advanced")return scorePass(m,stage);
  return false;
 }
 function stageStatus(m,stage){
  const progress=stageProgress(m,stage),passed=stagePassed(m,stage);
  return {stage,progress,passed,state:passed?"passed":progress===100?"completed-needs-pass":progress>0?"in-progress":"not-started"};
 }
 function profile(m){
  const lessons=m.lessons.map(l=>({...lessonEvidence(l[0]),title:l[1]}));
  return {
   moduleId:m.id,moduleName:m.name,
   lessons,
   identifiedGaps:allIdentifiedGaps(m),
   priorityGaps:priorityGaps(m),
   recommendedLessons:recommendedLessons(m),
   levelCounts:LEVELS.reduce((o,k)=>(o[k]=lessons.filter(x=>x.level===k).length,o),{}),
   module:moduleStatus(m)
  };
 }
 function profileAll(){return DATA.modules.map(profile);}
 function levelLabel(level,lang=state.lang){const x=labels[level]||labels["not-assessed"];return lang==="ar"?x[1]:x[0];}
 window.ATDRules={version:VERSION,thresholds:THRESHOLDS,levels:LEVELS,validAttempt,lessonEvidence,identifiedGaps,priorityGaps,recommendedLessons,canMaster,canAdvanced,moduleStatus,stageProgress,stagePassed,stageStatus,profile,profileAll,levelLabel};
 window.ATD_RULE_THRESHOLDS=THRESHOLDS;
 // Replace later function declarations that are intentionally global/writable.
 try{atdModuleStatus=m=>window.ATDRules.moduleStatus(m);}catch{}
 try{atdStageCompletion=m=>[
  {view:"diagnostic",en:"Diagnostic Exam",ar:"التقييم التشخيصي",progress:stageProgress(m,"diagnostic"),score:validAttempt(m,"diagnostic")?.score,passed:stagePassed(m,"diagnostic")},
  {view:"review",en:"My Review",ar:"مراجعتي",progress:stageProgress(m,"review"),passed:stagePassed(m,"review")},
  {view:"material",en:"Full Material",ar:"المحتوى الكامل",progress:stageProgress(m,"material"),passed:stagePassed(m,"material"),amount:m.lessons.filter(l=>lessonEvidence(l[0]).resolved).length+"/"+m.lessons.length},
  {view:"mastery",en:"Mastery Check",ar:"اختبار الإتقان",progress:stageProgress(m,"mastery"),score:validAttempt(m,"mastery")?.score,passed:stagePassed(m,"mastery")},
  {view:"advanced",en:"Advanced Scenarios",ar:"الحالات المتقدمة",progress:stageProgress(m,"advanced"),score:validAttempt(m,"advanced")?.score,passed:stagePassed(m,"advanced")}
 ];}catch{}
})();
