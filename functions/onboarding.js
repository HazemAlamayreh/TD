"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const db=getFirestore();
const ORIGIN="https://academy.idevelopmena.com";
const BASE={region:"us-central1",cors:["https://academy.idevelopmena.com","https://dad-new-employee-onboarding.hazem85hh.chatgpt.site",/^http:\/\/localhost:\d+$/],maxInstances:10};
const ID=/^[A-Za-z0-9][A-Za-z0-9_.-]{1,39}$/;
const ACTIVITY=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99}$/;
const normalizeId=v=>String(v||"").trim().toUpperCase();
const clean=v=>String(v||"").trim();
async function admin(req){
  if(!req.auth?.uid)throw new HttpsError("unauthenticated","Sign in first.");
  const role=await db.doc("admins/"+req.auth.uid).get();
  if(!role.exists||role.get("active")!==true)throw new HttpsError("permission-denied","Active administrator required.");
}
function assertUid(req,doc) {
  if(!req.auth?.uid)throw new HttpsError("unauthenticated","Sign in first.");
  if(!doc.exists||doc.get("uid")!==req.auth.uid)throw new HttpsError("permission-denied","Employee account is not linked to this authenticated UID.");
}
function configuredIds(value) {
  if(!Array.isArray(value)||value.length<1||value.length>200||value.some(v=>typeof v!=="string"||!ACTIVITY.test(v))||new Set(value).size!==value.length)
    throw new HttpsError("invalid-argument","Provide 1–200 unique stable activity IDs.");
  return value;
}
// Trusted administrator must configure what counts toward the percentage.
// Existing started journeys cannot be silently reset by changing their denominator.
exports.assignOnboardingJourney=onCall(BASE,async req=>{
  await admin(req);
  const employeeId=normalizeId(req.data?.employeeId);
  const journeyId=clean(req.data?.journeyId);
  const ids=configuredIds(req.data?.requiredActivityIds);
  if(!ID.test(employeeId)||!ACTIVITY.test(journeyId))throw new HttpsError("invalid-argument","Valid employeeId and journeyId required.");
  const ref=db.doc("employees/"+employeeId);
  return db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists||!snap.get("uid"))throw new HttpsError("failed-precondition","Employee must first be provisioned and linked to an Auth UID.");
    const existing=snap.get("onboardingRequiredActivityIds")||[];
    if((snap.get("onboardingStartedAt")||snap.get("onboardingStartDate")) &&
       (snap.get("onboardingJourneyId")!==journeyId||JSON.stringify(existing)!==JSON.stringify(ids)))
      throw new HttpsError("failed-precondition","Journey already started. Changes require a controlled migration.");
    tx.set(ref,{
      onboardingJourneyId:journeyId,onboardingRequiredActivityIds:ids,
      onboardingStatus:snap.get("onboardingStatus")||"not_started",
      overallProgress:typeof snap.get("overallProgress")==="number"?snap.get("overallProgress"):0,
      onboardingAssignedAt:snap.get("onboardingAssignedAt")||FieldValue.serverTimestamp(),
      onboardingUpdatedAt:FieldValue.serverTimestamp()
    },{merge:true});
    return {employeeId,journeyId,activityCount:ids.length};
  });
});
// Records completion declarations, not verified workplace proficiency. All writes go through
// server validation; only IDs assigned by an administrator count. Progress is monotonic.
exports.recordOnboardingActivity=onCall(BASE,async req=>{
  if(!req.auth?.uid)throw new HttpsError("unauthenticated","Sign in first.");
  const employeeId=normalizeId(req.data?.employeeId),activityId=clean(req.data?.activityId);
  const event=clean(req.data?.event);
  if(!ID.test(employeeId)||!ACTIVITY.test(activityId)||!["started","completed"].includes(event))
    throw new HttpsError("invalid-argument","Valid employeeId, activityId and event required.");
  const ref=db.doc("employees/"+employeeId);
  const item=ref.collection("onboardingProgress").doc(activityId);
  return db.runTransaction(async tx=>{
    const snap=await tx.get(ref),old=await tx.get(item);
    assertUid(req,snap);
    const ids=snap.get("onboardingRequiredActivityIds");
    if(!Array.isArray(ids)||!ids.includes(activityId)||!ids.length)
      throw new HttpsError("failed-precondition","Activity is not assigned to this employee.");
    const completed=Array.isArray(snap.get("onboardingCompletedActivityIds"))?snap.get("onboardingCompletedActivityIds"):[];
    const already=completed.includes(activityId);
    const next=event==="completed"&&!already?[...completed,activityId]:completed;
    const count=next.filter(id=>ids.includes(id)).length;
    const overallProgress=Math.round(count*100/ids.length);
    const wasStarted=!!(snap.get("onboardingStartedAt")||snap.get("onboardingStartDate"));
    const status=overallProgress===100?"completed":"in_progress";
    // Repeated completion must not overwrite historical completion or activity timestamp.
    if((event==="completed"&&already)||(event==="started"&&old.exists))return {employeeId,activityId,status:snap.get("onboardingStatus")||status,overallProgress:snap.get("overallProgress")??overallProgress,unchanged:true};
    tx.set(item,{
      activityId,status:event==="completed"?"completed":"in_progress",
      ...(old.exists?{}:{startedAt:FieldValue.serverTimestamp()}),
      ...(event==="completed"?{completedAt:FieldValue.serverTimestamp()}:{}),
      updatedAt:FieldValue.serverTimestamp(),source:"employee-declared"
    },{merge:true});
    tx.set(ref,{
      onboardingCompletedActivityIds:next,
      overallProgress,onboardingStatus:status,
      ...(!wasStarted?{onboardingStartedAt:FieldValue.serverTimestamp(),onboardingStartDate:FieldValue.serverTimestamp()}:{}),
      ...(overallProgress===100&&!snap.get("onboardingCompletedAt")?{onboardingCompletedAt:FieldValue.serverTimestamp()}:{}),
      lastActivityAt:FieldValue.serverTimestamp(),onboardingUpdatedAt:FieldValue.serverTimestamp()
    },{merge:true});
    return {employeeId,activityId,status,overallProgress,unchanged:false};
  });
});

// A resumable browser checkpoint is distinct from validated completion events.
// An authenticated, linked employee can only load/write their own checkpoint.
exports.getOnboardingCheckpoint=onCall(BASE,async req=>{
  if(!req.auth?.uid)throw new HttpsError("unauthenticated","Sign in first.");
  const employeeId=normalizeId(req.data?.employeeId);
  if(!ID.test(employeeId))throw new HttpsError("invalid-argument","Employee ID required.");
  const emp=await db.doc("employees/"+employeeId).get();
  assertUid(req,emp);
  const snap=await db.doc("onboardingCheckpoints/"+req.auth.uid).get();
  if(!snap.exists)return {checkpoint:null,revision:0};
  const data=snap.data();
  if(data.employeeId!==employeeId)throw new HttpsError("permission-denied","Checkpoint identity mismatch.");
  return {checkpoint:data.checkpoint||null,revision:Number(data.revision||0)};
});
exports.saveOnboardingCheckpoint=onCall(BASE,async req=>{
  if(!req.auth?.uid)throw new HttpsError("unauthenticated","Sign in first.");
  const employeeId=normalizeId(req.data?.employeeId);
  if(!ID.test(employeeId))throw new HttpsError("invalid-argument","Employee ID required.");
  const checkpoint=req.data?.checkpoint;
  if(!checkpoint||typeof checkpoint!=="object"||Array.isArray(checkpoint))
    throw new HttpsError("invalid-argument","Checkpoint must be an object.");
  const encoded=JSON.stringify(checkpoint);
  if(encoded.length>650000)throw new HttpsError("invalid-argument","Checkpoint exceeds 650KB limit.");
  const allowed=["assessments","practice","passedAt","course","courseProgress","itEmail","itProfiles","lang","screen"];
  if(Object.keys(checkpoint).some(k=>!allowed.includes(k)))
    throw new HttpsError("invalid-argument","Unexpected checkpoint fields.");
  const revision=Number(req.data?.revision);
  if(!Number.isSafeInteger(revision)||revision<0)
    throw new HttpsError("invalid-argument","Non-negative revision required.");
  const employeeRef=db.doc("employees/"+employeeId);
  const target=db.doc("onboardingCheckpoints/"+req.auth.uid);
  return db.runTransaction(async tx=>{
    const employee=await tx.get(employeeRef),existing=await tx.get(target);
    assertUid(req,employee);
    const current=existing.exists?Number(existing.get("revision")||0):0;
    if(current!==revision)throw new HttpsError("aborted","Checkpoint changed on another device. Reload cloud progress before saving.");
    const next=current+1;
    tx.set(target,{employeeId,uid:req.auth.uid,checkpoint,revision:next,updatedAt:FieldValue.serverTimestamp()});
    return {revision:next};
  });
});
