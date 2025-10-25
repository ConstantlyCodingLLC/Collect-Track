import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const supabaseUrl = "https://mqzawrkklhxspurkddhy.supabase.co";
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';
  const supabase = supabase.createClient("https://mqzawrkklhxspurkddhy.supabase.co",'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';

=
const user = JSON.parse(localStorage.getItem("sb_user"));
if (!user) window.location.href = "index.html"; // redirect if not logged in

document.getElementById("welcome").textContent = `Welcome, ${user.email}`;
const paymentsTable = document.getElementById("paymentsTable");

// 🔹 Load payments
async function loadPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error loading payments: " + error.message);
    return;
  }

  paymentsTable.innerHTML = "";
  data.forEach((p) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>$${p.amount}</td>
      <td>${p.description}</td>
      <td>${new Date(p.created_at).toLocaleString()}</td>
    `;
    paymentsTable.appendChild(row);
  });
}

// 🔹 Add payment
document.getElementById("addPaymentBtn").addEventListener("click", async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();

  if (!amount || !description) {
    alert("Please fill out both fields.");
    return;
  }

  const { error } = await supabase.from("payments").insert([
    { amount, description, user_id: user.id },
  ]);

  if (error) {
    alert(error.message);
  } else {
    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
    loadPayments();
  }
});

// 🔹 Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("sb_user");
  window.location.href = "index.html";
});

loadPayments();
