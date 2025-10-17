const LS_KEY='payments_v3';
function savePayments(payments){ localStorage.setItem(LS_KEY,JSON.stringify(payments)); }
function loadPayments(){ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }
function generateId(){ return 'p_'+Math.random().toString(36).substr(2,9); }
