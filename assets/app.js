
const KEY='td_adaptive_academy_v5';let ACTIVE_KEY=KEY;let state;try{state=JSON.parse(localStorage.getItem(KEY))||{}}catch{state={}};
state.attempts??={};state.fav??=[];state.done??={};state.current??='1.1';state.view??='home';state.focus??=null;
let sess=null;const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{localStorage.setItem(ACTIVE_KEY,JSON.stringify(state))}catch{};if(window.ATDCloudOnSave)window.ATDCloudOnSave();};const mod=()=>DATA.modules.find(m=>m.id===state.current)||DATA.modules[0];const domain=id=>id[0];
function lessonFor(id){for(const m of DATA.modules){let l=m.lessons.find(x=>x[0]===id);if(l)return {m,l}}return null}
function selectModule(id){state.current=id;state.focus=null;view('dashboard')};function view(name){state.view=name;sess=null;save();render()};function resetTest(){sess=null;render()};
function getQs(m,stage){if(stage==='advanced')return (DATA.advanced[m.id]||[]).map((x,i)=>({id:m.id+'-adv-'+i,target:m.lessons[i%m.lessons.length]?.[0],title:'Applied scenario',q:x[0],opts:x[1],answer:x[2],why:x[3]}));
if(m.preview)return (DATA.domain2Questions[m.id]||[]).map((x,i)=>({id:m.id+'-q-'+(i+1),target:m.id,title:m.name,q:x[0],opts:x[1],answer:x[2],why:x[3]}));
let base=m.lessons.map(l=>({id:l[0],target:l[0],title:l[1],q:l[4],opts:l[5],answer:l[6],why:l[7]}));
if(stage==='diagnostic')base=base.concat(DATA.domain1ScenarioQuestions[m.id]||[]);
if(stage==='mastery')base=base.slice().reverse();return base.filter(q=>typeof q.q==='string'&&Array.isArray(q.opts)&&q.opts.length===4&&Number.isInteger(q.answer))}
// A diagnostic gives evidence for a lesson only if ALL questions mapped to that lesson were correct.
// Manual reviews remain separate and are never undone by another diagnostic attempt.
function syncDiagnosticReview(m,attempt){
 if(!m||m.preview||!attempt||!Array.isArray(attempt.answers))return;
 const qs=getQs(m,'diagnostic');
 if(qs.length!==attempt.answers.length)return; // Do not infer coverage from an old or changed bank.
 state.autoReviewed??={};
 const grouped={};
 qs.forEach((q,i)=>{if(!lessonFor(q.target)||lessonFor(q.target).m.id!==m.id)return;
   (grouped[q.target]??=[]).push(attempt.answers[i]===q.answer)});
 Object.entries(grouped).forEach(([id,results])=>{
   // A correct response to one of several linked items must not override an incorrect one.
   if(results.length&&results.every(Boolean)){
     state.done[id]=true;
     state.autoReviewed[id]=true;
   }
 });
}
function migrateDiagnosticReviews(){
 state.autoReviewed??={};
 for(const m of DATA.modules)syncDiagnosticReview(m,state.attempts[m.id+':diagnostic']);
 save();
}
migrateDiagnosticReviews();
function header(){let m=mod(),d=domain(m.id);let sb='<div class="brand">TD ACADEMY<br><span class="sideSub">Self-paced adaptive learning</span></div><button class="sideBtn '+(state.view==='home'?'active':'')+'" onclick="view(\'home\')">⌂ &nbsp; Course Overview</button>';
for(const x of ['1','2','3']){sb+=`<div class="sidebarLabel">DOMAIN ${x} · ${x==='1'?'PERSONAL':x==='2'?'PROFESSIONAL':'ORGANIZATIONAL'}</div>`;sb+=DATA.modules.filter(y=>domain(y.id)===x).map(y=>`<button class="sideBtn ${state.current===y.id&&state.view!=='home'?'active':''}" onclick="selectModule('${y.id}')"><b>${y.id} ${esc(y.name)}</b><br><span class="sideSub">${y.preview?'Diagnostic ready · Lessons next':`${y.lessons.length} learning units`}</span></button>`).join('')}
sb+=DATA.domain3.filter(x=>!DATA.modules.some(m=>m.id===x[0])).map(x=>`<button class="sideBtn" onclick="view('home');document.getElementById('domain3')?.scrollIntoView({behavior:'smooth'})">${x[0]} ${esc(x[1])} · Soon</button>`).join('')+'<button class="sideBtn '+(state.view==='saved'?'active':'')+'" onclick="view(\'saved\')">☆ Lessons for Review ('+state.fav.length+')</button>';
$('sidebar').innerHTML=sb;
$('top').innerHTML=state.view==='home'||state.view==='saved'?'':`<div class="navTop"><div class="row"><div><span class="pill">DOMAIN ${d} · ${d==='1'?'BUILDING PERSONAL CAPABILITY':d==='2'?'DEVELOPING PROFESSIONAL CAPABILITY':'IMPACTING ORGANIZATIONAL CAPABILITY'}</span><h2>${m.id} ${esc(m.name)}</h2><div class="muted small">${esc(m.intro)}</div></div><button class="btn" onclick="view('home')">All modules</button></div><div class="tabs">${[['dashboard','Dashboard'],['diagnostic','1. Diagnostic Exam'],['review','2. My Review'],['material','3. Full Material'],['mastery','4. Mastery Check'],['advanced','5. Advanced Scenarios']].map(x=>`<button class="tab ${state.view===x[0]?'active':''}" onclick="view('${x[0]}')">${x[1]}</button>`).join('')}</div></div>`}
function render(){header();let m=mod();({home,dashboard,material,review,saved}[state.view]||(()=>testScreen(m,state.view)))(m)}
function sectionCards(rows,type){return `<div class="domainGrid">${rows.map(x=>{let id=x.id||x[0],name=x.name||x[1],intro=x.intro||'',isSoon=type===3&&!DATA.modules.some(m=>m.id===id),done=state.attempts[id+':diagnostic'];return `<div class="capabilityTile"><button class="moduleCard ${isSoon?'soon':'available'}" ${isSoon?'disabled title="Awaiting learning source materials"':`onclick="selectModule('${id}')"`}><span class="domainFlag ${isSoon?'wait':''}">${isSoon?'CONTENT PLACEHOLDER':x.preview?'DIAGNOSTIC READY':'FULL LEARNING PATH'}</span><h3>${esc(id)} · ${esc(name)}</h3><p>${isSoon?'This capability is reserved until its instructional source has been supplied.':esc(intro)}</p><span class="bottom">${isSoon?'Coming next':x.preview?(done?'Diagnostic '+Math.round(done.score*100)+'% · Open →':'3 scenario questions · Open →'):`${x.lessons.length} lessons · Open →`}</span></button>${!isSoon?`<button class="quickExam" onclick="state.current='${id}';view('diagnostic')" aria-label="Start ${esc(id)} diagnostic exam">Start ${esc(id)} diagnostic exam →</button>`:''}</div>`}).join('')}</div>`}
function home(){$('body').innerHTML=`<div class="homeHero"><span class="pill" style="background:#fff;color:#173a63">TALENT DEVELOPMENT PROFESSIONAL · ADAPTIVE ACADEMY</span><h1>Choose your learning domain</h1><p>Build capability through baseline assessment, targeted study, mastery checks and realistic workplace decisions. Study Domains 1 and 2, plus the first three organizational capabilities in Domain 3. Remaining Domain 3 capabilities are reserved for future source material.</p><button class="btn white" onclick="selectModule('1.1')">▶ Resume Domain 1</button><button class="btn" style="margin-left:8px" onclick="selectModule('2.1')">Explore Domain 2 →</button><div class="metricRow"><div class="homeMetric"><strong>3</strong><span>Domains mapped</span></div><div class="homeMetric"><strong>23</strong><span>Capabilities mapped</span></div><div class="homeMetric"><strong>18</strong><span>Full-content capabilities</span></div><div class="homeMetric"><strong>18</strong><span>Diagnostics available</span></div></div></div><div class="domainTitle"><div><h2>01 · Building Personal Capability</h2><p>Full learning content, practice questions and workplace scenarios · 7 capabilities</p></div><span class="pill">CONTENT AVAILABLE</span></div>${sectionCards(DATA.modules.filter(x=>domain(x.id)==='1'),1)}<div class="domainTitle" id="domain2"><div><h2>02 · Developing Professional Capability</h2><p>Eight full capability pathways · 2.1–2.8 learning, diagnostics, mastery and scenarios</p></div><span class="pill">LEARNING PATHS LIVE</span></div>${sectionCards(DATA.modules.filter(x=>domain(x.id)==='2'),2)}<div class="domainTitle" id="domain3"><div><h2>03 · Impacting Organizational Capability</h2><p>3.1 Business Insight, 3.2 Consulting and 3.3 OD & Culture are live; 3.4–3.8 are placeholders</p></div><span class="pill" style="background:#eef0f3;color:#6b7280">PARTIALLY LIVE</span></div>${sectionCards(DATA.domain3.map(x=>DATA.modules.find(m=>m.id===x[0])||x),3)}<div class="panel small muted"><b>Content coverage:</b> 3.1.1–3.1.8, 3.2.1–3.2.8, and supplied 3.3 statements are active. 3.3.7 and 3.3.12 await their source content. Each live lesson has an original mapped diagnostic item.</div><div class="panel small muted">Assessment questions are original, scenario-based practice items modeled on the reasoning and workplace-decision format common to professional talent-development exams. They are <b>not actual ATD examination items</b>, are not validated for certification, and do not predict ATD exam results. Assessments are learning practice, not validated certification examinations or evidence of job qualification. Domain 3 capabilities 3.4–3.8 remain placeholders. Missing subcompetencies within 3.3 are not fabricated.</div>`}
function dashboard(m){let d=state.attempts[m.id+':diagnostic'],t=state.attempts[m.id+':mastery'],adv=state.attempts[m.id+':advanced'],n=m.lessons.filter(l=>state.done[l[0]]).length;let missing=d?.missed?.length||0;let preview=!!m.preview;
$('body').innerHTML=`<div class="dashHero"><span class="pill" style="background:#fff;color:#173a63">CAPABILITY LEARNING DASHBOARD</span><h1>${esc(m.name)}</h1><p>${preview?'Domain 2 assessment is ready. The detailed learning and application content will be built from the source material you provide.':'Track learning activity, review gaps and validate practical mastery.'}</p></div><div class="cardGrid panel"><div class="card"><div class="skillTag">DIAGNOSTIC</div><div class="score">${d?Math.round(d.score*100)+'%':'—'}</div><div class="muted small">${d?missing+' question(s) to review':'Ready to start'}</div></div><div class="card"><div class="skillTag">FULL MATERIAL</div><div class="score">${preview?'Soon':n+'/'+m.lessons.length}</div><div class="muted small">${preview?'Content awaiting source':'Reviewed learning units · includes diagnostic passes'}</div></div><div class="card"><div class="skillTag">MASTERY</div><div class="score">${preview?'Soon':t?Math.round(t.score*100)+'%':'—'}</div><div class="muted small">${preview?'Available after lessons':'Knowledge confirmation'}</div></div><div class="card"><div class="skillTag">ADVANCED</div><div class="score">${preview?'Soon':adv?Math.round(adv.score*100)+'%':'—'}</div><div class="muted small">${preview?'Application practice pending':'Workplace scenarios'}</div></div></div><div class="panel"><h2>Recommended next step</h2><p>${!d?'Begin the baseline diagnostic, then review your capability profile.':preview?'Your baseline is recorded. The full Domain 2 learning path is being prepared; use the answer-by-answer explanations in the diagnostic review.':missing?'Study your missed topics in My Review and Full Material.':!t?'You have demonstrated baseline knowledge. Proceed to Mastery Check.':'Continue your personalized learning path.'}</p><button class="btn primary" onclick="view('${!d?'diagnostic':preview?'review':missing?'review':!t?'mastery':'advanced'}')">${!d?'Start diagnostic':preview?'View diagnostic explanations':'Continue learning'} →</button></div>${preview?'<div class="learningNotice"><b>Curriculum status:</b> The diagnostic is a functioning baseline, not an official ATD examination. Lessons, downloadable tools and advanced practice for this capability will become available when its instructional source is added.</div>':`<div class="panel"><h2>Skill map</h2><div class="gap">${m.lessons.map(l=>`<button class="chip" onclick="openLesson('${l[0]}')">${state.done[l[0]]?'✓ ':''}${l[0]} ${esc(l[1])}</button>`).join('')}</div></div>`}`}
function openLesson(id){let x=lessonFor(id);if(!x)return;state.current=x.m.id;state.focus=id;view('material')}
function material(m){if(m.preview){$('body').innerHTML=`<div class="panel"><span class="pill">3 · FULL MATERIAL</span><h1>${esc(m.name)}</h1><div class="learningNotice"><b>Content placeholder, not a finished lesson.</b> The full instructional narrative for ${esc(m.id)} has not yet been provided. You can take the three-question diagnostic now; detailed lessons, application activities and mastery checks will be inserted here without changing the interface.</div><div class="actionBar"><button class="btn primary" onclick="view('diagnostic')">Take diagnostic →</button><button class="btn" onclick="view('home')">Back to domains</button></div></div>`;return}let focus=state.focus&&m.lessons.some(x=>x[0]===state.focus)?state.focus:null;
let out=`<div class="panel"><span class="pill">3 · FULL MATERIAL</span><h1>${esc(m.name)}</h1><p class="muted">Lessons answered correctly in the Diagnostic Exam are automatically marked Reviewed. Any topic with a missed question stays available for targeted study. You can also mark a lesson reviewed manually.</p><div class="gap">${m.lessons.map(l=>`<button class="chip" onclick="state.focus='${l[0]}';save();render()">${state.done[l[0]]?'✓ ':''}${l[0]}</button>`).join('')}</div></div>`;
for(let l of m.lessons){if(focus&&focus!==l[0])continue;out+=`<div class="lesson"><div class="row"><div><div class="skillTag">LESSON ${l[0]}</div><h3>${esc(l[1])}</h3></div><button class="star" onclick="favorite('${l[0]}')">${state.fav.includes(l[0])?'★ Saved':'☆ Save for review'}</button></div><div class="learnblock"><div class="learnlabel">Learn and understand</div>${esc(l[2])}</div><div class="learnblock example"><div class="learnlabel">Apply at work</div>${esc(l[3])}</div><div class="row"><span class="status">${state.autoReviewed?.[l[0]]?'✓ Reviewed · Diagnostic correct':state.done[l[0]]?'✓ Reviewed':'Not yet reviewed'}</span><button class="btn primary" onclick="state.done['${l[0]}']=true;save();render()">Mark reviewed ✓</button></div></div>`}
if(focus)out+='<div class="panel"><button class="btn" onclick="state.focus=null;save();render()">← All lessons</button></div>';$('body').innerHTML=out}
function favorite(id){state.fav=state.fav.includes(id)?state.fav.filter(x=>x!==id):[...state.fav,id];save();render()};function saved(){let rows=state.fav.map(lessonFor).filter(Boolean);$('body').innerHTML=`<div class="panel"><h1>★ Saved Lessons</h1><div class="cardGrid">${rows.length?rows.map(x=>`<div class="card"><span class="pill">${x.l[0]}</span><h3>${esc(x.l[1])}</h3><p>${esc(x.l[2])}</p><button class="btn primary" onclick="openLesson('${x.l[0]}')">Review lesson</button> <button class="btn" onclick="favorite('${x.l[0]}')">Remove</button></div>`).join(''):'<p>No lessons saved yet.</p>'}</div></div>`}
function review(m){let d=state.attempts[m.id+':diagnostic'],t=state.attempts[m.id+':mastery'];if(!d&&!t){$('body').innerHTML='<div class="panel"><h1>Personalized review</h1><p>Complete a diagnostic to generate your targeted learning profile.</p><button class="btn primary" onclick="view(\'diagnostic\')">Start diagnostic →</button></div>';return}
let missed=[...(d?.missed||[]),...(t?.missed||[])];missed=[...new Set(missed)];let qs=[...getQs(m,'diagnostic'),...(m.preview?[]:getQs(m,'mastery'))];let list=missed.map(id=>qs.find(q=>q.id===id)).filter(Boolean);let hasFull=!m.preview;
$('body').innerHTML=`<div class="panel"><span class="pill">2 · MY REVIEW</span><h1>Targeted gap analysis</h1><p>${list.length?'These questions were answered incorrectly in your last diagnostic or mastery attempt. Review their explanations before reassessment.':'No missed questions on your latest recorded attempt. You may review the content or try a new assessment.'}</p><div class="cardGrid">${list.map(q=>`<div class="card"><span class="pill">${esc(q.target||q.id)}</span><h3>${esc(q.q)}</h3><div class="learnblock"><div class="learnlabel">Recommended reasoning</div>${esc(q.why)}</div>${hasFull?`<button class="btn primary" onclick="openLesson('${q.target}')">Open linked lesson</button>`:'<span class="small muted">Detailed instruction pending · diagnostic guidance available</span>'}</div>`).join('')}</div><div class="actionBar"><button class="btn" onclick="view('diagnostic')">Retake diagnostic</button>${hasFull?'<button class="btn primary" onclick="view(\'material\')">Open full material →</button>':''}</div></div>`}
function originalTestScreen(m,stage){if(m.preview&&stage!=='diagnostic'){material(m);return}if(!sess||sess.stage!==stage||sess.mid!==m.id){sess={stage,mid:m.id,qs:getQs(m,stage),answers:[],pos:0,finished:false}}if(sess.finished){resultScreen(m,stage);return}let labels={diagnostic:'Diagnostic Exam',mastery:'Mastery Check',advanced:'Advanced Scenarios'},name=labels[stage],q=sess.qs[sess.pos];if(!q){$('body').innerHTML='<div class="panel">Questions are not yet available.</div>';return}let ans=sess.answers[sess.pos],has=ans!==undefined,immediate=stage!=='diagnostic';
$('body').innerHTML=`<div class="panel qBox"><span class="pill">${stage==='diagnostic'?1:stage==='mastery'?4:5} · ${name.toUpperCase()}</span><h1>${name}</h1>${stage==='diagnostic'?'<div class="stageInstructions">Choose the <b>single best answer</b> based on the information in each realistic workplace scenario. Answers are not revealed until submission, to protect the baseline assessment. Questions are independently authored ATD-style practice, not official ATD exam items.</div>':''}<div class="questionMeta"><span class="small muted">Question ${sess.pos+1} / ${sess.qs.length}</span><span class="skillTag">${esc(q.title||q.id)}</span></div><div class="barOuter"><div class="barInner" style="width:${Math.round(100*(sess.pos+1)/sess.qs.length)}%"></div></div><h2 class="chapter" style="margin-top:23px">${esc(q.q)}</h2>${q.opts.map((o,i)=>`<button class="answer ${has&&i===ans?'selected':''} ${immediate&&has&&i===q.answer?'correct':''}" ${immediate&&has?'disabled':''} onclick="choose(${i})"><b>${'ABCD'[i]}.</b> ${esc(o)}</button>`).join('')}${immediate&&has?`<div class="feedback"><b>${ans===q.answer?'✓ Correct':'Revisit this idea'}</b><p>${esc(q.why)}</p></div>`:''}<div class="testTools"><button class="btn" onclick="backQuestion()" ${sess.pos===0?'disabled':''}>← Previous</button><button class="btn primary" onclick="nextQuestion()" ${!has?'disabled':''}>${sess.pos===sess.qs.length-1?'Submit assessment':'Next question →'}</button></div></div>`}
function originalChoose(i){if(!sess)return;sess.answers[sess.pos]=i;render()};function backQuestion(){if(sess&&sess.pos>0){sess.pos--;render()}};
function originalNextQuestion(){if(!sess||sess.answers[sess.pos]===undefined)return;if(sess.pos+1<sess.qs.length){sess.pos++;render();return}let wrong=sess.qs.filter((q,i)=>sess.answers[i]!==q.answer),score=(sess.qs.length-wrong.length)/sess.qs.length;
state.attempts[`${sess.mid}:${sess.stage}`]={score,missed:wrong.map(q=>q.id),answers:sess.answers.slice(),ts:new Date().toISOString(),questionCount:sess.qs.length};if(sess.stage==='diagnostic')syncDiagnosticReview(mod(),state.attempts[`${sess.mid}:${sess.stage}`]);save();sess.finished=true;render()}
function resultScreen(m,stage){let a=state.attempts[m.id+':'+stage],qs=sess.qs;let pass=a.score>=.8;let wrong=a.missed.length;
$('body').innerHTML=`<div class="panel qBox"><span class="pill">${stage.toUpperCase()} · COMPLETED</span><h1>${stage==='diagnostic'?'Your capability diagnostic profile':stage==='mastery'?'Mastery check results':'Scenario practice results'}</h1><div class="score">${Math.round(a.score*100)}%</div><p>${qs.length-wrong} correct out of ${qs.length} questions · ${wrong} topic(s) for review.</p>${stage==='diagnostic'?'<div class="stageInstructions">Correctly answered lessons are automatically marked <b>✓ Reviewed</b> in <b>3. Full Material</b>. If a lesson has multiple diagnostic questions, all must be answered correctly. Open Full Material to see the updated status.</div>':''}<div class="stageInstructions">${stage==='diagnostic'?'Baseline results are for learning guidance. Your responses are shown below with the best answer and rationale. A diagnostic score does not certify professional capability.':pass?'You met the proposed 80% learning threshold.':'Review the topics below and take a fresh mastery check.'}</div><div class="actionBar"><button class="btn primary" onclick="view('review')">My personalized review →</button>${!m.preview?'<button class="btn" onclick="view(\'material\')">Open full material</button>':''}<button class="btn" onclick="resetTest()">Retake assessment</button></div><h2 style="margin-top:25px">Answer review</h2>${qs.map((q,i)=>`<div class="lesson"><div class="row"><div class="skillTag">QUESTION ${i+1} · ${esc(q.target||q.id)}</div><span class="${a.answers[i]===q.answer?'good':'warn'}">${a.answers[i]===q.answer?'✓ Correct':'Needs review'}</span></div><h3>${esc(q.q)}</h3><p class="small"><b>Your answer:</b> ${esc('ABCD'[a.answers[i]]||'—')}. ${esc(q.opts[a.answers[i]]||'—')}</p><p class="small"><b>Best answer:</b> ${'ABCD'[q.answer]}. ${esc(q.opts[q.answer])}</p><div class="feedback">${esc(q.why)}</div>${!m.preview&&lessonFor(q.target)?`<button class="btn" onclick="openLesson('${q.target}')">Study related lesson</button>`:''}</div>`).join('')}</div>`}
/* Adaptive Academy experience upgrade. Existing DATA and persistence key remain unchanged. */
state.lang??='en';state.attemptHistory??=[];state.checks??={};state.bookmark??={};state.lessonVisits??={};state.manualReviewed??={};state.lastResume??=null;
const BASE_CHOOSE=originalChoose,BASE_NEXT=originalNextQuestion;
const msg=(en,ar)=>state.lang==='ar'?ar:en;
const pct=x=>Math.round(100*x);
const safeJson=x=>JSON.stringify(x).replace(/</g,'\\u003c');
const reviewed=id=>!!state.done[id];
const relatedQs=m=>getQs(m,'diagnostic');
const currentMissed=m=>{let a=state.attempts[m.id+':diagnostic'];if(!a)return[];return [...new Set(relatedQs(m).filter(q=>a.missed?.includes(q.id)).map(q=>q.target))].filter(id=>lessonFor(id));};
const outstanding=m=>currentMissed(m).filter(id=>!reviewed(id));
const canMaster=m=>!!state.attempts[m.id+':diagnostic'] && !outstanding(m).length;
const canAdvanced=m=>(state.attempts[m.id+':mastery']?.score??0)>.75;
 // Stage badges reflect completion, not simply opening a tab. Keep existing progress storage intact.
 const stageDone=(m,stage)=>{const a=state.attempts;switch(stage){
 case 'diagnostic':return !!a[m.id+':diagnostic'];
 case 'review':return !!a[m.id+':diagnostic']&&!outstanding(m).length;
 case 'material':return !m.preview&&m.lessons.length>0&&m.lessons.every(l=>reviewed(l[0]));
 case 'mastery':return (a[m.id+':mastery']?.score??0)>.75;
 case 'advanced':return (a[m.id+':advanced']?.score??0)>.70;
 default:return false;
 }};
const resumeLabel=()=>{let x=state.lastResume;return x&&DATA.modules.find(m=>m.id===x.mid)?`${x.mid} · ${x.stage}${x.pos!=null?' · Q'+(x.pos+1):''}`:null;};
const colorScore=s=>s>=.8?'good':s>=.5?'warn':'bad';
const appChart=(vals)=>`<div class="domainBars">${vals.map(x=>`<div class="domainBarRow"><span>${esc(x.label)}</span><div class="domainBarTrack"><div style="width:${Math.max(0,Math.min(100,x.val))}%"></div></div><strong>${x.val}%</strong></div>`).join('')}</div>`;
function switchLanguage(){state.lang=state.lang==='ar'?'en':'ar';save();render()}
function resumeLearning(){let r=state.lastResume;if(!r||!DATA.modules.find(m=>m.id===r.mid)){view('home');return;}state.current=r.mid;state.focus=r.focus||null;state.view=r.stage||'dashboard';sess=null;save();render()}
function markLesson(id){state.done[id]=true;state.manualReviewed[id]=true;state.lessonVisits[id]=Date.now();save();render()}
function quickCheck(id,answer){let ref=lessonFor(id);if(!ref)return;const l=ref.l;state.checks[id]={answer,correct:answer===l[6],ts:new Date().toISOString()};save();render()}
function lessonCheck(l){let c=state.checks[l[0]];return `<div class="microCheck"><div class="learnlabel">${msg('KNOWLEDGE CHECK · PRACTICE','سؤال تثبيت التعلم · تدريب')}</div><b>${esc(l[4])}</b>${l[5].map((a,i)=>`<button class="microOption ${c&&c.answer===i?(c.correct?'correctChoice':'incorrectChoice'):''}" ${c?'disabled':''} onclick="quickCheck('${l[0]}',${i})">${'ABCD'[i]}. ${esc(a)}</button>`).join('')}${c?`<div class="feedback"><b>${c.correct?msg('Correct','إجابة صحيحة'):msg('Practice again','راجع المفهوم')}</b> · ${esc(l[7])}<div><button class="btn mini" onclick="delete state.checks['${l[0]}'];save();render()">${msg('Try again','أعد المحاولة')}</button></div></div>`:''}</div>`}
function stageLabel(s){return ({diagnostic:msg('Diagnostic','التقييم التشخيصي'),mastery:msg('Mastery','التحقق من الإتقان'),advanced:msg('Advanced scenarios','السيناريوهات المتقدمة'),material:msg('Full Material','المحتوى الكامل'),review:msg('My Review','مراجعتي'),dashboard:msg('Dashboard','لوحة التقدم')})[s]||s}
function view(name){let m=mod();if(name==='mastery'&&!m.preview&&!canMaster(m)){state.view='review';save();render();$('body').insertAdjacentHTML('afterbegin',`<div class="alert">${msg('Finish the diagnostic and review all missed lessons before mastery.','أكمل التقييم التشخيصي وراجع جميع الدروس التي تحتاج تقوية قبل اختبار الإتقان.')}</div>`);return}if(name==='advanced'&&!m.preview&&!canAdvanced(m)){state.view='dashboard';save();render();$('body').insertAdjacentHTML('afterbegin',`<div class="alert">${msg('Achieve at least 80% on Mastery Check to unlock advanced scenarios.','اجتز اختبار الإتقان بنسبة 80% على الأقل لفتح السيناريوهات المتقدمة.')}</div>`);return}state.view=name;sess=null;if(name!=='home'&&name!=='saved')state.lastResume={mid:m.id,stage:name,focus:state.focus};save();render()}
function selectModule(id){state.current=id;state.focus=null;view('dashboard')}
function openLesson(id){let x=lessonFor(id);if(!x)return;state.current=x.m.id;state.focus=id;state.lessonVisits[id]=Date.now();state.lastResume={mid:x.m.id,stage:'material',focus:id};view('material')}
function home(){let n=DATA.modules.length,l=DATA.modules.reduce((s,m)=>s+m.lessons.length,0),rev=DATA.modules.reduce((s,m)=>s+m.lessons.filter(x=>reviewed(x[0])).length,0);let master=DATA.modules.filter(m=>canAdvanced(m)).length;
$('body').innerHTML=`<div class="homeHero upgradedHero"><span class="pill whitePill">TALENT DEVELOPMENT · ADAPTIVE ACADEMY</span><div class="heroEyebrow">${msg('ONE LEARNING EXPERIENCE · THREE DOMAINS','تجربة تعليمية واحدة · ثلاثة مجالات')}</div><h1>${msg('Build capability. Apply it at work.','طوّر قدراتك وطبّقها في العمل.')}</h1><p>${msg('An adaptive learning journey across Building Personal Capability, Developing Professional Capability, and Impacting Organizational Capability. Assess, learn, practice, and demonstrate mastery.','رحلة تعلم تكيفية تشمل بناء القدرات الشخصية وتطوير القدرات المهنية والتأثير في القدرات التنظيمية. قيّم، تعلّم، طبّق، وأثبت الإتقان.')}</p><div class="heroActions"><button class="btn white" onclick="resumeLearning()">▶ ${msg('Continue My Learning','متابعة التعلم')} ${resumeLabel()?'<small>· '+esc(resumeLabel())+'</small>':''}</button><button class="btn lightOutline" onclick="selectModule('1.1')">${msg('Browse capabilities','استعرض القدرات')}</button></div><div class="metricRow"><div class="homeMetric"><strong>3</strong><span>${msg('Domains','مجالات')}</span></div><div class="homeMetric"><strong>${n}</strong><span>${msg('Capabilities','قدرات')}</span></div><div class="homeMetric"><strong>${l}</strong><span>${msg('Learning units','وحدات تعلم')}</span></div><div class="homeMetric"><strong>${rev}</strong><span>${msg('Reviewed units','وحدات تمت مراجعتها')}</span></div></div></div><div class="panel statsIntro"><div class="row"><div><h2>${msg('Learning journey','رحلة التعلم')}</h2><p class="muted">${msg('Diagnostic → My Review → Full Material → Mastery Check → Advanced Scenarios','التشخيص ← مراجعة الفجوات ← المحتوى الكامل ← الإتقان ← السيناريوهات المتقدمة')}</p></div><button class="btn" onclick="view('analytics')">${msg('See all-domain analytics','تحليلات المجالات الثلاثة')}</button></div>${appChart([{label:msg('Lessons reviewed','الدروس المراجعة'),val:l?pct(rev/l):0},{label:msg('Capabilities mastered','القدرات المتقنة'),val:n?pct(master/n):0}])}</div>${['1','2','3'].map((d,i)=>`<div class="domainTitle"><div><h2>${String(i+1).padStart(2,'0')} · ${['Building Personal Capability','Developing Professional Capability','Impacting Organizational Capability'][i]}</h2><p>${DATA.modules.filter(m=>domain(m.id)===d).length} ${msg('capabilities','قدرات')}</p></div><span class="pill">${msg('CONTENT AVAILABLE','المحتوى متاح')}</span></div>${sectionCards(DATA.modules.filter(m=>domain(m.id)===d),+d)}`).join('')}<div class="panel small muted">${msg('Independent learning adaptation based on provided material. Not an ATD examination or official credential. Local browser progress only. Some subcompetencies without supplied source material are intentionally not invented.','محتوى تعليمي مستقل مبني على المواد المقدمة. ليس اختبار ATD رسمياً أو شهادة معتمدة. يتم حفظ التقدم محلياً في المتصفح، ولا نضيف محتوى مفقوداً من دون مصدر.')}</div>`}
function header(){let m=mod(),d=domain(m.id);let sb=`<div class="brand">TD ACADEMY <span class="sideSub">Adaptive learning</span></div><button class="sideBtn ${state.view==='home'?'active':''}" onclick="view('home')">⌂ ${msg('Course Overview','الرئيسية')}</button><button class="sideBtn ${state.view==='analytics'?'active':''}" onclick="view('analytics')">▥ ${msg('Learning Analytics','تحليلات التعلم')}</button>`;
for(let x of ['1','2','3']){sb+=`<div class="sidebarLabel">DOMAIN ${x}</div>`;sb+=DATA.modules.filter(y=>domain(y.id)===x).map(y=>{let n=y.lessons.filter(l=>reviewed(l[0])).length;return `<button class="sideBtn ${state.current===y.id&&state.view!=='home'?'active':''}" onclick="selectModule('${y.id}')"><b>${y.id} ${esc(y.name)}</b><div class="sideProgress">${n}/${y.lessons.length} ${msg('reviewed','مراجعة')} · ${state.attempts[y.id+':mastery']?.score>=.8?'✓ Mastered':state.attempts[y.id+':diagnostic']?'In progress':'Not started'}</div></button>`}).join('')}
sb+=`<button class="sideBtn ${state.view==='saved'?'active':''}" onclick="view('saved')">★ ${msg('Saved Lessons','الدروس المحفوظة')} (${state.fav.length})</button><button class="sideBtn" onclick="exportProgress('json')">↓ ${msg('Export Progress','تصدير التقدم')}</button><button class="sideBtn languageBtn" onclick="switchLanguage()">${state.lang==='ar'?'EN · English':'عربي · Arabic'}</button>`;$('sidebar').innerHTML=sb;
$('top').innerHTML=['home','saved','analytics'].includes(state.view)?'':`<div class="navTop"><div class="row"><div><span class="pill">DOMAIN ${d}</span><h2>${m.id} ${esc(m.name)}</h2><div class="muted small">${esc(m.intro)}</div></div><button class="btn" onclick="view('home')">${msg('All capabilities','جميع القدرات')}</button></div><div class="tabs">${[['dashboard','Dashboard','لوحة التقدم'],['diagnostic','1. Diagnostic Exam','١. التقييم التشخيصي'],['review','2. My Review','٢. مراجعتي'],['material','3. Full Material','٣. المحتوى الكامل'],['mastery','4. Mastery Check','٤. الإتقان'],['advanced','5. Advanced Scenarios','٥. سيناريوهات متقدمة']].map(x=>`<button class="tab ${state.view===x[0]?'active':''}" onclick="view('${x[0]}')">${msg(x[1],x[2])}${stageDone(m,x[0])?` <span class="tabDone" aria-label="Completed">✓ ${msg('Done','تم')}</span>`:x[0]==='mastery'&&!canMaster(m)?' 🔒':x[0]==='advanced'&&!canAdvanced(m)?' 🔒':''}</button>`).join('')}</div></div>`;
document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';document.documentElement.lang=state.lang;
}
function upgradedRender(){header();let m=mod();({home,dashboard,material,review,saved,analytics}[state.view]||(()=>testScreen(m,state.view)))(m);const shell=document.querySelector('.courseShell');shell?.classList.toggle('rtlMode',state.lang==='ar');}
function dashboard(m){let a=state.attempts,d=a[m.id+':diagnostic'],t=a[m.id+':mastery'],adv=a[m.id+':advanced'],n=m.lessons.filter(l=>reviewed(l[0])).length,total=m.lessons.length,gaps=currentMissed(m),left=outstanding(m),p=total?pct(n/total):0;
let step=!d?'diagnostic':left.length?'review':n<total?'material':!t||t.score<.8?'mastery':!adv?'advanced':'analytics';
$('body').innerHTML=`<div class="dashHero dashUpgrade"><div><span class="pill whitePill">${msg('PERSONAL LEARNING DASHBOARD','لوحة التعلم الشخصية')}</span><h1>${esc(m.name)}</h1><p>${msg('Review progress by lesson and build demonstrable mastery.','تابع التقدم على مستوى كل درس وحقق الإتقان القابل للقياس.')}</p></div><div class="progressRing" style="--val:${p}%"><span>${p}%<small>${msg('reviewed','مراجعة')}</small></span></div></div><div class="dashMetrics"><div class="dashMetric"><div class="skillTag">DIAGNOSTIC</div><strong>${d?pct(d.score)+'%':'—'}</strong><small>${d?gaps.length+' gap topics':msg('Ready to begin','جاهز للبدء')}</small></div><div class="dashMetric"><div class="skillTag">FULL MATERIAL</div><strong>${n}/${total}</strong><small>${msg('Reviewed lessons','الدروس المراجعة')}</small></div><div class="dashMetric"><div class="skillTag">MASTERY</div><strong>${t?pct(t.score)+'%':'—'}</strong><small>${t?.score>=.8?'✓ Passed':msg('Threshold: 80%','الحد المطلوب: 80%')}</small></div><div class="dashMetric"><div class="skillTag">ADVANCED</div><strong>${adv?pct(adv.score)+'%':'—'}</strong><small>${msg('Scenario application','تطبيق السيناريوهات')}</small></div></div><div class="dashPanels"><div class="panel"><h2>${msg('Recommended next action','الخطوة التالية الموصى بها')}</h2><p>${!d?msg('Start diagnostic to identify your baseline.','ابدأ التقييم التشخيصي لتحديد مستواك.'):left.length?msg('Review the lessons linked to missed diagnostic items.','راجع الدروس المرتبطة بالإجابات التشخيصية الخاطئة.'):n<total?msg('Complete the remaining lessons before mastery.','أكمل الدروس المتبقية قبل الإتقان.'):!canAdvanced(m)?msg('Take Mastery Check and reach at least 80%.','أكمل اختبار الإتقان بدرجة 80% على الأقل.'):msg('Apply learning in advanced workplace scenarios.','طبّق التعلم في السيناريوهات الوظيفية المتقدمة.')}</p><button class="btn primary" onclick="view('${step}')">${msg('Continue','متابعة')} →</button><div class="infoNote">${msg('Diagnostic-correct lessons are reviewed, not mastered.','الدروس التي تمت الإجابة عنها بشكل صحيح في التشخيص تعتبر مراجعة، وليست متقنة.')}</div></div><div class="panel"><h2>${msg('Priority learning gaps','الفجوات التعليمية')}</h2>${gaps.length?gaps.map(id=>{let x=lessonFor(id);return `<div class="gapLine"><button class="linkBtn" onclick="openLesson('${id}')">${id} · ${esc(x?.l[1]||id)}</button><span class="${reviewed(id)?'good':'warn'}">${reviewed(id)?msg('Reviewed','تمت المراجعة'):msg('Needs review','بحاجة لمراجعة')}</span></div>`}).join(''):`<p class="muted">${d?msg('No missed topics detected.','لم يتم رصد فجوات.'):msg('Complete the diagnostic to see your gaps.','أكمل التقييم لعرض الفجوات.')}</p>`}</div></div><div class="panel"><h2>${msg('Lesson-level skill map','خريطة المهارات لكل درس')}</h2><div class="gap">${m.lessons.map(l=>`<button class="chip ${reviewed(l[0])?'reviewedChip':''}" onclick="openLesson('${l[0]}')">${reviewed(l[0])?'✓ ':''}${l[0]} · ${esc(l[1])}</button>`).join('')}</div></div>`}
function material(m){if(m.preview){$('body').innerHTML='<div class="panel">Learning material has not been supplied for this capability.</div>';return}let focus=state.focus&&m.lessons.some(l=>l[0]===state.focus)?state.focus:null,n=m.lessons.filter(l=>reviewed(l[0])).length;
let cards=`<div class="moduleLessonList">${m.lessons.map(l=>`<button class="moduleLessonBtn ${focus===l[0]?'active':''} ${reviewed(l[0])?'done':''}" onclick="openLesson('${l[0]}')">${reviewed(l[0])?'✓ ':''}${l[0]} <small>${esc(l[1])}</small></button>`).join('')}</div>`;
let selected=focus?m.lessons.filter(l=>l[0]===focus):m.lessons;let blocks=selected.map((l,idx)=>{let status=state.autoReviewed?.[l[0]]?msg('✓ Reviewed · Diagnostic correct','✓ تمت المراجعة · إجابة تشخيصية صحيحة'):state.manualReviewed?.[l[0]]?msg('✓ Reviewed · Manual','✓ تمت المراجعة · يدوياً'):reviewed(l[0])?msg('✓ Reviewed','✓ تمت المراجعة'):msg('Not yet reviewed','لم تتم المراجعة');let idx0=m.lessons.findIndex(a=>a[0]===l[0]);return `<article class="lesson lessonAnimated" id="lesson-${l[0].replaceAll('.','-')}"><div class="row"><div><div class="skillTag">${msg('LESSON','درس')} ${l[0]}</div><h3>${esc(l[1])}</h3></div><button class="star" onclick="favorite('${l[0]}')">${state.fav.includes(l[0])?'★ '+msg('Saved','محفوظ'):'☆ '+msg('Save','حفظ')}</button></div><div class="learnblock hook"><div class="learnlabel">${msg('CONCEPT · LEARN AND UNDERSTAND','المفهوم · تعلّم وافهم')}</div>${esc(l[2])}</div><div class="learnblock example"><div class="learnlabel">${msg('WORKPLACE APPLICATION','تطبيق في مكان العمل')}</div>${esc(l[3])}</div>${lessonCheck(l)}<div class="lessonFooter"><span class="status">${status}</span><button class="btn ${reviewed(l[0])?'':'primary'}" onclick="markLesson('${l[0]}')" ${reviewed(l[0])?'disabled':''}>${reviewed(l[0])?msg('Already reviewed ✓','تمت المراجعة ✓'):msg('Mark reviewed ✓','تأكيد المراجعة ✓')}</button></div>${focus?`<div class="lessonNav"><button class="btn" ${idx0===0?'disabled':''} onclick="openLesson('${m.lessons[Math.max(0,idx0-1)][0]}')">${msg('← Previous','السابق')}</button><button class="btn primary" ${idx0===m.lessons.length-1?'disabled':''} onclick="openLesson('${m.lessons[Math.min(m.lessons.length-1,idx0+1)][0]}')">${msg('Next lesson →','الدرس التالي')}</button></div>`:''}</article>`}).join('');
$('body').innerHTML=`<div class="panel materialIntro"><span class="pill">3 · ${msg('FULL MATERIAL','المحتوى الكامل')}</span><h1>${esc(m.name)}</h1><p class="muted">${msg('Correct diagnostic responses automatically mark the related lessons Reviewed. A knowledge check provides practice but does not replace the Mastery Check.','الإجابات الصحيحة في التشخيص تعلّم الدروس المرتبطة بها كمراجعة تلقائياً. أسئلة تثبيت التعلم هي تدريب ولا تحل محل اختبار الإتقان.')}</p><div class="progress"><div style="width:${m.lessons.length?pct(n/m.lessons.length):0}%"></div></div><p class="small muted">${n}/${m.lessons.length} ${msg('reviewed','تمت مراجعتها')}</p><div class="row"><b>${msg('Choose a lesson','اختر درساً')}</b>${focus?`<button class="btn" onclick="state.focus=null;save();render()">${msg('View all lessons','عرض جميع الدروس')}</button>`:''}</div>${cards}</div><div class="conceptFlow">${blocks}</div>`}
function saved(){let groups=['1','2','3'].map(d=>({d,rows:state.fav.map(lessonFor).filter(x=>x&&domain(x.m.id)===d)}));$('body').innerHTML=`<div class="dashHero savedHero"><h1>★ ${msg('Lessons for Review','الدروس المحفوظة للمراجعة')}</h1><p>${state.fav.length} ${msg('saved lessons across three domains','دروس محفوظة من المجالات الثلاثة')}</p></div>${groups.map(g=>`<div class="panel"><h2>DOMAIN ${g.d} · ${g.rows.length} ${msg('saved','محفوظ')}</h2><div class="cardGrid">${g.rows.length?g.rows.map(x=>`<div class="card savedLesson"><span class="pill">${x.l[0]} ${reviewed(x.l[0])?'✓ Reviewed':''}</span><h3>${esc(x.l[1])}</h3><p class="muted">${esc(x.l[2])}</p><div class="actionBar"><button class="btn primary" onclick="openLesson('${x.l[0]}')">${msg('Open lesson','فتح الدرس')}</button><button class="btn" onclick="markLesson('${x.l[0]}')" ${reviewed(x.l[0])?'disabled':''}>${msg('Reviewed ✓','مراجعة ✓')}</button><button class="btn" onclick="favorite('${x.l[0]}')">${msg('Remove','إزالة')}</button></div></div>`).join(''):`<p class="muted">${msg('No saved lessons in this domain.','لا توجد دروس محفوظة في هذا المجال.')}</p>`}</div></div>`).join('')}`}
function analytics(){let domains=['1','2','3'].map(d=>{let ms=DATA.modules.filter(m=>domain(m.id)===d),ls=ms.flatMap(m=>m.lessons),att=ms.map(m=>state.attempts[m.id+':diagnostic']).filter(Boolean),master=ms.filter(m=>canAdvanced(m));return {d,ms,ls,att,master,rev:ls.filter(l=>reviewed(l[0])).length,gaps:ms.flatMap(m=>outstanding(m))}});let total=DATA.modules.reduce((s,m)=>s+m.lessons.length,0),revs=Object.keys(state.done).filter(id=>state.done[id]&&lessonFor(id)).length;
$('body').innerHTML=`<div class="dashHero"><h1>${msg('Learning Gap Analytics','تحليلات فجوات التعلم')}</h1><p>${msg('Personal learning data across all three domains · local browser data','بيانات تعلم شخصية للمجالات الثلاثة · محفوظة محلياً في المتصفح')}</p></div><div class="dashMetrics"><div class="dashMetric"><div class="skillTag">CAPABILITIES</div><strong>${DATA.modules.length}</strong></div><div class="dashMetric"><div class="skillTag">REVIEWED</div><strong>${revs}/${total}</strong></div><div class="dashMetric"><div class="skillTag">MASTERY ≥80%</div><strong>${DATA.modules.filter(m=>canAdvanced(m)).length}</strong></div><div class="dashMetric"><div class="skillTag">ASSESSMENT ATTEMPTS</div><strong>${Object.keys(state.attempts).length+state.attemptHistory.length}</strong></div></div><div class="panel"><h2>${msg('Domain readiness','جاهزية المجالات')}</h2>${appChart(domains.map(g=>({label:'Domain '+g.d+' · '+g.rev+'/'+g.ls.length+' reviewed',val:g.ls.length?pct(g.rev/g.ls.length):0})))}</div><div class="panel"><h2>${msg('Capability comparison','مقارنة القدرات')}</h2><div class="analyticsTableWrap"><table class="analyticsTable"><thead><tr><th>Capability</th><th>Diagnostic</th><th>Review</th><th>Mastery</th><th>Gap topics</th><th></th></tr></thead><tbody>${DATA.modules.map(m=>{let d=state.attempts[m.id+':diagnostic'],t=state.attempts[m.id+':mastery'],v=m.lessons.filter(l=>reviewed(l[0])).length;return `<tr><td>${m.id} ${esc(m.name)}</td><td>${d?pct(d.score)+'%':'—'}</td><td>${v}/${m.lessons.length}</td><td>${t?pct(t.score)+'%':'—'}</td><td>${outstanding(m).length}</td><td><button class="btn mini" onclick="selectModule('${m.id}')">${msg('Open','فتح')}</button></td></tr>`}).join('')}</tbody></table></div></div><div class="panel"><h2>${msg('Data export and reporting','تصدير البيانات والتقارير')}</h2><p class="muted">${msg('Includes diagnostic, mastery, advanced scenario attempts, saved lessons, review status and timestamped practice checks. Import is not performed automatically to prevent overwriting older learner progress.','يشمل نتائج التشخيص والإتقان والسيناريوهات المتقدمة والدروس المحفوظة وحالة المراجعة وتوقيتات التدريب. لا يتم استيراد بيانات تلقائياً لحماية التقدم السابق.')}</p><div class="actionBar"><button class="btn primary" onclick="exportProgress('csv')">↓ ${msg('Download CSV report','تقرير CSV')}</button><button class="btn" onclick="exportProgress('json')">↓ ${msg('Backup progress JSON','نسخة احتياطية JSON')}</button></div></div><div class="panel infoNote">${msg('These metrics reflect self-paced learning evidence; they are not validated employee performance or succession-readiness measures.','هذه المؤشرات تعكس تقدم التعلم الذاتي، وليست مقاييس معتمدة للأداء الوظيفي أو جاهزية التعاقب الوظيفي.')}</div>`}
function exportProgress(format){let records=DATA.modules.map(m=>({domain:domain(m.id),capability:m.id,name:m.name,lessons:m.lessons.length,reviewed:m.lessons.filter(l=>reviewed(l[0])).length,diagnostic:state.attempts[m.id+':diagnostic']?.score??'',mastery:state.attempts[m.id+':mastery']?.score??'',advanced:state.attempts[m.id+':advanced']?.score??'',unresolved_gaps:outstanding(m).length}));let data,mime,filename;if(format==='csv'){let keys=Object.keys(records[0]);data='\uFEFF'+[keys.join(','),...records.map(r=>keys.map(k=>'"'+String(r[k]).replace(/"/g,'""')+'"').join(','))].join('\r\n');mime='text/csv;charset=utf-8';filename='Talent_Development_Analytics.csv'}else{data=JSON.stringify({format:'TD-Adaptive-Academy-Backup',version:2,exportedAt:new Date().toISOString(),key:KEY,progress:state,analytics:records},null,2);mime='application/json';filename='Talent_Development_Progress_Backup.json'}let blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
// Keep current session resumable without altering the original attempt-grading semantics.
function choose(i){BASE_CHOOSE(i);if(sess){state.draft={mid:sess.mid,stage:sess.stage,answers:sess.answers.slice(),pos:sess.pos};state.lastResume={mid:sess.mid,stage:sess.stage,pos:sess.pos};save()}}
function nextQuestion(){let was=sess&&{mid:sess.mid,stage:sess.stage,pos:sess.pos,answers:sess.answers.slice(),n:sess.qs.length};if(was&&was.pos===was.n-1&&was.answers[was.pos]!==undefined){let old=state.attempts[was.mid+':'+was.stage];if(old)state.attemptHistory.push({capability:was.mid,stage:was.stage,...old});}BASE_NEXT();if(was){if(sess?.finished){delete state.draft;state.lastResume={mid:was.mid,stage:'dashboard'};}else if(sess){state.draft={mid:sess.mid,stage:sess.stage,pos:sess.pos,answers:sess.answers.slice()};state.lastResume={mid:sess.mid,stage:sess.stage,pos:sess.pos};}save()}}
const BASE_TEST=originalTestScreen;
function testScreen(m,stage){if(m.preview&&stage!=='diagnostic'){material(m);return}let draft=state.draft;if(!sess&&draft&&draft.mid===m.id&&draft.stage===stage&&Array.isArray(draft.answers)&&draft.answers.length<=getQs(m,stage).length){sess={stage,mid:m.id,qs:getQs(m,stage),answers:draft.answers.slice(),pos:Math.max(0,Math.min(draft.pos||0,getQs(m,stage).length-1)),finished:false}}BASE_TEST(m,stage)}
// Update labels after rendering only; never auto-translate source instructional content.
const EARLIER_RENDER=upgradedRender;
function localizeDynamic(){if(state.lang!=='ar')return;
 const mappings={'Diagnostic Exam':'التقييم التشخيصي','My personalized review':'مراجعتي الشخصية','Targeted gap analysis':'تحليل فجوات التعلم','Mastery Check':'اختبار الإتقان','Advanced Scenarios':'السيناريوهات المتقدمة','Question ':'السؤال ','Next question →':'السؤال التالي ←','Submit assessment':'إرسال التقييم','← Previous':'السابق','Start diagnostic →':'ابدأ التقييم','Retake diagnostic':'إعادة التقييم','Open full material →':'فتح المحتوى الكامل','Your capability diagnostic profile':'ملف التقييم التشخيصي','Mastery check results':'نتائج الإتقان','Scenario practice results':'نتائج السيناريوهات','Answer review':'مراجعة الإجابات','Your answer:':'إجابتك:','Best answer:':'أفضل إجابة:','Needs review':'بحاجة لمراجعة','Correct':'صحيح','Study related lesson':'دراسة الدرس المرتبط','Retake assessment':'إعادة التقييم','Open full material':'فتح المحتوى الكامل'};
 document.querySelectorAll('#body h1,#body h2,#body button,#body .pill,#body .small b').forEach(el=>{if(el.children.length===0){let t=el.textContent.trim(),v=mappings[t];if(v)el.textContent=v;else if(t.startsWith('Question ')&&/^Question \d+ \/ \d+$/.test(t))el.textContent=t.replace('Question ','السؤال ');}});
}
function render(){EARLIER_RENDER();localizeDynamic();const bar=document.querySelector('#top .tabs');if(bar){const active=bar.querySelector('.tab.active');if(active){const left=active.offsetLeft-bar.offsetLeft;const right=left+active.offsetWidth;if(left<bar.scrollLeft)bar.scrollLeft=left;else if(right>bar.scrollLeft+bar.clientWidth)bar.scrollLeft=right-bar.clientWidth+8;}}document.body.classList.toggle('arabicUI',state.lang==='ar');const txt=state.lang==='ar'?'اللغة: عربي / English':'Language: English / عربي';let btn=document.getElementById('languageFloat');if(!btn){btn=document.createElement('button');btn.id='languageFloat';btn.className='languageFloat';btn.onclick=switchLanguage;document.body.appendChild(btn)}btn.textContent=txt}


/* Human-authored Arabic learning renditions. English originals are retained for switching and detailed source reference. */
const AR_CAPABILITIES={"1.1":"التواصل","1.2":"الذكاء العاطفي واتخاذ القرار","1.3":"التعاون والقيادة","1.4":"الوعي الثقافي والشمول","1.5":"إدارة المشاريع","1.6":"الالتزام والسلوك الأخلاقي","1.7":"التعلم مدى الحياة","2.1":"علوم التعلم","2.2":"التصميم التعليمي","2.3":"تقديم التدريب والتيسير","2.4":"تطبيق التكنولوجيا","2.5":"إدارة المعرفة","2.6":"التطوير المهني والقيادي","2.7":"Coaching","2.8":"تقييم الأثر","3.1":"فهم الأعمال","3.2":"الاستشارة والشراكة مع الأعمال","3.3":"التطوير التنظيمي والثقافة","3.4":"استراتيجية المواهب وإدارتها","3.5":"تحسين الأداء","3.6":"إدارة التغيير","3.7":"البيانات والتحليلات","3.8":"الاستعداد للمستقبل"};
const ORIGINAL_LESSONS=DATA.modules.map(m=>({m,n:m.name,intro:m.intro,ls:m.lessons.map(l=>({l,title:l[1],body:l[2],activity:l[3]}))}));
function synchronizeCourseLocale(){
  const ar=state.lang==='ar';
  for(const m of ORIGINAL_LESSONS){
    m.m.name=ar?(AR_CAPABILITIES[m.m.id]||m.n):m.n;
    m.m.intro=ar?('تتناول هذه القدرة المهنية «'+m.m.name+'» وتوضح كيفية تطبيق مفاهيمها في سياق Talent Development ونتائج العمل.'):m.intro;
    for(const z of m.ls){
      const a=AR_LESSONS[z.l[0]];
      z.l[1]=ar&&a?a[0]:z.title;
      z.l[2]=ar&&a?a[1]:z.body;
      z.l[3]=ar&&a?('نشاط تطبيقي: اختر موقفاً حقيقياً من عملك، واشرح كيف ستستخدم '+a[0]+'، وحدد دليلاً قابلاً للملاحظة على نجاح التطبيق.'):z.activity;
    }
  }
}
const RENDER_PRE_AR_PATCH=render;
render=function(){
 synchronizeCourseLocale();
 RENDER_PRE_AR_PATCH();
 if(state.lang==='ar'){
   const body=document.getElementById('body');
   const ids=body?.querySelectorAll('.microCheck');
   /* Practice checks remain sourced from the English assessment bank. Flag them clearly rather than misrepresenting a partial translation as complete. */
   if(ids&&ids.length){ids.forEach(el=>{const note=document.createElement('div');note.className='translationNotice';note.textContent='سؤال المراجعة وخياراته متاحة حالياً باللغة الإنجليزية؛ لا يؤثر ذلك في تسجيل التقدم.';el.insertBefore(note,el.firstChild)});}
   const mat=body?.querySelector('.materialIntro');
   if(mat){const note=document.createElement('div');note.className='translationNotice';note.textContent='ملاحظة: هذا الشرح العربي إعادة صياغة تعليمية موجزة للمفاهيم؛ للحصول على جميع تفاصيل المرجع الأصلي، بدّل إلى English. لم تُستكمل ترجمة بنك الأسئلة بعد.';mat.appendChild(note);}
 }
};


/* v15: Two separately mapped diagnostic items per lesson; do not equate an old one-item attempt with mastery. */
const BANK_VERSION='lesson-pair-v15';
const PREV_GETQS=getQs;
getQs=function(m,stage){
 if(stage==='advanced'){
  const base=PREV_GETQS(m,stage);
  return base.map((x,i)=>BALANCED_ADVANCED_BANK[m.id]?.[i]?{...x,opts:BALANCED_ADVANCED_BANK[m.id][i].opts.slice()}:x);
 }
 if(m.preview)return PREV_GETQS(m,stage);
 if(stage==='diagnostic'||stage==='mastery'){
   const q=m.lessons.flatMap(l=>(TWO_QUESTION_BANK[l[0]]||[]).map(x=>({...x,opts:x.opts.slice()})));
   return stage==='mastery'?q.slice().reverse():q;
 }
 return PREV_GETQS(m,stage);
};
// Keep every historical attempt, including its original question count. Old attempts cannot earn a new 2/2 completion.
state.legacyAttempts??={};state.lessonProof??={};state.studiedLessons??={};
for(const m of DATA.modules){
 for(const stage of ['diagnostic','mastery']){
   const key=m.id+':'+stage,attempt=state.attempts[key];
   if(attempt&&attempt.bankVersion!==BANK_VERSION){
     state.legacyAttempts[key]=state.legacyAttempts[key]||attempt;
     delete state.attempts[key];
   }
 }
 for(const l of m.lessons){
   const id=l[0];
   if(state.done[id]&&!state.lessonProof[id]){
     state.studiedLessons[id]=true;
     delete state.done[id];
     if(state.autoReviewed)delete state.autoReviewed[id];
   }
 }
}
// Previously answered drafts point at a different-sized exam, so archive their status before starting the new bank.
if(state.draft&&state.draft.stage!=='advanced'){
 state.legacyDraft=state.draft;delete state.draft;
}
function lessonPairResult(m,attempt){
 if(!attempt||attempt.bankVersion!==BANK_VERSION||!Array.isArray(attempt.answers))return null;
 const questions=getQs(m,'diagnostic');
 if(questions.length!==attempt.answers.length)return null;
 const results={};
 questions.forEach((q,i)=>{(results[q.target]??=[]).push(attempt.answers[i]===q.answer)});
 return results;
}
syncDiagnosticReview=function(m,attempt){
 const groups=lessonPairResult(m,attempt);if(!groups)return;
 for(const l of m.lessons){
   const id=l[0],v=groups[id]||[];
   const passed=v.length===2&&v.every(Boolean);
   state.lessonProof[id]={correct:v.filter(Boolean).length,total:v.length,passed,ts:attempt.ts};
   // An incorrect response always removes a previously conferred automatic Done, including a retake.
   state.done[id]=passed;
   state.autoReviewed??={};state.autoReviewed[id]=passed;
 }
};
// Manual study can be tracked without overriding the two-correct-answer validation.
markLesson=function(id){state.studiedLessons[id]=true;state.manualReviewed[id]=true;state.lessonVisits[id]=Date.now();save();render()};
// Ensure attempt metadata is present BEFORE reviewing diagnostic answers.
const ORIGINAL_FINISH_PAIR=originalNextQuestion;
originalNextQuestion=function(){
 const last=!!sess&&sess.pos===sess.qs.length-1&&sess.answers[sess.pos]!==undefined;
 const id=sess?.mid,stage=sess?.stage;
 ORIGINAL_FINISH_PAIR();
 if(last){
  const a=state.attempts[id+':'+stage];
  if(a){a.bankVersion=BANK_VERSION;
    if(stage==='diagnostic')syncDiagnosticReview(DATA.modules.find(m=>m.id===id),a);
    save();render();
  }
 }
};
// BASE_NEXT was bound before this patch, so replace the wrapper with one that invokes updated finishing logic.
nextQuestion=function(){
 if(!sess||sess.answers[sess.pos]===undefined)return;
 const old=sess,wasLast=sess.pos===sess.qs.length-1;
 if(wasLast&&state.attempts[sess.mid+':'+sess.stage]){
   state.attemptHistory.push({capability:sess.mid,stage:sess.stage,...state.attempts[sess.mid+':'+sess.stage]});
 }
 originalNextQuestion();
 if(wasLast){delete state.draft;state.lastResume={mid:old.mid,stage:'dashboard'}}
 else if(sess){state.draft={mid:sess.mid,stage:sess.stage,pos:sess.pos,answers:sess.answers.slice()};state.lastResume={mid:sess.mid,stage:sess.stage,pos:sess.pos}}
 save();
};
// Track manual lesson study, but do not let it bypass the 2/2 diagnostic completion rule.
const BASE_MATERIAL_PAIR=material;
material=function(m){BASE_MATERIAL_PAIR(m);
 if(m.preview)return;
 const root=document.getElementById('body');
 root.querySelectorAll('.materialLesson,.lesson').forEach(node=>{
   const tag=node.querySelector('.skillTag');if(!tag)return;
   const id=tag.textContent.match(/\d+\.\d+\.\d+/)?.[0];
   if(!id||!TWO_QUESTION_BANK[id])return;
   const proof=state.lessonProof[id],status=node.querySelector('.status,.reviewBadge');
   if(status){
      status.textContent=proof?(proof.passed?'✓ Done · 2/2 diagnostic':`Needs Review · ${proof.correct}/2 diagnostic`):'Needs Review · Diagnostic 2/2 not yet verified';
      status.classList.toggle('pairNeedsReview',!proof?.passed);
   }
   const btn=[...node.querySelectorAll('button')].find(b=>/mark reviewed|reviewed|مراجعة/i.test(b.textContent));
   if(btn){btn.textContent=msg('Mark as studied','تحديد كمادة تمت دراستها');btn.onclick=()=>markLesson(id);}
 });
};
// In-lesson knowledge checks use the same two polished items, without altering diagnostic evidence.
quickCheck=function(id,questionIndex,answer){
 const questions=TWO_QUESTION_BANK[id];if(!questions)return;
 const old=state.checks[id]&&Array.isArray(state.checks[id].answers)?state.checks[id].answers:[null,null];
 const answers=old.slice();answers[questionIndex]=answer;
 state.checks[id]={answers,correct:answers.every((a,i)=>a===questions[i].answer),ts:new Date().toISOString()};
 save();render();
};
lessonCheck=function(l){
 const id=l[0],items=TWO_QUESTION_BANK[id];if(!items)return '';
 const c=state.checks[id],answers=c&&Array.isArray(c.answers)?c.answers:[null,null];
 const correct=items.filter((q,i)=>answers[i]===q.answer).length;
 return `<div class="microCheck"><div class="learnlabel">${msg('KNOWLEDGE CHECK · TWO PRACTICE QUESTIONS','مراجعة الفهم · سؤالان للتدريب')}</div>
 ${items.map((q,n)=>`<div class="pairCheck"><div class="pairQuestion">${n+1}/2 · ${esc(q.q)}</div>${q.opts.map((a,i)=>`<button class="microOption ${answers[n]===i?(i===q.answer?'correctChoice':'incorrectChoice'):''}" onclick="quickCheck('${id}',${n},${i})">${'ABCD'[i]}. ${esc(a)}</button>`).join('')}${answers[n]!=null?`<div class="feedback">${answers[n]===q.answer?msg('Correct','صحيح'):msg('Not yet correct','الإجابة غير صحيحة')} · ${esc(q.why)}</div>`:''}</div>`).join('')}
 <div class="pairStatus">${answers.every(x=>x!=null)?(correct===2?msg('Practice result: 2/2 correct','نتيجة التدريب: ٢/٢ صحيحتان'):msg('Practice result: '+correct+'/2. Review and retry.','نتيجة التدريب: '+correct+'/2. راجع الدرس وحاول مرة أخرى.')):msg('Practice only. Diagnostic completion requires both answers correct.','تدريب فقط. اجتياز التشخيص يتطلب إجابتين صحيحتين.')}</div></div>`;
};
// Re-check current two-item evidence, without ever promoting old single-item results.
for(const m of DATA.modules){const a=state.attempts[m.id+':diagnostic'];if(a)syncDiagnosticReview(m,a)}
save();

render();

/* v17: Concept-aligned Arabic assessment alternatives. No runtime translation service.
   Arabic responses are written from the matching Arabic lesson summary; answer
   positions and question IDs are kept stable when language is switched mid-test. */
const ASSESSMENT_BASE_GETQS=getQs;
function arabicConceptItem(q,index){
 const lesson=AR_LESSONS[q.target];
 if(!lesson)return q;
 const topic=lesson[0],summary=lesson[1];
 const steps=summary.split(/[.!؟]+/).map(s=>s.trim()).filter(s=>s.length>22);
 const correct=(steps[index%Math.max(1,steps.length)]||summary).replace(/[،؛\s]+$/,'')+'.';
 const bad=[
  'الاعتماد على الانطباعات الشخصية دون التحقق من المعلومات أو السياق.',
  'تطبيق الحل نفسه مع الجميع دون مراعاة الاختلافات واحتياجات العمل.',
  'التركيز على إكمال النشاط فقط دون فحص ما تعلّمه المشاركون أو أثره.',
  'تجاهل الأدلة والتغذية الراجعة والاكتفاء بالافتراضات الأولية.',
  'اتخاذ قرار نهائي قبل فهم المشكلة ومناقشة البدائل.',
  'اختيار الأسلوب الأكثر شيوعاً دون ربطه بهدف التعلم أو الأداء.'
 ];
 const answer=q.answer;
 const opts=[];let k=index*3;
 for(let i=0;i<4;i++)opts.push(i===answer?correct:bad[(k++)%bad.length]);
 return {...q,title:topic,
  q:index%2===0?
   'في موقف عمل يتطلب «'+topic+'»، أي ممارسة تعكس فهماً صحيحاً للمفهوم؟':
   'أي تصرف يتفق أكثر مع تطبيق «'+topic+'» في العمل؟',
  opts,why:'يرتبط الاختيار الصحيح بمبادئ الدرس: '+correct,
  arabicAlternative:true};
}
function localizedPair(id){
 const base=TWO_QUESTION_BANK[id]||[];
 return state.lang==='ar'?base.map((q,i)=>arabicConceptItem(q,i)):base;
}
getQs=function(m,stage){
 const qs=ASSESSMENT_BASE_GETQS(m,stage);
 if(state.lang!=='ar'||(stage!=='diagnostic'&&stage!=='mastery')||m.preview)return qs;
 const counts={};
 return qs.map(q=>{const n=counts[q.target]||0;counts[q.target]=n+1;return arabicConceptItem(q,n)});
};
lessonCheck=function(l){
 const id=l[0],items=localizedPair(id);if(!items.length)return '';
 const c=state.checks[id],answers=c&&Array.isArray(c.answers)?c.answers:[null,null];
 const correct=items.filter((q,i)=>answers[i]===q.answer).length;
 return '<div class="microCheck"><div class="learnlabel">'+msg('KNOWLEDGE CHECK · TWO PRACTICE QUESTIONS','مراجعة الفهم · سؤالان للتدريب')+'</div>'+
 items.map((q,n)=>'<div class="pairCheck"><div class="pairQuestion">'+(n+1)+'/2 · '+esc(q.q)+'</div>'+
 q.opts.map((a,i)=>'<button class="microOption '+(answers[n]===i?(i===q.answer?'correctChoice':'incorrectChoice'):'')+'" onclick="quickCheck(\''+id+'\','+n+','+i+')">'+ 'ABCD'[i]+'. '+esc(a)+'</button>').join('')+
 (answers[n]!=null?'<div class="feedback">'+(answers[n]===q.answer?msg('Correct','صحيح'):msg('Not yet correct','الإجابة غير صحيحة'))+' · '+esc(q.why)+'</div>':'')+'</div>').join('')+
 '<div class="pairStatus">'+(answers.every(x=>x!=null)?(correct===2?msg('Practice result: 2/2 correct','نتيجة التدريب: ٢/٢ صحيحتان'):msg('Practice result: '+correct+'/2. Review and retry.','نتيجة التدريب: '+correct+'/2. راجع الدرس وحاول مرة أخرى.')):msg('Practice only. Diagnostic completion requires both answers correct.','تدريب فقط. اجتياز التشخيص يتطلب إجابتين صحيحتين.'))+'</div></div>';
};
const RENDER_BEFORE_ASSESSMENT_LOCALE=render;
render=function(){
 if(sess&&!sess.finished&&state.lang==='ar'&&['diagnostic','mastery'].includes(sess.stage)){
  const m=DATA.modules.find(m=>m.id===sess.mid);
  if(m)sess.qs=getQs(m,sess.stage);
 }else if(sess&&!sess.finished&&state.lang==='en'&&['diagnostic','mastery'].includes(sess.stage)){
  const m=DATA.modules.find(m=>m.id===sess.mid);
  if(m)sess.qs=getQs(m,sess.stage);
 }
 RENDER_BEFORE_ASSESSMENT_LOCALE();
 if(state.lang==='ar'){
  document.querySelectorAll('#body .microCheck .translationNotice').forEach(el=>el.remove());
  const old=document.querySelector('#body .materialIntro .translationNotice');
  if(old)old.textContent='الأسئلة التشخيصية وأسئلة الإتقان ومراجعة الدروس متاحة بالعربية بصياغات تطبيقية مبنية على المفاهيم نفسها. قد تبقى بعض السيناريوهات المتقدمة باللغة الإنجليزية إلى حين مراجعة ترجمتها.';
  const isEnglishAssessment=sess&&(!['diagnostic','mastery'].includes(sess.stage)||mod().preview);
  if(isEnglishAssessment&&document.querySelector('#body .qBox')&&!document.querySelector('#body .qBox .translationNotice')){
   const note=document.createElement('p');note.className='translationNotice';note.textContent='هذا السيناريو متاح حالياً بالإنجليزية. لم تُراجع نسخته العربية بعد.';
   document.querySelector('#body .qBox').prepend(note);
  }
 }
};
render();


/* v18: lesson completion reflects both explicit study and knowledge-check success.
   Preserve diagnostic evidence separately; a retake cannot erase manual completion. */
function lessonCheckPassed(id){
 const qs=TWO_QUESTION_BANK[id]||[],a=state.checks?.[id]?.answers;
 return qs.length===2&&Array.isArray(a)&&qs.every((q,i)=>a[i]===q.answer);
}
function completeLesson(id,source){
 if(!lessonFor(id))return;
 state.done[id]=true;
 state.manualReviewed??={};
 state.studiedLessons??={};
 state.lessonVisits??={};
 if(source==='manual'){state.manualReviewed[id]=true;state.studiedLessons[id]=true;}
 state.lessonVisits[id]=Date.now();
 save();
}
markLesson=function(id){completeLesson(id,'manual');render();};
quickCheck=function(id,questionIndex,answer){
 const qs=TWO_QUESTION_BANK[id];
 if(!qs||questionIndex<0||questionIndex>=qs.length)return;
 const previous=state.checks[id]?.answers;
 const answers=Array.isArray(previous)?previous.slice():[null,null];
 answers[questionIndex]=answer;
 state.checks[id]={answers,correct:qs.every((q,i)=>answers[i]===q.answer),ts:new Date().toISOString()};
 if(lessonCheckPassed(id))completeLesson(id,'check');
 save();render();
};
const PREVIOUS_DIAGNOSTIC_COMPLETION=syncDiagnosticReview;
syncDiagnosticReview=function(m,attempt){
 PREVIOUS_DIAGNOSTIC_COMPLETION(m,attempt);
 if(!m||m.preview)return;
 for(const l of m.lessons){
  const id=l[0];
  if(state.manualReviewed?.[id]||lessonCheckPassed(id))state.done[id]=true;
 }
};
for(const m of DATA.modules){
 for(const l of m.lessons){
  const id=l[0];
  if(state.manualReviewed?.[id]||lessonCheckPassed(id))state.done[id]=true;
 }
}
function detailedQuestionFeedback(q,selectedIndex){
 const good=q.opts[q.answer],selected=q.opts[selectedIndex];
 const concept=q.title||AR_LESSONS[q.target]?.[0]||'the lesson concept';
 const isArabic=state.lang==='ar';
 if(isArabic){
  const name=AR_LESSONS[q.target]?.[0]||concept;
  const explanation=q.arabicAlternative?q.why:'المبدأ الأساسي: '+(AR_LESSONS[q.target]?.[1]||q.why);
  return '<strong>'+(selectedIndex===q.answer?'إجابة صحيحة':'لنراجع الفكرة')+'</strong><p><b>لماذا؟</b> '+esc(explanation)+'</p>'+
  '<p><b>الإجابة الأنسب:</b> '+esc(good)+'</p>'+
  (selectedIndex===q.answer?'':'<p><b>لماذا نراجع الاختيار؟</b> الخيار الذي اخترته لا يطبّق المبدأ المطلوب في هذا السياق: '+esc(selected)+'</p>')+
  '<p><b>تذكر:</b> عند تطبيق «'+esc(name)+'»، ابحث عن سلوك واضح يناسب الموقف، وليس مجرد إكمال نشاط.</p>';
 }
 return '<strong>'+(selectedIndex===q.answer?'Correct — you applied the concept.':'Let’s clarify the concept.')+'</strong>'+
 '<p><b>Why it matters:</b> '+esc(q.why||'Connect the decision to the specific learning goal and the workplace context.')+'</p>'+
 '<p><b>Best answer:</b> '+esc(good)+'</p>'+
 (selectedIndex===q.answer?'':'<p><b>Why your selection is less suitable:</b> '+esc(selected)+'. Compare it with the intended outcome and the evidence in the situation.</p>')+
 '<p><b>Remember:</b> '+esc(concept)+' is demonstrated through a relevant workplace decision, not simply by completing an activity.</p>';
}
lessonCheck=function(l){
 const id=l[0],items=localizedPair(id);if(!items.length)return '';
 const answers=Array.isArray(state.checks[id]?.answers)?state.checks[id].answers:[null,null];
 const correct=items.filter((q,i)=>answers[i]===q.answer).length;
 return '<div class="microCheck"><div class="learnlabel">'+msg('CHECK YOUR UNDERSTANDING · TWO QUESTIONS','تحقق من فهمك · سؤالان')+'</div>'+
 items.map((q,n)=>'<div class="pairCheck"><div class="pairQuestion">'+(n+1)+'/2 · '+esc(q.q)+'</div>'+
 q.opts.map((o,i)=>'<button class="microOption '+(answers[n]===i?(i===q.answer?'correctChoice':'incorrectChoice'):'')+'" onclick="quickCheck(\''+id+'\','+n+','+i+')">'+ 'ABCD'[i]+'. '+esc(o)+'</button>').join('')+
 (answers[n]!=null?'<div class="feedback">'+detailedQuestionFeedback(q,answers[n])+'</div>':'')+'</div>').join('')+
 '<div class="pairStatus">'+(lessonCheckPassed(id)?msg('✓ Lesson completed — both answers are correct.','✓ اكتمل الدرس — الإجابتان صحيحتان.'):msg('Progress: '+correct+'/2 correct. Answer both correctly to complete the lesson, or use Mark Completed.','التقدم: '+correct+'/2 صحيح. أجب عن السؤالين بشكل صحيح لإكمال الدرس، أو استخدم زر إكمال الدرس.'))+'</div></div>';
};
const PREVIOUS_MATERIAL_COMPLETION=material;
material=function(m){
 PREVIOUS_MATERIAL_COMPLETION(m);
 if(m.preview)return;
 const root=document.getElementById('body');
 root.querySelectorAll('.lesson').forEach(node=>{
  const id=node.id?.replace(/^lesson-/,'').replace(/-/g,'.');
  if(!id||!lessonFor(id))return;
  const done=!!state.done[id],proof=state.lessonProof?.[id];
  const status=node.querySelector('.lessonFooter .status');
  if(status)status.textContent=done?
   (lessonCheckPassed(id)?msg('✓ Done · Knowledge check passed','✓ مكتمل · اجتياز أسئلة الفهم'):state.manualReviewed?.[id]?msg('✓ Done · Marked completed','✓ مكتمل · تم تحديده يدوياً'):msg('✓ Done · Diagnostic evidence','✓ مكتمل · دليل تشخيصي')):
   (proof?msg('Needs review · '+proof.correct+'/2 diagnostic','يحتاج مراجعة · '+proof.correct+'/2 في التشخيص'):msg('Not yet completed','لم يكتمل بعد'));
  const button=node.querySelector('.lessonFooter button');
  if(button){
   button.textContent=done?msg('Completed ✓','مكتمل ✓'):msg('Mark Completed ✓','تحديد كمكتمل ✓');
   button.disabled=done;
   button.onclick=()=>markLesson(id);
  }
 });
};
const PREVIOUS_TEST_FEEDBACK_RENDER=render;
render=function(){
 PREVIOUS_TEST_FEEDBACK_RENDER();
 if(!sess||sess.finished||sess.stage==='diagnostic')return;
 const q=sess.qs?.[sess.pos],a=sess.answers?.[sess.pos];
 if(!q||a==null)return;
 const box=document.querySelector('#body .qBox .feedback');
 if(box)box.innerHTML=detailedQuestionFeedback(q,a);
};
save();
render();


/* v18b: Replace exercise instructions with concrete concept demonstrations.
   Draw on the lesson's existing scenario, answer and rationale so examples
   remain grounded in the curriculum rather than invented source claims. */
function workplaceExample(l){
 const id=l[0],title=l[1],question=l[4]||'',best=l[5]?.[l[6]]||'',why=l[7]||'';
 if(state.lang==='ar'){
  const name=AR_LESSONS[id]?.[0]||title;
  const summary=AR_LESSONS[id]?.[1]||'';
  const sentence=summary.split(/[.!؟]/).map(x=>x.trim()).find(x=>x.length>28)||summary;
  return 'مثال من واقع العمل: يواجه مسؤول تطوير المواهب في مؤسسة تحدياً يتطلب «'+name+'». بدلاً من اختيار نشاط تدريبي لمجرد التنفيذ، يتخذ قراراً مستنداً إلى هذا المبدأ: '+sentence.replace(/[،؛\s]+$/,'')+'. ثم يراجع النتيجة في سلوك الموظفين والعمل الفعلي ليتأكد من ملاءمة القرار.';
 }
 const premise=question.split(/(?<=\.)\s+(?=(?:What|Which|How|Who|Why|When|Where|As)\b)/)[0];
 const usefulPremise=premise!==question&&premise.length>28&&!premise.includes('?');
 if(usefulPremise){
  return 'Real-life example: '+premise+' In this situation, the appropriate workplace response is: '+best.replace(/[.!?]+$/,'')+'. '+why;
 }
 return 'Real-life example: A talent development team is making a workplace decision about '+title.toLowerCase()+'. The team uses this approach: '+best.replace(/[.!?]+$/,'')+'. '+why;
}
const MATERIAL_BEFORE_REAL_EXAMPLES=material;
material=function(m){
 if(!m.preview){
  for(const l of m.lessons)l[3]=workplaceExample(l);
 }
 MATERIAL_BEFORE_REAL_EXAMPLES(m);
 const root=document.getElementById('body');
 root.querySelectorAll('.learnblock.example .learnlabel').forEach(label=>{
  label.textContent=msg('REAL-LIFE WORKPLACE EXAMPLE','مثال واقعي من بيئة العمل');
 });
};
const RENDER_BEFORE_DETAILED_RESULT=render;
render=function(){
 RENDER_BEFORE_DETAILED_RESULT();
 if(!sess?.finished||!['diagnostic','mastery','advanced'].includes(sess.stage))return;
 const cards=document.querySelectorAll('#body .qBox .lesson');
 if(cards.length!==sess.qs.length)return;
 cards.forEach((card,i)=>{
  const q=sess.qs[i],a=sess.answers[i],box=card.querySelector('.feedback');
  if(box&&q&&a!=null)box.innerHTML=detailedQuestionFeedback(q,a);
 });
};
render();
