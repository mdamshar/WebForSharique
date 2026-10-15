let sessionToken = '';
let appData = {workers:[],attendance:[],payments:[]};
let currentReport = [];
const $ = id => document.getElementById(id);
const today = new Date();
const localDate = d => {
  const date = d || new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const call = (fn, ...args) => new Promise((resolve,reject) => {
  google.script.run.withSuccessHandler(resolve).withFailureHandler(err => reject(new Error(err && err.message ? err.message : String(err))))[fn](...args);
});
function showToast(message,bad=false){const el=$('toast');el.textContent=message;el.classList.toggle('bad',bad);el.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>el.classList.add('hidden'),4500)}
function setBusy(button,busy,label){if(!button)return;button.disabled=busy;if(busy){button.dataset.old=button.textContent;button.textContent=label||'Please wait…'}else{button.textContent=button.dataset.old||button.textContent}}
function workerById(id){return appData.workers.find(w=>String(w.WorkerID)===String(id))}
function attendanceFor(id,date){return appData.attendance.find(a=>String(a.WorkerID)===String(id)&&String(a.Date).slice(0,10)===date)}
function statsFor(id){
 const a=appData.attendance.filter(x=>String(x.WorkerID)===String(id));
 const p=appData.payments.filter(x=>String(x.WorkerID)===String(id));
 const earned=a.reduce((s,x)=>s+Number(x.EarnedAmount||0),0);
 const paid=p.reduce((s,x)=>s+Number(x.Amount||0),0);
 return {earned,paid,dues:earned-paid,present:a.filter(x=>x.Status==='Present').length,half:a.filter(x=>x.Status==='Half Day').length,absent:a.filter(x=>x.Status==='Absent').length,leave:a.filter(x=>x.Status==='Leave').length};
}
function showPage(page){
 document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
 $('page-'+page).classList.remove('hidden');
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 const titles={dashboard:'Dashboard',workers:'Workers',attendance:'Daily Attendance',payments:'Payments',reports:'Reports & Ledger',settings:'Settings'};
 $('pageTitle').textContent=titles[page]||'Dashboard';
 if(page==='dashboard')renderDashboard();
 if(page==='workers')renderWorkers();
 if(page==='attendance')renderAttendance();
 if(page==='payments')renderPayments();
 if(page==='reports')runReport();
}
function renderAll(){renderDashboard();renderWorkers();renderAttendance();renderPayments();populateWorkerSelects();if(!$('page-reports').classList.contains('hidden'))runReport()}
function renderDashboard(){
 const active=appData.workers.filter(w=>w.Status!=='Inactive');
 const date=$('attendanceDate').value||localDate();
 const todays=appData.attendance.filter(a=>String(a.Date).slice(0,10)===date);
 const present=todays.filter(a=>a.Status==='Present').length;
 const absent=todays.filter(a=>a.Status==='Absent').length;
 let earned=0,paid=0;
 appData.workers.forEach(w=>{const s=statsFor(w.WorkerID);earned+=s.earned;paid+=s.paid});
 $('statWorkers').textContent=active.length;
 $('statPresent').textContent=present;
 $('statAbsent').textContent=`${absent} absent on ${date}`;
 $('statEarned').textContent=money(earned);
 $('statPaid').textContent=money(paid);
 $('statDues').textContent=money(earned-paid);
 const list=active.map(w=>{const s=statsFor(w.WorkerID);return `<tr><td><span class="worker-name">${esc(w.Name)}</span><span class="subtext">${esc(w.WorkerID)}</span></td><td>${esc(w.Trade)}</td><td>${money(w.DailySalary)}</td><td class="money">${money(s.earned)}</td><td class="paid">${money(s.paid)}</td><td class="due">${money(s.dues)}</td></tr>`}).join('');
 $('balanceTable').innerHTML=list||'<tr><td colspan="6" class="empty">No workers yet. Add your first worker to get started.</td></tr>';
}
function renderWorkers(){
 const q=($('workerSearch').value||'').toLowerCase();
 const filter=$('workerStatusFilter').value;
 const rows=appData.workers.filter(w=>(filter==='All'||w.Status===filter)&&[w.Name,w.WorkerID,w.Trade].some(v=>String(v||'').toLowerCase().includes(q)));
 $('workersTable').innerHTML=rows.map(w=>`<tr><td><span class="worker-name">${esc(w.Name)}</span><span class="subtext">${esc(w.WorkerID)}</span></td><td>${esc(w.Trade)}</td><td class="money">${money(w.DailySalary)}</td><td>${esc(w.Mobile||'—')}</td><td><span class="pill ${w.Status==='Inactive'?'inactive':'active'}">${esc(w.Status||'Active')}</span></td><td><button class="mini-btn" data-edit-worker="${esc(w.WorkerID)}">Edit</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">No matching workers found.</td></tr>';
}
function renderAttendance(){
 const date=$('attendanceDate').value||localDate();
 const active=appData.workers.filter(w=>w.Status!=='Inactive');
 $('attendanceTable').innerHTML=active.map(w=>{
   const a=attendanceFor(w.WorkerID,date);const status=a?a.Status:'Absent';const earned=a?Number(a.EarnedAmount||0):0;
   return `<tr data-attendance-row="${esc(w.WorkerID)}"><td><span class="worker-name">${esc(w.Name)}</span><span class="subtext">${esc(w.WorkerID)}</span></td><td>${esc(w.Trade)}</td><td>${money(w.DailySalary)}</td><td><select class="status-select" data-status="${esc(w.WorkerID)}"><option ${status==='Present'?'selected':''}>Present</option><option ${status==='Absent'?'selected':''}>Absent</option><option ${status==='Half Day'?'selected':''}>Half Day</option><option ${status==='Leave'?'selected':''}>Leave</option></select></td><td class="earned-cell money">${money(earned)}</td><td><input data-remarks="${esc(w.WorkerID)}" maxlength="250" value="${esc(a?a.Remarks:'')}" placeholder="Optional"></td><td><button class="btn primary row-save" data-save-attendance="${esc(w.WorkerID)}">Save</button></td></tr>`;
 }).join('')||'<tr><td colspan="7" class="empty">Add active workers first.</td></tr>';
 document.querySelectorAll('[data-status]').forEach(sel=>sel.addEventListener('change',()=>{const w=workerById(sel.dataset.status);const factor=sel.value==='Present'?1:sel.value==='Half Day'?.5:0;sel.closest('tr').querySelector('.earned-cell').textContent=money(Number(w.DailySalary||0)*factor)}));
}
function populateWorkerSelects(){
 const active=appData.workers.filter(w=>w.Status!=='Inactive');
 const opts='<option value="">Select worker…</option>'+active.map(w=>`<option value="${esc(w.WorkerID)}">${esc(w.Name)} — ${esc(w.Trade)}</option>`).join('');
 const prev=$('paymentWorker').value;$('paymentWorker').innerHTML=opts;if(active.some(w=>w.WorkerID===prev))$('paymentWorker').value=prev;
}
function renderPayments(){
 const sorted=[...appData.payments].sort((a,b)=>String(b.Date).localeCompare(String(a.Date)));
 $('paymentsTable').innerHTML=sorted.slice(0,100).map(p=>{const w=workerById(p.WorkerID);return `<tr><td>${esc(p.Date)}</td><td>${esc(w?w.Name:p.WorkerID)}</td><td>${esc(w?w.Trade:'—')}</td><td class="paid">${money(p.Amount)}</td><td>${esc(p.Mode||'Cash')}</td><td>${esc(p.Remarks||'—')}</td></tr>`}).join('')||'<tr><td colspan="6" class="empty">No payments recorded yet.</td></tr>';
 updatePaymentBalance();
}
function updatePaymentBalance(){
 const id=$('paymentWorker').value;const w=workerById(id);const box=$('paymentBalance');
 if(!w){box.innerHTML='<p class="muted">Select a worker to view their balance.</p>';return}
 const s=statsFor(id);
 box.innerHTML=`<div class="balance-row"><span>Worker</span><b>${esc(w.Name)}</b></div><div class="balance-row"><span>Trade · Daily salary</span><b>${esc(w.Trade)} · ${money(w.DailySalary)}</b></div><div class="balance-row"><span>Total earned</span><strong>${money(s.earned)}</strong></div><div class="balance-row"><span>Total paid</span><strong class="paid">${money(s.paid)}</strong></div><div class="balance-row total"><span>Pending dues</span><strong>${money(s.dues)}</strong></div>`;
}
function openWorkerDialog(worker){
 $('workerForm').reset();$('editWorkerId').value=worker?worker.WorkerID:'';$('workerModalTitle').textContent=worker?'Edit worker':'Add worker';
 $('workerName').value=worker?worker.Name:'';$('workerTrade').value=worker?worker.Trade:'';$('workerSalary').value=worker?worker.DailySalary:'';
 $('workerMobile').value=worker?worker.Mobile||'':'';$('workerJoining').value=worker?String(worker.JoiningDate).slice(0,10):localDate();$('workerState').value=worker?worker.Status||'Active':'Active';
 $('workerDialog').showModal();
}
async function refreshData(){appData=await call('apiGetAppData',sessionToken);$('todayLabel').textContent=localDate();renderAll()}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.submitter;setBusy(btn,true,'Signing in…');$('loginError').textContent='';
 try{const res=await call('apiLogin',$('username').value,$('password').value);sessionToken=res.token;sessionStorage.setItem('pa_session',sessionToken);await refreshData();$('loginView').classList.add('hidden');$('appView').classList.remove('hidden');$('password').value='';showPage('dashboard')}
 catch(err){$('loginError').textContent=err.message}
 finally{setBusy(btn,false)}
});
$('logoutBtn').addEventListener('click',async()=>{try{await call('apiLogout',sessionToken)}catch(e){}sessionToken='';sessionStorage.removeItem('pa_session');$('appView').classList.add('hidden');$('loginView').classList.remove('hidden');$('password').value='';$('username').focus()});
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.goto)));
$('newWorkerBtn').addEventListener('click',()=>openWorkerDialog(null));
$('closeWorkerDialog').addEventListener('click',()=>$('workerDialog').close());$('cancelWorkerBtn').addEventListener('click',()=>$('workerDialog').close());
$('workersTable').addEventListener('click',e=>{const b=e.target.closest('[data-edit-worker]');if(b)openWorkerDialog(workerById(b.dataset.editWorker))});
$('workerSearch').addEventListener('input',renderWorkers);$('workerStatusFilter').addEventListener('change',renderWorkers);
$('workerForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.submitter;setBusy(btn,true,'Saving…');
 try{await call('apiSaveWorker',sessionToken,{workerId:$('editWorkerId').value,name:$('workerName').value,trade:$('workerTrade').value,dailySalary:$('workerSalary').value,mobile:$('workerMobile').value,joiningDate:$('workerJoining').value,status:$('workerState').value});$('workerDialog').close();await refreshData();showToast('Worker saved successfully.')}
 catch(err){showToast(err.message,true)}finally{setBusy(btn,false)}
});
$('attendanceDate').value=localDate();$('attendanceDate').addEventListener('change',renderAttendance);
$('loadAttendanceBtn').addEventListener('click',renderAttendance);
$('attendanceTable').addEventListener('click',async e=>{
 const b=e.target.closest('[data-save-attendance]');if(!b)return;const id=b.dataset.saveAttendance;setBusy(b,true,'Saving…');
 try{const row=b.closest('tr');const result=await call('apiSaveAttendance',sessionToken,{workerId:id,date:$('attendanceDate').value,status:row.querySelector('[data-status]').value,remarks:row.querySelector('[data-remarks]').value});await refreshData();showToast('Attendance saved. Earned today: '+money(result.earnedAmount))}
 catch(err){showToast(err.message,true)}finally{setBusy(b,false)}
});
$('paymentWorker').addEventListener('change',updatePaymentBalance);
$('paymentForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.submitter;setBusy(btn,true,'Saving…');
 try{await call('apiSavePayment',sessionToken,{workerId:$('paymentWorker').value,date:$('paymentDate').value,amount:$('paymentAmount').value,mode:$('paymentMode').value,remarks:$('paymentRemarks').value});$('paymentAmount').value='';$('paymentRemarks').value='';await refreshData();showToast('Payment recorded successfully.')}
 catch(err){showToast(err.message,true)}finally{setBusy(btn,false)}
});
function runReport(){
 const from=$('reportFrom').value||'2000-01-01',to=$('reportTo').value||localDate();
 call('apiGetReport',sessionToken,from,to).then(data=>{currentReport=data;renderReportTable()}).catch(err=>showToast(err.message,true));
}
function renderReportTable(){
 const q=($('reportSearch').value||'').toLowerCase();
 const rows=currentReport.filter(r=>(r.name+' '+r.trade+' '+r.workerId).toLowerCase().includes(q));
 $('reportsTable').innerHTML=rows.map(r=>`<tr><td><span class="worker-name">${esc(r.name)}</span><span class="subtext">${esc(r.workerId)}</span></td><td>${esc(r.trade)}</td><td>${r.present}</td><td>${r.halfDays}</td><td>${r.absent}</td><td>${money(r.earnedInRange)}</td><td>${money(r.paidInRange)}</td><td>${money(r.totalEarned)}</td><td>${money(r.totalPaid)}</td><td class="due">${money(r.pendingDues)}</td></tr>`).join('')||'<tr><td colspan="10" class="empty">No matching records.</td></tr>';
}
$('runReportBtn').addEventListener('click',runReport);$('reportSearch').addEventListener('input',renderReportTable);
$('exportCsvBtn').addEventListener('click',()=>{
 const headers=['Worker ID','Worker','Trade','Present','Half Days','Absent','Leave','Earned in range','Paid in range','Total earned','Total paid','Pending dues'];
 const rows=currentReport.filter(r=>(r.name+' '+r.trade+' '+r.workerId).toLowerCase().includes(($('reportSearch').value||'').toLowerCase())).map(r=>[r.workerId,r.name,r.trade,r.present,r.halfDays,r.absent,r.leave,r.earnedInRange,r.paidInRange,r.totalEarned,r.totalPaid,r.pendingDues]);
 const csv=[headers,...rows].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='perwez-worker-report.csv';a.click();URL.revokeObjectURL(url);
});
$('printReportBtn').addEventListener('click',()=>{showPage('reports');window.print()});
$('paymentDate').value=localDate();$('reportTo').value=localDate();$('reportFrom').value=localDate(new Date(today.getFullYear(),today.getMonth(),1));$('year').textContent=today.getFullYear();
$('passwordForm').addEventListener('submit',async e=>{
 e.preventDefault();if($('newPassword').value!==$('confirmPassword').value){showToast('New passwords do not match.',true);return}
 const btn=e.submitter;setBusy(btn,true,'Updating…');
 try{await call('apiChangePassword',sessionToken,$('currentPassword').value,$('newPassword').value);$('passwordForm').reset();showToast('Password changed. Please log out and log in again.');}
 catch(err){showToast(err.message,true)}finally{setBusy(btn,false)}
});
// Do not restore a cached session token automatically: CacheService session tokens can expire.
sessionStorage.removeItem('pa_session');

