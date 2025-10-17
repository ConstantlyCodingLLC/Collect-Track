function exportCSV(payments){
  if(!payments.length){ alert('No data to export'); return; }
  const csv = ['DatePaid,Invoice,Amount,DepositedDate,Customer'].concat(
    payments.map(p=>`${p.datePaid},${p.invoice},${p.amount},${p.depositedDate||''},${p.customer}`)
  ).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='payments.csv'; a.click(); URL.revokeObjectURL(url);
}

function importCSV(file, callback){
  const reader=new FileReader();
  reader.onload=e=>{
    const lines=e.target.result.split('\n').filter(Boolean);
    const data=[];
    for(let i=1;i<lines.length;i++){
      const [datePaid,invoice,amount,depositedDate,customer]=lines[i].split(',');
      data.push({id:generateId(), datePaid, invoice, amount:Number(amount), depositedDate, customer});
    }
    callback(data);
  };
  reader.readAsText(file);
}
