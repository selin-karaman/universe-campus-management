const API_URL = "http://localhost:8000";

const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const surname = document.getElementById('surname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const regResponse = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    name: `${name} ${surname}`
                })
            });

            if (regResponse.ok) {
                const formData = new URLSearchParams();
                formData.append('username', email);
                formData.append('password', password);

                const loginResponse = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    
                    localStorage.setItem('token', loginData.access_token);
                    localStorage.setItem('user_name', name);

                    window.location.replace('../index.html');
                } else {
                    window.location.href = 'login.html?status=success';
                }
            } else {
                const errorData = await regResponse.json();
                alert("Kayıt Hatası: " + (errorData.detail || "Bir şeyler ters gitti."));
            }
        } catch (error) {
            console.error("Sistem Hatası:", error);
            alert("Sunucuya bağlanılamadı.");
        }
    });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                
                const userRes = await fetch(`${API_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                
                if (userRes.ok) {
                    const userData = await userRes.json();
                    localStorage.setItem('user_name', userData.full_name.split(' ')[0]);
                }
                window.location.replace('../index.html');
            } else {
                const errorMsg = document.getElementById('error-message');
                if (errorMsg) errorMsg.style.display = 'block';
            }
        } catch (error) {
            alert("Sistem hatası.");
        }
    });
}