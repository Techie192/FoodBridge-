/* ===============================
   SESSION CHECK
================================ */
document.addEventListener("DOMContentLoaded", function () {

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const isAuthPage =
        window.location.pathname === "/" ||
        window.location.pathname.includes("index") ||
        window.location.pathname.includes("auth");

    if (!isLoggedIn && !isAuthPage) {
        window.location.href = "index.html";
        return;
    }

    /* ===============================
       LOGIN / SIGNUP (ONLY ON AUTH PAGE)
    ================================ */
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");

    if (loginForm && signupForm) {

        window.showLogin = function () {
            loginForm.classList.remove("hidden");
            signupForm.classList.add("hidden");

            loginBtn.classList.add("active");
            signupBtn.classList.remove("active");
        };

        window.showSignup = function () {
            signupForm.classList.remove("hidden");
            loginForm.classList.add("hidden");

            signupBtn.classList.add("active");
            loginBtn.classList.remove("active");
        };

        // Mock login/signup removed in favor of API logic in auth.html or below
    }
});

/* ===============================
   POPUP MODAL
================================ */
function showModal(message) {
    const modal = document.getElementById("popupModal");
    const modalMessage = document.getElementById("modalMessage");
    if (!modal) return;

    modalMessage.innerText = message;
    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById("popupModal");
    if (modal) modal.style.display = "none";
}

/* ===============================
   NAVIGATION
================================ */
function goHome() {
    window.location.href = "dashboard.html";
}

function go(page) {
    window.location.href = page;
}

/* ===============================
   LOGOUT
================================ */
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

/* ===============================
   PROFILE DROPDOWN (FIXED)
================================ */
function toggleProfile(event) {
    if (event) event.stopPropagation();

    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) {
        dropdown.classList.toggle("hidden");
    }
}

/* CLOSE DROPDOWN WHEN CLICKING OUTSIDE */
document.addEventListener("click", function (e) {
    const menu = document.querySelector(".profile-menu");
    const dropdown = document.getElementById("profileDropdown");

    if (menu && dropdown && !menu.contains(e.target)) {
        dropdown.classList.add("hidden");
    }
});

/* ===============================
   ROLE-BASED GST FIELD DISPLAY + SIGNUP/LOGIN API
================================ */
const roleSelect = document.getElementById("role");
const gstInput = document.getElementById("gst");

if (roleSelect && gstInput) {
    roleSelect.addEventListener("change", e => {
        gstInput.style.display = e.target.value === "restaurant" ? "block" : "none";
    });
}

// <span class="material-symbols-outlined">label_important</span> Toggle login/signup (kept separate for new API)
function showLogin() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");

    if (loginForm && signupForm) {
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        if (loginBtn) loginBtn.classList.add("active");
        if (signupBtn) signupBtn.classList.remove("active");
    }
}

function showSignup() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");

    if (loginForm && signupForm) {
        signupForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        if (signupBtn) signupBtn.classList.add("active");
        if (loginBtn) loginBtn.classList.remove("active");
    }
}

// <span class="material-symbols-outlined">lock</span> Login via API
if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const role = roleSelect ? roleSelect.value : null;

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();

        // <span class="material-symbols-outlined">label_important</span> Show error for unverified account
        if (data.message && data.message.includes("not verified")) {
            alert("Admin verification pending ⏳");
            return;
        }

        alert(data.message);
        if (res.ok && data.token) localStorage.setItem("token", data.token);
    });
}

// ✏️ Signup via API
if (document.getElementById("signupForm")) {
    document.getElementById("signupForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        const role = roleSelect ? roleSelect.value : null;
        const gst = gstInput ? gstInput.value : null;

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
                gstNumber: role === "restaurant" ? gst : null
            })
        });

        const data = await res.json();
        alert(data.message);
    });
}

// <span class="material-symbols-outlined">circle</span> Accept food from dashboard (frontend validation for quantity ≥ 3)
async function acceptFood(foodId, quantity) {
    if (quantity < 3) {
        alert("Minimum quantity is 3");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) return alert("Please login first");

    try {
        const res = await fetch(`/api/food/claim/${foodId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();
        alert(data.message);
        location.reload();
    } catch {
        alert("Server error. Try again.");
    }
}