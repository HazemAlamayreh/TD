import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getDoc,getDocs,doc,collection,query,orderBy,limit,startAfter} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
export function initializeAdminDashboard(auth,db){
 const root=document.createElement("div");document.body.appendChild(root);
 const style=document.createElement("style");
 style.textContent="#atdAdminLaunch{position:fixed;bottom:70px;right:16px;z-index:998;background:#163e70;color:white;border:0;border-radius:24px;padding:12px 16px;cursor:pointer}#atdAdminOverlay{position:fixed;inset:0;background:#10243bbb;z-index:1200;overflow:auto;padding:24px}#atdAdminPanel{background:white;color:#12263c;max-width:1100px;margin:auto;padding:24px;border-radius:14px;font:14px/1.5 system-ui,sans-serif}#atdAdminPanel table{width:100%;border-collapse:collapse}#atdAdminPanel th,#atdAdminPanel td{text-align:left;padding:9px;border-bottom:1px solid #dde6f0}#atdAdminPanel button,#atdAdminPanel input{padding:9px;border-radius:7px;border:1px solid #b9c9db}#atdAdminPanel input{width:100%;box-sizing:border-box;margin:12px 0}#atdAdminPanel .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:16px 0}#atdAdminPanel .metric{background:#f2f6fa;border-radius:10px;padding:15px}#atdAdminPanel .metric b{display:block;font-size:24px}#atdAdminPanel .scroll{overflow-x:auto}#atdAdminPanel .muted{color:#667b91;font-size:12px}";
 document.head.append(style);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let admin=false,open=false,rows=[],loaded=false,loading=false,error="",filter="",detailUid=null,detailRows=[],detailLast=null,detailLoading=false;
 const e=s=>root.querySelector(s);
 const metric=(name,value)=>'<div class="metric"><b>'+esc(value)+'</b>'+esc(name)+'</div>';
 function shell(){
  root.innerHTML=admin?'<button id="atdAdminLaunch">Admin Dashboard</button>':"";
  if(admin)e("#atdAdminLaunch").onclick=()=>{window.location.assign("./admin.html");};
 }
 function paint(){
  shell();if(!admin||!open)return;
  const selected=rows.filter(x=>(x.name+" "+x.email+" "+x.uid).toLowerCase().includes(filter.toLowerCase()));
  const sums=rows.reduce((r,a)=>({completed:r.completed+a.completed,mastered:r.mastered+a.mastered,attempts:r.attempts+a.attempts}),{completed:0,mastered:0,attempts:0});
  root.insertAdjacentHTML("beforeend",'<div id="atdAdminOverlay"><div id="atdAdminPanel"><button id="atdAdminClose" style="float:right">Close ×</button><h1>ATD Academy · Admin Dashboard</h1><p class="muted">Read-only learner reporting from Cloud Firestore</p><div class="metrics">'+metric("Synced learner profiles",rows.length)+metric("Completed lessons",sums.completed)+metric("Mastered lessons",sums.mastered)+metric("Assessment attempts",sums.attempts)+'</div><input id="atdAdminSearch" aria-label="Search" placeholder="Search by name or email" value="'+esc(filter)+'"><button id="atdAdminRefresh">Refresh data</button>'+(loading?'<p>Loading…</p>':error?'<p role="alert">'+esc(error)+'</p>':'')+'<div class="scroll"><table><thead><tr><th>Learner</th><th>Completed</th><th>Mastered</th><th>Attempts</th><th>Average score</th><th></th></tr></thead><tbody>'+selected.map(a=>'<tr><td><b>'+esc(a.name||"—")+'</b><div class="muted">'+esc(a.email||"—")+'</div></td><td>'+a.completed+'</td><td>'+a.mastered+'</td><td>'+a.attempts+'</td><td>'+esc(a.average)+'</td><td><button class="atdLearnerDetail" data-uid="'+esc(a.uid)+'">Details</button></td></tr>').join("")+'</tbody></table></div><div id="atdAdminDetail"></div><p class="muted">Only profiles saved to Firestore are shown. Missing synced progress must not be interpreted as zero learning.</p></div></div>');
  e("#atdAdminClose").onclick=()=>{open=false;shell();};
  e("#atdAdminRefresh").onclick=()=>load();
  e("#atdAdminSearch").oninput=ev=>{filter=ev.target.value;const cursor=ev.target.selectionStart;paint();e("#atdAdminSearch").focus();e("#atdAdminSearch").setSelectionRange(cursor,cursor);};
  root.querySelectorAll(".atdLearnerDetail").forEach(b=>b.onclick=()=>detail(b.dataset.uid));
 }
 async function detail(uid,more=false){
  const a=rows.find(x=>x.uid===uid);if(!a||detailLoading)return;
  if(!more||detailUid!==uid){detailUid=uid;detailRows=[];detailLast=null;}
  detailLoading=true;
  const host=e("#atdAdminDetail");
  if(host&&!more)host.innerHTML='<hr><h2>'+esc(a.name||a.email)+'</h2><p>Email: '+esc(a.email||"—")+' · Phone: '+esc(a.phone||"—")+'</p><p class="muted">UID: '+esc(uid)+'</p><p>Loading recent assessment history…</p>';
  try{
   const col=collection(db,"learners",uid,"assessmentAttempts");
   const q=detailLast?query(col,orderBy("ts","desc"),startAfter(detailLast),limit(20)):query(col,orderBy("ts","desc"),limit(20));
   const snap=await getDocs(q);
   if(detailUid!==uid)return;
   detailRows.push(...snap.docs.map(d=>d.data()));
   if(snap.docs.length)detailLast=snap.docs[snap.docs.length-1];
   const table=detailRows.map(t=>'<tr><td>'+esc(t.assessmentKey||t.stage||"—")+'</td><td>'+esc(t.ts||"—")+'</td><td>'+esc(typeof t.score==="number"?Math.round(t.score*100)+"%":"—")+'</td></tr>').join("");
   host.innerHTML='<hr><h2>'+esc(a.name||a.email)+'</h2><p>Email: '+esc(a.email||"—")+' · Phone: '+esc(a.phone||"—")+'</p><p class="muted">UID: '+esc(uid)+'</p><h3>Assessment history</h3><p class="muted">Loaded on demand · '+detailRows.length+' record(s)</p><div class="scroll"><table><tr><th>Assessment</th><th>Date</th><th>Score</th></tr>'+table+'</table></div>'+(snap.docs.length===20?'<button id="atdLoadMoreHistory">Load 20 more</button>':'<p class="muted">No more records.</p>');
   if(e("#atdLoadMoreHistory"))e("#atdLoadMoreHistory").onclick=()=>detail(uid,true);
  }catch(err){
   if(host)host.innerHTML='<hr><p role="alert">Unable to load assessment history: '+esc(err.code||err.message)+'</p>';
  }finally{detailLoading=false;}
 }
 async function load(){
  if(loading)return;loading=true;error="";paint();
  try{
   const profiles=await getDocs(collection(db,"learners")),data=[],docs=profiles.docs;
   for(let i=0;i<docs.length;i+=10){
    const batch=docs.slice(i,i+10);
    const summaries=await Promise.all(batch.map(p=>getDoc(doc(db,"learners",p.id,"sync","current")).catch(()=>null)));
    batch.forEach((p,j)=>{
     const x=p.data(),snap=summaries[j],summary=snap?.exists()?snap.data():{},modules=Object.values(summary.compactModules||{});
     let completed,mastered,attemptCount,average="—";
     if(modules.length){
      completed=modules.reduce((n,m)=>n+Number(m.reviewed||0),0);
      mastered=modules.filter(m=>m.status==="mastered"||m.status==="completed").length;
      attemptCount=modules.reduce((n,m)=>n+(m.diagnostic?1:0)+(m.masteryCheck?1:0)+(m.advanced?1:0),0);
     }else{
      completed=Object.values(summary.compactDone||{}).filter(Boolean).length;
      mastered=Object.values(summary.compactMastered||{}).filter(Boolean).length;
      const attempts=Object.values(summary.compactAttempts||{});
      const scores=attempts.map(t=>t?.score).filter(v=>typeof v==="number"&&Number.isFinite(v));
      attemptCount=attempts.length;average=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*100)+"%":"—";
     }
     data.push({uid:p.id,name:x.name||"",email:x.email||"",phone:x.phone||"",completed,mastered,attempts:attemptCount,average});
    });
    await new Promise(resolve=>setTimeout(resolve,0));
   }
   rows=data;loaded=true;
  }catch(err){error="Unable to load reports: "+String(err.code||err.message)+". Check published Firestore rules and admin role.";}
  finally{loading=false;paint();}
 }
 let checkedUid=null,checking=false;
 async function checkAdminAccess(){
  const user=auth.currentUser;
  if(!user){checkedUid=null;admin=false;shell();return;}
  if(checking)return;
  checking=true;
  try{
   const role=await getDoc(doc(db,"admins",user.uid));
   if(auth.currentUser?.uid!==user.uid)return;
   checkedUid=user.uid;
   admin=role.exists()&&role.data().active===true;
  }catch(err){
   if(auth.currentUser?.uid===user.uid){admin=false;console.warn("Admin verification failed",err.code||err.message);}
  }finally{checking=false;shell();}
 }
 onAuthStateChanged(auth,async user=>{
  admin=false;open=false;loaded=false;rows=[];shell();
  if(!user){checkedUid=null;return;}
  await checkAdminAccess();
 });
 // Firestore admin roles may be created while a learner's existing session
 // is open. Refresh authorization when the user returns to the academy tab.
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkAdminAccess();});
 window.addEventListener("focus",()=>checkAdminAccess());
 window.ATDRecheckAdminAccess=checkAdminAccess;
}
