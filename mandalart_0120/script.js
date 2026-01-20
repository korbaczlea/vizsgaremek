console.log("MandalArt oldal betöltve");

let cartCount = 0;

function addToCart() {
    cartCount++;
    document.querySelector('.cart-count').textContent = cartCount;
}


const modal = document.getElementById('modal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

loginBtn.onclick = () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    modal.style.display = 'block';
}


registerBtn.onclick = () => {
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    modal.style.display = 'block';
}


closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; }


switchToRegister.onclick = e => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
}
switchToLogin.onclick = e => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
}


loginForm.onsubmit = e => {
    e.preventDefault();
    alert(`Logged in as ${document.getElementById('loginUsername').value}`);
    modal.style.display = 'none';
}

registerForm.onsubmit = e => {
    e.preventDefault();
    const pw1 = document.getElementById('registerPassword').value;
    const pw2 = document.getElementById('registerPassword2').value;
    if (pw1 !== pw2) {
        alert("Passwords do not match!");
        return;
    }
    alert(`Registered as ${document.getElementById('registerUsername').value}`);
    modal.style.display = 'none';
}