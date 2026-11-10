import {getFunctions,httpsCallable} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js";
const esc=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const normalize=s=>String(s??"").trim();
const headings={
 "employeeid":"employeeId","employee id":"employeeId","employee number":"employeeId","staff id":"employeeId","staff number":"employeeId","id":"employeeId","الرقم الوظيفي":"employeeId",
 "name":"name","employee name":"name","full name":"name","الاسم":"name",
 "email":"email","work email":"email","workemail":"email","email address":"email","البريد الإلكتروني":"email",
 "department":"department","team":"department","division":"division","القسم":"department"
};
const normHeader=s=>normalize(s).toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
function rowsFromGrid(grid){
 const h=(grid[0]||[]).map(s=>headings[normHeader(s)]||null),needed=["employeeId","name"];
 if(needed.some(key=>!h.includes(key)))throw Error("Missing required columns: Employee ID and Full Name.");
 return grid.slice(1).filter(row=>row.some(x=>normalize(x))).map((cells,i)=>{
  const o={employeeId:"",name:"",email:"",division:"",department:"",sourceRow:i+2};
  for(let j=0;j<h.length;j++)if(h[j])o[h[j]]=normalize(cells[j]);
  return o;
 });
}
function parseCSV(src){
 const text=String(src).replace(/^\uFEFF/,""),grid=[];
 let row=[],field="",quoted=false;
 for(let i=0;i<text.length;i++){
  const x=text[i];
  if(quoted){
   if(x==='"'&&text[i+1]==='"'){field+='"';i++;}
   else if(x==='"')quoted=false;
   else field+=x;
  }else if(x==='"'){quoted=true;}
  else if(x===","){row.push(field);field="";}
  else if(x==="\n"||x==="\r"){if(x==="\r"&&text[i+1]==="\n")i++;row.push(field);if(row.some(v=>v!==""))grid.push(row);row=[];field="";}
  else field+=x;
 }
 if(quoted)throw Error("Invalid CSV: unclosed quoted field.");
 row.push(field);if(row.some(v=>v!==""))grid.push(row);
 return rowsFromGrid(grid);
}
let excelReady=null;
function loadExcel(){
 if(window.ExcelJS)return Promise.resolve();
 if(excelReady)return excelReady;
 excelReady=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
  script.onload=()=>window.ExcelJS?resolve():reject(Error("Excel reader was not available. Export as CSV and retry."));
  script.onerror=()=>reject(Error("Could not load Excel support. Save the file as CSV (UTF-8) and retry."));
  document.head.appendChild(script);
 });
 return excelReady;
}
async function parseEmployeeFile(file){
 if(!file)throw Error("Choose a CSV or XLSX employee file.");
 if(file.size>3_000_000)throw Error("File must be under 3 MB.");
 if(/\.csv$/i.test(file.name))return parseCSV(await file.text());
 if(/\.xlsx$/i.test(file.name)){
  await loadExcel();
  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  if(!wb.worksheets.length)throw Error("Workbook has no sheets.");
  const sheet=wb.worksheets[0],grid=[];
  sheet.eachRow({includeEmpty:false},row=>{
   const cells=[];for(let j=1;j<=Math.max(row.cellCount,4);j++){
    const v=row.getCell(j).value;
    cells.push(v&&typeof v==="object"?(v.text??v.result??v.hyperlink??""):v??"");
   }grid.push(cells);
  });
  return rowsFromGrid(grid);
 }
 throw Error("Upload an Excel .xlsx file or UTF-8 .csv file.");
}
function validateRows(rows){
 const problems=[],seenIDs=new Set(),seenEmails=new Set();
 rows.forEach((r,i)=>{
  r.employeeId=r.employeeId.toUpperCase();r.email=r.email.toLowerCase();
  const index=r.sourceRow||i+2;
  if(!/^[A-Z0-9][A-Z0-9_.-]{1,39}$/.test(r.employeeId))problems.push("Row "+index+": Employee ID must have 2–40 letters, digits, dots, underscores or hyphens.");
  if(r.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))problems.push("Row "+index+": invalid email.");
  if(r.name.length<2||r.name.length>120)problems.push("Row "+index+": full name is missing or too long.");
  if(r.department.length>100)problems.push("Row "+index+": department is too long.");
  if(seenIDs.has(r.employeeId))problems.push("Row "+index+": duplicate Employee ID in file.");
  if(r.email&&seenEmails.has(r.email))problems.push("Row "+index+": duplicate work email in file.");
  seenIDs.add(r.employeeId);seenEmails.add(r.email);
 });
 return problems;
}
export function initializeEmployeeManagement(auth){
 const container=document.getElementById("employeeManagement");
 if(!container||container.dataset.initialized==="yes")return;
 container.dataset.initialized="yes";
 const functions=getFunctions(auth.app,"us-central1");
 const provision=httpsCallable(functions,"importEmployees",{timeout:125000});
 let rows=[],ready=false,busy=false;
 const get=id=>document.getElementById(id);
 const notice=(message,error=false)=>{get("employeeImportStatus").textContent=message;get("employeeImportStatus").style.color=error?"#b42335":"#294f71";};
 container.innerHTML='<div class="skillSectionHeader"><div><h2>Employee Management · Bulk Import</h2><p class="muted small">Add Employee IDs, contact emails, departments and names. Existing email accounts keep their UID and learning results.</p></div><button type="button" id="employeeTemplate">Download CSV template</button></div>'+
 '<div class="skillLegend"><b>Security:</b> Employee Code is an HR reference, <b>never a password</b>. New employees sign in with their work email and a password they set using a secure invitation link. Only verified admins can provision accounts; a deployed Firebase Cloud Function and SMTP configuration are required.</div>'+
 '<div class="toolbar"><input id="employeeFile" type="file" accept=".csv,.xlsx" aria-label="Select employee roster CSV or Excel" style="flex:1"><button id="employeeValidate" type="button">Preview & validate</button><button id="employeeSubmit" type="button" class="primary" disabled>Import employees</button></div>'+
 '<p id="employeeImportStatus" role="status" class="muted small">No file selected. Required headers: Employee ID, Full Name. Work Email must be completed before import. Optional: Division, Department.</p>'+
 '<div id="employeePreview" class="scroll"></div><div id="employeeResults" class="scroll"></div>'+
 '<p class="muted small">Uploads are processed only when you press Import. New employees get random temporary Firebase passwords, never their employee number. The code is deployed to GitHub Pages; backend provisioning separately requires Firebase Cloud Functions deployment.</p>';
 get("employeeTemplate").onclick=()=>{
  const str="\uFEFFEmployee ID,Full Name,Work Email,Department\r\nEMP0001,Example Employee,employee@example.com,Sales\r\n";
  const blob=new Blob([str],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="ATD-Employee-Import-Template.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 get("employeeValidate").onclick=async()=>{
  ready=false;rows=[];get("employeeSubmit").disabled=true;get("employeePreview").innerHTML="";get("employeeResults").innerHTML="";
  const file=get("employeeFile").files?.[0];if(!file){notice("Choose an Excel or CSV file first.",true);return;}
  notice("Reading and validating roster locally…");
  try{
   rows=await parseEmployeeFile(file);
   if(rows.length>2000)throw Error("Maximum 2,000 employees per import file.");
   if(!rows.length)throw Error("No employee rows found.");
   const problems=validateRows(rows);
   get("employeePreview").innerHTML='<p><b>Preview — '+rows.length+' employees</b> · showing first '+Math.min(15,rows.length)+'</p>'+
    '<table><thead><tr><th>Employee ID</th><th>Full name</th><th>Work email</th><th>Division</th><th>Department</th></tr></thead><tbody>'+
    rows.slice(0,15).map((x,i)=>'<tr><td>'+esc(x.employeeId)+'</td><td>'+esc(x.name)+'</td><td>'+(x.email?esc(x.email):'<span class="skillTag">Pending Email</span>')+'</td><td>'+esc(x.division||"—")+'</td><td>'+esc(x.department)+'</td></tr>').join("")+'</tbody></table>'+
    (problems.length?'<div class="skillEmpty"><b>Fix these errors before importing:</b><p>'+problems.slice(0,30).map(esc).join("; ")+'</p></div>':"");
   if(problems.length){notice(problems.length+" validation issues. Nothing has been uploaded.",true);return;}
   const missing=rows.filter(x=>!x.email).length;
   if(missing){notice("Preview ready: "+missing+" employees have no email. Add their real work emails to the file before importing; no account was created.");return;}
   ready=true;get("employeeSubmit").disabled=false;
   notice(rows.length+" employees validated. Review the preview, then select Import to provision accounts.");
  }catch(err){notice(String(err.message||err),true);}
 };
 get("employeeSubmit").onclick=async()=>{
  if(!ready||busy||!rows.length)return;
  if(!confirm("Create/link "+rows.length+" employee accounts? Invitations will be sent to real work emails. This may create Firebase accounts. Continue?"))return;
  busy=true;get("employeeValidate").disabled=true;get("employeeSubmit").disabled=true;
  const results=[];let failed=false;
  try{
   for(let i=0;i<rows.length;i+=25){
    notice("Provisioning "+Math.min(i+25,rows.length)+" / "+rows.length+" employee records…");
    const slice=rows.slice(i,i+25).map(({employeeId,name,email,department})=>({employeeId,name,email,department}));
    const answer=await provision({employees:slice});
    results.push(...(answer.data?.results||[]));
   }
  }catch(err){failed=true;notice("Import stopped: "+String(err.code||err.message)+". Any prior successful rows remain created. Fix the backend issue and re-import; duplicates are handled safely.",true);}
  get("employeeResults").innerHTML='<h3>Import results</h3><table><thead><tr><th>Employee ID</th><th>Status</th><th>Details</th></tr></thead><tbody>'+
   results.map(x=>'<tr><td>'+esc(x.employeeId)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.message)+'</td></tr>').join("")+'</tbody></table>';
  if(!failed)notice("Import finished: "+results.length+" row results. Review any conflict or invite_pending status.");
  busy=false;get("employeeValidate").disabled=false;get("employeeSubmit").disabled=false;
 };
}
