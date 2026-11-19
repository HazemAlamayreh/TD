/* ATD Academy — final assessment localization architecture.
 * IMPORTANT: load this file after every assessment/question-bank transformer.
 * Question banks and assessment logic remain language-neutral; localization is the final presentation layer.
 */
(function(){
 "use strict";

 const VERSION="assessment-i18n-v1";
 const SOURCE_GET_QS=getQs;
 const SOURCE_CASE_QUESTIONS=typeof caseQuestions==="function"?caseQuestions:null;
 const registry={ar:{questions:Object.create(null),questionSlots:Object.create(null),cases:Object.create(null)}};
 const hasArabic=s=>/[\u0600-\u06FF]/.test(String(s??""));
 const copy=x=>Array.isArray(x)?x.slice():x;
 const qaEnabled=()=>{
  try{return new URLSearchParams(location.search).get("i18nqa")==="1";}catch{return false;}
 };

 function lessonTitle(target,fallback){
  const row=typeof AR_LESSONS!=="undefined"&&AR_LESSONS?.[target];
  return state.lang==="ar"&&row?.[0]?row[0]:fallback;
 }

 function register(lang,payload){
  if(!registry[lang])registry[lang]={questions:Object.create(null),questionSlots:Object.create(null),cases:Object.create(null)};
  const bucket=registry[lang];
  for(const [id,value] of Object.entries(payload?.questions||{}))bucket.questions[id]={...(bucket.questions[id]||{}),...value};
  for(const [id,value] of Object.entries(payload?.questionSlots||{}))bucket.questionSlots[id]={...(bucket.questionSlots[id]||{}),...value};
  for(const [id,value] of Object.entries(payload?.cases||{}))bucket.cases[id]={...(bucket.cases[id]||{}),...value};
 }

 function missingQuestionFields(q){
  const missing=[];
  if(!hasArabic(q.title))missing.push("title");
  if(!hasArabic(q.q))missing.push("question");
  if(!Array.isArray(q.opts)||q.opts.some(x=>!hasArabic(x)))missing.push("options");
  if(!hasArabic(q.why))missing.push("explanation");
  return missing;
 }

 function missingCaseFields(c){
  const missing=[];
  if(!hasArabic(c.title))missing.push("title");
  if(!hasArabic(c.situation))missing.push("situation");
  if(!hasArabic(c.decision))missing.push("decision");
  if(!Array.isArray(c.opts)||c.opts.some(x=>!hasArabic(x)))missing.push("options");
  if(!hasArabic(c.why))missing.push("explanation");
  return missing;
 }

 function questionArabicFallback(item,stage,slot){
  const title=lessonTitle(item.target,item.title);
  const summary=(typeof AR_LESSONS!=="undefined"&&AR_LESSONS?.[item.target]?.[1])||"طبّق المفهوم باستخدام أدلة العمل والسياق الفعلي قبل اختيار الإجراء.";
  const correct=stage==="mastery"
   ?"حدّد احتياج العمل والأدلة المتاحة، عالج السبب أو القيد المرتبط بالموقف، ثم اختر إجراءً مناسباً وحدد كيف ستتحقق من النتيجة."
   :"اربط المفهوم باحتياج العمل والأدلة المتاحة، ثم اختر الإجراء الأكثر ملاءمة للسياق قبل التنفيذ.";
  const distractors=stage==="mastery"?[
   "ابدأ بتنفيذ الحل الأكثر شيوعاً مباشرةً، ثم ابحث عن أدلة تؤيده بعد ظهور النتائج.",
   "اعتمد تفضيل صاحب المصلحة الأعلى نفوذاً باعتباره بديلاً عن تحليل الأدلة والسياق.",
   "أجّل أي قرار إلى أن تختفي جميع أوجه عدم اليقين، من دون تحديد تجربة أو معيار للتحقق."
  ]:[
   "اختر الخيار الأكثر شيوعاً حتى لو لم يرتبط مباشرةً باحتياج العمل أو الأدلة.",
   "اعتمد على الانطباع الأول وحده، ثم عدّل القرار فقط إذا ظهرت مشكلة واضحة.",
   "ركّز على سرعة التنفيذ أكثر من فحص السياق والسبب والأدلة المرتبطة بالموقف."
  ];
  const opts=Array(4),answer=Number.isInteger(item.answer)?item.answer:0;
  opts[answer]=correct;let w=0;for(let i=0;i<4;i++)if(i!==answer)opts[i]=distractors[w++];
  const stem=stage==="mastery"
   ?"يعمل مختص تطوير المواهب على «"+title+"». المعطيات الحالية ترتبط بهذه الفكرة: "+summary+" ما الإجراء المهني الأنسب في هذا الموقف؟"
   :(slot%2===0
     ?"أي تطبيق يعكس مفهوم «"+title+"» بصورة أدق في بيئة العمل؟"
     :"في موقف عملي مرتبط بـ«"+title+"»، ما الاستجابة الأكثر اتساقاً مع المبدأ التالي: "+summary);
  return {
   title,
   q:stem,
   opts,
   why:"الإجابة الأقوى تربط القرار بالمفهوم وبالأدلة واحتياج العمل والسياق الفعلي، بدلاً من الاعتماد على التفضيل أو السرعة وحدهما.",
   translationSource:"generated-ar-fallback"
  };
 }

 function localizeQuestion(item,stage,slot){
  if(!item||state.lang!=="ar")return item;
  const slotKey=item.target+"|"+stage+"|"+slot;
  const exact=registry.ar.questions[item.id]||registry.ar.questionSlots[slotKey];
  const t=exact||questionArabicFallback(item,stage,slot);
  const out={...item,
   title:t.title??lessonTitle(item.target,item.title),
   q:t.q??item.q,
   opts:Array.isArray(t.opts)?t.opts.slice():copy(item.opts),
   why:t.why??item.why,
   language:"ar",
   translationSource:t.translationSource||(exact?"authored-ar":"generated-ar-fallback")
  };
  const missing=missingQuestionFields(out);
  if(missing.length){out.translationMissing=missing;out.translationStatus="partial";}
  else {delete out.translationMissing;out.translationStatus="complete";}
  return out;
 }

 function advancedArabicFallback(item){
  const title=lessonTitle(item.target,item.title);
  const summary=(typeof AR_LESSONS!=="undefined"&&AR_LESSONS?.[item.target]?.[1])||"استخدم الأدلة المتاحة لاتخاذ قرار مهني مناسب.";
  const opts=Array(4);
  opts[item.answer]="اربط القرار بالأدلة الفعلية واحتياج العمل، عالج القيد الحالي، وحدد كيف ستتحقق من النتيجة.";
  const wrong=[
   "اختر أسرع استجابة ممكنة واجعل تأييد أصحاب المصلحة المؤشر الرئيسي على نجاح القرار.",
   "اتبع الخيار المفضل لدى أقوى صاحب مصلحة ثم افحص الأدلة فقط إذا ظهرت مشكلة لاحقاً.",
   "أجّل القرار إلى أن تختفي جميع أوجه عدم اليقين من دون تحديد اختبار أو مسؤول أو موعد واضح."
  ];
  let w=0;for(let i=0;i<4;i++)if(i!==item.answer)opts[i]=wrong[w++];
  return {
   title,
   situation:"يعمل فريق تطوير المواهب على «"+title+"». والسياق الحالي يرتبط بهذه الفكرة: "+summary,
   decision:"في ضوء هذا الموقف، ما الإجراء المهني الأنسب الذي ينبغي اتخاذه الآن؟",
   opts,
   why:"الاستجابة الأقوى تربط القرار بالدليل واحتياج العمل الفعلي، وتعالج القيد الحالي، وتحدد طريقة للتحقق من النتيجة."
  };
 }

 function localizeCase(item){
  if(!item||state.lang!=="ar")return item;
  const t=registry.ar.cases[item.id]||advancedArabicFallback(item);
  const out={...item,
   title:t.title??lessonTitle(item.target,item.title),
   situation:t.situation??item.situation,
   decision:t.decision??item.decision,
   opts:Array.isArray(t.opts)?t.opts.slice():copy(item.opts),
   why:t.why??item.why,
   language:"ar"
  };
  const missing=missingCaseFields(out);
  if(missing.length){out.translationMissing=missing;out.translationStatus="partial";}
  else {delete out.translationMissing;out.translationStatus="complete";}
  return out;
 }

 /* Existing Module 1.2 Arabic bank is retained as content, but this layer is now authoritative
    for final localization after CPTD/mastery transformations. */
 function importExistingEI(){
  if(typeof EI_ASSESSMENT_AR==="undefined")return;
  for(const m of DATA.modules){
   if(m.id!=="1.2")continue;
   for(const stage of ["diagnostic","mastery"]){
    const source=SOURCE_GET_QS(m,stage)||[],counts={};
    for(const q of source){
     const n=counts[q.target]||0;counts[q.target]=n+1;
     const row=EI_ASSESSMENT_AR[q.target]?.[stage==="diagnostic"?"d":"m"]?.[n];
     if(row)register("ar",{questions:{[q.id]:{q:row[0],opts:row[1].slice(),why:row[2]}}});
    }
   }
  }
 }
 importExistingEI();

 getQs=function(m,stage){
  const items=SOURCE_GET_QS(m,stage)||[];
  const counts={};
  return state.lang==="ar"?items.map(x=>{const slot=counts[x.target]||0;counts[x.target]=slot+1;return localizeQuestion(x,stage,slot);}):items;
 };

 if(SOURCE_CASE_QUESTIONS){
  caseQuestions=function(m){
   const items=SOURCE_CASE_QUESTIONS(m)||[];
   return state.lang==="ar"?items.map(localizeCase):items;
  };
 }

 function currentMissing(){
  if(state.lang!=="ar")return [];
  if(sess&&["diagnostic","mastery"].includes(sess.stage)){
   const q=sess.qs?.[sess.pos];
   return q?.translationMissing||[];
  }
  if(sess?.stage==="advanced-v26"){
   const m=DATA.modules.find(x=>x.id===sess.mid),c=m&&typeof caseQuestions==="function"?caseQuestions(m)?.[sess.index]:null;
   return c?.translationMissing||[];
  }
  return [];
 }

 function renderQABadge(){
  document.querySelectorAll(".atdI18nQABadge").forEach(x=>x.remove());
  if(!qaEnabled()||state.lang!=="ar")return;
  const missing=currentMissing();if(!missing.length)return;
  const host=document.querySelector(".qBox")||document.getElementById("body");if(!host)return;
  const badge=document.createElement("div");
  badge.className="translationNotice atdI18nQABadge";
  badge.setAttribute("role","status");
  badge.textContent="QA · ترجمة ناقصة: "+missing.join(", ");
  host.prepend(badge);
 }

 function refreshSessionLanguage(){
  if(!sess||!["diagnostic","mastery"].includes(sess.stage))return;
  const m=DATA.modules.find(x=>x.id===sess.mid);if(!m)return;
  const translated=getQs(m,sess.stage);
  if(translated.length===sess.qs.length&&translated.every((q,i)=>q.id===sess.qs[i].id))sess.qs=translated;
 }

 const PREVIOUS_RENDER=render;
 render=function(){
  refreshSessionLanguage();
  document.documentElement.lang=state.lang==="ar"?"ar":"en";
  document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";
  PREVIOUS_RENDER();
  renderQABadge();
 };

 function audit(lang="ar"){
  const previous=state.lang;state.lang=lang;
  const rows=[];
  try{
   for(const m of DATA.modules){
    for(const stage of ["diagnostic","mastery"]){
     for(const q of getQs(m,stage)||[]){
      if(q.translationMissing?.length)rows.push({type:"question",module:m.id,stage,id:q.id,target:q.target,missing:q.translationMissing.slice()});
     }
    }
    if(typeof caseQuestions==="function"){
     for(const c of caseQuestions(m)||[]){
      if(c.translationMissing?.length)rows.push({type:"case",module:m.id,stage:"advanced",id:c.id,target:c.target,missing:c.translationMissing.slice()});
     }
    }
   }
  }finally{state.lang=previous;}
  return rows;
 }

 window.ATDAssessmentI18N={
  version:VERSION,
  register,
  localizeQuestion,
  localizeCase,
  audit,
  qaEnabled,
  registry
 };
 render();
})();