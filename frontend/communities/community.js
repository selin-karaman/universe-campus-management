const API_URL = "http://localhost:8000";
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('id');


async function loadCommunityDetails() {
    if (!communityId) {
        alert("Topluluk ID bulunamadı!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/communities/${communityId}`);
        const community = await response.json();

        if (response.ok) {
            if (document.getElementById('comm-name')) document.getElementById('comm-name').innerText = community.name;
            if (document.getElementById('comm-desc')) document.getElementById('comm-desc').innerText = community.description;
         
            fetchAnnouncements();
            loadMembers(); 
            fetchEvents();

            const token = localStorage.getItem('token');
            if (token) {
                const userRes = await fetch(`${API_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (userRes.ok) {
                    const userData = await userRes.json();

                    const headerElem = document.getElementById('community-header');
                    
                    if (headerElem) {
                        const isMember = userData.memberships.some(m => String(m.community_id) === String(communityId));
                        if (isMember) {
                            headerElem.innerHTML += `
                                <div id="membership-badge" style="margin-top:10px;">
                                    <span style="background: #2ecc71; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; display: inline-block;">
                                        ✓ Bu topluluğun üyesisiniz
                                    </span>
                                </div>`;
                        }

                        const isOwner = String(userData.id) === String(community.owner_id);
                        if (isOwner) {
                            headerElem.innerHTML += `
                                <div id="admin-panel" style="margin-top:20px; padding:15px; border: 2px dashed #a29bfe; border-radius: 12px; background: rgba(162, 155, 254, 0.1);">
                                    <h3 style="color: #a29bfe; margin-top:0; font-size: 1em;">🛠️ Yönetici Paneli</h3>
                                    <p style="font-size: 0.8em; opacity: 0.8; color: white;">Bu topluluğun kurucusu olduğunuz için duyuru yayınlayabilirsiniz.</p>
                                    <button onclick="toggleAnnouncementForm()" style="padding: 8px 15px; background: #6c5ce7; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">
                                        + Yeni Duyuru Paylaş
                                    </button>
                                     <button onclick="toggleEventForm()" style="padding: 8px 15px; background: #a29bfe; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; margin-left: 10px;">
                                        + Yeni Etkinlik Oluştur
                                    </button>
                                    <div id="announcement-form" style="display:none; margin-top:15px;">
                                        <textarea id="ann-content" placeholder="Duyuru içeriğini buraya yazın..." style="width:100%; padding:10px; border-radius:5px; border:1px solid #ddd; background:#2d3436; color:white;"></textarea>
                                        <button onclick="postAnnouncement()" style="margin-top:10px; padding:8px 15px; background: #00b894; color:white; border:none; border-radius:5px; cursor:pointer;">Yayınla</button>
                                    </div>
                                    <div id="event-form" style="display:none; margin-top:15px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                                        <input type="text" id="event-title" placeholder="Etkinlik Başlığı" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #444; background:#2d3436; color:white;">
                                        <textarea id="event-desc" placeholder="Etkinlik Açıklaması" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #444; background:#2d3436; color:white;"></textarea>
                                        <div style="display: flex; gap: 10px;">
                                            <input type="date" id="event-date" style="flex: 1; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #444; background:#2d3436; color:white;">
                                            <input type="text" id="event-location" placeholder="Konum (örn: Teknopark)" style="flex: 1; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #444; background:#2d3436; color:white;">
                                        </div>
                                        <button onclick="postEvent()" style="width:100%; padding:10px; background: #00b894; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Etkinliği Oluştur</button>
                                    </div>
                                </div>`;
                        }
                    }
                }
            }
        } else {
            console.error("Topluluk verisi alınamadı");
        }
    } catch (error) {
        console.error("Yükleme hatası:", error);
    }
}

async function joinCurrentCommunity() {
    const token = localStorage.getItem('token');
    if (!token) return alert("Lütfen giriş yapın");

    const response = await fetch(`${API_URL}/communities/${communityId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        alert("Katıldınız!");
        location.reload(); 
    }
}

async function fetchAnnouncements() {
    const list = document.getElementById('announcements-list');
    if (!list) return;

    try {
        const response = await fetch(`${API_URL}/communities/${communityId}/announcements`);
        
        if (response.ok) {
            const announcements = await response.json();
            
            if (announcements.length > 0) {
                list.innerHTML = announcements.map(a => `
                    <div class="announcement-card" style="background: #2d3436; padding: 15px; border-left: 5px solid #6c5ce7; margin-bottom: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 style="margin: 0; color: #a29bfe;">${a.title || 'Duyuru'}</h4>
                            <button onclick="deleteAnnouncement(${a.id})" style="background:none; border:none; color:#ff7675; cursor:pointer;">🗑️</button>
                        </div>
                        <p style="color: #dfe6e9; margin: 10px 0;">${a.content}</p>
                        <small style="color: #636e72;">📅 ${new Date(a.created_at).toLocaleDateString('tr-TR')}</small>
                    </div>
                `).join('');
            } else {
                list.innerHTML = "<p style='color: #636e72;'>Henüz bir duyuru paylaşılmamış.</p>";
            }
        } else {
            console.error("Backend'den veri alınamadı:", response.status);
        }
    } catch (e) {
        console.error("Duyurular çekilirken hata:", e);
    }
}

async function loadMembers() {
    const memberList = document.getElementById('members-list'); 
    if (!memberList) return;

    try {
        const response = await fetch(`${API_URL}/communities/${communityId}/members`);
        if (response.ok) {
            const memberships = await response.json();
            
            if (memberships.length > 0) {
                memberList.innerHTML = memberships.map(m => {
                    const displayName = m.user?.name || m.user?.username || m.username || "İsimsiz Üye";
                    
                    return `
                        <div class="member-item" style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="width: 32px; height: 32px; background: #6c5ce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; color: white; font-size: 0.85em;">
                                ${displayName.charAt(0).toUpperCase()}
                            </div>
                            <span style="color: #dfe6e9; font-size: 0.9em;">${displayName}</span>
                        </div>
                    `;
                }).join('');
            } else {
                memberList.innerHTML = "<p style='color: #636e72; font-size: 0.85em; padding: 10px;'>Henüz üye yok.</p>";
            }
        }
    } catch (e) {
        console.error("Üyeler yüklenirken hata oluştu:", e);
    }
}

async function postAnnouncement() {
    const content = document.getElementById('ann-content').value;
    const token = localStorage.getItem('token');

    if (!content) {
        alert("Lütfen bir duyuru içeriği yazın.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/communities/${communityId}/announcements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: content })
        });

        if (response.ok) {
            alert("Duyuru başarıyla yayınlandı!");
            document.getElementById('ann-content').value = ''; 
            toggleAnnouncementForm(); 
            fetchAnnouncements(); 
        } else {
            const errorData = await response.json();
            alert("Hata: " + (errorData.detail || "Duyuru paylaşılamadı."));
        }
    } catch (error) {
        console.error("Duyuru paylaşma hatası:", error);
        alert("Bağlantı hatası oluştu.");
    }
}

function toggleAnnouncementForm() {
    const form = document.getElementById('announcement-form');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

async function deleteAnnouncement(annId) {
    if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/announcements/${annId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            fetchAnnouncements(); 
        } else {
            alert("Bu duyuruyu silme yetkiniz yok.");
        }
    } catch (error) {
        console.error("Silme hatası:", error);
    }
}

async function fetchEvents() {
    const eventList = document.getElementById('events-list');
    if (!eventList) return;

    try {
        const response = await fetch(`${API_URL}/communities/${communityId}/events`);
        const token = localStorage.getItem('token');
        let joinedEventIds = [];

        if (token) {
            const userRes = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                joinedEventIds = userData.event_participations ? userData.event_participations.map(p => p.event_id) : [];
            }
        }

        if (response.ok) {
            const events = await response.json();
            
            if (events.length > 0) {
                eventList.innerHTML = events.map(e => {
                    const isJoined = joinedEventIds.includes(e.id);

                    return `
                        <div class="event-item" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px dashed rgba(255,255,255,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <h5 onclick="window.location.href='event-detail.html?id=${e.id}'" 
                                    style="margin: 0; color: #a29bfe; font-size: 1.1em; cursor: pointer; text-decoration: underline;">
                                    ${e.title}
                                </h5>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <span style="font-size: 0.75em; color: #636e72;">📍 ${e.location || 'Kampüs'}</span>
                                    
                                    ${isJoined ? 
                                        `<button onclick="leaveEvent(${e.id})" style="padding: 5px 10px; background: #636e72; color:white; border:none; border-radius:5px; cursor:pointer; font-size: 0.8em; font-weight:bold;">Katıldın (Ayrıl)</button>` : 
                                        `<button onclick="joinEvent(${e.id})" style="padding: 5px 10px; background: #00b894; color:white; border:none; border-radius:5px; cursor:pointer; font-size: 0.8em; font-weight:bold;">Etkinliğe Katıl</button>`
                                    }

                                    <button onclick="deleteEvent(${e.id})" style="background:none; border:none; color:#ff7675; cursor:pointer; font-size: 1em;">🗑️</button>
                                </div>
                            </div>
                            <p style="font-size: 0.85em; margin: 8px 0; color: #dfe6e9;">${e.description}</p>
                            <div style="font-size: 0.8em; color: #fdcb6e; font-weight: bold;">
                                📅 ${new Date(e.date).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                eventList.innerHTML = "<p style='color: #636e72; font-size: 0.85em; padding: 10px;'>Henüz planlanmış bir etkinlik yok.</p>";
            }
        }
    } catch (e) {
        console.error("Etkinlikler yüklenirken hata:", e);
    }
}

function toggleEventForm() {
    const form = document.getElementById('event-form');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

async function postEvent() {
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-desc').value;
    const date = document.getElementById('event-date').value;
    const location = document.getElementById('event-location').value;
    const token = localStorage.getItem('token');

    if (!title || !date) return alert("Lütfen başlık ve tarih alanlarını doldurun.");

    try {
        const response = await fetch(`${API_URL}/events/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                description: description,
                date: date,
                location: location,
                community_id: communityId 
            })
        });

        if (response.ok) {
            alert("Etkinlik başarıyla oluşturuldu!");
            location.reload(); 
        } else {
            const err = await response.json();
            alert("Hata: " + err.detail);
        }
    } catch (error) {
        console.error("Etkinlik oluşturma hatası:", error);
    }
}

async function deleteEvent(eventId) {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            fetchEvents(); 
        } else {
            alert("Silme yetkiniz yok veya bir hata oluştu.");
        }
    } catch (error) {
        console.error("Silme hatası:", error);
    }
}

async function joinEvent(eventId) {
    const token = localStorage.getItem('token');
    if (!token) return alert("Lütfen etkinliğe katılmak için giriş yapın.");

    try {
        const response = await fetch(`${API_URL}/events/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ event_id: eventId })
        });

        if (response.ok) {
            alert("Etkinliğe başarıyla kayıt oldunuz! 🎉");
            fetchEvents(); 
        } else {
            const err = await response.json();
            alert(err.detail || "Bir hata oluştu.");
        }

    } catch (error) {
        console.error("Katılım hatası:", error);
    }
}

async function leaveEvent(eventId) {
    if (!confirm("Bu etkinlikten ayrılmak istediğinize emin misiniz?")) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/events/leave/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Etkinlik kaydınız başarıyla silindi. 👋");
            fetchEvents();
        } else {
            const err = await response.json();
            alert(err.detail || "Bir hata oluştu.");
        }
    } catch (error) {
        console.error("Ayrılma hatası:", error);
    }
}

loadCommunityDetails();