/* ATD Academy — Mastery Applied Judgment v28
 * Removes Diagnostic/Mastery stem duplication by converting overlapping Mastery first items
 * into one-step workplace "What should you do next?" decisions.
 * Existing second Mastery items remain as authored scenario/evidence questions.
 */
(function(){
 "use strict";
 const VERSION="mastery-applied-v28";
 const PREVIOUS_GETQS=getQs;
 const STOP=new Set("a an the and or of to in on at for from by with is are was were be been being what which who how should would could can do does did this that these those your their its our before after into about when while than then best most first next".split(" "));
 const clean=s=>String(s??"").replace(/\s+/g," ").trim();
 const toks=s=>new Set(clean(s).toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)));
 const jac=(a,b)=>{const A=toks(a),B=toks(b),n=[...A].filter(x=>B.has(x)).length,u=A.size+B.size-n;return u?n/u:0;};
 const short=(s,n=150)=>{s=clean(s).replace(/[.!?]+$/,"");return s.length<=n?s:s.slice(0,n).replace(/\s+\S*$/,"")+"…";};
 function overlap(m,item){
  const diagnostic=PREVIOUS_GETQS(m,"diagnostic")||[];
  return Math.max(0,...diagnostic.filter(q=>q.target===item.target).map(q=>jac(q.q,item.q)));
 }
 function complication(l,id){
  const text=(l[1]+" "+l[2]+" "+l[3]).toLowerCase(),n=id.split(".").reduce((s,x)=>s+Number(x||0),0);
  if(/feedback|communication|dialogue|facilitat|coach|listen|relationship/.test(text)){
   return [
    "The first conversation does not produce agreement, and one stakeholder asks for a practical next step.",
    "A stakeholder challenges the initial recommendation and asks what should happen before the team moves forward.",
    "The discussion becomes tense, but the business decision still needs to be made today."
   ][n%3];
  }
  if(/data|analytic|evaluat|measure|impact|evidence|metric/.test(text)){
   return [
    "The available data are incomplete, and the sponsor still wants a defensible decision.",
    "One indicator looks positive, but another could support a different conclusion.",
    "The team has activity data, but not yet enough evidence about workplace performance."
   ][n%3];
  }
  if(/project|change|process|workflow|implement|risk|scope/.test(text)){
   return [
    "A new constraint appears during implementation and could affect the original plan.",
    "The deadline has not changed, but the team discovers a dependency that was not considered.",
    "The sponsor wants the team to proceed, although one implementation risk remains unresolved."
   ][n%3];
  }
  if(/talent|career|succession|workforce|potential|performance|leader/.test(text)){
   return [
    "The decision will affect employee opportunity, so the team needs a fair and job-relevant next step.",
    "Managers disagree about readiness, and the evidence available is not equally strong for every employee.",
    "The business need is urgent, but the talent decision must still be evidence-based."
   ][n%3];
  }
  if(/technology|lms|platform|ai |privacy|accessib|digital|system/.test(text)){
   return [
    "The preferred solution is attractive, but one access, governance, or compatibility concern remains.",
    "The sponsor wants a quick technology decision before every requirement has been verified.",
    "Users support the idea, but the team has not yet tested it under real work conditions."
   ][n%3];
  }
  return [
   "The sponsor wants a decision now, but the team has one important assumption that has not been tested.",
   "Initial support is strong, but the workplace conditions make the decision less straightforward.",
   "A new piece of evidence challenges part of the team's original plan."
  ][n%3];
 }
 function build(m,item,index){
  const l=m.lessons.find(x=>x[0]===item.target);if(!l)return item;
  const application=short(l[3]||l[2]||l[1],170),extra=complication(l,item.target);
  const stem="A Talent Development professional is working on "+l[1].toLowerCase()+". The current work is: "+application+". "+extra+" What should the TD professional do next?";
  return {...item,id:item.target+"-m28-"+(index+1),q:stem,bankVersion:VERSION,cognitiveDemand:"Apply / Evaluate",difficulty:"Hard",editorialStatus:"applied-judgment-v28",diagnosticOverlapBefore:+overlap(m,item).toFixed(2)};
 }
 getQs=function(m,stage){
  const items=PREVIOUS_GETQS(m,stage);
  if(stage!=="mastery")return items;
  const byLesson=new Map();
  for(const item of items){if(!byLesson.has(item.target))byLesson.set(item.target,[]);byLesson.get(item.target).push(item);}
  const out=[];
  for(const l of m.lessons){
   const pair=byLesson.get(l[0])||[];
   pair.forEach((item,i)=>{
    const duplicate=i===0&&overlap(m,item)>=.50;
    const next=duplicate?build(m,item,i):{...item,id:item.target+"-m28-"+(i+1),bankVersion:VERSION};
    out.push(next);
   });
  }
  return out;
 };
 window.ATDMasteryAppliedV28={version:VERSION,overlap};
})();
