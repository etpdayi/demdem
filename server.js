const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'ocean_database.json');

// Statik dosyaları sun
app.use(express.static(__dirname));

// Bellekte ve dosyada balıkları saklama
let oceanFishes = [];
try {
    if (fs.existsSync(DB_FILE)) {
        oceanFishes = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
} catch (e) {
    console.error('Veritabanı okuma hatası:', e);
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(oceanFishes.slice(-200), null, 2));
    } catch (e) {
        console.error('Kayıt hatası:', e);
    }
}

// REST API
app.get('/api/fishes', (req, res) => {
    res.json(oceanFishes);
});

// Realtime Socket.IO
io.on('connection', (socket) => {
    console.log('⚡ Yeni bağlantı:', socket.id);

    // Bağlanan kullanıcıya mevcut okyanusu gönder
    socket.emit('ocean:init', oceanFishes);

    // Bir izleyici balığını okyanusa saldığında
    socket.on('fish:release', (fishData) => {
        console.log(`🌊 Yeni balık salındı: ${fishData.name} by @${fishData.creator}`);
        oceanFishes.push(fishData);
        saveDatabase();

        // Tüm okyanus ekranlarına ve yayına anons et
        io.emit('ocean:new_fish', fishData);
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🌊 Pristagna Kolektif Akvaryum Sunucusu Yayında!`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👉 OBS Browser Kaynağı: http://localhost:${PORT}?view=ocean&obs=1`);
    console.log(`===============================================`);
});
