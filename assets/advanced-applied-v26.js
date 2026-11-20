/* ATD Academy — Advanced Applied Judgment v26
 * Five short, single-decision scenarios per capability module.
 * Independent CPTD-style practice; not official ATD exam content.
 */
(function(){
 "use strict";
 const VERSION="case-v26";
 const clean=s=>String(s??"").replace(/\s+/g," ").trim();
 const short=(s,n=150)=>{s=clean(s).replace(/[.!?]+$/,"");return s.length<=n?s:s.slice(0,n).replace(/\s+\S*$/,"")+"…";};
 const STOP=new Set("a an the and or of to in on at for from by with is are was were be been being what which who how should would could can do does did this that these those your their its our before after into about when while than then".split(" "));
 const words=s=>new Set(clean(s).toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)));
 const weak=/\b(ignore|hide|random|automatically|without discussion|skip|remove all|never|always|claim success solely|publicly challenge|give less attention)\b/i;
 function rotate(opts,answer,target){const out=Array(4),off=(target-answer+4)%4;opts.forEach((x,i)=>out[(i+off)%4]=x);return {opts:out,answer:target};}
 function titleFor(m,id){return m.lessons.find(l=>l[0]===id)?.[1]||m.name;}
 function targetFor(m,text){
  const src=words(text);let best=m.lessons[0]?.[0]||m.id,bestScore=-1;
  for(const l of m.lessons){const corpus=words([l[1],l[2],l[3],l[4],l[7]].join(" "));let s=0;for(const w of corpus)if(src.has(w))s++;if(s>bestScore){bestScore=s;best=l[0];}}
  return best;
 }
 function fallback(topic,seed){
  const t=short(topic,55);
  const sets=[
   ["Use the option preferred by the strongest stakeholder, then check later whether it addressed "+t+".","Choose the fastest feasible response to "+t+" and use participation as the main early success signal.","Delay the decision on "+t+" until more information arrives, without defining what evidence would be enough."],
   ["Apply one standard response to "+t+" across all groups so implementation stays consistent.","Select the lowest-cost response to "+t+" and investigate effectiveness after the first full cycle.","Rely on manager support for the response to "+t+" as the main indication that it will work in practice."],
   ["Expand the response to cover several related issues around "+t+" before confirming which issue drives the result.","Keep the current plan for "+t+" because changing direction could affect the timeline, then review evidence at the end.","Ask stakeholders to vote on the response to "+t+" before agreeing on decision criteria."]
  ];
  return sets[seed%sets.length];
 }
 function sourceChoices(q,topic,seed){
  const opts=(q[1]||[]).map(clean),ans=Number(q[2]),correct=opts[ans]||"Use the available evidence to address the actual workplace need.";
  const wrong=opts.filter((_,i)=>i!==ans),fb=fallback(topic,seed),cw=correct.split(/\s+/).length;
  const ds=wrong.slice(0,3).map((x,i)=>x&&!weak.test(x)&&x.split(/\s+/).length>=Math.max(6,cw-7)?x:fb[i]);
  return [correct,...ds];
 }
 function baseCase(m,q,index,g){
  const target=targetFor(m,q[0]+" "+q[3]+" "+(q[1]?.[q[2]]||"")),topic=titleFor(m,target),choices=sourceChoices(q,topic,g),r=rotate(choices,0,g%4);
  return {id:m.id+"-v26-"+(index+1),target,title:topic,situation:clean(q[0]),decision:"What is the best decision for the Talent Development professional in this situation?",opts:r.opts,answer:r.answer,why:clean(q[3]||"The best response is the one most directly aligned with the evidence and intended workplace outcome.")};
 }
 function extraCase(m,item,index,g){
  const target=item.target||targetFor(m,item.q+" "+item.why),l=m.lessons.find(x=>x[0]===target),topic=titleFor(m,target),work=short(l?.[3]||l?.[2]||item.q,150);
  const complications=["The sponsor wants a quick decision, but one important assumption has not yet been verified.","A stakeholder supports the goal but raises a practical constraint that could affect implementation.","The first evidence looks positive, but a second indicator points to a different interpretation.","The business need is urgent, but the team must still make a fair and defensible decision.","The preferred approach is feasible, but it has not yet been tested in normal operating conditions."];
  const correct=short(item.opts?.[item.answer]||"Use the evidence to address the actual performance need",100);
  const base=["Use "+correct.charAt(0).toLowerCase()+correct.slice(1)+", and define the evidence that will confirm whether the decision worked.","Choose the fastest workable response to "+short(topic,48)+", and use stakeholder support as the main signal that the decision was appropriate.","Use the sponsor's preferred response to "+short(topic,48)+", then investigate the underlying evidence if results remain inconsistent.","Delay the decision on "+short(topic,48)+" until every uncertainty is removed, without setting a time-bound test or decision owner."];
  const r=rotate(base,0,g%4);
  return {id:m.id+"-v26-"+(index+1),target,title:topic,situation:"A Talent Development team is working on "+topic.toLowerCase()+". The current work is: "+work+". "+complications[g%complications.length],decision:"Given this constraint, what should the Talent Development professional do next?",opts:r.opts,answer:r.answer,why:"The strongest response keeps the decision tied to the actual evidence, addresses the constraint, and defines how the result will be checked."};
 }
 const BANK={};let global=0;
 for(const m of DATA.modules){
  const list=[];
  for(const q of (DATA.advanced?.[m.id]||[]).slice(0,3))list.push(baseCase(m,q,list.length,global++));
  const mastery=(getQs(m,"mastery")||[]).filter(x=>x?.target),used=new Set(list.map(x=>x.target));
  const pool=[...mastery.filter(x=>!used.has(x.target)),...mastery];
  for(const item of pool){if(list.length>=5)break;list.push(extraCase(m,item,list.length,global++));used.add(item.target);}
  while(list.length<5&&mastery.length){const item=mastery[list.length%mastery.length];list.push(extraCase(m,item,list.length,global++));}
  BANK[m.id]=list.slice(0,5);
 }
 function gaps(m){try{return window.ATDRules?.priorityGaps?.(m)||[];}catch{return [];}}
 function rel(c,m,ids){if(!ids.length)return 0;if(ids.includes(c.target))return 100;const cw=words(c.situation+" "+c.title);let best=0;for(const id of ids){const l=m.lessons.find(x=>x[0]===id);if(!l)continue;const lw=words([l[1],l[2],l[3],l[4]].join(" "));let n=0;for(const w of lw)if(cw.has(w))n++;best=Math.max(best,n);}return best;}
 caseQuestions=function(m){const ids=gaps(m);return (BANK[m.id]||[]).map(c=>({...c,adaptiveScore:rel(c,m,ids)})).sort((a,b)=>b.adaptiveScore-a.adaptiveScore||a.id.localeCompare(b.id));};
 function ensure(m){
  if(sess&&sess.stage==="advanced-v26"&&sess.mid===m.id)return;
  if(state.caseDraft?.mid===m.id&&state.caseDraft?.version&&state.caseDraft.version!==VERSION){state.legacyCaseDraft=state.caseDraft;delete state.caseDraft;}
  const d=state.caseDraft;
  sess={mid:m.id,stage:"advanced-v26",index:0,selected:null,submitted:false,points:0,history:[],finished:false,version:VERSION};
  if(d?.mid===m.id&&d.version===VERSION)Object.assign(sess,d,{finished:false});
 }
 function persist(){state.caseDraft={mid:sess.mid,stage:sess.stage,index:sess.index,selected:sess.selected,submitted:sess.submitted,points:sess.points,history:sess.history.slice(),version:VERSION};save();}
 showAdvanced=function(m){
  const cases=caseQuestions(m);ensure(m);if(sess.finished){showCaseResult(m);return;}
  const c=cases[sess.index];if(!c)return;const ids=gaps(m),matched=ids.includes(c.target),related=!matched&&ids.length>0&&c.adaptiveScore>0;
  const h=[];
  h.push('<div class="panel qBox advancedV26">');
  h.push('<span class="pill">'+msg("APPLIED JUDGMENT · ADVANCED v26","الحكم التطبيقي · المتقدم v26")+'</span>');
  h.push('<h1>'+msg("Workplace Decision Challenge","تحدي قرار من بيئة العمل")+'</h1>');
  h.push('<p class="muted">'+msg("Five short scenarios. One clear decision in each. Choose the best professional response.","خمس حالات قصيرة. قرار واضح واحد في كل حالة. اختر أفضل استجابة مهنية.")+'</p>');
  h.push('<div class="questionMeta"><span>'+msg("Scenario ","الحالة ")+(sess.index+1)+' / 5</span><span class="skillTag">'+esc(c.target+" · "+c.title)+'</span></div>');
  h.push('<div class="barOuter"><div class="barInner" style="width:'+((sess.index+1)*20)+'%"></div></div>');
  if(matched||related)h.push('<div class="advancedCaseTarget"><b>'+esc(c.title)+'</b><span>'+msg(matched?"Priority gap match":"Prioritized from your gaps",matched?"مرتبط بفجوة أولوية":"مُرتّب حسب فجواتك")+'</span></div>');
  h.push('<div class="advancedSituation"><span>'+msg("SITUATION","الموقف")+'</span><p>'+esc(c.situation)+'</p></div>');
  h.push('<h2 class="advancedDecision">'+esc(c.decision)+'</h2>');
  c.opts.forEach((o,i)=>h.push('<button class="answer '+(sess.selected===i?"selected ":"")+(sess.submitted&&i===c.answer?"correct ":"")+(sess.submitted&&sess.selected===i&&i!==c.answer?"wrong ":"")+'" '+(sess.submitted?"disabled":"")+' onclick="selectAdvancedV26('+i+')"><b>'+String.fromCharCode(65+i)+'.</b> '+esc(o)+'</button>'));
  if(sess.submitted)h.push('<div class="feedback"><b>'+msg("Why?","لماذا؟")+'</b><p>'+esc(c.why)+'</p><p><b>'+msg("Best decision: ","أفضل قرار: ")+'</b>'+esc(c.opts[c.answer])+'</p></div>');
  h.push('<div class="testTools">');
  if(sess.submitted)h.push('<button class="btn primary" onclick="nextAdvancedV26()">'+(sess.index===4?msg("Finish","إنهاء"):msg("Next scenario →","الحالة التالية →"))+'</button>');
  else h.push('<button class="btn primary" '+(sess.selected===null?"disabled":"")+' onclick="submitAdvancedV26()">'+msg("Submit decision","تأكيد القرار")+'</button>');
  h.push('<button class="btn" onclick="restartCases()">'+msg("Restart","إعادة البدء")+'</button></div></div>');
  $("body").innerHTML=h.join("");
 };
 window.selectAdvancedV26=i=>{if(!sess||sess.submitted)return;sess.selected=i;persist();render();};
 window.submitAdvancedV26=()=>{if(!sess||sess.submitted||sess.selected===null)return;const m=DATA.modules.find(x=>x.id===sess.mid),c=caseQuestions(m)[sess.index],ok=sess.selected===c.answer;sess.points+=ok?1:0;sess.history.push({caseId:c.id,index:sess.index,target:c.target,choice:sess.selected,answer:c.answer,correct:ok});sess.submitted=true;persist();if(sess.index===4){window.nextAdvancedV26();}else{render();}};
 window.nextAdvancedV26=()=>{
  if(!sess?.submitted)return;const m=DATA.modules.find(x=>x.id===sess.mid),cases=caseQuestions(m);
  if(sess.index<4){sess.index++;sess.selected=null;sess.submitted=false;persist();render();return;}
  const score=sess.points/5,previous=state.attempts?.[m.id+":advanced"];
  if(previous){state.attemptHistory??=[];state.attemptHistory.push({capability:m.id,stage:"advanced",...previous});}
  const a={score,rawPoints:sess.points,maxPoints:5,questionCount:5,caseVersion:VERSION,ts:new Date().toISOString(),history:sess.history.slice(),caseIds:cases.map(x=>x.id),adaptiveTargets:cases.map(x=>x.target)};
  state.attempts[m.id+":advanced"]=a;state.caseHistory??=[];state.caseHistory.push({mid:m.id,...a});delete state.caseDraft;sess.finished=true;state.view="advanced";state.lastResume={mid:m.id,stage:"advanced",completed:true};save();showCaseResult(m);
 };
 restartCases=function(){delete state.caseDraft;sess=null;save();render();};
 showCaseResult=function(m){
  const a=state.attempts?.[m.id+":advanced"];if(!a||a.caseVersion!==VERSION){$("body").innerHTML='<div class="panel">'+msg("No Advanced v26 result found.","لا توجد نتيجة Advanced v26.")+'</div>';return;}
  const cases=caseQuestions(m),map=new Map(cases.map(x=>[x.id,x])),h=[];
  h.push('<div class="panel qBox advancedV26"><span class="pill">'+msg("ADVANCED v26 COMPLETE","اكتمل Advanced v26")+'</span><h1>'+msg("Applied Judgment Result","نتيجة الحكم التطبيقي")+'</h1><div class="score">'+a.rawPoints+' / 5</div><p>'+msg("Score: ","النتيجة: ")+Math.round(a.score*100)+'% · '+msg("Required: above 70%","المطلوب: أعلى من 70%")+'</p>');
  (a.history||[]).forEach((x,i)=>{const c=map.get(x.caseId)||cases[x.index];if(!c)return;h.push('<div class="lesson advancedReview"><span class="skillTag">'+msg("Scenario ","الحالة ")+(i+1)+'</span><h4>'+esc(c.target+" · "+c.title)+'</h4><p>'+esc(c.situation)+'</p><p><b>'+msg("Your decision: ","قرارك: ")+'</b>'+esc(c.opts[x.choice]||"—")+'</p><p><b>'+msg("Best decision: ","أفضل قرار: ")+'</b>'+esc(c.opts[c.answer])+'</p><div class="feedback">'+esc(c.why)+'</div></div>');});
  h.push('<div class="actionBar"><button class="btn" onclick="atdStartNewAssessment(\''+m.id+'\',\'advanced\')">'+msg("Try five scenarios again","أعد تجربة الحالات الخمس")+'</button><button class="btn" onclick="view(\'material\')">'+msg("Open lessons","فتح الدروس")+'</button></div></div>');
  $("body").innerHTML=h.join("");
 };
 window.ATDAdvancedV26={version:VERSION,bank:BANK,casesFor:caseQuestions};
})();