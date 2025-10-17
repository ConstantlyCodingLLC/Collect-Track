const LS_KEY = 'payments_v2';

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

// ---- Helpers ----
function uid(){ return 'p_'+Math.random().toString(36).slice(2,10); }
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(payments)); }
function load(){ payments = JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }
function formatCurrency(n){ return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}); }
function formatDate(d){ if(!d) return ''; if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; const dt=new Date(d); if(isNaN(dt)) return d; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }
function clearForm(){ paymentForm.reset(); editingId=null; }

// ---- CRUD ----
function addPayment(obj){
  obj.id=uid();
  obj.datePaid=formatDate(obj.datePaid);
  obj.depositedDate=obj.depositedDate?formatDate(obj.depositedDate):'';
  obj.amount=Number(obj.amount)||0;
  payments.unshift(obj);
  save();
  render();
}

function updatePayment(id,obj){
  const idx = payments.findIndex(p=>p.id===id);
  if(idx===-1) return;
  payments[idx] = Object.assign({},payments[idx],obj,{
    datePaid: formatDate(obj.datePaid||payments[idx].datePaid),
    depositedDate: obj.depositedDate===undefined?payments[idx].depositedDate:(obj.depositedDate?formatDate(obj.depositedDate):''),
    amount: Number(obj.amount||payments[idx].amount)
  });
  save();
  render();
}

function removePayment(id){ payments=payments.filter(p=>p.id!==id); save(); render(); }

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
  if(list.length===0){ emptyNotice.style.display='block'; return; }
  emptyNotice.style.display='none';
  list.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${p.datePaid}</td>
      <td>${p.invoice}</td>
      <td>${formatCurrency(p.amount)}</td>
      <td>${p.depositedDate||''}</td>
      <td>${p.customer}</td>
      <td>${p.depositedDate?'<span>Deposited</span>':'<span>Not Deposited</span>'}</td>
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

// ---- Events ----
addBtn.addEventListener('click',()=>{ clearForm(); modal.classList.add('show'); });
closeModal.addEventListener('click',()=>{ modal.classList.remove('show'); clearForm(); });
paymentForm.addEventListener('submit',e=>{
  e.preventDefault();
  const payload={datePaid:datePaid.value,invoice:invoice.value.trim(),amount:Number(amount.value),depositedDate:depositedDate.value||'',customer:customer.value.trim()};
  if(!payload.invoice||!payload.customer||!payload.datePaid||isNaN(payload.amount)){ alert('Fill required fields'); return; }
  editingId?updatePayment(editingId,payload):addPayment(payload);
  modal.classList.remove('show'); clearForm();
});

saveAndAddAnother.addEventListener('click',()=>{
  const payload={datePaid:datePaid.value,invoice:invoice.value.trim(),amount:Number(amount.value),depositedDate:depositedDate.value||'',customer:customer.value.trim()};
  if(!payload.invoice||!payload.customer||!payload.datePaid||isNaN(payload.amount)){ alert('Fill required fields'); return; }
  addPayment(payload); paymentForm.reset();
});

paymentsBody.addEventListener('click',e=>{
  const btn=e.target.closest('button'); if(!btn) return;
  const id=btn.dataset.id; const action=btn.dataset.action;
  if(action==='edit'){ const p=payments.find(x=>x.id===id); if(!p) return; editingId=p.id; datePaid.value=p.datePaid; invoice.value=p.invoice; amount.value=p.amount; depositedDate.value=p.depositedDate; customer.value=p.customer; modal.classList.add('show'); }
  else if(action==='delete'){ if(confirm('Delete this payment?')) removePayment(id); }
  else if(action==='toggle'){ const p=payments.find(x=>x.id===id); updatePayment(id,{depositedDate:p.depositedDate?'':formatDate(new Date())}); }
});

searchInput.addEventListener('input',render);
fromDate.addEventListener('change',render);
toDate.addEventListener('change',render);
filterDeposited.addEventListener('change',render);

exportCsvBtn.addEventListener('click',()=>{
  const rows=[['Date Paid','Invoice','Amount','Deposited Date','Customer','Status']];
  getFiltered().forEach(p=>rows.push([p.datePaid,p.invoice,p.amount,p.depositedDate,p.customer,p.depositedDate?'Deposited':'Not Deposited']));
  const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='payments.csv'; a.click(); URL.revokeObjectURL(url);
});

importFile.addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{ 
    const text=reader.result.split(/\r?\n/).slice(1).filter(Boolean);
    text.forEach(line=>{ const [datePaid,invoice,amount,depositedDate,customer]=line.replace(/"/g,'').split(','); addPayment({datePaid,invoice,amount,depositedDate,customer}); });
    e.target.value='';
  };
  reader.readAsText(file);
});

clearAll.addEventListener('click',()=>{ if(confirm('Clear all payments?')){ payments=[]; save(); render(); } });

// ---- Init ----
load(); render();
