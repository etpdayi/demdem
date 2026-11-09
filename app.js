/**
 * Akvaryum - Ana Uygulama Orkestrasyonu (App.js)
 * Kick Kimlik Doğrulama Kapısı, 8-Bit Piksel Sanat Çizim Atölyesi,
 * Bölgesel Yosunlaşma, Kişisel Akvaryum, Topluluk Akvaryumları,
 * Ortak Okyanus ve Retro Kozmetik Dükkanı.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Modül Başlatıcılar
    const drawEngine = new FishDrawingCanvas('drawCanvas', 'previewCanvas');
    const aquariumSim = new PersonalAquarium('aquariumCanvas', 'glassCanvas');
    const oceanSim = new SharedOcean('oceanCanvas');
    const networkMgr = new OceanNetworkManager();

    // 2. UI Referansları
    const viewKickGate = document.getElementById('view-kick-gate');
    const appContent = document.getElementById('app-content');

    // Kick Giriş Kapısı Elemanları
    const btnGateKickOAuth = document.getElementById('btnGateKickOAuth');
    const inputGateKickUsername = document.getElementById('inputGateKickUsername');
    const btnGateConfirm = document.getElementById('btnGateConfirm');
    const userKickProfile = document.getElementById('userKickProfile');
    const userKickAvatarChar = document.getElementById('userKickAvatarChar');
    const userKickNameDisplay = document.getElementById('userKickNameDisplay');
    const inputCreatorName = document.getElementById('inputCreatorName');

    // Sekmeler
    const tabs = {
        draw: document.getElementById('view-draw'),
        pet: document.getElementById('view-pet'),
        community: document.getElementById('view-community'),
        ocean: document.getElementById('view-ocean')
    };

    const tabBtns = {
        draw: document.getElementById('tabBtnDraw'),
        pet: document.getElementById('tabBtnPet'),
        community: document.getElementById('tabBtnCommunity'),
        ocean: document.getElementById('tabBtnOcean')
    };

    // HUD Referansları
    const hudFishAvatar = document.getElementById('hudFishAvatar');
    const hudFishName = document.getElementById('hudFishName');
    const hudFishLevel = document.getElementById('hudFishLevel');
    const hudOxygenVal = document.getElementById('hudOxygenVal');
    const barOxygen = document.getElementById('barOxygen');
    const hudAlgaeVal = document.getElementById('hudAlgaeVal');
    const barAlgae = document.getElementById('barAlgae');
    const hudGrowthVal = document.getElementById('hudGrowthVal');
    const barGrowth = document.getElementById('barGrowth');
    const hudAfkTimerText = document.getElementById('hudAfkTimerText');
    const hudGoldDisplay = document.getElementById('hudGoldDisplay');
    const userGoldCount = document.getElementById('userGoldCount');
    const shopUserGold = document.getElementById('shopUserGold');

    const feedBtn = document.getElementById('btnFeedFish');
    const feedBtnText = document.getElementById('feedBtnText');
    const feedTimerText = document.getElementById('feedTimerText');
    const btnReleaseToOcean = document.getElementById('btnReleaseToOcean');
    const btnPumpAir = document.getElementById('btnPumpAir');
    const modalCelebration = document.getElementById('modalCelebration');
    const celebrationDesc = document.getElementById('celebrationDesc');
    const statOceanFishCount = document.getElementById('statOceanFishCount');
    const statTotalReleased = document.getElementById('statTotalReleased');

    // Misafir Modu Referansları
    const guestBanner = document.getElementById('guestBanner');
    const guestOwnerName = document.getElementById('guestOwnerName');
    const btnGuestPetFish = document.getElementById('btnGuestPetFish');
    const btnReturnMyTank = document.getElementById('btnReturnMyTank');

    // Dükkan Referansları
    const modalShop = document.getElementById('modalShop');
    const btnOpenShop = document.getElementById('btnOpenShop');
    const btnCloseShop = document.getElementById('btnCloseShop');
    const shopItemsContainer = document.getElementById('shopItemsContainer');

    let activeTab = 'draw';
    let currentActiveFish = null;
    let activeShopCategory = 'trails';

    // 3. Kick Giriş Kapısı Yönetimi (Giriş Yapılmadan Oyuna Girilemez)
    function updateKickUI(user) {
        if (user && user.username) {
            // Giriş yapılmış: Kapıyı gizle, oyunu aç
            if (viewKickGate) viewKickGate.style.display = 'none';
            if (appContent) appContent.classList.add('logged-in');

            if (userKickProfile) userKickProfile.style.display = 'flex';
            if (userKickAvatarChar) {
                if (user.avatar) {
                    userKickAvatarChar.innerHTML = `<img src="${user.avatar}" alt="${user.username}" style="width:100%; height:100%; border-radius:3px; object-fit:cover;">`;
                } else {
                    userKickAvatarChar.textContent = user.username.charAt(0).toUpperCase();
                }
            }

            if (userKickNameDisplay) {
                userKickNameDisplay.textContent = `@${user.username}`;
            }

            if (inputCreatorName) {
                inputCreatorName.value = user.username;
            }
        } else {
            // Giriş yapılmamış: Kapıyı göster, oyunu kilitle
            if (viewKickGate) viewKickGate.style.display = 'flex';
            if (appContent) appContent.classList.remove('logged-in');
            if (userKickProfile) userKickProfile.style.display = 'none';
        }
    }

    // Resmi Kick OAuth 2.0 Giriş Butonu
    if (btnGateKickOAuth) {
        btnGateKickOAuth.addEventListener('click', () => {
            window.soundEngine && window.soundEngine.playBuy();
            if (window.kickAuth) {
                window.kickAuth.startKickLogin();
            }
        });
    }

    // Kullanıcı Adı ile Hızlı Giriş Butonu
    function performGateLogin() {
        const username = (inputGateKickUsername ? inputGateKickUsername.value : '').trim();
        if (!username) {
            alert('Lütfen geçerli bir Kick kullanıcı adı girin!');
            if (inputGateKickUsername) inputGateKickUsername.focus();
            return;
        }

        if (window.kickAuth) {
            window.kickAuth.manualLogin(username);
        }
        window.soundEngine && window.soundEngine.playLevelUp();
    }

    if (btnGateConfirm) {
        btnGateConfirm.addEventListener('click', performGateLogin);
    }

    if (inputGateKickUsername) {
        inputGateKickUsername.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performGateLogin();
            }
        });
    }

    // Profil Tıklayınca Çıkış Yapma
    if (userKickProfile) {
        userKickProfile.addEventListener('click', () => {
            const user = window.kickAuth ? window.kickAuth.getUser() : null;
            const name = user ? user.username : 'kullanıcı';
            if (confirm(`@${name} Kick hesabından çıkış yapmak istiyor musun?`)) {
                if (window.kickAuth) {
                    window.kickAuth.logout();
                }
            }
        });
    }

    // Kick Auth Dinleyicisi
    if (window.kickAuth) {
        window.kickAuth.onAuthChangeCallback = (user) => {
            updateKickUI(user);
        };
        updateKickUI(window.kickAuth.getUser());
    }

    // 4. Kozmetik Kataloğu
    const COSMETIC_CATALOG = {
        trails: [
            { id: 'default', name: 'Doğal Kabarcık', price: 0, icon: '🫧', desc: 'Klasik piksel su kabarcığı izi.' },
            { id: 'kick_neon', name: 'Kick Neon Parıltısı', price: 100, icon: '🟢', desc: 'Balığın ardında parlayan Kick yeşili neon piksel iz.' },
            { id: 'stars', name: 'Sihirli Yıldız Tozu', price: 200, icon: '✨', desc: 'Yüzerken arkasında ışıltılı retro yıldızlar saçar.' },
            { id: 'gold_dust', name: 'Altın Hazine Tozu', price: 350, icon: '🪙', desc: 'Zengin altın sikkeler ve pırıltılar saçar.' },
            { id: 'rainbow', name: 'Gökkuşağı Akışı', price: 500, icon: '🌈', desc: 'Sürekli renk değiştiren 8-bit spektrum dalgası.' }
        ],
        decors: [
            { id: 'none', name: 'Sade Kum', price: 0, icon: '🪨', desc: 'Ekstra dekorasyon yok.' },
            { id: 'coral', name: 'Neon Mercan', price: 150, icon: '🪸', desc: 'Akvaryumun dibinde parıldayan biyo-mercan.' },
            { id: 'chest', name: 'Batık Hazine Sandığı', price: 300, icon: '👑', desc: 'Korsanların unuttuğu piksel altın sandığı.' },
            { id: 'crystal', name: 'Derin Su Kristalleri', price: 400, icon: '💎', desc: 'Mavi ve yeşil ışıltılı kristal sütunlar.' }
        ],
        themes: [
            { id: 'retro_ocean', name: '8-Bit Retro Okyanus', price: 0, icon: '🏖️', desc: 'Dithered turkuaz retro su, mağara kemeri ve kum.' },
            { id: 'lagoon', name: 'Zümrüt Lagün', price: 200, icon: '🏝️', desc: 'Turkuaz lagün suyu atmosferi.' },
            { id: 'cyberpunk', name: 'Siberpunk Kick Neon', price: 350, icon: '⚡', desc: 'Mor ve neon yeşili fütüristik atmosfer.' }
        ]
    };

    let userInventory = loadUserInventory();

    function loadUserInventory() {
        try {
            const raw = localStorage.getItem('akvaryum_cosmetics_inventory');
            return raw ? JSON.parse(raw) : {
                trails: ['default'],
                decors: ['none'],
                themes: ['retro_ocean']
            };
        } catch (e) {
            return { trails: ['default'], decors: ['none'], themes: ['retro_ocean'] };
        }
    }

    function saveUserInventory() {
        try {
            localStorage.setItem('akvaryum_cosmetics_inventory', JSON.stringify(userInventory));
        } catch (e) {}
    }

    // 5. Sekme Değiştirme
    function switchTab(tabName) {
        activeTab = tabName;
        Object.keys(tabs).forEach(key => {
            if (tabs[key]) {
                tabs[key].classList.toggle('active', key === tabName);
            }
            if (tabBtns[key]) {
                tabBtns[key].classList.toggle('active', key === tabName);
            }
        });

        if (tabName === 'pet') {
            aquariumSim.resize();
        } else if (tabName === 'community') {
            renderCommunityAquariums();
        } else if (tabName === 'ocean') {
            oceanSim.resize();
            updateOceanStats();
        }
    }

    Object.keys(tabBtns).forEach(key => {
        if (tabBtns[key]) {
            tabBtns[key].addEventListener('click', () => {
                window.soundEngine && window.soundEngine.ensureContext();
                switchTab(key);
            });
        }
    });

    // 6. 8-Bit Piksel Çizim Atölyesi Kontrolleri
    const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            drawEngine.setTool(btn.dataset.tool);
        });
    });

    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            drawEngine.setColor(swatch.dataset.color);
        });
    });

    // Piksel Fırça Boyutu Butonları (1x1, 2x2, 3x3)
    const sizeBtns = document.querySelectorAll('.tool-btn[data-size]');
    const brushSizeVal = document.getElementById('brushSizeVal');
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const sz = parseInt(btn.dataset.size, 10);
            drawEngine.setSize(sz);
            if (brushSizeVal) brushSizeVal.textContent = `${sz}x${sz}`;
        });
    });

    // Izgara Aç/Kapa Butonu
    const btnToggleGrid = document.getElementById('btnToggleGrid');
    if (btnToggleGrid) {
        btnToggleGrid.addEventListener('click', () => {
            const isVisible = drawEngine.toggleGrid();
            btnToggleGrid.style.borderColor = isVisible ? 'var(--kick-green)' : 'var(--retro-border)';
            btnToggleGrid.style.color = isVisible ? 'var(--kick-green)' : '#fff';
        });
    }

    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) btnUndo.addEventListener('click', () => drawEngine.undo());

    const btnClearCanvas = document.getElementById('btnClearCanvas');
    if (btnClearCanvas) btnClearCanvas.addEventListener('click', () => drawEngine.clear());

    const btnLoadSampleFish = document.getElementById('btnLoadSampleFish');
    if (btnLoadSampleFish) {
        btnLoadSampleFish.addEventListener('click', () => {
            const types = ['fish', 'goldfish'];
            const chosen = types[Math.floor(Math.random() * types.length)];
            drawEngine.loadTemplate(chosen);
        });
    }

    // Varsayılan 8-bit balık şablonunu yükle
    drawEngine.loadTemplate('fish');

    // 7. Balığı Canlandır ve Akvaryuma Bırak
    const btnBringToLife = document.getElementById('btnBringToLife');
    if (btnBringToLife) {
        btnBringToLife.addEventListener('click', () => {
            window.soundEngine && window.soundEngine.ensureContext();

            const fishName = (document.getElementById('inputFishName') ? document.getElementById('inputFishName').value : '') || 'Piksel Balık';
            const user = window.kickAuth ? window.kickAuth.getUser() : null;
            const creatorName = (user && user.username) || (inputCreatorName ? inputCreatorName.value : '') || 'pristagna';

            const fishData = drawEngine.exportFishData(fishName, creatorName);
            if (!fishData) {
                alert('Lütfen önce tuval üzerine bir piksel balık çizin!');
                return;
            }

            currentActiveFish = fishData;
            aquariumSim.loadFish(fishData);

            networkMgr.broadcastMyAquarium({
                id: fishData.id,
                name: fishData.name,
                creator: fishData.creator,
                level: 1,
                oxygen: 85,
                algaeDirty: 0,
                dataUrl: fishData.dataUrl,
                width: fishData.width,
                height: fishData.height,
                equippedCosmetics: aquariumSim.equippedCosmetics
            });

            if (hudFishAvatar) hudFishAvatar.src = fishData.dataUrl;
            if (hudFishName) hudFishName.textContent = fishData.name;
            if (hudFishLevel) hudFishLevel.textContent = `Seviye 1/10 (Yavru) • @${fishData.creator}`;

            window.soundEngine && window.soundEngine.playLevelUp();
            switchTab('pet');
        });
    }

    // 8. Kişisel Akvaryum Etkileşimleri
    if (btnPumpAir) {
        btnPumpAir.addEventListener('click', () => {
            aquariumSim.pumpAir();
        });
    }

    if (feedBtn) {
        feedBtn.addEventListener('click', () => {
            if (feedBtn.classList.contains('ready')) {
                aquariumSim.feedFish();
            }
        });
    }

    aquariumSim.onGoldEarnedCallback = (totalGold) => {
        updateGoldUI(totalGold);
        if (hudGoldDisplay) {
            hudGoldDisplay.classList.remove('bounce');
            void hudGoldDisplay.offsetWidth;
            hudGoldDisplay.classList.add('bounce');
        }
    };

    function updateGoldUI(amount) {
        if (userGoldCount) userGoldCount.textContent = amount;
        if (shopUserGold) shopUserGold.textContent = amount;
    }

    // Akvaryum Durum Değişikliği (Bölgesel Yosun & Yaşam Durumu)
    aquariumSim.onStatusChangeCallback = (status) => {
        updateGoldUI(status.gold);

        if (status.isGuestMode) {
            if (guestBanner) guestBanner.style.display = 'block';
            if (guestOwnerName) guestOwnerName.textContent = status.guestOwner || 'İzleyici';
            if (feedBtn) feedBtn.style.display = 'none';
            if (btnReleaseToOcean) btnReleaseToOcean.style.display = 'none';
        } else {
            if (guestBanner) guestBanner.style.display = 'none';
            if (feedBtn) feedBtn.style.display = 'flex';
        }

        if (hudOxygenVal) hudOxygenVal.textContent = `${status.oxygen}%`;
        if (barOxygen) {
            barOxygen.style.width = `${status.oxygen}%`;
            barOxygen.style.background = status.oxygen < 25 ? '#ff4d6d' : 'linear-gradient(90deg, #ff4d6d, #ffd166, #06d6a0, #53FC18)';
        }

        // Bölgesel Yosun Lekesi Sayısı & Kirlilik
        const patchCount = status.algaePatchCount !== undefined ? status.algaePatchCount : 0;
        if (hudAlgaeVal) hudAlgaeVal.textContent = patchCount === 0 ? 'Tertemiz (%0)' : `${patchCount} Leke (%${status.algaeDirty})`;
        if (barAlgae) barAlgae.style.width = `${status.algaeDirty}%`;

        if (hudGrowthVal) hudGrowthVal.textContent = `${status.level} / ${status.maxLevel} Yem`;
        if (barGrowth) barGrowth.style.width = `${(status.level / status.maxLevel) * 100}%`;
        if (hudFishLevel) hudFishLevel.textContent = `Seviye ${status.level}/${status.maxLevel} ${status.isFullGrown ? '(Yetişkin!)' : ''} • @${status.creator}`;

        if (hudAfkTimerText) {
            if (status.isSick) {
                hudAfkTimerText.innerHTML = `<span style="color:#ff4d6d;">DURDU</span>`;
            } else {
                hudAfkTimerText.textContent = `${status.afkSecondsRemaining}sn kaldı`;
            }
        }

        if (status.isSick && hudFishLevel) {
            hudFishLevel.innerHTML = `<span style="color:#ff4d6d;">🩹 HASTA! Camdaki yosun lekelerini silin ve oksijen basın!</span>`;
        }

        if (!status.isGuestMode && feedBtn) {
            if (status.feedCooldown <= 0) {
                feedBtn.disabled = false;
                feedBtn.classList.add('ready');
                if (feedBtnText) feedBtnText.textContent = '🍣 Yem Ver!';
                if (feedTimerText) feedTimerText.textContent = 'Hazır!';
            } else {
                feedBtn.disabled = true;
                feedBtn.classList.remove('ready');
                const mins = Math.floor(status.feedCooldown / 60);
                const secs = status.feedCooldown % 60;
                if (feedBtnText) feedBtnText.textContent = 'Yem Hazırlanıyor';
                if (feedTimerText) feedTimerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} Kalan`;
            }

            if (btnReleaseToOcean) {
                if (status.isFullGrown) {
                    btnReleaseToOcean.classList.add('show');
                } else {
                    btnReleaseToOcean.classList.remove('show');
                }
            }
        }

        if (currentActiveFish && !status.isGuestMode) {
            networkMgr.saveActivePetProgress(currentActiveFish, status);
        }
    };

    if (btnGuestPetFish) {
        btnGuestPetFish.addEventListener('click', () => {
            aquariumSim.petFish();
        });
    }

    if (btnReturnMyTank) {
        btnReturnMyTank.addEventListener('click', () => {
            aquariumSim.returnToMyAquarium();
        });
    }

    // 9. Okyanusa Salma Ritüeli
    if (btnReleaseToOcean) {
        btnReleaseToOcean.addEventListener('click', () => {
            btnReleaseToOcean.disabled = true;
            btnReleaseToOcean.classList.remove('show');

            const releasedData = aquariumSim.releaseToOcean();
            if (releasedData) {
                networkMgr.broadcastFishRelease(releasedData);
                networkMgr.clearActivePet();

                setTimeout(() => {
                    if (celebrationDesc) {
                        celebrationDesc.textContent = `"${releasedData.name}" isimli piksel balığın 100 dakikalık sevgi ve emeğin sonucunda Ortak Okyanus'a katıldı! Canlı yayında diğer tüm izleyicilerin balıklarıyla birlikte yüzüyor!`;
                    }
                    if (modalCelebration) modalCelebration.classList.add('active');
                }, 2400);
            }
        });
    }

    const btnViewInOcean = document.getElementById('btnViewInOcean');
    if (btnViewInOcean) {
        btnViewInOcean.addEventListener('click', () => {
            if (modalCelebration) modalCelebration.classList.remove('active');
            aquariumSim.resetAquarium();
            currentActiveFish = null;
            switchTab('ocean');
        });
    }

    const btnCreateNewFish = document.getElementById('btnCreateNewFish');
    if (btnCreateNewFish) {
        btnCreateNewFish.addEventListener('click', () => {
            if (modalCelebration) modalCelebration.classList.remove('active');
            aquariumSim.resetAquarium();
            currentActiveFish = null;
            drawEngine.clear();
            switchTab('draw');
        });
    }

    // 10. Topluluk Akvaryumları (Ziyaret Ekranı)
    function renderCommunityAquariums() {
        const grid = document.getElementById('communityGrid');
        if (!grid) return;

        const list = networkMgr.getCommunityAquariums();
        grid.innerHTML = '';

        if (list.length === 0) {
            grid.innerHTML = `<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center; padding: 40px 10px; font-family:var(--font-pixel); font-size:10px;">Henüz aktif bir akvaryum bulunmuyor. Kendi balığını çizerek ilk akvaryumu açabilirsin!</p>`;
            return;
        }

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'aquarium-card';

            const trailName = COSMETIC_CATALOG.trails.find(t => t.id === (item.equippedCosmetics && item.equippedCosmetics.trail))?.name || 'Doğal İzi';

            card.innerHTML = `
                <div class="card-fish-preview">
                    <img src="${item.dataUrl}" alt="${item.name}">
                </div>
                <div class="card-owner-info">
                    <h4>${item.name}</h4>
                    <p>@${item.creator}</p>
                </div>
                <div class="card-badges">
                    <span class="mini-badge">Lv. ${item.level || 1}</span>
                    <span class="mini-badge">O2: %${item.oxygen || 85}</span>
                    <span class="mini-badge">✨ ${trailName}</span>
                </div>
                <button class="primary-btn card-visit-btn" data-id="${item.id}">
                    🚀 Akvaryumu Ziyaret Et
                </button>
            `;

            const visitBtn = card.querySelector('.card-visit-btn');
            visitBtn.addEventListener('click', () => {
                aquariumSim.loadGuestAquarium(item);
                switchTab('pet');
            });

            grid.appendChild(card);
        });
    }

    const btnRefreshCommunity = document.getElementById('btnRefreshCommunity');
    if (btnRefreshCommunity) {
        btnRefreshCommunity.addEventListener('click', () => {
            renderCommunityAquariums();
        });
    }

    // 11. Kozmetik Dükkanı Mantığı (Shop Modal)
    if (btnOpenShop) {
        btnOpenShop.addEventListener('click', () => {
            renderShopItems();
            if (modalShop) modalShop.classList.add('active');
        });
    }

    if (btnCloseShop) {
        btnCloseShop.addEventListener('click', () => {
            if (modalShop) modalShop.classList.remove('active');
        });
    }

    const shopTabs = [
        { id: 'trails', btn: document.getElementById('shopTabTrails') },
        { id: 'decors', btn: document.getElementById('shopTabDecors') },
        { id: 'themes', btn: document.getElementById('shopTabThemes') }
    ];

    shopTabs.forEach(st => {
        if (st.btn) {
            st.btn.addEventListener('click', () => {
                shopTabs.forEach(s => s.btn && s.btn.classList.remove('active'));
                st.btn.classList.add('active');
                activeShopCategory = st.id;
                renderShopItems();
            });
        }
    });

    function renderShopItems() {
        if (!shopItemsContainer) return;
        shopItemsContainer.innerHTML = '';

        const items = COSMETIC_CATALOG[activeShopCategory] || [];
        const owned = userInventory[activeShopCategory] || [];
        const currentEquipped = aquariumSim.equippedCosmetics[
            activeShopCategory === 'trails' ? 'trail' : (activeShopCategory === 'decors' ? 'decor' : 'theme')
        ];

        items.forEach(item => {
            const isOwned = owned.includes(item.id);
            const isEquipped = currentEquipped === item.id;

            const card = document.createElement('div');
            card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;

            let actionBtnHtml = '';
            if (isEquipped) {
                actionBtnHtml = `<button class="btn-buy-equip btn-equipped" disabled>Kullanımda</button>`;
            } else if (isOwned) {
                actionBtnHtml = `<button class="btn-buy-equip btn-equip" data-action="equip" data-id="${item.id}">Kullan</button>`;
            } else {
                actionBtnHtml = `<button class="btn-buy-equip btn-buy" data-action="buy" data-id="${item.id}">Satın Al</button>`;
            }

            card.innerHTML = `
                <div class="item-icon-box">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.desc}</div>
                <div class="item-footer">
                    <span class="item-price">${item.price === 0 ? 'Ücretsiz' : `${item.price} 🪙`}</span>
                    ${actionBtnHtml}
                </div>
            `;

            const btn = card.querySelector('.btn-buy-equip');
            if (btn && !btn.disabled) {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action === 'buy') {
                        if (aquariumSim.gold >= item.price) {
                            aquariumSim.gold -= item.price;
                            userInventory[activeShopCategory].push(item.id);
                            saveUserInventory();

                            const type = activeShopCategory === 'trails' ? 'trail' : (activeShopCategory === 'decors' ? 'decor' : 'theme');
                            aquariumSim.equipCosmetic(type, item.id);
                            updateGoldUI(aquariumSim.gold);
                            window.soundEngine && window.soundEngine.playBuy();
                            renderShopItems();
                        } else {
                            alert(`Yeterli altının yok! Bu kozmetik için ${item.price} Gold gerekiyor. Yayında AFK kalarak veya balığına iyi bakarak altın toplayabilirsin!`);
                        }
                    } else if (action === 'equip') {
                        const type = activeShopCategory === 'trails' ? 'trail' : (activeShopCategory === 'decors' ? 'decor' : 'theme');
                        aquariumSim.equipCosmetic(type, item.id);
                        window.soundEngine && window.soundEngine.playLevelUp();
                        renderShopItems();
                    }
                });
            }

            shopItemsContainer.appendChild(card);
        });
    }

    // 12. Ortak Okyanus MMO Entegrasyonu
    oceanSim.loadStarterCommunityFish();

    const storedFishes = networkMgr.getStoredFishes();
    storedFishes.forEach(f => oceanSim.addFish(f, false));

    networkMgr.onFishReceivedCallback = (fishData, isNewArrival) => {
        oceanSim.addFish(fishData, isNewArrival);
        updateOceanStats();
    };

    function updateOceanStats() {
        if (statOceanFishCount) statOceanFishCount.textContent = oceanSim.fishes.length;
        if (statTotalReleased) statTotalReleased.textContent = Math.max(oceanSim.fishes.length, networkMgr.getStoredFishes().length);
    }

    const btnDropOceanFood = document.getElementById('btnDropOceanFood');
    if (btnDropOceanFood) {
        btnDropOceanFood.addEventListener('click', () => {
            const w = window.innerWidth;
            for (let i = 0; i < 5; i++) {
                oceanSim.dropFood(Math.random() * w, 50 + Math.random() * 100);
            }
            window.soundEngine && window.soundEngine.playBubble(1.4);
        });
    }

    const btnToggleObsMode = document.getElementById('btnToggleObsMode');
    if (btnToggleObsMode) {
        btnToggleObsMode.addEventListener('click', () => {
            document.body.classList.toggle('obs-mode');
            oceanSim.resize();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.classList.remove('obs-mode');
            oceanSim.resize();
        }
    });

    // 13. Hızlı Test & Ses Kontrolleri
    const btnToggleFastMode = document.getElementById('btnToggleFastMode');
    if (btnToggleFastMode) {
        btnToggleFastMode.addEventListener('click', () => {
            const isFast = aquariumSim.toggleFastTestMode();
            btnToggleFastMode.style.color = isFast ? '#53FC18' : 'inherit';
            btnToggleFastMode.style.borderColor = isFast ? '#53FC18' : 'var(--retro-border)';
        });
    }

    const btnToggleSound = document.getElementById('btnToggleSound');
    if (btnToggleSound) {
        btnToggleSound.addEventListener('click', () => {
            const muted = window.soundEngine.toggleMute();
            btnToggleSound.textContent = muted ? '🔇' : '🔊';
        });
    }

    window.addEventListener('click', () => {
        window.soundEngine && window.soundEngine.ensureContext();
    }, { once: true });

    // 14. URL Parametreleri Desteği & Geri Yükleme
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('obs') === '1') {
        document.body.classList.add('obs-mode');
        switchTab('ocean');
    } else if (urlParams.get('view') === 'ocean') {
        switchTab('ocean');
    } else if (urlParams.get('view') === 'community') {
        switchTab('community');
    }

    const savedPet = networkMgr.loadActivePetProgress();
    if (savedPet && savedPet.fishData && !urlParams.get('view')) {
        currentActiveFish = savedPet.fishData;
        aquariumSim.loadFish(savedPet.fishData, savedPet);
        if (hudFishAvatar) hudFishAvatar.src = savedPet.fishData.dataUrl;
        if (hudFishName) hudFishName.textContent = savedPet.fishData.name;
        if (hudFishLevel) hudFishLevel.textContent = `Seviye ${savedPet.level || 1}/10 • @${savedPet.fishData.creator}`;
        switchTab('pet');
    }

    updateOceanStats();
    updateGoldUI(aquariumSim.gold);
});
