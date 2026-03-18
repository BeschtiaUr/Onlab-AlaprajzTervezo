// 1. Egér lenyomása
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Csak a bal gomb!
    const clickPos = getMousePos(e);
    const snappedNodeIndex = findClosestNode(clickPos.x, clickPos.y);

    if (!isDrawing) {
        if (snappedNodeIndex !== null) {
            draggedNodeIndex = snappedNodeIndex;
            selectedWallIndex = null;
            return; 
        }

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
        nodes[draggedNodeIndex].x = mousePosition.x;
        nodes[draggedNodeIndex].y = mousePosition.y;
        draw();
    } else if (isDrawing) {
        draw(); 
    }
});

// 3. Egér elengedése
window.addEventListener('mouseup', () => {
    draggedNodeIndex = null;
});

// 4. Jobb klikk megszakítás
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    cleanUpNodes(); 
    draw();
});

// 5. Törlés
window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWallIndex !== null) {
        walls.splice(selectedWallIndex, 1); 
        selectedWallIndex = null;
        cleanUpNodes(); 
        draw();
    }
});

// --- PROGRAM INDÍTÁSA ---
draw();