# 🐟 Akvaryum (8-Bit Pixel Art & Canlı Yayın MMO)

> 8-Bit retro arcade piksel grafikleri, derin sanal bebek (Tamagotchi) hayatta kalma mekanikleri, **Resmi Kick OAuth 2.0 Giriş Kapısı**, **AFK Gold Farming (Pasif Gelir)** ve **Topluluk Akvaryumlarını Ziyaret** sistemiyle donatılmış kolektif dijital akvaryum.

---

## 🔐 Kick OAuth 2.0 Entegrasyonu ve Giriş Kapısı

Oyun açıldığında doğrudan oyuna girilemez; oyuncuyu retro arcade kabini şeklinde bir **Kick Giriş Kapısı** karşılar. Giriş yapıldıktan sonra akvaryum dünyası açılır.

- **Client ID:** `01M704E9HN0NWT18M0PSBN6QWJ`
- **Redirect URI:** `https://etpdayi.github.io/akvaryum/`
- **Scopes:** `user:read channel:read`
- **Kullanım:**
  - İzleyici giriş kapısındaki **"⚡ KICK İLE GİRİŞ YAP (OAUTH 2.0)"** butonuna tıklar.
  - Açılan pencere üzerinden doğrudan resmi Kick onay ekranına yönlendirilir (`id.kick.com`).
  - Onay verildikten sonra GitHub Pages sayfasına (`https://etpdayi.github.io/akvaryum/`) geri dönülür.
  - Kod otomatik olarak token'a dönüştürülür, kullanıcının avatarı ve `@kullaniciadi` profil bilgileri çekilerek oyuna kaydedilir.
  - Alternatif olarak doğrudan Kick kullanıcı adı girilerek de hızlı giriş yapılabilir.
  - Çizilen tüm piksel balıklar ve topluluk etkileşimleri kullanıcının resmi Kick hesabıyla eşleşir.

---

## 🎨 8-Bit Piksel Sanat Tasarımı ve Oyun Döngüsü

1. **8-Bit Piksel Çizim Atölyesi:**
   - 54x36 ızgara üzerinde 1x1, 2x2 ve 3x3 piksel fırçaları, retro 16 renk paleti, kova dolgusu ve canlı önizleme ile kendi piksel balığını çiz.
2. **Kişisel 8-Bit Akvaryum & Bölgesel Yosunlaşma:**
   - Dithered piksel su katmanları, 8-bit kaya kemeri ve salınan deniz yosunları.
   - Sürekli piksel kirlenme yerine, belirli aralıklarla (yaklaşık her 45 saniyede bir) camın üzerinde organik dairesel piksel yosun lekeleri belirir.
   - Oyuncu sünger imleciyle lekenin üstünü siler ve **+2 Gold** temizlik ödülü kazanır.
3. **10 Dakikada Bir Ana Yem:**
   - 10 yem = 100 dakika yayın izleme emeği ile yavru piksel balık olgun bir yetişkine dönüşür.
4. **🪙 AFK Gold Farming (Pasif Gelir):**
   - Balık sağlıklı yaşadığı her dakika kullanıcıya pasif olarak **+10 Gold** kazandırır.
   - Hastalanırsa (oksijen düşerse veya lekeler silinmezse) altın üretimi durur!
5. **🛍️ 8-Bit Yüzme İzi ve Kozmetik Dükkanı:**
   - Kazandığınız altınlarla balığınıza **Kick Neon Yeşili**, **Sihirli Yıldız Tozu**, **Altın Hazine Tozu** ve **Gökkuşağı Akışı** gibi retro piksel yüzme izleri satın alabilirsiniz.
6. **👥 Topluluk Akvaryumlarını Ziyaret Et:**
   - Diğer izleyicilerin piksel akvaryumları gezilebilir, balıkları sevilerek karşılıklı **+5 Gold** kazanılabilir.
7. **🌊 Ortak Okyanus (8-Bit MMO):**
   - 10. yeme ulaşan balık okyanusa salınır; tüm izleyicilerin piksel balıkları devasa ortak okyanusta hep birlikte yüzer.

---

## 🚀 Dağıtım (GitHub Pages Kurulumu)

Projeyi `https://etpdayi.github.io/akvaryum/` adresinde canlıya almak için:

1. Proje klasöründeki dosyaları GitHub'da `akvaryum` isimli bir depoya (repository) yükleyin:
   ```bash
   git init
   git add .
   git commit -m "Akvaryum 8-Bit Pixel Art & Kick OAuth Yayında"
   git branch -M main
   git remote add origin https://github.com/etpdayi/akvaryum.git
   git push -u origin main
   ```
2. Depo ayarlarından (**Settings** ➔ **Pages**) `main` dalını seçip kaydedin.
3. Birkaç saniye içinde `https://etpdayi.github.io/akvaryum/` adresinde oyun ve Kick OAuth girişiniz tam uyumlu olarak canlıya geçecektir!
