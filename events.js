// 1. Egér lenyomása
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Csak a bal gomb!
    let clickPos = getMousePos(e);

    if (isNinetyDegreeMode && isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        clickPos = applyNinetyDegrees(start.x, start.y, clickPos.x, clickPos.y); 
    }

    const snappedNodeIndex = findClosestNode(clickPos.x, clickPos.y);

    if (!isDrawing) {
        // A: Pöttyre kattintunk -> Rajzolás indul
        if (snappedNodeIndex !== null) {
            isDrawing = true;
            currentStartNode = snappedNodeIndex;
            return; 
        }

        // B: Falra kattintunk -> Mozgatás indul
        if (hoveredWallIndex !== null) {
            draggedWallIndex = hoveredWallIndex; 
            lastMousePos = { x: clickPos.x, y: clickPos.y }; 
            draw();
            return;
        }
    }

    // C: Üres helyre kattintás (új fal kezdése / lerakása)
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
    
    // 90 fokos előnézet
    if (isNinetyDegreeMode && isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        mousePosition = applyNinetyDegrees(start.x, start.y, mousePosition.x, mousePosition.y);
    }
    
    // HA MOZGATJUK A FALAT
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
    // HA RAJZOLUNK
    else if (isDrawing) {
        draw(); 
    } 
    // HA CSAK MOZGATJUK AZ EGERET (Hover megkeresése)
    else {
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
        
        // Csak akkor rajzoljuk újra a képernyőt, ha új falra húztuk az egeret
        if (hoveredWallIndex !== foundHover) {
            hoveredWallIndex = foundHover;
            draw();
        }
    }
});

// 3. Egér elengedése
window.addEventListener('mouseup', () => {
    draggedWallIndex = null; 
    draw(); // Újrarajzoljuk, hogy eltűnjön a kék szín
});

// 4. Jobb klikk megszakítás
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    cleanUpNodes(); 
    draw();
});

// 5. Törlés (Most már azt a falat törli, ami felett tartod az egeret!)
window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && hoveredWallIndex !== null) {
        walls.splice(hoveredWallIndex, 1); 
        hoveredWallIndex = null;
        cleanUpNodes(); 
        draw();
    }
});

// --- GOMBOK ---
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', () => {        
    nodes.length = 0; 
    walls.length = 0;
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
        ninetyDegreeBtn.innerText = "90° mode: ON";
    } else {
        ninetyDegreeBtn.classList.remove('active'); 
        ninetyDegreeBtn.innerText = "90° mode";
    }
});

// --- PROGRAM INDÍTÁSA ---
draw();