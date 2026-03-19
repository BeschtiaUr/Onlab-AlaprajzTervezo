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

// Megnézi, hogy az egér vízszintesen vagy függőlegesen mozdult-e el jobban a kezdőponthoz képest
function applyNinetyDegrees(startX, startY, currentX, currentY) {
    const dx = Math.abs(currentX - startX);
    const dy = Math.abs(currentY - startY);
    
    if (dx > dy) {
        // Vízszintes vonal (Az Y koordinátát rögzítjük a kezdőponthoz)
        return { x: currentX, y: startY }; 
    } else {
        // Függőleges vonal (Az X koordinátát rögzítjük a kezdőponthoz)
        return { x: startX, y: currentY }; 
    }
}