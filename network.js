/**
 * Pristagna Akvaryum - MMO Ağ ve Senkronizasyon Yöneticisi
 * Çoklu Sekme (BroadcastChannel), WebRTC (PeerJS) ve Yerel Depolama (LocalStorage)
 * ile canlı yayın ve izleyiciler arasında sıfır gecikmeli gerçek zamanlı senkronizasyon.
 */

class OceanNetworkManager {
    constructor() {
        this.channelName = 'pristagna_ocean_channel';
        this.broadcastChannel = null;
        this.peer = null;
        this.connections = [];
        this.isStreamerMode = false;
        this.onFishReceivedCallback = null;
        this.onCommunityAquariumCallback = null;
        this.storageKey = 'pristagna_released_fishes';
        this.localPetKey = 'pristagna_active_pet';
        this.communityKey = 'pristagna_community_aquariums';
        this.userGoldKey = 'pristagna_user_gold';

        this.init();
    }

    init() {
        this.setupBroadcastChannel();
        this.setupPeer();
        this.seedStarterCommunityAquariums();
    }

    // 1. BroadcastChannel (Aynı bilgisayardaki sekmeler ve sayfalar arası anlık iletişim)
    setupBroadcastChannel() {
        if ('BroadcastChannel' in window) {
            try {
                this.broadcastChannel = new BroadcastChannel(this.channelName);
                this.broadcastChannel.onmessage = (event) => {
                    const msg = event.data;
                    if (!msg) return;

                    if (msg.type === 'FISH_RELEASED') {
                        this.handleIncomingFish(msg.payload, true);
                    } else if (msg.type === 'AQUARIUM_PULSE') {
                        this.saveCommunityAquarium(msg.payload);
                    }
                };
            } catch (e) {
                console.warn('BroadcastChannel hatası:', e);
            }
        }
    }

    // 2. PeerJS / WebRTC
    setupPeer() {
        if (typeof Peer === 'undefined') return;

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const isOceanView = urlParams.get('view') === 'ocean';

            if (isOceanView) {
                this.isStreamerMode = true;
                this.peer = new Peer('pristagna-ocean-host', { debug: 0 });

                this.peer.on('connection', (conn) => {
                    this.connections.push(conn);
                    conn.on('data', (data) => {
                        if (data && data.type === 'FISH_RELEASED') {
                            this.handleIncomingFish(data.payload, true);
                            this.broadcastToPeers(data, conn);
                        } else if (data && data.type === 'AQUARIUM_PULSE') {
                            this.saveCommunityAquarium(data.payload);
                            this.broadcastToPeers(data, conn);
                        }
                    });
                });
            }
        } catch (e) {
            console.warn('PeerJS başlatılamadı:', e);
        }
    }

    // Balığı Okyanusa Gönder
    broadcastFishRelease(fishData) {
        this.saveFishToStorage(fishData);

        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'FISH_RELEASED',
                payload: fishData
            });
        }

        if (typeof Peer !== 'undefined') {
            try {
                const clientPeer = new Peer();
                clientPeer.on('open', () => {
                    const conn = clientPeer.connect('pristagna-ocean-host');
                    conn.on('open', () => {
                        conn.send({
                            type: 'FISH_RELEASED',
                            payload: fishData
                        });
                        setTimeout(() => clientPeer.destroy(), 3000);
                    });
                });
            } catch (e) {}
        }

        if (this.onFishReceivedCallback) {
            this.onFishReceivedCallback(fishData, true);
        }
    }

    // Kendi Akvaryumunu Topluluk Listesine Bildir
    broadcastMyAquarium(aquariumData) {
        this.saveCommunityAquarium(aquariumData);

        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'AQUARIUM_PULSE',
                payload: aquariumData
            });
        }
    }

    broadcastToPeers(data, exceptConn = null) {
        for (const conn of this.connections) {
            if (conn !== exceptConn && conn.open) {
                try {
                    conn.send(data);
                } catch (e) {}
            }
        }
    }

    handleIncomingFish(fishData, isNewArrival = false) {
        this.saveFishToStorage(fishData);
        if (this.onFishReceivedCallback) {
            this.onFishReceivedCallback(fishData, isNewArrival);
        }
    }

    // Yerel Depolamada Salınan Balıklar
    saveFishToStorage(fishData) {
        try {
            const list = this.getStoredFishes();
            if (!list.some(f => f.id === fishData.id)) {
                list.unshift(fishData);
                if (list.length > 100) list.pop();
                localStorage.setItem(this.storageKey, JSON.stringify(list));
            }
        } catch (e) {}
    }

    getStoredFishes() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    // Topluluk Akvaryumları Yönetimi
    saveCommunityAquarium(data) {
        try {
            const list = this.getCommunityAquariums();
            const idx = list.findIndex(a => a.creator === data.creator || a.id === data.id);
            if (idx >= 0) {
                list[idx] = { ...list[idx], ...data, lastSeen: Date.now() };
            } else {
                list.unshift({ ...data, lastSeen: Date.now() });
            }
            if (list.length > 50) list.pop();
            localStorage.setItem(this.communityKey, JSON.stringify(list));

            if (this.onCommunityUpdatedCallback) {
                this.onCommunityUpdatedCallback(list);
            }
        } catch (e) {}
    }

    getCommunityAquariums() {
        try {
            const raw = localStorage.getItem(this.communityKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    // Başlangıçta örnek topluluk akvaryumları oluştur (Ziyaret boş kalmasın)
    seedStarterCommunityAquariums() {
        const existing = this.getCommunityAquariums();
        if (existing.length > 0) return;

        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 300;
        dummyCanvas.height = 180;
        const dCtx = dummyCanvas.getContext('2d');

        // Balık 1
        dCtx.strokeStyle = '#53FC18';
        dCtx.lineWidth = 10;
        dCtx.beginPath();
        dCtx.ellipse(150, 90, 70, 45, 0, 0, Math.PI * 2);
        dCtx.stroke();
        dCtx.fillStyle = '#fff';
        dCtx.beginPath();
        dCtx.arc(180, 80, 6, 0, Math.PI * 2);
        dCtx.fill();
        const fish1Img = dummyCanvas.toDataURL();

        // Balık 2
        dCtx.clearRect(0, 0, 300, 180);
        dCtx.strokeStyle = '#00E5FF';
        dCtx.lineWidth = 10;
        dCtx.beginPath();
        dCtx.moveTo(220, 90);
        dCtx.quadraticCurveTo(150, 30, 80, 70);
        dCtx.lineTo(30, 40);
        dCtx.quadraticCurveTo(50, 90, 30, 140);
        dCtx.lineTo(80, 110);
        dCtx.quadraticCurveTo(150, 150, 220, 90);
        dCtx.stroke();
        const fish2Img = dummyCanvas.toDataURL();

        const starters = [
            {
                id: 'comm_pristagna',
                name: 'Korsan Neon',
                creator: 'pristagna',
                level: 8,
                oxygen: 92,
                algaeDirty: 8,
                dataUrl: fish1Img,
                width: 300,
                height: 180,
                equippedCosmetics: { trail: 'kick_neon', decor: 'chest', theme: 'cyberpunk' },
                likes: 142
            },
            {
                id: 'comm_modali',
                name: 'Turkuaz Fırtına',
                creator: 'KickMod_Ali',
                level: 6,
                oxygen: 78,
                algaeDirty: 25,
                dataUrl: fish2Img,
                width: 300,
                height: 180,
                equippedCosmetics: { trail: 'stars', decor: 'coral', theme: 'lagoon' },
                likes: 89
            }
        ];

        localStorage.setItem(this.communityKey, JSON.stringify(starters));
    }

    // Aktif Tamagotchi Balığının İlerlemesini Kaydet/Geri Al
    saveActivePetProgress(fishData, aquariumState) {
        try {
            const payload = {
                fishData: fishData,
                savedAt: Date.now(),
                level: aquariumState.level,
                oxygen: aquariumState.oxygen,
                algaeDirty: aquariumState.algaeDirty,
                feedCooldown: aquariumState.feedCooldown,
                gold: aquariumState.gold,
                equippedCosmetics: aquariumState.equippedCosmetics
            };
            localStorage.setItem(this.localPetKey, JSON.stringify(payload));
            this.broadcastMyAquarium({
                id: fishData.id,
                name: fishData.name,
                creator: fishData.creator,
                level: aquariumState.level,
                oxygen: aquariumState.oxygen,
                algaeDirty: aquariumState.algaeDirty,
                dataUrl: fishData.dataUrl,
                width: fishData.width,
                height: fishData.height,
                equippedCosmetics: aquariumState.equippedCosmetics
            });
        } catch (e) {}
    }

    loadActivePetProgress() {
        try {
            const raw = localStorage.getItem(this.localPetKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    clearActivePet() {
        try {
            localStorage.removeItem(this.localPetKey);
        } catch (e) {}
    }
}

window.OceanNetworkManager = OceanNetworkManager;
