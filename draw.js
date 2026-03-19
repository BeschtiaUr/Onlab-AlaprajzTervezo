// Háttérrács
function drawGrid() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#05a9af'; // A szép kék színed
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

// --- ÚJ: ABLAK RAJZOLÁSA ---
function drawWindow(x, y, angle, length) {
    ctx.save(); // Elmentjük a vászon eredeti állapotát
    ctx.translate(x, y); // A vászon origóját az ablak közepére toljuk
    ctx.rotate(angle); // Elforgatjuk a vásznat a fal szögébe

    // 1. Fehér háttér, ami "kivágja" a fekete falat (22px vastag, hogy biztosan takarjon)
    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -11, length, 22);

    // 2. Az ablaküveg vonalai (világoskék)
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(-length / 2, -4); ctx.lineTo(length / 2, -4);
    ctx.moveTo(-length / 2, 4);  ctx.lineTo(length / 2, 4);
    ctx.stroke();

    // 3. A keret két széle (fekete)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -10); ctx.lineTo(-length / 2, 10);
    ctx.moveTo(length / 2, -10);  ctx.lineTo(length / 2, 10);
    ctx.stroke();

    ctx.restore(); // Visszaállítjuk a vásznat
}

// --- ÚJ: AJTÓ RAJZOLÁSA ---
function drawDoor(x, y, angle, length) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 1. Kivágjuk a falat
    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -11, length, 22);

    // 2. Ajtólap (nyitva 90 fokban befelé)
    ctx.strokeStyle = '#e67e22'; // Narancssárga
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-length / 2, -10); // A zsanér helye
    ctx.lineTo(-length / 2, -10 - length); // A nyitott ajtó
    ctx.stroke();

    // 3. Nyitásirány íve (szaggatott vonal)
    ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // 5px vonal, 5px szünet
    ctx.beginPath();
    ctx.arc(-length / 2, -10, length, 0, -Math.PI / 2, true); // Ív húzása
    ctx.stroke();
    ctx.setLineDash([]); // Szaggatott vonal kikapcsolása

    // 4. A falvégek lezárása
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -10); ctx.lineTo(-length / 2, 10);
    ctx.moveTo(length / 2, -10);  ctx.lineTo(length / 2, 10);
    ctx.stroke();

    ctx.restore();
}


// --- FŐ RAJZOLÓ FÜGGVÉNY ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    drawGrid(); 

    ctx.lineCap = 'round';

    // 1. KÉSZ FALAK
    walls.forEach((wall, index) => {
        const start = nodes[wall.startNode];
        const end = nodes[wall.endNode];
        
        ctx.beginPath();
        // Ha nem falat rajzolunk, ne lehessen falat kijelölni mozgatásra/törlésre!
        if (currentTool === 'walls' && index === draggedWallIndex) {
            ctx.strokeStyle = '#05a9af'; 
            ctx.lineWidth = 20;
        } 
        else if (currentTool === 'walls' && index === hoveredWallIndex) {
            ctx.strokeStyle = '#ff4444'; 
            ctx.lineWidth = 20;
        } 
        else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 20;
        }
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });

    // 2. KÉSZ ABLAKOK ÉS AJTÓK RAJZOLÁSA
    windows.forEach(win => {
        const w = walls[win.wallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        // Kiszámoljuk az X, Y koordinátát a %-os pozíció alapján
        const x = n1.x + (n2.x - n1.x) * win.position;
        const y = n1.y + (n2.y - n1.y) * win.position;
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        drawWindow(x, y, angle, win.length);
    });

    doors.forEach(door => {
        const w = walls[door.wallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const x = n1.x + (n2.x - n1.x) * door.position;
        const y = n1.y + (n2.y - n1.y) * door.position;
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        drawDoor(x, y, angle, door.length);
    });

    // 3. ELŐNÉZET (HOVER) AJTÓKHOZ ÉS ABLAKOKHOZ
    // Ha az egér egy fal felett van, és ablakot/ajtót akarunk lerakni
    if (currentTool !== 'walls' && hoveredWallIndex !== null) {
        const w = walls[hoveredWallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        
        ctx.globalAlpha = 0.5; // Félig átlátszó hologram
        if (currentTool === 'windows') drawWindow(mousePosition.x, mousePosition.y, angle, 60);
        if (currentTool === 'doors') drawDoor(mousePosition.x, mousePosition.y, angle, 50);
        ctx.globalAlpha = 1.0; // Visszaállítjuk az átlátszatlanságot
    }

    // 4. ÉPP HÚZOTT (IDEIGLENES) FAL
    if (currentTool === 'walls' && isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        ctx.lineWidth = 20;
        ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)'; 
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        const snappedNodeIndex = findClosestNode(mousePosition.x, mousePosition.y);
        if (snappedNodeIndex !== null) {
             ctx.lineTo(nodes[snappedNodeIndex].x, nodes[snappedNodeIndex].y);
        } else {
             ctx.lineTo(mousePosition.x, mousePosition.y);
        }
        ctx.stroke();
    }

    // 5. PIROS CSOMÓPONTOK (Csak fal-rajzoló módban mutatjuk őket, hogy szép tiszta legyen a rajz)
    if (currentTool === 'walls') {
        ctx.fillStyle = '#ff0000';
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}