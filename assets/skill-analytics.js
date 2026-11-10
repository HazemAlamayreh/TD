/* ATD Skill Analytics v1
 * Transparent, provisional performance evidence; NOT a validated psychometric diagnosis.
 * Evidence: first saved response to each uniquely identified MCQ item.
 * Repeat attempts and skipped items never inflate the initial competence percentage.
 */
export const SKILL_SET=[
 ["communication","Communication Skills"],
 ["emotional-intelligence","Emotional Intelligence"],
 ["conflict-resolution","Conflict Resolution"],
 ["problem-solving","Problem Solving"],
 ["critical-thinking","Critical Thinking"],
 ["decision-making","Decision Making"],
 ["collaboration","Collaboration & Teamwork"],
 ["resilience","Resilience & Adaptability"],
 ["inclusive-practice","Inclusion & Fairness"],
 ["project-management","Project Management"],
 ["ethics","Ethics & Professional Judgment"],
 ["career-development","Career & Leadership Development"],
 ["coaching","Coaching Skills"],
 ["facilitation","Training & Facilitation"],
 ["instructional-design","Instructional Design"],
 ["learning-science","Learning Science"],
 ["technology","Learning Technology"],
 ["knowledge-management","Knowledge Management"],
 ["evaluation","Evaluation & Impact"],
 ["change-management","Change Management"],
 ["business-acumen","Business Acumen"],
 ["consulting","Consulting"],
 ["organization-development","Organizational Development"],
 ["talent-management","Talent Strategy & Management"],
 ["performance-improvement","Performance Improvement"],
 ["data-literacy","Data Literacy & Analytics"],
 ["future-readiness","Future Readiness"]
];
const LABELS=Object.fromEntries(SKILL_SET);
const BY_MODULE={
 "1.1":"communication","1.2":"emotional-intelligence","1.3":"collaboration","1.4":"inclusive-practice","1.5":"project-management","1.6":"ethics","1.7":"career-development",
 "2.1":"learning-science","2.2":"instructional-design","2.3":"facilitation","2.4":"technology","2.5":"knowledge-management","2.6":"career-development","2.7":"coaching","2.8":"evaluation",
 "3.1":"business-acumen","3.2":"consulting","3.3":"organization-development","3.4":"talent-management","3.5":"performance-improvement","3.6":"change-management","3.7":"data-literacy","3.8":"future-readiness"
};
const TOPIC_RULES=[
 [/\b(conflict|dispute|disagreement|negotiat|mediat|de.escalat|difficult conversation)\b/i,"conflict-resolution"],
 [/\b(critical thinking|structured reasoning|assumption|inference|groupthink|evidence quality|fact versus)\b/i,"critical-thinking"],
 [/\b(problem.solv|root cause|problem analysis|troubleshoot)\b/i,"problem-solving"],
 [/\b(decision.mak|decision model|decision matrix|decision criteria)\b/i,"decision-making"],
 [/\b(resilien|adaptab|stress|coping|setback)\b/i,"resilience"],
 [/\b(bias|inclus|divers|fairness|equity|cultural|accessib)\b/i,"inclusive-practice"],
 [/\b(active listen|communication|nonverbal|presentat|messag|dialogue|influenc)\b/i,"communication"],
 [/\b(coaching|coach|mentor)\b/i,"coaching"],
 [/\b(collaborat|teamwork|delegat|team dynamic|group work)\b/i,"collaboration"],
 [/\b(emotional intelligence|emotional state|emotion|empathy|self.aware|self.regulat)\b/i,"emotional-intelligence"],
 [/\b(ethical|ethic|privacy|confiden|copyright|integrity)\b/i,"ethics"],
 [/\b(evaluat|impact|attribut|return on investment|metric)\b/i,"evaluation"],
 [/\b(analytics|predictive|data visual|data analysis|statistic)\b/i,"data-literacy"],
 [/\b(facilitat|delivery|group learning)\b/i,"facilitation"],
 [/\b(performance improvement|hpi|performance analysis|work system)\b/i,"performance-improvement"],
 [/\b(change management|change readiness|adkar)\b/i,"change-management"]
];
const knownStage=s=>["diagnostic","mastery"].includes(s);
const epoch=t=>{const n=typeof t==="string"?Date.parse(t):t?.toDate?.()?.getTime?.();return Number.isFinite(n)?n:0;};
function lessonIndex(modules){const map=new Map();for(const m of modules||[])for(const l of m.lessons||[])map.set(l[0],{title:l[1],mid:m.id});return map;}
export function skillForLesson(lessonId,modules){
 const index=lessonIndex(modules),lesson=index.get(lessonId);
 if(!lesson)return null;
 const mid=lesson.mid,text=lesson.title||"";
 // Topic-specific labels take priority over module-level categories.
 for(const [rx,skill] of TOPIC_RULES)if(rx.test(text))return {id:skill,label:LABELS[skill],lessonId,lessonTitle:text,source:"lesson title"};
 const skill=BY_MODULE[mid];return skill?{id:skill,label:LABELS[skill],lessonId,lessonTitle:text,source:"module capability"}:null;
}
function mapper(modules){const idx=lessonIndex(modules),cache=new Map();return id=>{
 if(cache.has(id))return cache.get(id);
 const item=idx.get(id);if(!item){cache.set(id,null);return null;}
 let skill=null;
 for(const [rx,name] of TOPIC_RULES)if(rx.test(item.title)){skill=name;break;}
 skill=skill||BY_MODULE[item.mid]||null;
 const result=skill?{id:skill,label:LABELS[skill],lessonId:id,lessonTitle:item.title,source:skill===BY_MODULE[item.mid]?"module capability":"lesson title"}:null;
 cache.set(id,result);return result;
};}
export function analyzeLearnerSkills(attempts,modules){
 const classify=mapper(modules),seen=new Map(),unmapped=[],missing=[];
 const ordered=(attempts||[]).slice().sort((a,b)=>epoch(a.ts)-epoch(b.ts)||(String(a.recordId||"")).localeCompare(String(b.recordId||"")));
 let available=0,skipped=0,retakeResponses=0;
 for(const a of ordered){
  const [mid,stage]=String(a.assessmentKey||"").split(":");
  if(!knownStage(stage))continue;
  if(!Array.isArray(a.questionSnapshots)){missing.push(a.assessmentKey||"unknown");continue;}
  for(const q of a.questionSnapshots){
   const id=String(q.id||"");const selected=q.selectedIndex,answer=q.correctIndex;
   if(!id||!Number.isInteger(answer)||!Array.isArray(q.options)||answer<0||answer>=q.options.length){unmapped.push({mid,stage,id,reason:"Missing or invalid answer key"});continue;}
   const category=classify(q.target);
   if(!category){unmapped.push({mid,stage,id,reason:"Lesson not mapped"});continue;}
   const key=stage+"|"+mid+"|"+id;
   if(seen.has(key)){retakeResponses++;continue;}
   // Only evaluate answered and skipped responses; no score for an incomplete draft.
   if(selected!==null&&!Number.isInteger(selected)){unmapped.push({mid,stage,id,reason:"No saved selection"});continue;}
   available++;if(selected===null)skipped++;
   seen.set(key,{...category,questionId:id,stage,correct:selected===answer,skipped:selected===null,selectedIndex:selected,correctIndex:answer,ts:a.ts||"",prompt:q.prompt||"",moduleId:mid});
  }
 }
 const bySkill=new Map();
 for(const q of seen.values()){
  let row=bySkill.get(q.id);
  if(!row){row={id:q.id,label:q.label,answered:0,correct:0,wrong:0,skipped:0,diagnostic:0,mastery:0,lessonIds:new Set(),examples:[],evidence:[]};bySkill.set(q.id,row);}
  if(q.skipped)row.skipped++;
  else {row.answered++;if(q.correct)row.correct++;else row.wrong++;}
  row[q.stage]++;row.lessonIds.add(q.lessonId);row.evidence.push(q);
  if(!q.correct&&row.examples.length<3)row.examples.push({lessonId:q.lessonId,lessonTitle:q.lessonTitle,stage:q.stage,questionId:q.questionId});
 }
 const rows=SKILL_SET.map(([id,label])=>{
  const r=bySkill.get(id)||{id,label,answered:0,correct:0,wrong:0,skipped:0,diagnostic:0,mastery:0,lessonIds:new Set(),examples:[],evidence:[]};
  const n=r.answered;
  const rate=n?r.correct/n:null;
  const coverage=n>=15?"Substantial sample":n>=8?"Developing sample":n>=4?"Limited sample":"Insufficient evidence";
  const band=n<4?"Insufficient evidence":rate>=.8?"Observed strength":rate<.6?"Development priority":"Developing";
  return {...r,lessonIds:[...r.lessonIds],rate,coverage,band};
 });
 const advanced=[];
 for(const a of ordered){
  if(!String(a.assessmentKey||"").endsWith(":advanced")||!Array.isArray(a.caseStepSnapshots))continue;
  const mid=String(a.assessmentKey).split(":")[0],skill=BY_MODULE[mid];
  if(!skill)continue;
  const total=a.caseStepSnapshots.reduce((s,x)=>s+(x.correctIndices?.length||0),0),earned=a.caseStepSnapshots.reduce((s,x)=>s+Number(x.delta||0),0);
  if(total>0)advanced.push({skillId:skill,label:LABELS[skill],mid,steps:a.caseStepSnapshots.length,rate:Math.max(0,Math.min(1,earned/total)),ts:a.ts});
 }
 const tested=rows.filter(x=>x.answered>0),scorable=tested.filter(x=>x.answered>=4);
 return {rows,tested,scorable,available,skipped,retakeResponses,unmapped:unmapped.length,withoutSnapshots:missing.length,advanced,
  strength:scorable.filter(x=>x.band==="Observed strength").sort((a,b)=>b.rate-a.rate),
  priorities:scorable.filter(x=>x.band==="Development priority").sort((a,b)=>a.rate-b.rate)};
}
export function skillDefinitions(){return SKILL_SET.map(([id,label])=>({id,label}));}
export function cohortSkillSummary(learners,modules){
 const def=skillDefinitions();return def.map(d=>{
  const values=learners.map(x=>analyzeLearnerSkills(x.attempts,modules).rows.find(r=>r.id===d.id)).filter(r=>r?.answered>=4);
  return {...d,learners:values.length,mean:values.length?values.reduce((s,r)=>s+r.rate,0)/values.length:null,items:values.reduce((s,r)=>s+r.answered,0)};
 });
}
