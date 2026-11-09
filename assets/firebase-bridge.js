import {initializeApp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {getAuth,setPersistence,browserLocalPersistence,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,updatePassword,signOut} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {getFirestore,doc,getDoc,getDocs,setDoc,collection,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {initializeAdminDashboard} from "./admin-dashboard.js";
const app=initializeApp({apiKey:"AIzaSyBxuLsolggWnoGuTASnnWvz7OwvRdnIxZE",authDomain:"atd-master-talent-development.firebaseapp.com",projectId:"atd-master-talent-development",storageBucket:"atd-master-talent-development.firebasestorage.app",messagingSenderId:"882331359053",appId:"1:882331359053:web:a51c003529af5ae9c90904"});
const auth=getAuth(app),db=getFirestore(app),h=window.ATDHost,readyAuth=setPersistence(auth,browserLocalPersistence);
initializeAdminDashboard(auth,db);
const root=document.createElement("div");document.body.append(root);
const css=document.createElement("style");
css.textContent="#atdAccountButton{position:fixed;bottom:16px;right:16px;z-index:1000;border:0;border-radius:30px;padding:12px 16px;background:#143d72;color:white;cursor:pointer}#atdAccountMask{position:fixed;inset:0;background:#12233ac9;display:grid;place-items:center;z-index:1300;padding:16px}#atdAccountPanel{background:#fff;color:#152538;width:min(460px,100%);max-height:90vh;overflow:auto;border-radius:14px;padding:25px;font:14px/1.5 system-ui,sans-serif}#atdAccountPanel input{width:100%;box-sizing:border-box;padding:12px;margin:5px 0 12px;border:1px solid #c4cfdd;border-radius:6px}#atdAccountPanel button{padding:10px 14px;margin:5px 3px;border:1px solid #bbcadc;border-radius:7px;cursor:pointer;background:#f4f7fa}#atdAccountPanel button.primary{color:#fff;background:#143d72}";
document.head.append(css);
let user=null,profile=null,opened=false,mode="login",notice="",initialized=false,busy=false,syncTimer=null,syncing=false,known=new Set();
const tr=(en,ar)=>h.getState().lang==="ar"?ar:en;
const esc=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
function ui(){
 root.innerHTML='<button id="atdAccountButton">'+esc(user?(profile?.name||user.email):tr("My account","حسابي"))+'</button>';
 root.querySelector("#atdAccountButton").onclick=()=>{opened=true;ui();};
 if(!opened)return;
 let body;
 if(user){
 body='<p>'+esc(user.email)+'</p><label>'+tr("Name","الاسم")+'</label><input id="atdProfileName" value="'+esc(profile?.name)+'"><label>'+tr("Phone (optional)","الهاتف (اختياري)")+'</label><input id="atdProfilePhone" value="'+esc(profile?.phone)+'"><button id="atdSaveProfile">'+tr("Save profile","حفظ البيانات")+'</button><h3>'+tr("Set or change password","تعيين أو تغيير كلمة المرور")+'</h3><p>'+tr("Former Magic Link learners can set a password while signed in, keeping the same progress.","المتدرب الذي استخدم رابط الإيميل سابقاً يستطيع تعيين كلمة مرور من حسابه الحالي دون فقدان التقدم.")+'</p><form id="atdPasswordForm"><input type="password" id="atdNewPassword" required minlength="8" autocomplete="new-password" placeholder="'+tr("New password (8+ characters)","كلمة مرور جديدة (8 أحرف أو أكثر)")+'"><button type="submit">'+tr("Save password","حفظ كلمة المرور")+'</button></form><button id="atdImportOld">'+tr("Import older browser progress","استيراد التقدم القديم")+'</button><button id="atdLogout">'+tr("Sign out","تسجيل الخروج")+'</button>';
 }else{
 body='<h3>'+tr(mode==="login"?"Sign in":"Create account",mode==="login"?"تسجيل الدخول":"إنشاء حساب")+'</h3><form id="atdCredentials"><label>'+tr("Email (username)","البريد الإلكتروني (اسم المستخدم)")+'</label><input id="atdEmail" type="email" autocomplete="username" required placeholder="name@example.com"><label>'+tr("Password","كلمة المرور")+'</label><input type="password" id="atdPassword" minlength="8" required autocomplete="'+(mode==="login"?"current-password":"new-password")+'">'+(mode==="register"?'<label>'+tr("Confirm password","تأكيد كلمة المرور")+'</label><input id="atdConfirm" type="password" required minlength="8" autocomplete="new-password">':'')+'<button type="submit" class="primary">'+tr(mode==="login"?"Sign in":"Create account",mode==="login"?"دخول":"إنشاء حساب")+'</button></form><button id="atdMode">'+tr(mode==="login"?"New learner? Register":"Already have an account? Sign in",mode==="login"?"متدرب جديد؟ إنشاء حساب":"عندك حساب؟ تسجيل الدخول")+'</button><button id="atdReset">'+tr("Forgot password?","نسيت كلمة المرور؟")+'</button>';
 }
 root.insertAdjacentHTML("beforeend",'<div id="atdAccountMask"><section id="atdAccountPanel" dir="'+(h.getState().lang==="ar"?"rtl":"ltr")+'"><button id="atdClose" style="float:right">×</button><h2>ATD Academy Account</h2>'+body+'<p role="status">'+esc(notice)+'</p></section></div>');
 const get=s=>root.querySelector(s);
 get("#atdClose").onclick=()=>{if(user){opened=false;ui();}};if(!user)get("#atdClose").style.display="none";
 if(!user){
  get("#atdMode").onclick=()=>{mode=mode==="login"?"register":"login";notice="";ui();};
  get("#atdReset").onclick=async()=>{const email=get("#atdEmail").value.trim();if(!email){notice=tr("Enter your email first.","أدخل بريدك أولاً.");ui();return;}try{await sendPasswordResetEmail(auth,email);notice=tr("Check email for password reset instructions.","راجع بريدك لتعليمات إعادة كلمة المرور.");}catch(e){notice=e.code||e.message;}ui();};
  get("#atdCredentials").onsubmit=async e=>{e.preventDefault();const email=get("#atdEmail").value.trim().toLowerCase(),password=get("#atdPassword").value;if(mode==="register"&&password!==get("#atdConfirm").value){notice=tr("Passwords do not match.","كلمتا المرور غير متطابقتين.");ui();return;}try{await readyAuth;if(mode==="register")await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password);notice="";opened=false;ui();}catch(x){notice=x.code||x.message;ui();}};
 }else{
  get("#atdLogout").onclick=()=>signOut(auth);
  get("#atdSaveProfile").onclick=async()=>{try{profile={name:get("#atdProfileName").value.trim(),phone:get("#atdProfilePhone").value.trim()};if(!profile.name)throw Error("Name required");await setDoc(doc(db,"learners",user.uid),{...profile,email:user.email,updatedAt:serverTimestamp()},{merge:true});notice=tr("Profile saved.","تم الحفظ.");}catch(x){notice=x.code||x.message;}ui();};
  get("#atdPasswordForm").onsubmit=async e=>{e.preventDefault();try{await updatePassword(auth.currentUser,get("#atdNewPassword").value);notice=tr("Password saved; use it on any browser.","تم حفظ كلمة المرور ويمكن استخدامها على أي متصفح.");}catch(x){notice=x.code||x.message;}ui();};
  get("#atdImportOld").onclick=async()=>{if(!confirm(tr("Import the old guest progress into your account?","هل تريد استيراد تقدم الضيف القديم إلى حسابك؟")))return;await upload(true,h.guestState());await restore();ui();};
 }
}
function records(s){
 const out=[],id=v=>String(v).replace(/[^a-zA-Z0-9_.-]/g,"_");
 for(const [k,v] of Object.entries(s.done||{}))if(v)out.push(["lessonProgress",id(k),{lessonId:k,completed:true}]);
 for(const [k,v] of Object.entries(s.mastered||{}))if(v)out.push(["lessonMastery",id(k),{lessonId:k,mastered:true}]);
 for(const [k,v] of Object.entries(s.attempts||{}))if(v?.ts)out.push(["assessmentAttempts",id(k+"_"+v.ts),{assessmentKey:k,...v}]);
 for(const a of s.attemptHistory||[])if(a?.ts&&a.capability&&a.stage){const k=a.capability+":"+a.stage;out.push(["assessmentAttempts",id(k+"_"+a.ts),{assessmentKey:k,...a}]);}
 return out;
}
function snapshot(s){
 const fields=["current","view","focus","lastResume","draft","caseDraft","checks","manualReviewed","knowledgeGaps","lessonVisits","caseHistory"];
 const data={};for(const k of fields)if(s[k]!==undefined)data[k]=s[k];return data;
}
async function restore(){
 if(!user)return;
 const uid=user.uid,s=h.getState();
 const snap=await getDoc(doc(db,"learners",uid,"sync","current"));
 if(snap.exists()){
  const x=snap.data(),localStamp=Number(localStorage.getItem("atdSnapshotTime:"+uid)||0);
  if(Number(x.savedAt||0)>localStamp){
   for(const k of Object.keys(snapshot(x)))s[k]=x[k];
   localStorage.setItem("atdSnapshotTime:"+uid,String(x.savedAt));
  }
 }
 for(const sub of ["lessonProgress","lessonMastery","assessmentAttempts"]){
  const docs=await getDocs(collection(db,"learners",uid,sub));
  for(const d of docs.docs){
   known.add(sub+"/"+d.id);const a=d.data();
   if(sub==="lessonProgress"&&a.completed)s.done[a.lessonId]=true;
   if(sub==="lessonMastery"&&a.mastered)s.mastered[a.lessonId]=true;
   if(sub==="assessmentAttempts"&&a.assessmentKey){const old=s.attempts[a.assessmentKey];if(!old||String(a.ts||"")>String(old.ts||"")){const {updatedAt,assessmentKey,...attempt}=a;s.attempts[a.assessmentKey]=attempt;}}
  }
 }
 h.save();h.render();
}
async function upload(manual=false,source=null){
 if(!initialized||!user||busy)return;
 busy=true;
 try{
  for(const [sub,id,data] of records(source||h.getState())){
   const key=sub+"/"+id;if(known.has(key))continue;
   const ref=doc(db,"learners",user.uid,sub,id);
   if(manual&&(await getDoc(ref)).exists()){known.add(key);continue;}
   await setDoc(ref,{...data,updatedAt:serverTimestamp()},{merge:true});known.add(key);
  }
  const updated=Date.now();
  if(!manual){await setDoc(doc(db,"learners",user.uid,"sync","current"),{...snapshot(h.getState()),savedAt:updated});localStorage.setItem("atdSnapshotTime:"+user.uid,String(updated));}
  notice=tr("Progress synced to cloud.","تمت مزامنة التقدم سحابياً.");
 }catch(e){notice=tr("Sync needs attention: ","المزامنة تحتاج مراجعة: ")+(e.code||e.message);}
 finally{busy=false;if(opened)ui();}
}
window.ATDCloudOnSave=()=>{if(!initialized||!user)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>upload(),900);};
readyAuth.then(()=>onAuthStateChanged(auth,async next=>{
 clearTimeout(syncTimer);user=next;profile=null;initialized=false;busy=false;known.clear();notice="";
 h.useAccount(next?.uid||null);
 if(!next){opened=true;ui();return;}
 opened=false;ui();
 try{
  const p=await getDoc(doc(db,"learners",next.uid));profile=p.exists()?p.data():{};
  if(!p.exists())await setDoc(doc(db,"learners",next.uid),{email:next.email||"",createdAt:serverTimestamp()},{merge:true});
  await restore();initialized=true;await upload();
 }catch(e){notice=tr("Could not load cloud progress: ","تعذّر تحميل التقدم السحابي: ")+(e.code||e.message);}
 ui();
}));
ui();
