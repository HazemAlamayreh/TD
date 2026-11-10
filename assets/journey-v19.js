
/* ATD Academy v19 — domain dashboards, open pathways, distinct completion/mastery,
   foundational diagnostic with Skip, and multi-step professional case practice. */
const JOURNEY_VERSION='concept-diagnostic-v19';
state.mastered??={};
state.caseHistory??=[];
state.domainDashboard??='1';
state.knowledgeGaps??={};
state.legacyAttempts??={};
if(state.journeyVersion!==JOURNEY_VERSION){
 for(const m of DATA.modules)for(const phase of ['diagnostic','mastery']){
  const k=m.id+':'+phase;
  if(state.attempts[k]){state.legacyAttempts[k+'@'+(state.journeyVersion||'previous')]=state.attempts[k];delete state.attempts[k];}
 }
 if(state.draft&&['diagnostic','mastery'].includes(state.draft.stage)){state.legacyDraft=state.draft;delete state.draft;}
 state.journeyVersion=JOURNEY_VERSION;
 if(state.view==='dashboard')state.view='diagnostic';
 save();
}
const JOURNEY_GETQS=getQs;
function foundationQuestions(m){
 if(m.preview){
  return (DATA.domain2Questions[m.id]||[]).map((x,i)=>({
   id:m.id+'-foundation-'+i,target:m.id,title:m.name,
   q:x[0],opts:x[1].slice(),answer:x[2],why:x[3]
  }));
 }
 const lessons=m.lessons;
 return lessons.map((l,i)=>{
  const ar=state.lang==='ar',topic=ar?(AR_LESSONS[l[0]]?.[0]||l[1]):l[1];
  const summary=ar?(AR_LESSONS[l[0]]?.[1]||l[2]):l[2];
  const correct=(summary.split(/[.!؟]/).map(s=>s.trim()).find(s=>s.length>25)||summary).slice(0,285);
  const decoys=[];
  for(let k=1;k<lessons.length&&decoys.length<3;k++){
   const other=lessons[(i+k)%lessons.length];
   const body=ar?(AR_LESSONS[other[0]]?.[1]||other[2]):other[2];
   const sentence=(body.split(/[.!؟]/).map(s=>s.trim()).find(s=>s.length>25)||body).slice(0,285);
   if(sentence!==correct&&!decoys.includes(sentence))decoys.push(sentence);
  }
  while(decoys.length<3)decoys.push(ar?['الاعتماد على التوقعات من دون التحقق من الواقع','قياس الحضور فقط بدلاً من نتائج التعلم','تطبيق أسلوب واحد على جميع الحالات'][decoys.length] : ['Make a decision without validating the need','Measure attendance rather than learning outcomes','Apply the same solution regardless of context'][decoys.length]);
  const answer=i%4,opts=decoys.slice();opts.splice(answer,0,correct);
  return {id:l[0]+'-foundation',target:l[0],title:topic,
   q:ar?'أي عبارة تصف الفكرة الأساسية لـ «'+topic+'» بدقة أكبر؟':'Which statement best describes the core idea of "'+topic+'"?',
   opts,answer,why:ar?'المبدأ في الدرس: '+correct:'The lesson explains this principle: '+correct};
 });
}
getQs=function(m,stage){
 if(stage==='diagnostic')return foundationQuestions(m);
 if(stage==='mastery'){
  if(m.preview)return JOURNEY_GETQS(m,'diagnostic');
  const qs=m.lessons.flatMap(l=>(TWO_QUESTION_BANK[l[0]]||[]).map(q=>({...q,opts:q.opts.slice()})));
  if(state.lang==='ar'){
   const counts={};
   return qs.map(q=>{const n=counts[q.target]||0;counts[q.target]=n+1;return arabicConceptItem(q,n)});
  }
  return qs;
 }
 return JOURNEY_GETQS(m,stage);
};
function jumpToDomain(d){state.domainDashboard=String(d);state.view='domain-dashboard';sess=null;save();render();}
function domainDashboardScreen(){
 const d=state.domainDashboard||'1',ms=DATA.modules.filter(m=>domain(m.id)===d);
 const ls=ms.flatMap(m=>m.lessons),done=ls.filter(l=>state.done[l[0]]).length,master=ls.filter(l=>state.mastered[l[0]]).length;
 const dAttempts=ms.filter(m=>state.attempts[m.id+':diagnostic']).length;
 const mAttempts=ms.filter(m=>state.attempts[m.id+':mastery']).length;
 const aAttempts=ms.filter(m=>state.attempts[m.id+':advanced']).length;
 $('body').innerHTML='<div class="dashHero dashUpgrade"><h1>'+msg('Domain '+d+' Dashboard','لوحة تحليلات المجال '+d)+'</h1><p>'+msg('A domain-level view of completion, demonstrated mastery and assessments.','ملخص مستوى المجال: إكمال الدروس، والإتقان المثبت، والتقييمات.')+'</p></div>'+
 '<div class="dashMetrics"><div class="dashMetric"><div class="skillTag">'+msg('LESSONS COMPLETED','الدروس المكتملة')+'</div><strong>'+done+'/'+ls.length+'</strong></div><div class="dashMetric"><div class="skillTag">'+msg('LESSONS MASTERED','الدروس المتقنة')+'</div><strong>'+master+'/'+ls.length+'</strong></div><div class="dashMetric"><div class="skillTag">'+msg('DIAGNOSTICS','الاختبارات التشخيصية')+'</div><strong>'+dAttempts+'/'+ms.length+'</strong></div><div class="dashMetric"><div class="skillTag">'+msg('MASTERY ASSESSMENTS','اختبارات الإتقان')+'</div><strong>'+mAttempts+'/'+ms.length+'</strong></div></div>'+
 '<div class="panel"><h2>'+msg('Capability-level progress','التقدم حسب القدرة')+'</h2><div class="analyticsTableWrap"><table class="analyticsTable"><thead><tr><th>'+msg('Capability','القدرة')+'</th><th>Completed</th><th>Mastered</th><th>Diagnostic</th><th>Mastery</th><th>Advanced</th><th></th></tr></thead><tbody>'+
 ms.map(m=>{const dc=m.lessons.filter(l=>state.done[l[0]]).length,mc=m.lessons.filter(l=>state.mastered[l[0]]).length;
 const da=state.attempts[m.id+':diagnostic'],ma=state.attempts[m.id+':mastery'],aa=state.attempts[m.id+':advanced'];
 return '<tr><td>'+esc(m.id+' '+m.name)+'</td><td>'+dc+'/'+m.lessons.length+'</td><td>'+mc+'/'+m.lessons.length+'</td><td>'+(da?Math.round(100*da.score)+'%':'—')+'</td><td>'+(ma?Math.round(100*ma.score)+'%':'—')+'</td><td>'+(aa?Math.round(100*aa.score)+'%':'—')+'</td><td><button class="btn mini" onclick="selectModule(\''+m.id+'\')">'+msg('Open','فتح')+'</button></td></tr>'}).join('')+
 '</tbody></table></div><p class="small muted">'+msg('Advanced case attempts in this domain: ','عدد محاولات الحالات المتقدمة في المجال: ')+aAttempts+'</p></div>';
}
const JOURNEY_HEADER=header;
header=function(){
 JOURNEY_HEADER();
 const side=$('sidebar'),top=$('top');
 side?.querySelectorAll('.domainDashboardLink').forEach(el=>el.remove());
 side?.querySelectorAll('.sidebarLabel').forEach(el=>{
  const d=el.textContent.match(/DOMAIN\s+([123])/i)?.[1];if(!d)return;
  const btn=document.createElement('button');btn.className='sideBtn domainDashboardLink';
  btn.textContent=msg('▥ Domain '+d+' Dashboard','▥ لوحة تحليلات المجال '+d);
  btn.onclick=()=>jumpToDomain(d);el.after(btn);
 });
 if(state.view==='domain-dashboard'){top.innerHTML='';return;}
 const tabs=top?.querySelector('.tabs');
 if(tabs){
  tabs.innerHTML=[['diagnostic','1. Diagnostic Exam','١. التقييم التشخيصي'],['review','2. My Review','٢. مراجعتي'],['material','3. Full Material','٣. المحتوى الكامل'],['mastery','4. Mastery Check','٤. اختبار الإتقان'],['advanced','5. Advanced Scenarios','٥. الحالات المتقدمة']].map(x=>
   '<button class="tab '+(state.view===x[0]?'active':'')+'" onclick="view(\''+x[0]+'\')">'+msg(x[1],x[2])+'</button>').join('');
 }
};
view=function(name){
 if(name==='dashboard')name='diagnostic';
 state.view=name;sess=null;
 if(!['home','saved','analytics','domain-dashboard'].includes(name))
  state.lastResume={mid:mod().id,stage:name,focus:state.focus};
 save();render();
};
selectModule=function(id){state.current=id;state.focus=null;view('diagnostic');};
const JOURNEY_RESUME=resumeLearning;
resumeLearning=function(){
 if(state.lastResume?.stage==='dashboard')state.lastResume.stage='diagnostic';
 JOURNEY_RESUME();
};
const JOURNEY_RENDER=render;
render=function(){
 if(state.view==='dashboard')state.view='diagnostic';
 if(state.view==='domain-dashboard'){header();domainDashboardScreen();return;}
 JOURNEY_RENDER();
 if(state.view==='home'||state.view==='analytics'){
  const area=$('body');if(!area)return;
  const existing=document.getElementById('courseCompletionSummary');if(existing)existing.remove();
  const count=DATA.modules.reduce((n,m)=>n+m.lessons.length,0);
  const completed=DATA.modules.reduce((n,m)=>n+m.lessons.filter(l=>!!state.done[l[0]]).length,0);
  const mastered=DATA.modules.reduce((n,m)=>n+m.lessons.filter(l=>!!state.mastered[l[0]]).length,0);
  const block=document.createElement('div');block.id='courseCompletionSummary';block.className='panel';
  block.innerHTML='<h2>'+msg('Course learning evidence','مؤشرات تعلم الكورس')+'</h2><div class="dashMetrics"><div class="dashMetric"><div class="skillTag">'+msg('COMPLETED','المكتمل')+'</div><strong>'+completed+'/'+count+'</strong></div><div class="dashMetric"><div class="skillTag">'+msg('MASTERED','المتقن')+'</div><strong>'+mastered+'/'+count+'</strong></div></div><p class="muted">'+msg('Completed means studied or passed an in-lesson check. Mastered means both corresponding Mastery Check questions were answered correctly.','مكتمل يعني تمت دراسة الدرس أو اجتياز أسئلته التدريبية. متقن يعني الإجابة الصحيحة على سؤالي الدرس في اختبار الإتقان.')+'</p>';
  area.insertBefore(block,area.firstChild.nextSibling);
 }
};
function showDiagnostic(m){
 if(!sess||sess.stage!=='diagnostic'||sess.mid!==m.id) {
  const draft=state.draft;
  const qs=getQs(m,'diagnostic');
  sess={mid:m.id,stage:'diagnostic',qs,answers:[],pos:0,finished:false};
  if(draft?.mid===m.id&&draft.stage==='diagnostic'&&draft.version===JOURNEY_VERSION){
   sess.answers=draft.answers||[];sess.pos=Math.min(draft.pos||0,qs.length-1);
  }
 }
 if(sess.finished)return showDiagnosticResult(m);
 const q=sess.qs[sess.pos],a=sess.answers[sess.pos],skip=a===null;
 $('body').innerHTML='<div class="panel qBox"><span class="pill">'+msg('1 · KNOWLEDGE DIAGNOSTIC','١ · تقييم المعرفة الأولية')+'</span><h1>'+msg('Diagnostic Exam','التقييم التشخيصي')+'</h1><p class="muted">'+msg('Identify what you already know. Skip any topic you would like to learn more about; skipped items count as learning gaps, not incorrect guesses.','حدد ما تعرفه بالفعل. يمكنك تخطي أي موضوع تريد معرفة المزيد عنه؛ يُسجّل كفجوة تعلم وليس تخميناً خاطئاً.')+'</p>'+
 '<div class="questionMeta"><span>'+msg('Question ','السؤال ')+(sess.pos+1)+' / '+sess.qs.length+'</span><span class="skillTag">'+esc(q.title)+'</span></div>'+
 '<div class="barOuter"><div class="barInner" style="width:'+(100*(sess.pos+1)/sess.qs.length)+'%"></div></div><h2 class="chapter">'+esc(q.q)+'</h2>'+
 q.opts.map((o,i)=>'<button class="answer '+(a===i?'selected':'')+'" onclick="answerDiagnostic('+i+')"><b>'+ 'ABCD'[i]+'.</b> '+esc(o)+'</button>').join('')+
 '<div class="testTools"><button class="btn" onclick="previousDiagnostic()" '+(sess.pos===0?'disabled':'')+'>'+msg('← Previous','السابق')+'</button>'+
 '<button class="btn" onclick="skipDiagnostic()">'+msg('Skip · I want to learn more','تخطي · أريد أن أتعلم أكثر')+'</button>'+
 '<button class="btn primary" onclick="advanceDiagnostic()" '+(a===undefined?'disabled':'')+'>'+(sess.pos===sess.qs.length-1?msg('Finish Diagnostic','إنهاء التقييم'):msg('Next question →','السؤال التالي'))+'</button></div>'+
 (skip?'<p class="translationNotice">'+msg('Marked for further learning. You can return and answer or continue.','تم تحديد الموضوع للمراجعة. يمكنك العودة للإجابة أو المتابعة.')+'</p>':'')+'</div>';
}
function diagnosticDraft(){state.draft={mid:sess.mid,stage:'diagnostic',version:JOURNEY_VERSION,pos:sess.pos,answers:sess.answers.slice()};save();}
function answerDiagnostic(i){sess.answers[sess.pos]=i;diagnosticDraft();render();}
function skipDiagnostic(){sess.answers[sess.pos]=null;diagnosticDraft();advanceDiagnostic();}
function previousDiagnostic(){if(sess.pos>0){sess.pos--;diagnosticDraft();render();}}
function advanceDiagnostic(){
 if(sess.answers[sess.pos]===undefined)return;
 if(sess.pos<sess.qs.length-1){sess.pos++;diagnosticDraft();render();return;}
 const m=DATA.modules.find(x=>x.id===sess.mid),old=state.attempts[m.id+':diagnostic'];
 if(old)state.attemptHistory.push({capability:m.id,stage:'diagnostic',...old});
 const skipped=sess.qs.filter((q,i)=>sess.answers[i]==null).map(q=>q.target);
 const missed=sess.qs.filter((q,i)=>sess.answers[i]!==q.answer).map(q=>q.id);
 const correct=sess.qs.filter((q,i)=>sess.answers[i]===q.answer).length;
 const answered=sess.answers.filter(a=>a!==null&&a!==undefined).length;
 state.knowledgeGaps[m.id]=[...new Set(sess.qs.filter((q,i)=>sess.answers[i]!==q.answer).map(q=>q.target))];
 state.attempts[m.id+':diagnostic']={bankVersion:JOURNEY_VERSION,score:correct/sess.qs.length,answered,skipped,missed,answers:sess.answers.slice(),questionCount:sess.qs.length,ts:new Date().toISOString()};
 // One foundation question maps to each lesson. All mapped questions must
 // be correct before granting lesson completion; skipped/wrong remain gaps.
 const grouped={};
 sess.qs.forEach((q,i)=>{if(!m.lessons.some(l=>l[0]===q.target))return;
  (grouped[q.target]??=[]).push(sess.answers[i]===q.answer);
 });
 state.autoReviewed??={};state.done??={};
 for(const [lessonId,results] of Object.entries(grouped)){
  if(results.length&&results.every(Boolean)){state.done[lessonId]=true;state.autoReviewed[lessonId]=true;}
 }
 delete state.draft;sess.finished=true;save();render();
}
function showDiagnosticResult(m){
 const a=state.attempts[m.id+':diagnostic'],q=sess.qs;
 $('body').innerHTML='<div class="panel qBox"><span class="pill">'+msg('DIAGNOSTIC COMPLETE','اكتمل التقييم التشخيصي')+'</span><h1>'+msg('Your knowledge baseline','مستوى المعرفة الأولي')+'</h1><div class="score">'+Math.round(a.score*100)+'%</div><p>'+msg('Answered: ','تمت الإجابة: ')+a.answered+'/'+q.length+' · '+msg('Skipped: ','تم التخطي: ')+a.skipped.length+'</p><p class="muted">'+msg('This result indicates familiarity, not mastery. Skipped and incorrect topics have been added to My Review.','هذا المؤشر يقيس المعرفة الأولية وليس الإتقان. أضيفت الموضوعات المتخطاة والخاطئة إلى المراجعة.')+'</p><div class="actionBar"><button class="btn primary" onclick="view(\'review\')">'+msg('Open My Review','افتح مراجعتي')+'</button><button class="btn" onclick="view(\'mastery\')">'+msg('Try Mastery Check','جرّب اختبار الإتقان')+'</button><button class="btn" onclick="resetTest()">'+msg('Retake','إعادة المحاولة')+'</button></div>'+
 q.map((item,i)=>'<div class="lesson"><div class="skillTag">'+esc(item.title)+'</div><h3>'+esc(item.q)+'</h3><p>'+msg('Your response: ','إجابتك: ')+(a.answers[i]===null?msg('Skipped · learn more','تم التخطي · أريد التعلم'):esc(item.opts[a.answers[i]]||'—'))+'</p><div class="feedback"><b>'+msg('Core idea: ','الفكرة الأساسية: ')+'</b>'+esc(item.opts[item.answer])+'</div>'+(lessonFor(item.target)?'<button class="btn" onclick="openLesson(\''+item.target+'\')">'+msg('Study this lesson','دراسة الدرس')+'</button>':'')+'</div>').join('')+'</div>';
}
const JOURNEY_TEST=testScreen;
testScreen=function(m,stage){
 if(stage==='diagnostic'){showDiagnostic(m);return;}
 if(stage==='advanced'){showAdvanced(m);return;}
 if(stage==='mastery'){
  const old=m.preview;
  m.preview=false;
  try{JOURNEY_TEST(m,stage);}finally{m.preview=old;}
  return;
 }
 JOURNEY_TEST(m,stage);
};
const JOURNEY_NEXT=nextQuestion;
nextQuestion=function(){
 const finishing=!!sess&&sess.stage==='mastery'&&sess.pos===sess.qs.length-1&&sess.answers[sess.pos]!==undefined;
 const pre=finishing?{mid:sess.mid,qs:sess.qs.slice(),answers:sess.answers.slice()}:null;
 JOURNEY_NEXT();
 if(!pre||!sess?.finished)return;
 const m=DATA.modules.find(x=>x.id===pre.mid),a=state.attempts[pre.mid+':mastery'];if(!a)return;
 a.bankVersion=JOURNEY_VERSION;
 const grouped={};
 pre.qs.forEach((q,i)=>{if(!lessonFor(q.target))return;(grouped[q.target]??=[]).push(pre.answers[i]===q.answer);});
 for(const l of m.lessons){const v=grouped[l[0]]||[];if(v.length===2&&v.every(Boolean))state.mastered[l[0]]=true;}
 save();render();
};


/* Each existing applied scenario becomes a three-step, non-reversible practice case.
   Scoring: +1 per selected suitable action, -1 per selected unsuitable action.
   This is independent practice, not an official ATD item or scoring claim. */
function caseQuestions(m){
 let qs=JOURNEY_GETQS(m,'advanced');
 if(!qs.length)qs=(DATA.domain2Questions[m.id]||[]).map((x,i)=>({id:m.id+'-case-'+i,target:m.id,q:x[0],opts:x[1],answer:x[2],why:x[3]}));
 return qs.slice(0,Math.min(3,qs.length));
}
function legacyCaseStepData(q,step){
 const main=q.opts[q.answer],wrong=q.opts.filter((_,i)=>i!==q.answer);
 const extra=step===0?'Clarify the expected performance outcome and examine relevant evidence before deciding.':
  step===1?'Engage affected managers and employees to test feasibility, fairness and adoption risks.':
  'Review outcome measures against the baseline and adjust the talent-development response.';
 const safeWrong=step===0?[wrong[0],wrong[1],wrong[2]]:
  step===1?['Rely on attendance data alone to make the decision.','Ignore stakeholder concerns until the project ends.','Select the cheapest intervention without assessing effectiveness.']:
  ['Claim success solely because the activity was delivered.','Avoid documenting limitations in the results.','Continue the approach unchanged despite contrary evidence.'];
 const options=[main,extra,...safeWrong];
 const valid=[0,1];
 const shift=(step+String(q.id).length)%options.length;
 const shuffled=options.map((x,i)=>({text:x,correct:valid.includes(i)}));
 for(let i=0;i<shift;i++)shuffled.push(shuffled.shift());
 const ar=state.lang==='ar';
 const prompt=step===0?(ar?'القرار الأول: ما الإجراءان الأنسب في هذا الموقف؟':'Initial decision: Which TWO actions are most appropriate?'):
  step===1?(ar?'المعلومات الجديدة: أثار المديرون أسئلة عن الموارد والعدالة وتبني التغيير. ما الإجراءان التاليان؟':'New information: Managers raise concerns about resources, fairness and adoption. Which TWO actions follow?'):
  (ar?'مرحلة المتابعة: أظهرت مؤشرات الأداء نتائج متفاوتة بعد التدخل. ما أفضل إجراءين؟':'Follow-up: Early performance indicators are mixed after the intervention. Which TWO actions best support sound judgment?');
 return {prompt,options:shuffled,why:q.why||'',ar};
}
const ATD_ADVANCED_FOLLOWUP={
"1.1":["Communications staff say the sponsor's message is being misunderstood by frontline teams.","Listen to representative employees and clarify what the message means for their work.","Agree a plain-language follow-up and named response owner.","The communications rollout reaches everyone but managers interpret the call to action differently.","Check comprehension with a short sample of affected teams.","Publish a consistent FAQ and correct conflicting manager guidance."],
"1.2":["An employee reports that the response overlooked their circumstances.","Listen without defensiveness and test your assumptions privately.","Agree a fair adjustment that respects privacy and team needs.","Participation rises but team trust remains fragile.","Seek voluntary feedback using a psychologically safe method.","Look for evidence of inclusion over time rather than one positive comment."],
"1.3":["Two team leads disagree about ownership after the initial decision.","Record shared outcomes and assign decision rights for each handoff.","Set a short escalation route for unresolved dependencies.","The deliverable slips because priorities changed across departments.","Revisit dependencies and renegotiate a realistic milestone with owners.","Use a retrospective to remove the coordination bottleneck."],
"1.4":["Remote and shift-based learners report access barriers.","Co-design accessible learning routes with affected learner groups.","Check language, schedule and assistive-technology requirements.","Overall participation rises but some groups remain underrepresented.","Compare access patterns using privacy-protective group data.","Interview affected learners and address remaining barriers."],
"1.5":["A vendor delay threatens the agreed implementation milestone.","Assess impacts on the critical path before proposing a recovery plan.","Escalate revised dependencies, ownership and costs to the sponsor.","The launch happens but pilot users report blocking defects.","Prioritize defects against acceptance criteria and learner impact.","Capture lessons learned and update the corrective-action backlog."],
"1.6":["A sponsor requests named learner results beyond the approved audience.","Check purpose, consent and who is authorized to receive the data.","Offer a least-privilege report without unnecessary identifiers.","An audit detects unexpected access to a learning-data export.","Restrict access promptly and document the incident.","Review retention, logging and preventive governance controls."],
"1.7":["A learner finishes courses but lacks opportunity to apply the skills.","Agree an authentic stretch assignment linked to the career goal.","Arrange manager feedback and reflection at checkpoints.","The learner reports more confidence but no demonstrated performance.","Review actual work samples against the target capability.","Adapt the development plan based on transfer evidence."],
"2.1":["Learners struggle with authentic work tasks despite passing recall quizzes.","Introduce representative practice with scaffolded worked examples.","Add targeted formative feedback at the points of frequent error.","Practice scores improve but on-the-job errors remain high.","Compare assessment conditions with the actual workflow.","Observe workplace barriers before changing the learning design."],
"2.2":["SMEs propose conflicting learning activities for the same outcome.","Prioritize tasks using measurable performance criteria.","Prototype the approach with representative learners.","Pilot learners remember the terminology but cannot perform the skill.","Recheck objective-to-assessment alignment using job evidence.","Revise practice activities and test the change with users."],
"2.3":["Remote participants cannot complete a group practice exercise.","Provide an equivalent accessible collaborative activity.","Use structured turn-taking and check participation across locations.","Feedback praises the facilitator but task performance is weak.","Add focused rehearsal with criterion-based feedback.","Review participation and practice data before changing pacing."],
"2.4":["Field learners report that the mobile LMS fails without connectivity.","Reproduce the issue using representative devices and connections.","Provide an accessible fallback while the sync defect is resolved.","The technology fix launches but completion reports still disagree.","Reconcile local event logs with server timestamps.","Deduplicate learner events and validate reporting accuracy."],
"2.5":["Experienced staff are leaving with critical tacit knowledge.","Capture decision triggers through observation and structured interviews.","Validate the guidance with peers and tag it for retrieval.","Staff search the repository but rarely find useful answers.","Test real information-retrieval tasks and improve taxonomy.","Assign owners to review the currency and usefulness of guidance."],
"2.6":["Emerging leaders say access to development assignments is uneven.","Set transparent selection criteria with manager involvement.","Provide equitable stretch opportunities and coaching support.","Some participants improve while others have no opportunity to apply.","Compare access to assignments and feedback across participants.","Adjust manager support and assignment design based on evidence."],
"2.7":["A coachee says goals are unclear and sessions feel disconnected.","Agree observable goals and confidential boundaries with the coachee.","Plan reflection and real-world practice between coaching sessions.","Coachees like the program but behavior evidence is absent.","Use coachee-owned goals and appropriate follow-up evidence.","Check manager support without disclosing confidential coaching content."],
"2.8":["Stakeholders disagree about which outcomes prove the initiative worked.","Agree an evaluation question and credible baseline.","Identify confounding influences and comparison opportunities.","Early results improve while a company-wide process also changes.","Analyze comparison trends and document attribution limits.","Report both observed outcomes and uncertainty transparently."],
"3.1":["Finance challenges the assumptions behind the talent investment.","Link the proposed capability investment to a measurable business outcome.","Document assumptions, cost drivers and financial trade-offs.","A pilot reduces errors but store operations have also changed.","Separate talent-program contribution from operational changes.","Recalculate value using transparent assumptions and sensitivity checks."],
"3.2":["The client wants a quick solution despite conflicting stakeholder evidence.","Clarify decision rights and test root causes with frontline staff.","Agree realistic scope and confidentiality expectations.","The client disputes findings that challenge the favored solution.","Present evidence and alternative options respectfully.","Recommend a pilot with agreed success criteria and limitations."],
"3.3":["Supervisors reward individual output while the initiative seeks collaboration.","Align management reinforcement with the desired team behaviors.","Involve employees in diagnosing the current incentives.","Attendance is high but collaboration habits remain unchanged.","Observe everyday behaviors and team-system barriers.","Iterate the organizational intervention using outcome evidence."],
"3.4":["Managers do not release employees for skill-building assignments.","Align development plans with workforce and talent priorities.","Agree on protected practice time and manager accountability.","A leadership pipeline grows but internal mobility stays low.","Review selection, readiness and placement evidence together.","Adjust succession pathways and managerial support."],
"3.5":["Employees know the process yet tools and staffing prevent performance.","Observe task constraints and test non-training causes.","Engage operations to remove systemic performance barriers.","Performance rises in one team but falls in another after redesign.","Compare workflow conditions and unintended consequences.","Refine job aids, incentives or processes before adding training."],
"3.6":["Employees understand the change but still lack practical capability.","Provide hands-on practice and accessible job support.","Equip supervisors to coach the new workflow.","Adoption rises initially but many employees revert to old habits.","Identify reinforcement gaps in the working environment.","Adjust manager routines and adoption measures."],
"3.7":["Leaders request individual predictions from sensitive workforce data.","Check data quality, lawful purpose and fairness risks.","Restrict identifiable data to authorized analytical use.","The model appears accurate overall but performs poorly for a subgroup.","Evaluate subgroup performance and potential adverse outcomes.","Present uncertainty and human-review safeguards before decisions."],
"3.8":["A new automation tool changes responsibilities across hybrid teams.","Map emerging capability and workflow needs with affected staff.","Pilot adaptable learning formats with accessible alternatives.","The technology trend changes before the rollout finishes.","Review real adoption and performance evidence regularly.","Revise the capability roadmap instead of following vendor hype."]
};
function caseStepData(q,step,version){
 if(!["case-v22","case-v24"].includes(version))return legacyCaseStepData(q,step);
 const id=String(q.id||"").split("-")[0],v=ATD_ADVANCED_FOLLOWUP[id]||ATD_ADVANCED_FOLLOWUP["2.1"];
 const main=q.opts[q.answer],wrong=q.opts.filter((_,i)=>i!==q.answer),ar=state.lang==="ar";
 let prompt,options;
 if(step===0){
  prompt=ar?"القرار الأول: اختر الإجراءين الأنسب للحالة.":"Initial decision: Which TWO actions best address this specific situation?";
  options=[main,"Verify the evidence and desired outcome in this situation before committing resources.",...wrong.slice(0,3)];
 }else if(step===1){
  prompt=(ar?"تطور جديد في الحالة: ":"Situation update: ")+v[0]+" "+(ar?"الحالة الأصلية: ":"Original situation: ")+q.q+" "+(ar?"اختر إجراءين.":"Choose TWO next actions.");
  options=[v[1],v[2],...wrong.slice(0,3)];
 }else if(step===2){
  prompt=(ar?"نتائج المتابعة: ":"Follow-up evidence: ")+v[3]+" "+(ar?"الحالة الأصلية: ":"Original situation: ")+q.q+" "+(ar?"اختر إجراءين.":"Choose TWO evidence-led responses.");
  options=[v[4],v[5],"Assume this evidence proves complete success: "+v[3],"Ignore the implications for the original case: "+q.q,"Continue with the original decision without considering this follow-up: "+v[3]];
 }
 if(step===3&&version==="case-v24"){
  prompt=(ar?"التقييم النهائي: ":"Evaluation & next decision: ")+v[3]+" "+(ar?"بعد مراجعة الأدلة وقيود المؤسسة، أي الإجراءات ضرورية الآن؟":"After reviewing implementation evidence and organizational constraints, which actions are necessary NOW?");
  options=[
   "Document the observed impact and its limits against the original outcomes for this specific case.",
   "Agree with accountable stakeholders on adjustments and a follow-up measurement checkpoint.",
   "Request additional general training immediately, without determining whether the actual barriers were knowledge, workflow or incentives.",
   "Publish a success claim using participant reaction scores before the workplace evidence is verified.",
   "Commission an unrelated long-term talent strategy study before addressing the case's immediate outcome gaps."
  ];
 }
 const offset=(step+String(q.id).length)%options.length;
 const shuffled=options.map((text,i)=>({text,correct:i<2}));
 for(let i=0;i<offset;i++)shuffled.push(shuffled.shift());
 return {prompt,options:shuffled,why:q.why||"",ar};
}
function initializeCase(m){
 if(sess&&sess.stage==='advanced-case'&&sess.mid===m.id)return;
 const previous=state.caseDraft;
 sess={mid:m.id,stage:'advanced-case',caseIndex:0,step:0,selected:[],submitted:false,points:0,maxPoints:0,history:[],finished:false,caseVersion:'case-v24'};
 if(previous?.mid===m.id&&['case-v19','case-v22','case-v24'].includes(previous.version)){
  Object.assign(sess,previous);sess.caseVersion=previous.version;sess.finished=false;
 }
}
function persistCase(){
 state.caseDraft={mid:sess.mid,stage:sess.stage,caseIndex:sess.caseIndex,step:sess.step,selected:sess.selected.slice(),submitted:sess.submitted,points:sess.points,maxPoints:sess.maxPoints,history:sess.history.slice(),version:sess.caseVersion||'case-v24'};save();
}
function showAdvanced(m){
 const qs=caseQuestions(m);
 if(!qs.length){$('body').innerHTML='<div class="panel">'+msg('Advanced cases require source questions for this capability.','تحتاج الحالات المتقدمة إلى مصدر أسئلة لهذه القدرة.')+'</div>';return;}
 initializeCase(m);
 if(sess.finished){showCaseResult(m);return;}
 const q=qs[sess.caseIndex],item=caseStepData(q,sess.step,sess.caseVersion),ar=state.lang==='ar';
 const chosen=sess.selected||[],selectedSet=new Set(chosen);
 const stageLabels=[msg('Diagnose & decide','التشخيص والقرار'),msg('New stakeholder evidence','معطيات أصحاب العلاقة'),msg('Implementation challenge','تحديات التطبيق'),msg('Evaluate & adjust','التقييم والتحسين')];
 let context=sess.step===0?q.q:sess.step===1?
  msg('The team has considered its initial response. Affected stakeholders are now asking how the approach will fit operational constraints and employees’ needs.','ناقش الفريق الاستجابة الأولية. ويسأل أصحاب العلاقة الآن عن مدى ملاءمتها لقيود التشغيل واحتياجات الموظفين.'):
  msg('The action has been introduced. Early learner feedback is positive, but changes in job performance are not yet consistent.','تم تنفيذ الإجراء. كانت انطباعات المتعلمين إيجابية، لكن التحسن في الأداء الوظيفي لم يكن ثابتاً حتى الآن.');
 $('body').innerHTML='<div class="panel qBox"><span class="pill">'+msg('ADVANCED · CASE MANAGEMENT PRACTICE','المتقدم · تدريب إدارة الحالات')+'</span><h1>'+msg('Applied Talent Development Decisions','قرارات تطبيقية في تطوير المواهب')+'</h1><p class="muted">'+msg('Select every action NECESSARY at this stage; avoid useful but premature actions. +1 per suitable selection, −1 per unsuitable selection. You cannot revisit submitted steps. Original CPTD-style practice, not an official ATD examination.','اختر جميع الإجراءات الضرورية في هذه المرحلة، وتجنب الإجراءات المبكرة أو غير الضرورية. نقطة لكل اختيار مناسب، وخصم نقطة لكل اختيار غير مناسب. لا يمكنك العودة للخطوات السابقة. هذا تدريب مستقل وليس اختبار ATD رسمياً.')+'</p>'+
 (ar?'<p class="translationNotice">نص الحالة وخياراتها المهنية الأصلية باللغة الإنجليزية؛ الإرشادات والنتائج متاحة بالعربية. لا توجد ترجمة عربية معتمدة لهذه الحالات بعد.</p>':'')+
 '<div class="questionMeta"><span>'+msg('Case ','الحالة ')+(sess.caseIndex+1)+' / '+qs.length+' · '+msg('Step ','خطوة ')+(sess.step+1)+' / 3</span><span class="skillTag">'+esc(stageLabels[sess.step])+'</span></div><div class="barOuter"><div class="barInner" style="width:'+(100*(sess.caseIndex*(sess.caseVersion==='case-v24'?4:3)+sess.step+1)/(qs.length*(sess.caseVersion==='case-v24'?4:3)))+'%"></div></div>'+
 '<h2 class="chapter">'+esc(context)+'</h2><h3>'+esc(item.prompt)+'</h3>'+
 item.options.map((opt,i)=>'<button class="answer '+(selectedSet.has(i)?'selected ':'')+(sess.submitted&&opt.correct?'correct':'')+'" '+(sess.submitted?'disabled':'')+' onclick="toggleCaseOption('+i+')"><b>'+(selectedSet.has(i)?'☑':'☐')+'</b> '+esc(opt.text)+'</button>').join('')+
 (sess.submitted?'<div class="feedback"><b>'+msg('Decision feedback','تفسير القرار')+'</b><p>'+esc(q.why||'Choose actions supported by evidence and measurable outcomes.')+'</p><p>'+msg('Suitable actions: ','الإجراءات المناسبة: ')+esc(item.options.filter(x=>x.correct).map(x=>x.text).join(' | '))+'</p><p>'+msg('This step: ','نتيجة الخطوة: ')+sess.lastDelta+' / 2</p></div>':'')+
 '<div class="testTools">'+(sess.submitted?
 '<button class="btn primary" onclick="advanceCase()">'+(sess.caseIndex===qs.length-1&&sess.step===(sess.caseVersion==='case-v24'?3:2)?msg('Finish cases','إنهاء الحالات'):msg('Continue to next step →','الخطوة التالية'))+'</button>':
 '<button class="btn primary" '+(chosen.length!==2?'disabled':'')+' onclick="submitCaseStep()">'+msg('Submit two decisions','تأكيد القرارين')+'</button>')+
 '<button class="btn" onclick="restartCases()">'+msg('Restart cases','إعادة الحالات')+'</button></div></div>';
}
function toggleCaseOption(i){
 if(!sess||sess.submitted)return;
 let a=sess.selected||[];
 sess.selected=a.includes(i)?a.filter(x=>x!==i):(sess.caseVersion==='case-v24'||a.length<2)?[...a,i]:a;
 persistCase();render();
}
function submitCaseStep(){
 if(!sess||sess.submitted||(sess.caseVersion==='case-v24'?sess.selected.length<1:sess.selected.length!==2))return;
 const m=DATA.modules.find(x=>x.id===sess.mid),q=caseQuestions(m)[sess.caseIndex],step=caseStepData(q,sess.step);
 const delta=sess.selected.reduce((n,i)=>n+(step.options[i].correct?1:-1),0);
 sess.points+=delta;sess.maxPoints+=2;sess.lastDelta=delta;
 sess.history.push({caseIndex:sess.caseIndex,step:sess.step,choices:sess.selected.slice(),delta});
 sess.submitted=true;persistCase();render();
}
function advanceCase(){
 if(!sess?.submitted)return;
 const m=DATA.modules.find(x=>x.id===sess.mid),n=caseQuestions(m).length;
 if(sess.step<(sess.caseVersion==='case-v24'?3:2))sess.step++;
 else if(sess.caseIndex<n-1){sess.caseIndex++;sess.step=0;}
 else {
  sess.finished=true;
  const score=Math.max(0,sess.points)/Math.max(1,sess.maxPoints);
  const previous=state.attempts[m.id+':advanced'];if(previous)state.attemptHistory.push({capability:m.id,stage:'advanced',...previous});
  const a={score,rawPoints:sess.points,maxPoints:sess.maxPoints,questionCount:sess.history.length,caseVersion:sess.caseVersion||'case-v24',ts:new Date().toISOString(),history:sess.history.slice()};
  state.attempts[m.id+':advanced']=a;state.caseHistory.push({mid:m.id,...a});
  delete state.caseDraft;
  state.view='advanced';
  state.lastResume={mid:m.id,stage:'advanced',completed:true};
  save();
  // Render the permanent final report explicitly so the Finish Cases button
  // can never re-enter the same question or recreate a case session.
  render();
  showCaseResult(m);
  return;
 }
 sess.selected=[];sess.submitted=false;sess.lastDelta=undefined;persistCase();render();
}
function restartCases(){delete state.caseDraft;sess=null;save();render();}
function showCaseResult(m){
 const a=state.attempts[m.id+':advanced'];
 if(!a){$('body').innerHTML='<div class="panel">'+msg('No completed case result found.','لم يتم العثور على نتيجة حالة مكتملة.')+'</div>';return;}
 $('body').innerHTML='<div class="panel qBox"><span class="pill">'+msg('CASE PRACTICE COMPLETE','انتهى تدريب الحالات')+'</span><h1>'+msg('Professional judgment results','نتائج الحكم المهني')+'</h1><div class="score">'+a.rawPoints+' / '+a.maxPoints+'</div><p>'+msg('Score after penalties: ','النتيجة بعد الخصومات: ')+Math.round(a.score*100)+'%</p><p class="muted">'+msg('This practice measures decisions in simulated situations. It is not an official ATD score. Review how you selected actions and how evidence changed throughout the case.','هذا التدريب يقيس قراراتك في مواقف محاكاة وليس نتيجة ATD رسمية. راجع كيفية اختيار الإجراءات وتغيّر الأدلة خلال الحالة.')+'</p><div class="actionBar"><button class="btn primary" onclick="restartCases()">'+msg('Practice again','إعادة التدريب')+'</button><button class="btn" onclick="view(\'material\')">'+msg('Open lessons','افتح الدروس')+'</button></div></div>';
}


/* v20 persistence: completed assessments are reviewable after reload; never
   silently start a fresh attempt or overwrite the learner's submitted answers. */
const ATD_V20_TEST=testScreen;
testScreen=function(m,stage){
 const key=m.id+':'+stage;
 const saved=state.attempts?.[key];
 if(saved&&stage==='diagnostic'){
  const qs=getQs(m,'diagnostic');
  sess={mid:m.id,stage:'diagnostic',qs,answers:Array.isArray(saved.answers)?saved.answers.slice():[],pos:0,finished:true};
  showDiagnosticResult(m);return;
 }
 if(saved&&stage==='mastery'){
  const qs=getQs(m,'mastery');
  sess={mid:m.id,stage:'mastery',qs,answers:Array.isArray(saved.answers)?saved.answers.slice():[],pos:0,finished:true};
  resultScreen(m,'mastery');return;
 }
 if(saved&&stage==='advanced'){
  sess={mid:m.id,stage:'advanced-case',finished:true};
  showCaseResult(m);return;
 }
 return ATD_V20_TEST(m,stage);
};
const ATD_V20_RENDER=render;
render=function(){
 ATD_V20_RENDER();
 const key=state.current+':'+state.view;
 if(state.attempts?.[key]&&['diagnostic','mastery','advanced'].includes(state.view)){
  document.querySelectorAll('#body button').forEach(button=>{
   if(/^(retake|retake assessment|practice again|إعادة (التدريب|المحاولة|التقييم))$/i.test(button.textContent.trim())){
    button.remove();
   }
  });
 }
};

/* Display permanent case decisions, the suitable choices, and rationale. */
const ATD_V20_CASE_RESULT=showCaseResult;
showCaseResult=function(m){
 ATD_V20_CASE_RESULT(m);
 const attempt=state.attempts[m.id+':advanced'];
 if(!attempt?.history?.length)return;
 const area=$('body').querySelector('.qBox');
 if(!area)return;
 const qs=caseQuestions(m);
 const section=document.createElement('div');
 const stepCount=attempt.history.length;
 const correctChoices=attempt.history.reduce((sum,e)=>sum+Math.max(0,Math.min(2,(Number(e.delta)+2)/2)),0);
 const incorrectChoices=stepCount*2-correctChoices;
 section.innerHTML='<h2>'+msg('Final feedback · first submitted decisions','التغذية الراجعة النهائية · قرارات المحاولة الأولى')+'</h2>'+
 '<div class="dashMetrics"><div class="dashMetric"><div class="skillTag">'+msg('CORRECT DECISIONS','قرارات صحيحة')+'</div><strong>'+correctChoices+'</strong></div><div class="dashMetric"><div class="skillTag">'+msg('INCORRECT DECISIONS','قرارات خاطئة')+'</div><strong>'+incorrectChoices+'</strong></div><div class="dashMetric"><div class="skillTag">'+msg('STEPS COMPLETED','الخطوات المكتملة')+'</div><strong>'+stepCount+'</strong></div></div>'+
 '<p class="muted">'+msg('These are the decisions you submitted on the first and only submission of each step; results are preserved for review.','هذه قراراتك عند أول إرسال لكل خطوة؛ النتائج محفوظة للمراجعة.')+'</p>'+
 attempt.history.map((entry,i)=>{
  const q=qs[entry.caseIndex];if(!q)return '';
  const step=caseStepData(q,entry.step,attempt.caseVersion);
  const chosen=(entry.choices||[]).map(j=>step.options[j]).filter(Boolean);
  const right=step.options.filter(opt=>opt.correct);
  return '<div class="lesson"><span class="skillTag">'+msg('Case ','الحالة ')+(entry.caseIndex+1)+' · '+msg('Step ','الخطوة ')+(entry.step+1)+'</span>'+
   '<p><b>'+msg('Your decisions: ','قراراتك: ')+'</b>'+chosen.map(x=>esc(x.text)).join(' | ')+'</p>'+
   '<p><b>'+msg('Recommended actions: ','الإجراءات الموصى بها: ')+'</b>'+right.map(x=>esc(x.text)).join(' | ')+'</p>'+
   '<p><b>'+msg('Decision quality: ','جودة القرارات: ')+'</b>'+(entry.delta===2?msg('Both choices suitable','الاختياران مناسبان'):entry.delta===0?msg('One suitable and one unsuitable','اختيار مناسب وآخر غير مناسب'):msg('Both choices unsuitable','الاختياران غير مناسبين'))+'</p><p>'+msg('Points: ','النقاط: ')+esc(entry.delta)+'</p>'+
   '<div class="feedback">'+esc(q.why||'')+'</div></div>';
 }).join('');
 area.append(section);
 const next=DATA.modules[DATA.modules.findIndex(x=>x.id===m.id)+1];
 const action=document.createElement('div');action.className='actionBar';
 action.innerHTML='<button class="btn primary" onclick="view(\'material\')">'+msg('Review lessons','مراجعة الدروس')+'</button>'+
 '<button class="btn" onclick="view(\'home\')">'+msg('Back to course overview','العودة إلى الكورس')+'</button>'+
 (next?'<button class="btn" onclick="selectModule(\''+next.id+'\')">'+msg('Continue to next module','المتابعة إلى الموديول التالي')+' →</button>':'');
 area.append(action);
};


/* v21: five-stage completion tracker and repair of diagnostic-to-lesson credit.
   Percentages here represent workflow completion, not examination scores. */
function atdRestoreDiagnosticCompletion(m){
 if(m.preview)return;
 const a=state.attempts?.[m.id+':diagnostic'];
 if(!a||!Array.isArray(a.answers)||a.bankVersion!==JOURNEY_VERSION)return;
 const qs=getQs(m,'diagnostic');
 if(qs.length!==a.answers.length)return; // Never regrade against an incompatible bank.
 const grouped={};
 qs.forEach((q,i)=>{if(!m.lessons.some(l=>l[0]===q.target))return;
  (grouped[q.target]??=[]).push(a.answers[i]===q.answer);
 });
 state.autoReviewed??={};state.done??={};
 let changed=false;
 for(const [id,marks] of Object.entries(grouped))if(marks.length&&marks.every(Boolean)){
  if(!state.done[id]){state.done[id]=true;changed=true;}
  if(!state.autoReviewed[id]){state.autoReviewed[id]=true;changed=true;}
 }
 if(changed)save();
}
function atdStageCompletion(m){
 const d=state.attempts[m.id+':diagnostic'],mastery=state.attempts[m.id+':mastery'],advanced=state.attempts[m.id+':advanced'];
 const draft=state.draft,caseDraft=state.caseDraft;
 const qcount=getQs(m,'diagnostic').length||1;
 const dProgress=d?100:(draft?.mid===m.id&&draft.stage==='diagnostic'?
  Math.round(100*(draft.answers||[]).filter(x=>x!==undefined).length/qcount):0);
 // Review focuses on lessons with diagnostic knowledge gaps; it is complete
 // when none remain or all related lessons have since been marked reviewed.
 const gaps=d?[...new Set((state.knowledgeGaps?.[m.id]||[]).filter(id=>m.lessons.some(l=>l[0]===id)))]:[];
 const reviewed=gaps.filter(id=>state.done[id]||state.studiedLessons?.[id]||state.manualReviewed?.[id]).length;
 const reviewProgress=!d?0:!gaps.length?100:Math.round(100*reviewed/gaps.length);
 const materialTotal=m.lessons.length;
 const materialDone=m.lessons.filter(l=>!!state.done[l[0]]).length;
 const materialProgress=m.preview?null:materialTotal?Math.round(100*materialDone/materialTotal):0;
 const masteryCount=getQs(m,'mastery').length||1;
 const masteryProgress=m.preview?null:mastery?100:draft?.mid===m.id&&draft.stage==='mastery'?
  Math.round(100*(draft.answers||[]).filter(x=>x!==undefined).length/masteryCount):0;
 const caseTotal=Math.max(1,Math.min(3,caseQuestions(m).length)*3);
 const advancedProgress=m.preview?null:advanced?100:caseDraft?.mid===m.id?
  Math.min(99,Math.round(100*((caseDraft.history||[]).length/caseTotal))):0;
 return [
  {view:'diagnostic',en:'Diagnostic Exam',ar:'التقييم التشخيصي',progress:dProgress,score:d?.score},
  {view:'review',en:'My Review',ar:'مراجعتي',progress:reviewProgress},
  {view:'material',en:'Full Material',ar:'المحتوى الكامل',progress:materialProgress,amount:materialDone+'/'+materialTotal},
  {view:'mastery',en:'Mastery Check',ar:'اختبار الإتقان',progress:masteryProgress,score:mastery?.score},
  {view:'advanced',en:'Advanced Scenarios',ar:'الحالات المتقدمة',progress:advancedProgress,score:advanced?.score}
 ];
}
function atdDisplayStageProgress(m){
 const top=$('top');if(!top||!top.querySelector('.tabs'))return;
 const stages=atdStageCompletion(m),ar=state.lang==='ar';
 const old=top.querySelector('#atdStageProgress');if(old)old.remove();
 const section=document.createElement('section');section.id='atdStageProgress';section.className='atdStageProgress';
 section.setAttribute('aria-label',ar?'تقدم مراحل الموديول':'Module learning stage progress');
 section.innerHTML='<div class="atdStageProgressHeading"><strong>'+msg('Your learning pathway','مسارك التعليمي')+'</strong><small>'+msg('Progress means stage completion, not test score.','النسبة تعني إكمال المرحلة، وليست علامة الاختبار.')+'</small></div>'+
 '<div class="atdStageProgressGrid">'+stages.map((s,i)=>{
  const pct=s.progress===null?null:Math.max(0,Math.min(100,s.progress));
  const done=pct===100,active=state.view===s.view;
  const summary=pct===null?msg('Not available yet','غير متوفر حالياً'):done?msg('✓ Completed','✓ مكتمل'):pct?msg('In progress','قيد التقدم'):msg('Not started','لم يبدأ');
  return '<button type="button" class="atdStageTrack '+(done?'completed ':'')+(active?'current':'')+'" onclick="view(\''+s.view+'\')" '+(pct===null?'disabled':'')+'>'+
   '<span class="atdStageTrackTitle">'+(i+1)+'. '+esc(ar?s.ar:s.en)+'</span>'+
   '<span class="atdStageTrackValue">'+(pct===null?'—':pct+'%')+'</span>'+
   '<span class="atdStageBar"><span style="width:'+(pct||0)+'%"></span></span>'+
   '<small>'+summary+(s.amount?' · '+esc(s.amount):'')+'</small></button>';
 }).join('')+'</div>';
 top.querySelector('.tabs').insertAdjacentElement('afterend',section);
 const tabs=top.querySelectorAll('.tabs button');
 tabs.forEach((tab,i)=>{const stage=stages[i];if(!stage)return;const pct=stage.progress;
  const status=pct===100?' ✓':pct>0?' · '+pct+'%':'';
  tab.textContent=(ar?stage.ar:stage.en)+status;
 });
}
const ATD_V21_RENDER=render;
render=function(){
 // Repairs correct diagnostic answers already stored under the current bank
 // when switching accounts or returning after a reload.
 if(state.view!=='home'&&state.view!=='saved'&&state.view!=='analytics'&&state.view!=='domain-dashboard')
  atdRestoreDiagnosticCompletion(mod());
 ATD_V21_RENDER();
 if(!['home','saved','analytics','domain-dashboard'].includes(state.view))atdDisplayStageProgress(mod());
};


/* Compact single-line pathway summary, navigable and responsive. */
atdDisplayStageProgress=function(m){
 const top=$('top'),tabs=top?.querySelector('.tabs');if(!tabs)return;
 const old=top.querySelector('#atdStageProgress');if(old)old.remove();
 const stages=atdStageCompletion(m),ar=state.lang==='ar';
 const bar=document.createElement('div');bar.id='atdStageProgress';bar.className='atdPathwayCompact';
 bar.setAttribute('aria-label',ar?'تقدم مراحل التعلم':'Learning pathway status');
 bar.innerHTML='<span class="atdPathwayLabel">'+msg('YOUR PATHWAY','مسارك')+'</span>'+
 stages.map((s,i)=>{
  const value=s.progress===null?'—':s.progress+'%',done=s.progress===100,active=state.view===s.view;
  return '<button type="button" class="atdPathChip '+(done?'done ':'')+(active?'active':'')+'" '+
   (s.progress===null?'disabled':'onclick="view(\''+s.view+'\')"')+' title="'+esc((ar?s.ar:s.en)+' · '+value)+'">'+
   '<span>'+esc(ar?s.ar:s.en)+'</span><b>'+esc(value)+'</b></button>';
 }).join('');
 tabs.insertAdjacentElement('afterend',bar);
 tabs.querySelectorAll('button').forEach((b,i)=>{
  if(!stages[i])return;
  b.textContent=(ar?stages[i].ar:stages[i].en)+(stages[i].progress===100?' ✓':'');
 });
};


/* v23 — keep module header at top when switching tabs, and emphasize done lessons. */
const ATD_V23_VIEW=view;
view=function(name){
 const before=state.view;
 ATD_V23_VIEW(name);
 if(before!==state.view&&['diagnostic','review','material','mastery','advanced'].includes(state.view)){
  // Avoid retaining the previous tab's scroll offset on My Review.
  window.scrollTo({top:0,left:0,behavior:'instant'});
 }
};
const ATD_V23_RENDER=render;
render=function(){
 ATD_V23_RENDER();
 const root=$('body');
 if(!root)return;
 if(state.view==='material'){
  root.querySelectorAll('.moduleLessonBtn').forEach(button=>{
   const id=button.textContent.trim().match(/\d+\.\d+\.\d+/)?.[0];
   if(!id)return;
   const done=!!state.done[id];
   button.classList.toggle('atdLessonCompleted',done);
   button.setAttribute('aria-label',id+(done?' — Completed':' — Not completed'));
   if(done&&!button.querySelector('.atdDoneMarker')){
    const label=document.createElement('span');label.className='atdDoneMarker';
    label.textContent=msg('✓ Completed','✓ مكتمل');button.append(label);
   }
  });
  root.querySelectorAll('.lesson').forEach(card=>{
   const id=card.id?.replace(/^lesson-/,'').replace(/-/g,'.');
   if(!id)return;
   const done=!!state.done[id];
   card.classList.toggle('atdLessonCompleted',done);
   const tag=card.querySelector('.skillTag');
   if(tag&&done&&!card.querySelector('.atdDoneFlag')){
    const flag=document.createElement('span');flag.className='atdDoneFlag';
    flag.textContent=msg('✓ Completed','✓ مكتمل');tag.insertAdjacentElement('afterend',flag);
   }
  });
 }
 // The left course navigation also indicates whole-module completion.
 document.querySelectorAll('#sidebar .sideBtn').forEach(button=>{
  const id=button.querySelector('b')?.textContent?.trim().match(/^\d+\.\d+/)?.[0];
  const m=DATA.modules.find(x=>x.id===id);
  if(!m||!m.lessons.length)return;
  const done=m.lessons.every(l=>!!state.done[l[0]]);
  button.classList.toggle('atdModuleCompleted',done);
  if(done&&!button.querySelector('.atdModuleDoneLabel')){
   const label=document.createElement('span');label.className='atdModuleDoneLabel';
   label.textContent=msg('✓ Completed','✓ مكتمل');button.append(label);
  }
 });
};
