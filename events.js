// --- ESZKÖZTÁR GOMBOK KEZELÉSE ---
const wallsBtn = document.getElementById('wallsBtn');
const windowsBtn = document.getElementById('windowsBtn');
const doorsBtn = document.getElementById('doorsBtn');

function setActiveTool(toolId, btnElement) {
    currentTool = toolId;
    
    // Gombok vizuális frissítése (melyik kék)
    wallsBtn.classList.remove('active');
    windowsBtn.classList.remove('active');
    doorsBtn.classList.remove('active');
    btnElement.classList.add('active');
    
    // Ha eszközt váltunk, megszakítjuk az esetlegesen épp húzott falat
    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    cleanUpNodes();
    draw();
}

// Kattintás események az eszköztár gombjaira
wallsBtn.addEventListener('click', () => setActiveTool('walls', wallsBtn));
windowsBtn.addEventListener('click', () => setActiveTool('windows', windowsBtn));
doorsBtn.addEventListener('click', () => setActiveTool('doors', doorsBtn));


// --- 1. EGÉR LENYOMÁSA ---
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Csak bal gomb
    let clickPos = getMousePos(e);

    // HA ABLAKOT VAGY AJTÓT RAKUNK LE
    if (currentTool === 'windows' || currentTool === 'doors') {
        if (hoveredWallIndex !== null) {
            const w = walls[hoveredWallIndex];
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            
            // Matematika: Kiszámoljuk, hány %-nál kattintottunk a falra (0.0 - 1.0)
            let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
            let t = ((clickPos.x - n1.x) * (n2.x - n1.x) + (clickPos.y - n1.y) * (n2.y - n1.y)) / len_sq;
            
            // Levágjuk a széleket, hogy ne lógjon le az ablak a fal végéről
            t = Math.max(0.05, Math.min(0.95, t)); 
            
            if (currentTool === 'windows') {
                windows.push({ wallIndex: hoveredWallIndex, position: t, length: 60 });
            } else {
                doors.push({ wallIndex: hoveredWallIndex, position: t, length: 50 });
            }
            draw();
        }
        return; // Kilépünk, itt nem rajzolunk falat!
    }

    // --- INNENTŐL A FAL-RAJZOLÓ MÓD LOGIKÁJA ---
    if (isNinetyDegreeMode && isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        clickPos = applyNinetyDegrees(start.x, start.y, clickPos.x, clickPos.y); 
    }

    const snappedNodeIndex = findClosestNode(clickPos.x, clickPos.y);

    if (!isDrawing) {
        if (snappedNodeIndex !== null) {
            isDrawing = true;
            currentStartNode = snappedNodeIndex;
            return; 
        }

        if (hoveredWallIndex !== null) {
            draggedWallIndex = hoveredWallIndex; 
            lastMousePos = { x: clickPos.x, y: clickPos.y }; 
            draw();
            return;
        }
    }

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

// --- 2. EGÉR MOZGATÁSA ---
canvas.addEventListener('mousemove', (e) => {
    mousePosition = getMousePos(e);
    
    // 1. Fal Hover megkeresése MINDEN eszköznél (hogy a hologram működjön!)
    let foundHover = null;
    for (let i = 0; i < walls.length; i++) {
        const w = walls[i];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        if (getDistanceToLine(mousePosition.x, mousePosition.y, n1.x, n1.y, n2.x, n2.y) < 12) { 
            foundHover = i;
            break;
        }
    }
    
    if (hoveredWallIndex !== foundHover) {
        hoveredWallIndex = foundHover;
        draw();
    }

    // 2. Mozgatás és Rajzolás (CSAK FAL MÓDBAN)
    if (currentTool === 'walls') {
        if (isNinetyDegreeMode && isDrawing && currentStartNode !== null) {
            const start = nodes[currentStartNode];
            mousePosition = applyNinetyDegrees(start.x, start.y, mousePosition.x, mousePosition.y);
        }
        
        if (draggedWallIndex !== null) {
            const dx = mousePosition.x - lastMousePos.x;
            const dy = mousePosition.y - lastMousePos.y;
            
            const wall = walls[draggedWallIndex];
            nodes[wall.startNode].x += dx;
            nodes[wall.startNode].y += dy;
            nodes[wall.endNode].x += dx;
            nodes[wall.endNode].y += dy;
            
            lastMousePos = { x: mousePosition.x, y: mousePosition.y };
            draw();
        } 
        else if (isDrawing) {
            draw(); 
        }
    } else {
        // Ablak/Ajtó módban is újra kell rajzolni mozgáskor az átlátszó hologram miatt!
        draw();
    }
});

// --- 3. EGÉR ELENGEDÉSE ---
window.addEventListener('mouseup', () => {
    draggedWallIndex = null; 
    draw(); 
});

// --- 4. JOBB KLIKK MEGSZAKÍTÁS ---
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    cleanUpNodes(); 
    draw();
});

// --- 5. TÖRLÉS BILLENTYŰZETTEL ---
window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && hoveredWallIndex !== null && currentTool === 'walls') {
        
        const deletedIndex = hoveredWallIndex;
        walls.splice(deletedIndex, 1); // Fal törlése
        hoveredWallIndex = null;
        cleanUpNodes(); 
        
        // Biztonsági takarítás: Töröljük a falhoz tartozó ablakokat/ajtókat is!
        windows = windows.filter(w => w.wallIndex !== deletedIndex);
        doors = doors.filter(d => d.wallIndex !== deletedIndex);
        
        // Frissítjük a megmaradt elemek sorszámait, mert a falak listája rövidebb lett
        windows.forEach(w => { if (w.wallIndex > deletedIndex) w.wallIndex--; });
        doors.forEach(d => { if (d.wallIndex > deletedIndex) d.wallIndex--; });

        draw();
    }
});

// --- EGYÉB GOMBOK ---
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', () => {        
    nodes.length = 0; 
    walls.length = 0;
    windows.length = 0; // Ablakokat is ürítjük
    doors.length = 0;   // Ajtókat is ürítjük
    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    hoveredWallIndex = null;
    draw();
});

const ninetyDegreeBtn = document.getElementById('ninetyDegreeBtn');
ninetyDegreeBtn.addEventListener('click', () => {
    isNinetyDegreeMode = !isNinetyDegreeMode; 
    if (isNinetyDegreeMode) {
        ninetyDegreeBtn.classList.add('active'); 
        ninetyDegreeBtn.innerText = "90° mode ON";
    } else {
        ninetyDegreeBtn.classList.remove('active'); 
        ninetyDegreeBtn.innerText = "90°mode OFF";
    }
});

// --- PROGRAM INDÍTÁSA ---
draw();