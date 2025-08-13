// --- Regex Patterns for Validation ---
const REGEX = {
    name: /^[A-Za-z\s'-]{2,}$/,
    phone: /^[6-9]\d{9}$/,
    consumerId: /^[A-Za-z0-9-]{5,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /.{8,}/
};

// --- API URL ---
const API_URL = 'http://localhost/powerbill-backend/api';

// --- Global State ---
let isLoginView = true;
let isAuthenticated = false;

// --- DOM Element Variables ---
let authContainer, dashboardContainer, authForm, authTitle, authSwitchContainer, signupFields, authErrorElement, logoutBtn;

// =========================================================================
// === Helper Functions ====================================================
// =========================================================================
function setFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message || '';
        errorElement.classList.toggle('visible', !!message);
    }
    if (inputElement) {
        inputElement.classList.toggle('invalid-input', !!message);
    }
}

function clearAllFieldErrors() {
    setFieldError('name', null);
    setFieldError('phone', null);
    setFieldError('consumer-number', null);
    setFieldError('email', null);
    setFieldError('password', null);
    if (authErrorElement) authErrorElement.textContent = '';
    document.querySelectorAll('input.invalid-input').forEach(input => {
        input.classList.remove('invalid-input');
    });
}

function resetAuthFormFields() {
    authForm?.reset();
}

const getFetchOptions = (method = 'GET', body = null) => {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Important for session-based auth
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return options;
};

// =========================================================================
// === UI Switching and Display Logic ======================================
// =========================================================================

function showDashboard() {
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    fetchDashboardData();
}

function showLogin() {
    isAuthenticated = false;
    authContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
}

async function fetchDashboardData() {
    console.log("Fetching dashboard data...");
    try {
        const response = await fetch(`${API_URL}/dashboard.php`, getFetchOptions('GET'));
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Session expired or invalid, force logout/show login
                console.log("Session invalid. Showing login page.");
                showLogin(); // Go back to login, don't call handleLogout to avoid API loop
            }
            throw new Error(data.message || 'Failed to fetch dashboard data.');
        }

        updateDashboardUI(data);

    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        // If fetching data fails after login, it could be a session issue.
        // Forcing a "logout" to clear state and show login is a safe recovery.
        handleLogout();
    }
}

function updateDashboardUI(data) {
    console.log("Updating dashboard UI with:", data);

    // Consumer Info
    document.querySelector('[data-value="consumerId"]').textContent = data.consumerInfo.consumerId || 'N/A';
    document.querySelector('[data-value="meterNumber"]').textContent = data.consumerInfo.meterNumber || 'N/A';
    document.querySelector('[data-value="supplyType"]').textContent = data.consumerInfo.supplyType || 'N/A';
    document.querySelector('[data-value="sanctionedLoad"]').textContent = data.consumerInfo.sanctionedLoad || 'N/A';
    document.querySelector('[data-value="name"]').textContent = data.consumerInfo.name || 'N/A';
    document.querySelector('[data-value="email"]').textContent = data.consumerInfo.email || 'N/A';


    // Bill Summary
    const bill = data.currentBill;
    const billCard = document.querySelector('.bill-card');
    billCard.querySelector('[data-value="dueDate"]').textContent = `Due Date: ${bill.dueDate}`;
    billCard.querySelector('[data-value="amount"]').textContent = `₹${bill.amount.toFixed(2)}`;
    billCard.querySelector('[data-value="period"]').textContent = `Bill Period: ${bill.period}`;
    billCard.classList.toggle('unpaid', bill.status === 'unpaid');
    billCard.querySelector('.pay-now-btn').style.display = bill.status === 'unpaid' ? 'inline-flex' : 'none';

    // Payment Alert
    const paymentAlert = document.getElementById('payment-alert');
    if (bill.status === 'unpaid') {
        paymentAlert.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div class="alert-content">
                <h3>Payment Due</h3>
                <p>Your bill payment of ₹${bill.amount.toFixed(2)} is pending.</p>
            </div>
            <button class="btn btn-danger pay-now-btn">Pay Now</button>
        `;
        paymentAlert.style.display = 'flex';
    } else {
        paymentAlert.style.display = 'none';
    }
    // TODO: Add rendering for slabs, components, graph later
}

// =========================================================================
// === Event Handlers ======================================================
// =========================================================================

async function handleAuth(event) {
    event.preventDefault();
    if (!validateAuthForm()) return;

    const submitButton = authForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    authErrorElement.textContent = '';

    const formData = new FormData(authForm);
    let data = Object.fromEntries(formData.entries());
    let endpoint = '';

    if (isLoginView) {
        endpoint = `${API_URL}/signin.php`;
        data = { email: data.email, password: data.password };
    } else {
        endpoint = `${API_URL}/signup.php`;
        data.consumerId = data['consumer-number'];
        delete data['consumer-number'];
    }

    try {
        // For login, we will need credentials: 'include'
        const response = await fetch(endpoint, getFetchOptions('POST', data));
        const result = await response.json();

        if (!response.ok) {
            authErrorElement.textContent = result.message || `An error occurred.`;
            throw new Error(result.message);
        }

        // --- Handle Success ---
        if (isLoginView) {
            // Successful login!
            isAuthenticated = true;
            showDashboard();
        } else {
            // Successful signup
            alert(result.message || 'Signup successful! Please sign in.');
            toggleAuthView(); // Switch to login view
            resetAuthFormFields();
        }

    } catch (error) {
        console.error('Authentication error:', error);
        if (!authErrorElement.textContent) {
            authErrorElement.textContent = 'A network error occurred. Please try again.';
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = isLoginView ? 'Sign In' : 'Sign Up';
    }
}

// --- Toggles between Sign In and Sign Up views ---
function toggleAuthView(event) {
    if (event) event.preventDefault();
    isLoginView = !isLoginView;

    // Update Title, Button, and Link Text
    authTitle.textContent = isLoginView ? 'Sign in to your account' : 'Create your account';
    authForm.querySelector('button[type="submit"]').textContent = isLoginView ? 'Sign In' : 'Sign Up';
    authSwitchContainer.innerHTML = isLoginView
        ? `Don't have an account? <a href="#" id="auth-switch-btn">Sign up</a>`
        : `Already have an account? <a href="#" id="auth-switch-btn">Sign in</a>`;

    // Re-attach listener to the newly created link
    const newSwitchBtn = document.getElementById('auth-switch-btn');
    if (newSwitchBtn) {
        newSwitchBtn.addEventListener('click', toggleAuthView);
    }

    // Show/hide signup-specific fields
    signupFields.classList.toggle('hidden', isLoginView);

    // Clear any errors and form fields
    clearAllFieldErrors();
    resetAuthFormFields();
}


// --- Frontend Form Validation ---
function validateAuthForm() {
    let isValid = true;
    clearAllFieldErrors();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Ensure elements exist before trying to access their value
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!isLoginView) {
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const consumerIdInput = document.getElementById('consumer-number');

        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const consumerId = consumerIdInput ? consumerIdInput.value.trim() : '';

        if (!REGEX.name.test(name)) {
            setFieldError('name', 'Please enter a valid full name.');
            isValid = false;
        }
        if (!REGEX.phone.test(phone)) {
            setFieldError('phone', 'Enter a valid 10-digit mobile number.');
            isValid = false;
        }
        if (!REGEX.consumerId.test(consumerId)) {
            setFieldError('consumer-number', 'Enter a valid Consumer ID (min 5 chars).');
            isValid = false;
        }
    }

    if (!REGEX.email.test(email)) {
        setFieldError('email', 'Please enter a valid email address.');
        isValid = false;
    }
    if (!REGEX.password.test(password)) {
        setFieldError('password', 'Password must be at least 8 characters.');
        isValid = false;
    }

    return isValid;
}


async function handleLogout() {
    console.log("Logging out...");
    try {
        await fetch(`${API_URL}/logout.php`, getFetchOptions('POST'));
    } catch (error) {
        console.error("Logout API call failed:", error);
    } finally {
        // Always clear frontend state and show login page
        showLogin();
    }
}

// =========================================================================
// === Initial Setup (DOM Ready) ===========================================
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // --- Assign DOM Elements ---
    authContainer = document.getElementById('auth-container');
    dashboardContainer = document.getElementById('dashboard-container');
    authForm = document.getElementById('auth-form');
    authTitle = document.getElementById('auth-title');
    authSwitchContainer = document.getElementById('auth-switch-container');
    signupFields = document.getElementById('signup-fields');
    authErrorElement = document.getElementById('auth-error');
    logoutBtn = document.getElementById('logout-btn');

    // --- Attach Initial Event Listeners ---
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }

    const switchBtn = document.getElementById('auth-switch-btn');
    if (switchBtn) {
        switchBtn.addEventListener('click', toggleAuthView);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Initial check to see if user is already logged in (e.g., from a previous session)
    // We'll call fetchDashboardData. If it succeeds, showDashboard will be called inside it.
    // If it fails with 401, it will call showLogin().
    fetchDashboardData();
});