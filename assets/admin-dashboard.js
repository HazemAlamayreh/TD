import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getDoc,getDocs,doc,collection} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
export function initializeAdminDashboard(auth,db){
 const root=document.createElement("div");document.body.appendChild(root);
 const style=document.createElement("style");
 style.textContent="#atdAdminLaunch{position:fixed;bottom:70px;right:16px;z-index:998;background:#163e70;color:white;border:0;border-radius:24px;padding:12px 16px;cursor:pointer}#atdAdminOverlay{position:fixed;inset:0;background:#10243bbb;z-index:1200;overflow:auto;padding:24px}#atdAdminPanel{background:white;color:#12263c;max-width:1100px;margin:auto;padding:24px;border-radius:14px;font:14px/1.5 system-ui,sans-serif}#atdAdminPanel table{width:100%;border-collapse:collapse}#atdAdminPanel th,#atdAdminPanel td{text-align:left;padding:9px;border-bottom:1px solid #dde6f0}#atdAdminPanel button,#atdAdminPanel input{padding:9px;border-radius:7px;border:1px solid #b9c9db}#atdAdminPanel input{width:100%;box-sizing:border-box;margin:12px 0}#atdAdminPanel .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:16px 0}#atdAdminPanel .metric{background:#f2f6fa;border-radius:10px;padding:15px}#atdAdminPanel .metric b{display:block;font-size:24px}#atdAdminPanel .scroll{overflow-x:auto}#atdAdminPanel .muted{color:#667b91;font-size:12px}";
 document.head.append(style);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let admin=false,open=false,rows=[],loaded=false,loading=false,error="",filter="";
 const e=s=>root.querySelector(s);
 const metric=(name,value)=>'<div class="metric"><b>'+esc(value)+'</b>'+esc(name)+'</div>';
 function shell(){
  root.innerHTML=admin?'<button id="atdAdminLaunch">Admin Dashboard</button>':"";
  if(admin)e("#atdAdminLaunch").onclick=()=>{open=true;paint();if(!loaded)load();};
 }
 function paint(){
  shell();if(!admin||!open)return;
  const selected=rows.filter(x=>(x.name+" "+x.email+" "+x.uid).toLowerCase().includes(filter.toLowerCase()));
  const sums=rows.reduce((r,a)=>({completed:r.completed+a.completed,mastered:r.mastered+a.mastered,attempts:r.attempts+a.attempts.length}),{completed:0,mastered:0,attempts:0});
  root.insertAdjacentHTML("beforeend",'<div id="atdAdminOverlay"><div id="atdAdminPanel"><button id="atdAdminClose" style="float:right">Close ×</button><h1>ATD Academy · Admin Dashboard</h1><p class="muted">Read-only learner reporting from Cloud Firestore</p><div class="metrics">'+metric("Synced learner profiles",rows.length)+metric("Completed lessons",sums.completed)+metric("Mastered lessons",sums.mastered)+metric("Assessment attempts",sums.attempts)+'</div><input id="atdAdminSearch" aria-label="Search" placeholder="Search by name or email" value="'+esc(filter)+'"><button id="atdAdminRefresh">Refresh data</button>'+(loading?'<p>Loading…</p>':error?'<p role="alert">'+esc(error)+'</p>':'')+'<div class="scroll"><table><thead><tr><th>Learner</th><th>Completed</th><th>Mastered</th><th>Attempts</th><th>Average score</th><th></th></tr></thead><tbody>'+selected.map(a=>'<tr><td><b>'+esc(a.name||"—")+'</b><div class="muted">'+esc(a.email||"—")+'</div></td><td>'+a.completed+'</td><td>'+a.mastered+'</td><td>'+a.attempts.length+'</td><td>'+esc(a.average)+'</td><td><button class="atdLearnerDetail" data-uid="'+esc(a.uid)+'">Details</button></td></tr>').join("")+'</tbody></table></div><div id="atdAdminDetail"></div><p class="muted">Only profiles saved to Firestore are shown. Missing synced progress must not be interpreted as zero learning.</p></div></div>');
  e("#atdAdminClose").onclick=()=>{open=false;shell();};
  e("#atdAdminRefresh").onclick=()=>load();
  e("#atdAdminSearch").oninput=ev=>{filter=ev.target.value;const cursor=ev.target.selectionStart;paint();e("#atdAdminSearch").focus();e("#atdAdminSearch").setSelectionRange(cursor,cursor);};
  root.querySelectorAll(".atdLearnerDetail").forEach(b=>b.onclick=()=>detail(b.dataset.uid));
 }
 function detail(uid){
  const a=rows.find(x=>x.uid===uid);if(!a)return;
  const attempts=a.attempts.slice().sort((x,y)=>String(y.ts||"").localeCompare(String(x.ts||"")));
  e("#atdAdminDetail").innerHTML='<hr><h2>'+esc(a.name||a.email)+'</h2><p>Email: '+esc(a.email||"—")+' · Phone: '+esc(a.phone||"—")+'</p><p class="muted">UID: '+esc(uid)+'</p><h3>Assessment history</h3><div class="scroll"><table><tr><th>Assessment</th><th>Date</th><th>Score</th></tr>'+attempts.map(t=>'<tr><td>'+esc(t.assessmentKey||t.stage||"—")+'</td><td>'+esc(t.ts||"—")+'</td><td>'+esc(typeof t.score==="number"?Math.round(t.score*100)+"%":"—")+'</td></tr>').join("")+'</table></div>';
 }
 async function load(){
  if(loading)return;loading=true;error="";paint();
  try{
   const profiles=await getDocs(collection(db,"learners")),data=[];
   for(const p of profiles.docs){
    const uid=p.id,x=p.data();
    const [done,mastery,attemptsSnap]=await Promise.all(["lessonProgress","lessonMastery","assessmentAttempts"].map(sub=>getDocs(collection(db,"learners",uid,sub))));
    const attempts=attemptsSnap.docs.map(d=>d.data()),scores=attempts.map(t=>t.score).filter(x=>typeof x==="number"&&Number.isFinite(x));
    data.push({uid,name:x.name||"",email:x.email||"",phone:x.phone||"",completed:done.docs.filter(d=>d.data().completed===true).length,mastered:mastery.docs.filter(d=>d.data().mastered===true).length,attempts,average:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*100)+"%":"—"});
   }
   rows=data;loaded=true;
  }catch(err){error="Unable to load reports: "+String(err.code||err.message)+". Check published Firestore rules and admin role.";}
  finally{loading=false;paint();}
 }
 onAuthStateChanged(auth,async user=>{
  admin=false;open=false;loaded=false;rows=[];shell();
  if(!user)return;
  try{const p=await getDoc(doc(db,"admins",user.uid));if(auth.currentUser?.uid!==user.uid)return;admin=p.exists()&&p.data().active===true;}catch(err){admin=false;}
  shell();
 });
}