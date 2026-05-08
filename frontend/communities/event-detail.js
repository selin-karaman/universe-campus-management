const API_URL = "http://localhost:8000";
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

async function loadEventDetails() {
    if (!eventId) {
        console.error("URL'de event ID bulunamadı!");
        document.getElementById('event-title').innerText = "Hata: Etkinlik ID bulunamadı";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/events/${eventId}`);
        if (response.ok) {
            const event = await response.json();
            
            document.getElementById('event-title').innerText = event.title;
            document.getElementById('event-date').innerText = `📅 ${new Date(event.date).toLocaleDateString('tr-TR')}`;
            document.getElementById('event-location').innerText = `📍 ${event.location || 'Kampüs'}`;
            document.getElementById('event-description').innerText = event.description;
            
            updateParticipantsList(event.participants);
            renderActionButtons();
        } else {
            document.getElementById('event-title').innerText = "Etkinlik bulunamadı";
        }
    } catch (error) {
        console.error("Bağlantı hatası:", error);
        document.getElementById('event-title').innerText = "Sunucuya bağlanılamadı";
    }
}

function updateParticipantsList(participants) {
    const listDiv = document.getElementById('participants-list');
    if (!listDiv) return;

    if (participants && participants.length > 0) {
        const colors = ['#6c5ce7', '#00b894', '#e84393', '#0984e3', '#fdcb6e', '#e17055'];

        listDiv.innerHTML = participants.map((p, index) => {
            const name = p.user?.name || "Gizli Üye";
            const initial = name.charAt(0).toUpperCase();
            const bgColor = colors[index % colors.length];

            return `
                <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 5px;">
                    <div style="width: 35px; height: 35px; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; color: white; font-size: 0.9em; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                        ${initial}
                    </div>
                    <span style="font-size: 1em; color: #dfe6e9; font-weight: 500;">${name}</span>
                </div>
            `;
        }).join('');
    } else {
        listDiv.innerHTML = `<p style="color: #636e72; font-size: 0.9em; text-align: center; margin-top: 20px;">Henüz katılımcı yok. <br> İlk katılan sen ol! 🚀</p>`;
    }
}

async function renderActionButtons() {
    const actionArea = document.getElementById('event-action-area');
    const token = localStorage.getItem('token');
    
    if (!token) {
        actionArea.innerHTML = `<p style="color: #fab1a0; font-size: 0.9em;">Katılmak için giriş yapmalısınız.</p>`;
        return;
    }

    try {
        const userRes = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userRes.ok) {
            const userData = await userRes.json();
            const joinedEventIds = userData.event_participations ? userData.event_participations.map(p => p.event_id) : [];
            const isJoined = joinedEventIds.includes(parseInt(eventId));

            if (isJoined) {
                actionArea.innerHTML = `
                    <button onclick="leaveEventFromDetail()" style="width: 100%; padding: 12px; background: #636e72; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        Etkinlikten Ayrıl
                    </button>`;
            } else {
                actionArea.innerHTML = `
                    <button onclick="joinEventFromDetail()" style="width: 100%; padding: 12px; background: #00b894; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        Etkinliğe Katıl
                    </button>`;
            }
        }
    } catch (e) {
        console.error("Butonlar yüklenirken hata:", e);
    }
}

async function joinEventFromDetail() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/events/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ event_id: parseInt(eventId) })
        });

        if (response.ok) {
            alert("Harika! Etkinliğe kaydoldun. 🎉");
            loadEventDetails();
        }
    } catch (error) {
        console.error("Katılım hatası:", error);
    }
}

async function leaveEventFromDetail() {
    if (!confirm("Ayrılmak istediğine emin misin?")) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/events/leave/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Etkinlikten ayrıldın. 👋");
            loadEventDetails();
        }
    } catch (error) {
        console.error("Ayrılma hatası:", error);
    }
}

loadEventDetails();