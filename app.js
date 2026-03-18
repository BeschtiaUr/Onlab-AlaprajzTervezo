const canvas = document.getElementById('floorplan');
const ctx = canvas.getContext('2d');

// --- ADATOK ---
let nodes = []; // Csomópontok {x, y}
let walls = []; // Falak {startNode, endNode}

// --- AKTUÁLIS ÁLLAPOT ---
let isDrawing = false;
let currentStartNode = null;
let mousePosition = { x: 0, y: 0 };
const SNAP_DISTANCE = 15; 
const GRID_SIZE = 20;

let draggedNodeIndex = null; // Mozgatáshoz
let selectedWallIndex = null; // Törléshez

// --- ESEMÉNYEK ---

// 1. Egér lenyomása
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Csak a bal gomb!
    const clickPos = getMousePos(e);
    const snappedNodeIndex = findClosestNode(clickPos.x, clickPos.y);

    // HA NEM RAJZOLUNK ÉPPEN (Üresjáratban vagyunk)
    if (!isDrawing) {
        // A: Rákattintottunk egy meglévő piros pontra? -> ÁTMÉRETEZÉS INDUL
        if (snappedNodeIndex !== null) {
            draggedNodeIndex = snappedNodeIndex;
            selectedWallIndex = null;
            return; 
        }

        // B: Rákattintottunk egy falra? -> KIJELÖLÉS TÖRLÉSHEZ
        let clickedWall = null;
        for (let i = 0; i < walls.length; i++) {
            const w = walls[i];
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            if (getDistanceToLine(clickPos.x, clickPos.y, n1.x, n1.y, n2.x, n2.y) < 8) { 
                clickedWall = i;
                break;
            }
        }
        
        if (clickedWall !== null) {
            selectedWallIndex = clickedWall;
            draw();
            return;
        }
    }

    // C: ÚJ FAL KEZDÉSE VAGY LÁNCOLÁS FOLYTATÁSA
    selectedWallIndex = null; 
    if (!isDrawing) {
        isDrawing = true;
        if (snappedNodeIndex !== null) {
            currentStartNode = snappedNodeIndex;
        } else {
            nodes.push({ x: clickPos.x, y: clickPos.y });
            currentStartNode = nodes.length - 1;
        }
    } else {
        let endNodeIndex;
        if (snappedNodeIndex !== null) {
            endNodeIndex = snappedNodeIndex;
        } else {
            nodes.push({ x: clickPos.x, y: clickPos.y });
            endNodeIndex = nodes.length - 1;
        }
        walls.push({ startNode: currentStartNode, endNode: endNodeIndex });
        currentStartNode = endNodeIndex; 
    }
    draw();
});

// 2. Egér mozgatása
canvas.addEventListener('mousemove', (e) => {
    mousePosition = getMousePos(e);
    
    if (draggedNodeIndex !== null) {
        // Mozgatás közben frissítjük a pont koordinátáját
        nodes[draggedNodeIndex].x = mousePosition.x;
        nodes[draggedNodeIndex].y = mousePosition.y;
        draw();
    } else if (isDrawing) {
        // Rajzolás közben frissítjük az előnézetet
        draw(); 
    }
});

// 3. Egér elengedése (Bárhol az ablakban)
window.addEventListener('mouseup', () => {
    draggedNodeIndex = null; // Pont elengedése
});

// 4. Jobb klikk (Rajzolás megszakítása)
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    cleanUpNodes(); // ÚJ SOR: Takarítsuk el az árva kezdőpontot!
    draw();
});

// 5. Törlés gomb (Delete / Backspace)
window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWallIndex !== null) {
        walls.splice(selectedWallIndex, 1); 
        selectedWallIndex = null;
        cleanUpNodes(); // Szemétszedő futtatása
        draw();
    }
});

// --- SEGÉDFÜGGVÉNYEK ---

// Árva csomópontok takarítása
function cleanUpNodes() {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const isUsed = walls.some(wall => wall.startNode === i || wall.endNode === i);
        if (!isUsed) {
            nodes.splice(i, 1);
            walls.forEach(wall => {
                if (wall.startNode > i) wall.startNode--;
                if (wall.endNode > i) wall.endNode--;
            });
        }
    }
}

// Egér pontos helyzete
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// Legközelebbi csomópont keresése
function findClosestNode(x, y) {
    for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - x;
        const dy = nodes[i].y - y;
        const distance = Math.sqrt(dx * dx + dy * dy); 
        if (distance < SNAP_DISTANCE) { 
            return i; 
        }
    }
    return null;
}

// Távolság egy vonaltól (Matematika)
function getDistanceToLine(px, py, x1, y1, x2, y2) {
    let A = px - x1; let B = py - y1; let C = x2 - x1; let D = y2 - y1;
    let dot = A * C + B * D; let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    let dx = px - xx; let dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Háttérrács
function drawGrid() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#05a9af';
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

// --- FŐ RAJZOLÓ FÜGGVÉNY ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    drawGrid(); 

    ctx.lineCap = 'round';

    // 1. Kész falak
    walls.forEach((wall, index) => {
        const start = nodes[wall.startNode];
        const end = nodes[wall.endNode];
        
        ctx.beginPath();
        if (index === selectedWallIndex) {
            ctx.strokeStyle = '#ff4444'; // Piros, ha ki van jelölve
            ctx.lineWidth = 7;
        } else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 5;
        }
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });

    // 2. Épp húzott (ideiglenes) fal
    if (isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        ctx.lineWidth = 5;
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

    // 3. Piros csomópontok
    ctx.fillStyle = '#ff0000';
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Indítás
draw();