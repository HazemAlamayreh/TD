
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {getAuth,onAuthStateChanged,sendSignInLinkToEmail,isSignInWithEmailLink,signInWithEmailLink,signOut} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getFirestore,doc,setDoc,getDoc,getDocs,collection,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {initializeAdminDashboard} from "./admin-dashboard.js";
const config={apiKey:"AIzaSyBxuLsolggWnoGuTASnnWvz7OwvRdnIxZE",authDomain:"atd-master-talent-development.firebaseapp.com",projectId:"atd-master-talent-development",storageBucket:"atd-master-talent-development.firebasestorage.app",messagingSenderId:"882331359053",appId:"1:882331359053:web:a51c003529af5ae9c90904",measurementId:"G-4FEGLTW1L7"};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),h=window.ATDHost;
const layer=document.createElement("div");document.body.append(layer);
initializeAdminDashboard(auth,db);
const style=document.createElement("style");
style.textContent="#atdCloudButton{position:fixed;bottom:15px;right:16px;z-index:999;background:#123f73;color:white;border:none;border-radius:30px;padding:12px 18px;cursor:pointer}#atdCloudModal{position:fixed;inset:0;background:#15243a99;z-index:1001;display:grid;place-items:center;padding:15px}#atdCloudModal section{max-width:440px;width:100%;padding:24px;border-radius:16px;background:white;color:#12223a;box-shadow:0 12px 30px #0003}#atdCloudModal input{display:block;width:100%;box-sizing:border-box;border:1px solid #bac6d6;border-radius:7px;padding:12px;margin:9px 0}#atdCloudModal button{cursor:pointer;padding:10px 14px;border-radius:7px;border:1px solid #c4cfde;margin:4px}#atdCloudModal .primary{background:#123f73;color:white}";
document.head.append(style);
let user=null,profile=null,opened=false,notice="",busy=false;
const EMAIL_KEY="atdEmailForLink";
let pendingSignInLink=null;
function resolveSignInLink(){
 const candidates=[location.href];
 try{
  const u=new URL(location.href);
  for(const p of ["link","deep_link_id","continueUrl","continue_url"]){const value=u.searchParams.get(p);if(value)candidates.push(value);}
  if(u.hash.includes("oobCode"))candidates.push(location.origin+location.pathname+"?"+u.hash.replace(/^#/,""));
 }catch(e){}
 return candidates.find(x=>{try{return isSignInWithEmailLink(auth,x)}catch{return false}})||null;
}
async function finishEmailSignIn(email){
 if(!pendingSignInLink)return;
 notice=locale("Verifying sign-in link…","جاري التحقق من رابط الدخول…");draw();
 try{
  await signInWithEmailLink(auth,email.trim(),pendingSignInLink);
  localStorage.removeItem(EMAIL_KEY);sessionStorage.removeItem(EMAIL_KEY);
  pendingSignInLink=null;notice="";
  history.replaceState({},document.title,location.origin+location.pathname);
 }catch(e){
  const invalid=["auth/invalid-action-code","auth/expired-action-code"].includes(e.code);
  if(invalid){
   pendingSignInLink=null;
   history.replaceState({},document.title,location.origin+location.pathname);
   notice=locale("This sign-in link is expired or already used. Request one new link and open only the newest email.","رابط الدخول منتهي الصلاحية أو مستخدم سابقاً. اطلب رابطاً جديداً وافتح أحدث رسالة فقط.");
  }else{notice=locale("Unable to finish sign-in: ","تعذّر إكمال الدخول: ")+String(e.code||e.message);}
  opened=true;draw();
 }
}

const locale=(en,ar)=>h.getState().lang==="ar"?ar:en;
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function draw(){
 layer.innerHTML='<button id="atdCloudButton">☁ '+(user?esc(profile?.name||user.email):locale("Sign in / Sync","الدخول / المزامنة"))+'</button>';
 layer.querySelector("#atdCloudButton").onclick=()=>{opened=true;draw();};
 if(!opened)return;
 layer.insertAdjacentHTML("beforeend",'<div id="atdCloudModal"><section dir="'+(h.getState().lang==="ar"?"rtl":"ltr")+'"><button id="atdCloudClose" style="float:right">×</button><h2>'+locale("Academy Account","حساب الأكاديمية")+'</h2>'+
 (user?'<p>'+esc(user.email)+'</p><label>'+locale("Name","الاسم")+'</label><input id="atdName" value="'+esc(profile?.name)+'"><label>'+locale("Phone (optional)","رقم الهاتف (اختياري)")+'</label><input id="atdPhone" value="'+esc(profile?.phone)+'"><button class="primary" id="atdProfile">'+locale("Save profile","حفظ الملف")+'</button><button id="atdImport">'+locale("Merge local progress into my account","دمج التقدم المحلي مع حسابي")+'</button><button id="atdLogout">'+locale("Sign out","تسجيل الخروج")+'</button>':
 (pendingSignInLink?
 '<p>'+locale("Your sign-in link was opened. Confirm the email used to request it to finish signing in; you do not need another link.","تم فتح رابط الدخول. أكد البريد الإلكتروني الذي طلبت الرابط عليه لإكمال الدخول، ولا تحتاج إلى رابط جديد.")+'</p><form id="atdConfirmForm"><input id="atdConfirmEmail" type="email" required autocomplete="email" value="'+esc(localStorage.getItem(EMAIL_KEY)||"")+'" placeholder="name@example.com"><button class="primary" type="submit">'+locale("Complete sign-in","إكمال تسجيل الدخول")+'</button></form>':
 '<p>'+locale("Receive a login link by email; no password needed.","استلم رابط دخول عبر الإيميل، دون كلمة مرور.")+'</p><form id="atdEmailForm"><input id="atdEmail" type="email" required autocomplete="email" placeholder="name@example.com"><button class="primary" type="submit">'+locale("Send magic link","إرسال رابط الدخول")+'</button></form>'))+
 '<p style="font-size:13px;line-height:1.6">'+esc(notice)+'</p></section></div>');
 layer.querySelector("#atdCloudClose").onclick=()=>{if(user){opened=false;draw();}};
 if(!user)layer.querySelector("#atdCloudClose").style.display="none";
 if(!user){
  if(pendingSignInLink){
   layer.querySelector("#atdConfirmForm").onsubmit=e=>{e.preventDefault();finishEmailSignIn(layer.querySelector("#atdConfirmEmail").value);};
  }else{
   layer.querySelector("#atdEmailForm").onsubmit=async e=>{
    e.preventDefault();const email=layer.querySelector("#atdEmail").value.trim();
    try{
     localStorage.setItem(EMAIL_KEY,email);
     await sendSignInLinkToEmail(auth,email,{url:location.origin+location.pathname,handleCodeInApp:true});
     notice=locale("Check your inbox for your sign-in link. Open the link on this browser when possible.","تحقق من بريدك لفتح رابط الدخول، ويفضل استخدام المتصفح نفسه.");
    }catch(err){notice=String(err.code||err.message);}draw();
   };
  }
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
   localStorage.setItem(importKey(),"yes");await upload(true,h.guestState());await pull();draw();
  };
 }
}
const safe=s=>String(s).replace(/[^a-zA-Z0-9_.-]/g,"_");
function localRecords(s=h.getState()){
 const out=[];
 for(const [id,completed] of Object.entries(s.done||{}))if(completed)out.push(["lessonProgress",safe(id),{lessonId:id,completed:true,completedAt:s.lessonVisits?.[id]||Date.now()}]);
 for(const [id,mastered] of Object.entries(s.mastered||{}))if(mastered)out.push(["lessonMastery",safe(id),{lessonId:id,mastered:true}]);
 for(const [k,a] of Object.entries(s.attempts||{}))if(a?.ts)out.push(["assessmentAttempts",safe(k+"_"+a.ts),{assessmentKey:k,...a}]);
 for(const a of s.attemptHistory||[])if(a?.ts&&a.capability&&a.stage){const k=a.capability+":"+a.stage;out.push(["assessmentAttempts",safe(k+"_"+a.ts),{assessmentKey:k,...a}]);}
 return out;
}
let known=new Set(),timer=0,ready=false;
const importKey=()=>user?"atdCloudImportApproved:"+user.uid:"";
const approved=()=>!!user&&localStorage.getItem(importKey())==="yes";
async function upload(manual=false,source=null){
 if(!user||!ready||busy||!approved())return;
 busy=true;let count=0;
 try{
  for(const [sub,id,data] of localRecords(source||h.getState())){
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
 h.useAccount(user?.uid||null);
 if(user){
  try{const p=await getDoc(doc(db,"learners",user.uid));profile=p.exists()?p.data():null;await pull();ready=true;notice=approved()?locale("Signed in. Cloud sync enabled.","تم الدخول والمزامنة مفعّلة.") :locale("Signed in. Select Merge local progress once to enable cloud sync.","تم الدخول. اختر دمج التقدم المحلي مرة واحدة لتفعيل المزامنة.");}
  catch(err){notice=locale("Enable Firestore and its security rules first: ","فعّل Firestore وقواعد الأمان أولاً: ")+String(err.code||err.message);}
 }else opened=true;
 draw();
});
(async()=>{
 pendingSignInLink=resolveSignInLink();
 if(!pendingSignInLink)return;
 opened=true;
 const email=localStorage.getItem(EMAIL_KEY)||sessionStorage.getItem(EMAIL_KEY);
 if(email){await finishEmailSignIn(email);}else{
  notice=locale("Enter the email you used for this link once to complete sign-in.","أدخل البريد المستخدم لهذا الرابط مرة واحدة لإكمال الدخول.");
  draw();
 }
})();
const previousRender=window.render;
window.render=function(...args){const v=previousRender(...args);if(user&&ready&&approved()){clearTimeout(timer);timer=setTimeout(()=>upload(),1000);}return v;};
draw();
