const API_URL = "http://localhost:8000";
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('id');

console.log("Topluluk detay sayfası JS yüklendi. ID:", communityId);

async function loadCommunityDetails() {
    if (!communityId) {
        alert("Topluluk ID bulunamadı!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/communities/${communityId}`);
        const community = await response.json();

        if (response.ok) {
            const nameElem = document.getElementById('comm-name');
            const descElem = document.getElementById('comm-desc');
            
            if (nameElem) nameElem.innerText = community.name;
            if (descElem) descElem.innerText = community.description;
         
            fetchAnnouncements();
            loadMembers(); 

            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userRes = await fetch(`${API_URL}/users/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        
                        const isMember = userData.memberships.some(m => m.community_id == communityId);
                        
                        if (isMember) {
                            const header = document.getElementById('community-header');
                            
                            header.innerHTML += `
                                <div id="membership-badge" style="margin-top:10px;">
                                    <span style="background: #2ecc71; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; display: inline-block;">
                                        ✓ Bu topluluğun üyesisiniz
                                    </span>
                                </div>`;
                        }
                    }
                } catch (e) {
                    console.error("Üyelik durumu kontrol edilirken hata:", e);
                }
            }

        } else {
            console.error("Topluluk verisi alınamadı");
        }
    } catch (error) {
        console.error("Yükleme hatası:", error);
    }
}

async function fetchAnnouncements() {
    try {
        const response = await fetch(`${API_URL}/announcements/`);
        const allAnnouncements = await response.json();
        
        const list = document.getElementById('announcements-list');
        if (!list) return;

        const filtered = allAnnouncements.filter(a => a.community_id == communityId);

        if (filtered.length > 0) {
            list.innerHTML = filtered.map(a => `
                <div class="announcement-card" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                    <h4>${a.title}</h4>
                    <p>${a.content}</p>
                    <small>${new Date(a.created_at).toLocaleDateString('tr-TR')}</small>
                </div>
            `).join('');
        } else {
            list.innerHTML = "<p>Henüz bir duyuru paylaşılmamış.</p>";
        }
    } catch (e) { 
        console.error("Duyurular çekilemedi", e); 
    }
}

async function loadMembers() {
    try {
        const res = await fetch(`${API_URL}/communities/${communityId}/members`);
        const members = await res.json();
        
        const membersDiv = document.getElementById('members-list');
        if (!membersDiv) return;

        if (members.length > 0) {
            membersDiv.innerHTML = members.map(m => `
                <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center;">
                    <span style="margin-right: 8px;">👤</span>
                    <span style="font-size: 0.9em;">${m.name}</span>
                </div>
            `).join('');
        } else {
            membersDiv.innerHTML = "<p style='font-size: 0.8em; opacity: 0.7;'>Henüz üye yok.</p>";
        }
    } catch (e) {
        console.error("Üyeler yüklenemedi:", e);
    }
}

loadCommunityDetails();