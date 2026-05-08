const API_URL = "http://localhost:8000";

async function fetchCommunities() {
    const container = document.getElementById('community-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/communities`);
        if (response.ok) {
            const communities = await response.json();
            container.innerHTML = communities.map(c => `
                <div class="mini-community-card" style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;" onclick="window.location.href='community.html?id=${c.id}'">
                    <h4 style="margin: 0; color: #a29bfe; font-size: 0.95em;">${c.name}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 0.8em; color: #636e72;">${(c.description || '').substring(0, 40)}...</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Topluluk hatası:", error);
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
                    ? `communities/event-detail.html?id=${item.id}` 
                    : `communities/community.html?id=${item.community_id}`;
                
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

loadFeed();
fetchCommunities();
checkAuth();