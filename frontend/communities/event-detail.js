const API_URL = "http://localhost:8000";
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

async function loadEventDetails() {
    if (!eventId) return;

    try {
        const response = await fetch(`${API_URL}/events/${eventId}`);
        if (response.ok) {
            const event = await response.json();
            
            document.getElementById('event-title').innerText = event.title;
            document.getElementById('event-date').innerText = `📅 ${new Date(event.date).toLocaleDateString('tr-TR')}`;
            document.getElementById('event-location').innerText = `📍 ${event.location || 'Kampüs'}`;
            document.getElementById('event-description').innerText = event.description;
            
            renderActionButtons();
        }
    } catch (error) {
        console.error("Etkinlik yüklenirken hata:", error);
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