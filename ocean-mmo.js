/**
 * Akvaryum - 8-Bit Pixel Art Ortak Okyanus (MMO Canlı Yayın & Topluluk Okyanusu)
 * Tüm izleyicilerin piksel balıklarının bir arada yüzdüğü devasa 8-bit okyanus.
 */

class SharedOcean {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.fishes = [];
        this.fishImages = new Map();
        this.foodPellets = [];
        this.bubbles = [];
        this.announcements = [];

        this.lastTime = performance.now();
        this.oceanTime = 0;
        this.animFrame = null;

        this.init();
    }

    init() {
        this.ctx.imageSmoothingEnabled = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInteractivity();
        this.startLoop();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    setupInteractivity() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.dropFood(x, y);
            window.soundEngine && window.soundEngine.playBubble(1.3);
        });
    }

    dropFood(x, y) {
        for (let i = 0; i < 4; i++) {
            this.foodPellets.push({
                x: Math.round((x + (Math.random() - 0.5) * 24) / 4) * 4,
                y: Math.round((y + (Math.random() - 0.5) * 16) / 4) * 4,
                vy: 1.8,
                size: 8
            });
        }
    }

    addFish(fishData, isNewArrival = false) {
        const exists = this.fishes.find(f => f.id === fishData.id);
        if (exists) return;

        let img = this.fishImages.get(fishData.dataUrl);
        if (!img) {
            img = new Image();
            img.src = fishData.dataUrl;
            this.fishImages.set(fishData.dataUrl, img);
        }

        const w = this.canvas.width || 1200;
        const h = this.canvas.height || 700;
        const depth = 0.7 + Math.random() * 0.5;

        const newFish = {
            id: fishData.id,
            name: fishData.name || 'Piksel Balık',
            creator: fishData.creator || 'pristagna',
            img: img,
            width: fishData.width || 100,
            height: fishData.height || 70,
            depth: depth,
            scale: (fishData.finalScale || 0.85) * depth,
            x: isNewArrival ? -80 : Math.random() * (w - 200) + 100,
            y: isNewArrival ? h * 0.35 : Math.random() * (h - 220) + 70,
            targetX: Math.random() * w,
            targetY: Math.random() * h,
            vx: 0,
            vy: 0,
            baseSpeed: (45 + Math.random() * 45) * depth,
            wiggleTimer: Math.random() * 10,
            facingRight: true,
            isNewArrival: isNewArrival,
            arrivalTimer: isNewArrival ? 3.5 : 0
        };

        this.fishes.push(newFish);

        if (isNewArrival) {
            this.triggerArrivalCelebration(newFish);
        }
    }

    triggerArrivalCelebration(fish) {
        window.soundEngine && window.soundEngine.playAscension();

        this.announcements.push({
            id: 'ann_' + Date.now(),
            text: `[ ★ @${fish.creator} OKYANUSA KATILDI! ★ ]`,
            subText: `"${fish.name}" isimli piksel balığı artık yayında yüzüyor!`,
            timer: 7.0,
            alpha: 1
        });

        for (let i = 0; i < 30; i++) {
            this.bubbles.push({
                x: 80 + Math.random() * 200,
                y: this.canvas.height - 20,
                vx: 0,
                vy: -Math.random() * 4 - 2,
                size: 8,
                alpha: 0.9
            });
        }
    }

    startLoop() {
        const loop = (currentTime) => {
            const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;
            this.oceanTime += dt;

            this.update(dt);
            this.render();

            this.animFrame = requestAnimationFrame(loop);
        };
        this.animFrame = requestAnimationFrame(loop);
    }

    update(dt) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (const f of this.fishes) {
            f.wiggleTimer += dt * 3.5;

            if (f.arrivalTimer > 0) {
                f.arrivalTimer -= dt;
            }

            if (this.foodPellets.length > 0) {
                let closest = null;
                let minDist = 400;
                for (const p of this.foodPellets) {
                    const d = Math.hypot(p.x - f.x, p.y - f.y);
                    if (d < minDist) {
                        minDist = d;
                        closest = p;
                    }
                }
                if (closest) {
                    f.targetX = closest.x;
                    f.targetY = closest.y;
                }
            } else if (Math.hypot(f.targetX - f.x, f.targetY - f.y) < 50 || Math.random() < 0.008) {
                f.targetX = 60 + Math.random() * (w - 120);
                f.targetY = 60 + Math.random() * (h - 180);
            }

            const dx = f.targetX - f.x;
            const dy = f.targetY - f.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 8) {
                const speed = f.baseSpeed * (this.foodPellets.length > 0 ? 1.8 : 1);
                f.vx = (dx / dist) * speed;
                f.vy = (dy / dist) * speed;
                f.x += f.vx * dt;
                f.y += f.vy * dt;

                if (Math.abs(f.vx) > 3) {
                    f.facingRight = f.vx > 0;
                }
            }
        }

        for (let i = this.foodPellets.length - 1; i >= 0; i--) {
            const p = this.foodPellets[i];
            p.y += p.vy;

            for (const f of this.fishes) {
                if (Math.hypot(f.x - p.x, f.y - p.y) < 35 * f.scale) {
                    this.foodPellets.splice(i, 1);
                    window.soundEngine && window.soundEngine.playEat();
                    break;
                }
            }

            if (p && p.y > h - 30) {
                this.foodPellets.splice(i, 1);
            }
        }

        if (Math.random() < 0.2) {
            this.bubbles.push({
                x: Math.round((Math.random() * w) / 4) * 4,
                y: h + 10,
                vx: 0,
                vy: -Math.random() * 2.5 - 1.5,
                size: 6,
                alpha: 0.7
            });
        }

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y += b.vy;
            if (b.y < -20) {
                this.bubbles.splice(i, 1);
            }
        }

        for (let i = this.announcements.length - 1; i >= 0; i--) {
            const a = this.announcements[i];
            a.timer -= dt;
            if (a.timer < 1.0) {
                a.alpha = Math.max(0, a.timer);
            }
            if (a.timer <= 0) {
                this.announcements.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);

        // 1. 8-Bit Dithered Okyanus Suyu
        const bands = [
            { h: h * 0.28, c: '#20a39e' },
            { h: h * 0.60, c: '#0b6e8a' },
            { h: h * 0.85, c: '#064963' },
            { h: h,        c: '#042d3e' }
        ];

        let prevH = 0;
        for (const b of bands) {
            ctx.fillStyle = b.c;
            ctx.fillRect(0, prevH, w, b.h - prevH);
            prevH = b.h;
        }

        // 2. Dip Kum & Çizgiler
        const sandH = 90;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, h - sandH, w, 4);
        ctx.fillStyle = '#e0c097';
        ctx.fillRect(0, h - sandH + 4, w, sandH);

        // Kum benekleri
        ctx.fillStyle = '#b89065';
        for (let x = 0; x < w; x += 16) {
            ctx.fillRect(x, h - sandH + 16, 4, 4);
            ctx.fillRect(x + 8, h - sandH + 36, 4, 4);
        }

        // 3. Piksel Yemler
        for (const p of this.foodPellets) {
            ctx.fillStyle = '#ff9800';
            ctx.fillRect(Math.round(p.x), Math.round(p.y), 8, 8);
        }

        // 4. Piksel Kabarcıklar
        for (const b of this.bubbles) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size);
        }

        // 5. Piksel Balıklar
        const sortedFishes = [...this.fishes].sort((a, b) => a.depth - b.depth);
        for (const f of sortedFishes) {
            this.renderOceanPixelFish(ctx, f);
        }

        // 6. Retro Arcade Duyuru Banner'ı
        this.renderPixelAnnouncements(ctx, w, h);
    }

    renderOceanPixelFish(ctx, f) {
        if (!f.img || !f.img.complete) return;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const fx = Math.round(f.x);
        const fy = Math.round(f.y);
        ctx.translate(fx, fy);

        ctx.globalAlpha = Math.min(1.0, 0.7 + f.depth * 0.3);

        const dir = f.facingRight ? 1 : -1;
        ctx.scale(dir * f.scale, f.scale);

        const stepBob = Math.round(Math.sin(f.wiggleTimer * 2) * 2) * 2;
        ctx.translate(0, stepBob);

        ctx.drawImage(
            f.img,
            -f.width / 2,
            -f.height / 2,
            f.width,
            f.height
        );

        ctx.restore();

        // 8-Bit İsim & Kick Nickname Etiketi
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '10px "Press Start 2P", monospace';

        const labelY = Math.round(f.y - (f.height * 0.5 * f.scale) - 12);
        ctx.fillStyle = '#000000';
        ctx.fillText(f.name, Math.round(f.x) + 2, labelY + 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(f.name, Math.round(f.x), labelY);

        ctx.fillStyle = '#000000';
        ctx.fillText(`@${f.creator}`, Math.round(f.x) + 2, labelY + 14);
        ctx.fillStyle = '#53FC18';
        ctx.fillText(`@${f.creator}`, Math.round(f.x), labelY + 12);

        ctx.restore();
    }

    renderPixelAnnouncements(ctx, w, h) {
        if (this.announcements.length === 0) return;

        const a = this.announcements[0];
        ctx.save();
        ctx.globalAlpha = a.alpha;

        const boxW = Math.min(680, w * 0.88);
        const boxH = 80;
        const boxX = Math.round((w - boxW) / 2);
        const boxY = 40;

        // 8-Bit Çerçeve
        ctx.fillStyle = '#000000';
        ctx.fillRect(boxX - 4, boxY - 4, boxW + 8, boxH + 8);
        ctx.fillStyle = '#061a2e';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#53FC18';
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(a.text, w / 2, boxY + 34);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#53FC18';
        ctx.fillText(a.subText, w / 2, boxY + 60);

        ctx.restore();
    }

    loadStarterCommunityFish() {
        if (this.fishes.length > 0) return;

        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 120;
        dummyCanvas.height = 80;
        const dCtx = dummyCanvas.getContext('2d');
        dCtx.imageSmoothingEnabled = false;

        // 8-Bit Starter Fish
        dCtx.fillStyle = '#53FC18';
        dCtx.fillRect(30, 24, 60, 32);
        dCtx.fillRect(16, 20, 16, 40);
        dCtx.fillStyle = '#000000';
        dCtx.fillRect(72, 30, 6, 6);
        dCtx.fillStyle = '#ffffff';
        dCtx.fillRect(70, 28, 4, 4);

        this.addFish({
            id: 'starter_0',
            name: 'Piksel Reis',
            creator: 'pristagna',
            dataUrl: dummyCanvas.toDataURL(),
            width: 120,
            height: 80,
            finalScale: 0.85
        }, false);
    }
}

window.SharedOcean = SharedOcean;
