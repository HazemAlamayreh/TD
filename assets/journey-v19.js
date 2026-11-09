
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
function caseStepData(q,step){
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
function initializeCase(m){
 if(sess&&sess.stage==='advanced-case'&&sess.mid===m.id)return;
 const previous=state.caseDraft;
 sess={mid:m.id,stage:'advanced-case',caseIndex:0,step:0,selected:[],submitted:false,points:0,maxPoints:0,history:[],finished:false};
 if(previous?.mid===m.id&&previous.version==='case-v19'){
  Object.assign(sess,previous);sess.finished=false;
 }
}
function persistCase(){
 state.caseDraft={mid:sess.mid,stage:sess.stage,caseIndex:sess.caseIndex,step:sess.step,selected:sess.selected.slice(),submitted:sess.submitted,points:sess.points,maxPoints:sess.maxPoints,history:sess.history.slice(),version:'case-v19'};save();
}
function showAdvanced(m){
 const qs=caseQuestions(m);
 if(!qs.length){$('body').innerHTML='<div class="panel">'+msg('Advanced cases require source questions for this capability.','تحتاج الحالات المتقدمة إلى مصدر أسئلة لهذه القدرة.')+'</div>';return;}
 initializeCase(m);
 if(sess.finished){showCaseResult(m);return;}
 const q=qs[sess.caseIndex],item=caseStepData(q,sess.step),ar=state.lang==='ar';
 const chosen=sess.selected||[],selectedSet=new Set(chosen);
 const stageLabels=[msg('Situation & initial decision','الموقف والقرار الأول'),msg('Stakeholder constraints','قيود أصحاب العلاقة'),msg('Measure & adjust','قياس الأثر والتعديل')];
 let context=sess.step===0?q.q:sess.step===1?
  msg('The team has considered its initial response. Affected stakeholders are now asking how the approach will fit operational constraints and employees’ needs.','ناقش الفريق الاستجابة الأولية. ويسأل أصحاب العلاقة الآن عن مدى ملاءمتها لقيود التشغيل واحتياجات الموظفين.'):
  msg('The action has been introduced. Early learner feedback is positive, but changes in job performance are not yet consistent.','تم تنفيذ الإجراء. كانت انطباعات المتعلمين إيجابية، لكن التحسن في الأداء الوظيفي لم يكن ثابتاً حتى الآن.');
 $('body').innerHTML='<div class="panel qBox"><span class="pill">'+msg('ADVANCED · CASE MANAGEMENT PRACTICE','المتقدم · تدريب إدارة الحالات')+'</span><h1>'+msg('Applied Talent Development Decisions','قرارات تطبيقية في تطوير المواهب')+'</h1><p class="muted">'+msg('Select TWO suitable actions per step. +1 for each suitable choice and −1 for each unsuitable choice. Once you proceed, you cannot change a previous step. Independent ATD-style practice, not an official exam.','اختر إجراءين مناسبين لكل خطوة. نقطة للإجراء المناسب وخصم نقطة للإجراء غير المناسب. لا يمكن تغيير الخطوات السابقة بعد الانتقال. تدريب مستقل وليس اختبار ATD رسمياً.')+'</p>'+
 (ar?'<p class="translationNotice">نص الحالة وخياراتها المهنية الأصلية باللغة الإنجليزية؛ الإرشادات والنتائج متاحة بالعربية. لا توجد ترجمة عربية معتمدة لهذه الحالات بعد.</p>':'')+
 '<div class="questionMeta"><span>'+msg('Case ','الحالة ')+(sess.caseIndex+1)+' / '+qs.length+' · '+msg('Step ','خطوة ')+(sess.step+1)+' / 3</span><span class="skillTag">'+esc(stageLabels[sess.step])+'</span></div><div class="barOuter"><div class="barInner" style="width:'+(100*(sess.caseIndex*3+sess.step+1)/(qs.length*3))+'%"></div></div>'+
 '<h2 class="chapter">'+esc(context)+'</h2><h3>'+esc(item.prompt)+'</h3>'+
 item.options.map((opt,i)=>'<button class="answer '+(selectedSet.has(i)?'selected ':'')+(sess.submitted&&opt.correct?'correct':'')+'" '+(sess.submitted?'disabled':'')+' onclick="toggleCaseOption('+i+')"><b>'+(selectedSet.has(i)?'☑':'☐')+'</b> '+esc(opt.text)+'</button>').join('')+
 (sess.submitted?'<div class="feedback"><b>'+msg('Decision feedback','تفسير القرار')+'</b><p>'+esc(q.why||'Choose actions supported by evidence and measurable outcomes.')+'</p><p>'+msg('Suitable actions: ','الإجراءات المناسبة: ')+esc(item.options.filter(x=>x.correct).map(x=>x.text).join(' | '))+'</p><p>'+msg('This step: ','نتيجة الخطوة: ')+sess.lastDelta+' / 2</p></div>':'')+
 '<div class="testTools">'+(sess.submitted?
 '<button class="btn primary" onclick="advanceCase()">'+(sess.caseIndex===qs.length-1&&sess.step===2?msg('Finish cases','إنهاء الحالات'):msg('Continue to next step →','الخطوة التالية'))+'</button>':
 '<button class="btn primary" '+(chosen.length!==2?'disabled':'')+' onclick="submitCaseStep()">'+msg('Submit two decisions','تأكيد القرارين')+'</button>')+
 '<button class="btn" onclick="restartCases()">'+msg('Restart cases','إعادة الحالات')+'</button></div></div>';
}
function toggleCaseOption(i){
 if(!sess||sess.submitted)return;
 let a=sess.selected||[];
 sess.selected=a.includes(i)?a.filter(x=>x!==i):a.length<2?[...a,i]:a;
 persistCase();render();
}
function submitCaseStep(){
 if(!sess||sess.selected.length!==2||sess.submitted)return;
 const m=DATA.modules.find(x=>x.id===sess.mid),q=caseQuestions(m)[sess.caseIndex],step=caseStepData(q,sess.step);
 const delta=sess.selected.reduce((n,i)=>n+(step.options[i].correct?1:-1),0);
 sess.points+=delta;sess.maxPoints+=2;sess.lastDelta=delta;
 sess.history.push({caseIndex:sess.caseIndex,step:sess.step,choices:sess.selected.slice(),delta});
 sess.submitted=true;persistCase();render();
}
function advanceCase(){
 if(!sess?.submitted)return;
 const m=DATA.modules.find(x=>x.id===sess.mid),n=caseQuestions(m).length;
 if(sess.step<2)sess.step++;
 else if(sess.caseIndex<n-1){sess.caseIndex++;sess.step=0;}
 else {
  sess.finished=true;
  const score=Math.max(0,sess.points)/Math.max(1,sess.maxPoints);
  const previous=state.attempts[m.id+':advanced'];if(previous)state.attemptHistory.push({capability:m.id,stage:'advanced',...previous});
  const a={score,rawPoints:sess.points,maxPoints:sess.maxPoints,questionCount:sess.history.length,caseVersion:'case-v19',ts:new Date().toISOString(),history:sess.history.slice()};
  state.attempts[m.id+':advanced']=a;state.caseHistory.push({mid:m.id,...a});
  delete state.caseDraft;save();render();return;
 }
 sess.selected=[];sess.submitted=false;sess.lastDelta=undefined;persistCase();render();
}
function restartCases(){delete state.caseDraft;sess=null;save();render();}
function showCaseResult(m){
 const a=state.attempts[m.id+':advanced'];
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
 section.innerHTML='<h2>'+msg('Saved answer review','مراجعة الإجابات المحفوظة')+'</h2>'+
 attempt.history.map((entry,i)=>{
  const q=qs[entry.caseIndex];if(!q)return '';
  const step=caseStepData(q,entry.step);
  const chosen=(entry.choices||[]).map(j=>step.options[j]).filter(Boolean);
  const right=step.options.filter(opt=>opt.correct);
  return '<div class="lesson"><span class="skillTag">'+msg('Case ','الحالة ')+(entry.caseIndex+1)+' · '+msg('Step ','الخطوة ')+(entry.step+1)+'</span>'+
   '<p><b>'+msg('Your decisions: ','قراراتك: ')+'</b>'+chosen.map(x=>esc(x.text)).join(' | ')+'</p>'+
   '<p><b>'+msg('Recommended actions: ','الإجراءات الموصى بها: ')+'</b>'+right.map(x=>esc(x.text)).join(' | ')+'</p>'+
   '<p>'+msg('Points: ','النقاط: ')+esc(entry.delta)+'</p>'+
   '<div class="feedback">'+esc(q.why||'')+'</div></div>';
 }).join('');
 area.append(section);
};
