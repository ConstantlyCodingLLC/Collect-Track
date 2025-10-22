// ---------------- Supabase Setup ----------------
const supabaseUrl = 'https://mqzawrkklhxspurkddhy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

let currentUser = null;
async function checkUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  currentUser = user;
  if (currentUser) {
    document.getElementById('currentUser').textContent = 'Logged in as: ' + currentUser.email;
    load();
  }
}
checkUser();

// ---------------- Elements ----------------
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
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const datePaid = document.getElementById('datePaid');
const invoice = document.getElementById('invoice');
const amount = document.getElementById('amount');
const depositedDate = document.getElementById('depositedDate');
const customer = document.getElementById('customer');

let payments = [];
let editingId = null;

// ---------------- Helpers ----------------
function formatCurrency(n){ return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}); }
function formatDate(d){ if(!d) return ''; if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; const dt=new Date(d); if(isNaN(dt)) return d; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }

// ---------------- CRUD ----------------
async function load() {
  if(!currentUser) return;
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) console.error(error);
  else payments = data || [];
  render();
}

async function saveNewTransaction(obj) {
  obj.user_id = currentUser.id;
  const { error } = await supabase.from('transactions').insert([obj]);
  if (error) alert('Error saving: ' + error.message);
}

async function updateTransaction(id, obj) {
  const { error } = await supabase.from('transactions').update(obj).eq('id', id);
  if (error) alert('Error updating: ' + error.message);
}

async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) alert('Error deleting: ' + error.message);
}

// ---------------- Payment Actions ----------------
async function addPayment(obj){
  obj.datePaid = formatDate(obj.datePaid);
  obj.depositedDate = obj.depositedDate ? formatDate(obj.depositedDate) : null;
  obj.amount = Number(obj.amount)||0;
  obj.status = obj.depositedDate ? 'cleared' : 'pending';
  await saveNewTransaction(obj);
  await load();
}

async function updatePayment(id,obj){
  obj.datePaid = formatDate(obj.datePaid);
  obj.depositedDate = obj.depositedDate ? formatDate(obj.depositedDate) : null;
  obj.amount = Number(obj.amount)||0;
  await updateTransaction(id,obj);
  await load();
}

async function removePayment(id){ await deleteTransaction(id); await load(); }

function getFiltered(){
  const q=searchInput.value.toLowerCase(), from=fromDate.value||null, to=toDate.value||null, depos=filterDeposited.value;
  return payments.filter(p=>{
    if(q && !(p.invoice.toLowerCase().includes(q)||p.customer.toLowerCase().includes(q))) return false;
    if(from && p.datePaid<from) return false;
    if(to && p.datePaid>to) return false;
    if(depos==='yes' && !p.depositedDate) return false;
    if(depos==='no' && p.depositedDate) return false;
    return true;
  });
}

function render(){
  const list=getFiltered();
  paymentsBody.innerHTML='';
  if(list.length===0){ emptyNotice.style.display='block'; totalDisplayed.textContent=''; return; }
  emptyNotice.style.display='none';
  list.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${p.datePaid}</td>
      <td>${p.invoice}</td>
      <td>${formatCurrency(p.amount)}</td>
      <td>${p.depositedDate||''}</td>
      <td>${p.customer}</td>
      <td>${p.depositedDate?'Deposited':'Not Deposited'}</td>
      <td>
        <button data-action="edit" data-id="${p.id}" class="btn-ghost">Edit</button>
        <button data-action="toggle" data-id="${p.id}" class="btn-ghost">${p.depositedDate?'Unset':'Mark'} Deposited</button>
        <button data-action="delete" data-id="${p.id}" class="btn-ghost">Delete</button>
      </td>`;
    paymentsBody.appendChild(tr);
  });
  const total=list.reduce((s,p)=>s+Number(p.amount||0),0);
  totalDisplayed.textContent=formatCurrency(total);
}

// ---------------- Events ----------------
addBtn.addEventListener('click',()=>{ paymentForm.reset(); editingId=null; modal.classList.add('show'); });
closeModal.addEventListener('click',()=>{ modal.classList.remove('show'); });
paymentForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const payload={datePaid:datePaid.value,invoice:invoice.value.trim(),amount:Number(amount.value),depositedDate:depositedDate.value||null,customer:customer.value.trim()};
  if(!payload.invoice||!payload.customer||!payload.datePaid||isNaN(payload.amount)){ alert('Fill required fields'); return; }
  editingId?await updatePayment(editingId,payload):await addPayment(payload);
  modal.classList.remove('show'); paymentForm.reset();
});
saveAndAddAnother.addEventListener('click', async ()=>{
  const payload={datePaid:datePaid.value,invoice:invoice.value.trim(),amount:Number(amount.value),depositedDate:depositedDate.value||null,customer:customer.value.trim()};
  if(!payload.invoice||!payload.customer||!payload.datePaid||isNaN(payload.amount)){ alert('Fill required fields'); return; }
  await addPayment(payload); paymentForm.reset();
});
paymentsBody.addEventListener('click', async e=>{
  const btn=e.target.closest('button'); if(!btn) return;
  const id=btn.dataset.id; const action=btn.dataset.action;
  const p=payments.find(x=>x.id===id);
  if(action==='edit'){ if(!p) return; editingId=p.id; datePaid.value=p.datePaid; invoice.value=p.invoice; amount.value=p.amount; depositedDate.value=p.depositedDate||''; customer.value=p.customer; modal.classList.add('show'); }
  else if(action==='delete'){ if(confirm('Delete this payment?')) await removePayment(id); }
  else if(action==='toggle'){ await updatePayment(id,{depositedDate:p.depositedDate?null:formatDate(new Date())}); }
});

searchInput.addEventListener('input',render);
fromDate.addEventListener('change',render);
toDate.addEventListener('change',render);
filterDeposited.addEventListener('change',render);

exportCsvBtn.addEventListener('click',()=>{
  const rows=[['Date Paid','Invoice','Amount','Deposited Date','Customer','Status']];
  getFiltered().forEach(p=>rows.push([p.datePaid,p.invoice,p.amount,p.depositedDate||'',p.customer,p.depositedDate?'Deposited':'Not Deposited']));
  const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='payments.csv'; a.click(); URL.revokeObjectURL(url);
});

importFile.addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{ 
    const text=reader.result.split(/\r?\n/).slice(1).filter(Boolean);
    text.forEach(async line=>{ const [datePaid,invoice,amount,depositedDate,customer]=line.replace(/"/g,'').split(','); await addPayment({datePaid,invoice,amount,depositedDate:depositedDate||null,customer}); });
    e.target.value='';
  };
  reader.readAsText(file);
});

clearAll.addEventListener('click',async ()=>{ if(confirm('Clear all payments?')){ for(const p of payments) await removePayment(p.id); } });

// ---------------- Auth ----------------
loginBtn.addEventListener('click', async ()=>{
  const email = prompt('Email:'); const password = prompt('Password:');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) alert(error.message); else { currentUser=data.user; document.getElementById('currentUser').textContent='Logged in as: '+currentUser.email; load(); }
});
signupBtn.addEventListener('click', async ()=>{
  const email = prompt('Email:'); const password = prompt('Password:');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if(error) alert(error.message); else alert('Registered! Please log in.'); 
});
