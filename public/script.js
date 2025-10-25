// ---------------- Supabase setup ----------------
  const supabaseUrl = "https://mqzawrkklhxspurkddhy.supabase.co";
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';
  const supabase = supabase.createClient("https://mqzawrkklhxspurkddhy.supabase.co",'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xemF3cmtrbGh4c3B1cmtkZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDczNDMsImV4cCI6MjA3NjIyMzM0M30.2GGjMG2jM1o89wb__u_D6-xHwjVG57VDSYf8rzQcGss';

// DOM Elements
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const addPaymentBtn = document.getElementById("addPaymentBtn");
const logoutBtn = document.getElementById("logoutBtn");
const paymentsTable = document.getElementById("paymentsTable");
const welcome = document.getElementById("welcome");

// Track current user
let currentUser = null;

// Register User
registerBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else alert("Registration successful! Please check your email.");
});

// Login User
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
  else {
    currentUser = data.user;
    loadApp();
  }
});

// Logout User
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  currentUser = null;
  appSection.classList.add("hidden");
  authSection.classList.remove("hidden");
});

// Load App
async function loadApp() {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  welcome.textContent = `Welcome, ${currentUser.email}`;
  await loadPayments();
}

// Load Payments
async function loadPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Failed to load payments.");
  } else {
    paymentsTable.innerHTML = "";
    data.forEach(p => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>$${p.amount}</td>
        <td>${p.description}</td>
        <td>${new Date(p.created_at).toLocaleString()}</td>
      `;
      paymentsTable.appendChild(row);
    });
  }
}

// Add Payment
addPaymentBtn.addEventListener("click", async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value;

  if (!amount || !description) return alert("Please fill in all fields.");

  const { error } = await supabase.from("payments").insert([
    { amount, description, user_id: currentUser.id }
  ]);

  if (error) alert(error.message);
  else {
    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
    await loadPayments();
  }
});
