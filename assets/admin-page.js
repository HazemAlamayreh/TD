import {analyzeLearnerSkills,cohortSkillSummary,skillDefinitions} from "./skill-analytics.js?v=20261110-skills-v1";
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getFirestore,doc,getDoc,getDocs,collection} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
const app=initializeApp({apiKey:"AIzaSyBxuLsolggWnoGuTASnnWvz7OwvRdnIxZE",authDomain:"atd-master-talent-development.firebaseapp.com",projectId:"atd-master-talent-development",appId:"1:882331359053:web:a51c003529af5ae9c90904"});
const auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const asDate=v=>v?.toDate?.()||(typeof v==="string"||typeof v==="number"?new Date(v):null);
const dateLabel=v=>{const d=asDate(v);return d&&!isNaN(d.valueOf())?d.toLocaleString():"—"};
const pct=v=>typeof v==="number"&&Number.isFinite(v)?Math.round(v*100)+"%":"—";
const hrs=s=>typeof s==="number"&&s>0?(s>=3600?(s/3600).toFixed(1)+" h":Math.ceil(s/60)+" min"):"Not tracked";
const modules=Array.isArray(window.ATD_COURSE_MODULES)?window.ATD_COURSE_MODULES:[];
const lessonTotal=modules.reduce((n,m)=>n+m.lessons.length,0);
const stages={diagnostic:"Diagnostic",mastery:"Mastery",advanced:"Advanced case"};
let current=null,learners=[],filter="",epoch=0,loading=false;
const ALL_QUESTIONS="Question-level details are available only for attempts synchronized with the updated evidence capture. Historical records without saved question snapshots cannot be reconstructed reliably.";
function access(title,description){$("dashboard").classList.add("hidden");$("access").classList.remove("hidden");$("access").innerHTML="<h2>"+esc(title)+"</h2><p>"+esc(description)+"</p><a href='./'>Sign in at the Academy</a>";}
function status(s,error=false){$("status").textContent=s;$("status").classList.toggle("error",error);}
function moduleSummary(x){return modules.map(m=>{const completed=m.lessons.filter(l=>x.lessonIds.has(l[0])).length;const mastered=m.lessons.filter(l=>x.masteryIds.has(l[0])).length;return {id:m.id,name:m.name,completed,total:m.lessons.length,mastered,finished:m.lessons.length>0&&completed===m.lessons.length};});}
function getStats(x){
 const m=moduleSummary(x),attempts=x.attempts.slice().sort((a,b)=>Number(asDate(a.ts)?.valueOf()||0)-Number(asDate(b.ts)?.valueOf()||0));
 const first=new Map();for(const a of attempts)if(a.assessmentKey&&!first.has(a.assessmentKey))first.set(a.assessmentKey,a);
 const initial=[...first.values()],passing=initial.filter(a=>Number(a.score)>=.8).length,failed=initial.filter(a=>typeof a.score==="number"&&a.score<.8).length;
 const validScores=attempts.map(a=>a.score).filter(v=>typeof v==="number"&&Number.isFinite(v));
 const questionEvidence=attempts.flatMap(a=>Array.isArray(a.questionSnapshots)?a.questionSnapshots:[]);
 const answered=questionEvidence.filter(q=>Number.isInteger(q.selectedIndex)),correct=answered.filter(q=>q.selectedIndex===q.correctIndex),incorrect=answered.filter(q=>q.selectedIndex!==q.correctIndex);
 const seen=new Set(),firstItem={right:0,wrong:0};
 for(const a of attempts)if(Array.isArray(a.questionSnapshots))for(const q of a.questionSnapshots){const key=a.assessmentKey+"/"+q.id;if(seen.has(key))continue;seen.add(key);if(!Number.isInteger(q.selectedIndex))continue;if(q.correctIndex===q.selectedIndex)firstItem.right++;else firstItem.wrong++;}
 return {modules:m,modulesComplete:m.filter(a=>a.finished).length,completed:x.lessonIds.size,mastered:x.masteryIds.size,firstPass:passing,firstFail:failed,firstAssessed:initial.length,scoreCount:validScores.length,scoreAverage:validScores.length?validScores.reduce((s,v)=>s+v,0)/validScores.length:null,questionEvidence:questionEvidence.length,answered:answered.length,correct:correct.length,incorrect:incorrect.length,skipped:questionEvidence.filter(q=>q.selectedIndex===null).length,firstItem};
}
function filtered(){return learners.filter(x=>(x.name+" "+x.email+" "+x.uid).toLowerCase().includes(filter.toLowerCase()));}
function metrics(){
 const s=learners.reduce((r,x)=>{const a=getStats(x);r.lessons+=a.completed;r.modules+=a.modulesComplete;r.attempts+=x.attempts.length;r.minutes+=x.seconds;r.firstPass+=a.firstPass;return r;},{lessons:0,modules:0,attempts:0,minutes:0,firstPass:0});
 const cards=[["Synced learners",learners.length],["Completed lessons",s.lessons],["Modules completed",s.modules],["Assessment attempts",s.attempts],["First assessments ≥80%",s.firstPass],["Foreground time tracked",hrs(s.minutes)]];
 $("metrics").innerHTML=cards.map(([name,value])=>'<div class="metric"><strong>'+esc(value)+'</strong>'+esc(name)+'</div>').join("");
}
function render(){
 const found=filtered();$("learnerRows").innerHTML=found.length?found.map(x=>{const a=getStats(x);return '<tr><td><b>'+esc(x.name||"Unnamed learner")+'</b><div class="small muted">'+esc(x.email||"No email")+'</div><div class="small muted">'+esc(x.uid)+'</div></td><td>'+a.completed+' / '+lessonTotal+'</td><td>'+a.mastered+'</td><td>'+x.attempts.length+'</td><td>'+pct(a.scoreAverage)+'</td><td>'+a.modulesComplete+' / '+modules.length+'</td><td>'+a.firstPass+' / '+a.firstAssessed+'</td><td>'+esc(hrs(x.seconds))+'</td><td><button data-learner="'+esc(x.uid)+'">Full report</button></td></tr>'}).join(""):'<tr><td colspan="9" class="empty">No learners match your search.</td></tr>';
 $("learnerRows").querySelectorAll("[data-learner]").forEach(b=>b.onclick=()=>detail(b.dataset.learner));
}

function skillModel(x){return analyzeLearnerSkills(x.attempts,modules);}
function skillCard(r){
 const score=r.rate===null?"—":Math.round(100*r.rate)+"%",sample=r.answered;
 const tone=r.band==="Observed strength"?"strong":r.band==="Development priority"?"priority":"";
 return '<div class="skillCard"><div class="skillCardHeader"><h4>'+esc(r.label)+'</h4><strong>'+esc(score)+'</strong></div>'+
 '<div class="skillMeter '+tone+'"><span style="width:'+(r.rate===null?0:Math.round(100*r.rate))+'%"></span></div>'+
 '<div class="skillFootnote"><span class="skillTag">'+esc(r.band)+'</span> · '+sample+' answered item'+(sample===1?'':'s')+
 ' · '+r.correct+' correct · '+r.wrong+' incorrect · '+r.skipped+' skipped</div>'+
 '<div class="skillFootnote">'+esc(r.coverage)+' · '+r.lessonIds.length+' lesson areas · Diagnostic '+r.diagnostic+' / Mastery '+r.mastery+'</div></div>';
}
function skillDetail(x){
 const model=skillModel(x),tested=model.rows.filter(r=>r.answered>0||r.skipped>0);
 const sorted=tested.sort((a,b)=>(b.answered-a.answered)||a.label.localeCompare(b.label));
 const summary='<div class="metrics"><div class="metric"><strong>'+model.available+'</strong>Unique scored / skipped items</div>'+
 '<div class="metric"><strong>'+model.scorable.length+'</strong>Skills with ≥4 answered items</div>'+
 '<div class="metric"><strong>'+model.strength.length+'</strong>Observed strengths</div>'+
 '<div class="metric"><strong>'+model.priorities.length+'</strong>Development priorities</div></div>';
 const takeaways=model.priorities.length?
  '<h4 class="skillSubhead">Suggested development focus</h4>'+model.priorities.slice(0,5).map(s=>
    '<p><b>'+esc(s.label)+'</b> · '+Math.round(100*s.rate)+'% from '+s.answered+' items. Review '+esc(s.examples.map(x=>x.lessonId+' '+x.lessonTitle).slice(0,3).join("; ")||"related material")+'</p>').join("")
  :'<p class="muted">No skill area has enough low-scoring evidence to flag as a development priority yet.</p>';
 const advanced=model.advanced.length?'<h4 class="skillSubhead">Advanced decision-making evidence (separate metric)</h4>'+
  '<div class="scroll"><table><thead><tr><th>Skill area</th><th>Module</th><th>Case steps</th><th>Decision points score</th></tr></thead><tbody>'+
  model.advanced.map(a=>'<tr><td>'+esc(a.label)+'</td><td>'+esc(a.mid)+'</td><td>'+a.steps+'</td><td>'+Math.round(a.rate*100)+'%</td></tr>').join("")+'</tbody></table></div>':'';
 return '<section class="detailSection"><h3>Workplace Skill Profile</h3><div class="skillLegend">'+
 '<b>How this works:</b> Each stored question is assigned to the skill associated with its lesson (sometimes a more specific skill by lesson title). '+
 'The score is correct answers ÷ answered items, using the first saved response to each unique item; skipped items are counted separately. Retakes cannot inflate it. '+
 'At least 4 items are needed for a provisional classification: ≥80% observed strength, below 60% development priority, otherwise developing. '+
 'Evidence under 4 items is insufficient. This is a <b>practice-performance indicator, not a validated workplace skill rating</b>. '+
 'Diagnostic and Mastery evidence is shown together, but stage difficulty varies. Advanced case scores are reported separately.'+
 '</div>'+summary+
 (sorted.length?'<div class="skillGrid">'+sorted.map(skillCard).join("")+'</div>':'<div class="skillEmpty">No suitable question-level evidence has synchronized yet. Save and sync completed assessments; older scores without reliable question evidence cannot be used for a skill rating.</div>')+
 takeaways+advanced+
 '<p class="skillFootnote">Evidence coverage: '+model.withoutSnapshots+' assessments have no question snapshots; '+model.unmapped+' responses could not be matched reliably; '+model.retakeResponses+' repeated responses were excluded. Skill mappings follow course topics, not a psychometrically validated competency framework. Avoid personnel decisions based solely on these indicators.</p></section>';
}
function renderSkillsCohort(){
 const cohort=cohortSkillSummary(learners,modules);
 const covered=cohort.filter(s=>s.learners>0).sort((a,b)=>b.learners-a.learners||a.label.localeCompare(b.label));
 const target=$("skillsCohort");if(!target)return;
 target.innerHTML='<div class="skillLegend"><b>Team overview:</b> Mean of learners’ first-attempt question accuracy per skill. Only learners with at least four answered items for that skill are included. This is not a population benchmark or a validated employee ranking.</div>'+
 (covered.length?'<div class="skillGrid">'+covered.map(s=>'<div class="skillCard"><div class="skillCardHeader"><h4>'+esc(s.label)+'</h4><strong>'+Math.round(100*s.mean)+'%</strong></div><div class="skillMeter"><span style="width:'+Math.round(100*s.mean)+'%"></span></div>'+
 '<div class="skillFootnote">'+s.learners+' learner'+(s.learners===1?'':'s')+' with sufficient evidence · '+s.items+' answered items collectively</div></div>').join("")+'</div>':
 '<div class="skillEmpty">Skills will appear as learners complete and synchronize enough question-level responses. Four answered items per skill are required before a learner contributes to the cohort summary.</div>');
}
function exportSkillsCSV(){
 const heading=["Learner","Email","UID","Skill","Skill score %","Correct","Incorrect","Skipped","Answered unique items","Evidence coverage","Skill indicator","Diagnostic items","Mastery items","Mapped lessons","Unmapped records"];
 const rows=filtered().flatMap(x=>{const model=skillModel(x);return model.rows.filter(s=>s.answered||s.skipped).map(s=>
  [x.name,x.email,x.uid,s.label,s.rate===null?"":Math.round(s.rate*100),s.correct,s.wrong,s.skipped,s.answered,s.coverage,s.band,s.diagnostic,s.mastery,s.lessonIds.join("; "),model.unmapped]);});
 const blob=new Blob(["\uFEFF"+[heading,...rows].map(r=>r.map(csv).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="ATD-Skill-Profile-"+new Date().toISOString().slice(0,10)+".csv";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function attemptLabel(a){const [mid,stage]=String(a.assessmentKey||"").split(":");const m=modules.find(x=>x.id===mid);return (m?m.id+" "+m.name:mid||"Assessment")+" — "+(stages[stage]||stage||"Other");}
function itemHTML(q,i){
 const selected=q.selectedIndex,skipped=selected===null||selected===undefined;
 const right=!skipped&&selected===q.correctIndex;
 const cls=skipped?"answerSkipped":right?"answerGood":"answerBad";
 const choice=v=>Number.isInteger(v)&&Array.isArray(q.options)&&v>=0&&v<q.options.length?("("+String.fromCharCode(65+v)+") "+q.options[v]):v===null?"Skipped":"Unavailable";
 return '<div class="'+cls+'"><div class="question">'+(i+1)+'. '+esc(q.prompt||q.id||"Question")+'</div><span class="tag">'+(skipped?"Skipped":right?"Correct":"Incorrect")+'</span><p><b>Learner selected:</b> '+esc(choice(selected))+'</p><p><b>Correct answer:</b> '+esc(choice(q.correctIndex))+'</p>'+(q.explanation?'<p><b>Explanation:</b> '+esc(q.explanation)+'</p>':'')+(q.target?'<div class="small muted">Lesson / competency: '+esc(q.target)+'</div>':'')+'</div>';
}
function attemptDetails(a,i){
 const snap=Array.isArray(a.questionSnapshots)?a.questionSnapshots:null;
 const history=Array.isArray(a.history)?a.history:null;
 let body="";
 if(snap)body='<p class="muted">Captured responses: '+snap.filter(q=>Number.isInteger(q.selectedIndex)).length+' / '+snap.length+'. Skipped entries are not correct.</p>'+snap.map(itemHTML).join("");
 else if(Array.isArray(a.caseStepSnapshots))body='<p class="muted">Advanced case decisions: two suitable actions per step. +1 for a suitable choice, −1 for an unsuitable choice.</p>'+a.caseStepSnapshots.map((s,i)=>{
  const choices=(s.selectedIndices||[]).map(n=>({n,text:s.options?.[n]||"Unknown",right:(s.correctIndices||[]).includes(n)}));
  return '<div class="'+(s.delta===2?"answerGood":"answerBad")+'"><div class="question">Case '+((s.caseIndex??0)+1)+' · Step '+((s.step??0)+1)+': '+esc(s.prompt||"")+'</div><p>'+esc(s.decisionPrompt||"")+'</p><p><b>Choices made:</b> '+choices.map(k=>esc(String.fromCharCode(65+k.n)+". "+k.text)+" ("+(k.right?"Suitable":"Unsuitable")+")").join("; ")+'</p><p><b>Suitable actions:</b> '+(s.correctIndices||[]).map(n=>esc(String.fromCharCode(65+n)+". "+(s.options?.[n]||""))).join("; ")+'</p><p><b>Points:</b> '+esc(s.delta)+'</p><p>'+esc(s.explanation||"")+'</p></div>';
 }).join("");
 else if(history)body='<p class="muted">Advanced case selections and scoring: +1 suitable action, −1 unsuitable action; final percentage uses max(0, earned points) / possible points.</p><div class="scroll"><table><thead><tr><th>Case</th><th>Step</th><th>Selected option indices</th><th>Points earned</th></tr></thead><tbody>'+history.map(h=>'<tr><td>'+((h.caseIndex??0)+1)+'</td><td>'+((h.step??0)+1)+'</td><td>'+esc((h.choices||[]).map(c=>String.fromCharCode(65+c)).join(", "))+'</td><td>'+esc(h.delta??"—")+'</td></tr>').join("")+'</tbody></table></div><p class="muted small">Full option text was not recorded in this case history.</p>';
 else body='<p class="muted">'+esc(ALL_QUESTIONS)+'</p>'+(Array.isArray(a.answers)?'<p>Stored selected answer indices: '+esc(a.answers.map(v=>v===null?"Skipped":v===undefined?"Not answered":String.fromCharCode(65+v)).join(", "))+'</p>':'');
 return '<details class="detailSection"><summary><b>#'+(i+1)+' '+esc(attemptLabel(a))+'</b> · '+esc(pct(a.score))+' · '+esc(dateLabel(a.ts))+'</summary><div style="padding:12px 0"><p><b>Questions:</b> '+esc(a.questionCount??snap?.length??"—")+' · <b>Assessment bank:</b> '+esc(a.bankVersion||a.caseVersion||"Not stored")+'</p>'+body+'</div></details>';
}
function detail(uid){
 const x=learners.find(a=>a.uid===uid);if(!x)return;const a=getStats(x),attempts=x.attempts.slice().sort((l,r)=>(asDate(r.ts)?.valueOf()||0)-(asDate(l.ts)?.valueOf()||0));
 $("details").classList.remove("hidden");$("detailTitle").textContent=x.name||x.email||"Learner";
 const scored=attempts.filter(t=>typeof t.score==="number");
 const completion=a.modules.map(m=>'<tr><td>'+esc(m.id+" "+m.name)+'</td><td>'+m.completed+' / '+m.total+'</td><td>'+m.mastered+'</td><td>'+esc(m.finished?"Completed":"In progress")+'</td></tr>').join("");
 $("detailContent").innerHTML=
 '<p><b>Email:</b> '+esc(x.email||"—")+' · <b>Phone:</b> '+esc(x.phone||"—")+' · <b>UID:</b> '+esc(x.uid)+'</p>'+
 '<div class="metrics">'+[
 ["Lessons completed",a.completed+" / "+lessonTotal],["Modules completed",a.modulesComplete+" / "+modules.length],
 ["Lessons mastered",a.mastered],["Total attempts",attempts.length],
 ["First assessments ≥80%",a.firstPass],["First assessments below 80%",a.firstFail],
 ["Correct saved answers",a.correct],["Incorrect saved answers",a.incorrect],
 ["Skipped saved answers",a.skipped],["First saved item responses correct",a.firstItem.right],
 ["First saved item responses incorrect",a.firstItem.wrong],["Pages opened (tracked)",x.views||"Not tracked"],
 ["Foreground time tracked",hrs(x.seconds)],["Last activity",dateLabel(x.lastSeen)]
 ].map(([k,v])=>'<div class="metric"><strong>'+esc(v)+'</strong>'+esc(k)+'</div>').join("")+'</div>'+
 skillDetail(x)+
 '<h3>Average score — calculation</h3><p>Sum of the scores of all <b>'+a.scoreCount+'</b> recorded assessments with numeric scores ÷ '+a.scoreCount+' = <b>'+pct(a.scoreAverage)+'</b>. This is an <b>attempt-weighted</b> mean across Diagnostic, Mastery and Advanced Case practice, not an official ATD certification result. Retakes count as additional attempts; missing scores are excluded. Advanced Case scores use a different scoring method, so compare stage averages rather than treating this as a validated proficiency measurement.</p>'+
 '<h3>Per-stage results</h3><div class="scroll"><table><thead><tr><th>Stage</th><th>Attempts</th><th>Average</th><th>Latest</th></tr></thead><tbody>'+
 ["diagnostic","mastery","advanced"].map(stage=>{const arr=scored.filter(t=>t.assessmentKey?.endsWith(":"+stage));return '<tr><td>'+esc(stages[stage])+'</td><td>'+arr.length+'</td><td>'+pct(arr.length?arr.reduce((n,v)=>n+v.score,0)/arr.length:null)+'</td><td>'+pct(arr.length?arr.slice().sort((l,r)=>(asDate(r.ts)?.valueOf()||0)-(asDate(l.ts)?.valueOf()||0))[0].score:null)+'</td></tr>'}).join("")+'</tbody></table></div>'+
 '<h3>Module and lesson completion</h3><p class="muted small">A module is counted as completed only when all its lessons are marked completed. Mastery is a separate indicator.</p><div class="scroll"><table><thead><tr><th>Module</th><th>Completed lessons</th><th>Mastered lessons</th><th>Completion</th></tr></thead><tbody>'+completion+'</tbody></table></div>'+
 '<h3>Lesson IDs completed</h3><p>'+esc([...x.lessonIds].sort().join(", ")||"None synced")+'</p>'+
 '<h3>Full assessment history and answer review</h3><p class="muted small">First attempt means the earliest saved attempt per module and stage. ≥80% is a reporting threshold, not an official ATD pass mark. Missing historical attempts can make first-attempt statistics incomplete.</p>'+
 (attempts.map(attemptDetails).join("")||'<p>No attempts synchronized.</p>')+
 '<h3>Usage data</h3><p class="muted small">Foreground time and page views are newly collected from signed-in browser sessions only. Foreground time is approximate and is not validated active learning time. Historic time, unique page counts, and precise first-to-last duration cannot be backfilled. A page view is a tracked navigation transition, not necessarily a distinct lesson.</p>';
 $("details").scrollIntoView({behavior:"smooth",block:"start"});
}
async function load(){
 if(!current||loading)return;loading=true;const version=++epoch;status("Loading learner analytics…");$("reload").disabled=true;$("export").disabled=true;
 try{
  const snap=await getDocs(collection(db,"learners")).catch(e=>{throw new Error("learners collection (admin list permission): "+String(e.code||e.message));}),result=[];
  for(const p of snap.docs){
   if(version!==epoch||auth.currentUser?.uid!==current.uid)return;
   const uid=p.id,x=p.data();
   const [lessonsSnap,masterySnap,attemptsSnap]=await Promise.all(["lessonProgress","lessonMastery","assessmentAttempts"].map(k=>getDocs(collection(db,"learners",uid,k)).catch(e=>{throw new Error("learners/"+uid+"/"+k+" (admin list permission): "+String(e.code||e.message));})));
   let activityDocs=[];try{activityDocs=(await getDocs(collection(db,"learners",uid,"activity"))).docs;}catch(err){console.warn("Activity records unavailable:",err.code||err.message);}
   const subs=[lessonsSnap,masterySnap,attemptsSnap,{docs:activityDocs}];
   const lessonIds=new Set(subs[0].docs.filter(d=>d.data().completed===true).map(d=>d.data().lessonId).filter(Boolean));
   const masteryIds=new Set(subs[1].docs.filter(d=>d.data().mastered===true).map(d=>d.data().lessonId).filter(Boolean));
   const attempts=subs[2].docs.map(d=>({...d.data(),recordId:d.id})),activity=subs[3].docs.map(d=>d.data());
   const last=activity.map(a=>a.lastSeenAt).filter(Boolean).sort((a,b)=>(asDate(b)?.valueOf()||0)-(asDate(a)?.valueOf()||0))[0]||null;
   result.push({uid,name:x.name||"",email:x.email||"",phone:x.phone||"",lessonIds,masteryIds,attempts,
    seconds:activity.reduce((n,a)=>n+(Number(a.activeSeconds)||0),0),views:activity.reduce((n,a)=>n+(Number(a.pageViews)||0),0),lastSeen:last});
  }
  if(version!==epoch)return;learners=result.sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email));metrics();render();renderSkillsCohort();status("Loaded "+learners.length+" learner profiles · "+modules.length+" curriculum modules.");
 }catch(e){status("Access diagnostic: "+String(e.code||e.message)+". Check admin UID and published Firestore rules. Activity is optional.",true);}
 finally{loading=false;$("reload").disabled=false;$("export").disabled=false;}
}
function csv(v){return '"'+String(v??"").replace(/"/g,'""')+'"';}
function exportCsv(){
 const head=["Name","Email","Phone","UID","Lessons completed","Total lessons","Modules completed","Total modules","Mastered lessons","Total attempts","First assessments ≥80%","First assessments below 80%","Average score %","Correct answers recorded","Incorrect answers recorded","Skipped answers recorded","First item responses correct","First item responses incorrect","Page views tracked","Foreground minutes tracked","Last active"];
 const data=filtered().map(x=>{const a=getStats(x);return [x.name,x.email,x.phone,x.uid,a.completed,lessonTotal,a.modulesComplete,modules.length,a.mastered,x.attempts.length,a.firstPass,a.firstFail,a.scoreAverage===null?"":Math.round(a.scoreAverage*100),a.correct,a.incorrect,a.skipped,a.firstItem.right,a.firstItem.wrong,x.views,Math.round(x.seconds/60),dateLabel(x.lastSeen)]});
 const blob=new Blob(["\uFEFF"+[head,...data].map(r=>r.map(csv).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="ATD-Learner-Analytics-"+new Date().toISOString().slice(0,10)+".csv";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("search").oninput=e=>{filter=e.target.value;render();};
$("reload").onclick=()=>load();$("export").onclick=()=>exportCsv();$("exportSkills").onclick=()=>exportSkillsCSV();
$("closeDetails").onclick=()=>$("details").classList.add("hidden");
onAuthStateChanged(auth,async user=>{
 ++epoch;current=user;learners=[];$("details").classList.add("hidden");
 if(!user){access("Administrator sign-in required","Sign in at ATD Academy, then return to this page.");return;}
 try{const p=await getDoc(doc(db,"admins",user.uid));if(auth.currentUser?.uid!==user.uid)return;
  if(!p.exists()||p.data().active!==true){access("Administrator access not enabled","This signed-in account does not have an active admins/{uid} record.");return;}
  $("access").classList.add("hidden");$("dashboard").classList.remove("hidden");load();
 }catch(e){access("Unable to verify admin access",String(e.code||e.message));}
});
