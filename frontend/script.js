console.log("Script dosyası yüklendi!");
const API_URL = "http://localhost:8000";

async function fetchCommunities() {
    const token = localStorage.getItem('token');
    let userMemberships = [];

    if (token) {

        try {
            const userRes = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                userMemberships = userData.memberships.map(m => m.community_id);
                console.log("3. Kullanıcı üyelikleri alındı:", userMemberships);
            }
        } catch (e) { console.error("Auth hatası:", e); }
    }

    try {
        console.log("4. API'den topluluklar isteniyor...");
        const response = await fetch(`${API_URL}/communities/`);
        const data = await response.json();
        console.log("5. Topluluk verisi geldi:", data);
        
        const container = document.getElementById('community-container');
        if (!container) {
            console.error("HATA: index.html içinde 'community-container' ID'li div bulunamadı!");
            return;
        }

        container.innerHTML = ""; 

        data.forEach(community => {
            const isMember = userMemberships.includes(community.id);
            const card = document.createElement('div');
            card.className = 'card';
            
            const buttonHtml = isMember 
                ? `<button class="btn-joined" disabled>✓ Üyesiniz</button>` 
                : `<button onclick="joinCommunity(${community.id})" class="btn-join">Topluluğa Katıl</button>`;

            card.innerHTML = `
                <h3 onclick="window.location.href='communities/community.html?id=${community.id}'" style="cursor:pointer">
                    ${community.name}
                </h3>
                <p>${community.description}</p>
                ${buttonHtml}
            `;
            container.appendChild(card);
        });
        console.log("6. Kartlar DOM'a eklendi.");

    } catch (error) {
        console.error("7. Genel veri çekme hatası:", error);
    }
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    const authSection = document.querySelector('.auth-buttons');

    if (token) {
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                authSection.innerHTML = `
                    <span class="welcome-text">Hoş geldin, <b>${user.name}</b></span>
                    <button onclick="logout()" class="btn-logout">Çıkış Yap</button>
                `;
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error("Auth kontrol hatası:", error);
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.reload(); 
}

async function joinCommunity(communityId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Lütfen önce giriş yapın!");
        window.location.href = "auth/login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/communities/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ community_id: communityId })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Topluluğa başarıyla katıldınız!");
            location.reload(); 
        } else {
            alert("Hata: " + (data.detail || "Katılım başarısız."));
        }
    } catch (error) {
        console.error("Katılma hatası:", error);
    }
}


fetchCommunities();
checkAuth();