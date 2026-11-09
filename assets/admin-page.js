import {initializeApp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getFirestore,doc,getDoc,getDocs,collection} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
const app=initializeApp({apiKey:"AIzaSyBxuLsolggWnoGuTASnnWvz7OwvRdnIxZE",authDomain:"atd-master-talent-development.firebaseapp.com",projectId:"atd-master-talent-development",appId:"1:882331359053:web:a51c003529af5ae9c90904"});
const auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stamp=v=>typeof v==="string"?v:(v?.toDate?.()?.toLocaleString?.()||"—");
const percent=v=>typeof v==="number"&&Number.isFinite(v)?Math.round(v*100)+"%":"—";
let current=null,learners=[],query="",loadVersion=0,loading=false;
function showAccess(message,details=""){
 $("dashboard").classList.add("hidden");$("access").classList.remove("hidden");
 $("access").innerHTML="<h2>"+escapeHTML(message)+"</h2><p>"+escapeHTML(details)+"</p><p><a href='./'>Go to Academy sign-in</a></p>";
}
function setStatus(message,err=false){$("status").textContent=message;$("status").classList.toggle("error",err);}
function renderMetrics(){
 const sum=learners.reduce((s,x)=>({complete:s.complete+x.completed,mastered:s.mastered+x.mastered,attempts:s.attempts+x.attempts.length}),{complete:0,mastered:0,attempts:0});
 const data=[["Synced learner profiles",learners.length],["Completed lessons",sum.complete],["Mastered lessons",sum.mastered],["Recorded attempts",sum.attempts]];
 $("metrics").innerHTML=data.map(([k,v])=>'<div class="metric"><strong>'+v+'</strong>'+escapeHTML(k)+'</div>').join("");
}
function filtered(){return learners.filter(x=>(x.name+" "+x.email+" "+x.uid).toLowerCase().includes(query.toLowerCase()));}
function renderList(){
 const a=filtered();
 $("learnerRows").innerHTML=a.length?a.map(x=>'<tr><td><b>'+escapeHTML(x.name||"Unnamed learner")+'</b><div class="small muted">'+escapeHTML(x.email||"Email not saved")+'</div><div class="small muted">'+escapeHTML(x.uid)+'</div></td><td>'+x.completed+'</td><td>'+x.mastered+'</td><td>'+x.attempts.length+'</td><td>'+escapeHTML(x.average)+'</td><td><button data-learner="'+escapeHTML(x.uid)+'">View</button></td></tr>').join(""):'<tr><td colspan="6" class="empty">No matching synced learners.</td></tr>';
 $("learnerRows").querySelectorAll("[data-learner]").forEach(b=>b.onclick=()=>showDetails(b.dataset.learner));
}
function showDetails(uid){
 const x=learners.find(p=>p.uid===uid);if(!x)return;
 $("details").classList.remove("hidden");$("detailTitle").textContent=x.name||x.email||"Learner";
 const attempts=x.attempts.slice().sort((a,b)=>String(b.ts||"").localeCompare(String(a.ts||"")));
 const review=attempts.map(a=>{
  const answered=Array.isArray(a.answers)?a.answers.filter(n=>n!==null&&n!==undefined).length:null;
  return '<tr><td>'+escapeHTML(a.assessmentKey||"—")+'</td><td>'+escapeHTML(stamp(a.ts))+'</td><td>'+escapeHTML(percent(a.score))+'</td><td>'+(answered===null?"—":answered)+'</td></tr>';
 }).join("");
 $("detailContent").innerHTML='<p><b>Email:</b> '+escapeHTML(x.email||"—")+' &nbsp; <b>Phone:</b> '+escapeHTML(x.phone||"—")+'</p><p><b>UID:</b> '+escapeHTML(x.uid)+'</p><p><b>Completed lessons:</b> '+x.completed+' · <b>Mastered lessons:</b> '+x.mastered+'</p><h3>Assessment history</h3><div class="scroll"><table><thead><tr><th>Assessment</th><th>Submitted at</th><th>Score</th><th>Questions answered</th></tr></thead><tbody>'+ (review||'<tr><td colspan="4">No assessment attempts synced.</td></tr>') +'</tbody></table></div><p class="muted small">Detailed question-by-question correctness is stored in assessment records when supplied, but is not exposed in this summary.</p>';
 $("details").scrollIntoView({behavior:"smooth",block:"start"});
}
async function load(){
 if(!current||loading)return;
 loading=true;const version=++loadVersion;setStatus("Reading synchronized learner records…");
 $("reload").disabled=true;$("export").disabled=true;
 try{
  const docs=await getDocs(collection(db,"learners"));const result=[];
  for(const p of docs.docs){
   if(version!==loadVersion||auth.currentUser?.uid!==current.uid)return;
   const uid=p.id,x=p.data();
   const [lessons,mastery,assessments]=await Promise.all(["lessonProgress","lessonMastery","assessmentAttempts"].map(k=>getDocs(collection(db,"learners",uid,k))));
   const attempts=assessments.docs.map(d=>d.data());
   const scores=attempts.map(a=>a.score).filter(s=>typeof s==="number"&&Number.isFinite(s));
   result.push({uid,name:x.name||"",email:x.email||"",phone:x.phone||"",completed:lessons.docs.filter(a=>a.data().completed===true).length,mastered:mastery.docs.filter(a=>a.data().mastered===true).length,attempts,average:scores.length?percent(scores.reduce((sum,s)=>sum+s,0)/scores.length):"—"});
  }
  if(version!==loadVersion)return;
  learners=result.sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email));
  renderMetrics();renderList();setStatus("Loaded "+learners.length+" synced learner profiles.");
 }catch(e){setStatus("Could not load learner data: "+String(e.code||e.message)+". Check that the latest security rules are published.",true);}
 finally{loading=false;$("reload").disabled=false;$("export").disabled=false;}
}
function csvCell(v){return '"'+String(v??"").replace(/"/g,'""')+'"';}
function exportCSV(){
 const header=["Name","Email","Phone","UID","Completed lessons","Mastered lessons","Assessment attempts","Average assessment result"];
 const lines=[header,...filtered().map(x=>[x.name,x.email,x.phone,x.uid,x.completed,x.mastered,x.attempts.length,x.average])].map(row=>row.map(csvCell).join(","));
 const blob=new Blob(["\uFEFF"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="ATD-learner-report-"+new Date().toISOString().slice(0,10)+".csv";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
$("search").oninput=e=>{query=e.target.value;renderList();};
$("reload").onclick=()=>load();
$("export").onclick=()=>exportCSV();
$("closeDetails").onclick=()=>$("details").classList.add("hidden");
onAuthStateChanged(auth,async user=>{
 ++loadVersion;current=user;learners=[];$("details").classList.add("hidden");
 if(!user){showAccess("Administrator sign-in required","Sign in through ATD Academy, then return to this page.");return;}
 try{
  const role=await getDoc(doc(db,"admins",user.uid));
  if(auth.currentUser?.uid!==user.uid)return;
  if(!role.exists()||role.data().active!==true){showAccess("Administrator access not enabled","Your account is signed in, but it does not have an active admins/{uid} record in Cloud Firestore.");return;}
  $("access").classList.add("hidden");$("dashboard").classList.remove("hidden");load();
 }catch(e){showAccess("Unable to verify administrator access",String(e.code||e.message));}
});
