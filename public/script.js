document.addEventListener('DOMContentLoaded', () => {

  // ---------------- Supabase Setup ----------------
  const supabaseUrl = 'https://mqzawrkklhxspurkddhy.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';
  const supabase = supabase.createClient('https://mqzawrkklhxspurkddhy.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';

  // ---------------- Elements ----------------
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const currentUserEl = document.getElementById('currentUser');

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
  let currentUser = null;

  // ---------------- Helpers ----------------
  function formatCurrency(n){ return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}); }
  function formatDate(d){ if(!d) return ''; if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; const dt=new Date(d); if(isNaN(dt)) return d; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }

  // ---------------- Auth ----------------
  async function checkUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    currentUser = user;
    if(currentUser) {
      currentUserEl.textContent = 'Logged in as: '+currentUser.email;
      loginBtn.style.display='none';
      signupBtn.style.display='none';
      logoutBtn.style.display='inline-block';
      load();
    }
  }
  checkUser();

  loginBtn.addEventListener('click', async () => {
    const email = prompt('Email:'); const password = prompt('Password:');
    if(!email || !password) return alert('Fill both fields');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) return alert(error.message);
    currentUser = data.user;
    currentUserEl.textContent='Logged in as: '+currentUser.email;
    loginBtn.style.display='none'; signupBtn.style.display='none'; logoutBtn.style.display='inline-block';
    load();
  });

  signupBtn.addEventListener('click', async () => {
    const email = prompt('Email:'); const password = prompt('Password:');
    if(!email || !password) return alert('Fill both fields');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if(error) return alert(error.message);
    alert('Registered! Please log in.');
  });

  logoutBtn.addEventListener('click', async ()=>{
    await supabase.auth.signOut();
    currentUser = null;
    currentUserEl.textContent = '';
    loginBtn.style.display='inline-block'; signupBtn.style.display='inline-block'; logoutBtn.style.display='none';
    paymentsBody.innerHTML=''; totalDisplayed.textContent=''; emptyNotice.style.display='none';
  });

  // ---------------- CRUD ----------------
  async function load() {
    if(!currentUser) return;
    const { data, error } = await supabase.from('payments').select('*').eq('created_by', currentUser.id).order('created_at', {ascending:false});
    if(error) console.error(error);
    else payments = data || [];
    render();
  }

  async function saveNewTransaction(obj){
    obj.created_by = currentUser.id;
    const { error } = await supabase.from('payments').insert([obj]);
    if(error) alert(error.message);
  }

  async function updateTransaction(id,obj){
    const { error } = await supabase.from('payments').update(obj).eq('id', id);
    if(error) alert(error.message);
  }

  async function deleteTransaction(id){
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if(error) alert(error.message);
  }

  async function addPayment(obj){
    obj.date_paid = formatDate(obj.datePaid);
    obj.deposited_date = obj.depositedDate ? formatDate(obj.depositedDate) : null;
    obj.amount = Number(obj.amount)||0;
    await saveNewTransaction(obj);
    await load();
  }

  async function updatePayment(id,obj){
    obj.date_paid = formatDate(obj.datePaid);
    obj.deposited_date = obj.depositedDate ? formatDate(obj.depositedDate) : null;
    obj.amount = Number(obj.amount)||0;
    await updateTransaction(id,obj);
    await load();
  }

  async function removePayment(id){ await deleteTransaction(id); await load(); }

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

  // ---------------- Modal & Table Events ----------------
  addBtn.addEventListener('click',()=>{ paymentForm.reset(); editingId=null; modal.classList.add('show'); });
  closeModal.addEventListener('click',()=>{ modal.classList.remove('show'); paymentForm.reset(); });
  paymentForm.addEventListener('submit', async e=>{
    e.preventDefault();
    const payload={datePaid:datePaid.value,invoice:invoice.value.trim(),amount:Number(amount.value),depositedDate:depositedDate.value||null,customer:customer.value.trim()};
    if(!payload.invoice||!payload.customer||!payload.datePaid||isNaN(payload.amount)){ alert('Fill required fields'); return; }
    editingId ? await updatePayment(editingId,payload) : await addPayment(payload);
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
    if(action==='edit'){ const p=payments.find(x=>x.id===id); if(!p) return; editingId=p.id; datePaid.value=p.date_paid; invoice.value=p.invoice; amount.value=p.amount; depositedDate.value=p.deposited_date||''; customer.value=p.customer; modal.classList.add('show'); }
    else if(action==='delete'){ if(confirm('Delete this payment?')) await removePayment(id); }
    else if(action==='toggle'){ const p=payments.find(x=>x.id===id); await updatePayment(id,{depositedDate:p.deposited_date?'':formatDate(new Date())}); }
  });

  searchInput.addEventListener('input', render);
  fromDate.addEventListener('change', render);
  toDate.addEventListener('change', render);
  filterDeposited.addEventListener('change', render);

});
