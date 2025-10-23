// ---------------- Supabase setup ----------------
  const supabaseUrl = 'https://mqzawrkklhxspurkddhy.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';
  const supabase = supabase.createClient('https://mqzawrkklhxspurkddhy.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';

// ---------------- Auth elements ----------------
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');

let currentUser = null;

// ---------------- Payment elements ----------------
const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const paymentForm = document.getElementById('paymentForm');
const closeModal = document.getElementById('closeModal');
const saveAndAddAnother = document.getElementById('saveAndAddAnother');
const paymentsBody = document.getElementById('paymentsBody');
const emptyNotice = document.getElementById('emptyNotice');
const searchInput = document.getElementById('search');
const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const filterDeposited = document.getElementById('filterDeposited');
const totalDisplayed = document.getElementById('totalDisplayed');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const importFile = document.getElementById('importFile');
const clearAll = document.getElementById('clearAll');

const datePaid = document.getElementById('datePaid');
const invoice = document.getElementById('invoice');
const amount = document.getElementById('amount');
const depositedDate = document.getElementById('depositedDate');
const customer = document.getElementById('customer');

let payments = [];
let editingId = null;

// ---------------- Auth functions ----------------
async function checkUser() {
  const { data } = await supabase.auth.getUser();
  if(data.user) {
    currentUser = data.user;
    currentUserSpan.textContent = `Logged in as: ${currentUser.email}`;
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    logoutBtn.style.display = 'inline';
    await loadPayments();
  } else {
    currentUser = null;
    currentUserSpan.textContent = '';
    loginBtn.style.display = 'inline';
    signupBtn.style.display = 'inline';
    logoutBtn.style.display = 'none';
  }
}

loginBtn.addEventListener('click', async () => {
  const email = prompt("Enter your email:");
  const password = prompt("Enter your password:");
  if(!email || !password) return alert("Email and password required");
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if(error) return alert(error.message);
  currentUser = data.user;
  checkUser();
});

signupBtn.addEventListener('click', async () => {
  const email = prompt("Enter your email:");
  const password = prompt("Enter your password:");
  if(!email || !password) return alert("Email and password required");
  const { error, data } = await supabase.auth.signUp({ email, password });
  if(error) return alert(error.message);
  alert("Registration successful! Please check your email for confirmation.");
  currentUser = data.user;
  checkUser();
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  checkUser();
});

// ---------------- Helper functions ----------------
function formatCurrency(n){ return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}); }
function formatDate(d){ if(!d) return ''; if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; const dt=new Date(d); if(isNaN(dt)) return d; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }

// ---------------- CRUD functions ----------------
async function loadPayments() {
  if(!currentUser) return;
  const { data, error } = await supabase.from('payments').select('*').order('date_paid', { ascending: false });
  if(error) return alert(error.message);
  payments = data;
  render();
}

async function addPaymentToDB(obj){
  obj.date_paid=formatDate(obj.datePaid);
  obj.deposited_date=obj.depositedDate?formatDate(obj.depositedDate):null;
  const { data, error } = await supabase.from('payments').insert([{
    date_paid: obj.date_paid,
    invoice: obj.invoice,
    amount: obj.amount,
    deposited_date: obj.deposited_date,
    customer: obj.customer,
    created_by: currentUser.id
  }]);
  if(error) return alert(error.message);
  await loadPayments();
}

async function updatePaymentInDB(id,obj){
  obj.date_paid=obj.datePaid?formatDate(obj.datePaid):undefined;
  obj.deposited_date=obj.depositedDate!==undefined?obj.depositedDate?formatDate(obj.depositedDate):null:undefined;
  const { data, error } = await supabase.from('payments').update(obj).eq('id',id);
  if(error) return alert(error.message);
  await loadPayments();
}

async function deletePaymentFromDB(id){
  const { error } = await supabase.from('payments').delete().eq('id',id);
  if(error) alert(error.message);
  await loadPayments();
}

// ---------------- Filter & render ----------------
function getFiltered(){ 
  const q=searchInput.value.toLowerCase(), from=fromDate.value||null, to=toDate.value||null, depos=filterDeposited.value;
  return payments.filter(p=>{
    if(q && !(p.invoice.toLowerCase().includes(q)||p.customer.toLowerCase().includes(q))) return false;
    if(from && p.date_paid<from) return false;
    if(to && p.date_paid>to) return false;
    if(depos==='yes' && !p.deposited_date) return false;
    if(depos==='no' && p.deposited_date) return false;
    return true;
  });
}

function render(){
  const list=getFiltered();
  paymentsBody.innerHTML='';
  if(list.length===0){ emptyNotice.style.display='block'; return; }
  emptyNotice.style.display='none';
  list.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${p.date_paid}</td>
      <td>${p.invoice}</td>
      <td>${formatCurrency(p.amount)}</td>
      <td>${p.deposited_date||''}</td>
      <td>${p.customer}</td>
      <td>${p.deposited_date?'Deposited':'Not Deposited'}</td>
      <td>
        <button data-action="edit" data-id="${p.id}" class="btn-ghost">Edit</button>
        <button data-action="toggle" data-id="${p.id}" class="btn-ghost">${p.deposited_date?'Unset':'Mark'} Deposited</button>
        <button data-action="delete" data-id="${p.id}" class="btn-ghost">Delete</button>
      </td>`;
    paymentsBody.appendChild(tr);
  });
  const total=list.reduce((s,p)=>s+Number(p.amount||0),0);
  totalDisplayed.textContent=formatCurrency(total);
}

// ---------------- Event listeners ----------------
addBtn.addEventListener('click',()=>{
  if(!currentUser) return alert('Please login first');
  paymentForm.reset(); editingId=null;
  modal.classList.add('show');
});
closeModal.addEventListener('click',()=>{ modal.classList.remove('show'); });
paymentForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={datePaid:datePaid.value,invoice:invoice.value.trim(),amount:Number(amount.value),depositedDate:depositedDate.value,customer:customer.value.trim()};
  if(!payload.invoice||!payload.customer||!payload.datePaid||isNaN(payload.amount)) return alert('Fill required fields');
  if(editingId){ await updatePaymentInDB(editingId,payload); editingId=null; } 
  else{ await addPaymentToDB(payload); }
  modal.classList.remove('show'); paymentForm.reset();
});

saveAndAddAnother.addEventListener('click',async ()=>{
  const payload={datePaid:datePaid.value,invoice:invoice.value.trim(),amount:Number(amount.value),depositedDate:depositedDate.value,customer:customer.value.trim()};
  if(!payload.invoice||!payload.customer||!payload.datePaid||isNaN(payload.amount)) return alert('Fill required fields');
  await addPaymentToDB(payload); paymentForm.reset();
});

paymentsBody.addEventListener('click',async e=>{
  const btn=e.target.closest('button'); if(!btn) return;
  const id=btn.dataset.id; const action=btn.dataset.action;
  if(action==='edit'){ const p=payments.find(x=>x.id===id); if(!p) return; editingId=p.id; datePaid.value=p.date_paid; invoice.value=p.invoice; amount.value=p.amount; depositedDate.value=p.deposited_date; customer.value=p.customer; modal.classList.add('show'); }
  else if(action==='delete'){ if(confirm('Delete this payment?')) await deletePaymentFromDB(id); }
  else if(action==='toggle'){ const p=payments.find(x=>x.id===id); await updatePaymentInDB(id,{depositedDate:p.deposited_date?p.deposited_date:''}); }
});

searchInput.addEventListener('input',render);
fromDate.addEventListener('change',render);
toDate.addEventListener('change',render);
filterDeposited.addEventListener('change',render);

exportCsvBtn.addEventListener('click',()=>{
  const rows=[['Date Paid','Invoice','Amount','Deposited Date','Customer','Status']];
  getFiltered().forEach(p=>rows.push([p.date_paid,p.invoice,p.amount,p.deposited_date,p.customer,p.deposited_date?'Deposited':'Not Deposited']));
  const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='payments.csv'; a.click(); URL.revokeObjectURL(url);
});

importFile.addEventListener('change',async e=>{
  const file=e.target.files[0]; if(!file) return;
  const text=await file.text();
  text.split(/\r?\n/).slice(1).filter(Boolean).forEach(async line=>{
    const [datePaid,invoice,amount,depositedDate,customer]=line.replace(/"/g,'').split(',');
    await addPaymentToDB({datePaid,invoice,amount:Number(amount),depositedDate,customer});
  });
  e.target.value='';
});

clearAll.addEventListener('click',async ()=>{ if(confirm('Clear all payments?')){ for(const p of payments) await deletePaymentFromDB(p.id); } });

// ---------------- Init ----------------
checkUser();
