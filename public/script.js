(() => {
  const LS_KEY = 'payments_v2';
  let payments = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  let editingId = null;

  // DOM Elements
  const modal = document.getElementById('modal');
  const paymentForm = document.getElementById('paymentForm');
  const datePaid = document.getElementById('datePaid');
  const invoice = document.getElementById('invoice');
  const amount = document.getElementById('amount');
  const depositedDate = document.getElementById('depositedDate');
  const customer = document.getElementById('customer');
  const addPaymentBtn = document.getElementById('addPaymentBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const paymentsBody = document.getElementById('paymentsBody');
  const emptyNotice = document.getElementById('emptyNotice');
  const searchInput = document.getElementById('search');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const filterDeposited = document.getElementById('filterDeposited');
  const summaryCount = document.getElementById('summaryCount');
  const summaryTotal = document.getElementById('summaryTotal');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const importFile = document.getElementById('importFile');
  const clearAllBtn = document.getElementById('clearAllBtn');

  function save(){ localStorage.setItem(LS_KEY, JSON.stringify(payments)); }

  function uid(){ return 'p_' + Math.random().toString(36).slice(2,10); }

  function formatCurrency(n){ return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'}); }

  function openModal(){ modal.classList.add('show'); datePaid.focus(); }
  function closeModal(){ modal.classList.remove('show'); paymentForm.reset(); editingId = null; }

  function render(){
    const query = searchInput.value.toLowerCase();
    const from = fromDate.value, to = toDate.value, depos = filterDeposited.value;
    const filtered = payments.filter(p=>{
      if(query && !(p.invoice.toLowerCase().includes(query)||p.customer.toLowerCase().includes(query))) return false;
      if(from && p.datePaid < from) return false;
      if(to && p.datePaid > to) return false;
      if(depos==='yes' && !p.depositedDate) return false;
      if(depos==='no' && p.depositedDate) return false;
      return true;
    });

    paymentsBody.innerHTML = '';
    if(filtered.length===0){ emptyNotice.style.display='block'; } 
    else{ emptyNotice.style.display='none';
      filtered.forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.datePaid}</td><td>${p.invoice}</td><td>${formatCurrency(p.amount)}</td><td>${p.depositedDate||''}</td><td>${p.customer}</td>
        <td>${p.depositedDate?'Deposited':'Not Deposited'}</td>
        <td>
          <button data-action="edit" data-id="${p.id}">Edit</button>
          <button data-action="toggle" data-id="${p.id}">${p.depositedDate?'Unset':'Mark Deposited'}</button>
          <button data-action="delete" data-id="${p.id}">Delete</button>
        </td>`;
        paymentsBody.appendChild(tr);
      });
    }

    summaryCount.textContent = `${payments.length} payments`;
    summaryTotal.textContent = formatCurrency(payments.reduce((s,p)=>s+p.amount,0));
  }

  function addPayment(p){ p.id = uid(); payments.unshift(p); save(); render(); }
  function updatePayment(id, changes){ payments = payments.map(p=>p.id===id?{...p,...changes}:p); save(); render(); }
  function deletePayment(id){ payments = payments.filter(p=>p.id!==id); save(); render(); }

  addPaymentBtn.onclick = ()=>{ openModal(); };
  cancelBtn.onclick = closeModal;

  paymentForm.onsubmit = e=>{
    e.preventDefault();
    const p = { datePaid:datePaid.value, invoice:invoice.value.trim(), amount:Number(amount.value), depositedDate:depositedDate.value, customer:customer.value.trim() };
    if(editingId){ updatePayment(editingId,p); } else { addPayment(p); }
    closeModal();
  };

  paymentsBody.onclick = e=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    if(action==='edit'){ const p = payments.find(x=>x.id===id); if(!p) return;
      editingId = id; datePaid.value=p.datePaid; invoice.value=p.invoice; amount.value=p.amount; depositedDate.value=p.depositedDate; customer.value=p.customer;
      openModal();
    } else if(action==='toggle'){ const p = payments.find(x=>x.id===id); updatePayment(id,{depositedDate:p.depositedDate?'':(new Date()).toISOString().slice(0,10)}); }
    else if(action==='delete'){ if(confirm('Delete?')) deletePayment(id); }
  };

  searchInput.oninput = fromDate.onchange = toDate.onchange = filterDeposited.onchange = render;

  exportCsvBtn.onclick = ()=>{
    if(!payments.length){ alert('No payments to export'); return; }
    const csv = ['invoice,date_paid,amount,deposited_date,customer',...payments.map(p=>`${p.invoice},${p.datePaid},${p.amount},${p.depositedDate||''},${p.customer}`)].join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='payments.csv'; a.click(); URL.revokeObjectURL(url);
  };

  importFile.onchange = e=>{
    const f=e.target.files[0]; if(!f)return;
    const reader=new FileReader();
    reader.onload=()=>{ const rows=reader.result.split(/\r?\n/).filter(r=>r); rows.slice(1).forEach(r=>{ const [invoice,date,amt,depos,cust]=r.split(','); if(!invoice||!date||isNaN(amt)) return; addPayment({invoice,datePaid:date,amount:Number(amt),depositedDate:depos||'',customer:cust||''}); }); render(); };
    reader.readAsText(f); importFile.value='';
  };

  clearAllBtn.onclick = ()=>{ if(confirm('Clear all?')){ payments=[]; save(); render(); }; };

  render();
})();
