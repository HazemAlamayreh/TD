import {onSnapshot,collection} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = id => document.getElementById(id);
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const selected = new Set([1,2,3,4]);
const state = {records:[], year:2026, dateField:"onboardingStartDate", department:"all", status:"all", search:"", loading:true, error:"", authorized:false};
let stop = null;

function dateValue(value) {
  if (!value) return null;
  const d = value?.toDate?.() || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value+"T12:00:00Z") : new Date(value));
  return d instanceof Date && Number.isFinite(d.getTime()) ? d : null;
}
function textDate(value) {
  const d=dateValue(value);
  return d ? d.toLocaleDateString("en-GB",{year:"numeric",month:"short",day:"2-digit",timeZone:"UTC"}) : "Not recorded";
}
function progress(value) {
  const n=typeof value==="number" ? value : Number(value);
  return value!==null && value!==undefined && value!=="" && Number.isFinite(n) && n>=0 && n<=100 ? n : null;
}
function statusFor(row) {
  const raw=String(row.onboardingStatus||row.status||"").toLowerCase().replace(/[\s-]+/g,"_");
  if(["completed","complete"].includes(raw)) return "completed";
  if(["in_progress","started"].includes(raw)) return "in_progress";
  if(["not_started","pending"].includes(raw)) return "not_started";
  if(row.progress===100) return "completed";
  if(row.progress!==null && row.progress>0) return "in_progress";
  if(row.progress===0) return "not_started";
  return "unknown";
}
function normalize(doc) {
  const x=doc.data(), p=progress(x.overallProgress ?? x.onboardingProgressPercent ?? x.progressPercent);
  return {
    id:doc.id, uid:x.uid||x.authUid||x.userUid||"",
    employeeId:x.employeeId||doc.id, name:x.name||x.displayName||x.fullName||"",
    email:x.email||"",department:x.department||"",jobTitle:x.jobTitle||"",
    hireDate:x.hireDate||null, firstLoginAt:x.firstLoginAt||null,
    onboardingStartDate:x.onboardingStartDate||x.onboardingStartedAt||null,
    onboardingCompletedAt:x.onboardingCompletedAt||x.completedAt||null,
    lastActivityAt:x.lastActivityAt||null, progress:p,
    onboardingStatus:x.onboardingStatus||x.status||""
  };
}
function matches(row) {
  const d=dateValue(row[state.dateField]);
  // Year/month selection is intentionally based on UTC calendar months; missing dates are excluded.
  if(!d || d.getUTCFullYear()!==state.year || !selected.has(d.getUTCMonth())) return false;
  if(state.department!=="all" && row.department!==state.department) return false;
  if(state.status!=="all" && statusFor(row)!==state.status) return false;
  const q=state.search.toLocaleLowerCase();
  return [row.name,row.email,row.employeeId,row.department,row.jobTitle].join(" ").toLocaleLowerCase().includes(q);
}
function exportCSV(rows) {
  const columns=["Employee ID","Name","Email","Department","Job Title","Hire Date","First Login","Onboarding Start","Onboarding Completion","Last Activity","Progress Percent","Status"];
  const fields=r=>[r.employeeId,r.name,r.email,r.department,r.jobTitle,textDate(r.hireDate),textDate(r.firstLoginAt),textDate(r.onboardingStartDate),textDate(r.onboardingCompletedAt),textDate(r.lastActivityAt),r.progress??"",statusFor(r)];
  const cell=value=>{
    let s=String(value??"");
    // Prevent spreadsheet formula execution on CSV import.
    if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  };
  const data="\uFEFF"+[columns,...rows.map(fields)].map(r=>r.map(cell).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([data],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="onboarding-employees-"+state.year+"-"+new Date().toISOString().slice(0,10)+".csv";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function render() {
  const root=$("onboardingCohortRoot");
  if(!root)return;
  const rows=state.records.filter(matches);
  const departments=[...new Set(state.records.map(r=>r.department).filter(Boolean))].sort();
  const knownProgress=rows.filter(r=>r.progress!==null);
  const completed=rows.filter(r=>statusFor(r)==="completed").length;
  const started=rows.filter(r=>statusFor(r)==="in_progress").length;
  const notStarted=rows.filter(r=>statusFor(r)==="not_started").length;
  const unknown=rows.length-completed-started-notStarted;
  const avg=knownProgress.length?Math.round(knownProgress.reduce((n,r)=>n+r.progress,0)/knownProgress.length)+"%":"—";
  const options=Object.entries({onboardingStartDate:"Onboarding start date",hireDate:"Hire date",firstLoginAt:"First login date",onboardingCompletedAt:"Completion date",lastActivityAt:"Last activity date"}).map(([key,label])=>'<option value="'+key+'"'+(state.dateField===key?" selected":"")+'>'+label+'</option>').join("");
  root.innerHTML='<div class="skillSectionHeader"><div><h2>Employee Onboarding · Cohort Analytics</h2><p class="muted small">Live Firestore employee directory · filtered by dates actually recorded. Missing dates are not inferred from registration or login.</p></div><button id="onbCsv" type="button"'+(state.loading||state.error?' disabled':'')+'>Export filtered CSV</button></div>'+
    '<div class="onbFilters"><label>Date type<select id="onbDateType">'+options+'</select></label><label>Year<select id="onbYear">'+[2024,2025,2026,2027,2028,2029].map(y=>'<option'+(y===state.year?' selected':'')+'>'+y+'</option>').join("")+'</select></label>'+
    '<label>Department<select id="onbDept"><option value="all">All departments</option>'+departments.map(d=>'<option value="'+safe(d)+'"'+(state.department===d?' selected':'')+'>'+safe(d)+'</option>').join("")+'</select></label>'+
    '<label>Status<select id="onbStatus">'+[["all","All statuses"],["not_started","Not started"],["in_progress","In progress"],["completed","Completed"],["unknown","Unknown"]].map(([v,l])=>'<option value="'+v+'"'+(state.status===v?' selected':'')+'>'+l+'</option>').join("")+'</select></label>'+
    '<label>Search<input type="search" id="onbSearch" placeholder="Name, email or employee ID" value="'+safe(state.search)+'"></label></div>'+
    '<div class="onbMonths" aria-label="Filter months">'+monthNames.map((m,i)=>'<label><input type="checkbox" data-onb-month="'+i+'"'+(selected.has(i)?' checked':'')+'>'+m+'</label>').join("")+'</div>'+
    '<p class="muted small">Default selection: February–May 2026, onboarding start date, all departments and statuses. Months use OR; other filters combine with AND. '+state.records.filter(r=>!dateValue(r[state.dateField])).length+' employee records have no valid selected date and are excluded.</p>'+
    (state.error?'<p role="alert" class="onbError">'+safe(state.error)+'</p>':state.loading?'<p role="status">Loading live employee records…</p>':'<p role="status">Live employees loaded: '+state.records.length+' · Matching: '+rows.length+'</p>')+
    '<div class="metrics">'+[["Employees",rows.length],["Not started",notStarted],["In progress",started],["Completed",completed],["Unknown status",unknown],["Average known progress",avg]].map(([label,value])=>'<div class="metric"><strong>'+safe(value)+'</strong>'+safe(label)+'</div>').join("")+'</div>'+
    '<div class="scroll"><table><thead><tr><th>Employee</th><th>Department</th><th>Hire date</th><th>Onboarding start</th><th>First login</th><th>Progress</th><th>Status</th><th>Last activity</th></tr></thead><tbody>'+
    (rows.length?rows.map(r=>'<tr><td><b>'+safe(r.name||"Unnamed")+'</b><div class="small muted">'+safe(r.employeeId)+'</div><div class="small muted">'+safe(r.email)+'</div></td><td>'+safe(r.department||"Not recorded")+'</td><td>'+safe(textDate(r.hireDate))+'</td><td>'+safe(textDate(r.onboardingStartDate))+'</td><td>'+safe(textDate(r.firstLoginAt))+'</td><td>'+safe(r.progress===null?"Not recorded":r.progress+"%")+'</td><td>'+safe(statusFor(r).replace("_"," "))+'</td><td>'+safe(textDate(r.lastActivityAt))+'</td></tr>').join(""):'<tr><td colspan="8" class="empty">No employees match this filter, or onboarding start dates have not yet been recorded.</td></tr>')+'</tbody></table></div>'+
    '<p class="muted small">Progress percentages and statuses come from employee documents; this dashboard does not invent completion events or write employee records. Unknown progress is excluded from the average. Live updates reflect changes in the employees collection.</p>';
  $("onbDateType").onchange=e=>{state.dateField=e.target.value;render();};
  $("onbYear").onchange=e=>{state.year=Number(e.target.value);render();};
  $("onbDept").onchange=e=>{state.department=e.target.value;render();};
  $("onbStatus").onchange=e=>{state.status=e.target.value;render();};
  $("onbSearch").oninput=e=>{const p=e.target.selectionStart;state.search=e.target.value;render();$("onbSearch").focus();$("onbSearch").setSelectionRange(p,p);};
  root.querySelectorAll("[data-onb-month]").forEach(el=>el.onchange=e=>{const n=Number(e.target.dataset.onbMonth);e.target.checked?selected.add(n):selected.delete(n);render();});
  $("onbCsv").onclick=()=>exportCSV(rows);
}
export function initializeOnboardingCohorts(auth,db) {
  if(!$("onboardingCohortRoot"))return;
  state.authorized=true;
  if(stop)stop();
  state.loading=true;state.error="";render();
  stop=onSnapshot(collection(db,"employees"),snap=>{
    if(!auth.currentUser){stop?.();stop=null;return;}
    state.records=snap.docs.map(normalize);state.loading=false;state.error="";render();
  },err=>{
    state.error="Unable to read employees: "+String(err.code||err.message)+". Check Firestore admin rules.";state.loading=false;render();
  });
  auth.onAuthStateChanged(user=>{
    if(!user && stop){stop();stop=null;state.records=[];state.loading=false;state.error="Session ended. Sign in as Admin.";render();}
  });
}
