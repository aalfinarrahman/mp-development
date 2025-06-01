// Default credentials
const DEFAULT_CREDENTIALS = {
    admin: {
        username: 'alfin',
        password: 'alfin123',
        role: 'admin'
    },
    user: {
        username: 'user',
        password: 'user123',
        role: 'user'
    }
};

// Initialize authentication system
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (window.location.pathname.includes('login.html')) {
        checkExistingSession();
    } else {
        checkAuthentication();
    }
    
    // Setup login form if on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function checkExistingSession() {
    const currentUser = localStorage.getItem('mp_current_user');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        redirectToDashboard(user.role);
    }
}

function checkAuthentication() {
    const currentUser = localStorage.getItem('mp_current_user');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    const user = JSON.parse(currentUser);
    
    // Check if user is on correct dashboard
    const currentPath = window.location.pathname;
    if (user.role === 'admin' && currentPath.includes('user-dashboard.html')) {
        window.location.href = 'index.html';
    } else if (user.role === 'user' && currentPath.includes('index.html')) {
        window.location.href = 'user-dashboard.html';
    }
    
    return true;
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Validate inputs
    if (!username || !password) {
        showError('Username dan password harus diisi!');
        return;
    }
    
    // Automatically determine role based on username and validate credentials
    let userRole = null;
    let validCredentials = false;
    
    // Check admin credentials
    if (username === DEFAULT_CREDENTIALS.admin.username && password === DEFAULT_CREDENTIALS.admin.password) {
        userRole = 'admin';
        validCredentials = true;
    }
    // Check user credentials
    else if (username === DEFAULT_CREDENTIALS.user.username && password === DEFAULT_CREDENTIALS.user.password) {
        userRole = 'user';
        validCredentials = true;
    }
    
    if (!validCredentials) {
        showError('Username atau password tidak valid!');
        return;
    }
    
    // Save session
    const userSession = {
        username: username,
        role: userRole,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('mp_current_user', JSON.stringify(userSession));
    
    // Redirect to appropriate dashboard
    redirectToDashboard(userRole);
}

function redirectToDashboard(role) {
    if (role === 'admin') {
        window.location.href = 'index.html';
    } else {
        window.location.href = 'user-dashboard.html';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function logout() {
    localStorage.removeItem('mp_current_user');
    window.location.href = 'login.html';
}

// Add logout functionality to existing dashboards
function addLogoutButton() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'logout-btn';
        logoutBtn.onclick = logout;
        
        // Add some basic styling
        logoutBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
        `;
        
        document.body.appendChild(logoutBtn);
    }
}

// Add logout button when page loads
if (!window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', addLogoutButton);
}

// Display current user info
function displayUserInfo() {
    const currentUser = localStorage.getItem('mp_current_user');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const userInfoElement = document.getElementById('currentUser');
        if (userInfoElement) {
            userInfoElement.textContent = `Logged in as: ${user.username} (${user.role})`;
        }
    }
}

// Call displayUserInfo when page loads
if (!window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', displayUserInfo);
}