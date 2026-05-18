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

function saveStateToHistory() {
        const stateCopy = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        walls: JSON.parse(JSON.stringify(walls)),
        windows: JSON.parse(JSON.stringify(windows)),
        doors: JSON.parse(JSON.stringify(doors)),
        furnitures: JSON.parse(JSON.stringify(furnitures))
    };
    historyStack.push(stateCopy);
    if(historyStack.length > 20) historyStack.shift(); // Max 20 állapot a stack-ben
}

function undo() {
    if(historyStack.length === 0) return; // Nincs mit visszavonni
    const lastState = historyStack.pop();

    nodes.length = 0; nodes.push(...lastState.nodes);
    walls.length = 0; walls.push(...lastState.walls);
    windows.length = 0; windows.push(...lastState.windows);
    doors.length = 0; doors.push(...lastState.doors);
    furnitures.length = 0; furnitures.push(...lastState.furnitures);

    isDrawing = false;
    currentStartNode = null;
    maybeDraggingWallIndex = null;
    draggedWallIndex = null;
    draggedFurnitureIndex = null;
    draggedWindowIndex = null;
    draggedDoorIndex = null;

    cleanUpNodes();
    
    draw();
    if (typeof updateDataBar === "function") updateDataBar();
}

function switchFloor(targetIndex) {
    // Biztonsági ellenőrzés: Létezik a kért emelet?
    if (targetIndex < 0 || targetIndex >= floorPlans.length) return;
    if (targetIndex === currentFloor) return;

    // LÉPÉS 1: Elmentjük az aktuális vásznat a jelenlegi emelet memóriájába
    floorPlans[currentFloor] = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        walls: JSON.parse(JSON.stringify(walls)),
        windows: JSON.parse(JSON.stringify(windows)),
        doors: JSON.parse(JSON.stringify(doors)),
        furnitures: JSON.parse(JSON.stringify(furnitures)),
        historyStack: [...historyStack] // Az Undo memóriát is visszük!
    };

    // LÉPÉS 2: Átváltunk az új emeletre
    currentFloor = targetIndex;
    const data = floorPlans[currentFloor];

    // LÉPÉS 3: Kicsomagoljuk az új emelet adatait a globális tömbökbe
    nodes.length = 0; nodes.push(...data.nodes);
    walls.length = 0; walls.push(...data.walls);
    windows.length = 0; windows.push(...data.windows);
    doors.length = 0; doors.push(...data.doors);
    furnitures.length = 0; furnitures.push(...data.furnitures);
    historyStack.length = 0; historyStack.push(...data.historyStack);

    // LÉPÉS 4: Törlünk minden "éppen húzott" állapotot, hogy ne ragadjanak be
    isDrawing = false;
    currentStartNode = null;
    hoveredWallIndex = null;
    draggedWallIndex = null;
    cleanUpNodes();

    // LÉPÉS 5: Frissítjük a UI-t és újrarajzoljuk a vásznat
    updateFloorIndicator();
    draw();
}