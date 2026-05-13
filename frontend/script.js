const API_URL = "http://localhost:8000";

async function fetchCommunities() {
    const container = document.getElementById('community-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/communities`);
        if (response.ok) {
            const communities = await response.json();
            container.innerHTML = communities.map(c => `
                <div class="mini-community-card" 
                     style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;" 
                     onclick="window.location.href='/frontend/communities/community.html?id=${c.id}'"
                    <h4 style="margin: 0; color: #a29bfe; font-size: 0.95em;">${c.name}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 0.85em; color: #94a3b8;">${(c.description || '').substring(0, 45)}...</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Topluluk listesi yüklenemedi:", error);
    }
}

async function loadFeed() {
    const feedDiv = document.getElementById('global-feed');
    if (!feedDiv) return;

    try {
        const response = await fetch(`${API_URL}/feed`);
        if (response.ok) {
            const feedItems = await response.json();
            
            if (feedItems.length === 0) {
                feedDiv.innerHTML = "<p style='text-align:center; color:#636e72;'>Henüz bir paylaşım yok.</p>";
                return;
            }

            feedDiv.innerHTML = feedItems.map(item => {
                const targetUrl = item.type === 'event' 
                    ? `/frontend/communities/event-detail.html?id=${item.id}` 
                    : `/frontend/communities/community.html?id=${item.community_id}`;
                
                const typeLabel = item.type === 'event' ? 'ETKİNLİK' : 'DUYURU';
                const tagClass = item.type === 'event' ? 'tag-event' : 'tag-ann';

                return `
                    <div class="feed-card" onclick="window.location.href='${targetUrl}'">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="tag ${tagClass}">${typeLabel}</span>
                            <span style="color: #636e72; font-size: 0.8em;">${new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <h2 style="margin: 15px 0 10px 0; font-size: 1.4em; color: #fff;">${item.title}</h2>
                        <p style="color: #b2bec3; font-size: 0.95em; line-height: 1.6;">
                            ${item.content.substring(0, 180)}${item.content.length > 180 ? '...' : ''}
                        </p>
                        <div style="color: #fdcb6e; font-size: 0.85em; font-weight: bold; margin-top: 10px;">
                             📍 ${item.community_name} • Detaylar →
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error("Feed hatası:", error);
        feedDiv.innerHTML = "<p>Bağlantı hatası.</p>";
    }
}

window.onload = () => {
    fetchCommunities();
    loadFeed();
    checkLoginState(); 
};

document.addEventListener('DOMContentLoaded', () => {
    fetchCommunities();
    loadFeed();
});

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

function checkLoginState() {
    const navAuth = document.getElementById('nav-auth');
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('user_name'); 

    if (token && navAuth) {
        navAuth.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="nav-profile-circle" onclick="window.location.href='profile.html'" 
                     style="width: 40px; height: 40px; background: #6c5ce7; border-radius: 50%; 
                            display: flex; align-items: center; justify-content: center; 
                            cursor: pointer; font-weight: bold; color: white; border: 2px solid rgba(255,255,255,0.1);">
                    ${userName ? userName[0].toUpperCase() : 'U'}
                </div>
                <button onclick="logout()" style="background: rgba(225, 112, 85, 0.2); color: #e17055; 
                        border: 1px solid #e17055; padding: 6px 15px; border-radius: 8px; cursor: pointer;">
                    Çıkış
                </button>
            </div>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    window.location.reload(); 
}

async function loadUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            document.getElementById('user-full-name').innerText = user.name;
            document.getElementById('user-email').innerText = user.email;
            document.getElementById('user-initial').innerText = user.name[0].toUpperCase();
            document.getElementById('community-count').innerText = user.community_count;
            
            const commContainer = document.getElementById('my-communities');
            if (user.communities.length > 0) {
                commContainer.innerHTML = user.communities.map(c => `
                    <div class="community-card" onclick="location.href='communities/community.html?id=${c.id}'">
                        <h3>${c.name}</h3>
                    </div>
                `).join('');
            } else {
                commContainer.innerHTML = "<p>Henüz hiçbir topluluğa katılmadın.</p>";
            }
        }
    } catch (error) {
        console.error("Profil yüklenemedi:", error);
    }
}

async function joinCommunity() {
    const urlParams = new URLSearchParams(window.location.search);
    const communityId = parseInt(urlParams.get('id'));
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/communities/join`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ community_id: communityId })
        });

        if (response.ok) {
            alert("Topluluğa başarıyla katıldın! 🎉");
            window.location.reload(); 
        } else {
            const error = await response.json();
            alert(error.detail || "Katılım sırasında bir hata oluştu.");
        }
    } catch (error) {
        console.error("Join error:", error);
    }
}

loadFeed();
fetchCommunities();
checkAuth();