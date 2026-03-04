const API_URL = "http://localhost:8000";

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const message = document.getElementById('message');

        try {
            const formData = new FormData();
            formData.append('username', email); 
            formData.append('password', password);

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                message.style.color = "lightgreen";
                message.innerText = "Giriş başarılı! Yönlendiriliyorsunuz...";
                
                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1500);
            } else {
                message.style.color = "red";
                message.innerText = "Hata: " + (data.detail || "Giriş yapılamadı");
            }
        } catch (error) {
            console.error("Login hatası:", error);
            message.innerText = "Sunucuya bağlanılamadı.";
        }
    });
}