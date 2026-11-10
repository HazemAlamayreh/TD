"use strict";
/* ATD Academy trusted employee directory.
 * Never deploy Admin SDK/service credentials in GitHub Pages.
 * Built for Cloud Functions v2; requires Blaze and a secret SMTP configuration.
 */
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const {initializeApp}=require("firebase-admin/app");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,FieldValue,Timestamp}=require("firebase-admin/firestore");
const nodemailer=require("nodemailer");
const crypto=require("node:crypto");
initializeApp();
const db=getFirestore(),auth=getAuth(),SMTP_CONFIG=defineSecret("ATD_SMTP_CONFIG");
const ORIGIN="https://academy.idevelopmena.com";
const LOGIN_DOMAIN="employee-login.academy.idevelopmena.com";
const EMP_ID=/^[A-Za-z0-9][A-Za-z0-9_.-]{1,39}$/;
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPTIONS={region:"us-central1",cors:[ORIGIN],maxInstances:10};
const cleanId=v=>String(v||"").trim().toUpperCase();
const normalizedEmail=v=>String(v||"").trim().toLowerCase();
const cleanText=(v,max)=>String(v||"").trim().slice(0,max);
function inputRow(x){
 const employeeId=cleanId(x?.employeeId),email=normalizedEmail(x?.email),name=cleanText(x?.name,120),department=cleanText(x?.department,100);
 if(!EMP_ID.test(employeeId)||!EMAIL.test(email)||!name||name.length<2)throw new HttpsError("invalid-argument","Valid Employee ID, full name and work email are required.");
 if(email.endsWith("@"+LOGIN_DOMAIN))throw new HttpsError("invalid-argument","The work email cannot use the reserved login domain.");
 return {employeeId,email,name,department};
}
async function requireAdmin(request){
 if(!request.auth?.uid)throw new HttpsError("unauthenticated","Sign in to the Academy first.");
 const snap=await db.doc("admins/"+request.auth.uid).get();
 if(!snap.exists||snap.get("active")!==true)throw new HttpsError("permission-denied","Only active Academy administrators can import employees.");
}
function transporter(){
 let config;
 try{config=JSON.parse(SMTP_CONFIG.value()||"");}catch{throw new HttpsError("failed-precondition","Invalid ATD_SMTP_CONFIG JSON secret.");}
 if(!config.host||!config.port||!config.user||!config.pass||!config.from)throw new HttpsError("failed-precondition","Configure ATD_SMTP_CONFIG with host, port, user, pass and from before importing.");
 return nodemailer.createTransport({host:config.host,port:Number(config.port),secure:Number(config.port)===465,auth:{user:config.user,pass:config.pass}});
}
async function rateLimit(ip,kind,max,minutes){
 const key=crypto.createHash("sha256").update(String(ip||"unknown")).digest("hex").slice(0,40);
 const epoch=Math.floor(Date.now()/(minutes*60000)),ref=db.doc("employeeRequestLimits/"+kind+"_"+key+"_"+epoch);
 await db.runTransaction(async tx=>{
  const snap=await tx.get(ref),count=Number(snap.get("count")||0);
  if(count>=max)throw new HttpsError("resource-exhausted","Too many attempts; try again later.");
  tx.set(ref,{count:count+1,expiresAt:Timestamp.fromMillis((epoch+2)*minutes*60000)},{merge:true});
 });
}
async function sendSetupEmail({authEmail,email,name,employeeId,existing=false},mailer){
 const link=await auth.generatePasswordResetLink(authEmail);
 await mailer.sendMail({
  from:JSON.parse(SMTP_CONFIG.value()).from,to:email,
  subject:existing?"ATD Academy — reset your password":"ATD Academy — activate your employee account",
  text:"Hello "+name+",\n\n"+
    "Your ATD Academy employee username is: "+employeeId+"\n"+
    (existing?"Use this secure link to reset your Academy password: ":"Set your own Academy password using this one-time secure link: ")+link+"\n\n"+
    "After setting your password, sign in with your Employee ID and your own password at "+ORIGIN+"/\n"+
    "If you did not expect this message, contact your Academy administrator.\n\nATD Academy"
 });
}
async function importOne(row,mailer,adminUid){
 const ref=db.doc("employees/"+row.employeeId);
 const current=await ref.get();
 if(current.exists){
  const e=current.data();
  if(e.email!==row.email)return {employeeId:row.employeeId,status:"conflict",message:"This employee ID is already linked to a different email."};
  if(e.status==="invite_pending"){
   try{await sendSetupEmail({...row,authEmail:e.loginEmail},mailer);
    await ref.set({status:"invited",invitedAt:FieldValue.serverTimestamp()},{merge:true});
    return {employeeId:row.employeeId,status:"invited",message:"Pending invitation resent."};
   }catch(err){return {employeeId:row.employeeId,status:"invite_pending",message:"Email delivery failed. Check SMTP and retry this row."};}
  }
  return {employeeId:row.employeeId,status:e.status==="provision_failed"?"error":"existing",message:e.status==="provision_failed"?"A prior provisioning failure needs admin review; no extra account was created.":"Already imported; no duplicate account created."};
 }
 const existingEmail=await db.collection("employees").where("email","==",row.email).limit(1).get();
 if(!existingEmail.empty)return {employeeId:row.employeeId,status:"conflict",message:"Work email is already linked to another employee ID."};
 // A reservation prevents two admins assigning the same Employee ID simultaneously.
 try{await db.runTransaction(async tx=>{
  const snap=await tx.get(ref);
  if(snap.exists)throw new Error("EMPLOYEE_ID_RESERVED");
  tx.create(ref,{...row,status:"provisioning",createdBy:adminUid,createdAt:FieldValue.serverTimestamp()});
 });}catch(e){return {employeeId:row.employeeId,status:"conflict",message:"Employee ID was concurrently registered."};}
 try{
  let user,existing=false;
  try{user=await auth.getUserByEmail(row.email);existing=true;}catch(e){if(e.code!=="auth/user-not-found")throw e;}
  if(!user){
   // Unpredictable synthetic Auth email prevents employee-ID alias squatting.
   const alias="e-"+crypto.randomUUID().replace(/-/g,"")+"@"+LOGIN_DOMAIN;
   user=await auth.createUser({email:alias,displayName:row.name,password:crypto.randomBytes(40).toString("base64url"),disabled:false});
  }
  await ref.set({uid:user.uid,loginEmail:user.email,status:existing?"linked":"invite_pending",linkedExistingAccount:existing,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  // Retain existing UID and progress; never replace or delete a learner.
  await db.doc("learners/"+user.uid).set({employeeId:row.employeeId,name:row.name,email:row.email,department:row.department,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  if(existing)return {employeeId:row.employeeId,status:"linked",message:"Existing email account linked; previous password and learning history retained."};
  try{
   await sendSetupEmail({...row,authEmail:user.email},mailer);
   await ref.set({status:"invited",invitedAt:FieldValue.serverTimestamp()},{merge:true});
   return {employeeId:row.employeeId,status:"invited",message:"Account created; password-setup invitation emailed."};
  }catch(err){return {employeeId:row.employeeId,status:"invite_pending",message:"Account created, but email delivery failed; retry this row after fixing SMTP."};}
 }catch(err){
  await ref.set({status:"provision_failed",errorCode:String(err.code||"provision_failed").slice(0,60)},{merge:true});
  return {employeeId:row.employeeId,status:"error",message:"Provisioning failed: "+String(err.code||"unknown").slice(0,80)};
 }
}
exports.importEmployees=onCall({...OPTIONS,secrets:[SMTP_CONFIG],timeoutSeconds:120,memory:"512MiB"},async request=>{
 await requireAdmin(request);
 const rows=request.data?.employees;
 if(!Array.isArray(rows)||rows.length<1||rows.length>25)throw new HttpsError("invalid-argument","Import 1 to 25 employees per request.");
 const seenId=new Set(),seenEmail=new Set(),normalized=[];
 for(const raw of rows){
  const r=inputRow(raw);
  if(seenId.has(r.employeeId)||seenEmail.has(r.email))throw new HttpsError("invalid-argument","Duplicate Employee ID or email in this batch.");
  seenId.add(r.employeeId);seenEmail.add(r.email);normalized.push(r);
 }
 const mailer=transporter(),results=[];
 for(const row of normalized)results.push(await importOne(row,mailer,request.auth.uid));
 return {results};
});
exports.resolveEmployeeLogin=onCall({...OPTIONS,timeoutSeconds:15},async request=>{
 await rateLimit(request.rawRequest?.ip,"lookup",80,30);
 const id=cleanId(request.data?.employeeId);
 if(!EMP_ID.test(id))throw new HttpsError("invalid-argument","Enter a valid Employee ID.");
 const doc=await db.doc("employees/"+id).get();
 // New accounts use a random opaque alias. Linked legacy email/password accounts
 // retain their real Auth login email so existing passwords and UIDs continue to work.
 // This endpoint is rate-limited; enable App Check before exposing high-volume access.
 const loginEmail=doc.exists&&doc.get("loginEmail")?doc.get("loginEmail"):
  "missing-"+crypto.randomBytes(12).toString("hex")+"@"+LOGIN_DOMAIN;
 return {loginEmail};
});
exports.resetEmployeePassword=onCall({...OPTIONS,secrets:[SMTP_CONFIG],timeoutSeconds:20},async request=>{
 await rateLimit(request.rawRequest?.ip,"reset",20,60);
 const id=cleanId(request.data?.employeeId);
 if(!EMP_ID.test(id))throw new HttpsError("invalid-argument","Enter a valid Employee ID.");
 await rateLimit(id,"resetAccount",3,1440);
 const snap=await db.doc("employees/"+id).get();
 const generic={message:"If this Employee ID is registered, password setup instructions will be emailed."};
 if(!snap.exists||!snap.get("loginEmail")||!snap.get("email"))return generic;
 const data=snap.data(),mailer=transporter();
 try{await sendSetupEmail({authEmail:data.loginEmail,email:data.email,name:data.name,employeeId:id,existing:true},mailer);}
 catch(err){console.error("Password reset delivery failed",String(err.code||err.message));}
 return generic;
});
