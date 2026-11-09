
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {getAuth,onAuthStateChanged,sendSignInLinkToEmail,isSignInWithEmailLink,signInWithEmailLink,signOut} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getFirestore,doc,setDoc,getDoc,getDocs,collection,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
const config={apiKey:"AIzaSyBxuLsolggWnoGuTASnnWvz7OwvRdnIxZE",authDomain:"atd-master-talent-development.firebaseapp.com",projectId:"atd-master-talent-development",storageBucket:"atd-master-talent-development.firebasestorage.app",messagingSenderId:"882331359053",appId:"1:882331359053:web:a51c003529af5ae9c90904",measurementId:"G-4FEGLTW1L7"};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),h=window.ATDHost;
const layer=document.createElement("div");document.body.append(layer);
const style=document.createElement("style");
style.textContent="#atdCloudButton{position:fixed;bottom:15px;right:16px;z-index:999;background:#123f73;color:white;border:none;border-radius:30px;padding:12px 18px;cursor:pointer}#atdCloudModal{position:fixed;inset:0;background:#15243a99;z-index:1001;display:grid;place-items:center;padding:15px}#atdCloudModal section{max-width:440px;width:100%;padding:24px;border-radius:16px;background:white;color:#12223a;box-shadow:0 12px 30px #0003}#atdCloudModal input{display:block;width:100%;box-sizing:border-box;border:1px solid #bac6d6;border-radius:7px;padding:12px;margin:9px 0}#atdCloudModal button{cursor:pointer;padding:10px 14px;border-radius:7px;border:1px solid #c4cfde;margin:4px}#atdCloudModal .primary{background:#123f73;color:white}";
document.head.append(style);
let user=null,profile=null,opened=false,notice="",busy=false;
const locale=(en,ar)=>h.getState().lang==="ar"?ar:en;
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function draw(){
 layer.innerHTML='<button id="atdCloudButton">☁ '+(user?esc(profile?.name||user.email):locale("Sign in / Sync","الدخول / المزامنة"))+'</button>';
 layer.querySelector("#atdCloudButton").onclick=()=>{opened=true;draw();};
 if(!opened)return;
 layer.insertAdjacentHTML("beforeend",'<div id="atdCloudModal"><section dir="'+(h.getState().lang==="ar"?"rtl":"ltr")+'"><button id="atdCloudClose" style="float:right">×</button><h2>'+locale("Academy Account","حساب الأكاديمية")+'</h2>'+
 (user?'<p>'+esc(user.email)+'</p><label>'+locale("Name","الاسم")+'</label><input id="atdName" value="'+esc(profile?.name)+'"><label>'+locale("Phone (optional)","رقم الهاتف (اختياري)")+'</label><input id="atdPhone" value="'+esc(profile?.phone)+'"><button class="primary" id="atdProfile">'+locale("Save profile","حفظ الملف")+'</button><button id="atdImport">'+locale("Merge local progress into my account","دمج التقدم المحلي مع حسابي")+'</button><button id="atdLogout">'+locale("Sign out","تسجيل الخروج")+'</button>':
 '<p>'+locale("Receive a login link by email; no password needed.","استلم رابط دخول عبر الإيميل، دون كلمة مرور.")+'</p><form id="atdEmailForm"><input id="atdEmail" type="email" required placeholder="name@example.com"><button class="primary" type="submit">'+locale("Send magic link","إرسال رابط الدخول")+'</button></form>')+
 '<p style="font-size:13px;line-height:1.6">'+esc(notice)+'</p></section></div>');
 layer.querySelector("#atdCloudClose").onclick=()=>{opened=false;draw();};
 if(!user){
  layer.querySelector("#atdEmailForm").onsubmit=async e=>{
   e.preventDefault();const email=layer.querySelector("#atdEmail").value.trim();
   try{sessionStorage.setItem("atdEmailForLink",email);await sendSignInLinkToEmail(auth,email,{url:location.origin+location.pathname,handleCodeInApp:true});notice=locale("Check your inbox for your sign-in link.","راجع بريدك الإلكتروني للحصول على رابط الدخول.");}catch(err){notice=String(err.code||err.message);}draw();
  };
 }else{
  layer.querySelector("#atdLogout").onclick=()=>signOut(auth);
  layer.querySelector("#atdProfile").onclick=async()=>{
   try{profile={name:layer.querySelector("#atdName").value.trim(),phone:layer.querySelector("#atdPhone").value.trim()};
   if(!profile.name)throw Error("Name required");
   await setDoc(doc(db,"learners",user.uid),{...profile,email:user.email,updatedAt:serverTimestamp()},{merge:true});notice=locale("Profile saved.","تم حفظ الملف.");}
   catch(err){notice=String(err.code||err.message);}draw();
  };
  layer.querySelector("#atdImport").onclick=async()=>{
   if(!confirm(locale("Merge this browser's progress with your account? Existing cloud records will remain intact.","هل تريد دمج التقدم من المتصفح بحسابك؟ لن تُحذف السجلات السابقة.")))return;
   sessionStorage.setItem(importKey(),"yes");await upload(true);draw();
  };
 }
}
const safe=s=>String(s).replace(/[^a-zA-Z0-9_.-]/g,"_");
function localRecords(){
 const s=h.getState(),out=[];
 for(const [id,completed] of Object.entries(s.done||{}))if(completed)out.push(["lessonProgress",safe(id),{lessonId:id,completed:true,completedAt:s.lessonVisits?.[id]||Date.now()}]);
 for(const [id,mastered] of Object.entries(s.mastered||{}))if(mastered)out.push(["lessonMastery",safe(id),{lessonId:id,mastered:true}]);
 for(const [k,a] of Object.entries(s.attempts||{}))if(a?.ts)out.push(["assessmentAttempts",safe(k+"_"+a.ts),{assessmentKey:k,...a}]);
 for(const a of s.attemptHistory||[])if(a?.ts&&a.capability&&a.stage){const k=a.capability+":"+a.stage;out.push(["assessmentAttempts",safe(k+"_"+a.ts),{assessmentKey:k,...a}]);}
 return out;
}
let known=new Set(),timer=0,ready=false;
const importKey=()=>user?"atdCloudImportApproved:"+user.uid:"";
const approved=()=>!!user&&sessionStorage.getItem(importKey())==="yes";
async function upload(manual=false){
 if(!user||!ready||busy||!approved())return;
 busy=true;let count=0;
 try{
  for(const [sub,id,data] of localRecords()){
   const key=sub+"/"+id;if(known.has(key))continue;
   const ref=doc(db,"learners",user.uid,sub,id);
   if(manual&&(await getDoc(ref)).exists()){known.add(key);continue;}
   await setDoc(ref,{...data,updatedAt:serverTimestamp()},{merge:true});known.add(key);count++;
  }
  notice=locale("Synced records: ","تمت مزامنة السجلات: ")+count;
 }catch(e){notice=locale("Cloud sync unavailable: ","المزامنة غير متاحة: ")+String(e.code||e.message);}
 finally{busy=false;if(opened)draw();}
}
async function pull(){
 const s=h.getState();let changed=false;
 for(const sub of ["lessonProgress","lessonMastery","assessmentAttempts"]){
  const snap=await getDocs(collection(db,"learners",user.uid,sub));
  for(const item of snap.docs){
   known.add(sub+"/"+item.id);const a=item.data();
   if(sub==="lessonProgress"&&a.completed&&!s.done[a.lessonId]){s.done[a.lessonId]=true;changed=true;}
   if(sub==="lessonMastery"&&a.mastered&&!s.mastered[a.lessonId]){s.mastered[a.lessonId]=true;changed=true;}
   if(sub==="assessmentAttempts"&&a.assessmentKey){
    const old=s.attempts[a.assessmentKey];
    if(!old||String(a.ts||"")>String(old.ts||"")){
     const {updatedAt,assessmentKey,...attempt}=a;s.attempts[a.assessmentKey]=attempt;changed=true;
    }
   }
  }
 }
 if(changed){h.save();h.render();}
}
onAuthStateChanged(auth,async next=>{
 user=next;ready=false;profile=null;known.clear();notice="";
 if(user){
  try{const p=await getDoc(doc(db,"learners",user.uid));profile=p.exists()?p.data():null;await pull();ready=true;notice=locale("Signed in. Choose Merge local progress to start synchronizing this browser.","تم الدخول. اختر دمج التقدم المحلي لبدء المزامنة من هذا المتصفح.");}
  catch(err){notice=locale("Enable Firestore and its security rules first: ","فعّل Firestore وقواعد الأمان أولاً: ")+String(err.code||err.message);}
 }else opened=false;
 draw();
});
(async()=>{
 if(!isSignInWithEmailLink(auth,location.href))return;
 opened=true;
 const email=sessionStorage.getItem("atdEmailForLink")||prompt("Confirm email used for this sign-in link:");
 if(!email)return;
 try{await signInWithEmailLink(auth,email,location.href);sessionStorage.removeItem("atdEmailForLink");history.replaceState({},document.title,location.origin+location.pathname);}
 catch(err){notice=String(err.code||err.message);draw();}
})();
const previousRender=window.render;
window.render=function(...args){const v=previousRender(...args);if(user&&ready&&approved()){clearTimeout(timer);timer=setTimeout(()=>upload(),1000);}return v;};
draw();
