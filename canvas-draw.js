/**
 * Akvaryum - 8-Bit Pixel Art Çizim ve Yaratım Motoru
 * Izgara tabanlı (Grid-based) piksel çizim, retro 8-bit palet, kova ve şablonlar.
 */

class FishDrawingCanvas {
    constructor(canvasId, previewCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById(previewCanvasId);
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

        // Piksel Izgarası Boyutları (54 x 36 piksel)
        this.cols = 54;
        this.rows = 36;
        this.pixelSize = 10; // 540x360 tuvalde her piksel 10x10

        // Piksel Matrisi (null = şeffaf, string = hex renk)
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));

        this.isDrawing = false;
        this.currentColor = '#53FC18'; // Kick Neon Yeşili
        this.currentBrushSize = 1; // 1x1, 2x2, 3x3 piksel
        this.currentTool = 'brush'; // 'brush' | 'eraser' | 'fill'
        this.showGrid = true;
        this.history = [];
        this.maxHistory = 20;

        this.previewFish = null;
        this.previewAnimFrame = null;
        this.previewTime = 0;

        this.init();
    }

    init() {
        this.ctx.imageSmoothingEnabled = false;
        if (this.previewCtx) this.previewCtx.imageSmoothingEnabled = false;

        this.setupEventListeners();
        this.saveState();
        this.renderCanvas();
        this.startPreviewAnimation();
    }

    setupEventListeners() {
        const c = this.canvas;

        const getGridPos = (e) => {
            const rect = c.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const x = (clientX - rect.left) * (c.width / rect.width);
            const y = (clientY - rect.top) * (c.height / rect.height);

            const col = Math.floor(x / this.pixelSize);
            const row = Math.floor(y / this.pixelSize);
            return {
                col: Math.max(0, Math.min(this.cols - 1, col)),
                row: Math.max(0, Math.min(this.rows - 1, row))
            };
        };

        const onStart = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const { col, row } = getGridPos(e);

            if (this.currentTool === 'fill') {
                this.floodFill(col, row, this.currentColor);
                this.saveState();
                this.renderCanvas();
                this.updatePreviewImage();
            } else {
                this.applyPixelTool(col, row);
                this.renderCanvas();
            }
            window.soundEngine && window.soundEngine.ensureContext();
        };

        const onMove = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const { col, row } = getGridPos(e);
            if (this.currentTool !== 'fill') {
                this.applyPixelTool(col, row);
                this.renderCanvas();
            }
        };

        const onEnd = (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.saveState();
            this.updatePreviewImage();
        };

        c.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        c.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
    }

    applyPixelTool(col, row) {
        const color = this.currentTool === 'eraser' ? null : this.currentColor;
        const b = this.currentBrushSize;

        for (let r = 0; r < b; r++) {
            for (let c = 0; c < b; c++) {
                const tr = row + r;
                const tc = col + c;
                if (tr >= 0 && tr < this.rows && tc >= 0 && tc < this.cols) {
                    this.grid[tr][tc] = color;
                }
            }
        }
    }

    floodFill(startCol, startRow, targetColor) {
        const sourceColor = this.grid[startRow][startCol];
        if (sourceColor === targetColor) return;

        const queue = [[startCol, startRow]];
        const visited = new Set();

        while (queue.length > 0) {
            const [c, r] = queue.pop();
            const key = `${c},${r}`;
            if (visited.has(key)) continue;
            visited.add(key);

            if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue;
            if (this.grid[r][c] !== sourceColor) continue;

            this.grid[r][c] = targetColor;

            queue.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
        }
    }

    setTool(tool) {
        this.currentTool = tool;
    }

    setColor(color) {
        this.currentColor = color;
        if (this.currentTool === 'eraser') {
            this.currentTool = 'brush';
        }
    }

    setSize(size) {
        this.currentBrushSize = Math.max(1, Math.min(3, parseInt(size, 10)));
    }

    toggleGrid(show) {
        this.showGrid = show !== undefined ? show : !this.showGrid;
        this.renderCanvas();
    }

    saveState() {
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        // Matrisin derin kopyasını al
        const copy = this.grid.map(row => [...row]);
        this.history.push(copy);
    }

    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            const prev = this.history[this.history.length - 1];
            this.grid = prev.map(row => [...row]);
            this.renderCanvas();
            this.updatePreviewImage();
        } else if (this.history.length === 1) {
            this.clear(false);
        }
    }

    clear(save = true) {
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        if (save) {
            this.history = [];
            this.saveState();
        }
        this.renderCanvas();
        this.updatePreviewImage();
    }

    renderCanvas() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Şeffaflık Arka Plan Deseni (Retro Checkerboard)
        const checkSize = 10;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? '#0b233a' : '#081c2f';
                ctx.fillRect(c * this.pixelSize, r * this.pixelSize, this.pixelSize, this.pixelSize);
            }
        }

        // 2. Çizilmiş Pikseller
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const color = this.grid[r][c];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(c * this.pixelSize, r * this.pixelSize, this.pixelSize, this.pixelSize);
                }
            }
        }

        // 3. Piksel Izgara Çizgileri (Subtle Pixel Grid)
        if (this.showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let c = 0; c <= this.cols; c++) {
                ctx.moveTo(c * this.pixelSize, 0);
                ctx.lineTo(c * this.pixelSize, h);
            }
            for (let r = 0; r <= this.rows; r++) {
                ctx.moveTo(0, r * this.pixelSize);
                ctx.lineTo(w, r * this.pixelSize);
            }
            ctx.stroke();
        }
    }

    // 8-Bit Piksel Şablonları Yükleme
    loadTemplate(type = 'fish') {
        this.clear(false);
        const g = this.grid;
        const cx = Math.floor(this.cols / 2);
        const cy = Math.floor(this.rows / 2);

        // Şablon matrisini piksel piksel çiz
        if (type === 'fish' || type === 'kick') {
            // 8-Bit Kick Neon Balığı
            const C = '#53FC18'; // Neon Kick
            const D = '#1b7a3e'; // Koyu yeşil
            const W = '#FFFFFF'; // Göz
            const B = '#000000'; // Göz bebeği
            const Y = '#00E5FF'; // Yüzgeç turkuazı

            // Balık Gövdesi
            for (let x = -14; x <= 12; x++) {
                const h = Math.round(7 * Math.cos((x / 14) * (Math.PI / 2.2)));
                for (let y = -h; y <= h; y++) {
                    const row = cy + y;
                    const col = cx + x;
                    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                        g[row][col] = (Math.abs(y) === h || x === 12 || x === -14) ? D : C;
                    }
                }
            }

            // Piksel Çatal Kuyruk
            for (let k = 0; k <= 7; k++) {
                const col = cx - 14 - k;
                const r1 = cy - Math.round(k * 1.1);
                const r2 = cy + Math.round(k * 1.1);
                if (col >= 0) {
                    if (r1 >= 0) g[r1][col] = C;
                    if (r2 < this.rows) g[r2][col] = C;
                }
            }

            // Yüzgeç
            g[cy - 6][cx] = Y;
            g[cy - 7][cx - 1] = Y;
            g[cy - 7][cx - 2] = Y;
            g[cy + 6][cx] = Y;

            // Göz (Piksel Göz)
            g[cy - 2][cx + 8] = W;
            g[cy - 2][cx + 9] = W;
            g[cy - 1][cx + 8] = W;
            g[cy - 1][cx + 9] = B;
        } else if (type === 'goldfish') {
            // 8-Bit Altın Balık
            const O = '#FF8C00';
            const Y = '#FFD700';
            const W = '#FFFFFF';
            const B = '#000000';

            for (let x = -10; x <= 10; x++) {
                const h = Math.round(6 * Math.cos((x / 10) * (Math.PI / 2)));
                for (let y = -h; y <= h; y++) {
                    const row = cy + y;
                    const col = cx + x;
                    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                        g[row][col] = (x + y) % 3 === 0 ? Y : O;
                    }
                }
            }

            // Dalgalı Kuyruk
            for (let k = 0; k <= 8; k++) {
                const col = cx - 10 - k;
                const r1 = cy - Math.round(k * 0.9);
                const r2 = cy + Math.round(k * 0.9);
                if (col >= 0) {
                    if (r1 >= 0) g[r1][col] = Y;
                    if (r2 < this.rows) g[r2][col] = O;
                }
            }

            // Göz
            g[cy - 2][cx + 6] = W;
            g[cy - 2][cx + 7] = B;
        }

        this.saveState();
        this.renderCanvas();
        this.updatePreviewImage();
    }

    hasDrawing() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] !== null) return true;
            }
        }
        return false;
    }

    // Piksel Çizimi Kırpıp Gerçek 8-Bit Sprite Çıkar
    exportFishData(fishName, creatorName) {
        if (!this.hasDrawing()) return null;

        let minC = this.cols, minR = this.rows, maxC = 0, maxR = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] !== null) {
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                    if (r < minR) minR = r;
                    if (r > maxR) maxR = r;
                }
            }
        }

        const cropW = maxC - minC + 1;
        const cropH = maxR - minR + 1;

        // Büyütülmüş Piksel Çıktısı (Her piksel 6x6 keskin blok)
        const scale = 6;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW * scale;
        cropCanvas.height = cropH * scale;
        const cCtx = cropCanvas.getContext('2d');
        cCtx.imageSmoothingEnabled = false;

        for (let r = 0; r < cropH; r++) {
            for (let c = 0; c < cropW; c++) {
                const color = this.grid[minR + r][minC + c];
                if (color) {
                    cCtx.fillStyle = color;
                    cCtx.fillRect(c * scale, r * scale, scale, scale);
                }
            }
        }

        return {
            id: 'pixel_fish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: (fishName || 'Piksel Yüzücü').trim().slice(0, 24),
            creator: (creatorName || 'pristagna').trim().slice(0, 24),
            dataUrl: cropCanvas.toDataURL('image/png'),
            width: cropCanvas.width,
            height: cropCanvas.height,
            pixelCols: cropW,
            pixelRows: cropH,
            aspectRatio: cropW / cropH,
            createdAt: Date.now()
        };
    }

    updatePreviewImage() {
        if (!this.previewCanvas) return;
        const fishData = this.exportFishData('Önizleme', 'pristagna');
        if (fishData) {
            const img = new Image();
            img.onload = () => {
                this.previewFish = {
                    img: img,
                    width: fishData.width,
                    height: fishData.height
                };
            };
            img.src = fishData.dataUrl;
        } else {
            this.previewFish = null;
        }
    }

    startPreviewAnimation() {
        const loop = () => {
            this.previewTime += 0.05;
            this.renderPreview();
            this.previewAnimFrame = requestAnimationFrame(loop);
        };
        loop();
    }

    renderPreview() {
        if (!this.previewCtx || !this.previewCanvas) return;
        const ctx = this.previewCtx;
        const w = this.previewCanvas.width;
        const h = this.previewCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;

        // 8-Bit Arka Plan
        ctx.fillStyle = '#061d33';
        ctx.fillRect(0, 0, w, h);

        if (this.previewFish && this.previewFish.img) {
            ctx.save();
            ctx.translate(w / 2, h / 2);

            // 8-Bit Kademeli Yüzme Dalgalanması (Stepped frame animation)
            const stepBob = Math.round(Math.sin(this.previewTime * 3) * 3);
            const stepRot = Math.round(Math.sin(this.previewTime * 4) * 2) * 0.04;
            ctx.translate(0, stepBob);
            ctx.rotate(stepRot);

            const scale = Math.min((w * 0.75) / this.previewFish.width, (h * 0.75) / this.previewFish.height);
            ctx.scale(scale, scale);

            ctx.drawImage(
                this.previewFish.img,
                -this.previewFish.width / 2,
                -this.previewFish.height / 2
            );
            ctx.restore();
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ÖNİZLEME', w / 2, h / 2 + 4);
        }
    }
}

window.FishDrawingCanvas = FishDrawingCanvas;
