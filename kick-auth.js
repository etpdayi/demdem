/**
 * Akvaryum - Kick OAuth 2.0 Kimlik Doğrulama Motoru (PKCE & Authorization Code)
 * Kick Developers API Entegrasyonu:
 * Client ID: 01M704E9HN0NWT18M0PSBN6QWJ
 * Redirect URI: https://etpdayi.github.io/akvaryum/
 */

class KickAuthManager {
    constructor() {
        this.clientId = '01M704E9HN0NWT18M0PSBN6QWJ';
        this.clientSecret = '79654d629dba214396957b1065dd5cad61d46f20bd3ef8c6dbb5c7a4ebffa205';
        this.configuredRedirectUri = 'https://etpdayi.github.io/akvaryum/';
        
        this.storageKey = 'akvaryum_kick_session';
        this.currentUser = null;
        this.onAuthChangeCallback = null;

        this.init();
    }

    init() {
        // 1. Kaydedilmiş oturumu yükle
        this.loadStoredUser();

        // 2. URL'de OAuth geri dönüş kodu var mı kontrol et (?code=...&state=...)
        this.handleOAuthCallback();
    }

    getEffectiveRedirectUri() {
        // GitHub Pages'te veya yapılandırılan canlı adreste ise yapılandırılan adresi kullan
        if (window.location.hostname.includes('github.io')) {
            return this.configuredRedirectUri;
        }
        // Yerel geliştirme (localhost / 127.0.0.1) için mevcut adresi al
        const currentUrl = window.location.origin + window.location.pathname;
        return currentUrl;
    }

    loadStoredUser() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                this.currentUser = JSON.parse(raw);
            }
        } catch (e) {
            this.currentUser = null;
        }
    }

    saveUser(user) {
        this.currentUser = user;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(user));
            // Ayrıca eski basit anahtar ile de senkronize tut
            localStorage.setItem('akvaryum_kick_user', user.username);
        } catch (e) {}

        if (this.onAuthChangeCallback) {
            this.onAuthChangeCallback(this.currentUser);
        }
    }

    logout() {
        this.currentUser = null;
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem('akvaryum_kick_user');
        } catch (e) {}

        if (this.onAuthChangeCallback) {
            this.onAuthChangeCallback(null);
        }
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }

    // PKCE Yardımcıları
    generateRandomString(length = 64) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const values = new Uint8Array(length);
        window.crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    }

    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        
        let str = '';
        const bytes = new Uint8Array(digest);
        for (let i = 0; i < bytes.byteLength; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    // 1. Kick OAuth Giriş Yönlendirmesi Başlat
    async startKickLogin() {
        try {
            const state = this.generateRandomString(32);
            const codeVerifier = this.generateRandomString(64);
            const codeChallenge = await this.generateCodeChallenge(codeVerifier);

            const redirectUri = this.getEffectiveRedirectUri();

            // Verifier ve state'i oturum süresince sakla
            sessionStorage.setItem('kick_oauth_state', state);
            sessionStorage.setItem('kick_oauth_verifier', codeVerifier);
            sessionStorage.setItem('kick_oauth_redirect_uri', redirectUri);

            const scope = 'user:read channel:read';
            const authUrl = `https://id.kick.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(this.clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&state=${encodeURIComponent(state)}`;

            console.log('⚡ Kick OAuth Yönlendiriliyor:', authUrl);
            window.location.href = authUrl;
        } catch (e) {
            console.error('Kick OAuth başlatma hatası:', e);
            alert('Kick kimlik doğrulama başlatılamadı: ' + e.message);
        }
    }

    // 2. OAuth Geri Dönüşünü İşle (?code=...&state=...)
    async handleOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        if (error) {
            console.warn('Kick OAuth hatası döndü:', error, params.get('error_description'));
            this.cleanUrlParams();
            return;
        }

        if (!code) return;

        const savedState = sessionStorage.getItem('kick_oauth_state');
        const codeVerifier = sessionStorage.getItem('kick_oauth_verifier');
        const redirectUri = sessionStorage.getItem('kick_oauth_redirect_uri') || this.getEffectiveRedirectUri();

        // Güvenlik: State kontrolü
        if (savedState && state !== savedState) {
            console.error('State uyuşmazlığı tespit edildi.');
            this.cleanUrlParams();
            return;
        }

        console.log('⚡ Kick OAuth Geri Dönüş Kodu Alındı, token takası yapılıyor...');

        try {
            // Token Endpoint'ine istek at
            const tokenParams = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: redirectUri,
                code: code
            });

            if (codeVerifier) {
                tokenParams.append('code_verifier', codeVerifier);
            }

            const tokenRes = await fetch('https://id.kick.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: tokenParams.toString()
            });

            if (!tokenRes.ok) {
                const errText = await tokenRes.text();
                throw new Error(`Token isteği başarısız (${tokenRes.status}): ${errText}`);
            }

            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;

            // Kullanıcı Bilgilerini Çek
            let username = 'KickOyuncu';
            let avatar = null;
            let userId = null;

            try {
                const userRes = await fetch('https://api.kick.com/public/v1/users', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json'
                    }
                });

                if (userRes.ok) {
                    const userData = await userRes.json();
                    const profile = (userData.data && userData.data[0]) || userData.data || userData;
                    username = profile.username || profile.name || username;
                    avatar = profile.profile_picture || profile.avatar || null;
                    userId = profile.id || profile.user_id || null;
                }
            } catch (userErr) {
                console.warn('Kullanıcı bilgisi çekilirken hata:', userErr);
            }

            const userSession = {
                username: username,
                avatar: avatar,
                userId: userId,
                accessToken: accessToken,
                authenticatedAt: Date.now()
            };

            this.saveUser(userSession);
            console.log('✅ Kick ile başarıyla giriş yapıldı:', userSession.username);
        } catch (e) {
            console.error('Kick Token takas hatası:', e);
            // Tarayıcı içi CORS kısıtlaması durumunda veya yerel testte kullanıcı adını doğrudan onaylama alternatifi sun
            const fallbackName = prompt('Kick yetkilendirme kodu alındı! Giriş yapılacak Kick kullanıcı adınızı onaylayın:', 'pristagna');
            if (fallbackName) {
                this.saveUser({
                    username: fallbackName.trim().replace('@', ''),
                    avatar: null,
                    authenticatedAt: Date.now()
                });
            }
        } finally {
            // Oturum çerezlerini temizle ve URL'i temizle
            sessionStorage.removeItem('kick_oauth_state');
            sessionStorage.removeItem('kick_oauth_verifier');
            sessionStorage.removeItem('kick_oauth_redirect_uri');
            this.cleanUrlParams();
        }
    }

    cleanUrlParams() {
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, url.toString());
    }

    // Manuel Giriş (Yerel test veya alternatif hızlı giriş için)
    manualLogin(username) {
        if (!username) return;
        const cleanName = username.trim().replace('@', '');
        this.saveUser({
            username: cleanName,
            avatar: null,
            manual: true,
            authenticatedAt: Date.now()
        });
    }
}

window.kickAuth = new KickAuthManager();
