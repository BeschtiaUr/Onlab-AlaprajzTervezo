const wallsBtn = document.getElementById('wallsBtn');
const windowsBtn = document.getElementById('windowsBtn');
const doorsBtn = document.getElementById('doorsBtn');
const furnitureBtns = document.querySelectorAll('.furniture-btn'); // Az összes bútor gomb

function setActiveTool(toolId, btnElement, extraType = null) {
    currentTool = toolId;
    selectedFurnitureType = extraType; // Megjegyezzük, melyik bútor
    
    // Gombok vizuális frissítése
    wallsBtn.classList.remove('active');
    windowsBtn.classList.remove('active');
    doorsBtn.classList.remove('active');
    furnitureBtns.forEach(btn => btn.classList.remove('active'));
    
    btnElement.classList.add('active');
    
    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    cleanUpNodes();
    draw();
}

// Bal oldali gombok
wallsBtn.addEventListener('click', () => setActiveTool('walls', wallsBtn));
windowsBtn.addEventListener('click', () => setActiveTool('windows', windowsBtn));
doorsBtn.addEventListener('click', () => setActiveTool('doors', doorsBtn));

// Jobb oldali (bútor) gombok
furnitureBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // A data-type alapján tudjuk, melyik bútor lett megnyomva
        setActiveTool('furniture', btn, btn.dataset.type);
    });
});


//EGÉR LENYOMÁSA
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Csak bal gomb
    let clickPos = getMousePos(e);

    if (currentTool === 'furniture') {
        furnitures.push({
            type: selectedFurnitureType,
            x: clickPos.x,
            y: clickPos.y,
            angle: 0 // Később ezt lehet majd gombbal forgatni!
        });
        draw();
        return;
    }
    //Ablak vagy ajtó
    if (currentTool === 'windows' || currentTool === 'doors') {
        if (hoveredWallIndex !== null) {
            const w = walls[hoveredWallIndex];
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            
            //Kiszámoljuk, hány %-nál kattintottunk a falra
            let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
            let t = ((clickPos.x - n1.x) * (n2.x - n1.x) + (clickPos.y - n1.y) * (n2.y - n1.y)) / len_sq;
            
            //Levágjuk a széleket, hogy ne lógjon le az ablak a fal végéről
            t = Math.max(0.05, Math.min(0.95, t)); 
            
            if (currentTool === 'windows') {
                windows.push({ wallIndex: hoveredWallIndex, position: t, length: 60 });
            } else {
                doors.push({ wallIndex: hoveredWallIndex, position: t, length: 50 });
            }
            draw();
        }
        return;
    }

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

// EGÉR MOZGATÁSA
canvas.addEventListener('mousemove', (e) => {
    mousePosition = getMousePos(e);
    
    // 1. Fal Hover megkeresése
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
    
    // 2. Bútor Hover megkeresése
    let foundFurnitureHover = null;
    for (let i = 0; i < furnitures.length; i++) {
        const f = furnitures[i];
        const dist = Math.sqrt(Math.pow(mousePosition.x - f.x, 2) + Math.pow(mousePosition.y - f.y, 2));
        if (dist < 40) { // 40 pixel sugarú körben érzékeli az egeret
            foundFurnitureHover = i;
            break;
        }
    }
    
    // Csak akkor rajzolunk újra, ha valaminek a kijelölése megváltozott
    if (hoveredWallIndex !== foundHover || hoveredFurnitureIndex !== foundFurnitureHover) {
        hoveredWallIndex = foundHover;
        hoveredFurnitureIndex = foundFurnitureHover;
        draw();
    }

    // Mozgatás és Rajzolás
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
        draw();
    }
    
    // MINDIG frissítjük az adatokat, ha mozog az egér
    updateDataBar();
});

//EGÉR ELENGEDÉSE
window.addEventListener('mouseup', () => {
    draggedWallIndex = null; 
    draw(); 
});

//JOBB KLIKK MEGSZAKÍTÁS
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    cleanUpNodes(); 
    draw();
});

//TÖRLÉS BILLENTYŰZETTEL
window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && hoveredWallIndex !== null && currentTool === 'walls') {
        
        const deletedIndex = hoveredWallIndex;
        walls.splice(deletedIndex, 1); // Fal törlése
        hoveredWallIndex = null;
        cleanUpNodes(); 
        
        //Töröljük a falhoz tartozó ablakokat/ajtókat is
        windows = windows.filter(w => w.wallIndex !== deletedIndex);
        doors = doors.filter(d => d.wallIndex !== deletedIndex);
        
        // Frissítjük a megmaradt elemek sorszámait, mert a falak listája rövidebb lett
        windows.forEach(w => { if (w.wallIndex > deletedIndex) w.wallIndex--; });
        doors.forEach(d => { if (d.wallIndex > deletedIndex) d.wallIndex--; });

        draw();
    }
});

//EGYÉB GOMBOK
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', () => {        
    // Kiürítjük az összes adatot tároló listát
    nodes.length = 0; 
    walls.length = 0;
    windows.length = 0; 
    doors.length = 0;   
    furnitures.length = 0;
    
    // Alaphelyzetbe állítjuk az állapotokat
    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    hoveredWallIndex = null;
    
    // Bútoros állapotok alaphelyzetbe állítása
    hoveredFurnitureIndex = null;
    draggedFurnitureIndex = null;
    selectedFurnitureType = null;
    
    // Újrarajzoljuk a vásznat
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

// --- ADATSÁV FRISSÍTÉSE ---
function updateDataBar() {
    const infoType = document.getElementById('infoType');
    const infoSize = document.getElementById('infoSize');
    if (!infoType || !infoSize) return;

    if (hoveredWallIndex !== null) {
        // Ha egy fal felett van az egér, kiszámoljuk a hosszát
        const wall = walls[hoveredWallIndex];
        const n1 = nodes[wall.startNode];
        const n2 = nodes[wall.endNode];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const length = Math.sqrt(dx * dx + dy * dy).toFixed(1);
        
        infoType.innerText = "Wall";
        infoSize.innerText = length + " px";
    } 
    else if (hoveredFurnitureIndex !== null) {
        // Ha egy bútor felett van az egér
        const f = furnitures[hoveredFurnitureIndex];
        let typeName = "";
        let size = "";
        
        if (f.type === 'bed') { typeName = "Bed"; size = "80 x 100 px"; }
        else if (f.type === 'sofa') { typeName = "Sofa"; size = "100 x 50 px"; }
        else if (f.type === 'table') { typeName = "Table"; size = "40 x 80 px"; }
        
        infoType.innerText = typeName;
        infoSize.innerText = size;
    } 
    else {
        // Semmi nincs kijelölve
        infoType.innerText = "-";
        infoSize.innerText = "-";
    }
}

//PROGRAM INDÍTÁSA
draw();