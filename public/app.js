let payments=loadPayments();
const paymentsBody=document.getElementById('paymentsBody');
const emptyNotice=document.getElementById('emptyNotice');

const addBtn=document.getElementById('addBtn');
const modal=document.getElementById('modal');
const paymentForm=document.getElementById('paymentForm');
const cancelModal=document.getElementById('cancelModal');
const searchInput=document.getElementById('search');
const fromDate=document.getElementById('fromDate');
const toDate=document.getElementById('toDate');
const filterDeposited=document.getElementById('filterDeposited');
const exportCsvBtn=document.getElementById('exportCsvBtn');
const importFile=document.getElementById('importFile');
const clearAll=document.getElementById('clearAll');

let editingId=null;

function openModal(){ modal.classList.add('show'); }
function closeModal(){ modal.classList.remove('show'); paymentForm.reset(); editingId=null; }

function render(){
  const filterList=payments.filter(p=>{
    if(searchInput.value && !p.invoice.toLowerCase().includes(searchInput.value.toLowerCase()) && !p.customer.toLowerCase().includes(searchInput.value.toLowerCase())) return false;
    if(fromDate.value && p.datePaid<fromDate.value) return false;
    if(toDate.value && p.datePaid>toDate.value) return false;
    if(filterDeposited.value==='yes' && !p.depositedDate) return false;
    if(filterDeposited.value==='no' && p.depositedDate) return false;
    return true;
  });
  paymentsBody.innerHTML='';
  if(!filterList.length){ emptyNotice.style.display='block'; return; } else emptyNotice.style.display='none';
  filterList.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${p.datePaid}</td>
      <td>${p.invoice}</td>
      <td>${p.amount.toLocaleString('en-US',{style:'currency',currency:'USD'})}</td>
      <td>${p.depositedDate||''}</td>
      <td>${p.customer}</td>
      <td>${p.depositedDate?'<span class="deposited">Deposited</span>':'<span class="not-deposited">Not Deposited</span>'}</td>
      <td>
        <button onclick="editPayment('${p.id}')">Edit</button>
        <button onclick="toggleDeposited('${p.id}')">${p.depositedDate?'Unset':'Mark'}</button>
        <button onclick="deletePayment('${p.id}')">Delete</button>
      </td>`;
    paymentsBody.appendChild(tr);
  });
  savePayments(payments);
}

function editPayment(id){
  const p=payments.find(x=>x.id===id);
  if(!p) return;
  editingId=id;
  paymentForm.datePaid.value=p.datePaid;
  paymentForm.invoice.value=p.invoice;
  paymentForm.amount.value=p.amount;
  paymentForm.depositedDate.value=p.depositedDate;
  paymentForm.customer.value=p.customer;
  openModal();
}

function toggleDeposited(id){
  const p=payments.find(x=>x.id===id);
  if(!p) return;
  p.depositedDate=p.depositedDate?'':new Date().toISOString().split('T')[0];
  render();
}

function deletePayment(id){
  if(confirm('Delete this payment?')){ payments=payments.filter(p=>p.id!==id); render(); }
}

addBtn.addEventListener('click',()=>openModal());
cancelModal.addEventListener('click',()=>closeModal());
paymentForm.addEventListener('submit',e=>{
  e.preventDefault();
  const obj={
    datePaid:paymentForm.datePaid.value,
    invoice:paymentForm.invoice.value,
    amount:Number(paymentForm.amount.value),
    depositedDate:paymentForm.depositedDate.value,
    customer:paymentForm.customer.value
  };
  if(editingId){ const idx=payments.findIndex(p=>p.id===editingId); payments[idx]=Object.assign({},payments[idx],obj); }
  else{ obj.id=generateId(); payments.push(obj); }
  render(); closeModal();
});

searchInput.addEventListener('input',render);
fromDate.addEventListener('change',render);
toDate.addEventListener('change',render);
filterDeposited.addEventListener('change',render);

exportCsvBtn.addEventListener('click',()=>exportCSV(payments));
importFile.addEventListener('change',e=>{ importCSV(e.target.files[0],data=>{ payments=payments.concat(data); render(); }); });
clearAll.addEventListener('click',()=>{ if(confirm('Clear all payments?')){ payments=[]; render(); } });

window.editPayment=editPayment;
window.toggleDeposited=toggleDeposited;
window.deletePayment=deletePayment;

render();
