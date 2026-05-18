const wallsBtn = document.getElementById('wallsBtn');
const windowsBtn = document.getElementById('windowsBtn');
const doorsBtn = document.getElementById('doorsBtn');
const furnitureBtns = document.querySelectorAll('.furniture-btn'); 
const exportBtn = document.getElementById('exportBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const switchToUpperFloorBtn = document.getElementById('switchToUpperFloorBtn');
const switchToLowerFloorBtn = document.getElementById('switchToLowerFloorBtn');

function setActiveTool(toolId, btnElement, extraType = null) {
    currentTool = toolId;
    selectedFurnitureType = extraType; 
    
    wallsBtn.classList.remove('active');
    windowsBtn.classList.remove('active');
    doorsBtn.classList.remove('active');
    furnitureBtns.forEach(btn => btn.classList.remove('active'));
    
    if(btnElement) btnElement.classList.add('active');

    const wallSettingsWidget = document.getElementById('wallSettingsWidget');
    if(wallSettingsWidget){
        if(toolId === 'walls'){
            wallSettingsWidget.style.display = 'flex';
        } else {
            wallSettingsWidget.style.display = 'none';
        }
    }

    const furnitureSettingsWidget = document.getElementById('furnitureSettingsWidget');
    if(furnitureSettingsWidget){
        if(toolId === 'furniture'){
            furnitureSettingsWidget.style.display = 'flex';
        } else {
            furnitureSettingsWidget.style.display = 'none';
        }
    }
    
    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    draggedFurnitureIndex = null;
    draggedWindowIndex = null;
    draggedDoorIndex = null;
    cleanUpNodes();
    draw();
}

wallsBtn.addEventListener('click', () => setActiveTool('walls', wallsBtn));
windowsBtn.addEventListener('click', () => setActiveTool('windows', windowsBtn));
doorsBtn.addEventListener('click', () => setActiveTool('doors', doorsBtn));

furnitureBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setActiveTool('furniture', btn, btn.dataset.type);
    });
});


// --- EGÉR LENYOMÁSA ---
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; 

    let clickPos = getMousePos(e);

    // 1. Lerakott bútor megfogása (Bármelyik eszköz is van kiválasztva!)
    if (hoveredFurnitureIndex !== null) {
        saveStateToHistory();
        draggedFurnitureIndex = hoveredFurnitureIndex;
        lastMousePos = { x: clickPos.x, y: clickPos.y };
        return;
    }
    if (hoveredWindowIndex !== null) {
        saveStateToHistory();
        draggedWindowIndex = hoveredWindowIndex;
        lastMousePos = { x: clickPos.x, y: clickPos.y };
        return;
    }
    if (hoveredDoorIndex !== null) {
        saveStateToHistory();
        draggedDoorIndex = hoveredDoorIndex;
        lastMousePos = { x: clickPos.x, y: clickPos.y };
        return;
    }

    // 2. Új bútor lerakása
    if (currentTool === 'furniture') {
        saveStateToHistory();
        furnitures.push({
            type: selectedFurnitureType,
            x: clickPos.x,
            y: clickPos.y,
            angle: currentFurnitureAngle, // Forgatott szöggel rakjuk le
            size : furnitureSize
        });
        draw();
        updateDataBar();
        return;
    }

    // 3. Ablak vagy ajtó
    if (currentTool === 'windows' || currentTool === 'doors') {
        if (hoveredWallIndex !== null) {
            const w = walls[hoveredWallIndex];
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            
            let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
            let t = ((clickPos.x - n1.x) * (n2.x - n1.x) + (clickPos.y - n1.y) * (n2.y - n1.y)) / len_sq;
            t = Math.max(0.05, Math.min(0.95, t)); 
            
            if (currentTool === 'windows') {
                saveStateToHistory();
                windows.push({ wallIndex: hoveredWallIndex, position: t, length: 60 });
            } else {
                saveStateToHistory();
                doors.push({ wallIndex: hoveredWallIndex, position: t, length: 50, doorRotation: 0 });
            }
            draw();
        }
        return;
    }

    // 4. Fal rajzolása / mozgatása
    if (isNinetyDegreeMode && isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        clickPos = applyNinetyDegrees(start.x, start.y, clickPos.x, clickPos.y); 
    }

    const snappedNodeIndex = findClosestNode(clickPos.x, clickPos.y);

    if (!isDrawing) {
        // Ha egy meglevő csomópontra kattintott, indul a rajzolás
        if (snappedNodeIndex !== null) {
            isDrawing = true;
            currentStartNode = snappedNodeIndex;
            return; 
        }

        // Ha falra kattintott, "feljegyezzük", de NEM rajzolunk azonnal
        if (hoveredWallIndex !== null) {
            maybeDraggingWallIndex = hoveredWallIndex; 
            mouseDownPos = { x: clickPos.x, y: clickPos.y }; 
            return; // Kilépünk! Várunk, hogy elhúzza-e (húzás) vagy elengedi-e (rajzolás)
        }

        // Ha üres helyre kattintott, kezdünk rajzolni egy új falat
        isDrawing = true;
        nodes.push({ x: clickPos.x, y: clickPos.y });
        currentStartNode = nodes.length - 1;

    } else {
        // Ha már rajzolunk (isDrawing === true), akkor befejezzük az aktuális falat
        let endNodeIndex;
        if (snappedNodeIndex !== null) {
            endNodeIndex = snappedNodeIndex; // Hozzátapad egy meglévő ponthoz
        } else {
            // Rátapadás egy meglévő falra
            let finalX = clickPos.x;
            let finalY = clickPos.y;
            if(hoveredWallIndex !== null){
                const w = walls[hoveredWallIndex];
                const n1 = nodes[w.startNode];
                const n2 = nodes[w.endNode];
                let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
                let t = ((clickPos.x - n1.x) * (n2.x - n1.x) + (clickPos.y - n1.y) * (n2.y - n1.y)) / len_sq;
                t = Math.max(0, Math.min(1, t)); 
                finalX = n1.x + t * (n2.x - n1.x);
                finalY = n1.y + t * (n2.y - n1.y);
            }
            nodes.push({ x: finalX, y: finalY });
            endNodeIndex = nodes.length - 1;
        }
        saveStateToHistory();
        walls.push({ startNode: currentStartNode, endNode: endNodeIndex, thickness: wallThickness });
        currentStartNode = endNodeIndex; 
    }
    draw();
});

// --- EGÉR MOZGATÁSA ---
canvas.addEventListener('mousemove', (e) => {
    mousePosition = getMousePos(e);
    
    // Hover megkeresése (Falak és Bútorok)
    let foundHover = null;
    for (let i = 0; i < walls.length; i++) {
        const w = walls[i];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        if (getDistanceToLine(mousePosition.x, mousePosition.y, n1.x, n1.y, n2.x, n2.y) < 12) { 
            foundHover = i; break;
        }
    }
    
    let foundFurnitureHover = null;
    for (let i = 0; i < furnitures.length; i++) {
        const f = furnitures[i];
        const dist = Math.sqrt(Math.pow(mousePosition.x - f.x, 2) + Math.pow(mousePosition.y - f.y, 2));
        if (dist < 40) { 
            foundFurnitureHover = i; break;
        }
    }

    let foundWindowHover = null;
    for (let i = 0; i < windows.length; i++) {
        const win = windows[i];
        const w = walls[win.wallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const x = n1.x + (n2.x - n1.x) * win.position;
        const y = n1.y + (n2.y - n1.y) * win.position;
        const dist = Math.sqrt(Math.pow(mousePosition.x - x, 2) + Math.pow(mousePosition.y - y, 2));
        if (dist < 30) { foundWindowHover = i; break; }
    }

    let foundDoorHover = null;
    for (let i = 0; i < doors.length; i++) {
        const door = doors[i];
        const w = walls[door.wallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const x = n1.x + (n2.x - n1.x) * door.position;
        const y = n1.y + (n2.y - n1.y) * door.position;
        const dist = Math.sqrt(Math.pow(mousePosition.x - x, 2) + Math.pow(mousePosition.y - y, 2));
        if (dist < 25) { foundDoorHover = i; break; }
    }
    
    if (hoveredWallIndex !== foundHover || hoveredFurnitureIndex !== foundFurnitureHover ||
        hoveredWindowIndex !== foundWindowHover || hoveredDoorIndex !== foundDoorHover) 
        {
        hoveredWallIndex = foundHover;
        hoveredFurnitureIndex = foundFurnitureHover;
        hoveredWindowIndex = foundWindowHover;
        hoveredDoorIndex = foundDoorHover;
        draw();
    }

    if(hoveredWindowIndex !== null || hoveredDoorIndex !== null){
        hoveredWallIndex = null;
    }

    if(maybeDraggingWallIndex !== null){
        const dx = mousePosition.x - mouseDownPos.x;
        const dy = mousePosition.y - mouseDownPos.y;
        
        // Ha legalább 5 pixelt elhúzod az egeret lenyomott gombbal
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            draggedWallIndex = maybeDraggingWallIndex; // Elindítjuk a húzást
            lastMousePos = { x: mouseDownPos.x, y: mouseDownPos.y };
            maybeDraggingWallIndex = null; // Töröljük a "talán" állapotot
        }
    }

    // BÚTOR MOZGATÁSA (Elsőbbséget élvez)
    if (draggedFurnitureIndex !== null) {
        const dx = mousePosition.x - lastMousePos.x;
        const dy = mousePosition.y - lastMousePos.y;
        furnitures[draggedFurnitureIndex].x += dx;
        furnitures[draggedFurnitureIndex].y += dy;
        lastMousePos = { x: mousePosition.x, y: mousePosition.y };
        draw();
        updateDataBar();
        return; 
    }

    //ABLAK/AJTÓ MOZGATÁSA
    if (draggedWindowIndex !== null || draggedDoorIndex !== null) {
        let parentWall;
        if(draggedWindowIndex !== null){
            if(foundHover !== null){
                parentWall = walls[foundHover];
                windows[draggedWindowIndex].wallIndex = foundHover;
            } else 
            parentWall= walls[windows[draggedWindowIndex].wallIndex];
        }
        else if(draggedDoorIndex !== null){
            if(foundHover !== null){
                parentWall = walls[foundHover];
                doors[draggedDoorIndex].wallIndex = foundHover;
            } else 
            parentWall = walls[doors[draggedDoorIndex].wallIndex];
        }

        const n1 = nodes[parentWall.startNode];
        const n2 = nodes[parentWall.endNode];

        let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);

        let t = ((mousePosition.x - n1.x) * (n2.x - n1.x) + (mousePosition.y - n1.y) * (n2.y - n1.y)) / len_sq;
        t = Math.max(0.05, Math.min(0.95, t)); 

        if(draggedWindowIndex !== null){
            windows[draggedWindowIndex].position = t;
        }
        else if(draggedDoorIndex !== null){
            doors[draggedDoorIndex].position = t;
        }

        lastMousePos = { x: mousePosition.x, y: mousePosition.y };
        draw();
        updateDataBar();
        return; 
    }

    // FAL MOZGATÁSA / RAJZOLÁSA
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
    updateDataBar();
});

// --- EGÉR ELENGEDÉSE ---
window.addEventListener('mouseup', () => {
    // Ha a "talán" állapot még él, az azt jelenti, HOGY EZ EGY KATTINTÁS VOLT EGY FALON!
    if (maybeDraggingWallIndex !== null && currentTool === 'walls') {
        isDrawing = true;

        // Kiszámoljuk a KATTINTÁS PONTOS HELYÉT a falon a tökéletes illeszkedéshez
        const w = walls[maybeDraggingWallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        let len_sq = Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2);
        let t = ((mouseDownPos.x - n1.x) * (n2.x - n1.x) + (mouseDownPos.y - n1.y) * (n2.y - n1.y)) / len_sq;
        t = Math.max(0, Math.min(1, t)); 
        const exactX = n1.x + t * (n2.x - n1.x);
        const exactY = n1.y + t * (n2.y - n1.y);

        nodes.push({ x: exactX, y: exactY }); // Lerakunk egy új csomópontot PONT a falra
        currentStartNode = nodes.length - 1;

        maybeDraggingWallIndex = null; // Töröljük az állapotot
    }

    draggedWallIndex = null; 
    draggedFurnitureIndex = null; 
    draggedWindowIndex = null;
    draggedDoorIndex = null;
    draw(); 
});

// --- JOBB KLIKK MEGSZAKÍTÁS ---
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    cleanUpNodes(); 
    draw();
});

// --- GÖRGŐVEL FORGATÁS ---
window.addEventListener('wheel', (e) => {
    if (e.target === canvas) { // Csak akkor forgasson, ha az egerünk a vásznon van
        e.preventDefault(); 
        const angleChange = (Math.PI / 24) * Math.sign(e.deltaY); // 15 fok
        
        if (draggedFurnitureIndex !== null) {
            furnitures[draggedFurnitureIndex].angle += angleChange;
        } else if (hoveredFurnitureIndex !== null) {
            furnitures[hoveredFurnitureIndex].angle += angleChange;
        } else if (currentTool === 'furniture') {
            currentFurnitureAngle += angleChange;
        }
        draw();
    }
}, { passive: false });

// --- BILLENTYŰZET: TÖRLÉS, FORGATÁS ÉS UNDO---
window.addEventListener('keydown', (e) => {

    //UNDO (Ctrl+Z / Cmd+Z)
    if(e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
        return;
    }
    // TÖRLÉS (Delete / Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
        saveStateToHistory();
        if (hoveredWallIndex !== null && currentTool === 'walls') {
            const deletedIndex = hoveredWallIndex;
            walls.splice(deletedIndex, 1); 
            hoveredWallIndex = null;
            cleanUpNodes(); 
            
            windows = windows.filter(w => w.wallIndex !== deletedIndex);
            doors = doors.filter(d => d.wallIndex !== deletedIndex);
            windows.forEach(w => { if (w.wallIndex > deletedIndex) w.wallIndex--; });
            doors.forEach(d => { if (d.wallIndex > deletedIndex) d.wallIndex--; });
            draw();
        } 
        // Bútor törlése
        else if (hoveredFurnitureIndex !== null) {
            saveStateToHistory();
            furnitures.splice(hoveredFurnitureIndex, 1);
            hoveredFurnitureIndex = null;
            draw();
        }
        else if (hoveredWindowIndex !== null) {
            saveStateToHistory();
            windows.splice(hoveredWindowIndex, 1);
            hoveredWindowIndex = null;
            draw();
        }
        else if(hoveredDoorIndex !== null){
            saveStateToHistory();
            doors.splice(hoveredDoorIndex, 1);
            hoveredDoorIndex = null;
            draw();
        }
    }

    // FORGATÁS ("R" gomb)
    if (e.key === 'r' || e.key === 'R') {
        const angleChange = Math.PI / 4; // 45 fok
        if (draggedFurnitureIndex !== null) {
            furnitures[draggedFurnitureIndex].angle += angleChange;
        } else if (hoveredFurnitureIndex !== null) {
            furnitures[hoveredFurnitureIndex].angle += angleChange;
        } else if (hoveredDoorIndex !== null) {
            if(doors[hoveredDoorIndex].doorRotation === undefined) {
                doors[hoveredDoorIndex].doorRotation = 0;
            }
            doors[hoveredDoorIndex].doorRotation = (doors[hoveredDoorIndex].doorRotation + 1) % 4; // 0, 1, 2, 3 értékek között váltogat
        } else if (currentTool === 'furniture') {
            currentFurnitureAngle += angleChange;
        }
        draw();
    }
});


// --- MENTÉS GOMB BEKÖTÉSE---
if (saveToCloudBtn) {
    saveToCloudBtn.addEventListener('click', () => {
        // Ellenőrizzük, hogy létezik-e a saveFloorplan függvény
        if (typeof saveFloorplan === "function") {
            saveFloorplan();
        } else {
            console.error("A saveFloorplan függvény nem található!");
            alert("Hiba: A mentés funkció még nincs betöltve.");
        }
    });
}

if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('dashboard-screen').style.display = 'flex';
        
        // Refresh the list of plans in case we just saved a new one
        if (auth.currentUser) {
            fetchUserPlans(auth.currentUser.uid);
        }
    });
}

if (switchToUpperFloorBtn) {
    switchToUpperFloorBtn.addEventListener('click', () => {
        switchFloor(currentFloor + 1); // Go up!
    });
}

if (switchToLowerFloorBtn) {
    switchToLowerFloorBtn.addEventListener('click', () => {
        switchFloor(currentFloor - 1); // Go down!
    });
}

// --- EGYÉB GOMBOK ÉS FÜGGVÉNYEK ---
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', () => {      
    saveStateToHistory();
    nodes.length = 0; 
    walls.length = 0;
    windows.length = 0; 
    doors.length = 0;   
    furnitures.length = 0;
    
    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    hoveredWallIndex = null;
    //bgImage = null;
    
    hoveredFurnitureIndex = null;
    draggedFurnitureIndex = null;
    selectedFurnitureType = null;
    currentFurnitureAngle = 0;

    hoveredDoorIndex = null;
    draggedDoorIndex = null;

    hoveredWindowIndex = null;
    draggedWindowIndex = null;
    
    draw();
    updateDataBar();
});

const ninetyDegreeBtn = document.getElementById('ninetyDegreeBtn');
ninetyDegreeBtn.addEventListener('click', () => {
    isNinetyDegreeMode = !isNinetyDegreeMode; 
    if (isNinetyDegreeMode) {
        ninetyDegreeBtn.classList.add('active'); 
        ninetyDegreeBtn.innerText = "90° mode ON";
    } else {
        ninetyDegreeBtn.classList.remove('active'); 
        ninetyDegreeBtn.innerText = "90° mode OFF";
    }
});

const isDrawingBtn = document.getElementById('isDrawingBtn');
isDrawingBtn.addEventListener('click', () => {
    isShowingPlans = !isShowingPlans;
    if (isShowingPlans) {
        isDrawingBtn.classList.add('active');
        isDrawingBtn.innerText = "Show Plans: On";
        
    } else {
        isDrawingBtn.classList.remove('active');
        isDrawingBtn.innerText = "Show Plans: Off";
    }
    draw();
});

function updateFloorIndicator() {
    const floorIndicator = document.getElementById('currentFloorDisplay');
    if (floorIndicator) {
        floorIndicator.innerText = currentFloor + 1; // Emberi számozás (1, 2, ...)
    } else {
        console.error("Floor indicator element not found!");
    }
}

function updateDataBar() {
    const infoType = document.getElementById('infoType');
    const infoSize = document.getElementById('infoSize');
    if (!infoType || !infoSize) return;

    if (hoveredWallIndex !== null) {
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
        const f = furnitures[hoveredFurnitureIndex];
        let typeName = "";
        let size = "";
        
        if (f.type === 'bed') { typeName = "Bed"; size = "80 x 100 px"; }
        else if (f.type === 'sofa') { typeName = "Sofa"; size = "100 x 50 px"; }
        else if (f.type === 'table') { typeName = "Table"; size = "40 x 80 px"; }
        
        infoType.innerText = typeName;
        infoSize.innerText = size;
    }
    else if (hoveredDoorIndex !== null) {
        const door = doors[hoveredDoorIndex];
        infoType.innerText = "Door";
        infoSize.innerText = "50 x " + wallThickness + " px";
    }
    else if (hoveredWindowIndex !== null) {
        const window = windows[hoveredWindowIndex];
        infoType.innerText = "Window";
        infoSize.innerText = "60 x " + wallThickness + " px";
    }
    else {
        infoType.innerText = "-";
        infoSize.innerText = "-";
    }
}

//Háttérkép felötlése
const bgUpload = document.getElementById('bgUpload');
if (bgUpload) {
    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                bgImage = img; // Eltároljuk a képet
                draw(); // Újrarajzoljuk a vásznat, hogy megjelenjen
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file); // Fájl beolvasása Data URL-ként
    });
}

const opacitySlider = document.getElementById('opacitySlider');
const opacityDisplay = document.getElementById('opacityDisplay');
if(opacitySlider)
{
    opacitySlider.addEventListener('input', (e) => {
        bgOpacity = parseFloat(e.target.value);
        if(opacityDisplay){
            opacityDisplay.innerText = bgOpacity.toFixed(2);
        }
        draw();
    })
}

const thicknesSlider = document.getElementById('thicknessSlider');
const thicknessDisplay = document.getElementById('thicknessDisplay');
if(thicknessSlider){
    thicknessSlider.addEventListener('input', (e) =>{
        wallThickness = parseInt(e.target.value);
        if(thicknessDisplay){
            thicknessDisplay.innerText = wallThickness;
        }
        draw();
    })
}

const sizeSlider = document.getElementById('sizeSlider');
const sizeDisplay = document.getElementById('sizeDisplay');
if(sizeSlider){
    sizeSlider.addEventListener('input', (e) => {
        furnitureSize = parseInt(e.target.value);
        if(sizeDisplay){
            sizeDisplay.innerText = furnitureSize;
        }
        draw();
    })
}

// --- PNG LETÖLTÉS ---
const saveAsPngBtn = document.getElementById('saveAsPNGBtn');
if (saveAsPngBtn) {
    saveAsPngBtn.addEventListener('click', () => {
        //Kimentjük a vásznat képként
        const imageData = canvas.toDataURL("image/png");
        
        //Létrehozunk egy rejtett linket a háttérben
        const link = document.createElement('a');
        link.download = 'floorplan.png'; // A letöltött fájl neve
        link.href = imageData;
        
        //Rákattintunk a rejtett linkre (ez indítja a letöltést)
        link.click();
    });
}

// --- PDF LETÖLTÉS ---
const saveAsPDFBtn = document.getElementById('saveAsPDFBtn');
if (saveAsPDFBtn) {
    saveAsPDFBtn.addEventListener('click', () => {
        // Ellenőrizzük, hogy a jsPDF könyvtár betöltött-e
        if (!window.jspdf) {
            alert("Hiba a PDF modul betöltésekor. Kérlek frissítsd az oldalt!");
            return;
        }

        const { jsPDF } = window.jspdf;
        
        // Létrehozunk egy PDF dokumentumot
        const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
        
        // Kimentjük a képet a vászonról
        const imageData = canvas.toDataURL("image/jpeg", 1.0);
        
        // Rárakjuk a képet a PDF lapra
        pdf.addImage(imageData, 'JPEG', 0, 0, canvas.width, canvas.height);
        
        // Letöltés
        pdf.save("floorplan.pdf");
    });
}

// PROGRAM INDÍTÁSA
draw();