/* CPTD-oriented assessment workflow v24.
   Original authored practice items; not official ATD examination questions. */
const ATD_DIAGNOSTIC_BANK_VERSION="diagnostic-pair-v24";
const ATD_MASTERY_BANK_VERSION="mastery-scenario-v24";
function atdDiagnosticBankVersion(m){return ["1.1","1.3"].includes(m.id)?"diagnostic-quality-v25":ATD_DIAGNOSTIC_BANK_VERSION;}
function atdDiagnosticQuestionSuffix(m){return ["1.1","1.3"].includes(m.id)?"d25":"d24";}
const ATD_PASS={diagnostic:.80,mastery:.75,advanced:.70};
const ATD_OLD_GETQS=getQs;
function atdSelectQuestions(m,stage){
 if(stage==="diagnostic"){
  if(!m.lessons.length)return ATD_OLD_GETQS(m,stage);
  return m.lessons.flatMap(l=>{
   const special=typeof CPTD_EI_ITEMS!=="undefined"?CPTD_EI_ITEMS[l[0]]:null;
   if(special?.d?.length===2)return special.d.map((x,i)=>({id:l[0]+"-"+atdDiagnosticQuestionSuffix(m)+"-"+(i+1),target:l[0],title:l[1],q:x[0],opts:x[1].slice(),answer:x[2],why:x[3],bankVersion:atdDiagnosticBankVersion(m),domain:l[0].split(".")[0],capability:m.id,capabilityStatement:m.id==="1.2"?"1.2.A":null,cognitiveDemand:"Apply / Analyze",difficulty:"Medium"}));
   const q=TWO_QUESTION_BANK[l[0]]||[];
   return q.length===2?q.map((v,i)=>({...v,id:l[0]+"-d24-"+(i+1),target:l[0],title:l[1],opts:v.opts.slice(),bankVersion:ATD_DIAGNOSTIC_BANK_VERSION})):[];
  });
 }
 if(stage==="mastery"){
  return m.lessons.flatMap(l=>{
   const [id,title,concept,work,q,opts,answer,why]=l;
   const special=typeof CPTD_EI_ITEMS!=="undefined"?CPTD_EI_ITEMS[id]:null;
   if(special?.m?.length===2)return special.m.map((x,i)=>({id:id+"-m24-"+(i+1),target:id,title,q:x[0],opts:x[1].slice(),answer:x[2],why:x[3],bankVersion:ATD_MASTERY_BANK_VERSION,capability:m.id,capabilityStatement:m.id==="1.2"?"1.2.A":null,cognitiveDemand:"Analyze / Evaluate",difficulty:"Hard"}));

   if(!Array.isArray(opts)||opts.length!==4||!Number.isInteger(answer))return [];
   const casePrompt="A talent development professional is supporting a workplace initiative involving "+title.toLowerCase()+". "+q+" Which response is MOST appropriate in this situation?";
   const first={id:id+"-m24-1",target:id,title,q:casePrompt,opts:opts.slice(),answer,why,bankVersion:ATD_MASTERY_BANK_VERSION};
   const applied=String(work||"").replace(/\s+/g," ").trim().replace(/[.!?]+$/,"");
   const context="A team is preparing to apply "+title.toLowerCase()+" to a live business challenge. The proposed task is: "+applied+". Before declaring the approach effective, which evidence-based action should the TD professional take?";
   const possibilities=[
    "Define observable success criteria, test the proposed task in its workplace context, and gather credible evidence of behavioral improvement.",
    "Run a carefully scoped pilot and incorporate participant feedback, but postpone checking whether the targeted job behavior changed.",
    "Agree on the intended behavior and obtain management support, but base the effectiveness claim primarily on how useful participants found the activity.",
    "Analyze the available operating data and stakeholder preferences, but scale the intervention before validating the specific performance criteria."
   ];
   const offset=(id.split(".").reduce((n,s)=>n+Number(s||0),0)+1)%4;
   const secondOptions=possibilities.map((_,i)=>possibilities[(i+offset)%4]);
   const second={id:id+"-m24-2",target:id,title,q:context,opts:secondOptions,answer:secondOptions.indexOf(possibilities[0]),why:"The practical standard is observable, job-relevant performance supported by credible evidence, not satisfaction or familiarity alone. Link the decision to "+title+".",bankVersion:ATD_MASTERY_BANK_VERSION};
   return [first,second];
  });
 }
 return ATD_OLD_GETQS(m,stage);
}
getQs=function(m,stage){return atdSelectQuestions(m,stage);};
function atdVersionMatches(a,stage,m){
 if(!a)return false;
 if(stage==="diagnostic")return a.bankVersion===atdDiagnosticBankVersion(m)&&a.questionCount===getQs(m,stage).length;
 if(stage==="mastery")return a.bankVersion===ATD_MASTERY_BANK_VERSION&&a.questionCount===getQs(m,stage).length;
 return a.caseVersion==="case-v24"&&a.questionCount===caseQuestions(m).length*4;
}
function atdDiagnosticCleared(m){
 const a=state.attempts?.[m.id+":diagnostic"];
 if(!atdVersionMatches(a,"diagnostic",m))return new Set();
 const qs=getQs(m,"diagnostic"),passed=new Set();
 for(const l of m.lessons){
  const indices=qs.map((q,i)=>q.target===l[0]?i:-1).filter(i=>i>=0);
  if(indices.length===2&&indices.every(i=>a.answers?.[i]===qs[i].answer))passed.add(l[0]);
 }
 return passed;
}
function atdModuleStatus(m){
 const d=state.attempts?.[m.id+":diagnostic"],ma=state.attempts?.[m.id+":mastery"],ad=state.attempts?.[m.id+":advanced"];
 const diag=atdVersionMatches(d,"diagnostic",m)&&typeof d.score==="number"&&d.score>ATD_PASS.diagnostic;
 const mastery=atdVersionMatches(ma,"mastery",m)&&typeof ma.score==="number"&&ma.score>ATD_PASS.mastery;
 const advanced=atdVersionMatches(ad,"advanced",m)&&typeof ad.score==="number"&&ad.score>ATD_PASS.advanced;
 const lessons=m.lessons.length>0&&m.lessons.every(l=>state.done?.[l[0]]===true||atdDiagnosticCleared(m).has(l[0]));
 return {diag,mastery,advanced,lessons,completed:diag&&mastery&&advanced&&lessons};
}
window.ATDModuleStatus=atdModuleStatus;
function atdRefreshDiagnosticLessons(m){
 const cleared=atdDiagnosticCleared(m);let changed=false;
 state.autoReviewed??={};state.done??={};
 for(const id of cleared){
  if(!state.done[id]){state.done[id]=true;changed=true;}
  if(!state.autoReviewed[id]){state.autoReviewed[id]=true;changed=true;}
 }
 if(changed)save();
}
atdRestoreDiagnosticCompletion=function(m){atdRefreshDiagnosticLessons(m);};
const ATD_V24_ADVANCE_DIAGNOSTIC=advanceDiagnostic;
advanceDiagnostic=function(){
 const completing=!!sess&&sess.stage==="diagnostic"&&sess.pos===sess.qs.length-1&&sess.answers[sess.pos]!==undefined;
 const mid=completing?sess.mid:null;
 ATD_V24_ADVANCE_DIAGNOSTIC();
 if(completing){
  const a=state.attempts[mid+":diagnostic"],m=DATA.modules.find(x=>x.id===mid);
  if(a&&m){
   a.bankVersion=atdDiagnosticBankVersion(m);
   a.questionCount=sess.qs.length;
   atdRefreshDiagnosticLessons(m);
   save();render();
  }
 }
};
const ATD_V24_NEXT=nextQuestion;
nextQuestion=function(){
 const completing=!!sess&&sess.stage==="mastery"&&sess.pos===sess.qs.length-1&&sess.answers[sess.pos]!==undefined;
 const mid=completing?sess.mid:null;
 ATD_V24_NEXT();
 if(completing){
  const a=state.attempts[mid+":mastery"],m=DATA.modules.find(x=>x.id===mid);
  if(a&&m){
   a.bankVersion=ATD_MASTERY_BANK_VERSION;
   a.questionCount=getQs(m,"mastery").length;
   save();render();
  }
 }
};
function atdStartNewAssessment(mid,stage){
 const m=DATA.modules.find(x=>x.id===mid);if(!m)return;
 const key=mid+":"+stage,old=state.attempts?.[key];
 if(old){
  state.legacyAttempts??={};
  state.attemptHistory??=[];
  state.legacyAttempts[key+"@"+(old.bankVersion||"legacy")+"@"+(old.ts||Date.now())]={...old};
  state.attemptHistory.push({capability:mid,stage,...old});
  delete state.attempts[key];
 }
 if(state.draft?.mid===mid&&state.draft?.stage===stage)delete state.draft;
 if(stage==="advanced"&&state.caseDraft?.mid===mid)delete state.caseDraft;
 sess=null;save();view(stage);
}
function atdCompatibilityNotice(m,stage){
 const a=state.attempts?.[m.id+":"+stage];
 if(!a||atdVersionMatches(a,stage,m))return false;
 const title=stage==="diagnostic"?"New two-question-per-lesson Diagnostic":stage==="mastery"?"New scenario-based Mastery Check":"New four-step CPTD-style Advanced Cases";
 const oldMark=typeof a.score==="number"?Math.round(a.score*100)+"%":"—";
 $("body").innerHTML='<section class="panel"><h2>'+esc(title)+'</h2><p>'+msg("Your earlier result ("+oldMark+") is preserved. It was based on a different question bank and cannot be used to clear lessons or certify the new requirements.","نتيجتك السابقة ("+oldMark+") محفوظة، لكنها من بنك أسئلة مختلف ولا يمكن اعتمادها للاجتياز الجديد.")+'</p><p>'+msg("Start the updated assessment to receive a comparable result.","ابدأ التقييم المحدّث للحصول على نتيجة متوافقة.")+'</p><button class="btn primary" onclick="atdStartNewAssessment(\''+m.id+'\',\''+stage+'\')">'+msg("Start updated assessment","ابدأ التقييم الجديد")+'</button></section>';
 return true;
}
const ATD_V24_TEST=testScreen;
testScreen=function(m,stage){
 if(["diagnostic","mastery","advanced"].includes(stage)&&atdCompatibilityNotice(m,stage))return;
 return ATD_V24_TEST(m,stage);
};
const ATD_V24_DIAGNOSTIC_SCREEN=showDiagnosticResult;
showDiagnosticResult=function(m){
 ATD_V24_DIAGNOSTIC_SCREEN(m);
 const a=state.attempts[m.id+":diagnostic"];if(!a)return;
 const cleared=atdDiagnosticCleared(m);
 const box=$("body").querySelector(".qBox");if(!box)return;
 const panel=document.createElement("div");panel.className="panel atdCptdResult";
 panel.innerHTML='<h3>'+msg("Diagnostic learning map","خريطة احتياجات التعلم")+'</h3>'+
 '<p>'+msg("Two correct responses are required to clear an individual lesson. A module requires an overall diagnostic score above 80%, alongside the other assessments, for final completion.","يلزم جوابان صحيحان لاعتماد تجاوز محتوى كل درس. ويجب أن تتجاوز نتيجة التشخيص 80% مع بقية التقييمات لإكمال الموديول نهائياً.")+'</p>'+
 '<div class="atdCptdLessonMap">'+m.lessons.map(l=>{
  const indices=getQs(m,"diagnostic").map((q,i)=>q.target===l[0]?i:-1).filter(i=>i>=0);
  const right=indices.filter(i=>a.answers?.[i]===getQs(m,"diagnostic")[i].answer).length;
  const pass=cleared.has(l[0]);
  return '<div class="'+(pass?"atdCptdCleared":"atdCptdReview")+'"><b>'+esc(l[0]+" "+l[1])+'</b><span>'+right+'/2 · '+(pass?msg("Diagnostic cleared","تم تجاوز التشخيص"):msg("Focus in Full Material","يحتاج مراجعة في المحتوى"))+'</span></div>';
 }).join("")+'</div>';
 box.prepend(panel);
};
const ATD_V24_STAGE_PROGRESS=atdStageCompletion;
atdStageCompletion=function(m){
 const stages=ATD_V24_STAGE_PROGRESS(m),status=atdModuleStatus(m);
 const ca=state.caseDraft;const advanced=stages.find(x=>x.view==="advanced");
 if(advanced&&!state.attempts?.[m.id+":advanced"]&&ca?.mid===m.id&&ca.version==="case-v24"){
  advanced.progress=Math.min(99,Math.round(100*((ca.history||[]).length/Math.max(1,caseQuestions(m).length*4))));
 }
 const values={diagnostic:status.diag,mastery:status.mastery,advanced:status.advanced};
 for(const s of stages)if(Object.hasOwn(values,s.view)){
  s.passed=values[s.view];s.status=s.progress===100?(s.passed?"passed":"below-threshold"):"incomplete";
 }
 return stages;
};
const ATD_V24_RENDER=render;
render=function(){
 ATD_V24_RENDER();
 if(["home","analytics","saved","domain-dashboard"].includes(state.view))return;
 const m=mod(),s=atdModuleStatus(m),cleared=atdDiagnosticCleared(m);
 const currentStage=state.view,a=state.attempts?.[m.id+":"+currentStage];
 const isAssessment=["diagnostic","mastery","advanced"].includes(currentStage);
 if(isAssessment&&a&&atdVersionMatches(a,currentStage,m)){
  const completedBox=$("body")?.querySelector(".qBox");
  if(completedBox&&!completedBox.querySelector(".atdCptdRetake")){
   const wrapper=document.createElement("div");wrapper.className="atdCptdRetake actionBar";
   const passed=currentStage==="diagnostic"?s.diag:currentStage==="mastery"?s.mastery:s.advanced;
   const threshold=Math.round(100*ATD_PASS[currentStage]);
   wrapper.innerHTML='<p class="muted">'+(passed?msg("Required score achieved.","العلامة المطلوبة محققة."):msg("Minimum required: above "+threshold+"%. Your result: "+Math.round(100*a.score)+"%. Try again after targeted study.","المطلوب أعلى من "+threshold+"%. نتيجتك "+Math.round(100*a.score)+"%. راجع المحتوى وأعد المحاولة."))+'</p>'+
    '<button class="btn" onclick="atdStartNewAssessment(\''+m.id+'\',\''+currentStage+'\')">'+msg("Retake (save previous attempt)","إعادة المحاولة مع حفظ السابقة")+'</button>';
   completedBox.append(wrapper);
  }
 }

 const top=$("top");
 const bar=top?.querySelector(".atdPathwayCompact");
 if(bar){
  const old=bar.querySelector(".atdCptdOverall");if(old)old.remove();
  const badge=document.createElement("span");badge.className="atdCptdOverall "+(s.completed?"passed":"pending");
  badge.textContent=s.completed?msg("✓ Module completed","✓ الموديول مكتمل"):msg("Module not yet passed","الموديول لم يجتز المتطلبات");
  bar.append(badge);
  const stages=atdStageCompletion(m);
  bar.querySelectorAll(".atdPathChip").forEach((b,i)=>{
   const x=stages[i];if(!x)return;
   b.classList.toggle("atdCptdPass",x.passed===true);
   b.classList.toggle("atdCptdFail",x.status==="below-threshold");
   if(x.status==="below-threshold")b.title=msg("Assessment submitted; minimum result not met","تم التقييم لكن لم يتحقق الحد المطلوب");
  });
 }
 if(state.view==="material"){
  $("body").querySelectorAll(".moduleLessonBtn").forEach(b=>{
   const id=b.textContent.match(/\d+\.\d+\.\d+/)?.[0];if(!id)return;
   const fully=s.completed&&!!state.done?.[id],clearedOnly=cleared.has(id);
   b.classList.toggle("atdLessonCompleted",fully);
   b.classList.toggle("done",fully);
   b.classList.toggle("atdCptdClearedLesson",!fully&&clearedOnly);
   const marker=b.querySelector(".atdDoneMarker");if(marker)marker.textContent=fully?msg("✓ Completed","✓ مكتمل"):clearedOnly?msg("✓ Diagnostic cleared","✓ تجاوز التشخيص"):msg("Studied","تمت الدراسة");
  });
  $("body").querySelectorAll(".lesson").forEach(card=>{
   const id=card.id?.replace(/^lesson-/,"").replace(/-/g,".");if(!id)return;
   const fully=s.completed&&!!state.done?.[id];
   card.classList.toggle("atdLessonCompleted",fully);
   card.classList.toggle("atdCptdClearedLesson",!fully&&cleared.has(id));
   const flag=card.querySelector(".atdDoneFlag");if(flag)flag.textContent=fully?msg("✓ Completed","✓ مكتمل"):msg("✓ Diagnostic cleared · pending final module","✓ اجتاز التشخيص · بانتظار اعتماد الموديول");
  });
 }
 const nav=document.querySelectorAll("#sidebar .sideBtn");
 for(const b of nav){
  const mid=b.querySelector("b")?.textContent?.match(/^\d+\.\d+/)?.[0];
  const other=DATA.modules.find(x=>x.id===mid);if(!other)continue;
  const complete=atdModuleStatus(other).completed;
  b.classList.toggle("atdModuleCompleted",complete);
  const label=b.querySelector(".atdModuleDoneLabel");if(label&&!complete)label.remove();
 }
};
