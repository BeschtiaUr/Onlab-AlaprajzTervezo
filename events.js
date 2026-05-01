const wallsBtn = document.getElementById('wallsBtn');
const windowsBtn = document.getElementById('windowsBtn');
const doorsBtn = document.getElementById('doorsBtn');
const furnitureBtns = document.querySelectorAll('.furniture-btn'); 
const exportBtn = document.getElementById('exportBtn');

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
    
    isDrawing = false;
    currentStartNode = null;
    draggedWallIndex = null;
    draggedFurnitureIndex = null;
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
        draggedFurnitureIndex = hoveredFurnitureIndex;
        lastMousePos = { x: clickPos.x, y: clickPos.y };
        return;
    }

    // 2. Új bútor lerakása
    if (currentTool === 'furniture') {
        furnitures.push({
            type: selectedFurnitureType,
            x: clickPos.x,
            y: clickPos.y,
            angle: currentFurnitureAngle // Forgatott szöggel rakjuk le
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
                windows.push({ wallIndex: hoveredWallIndex, position: t, length: 60 });
            } else {
                doors.push({ wallIndex: hoveredWallIndex, position: t, length: 50 });
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
    
    if (hoveredWallIndex !== foundHover || hoveredFurnitureIndex !== foundFurnitureHover) {
        hoveredWallIndex = foundHover;
        hoveredFurnitureIndex = foundFurnitureHover;
        draw();
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
    draggedWallIndex = null; 
    draggedFurnitureIndex = null; // Letesszük a bútort is
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

// --- BILLENTYŰZET: TÖRLÉS ÉS FORGATÁS ---
window.addEventListener('keydown', (e) => {
    // TÖRLÉS (Delete / Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
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
            furnitures.splice(hoveredFurnitureIndex, 1);
            hoveredFurnitureIndex = null;
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
        } else if (currentTool === 'furniture') {
            currentFurnitureAngle += angleChange;
        }
        draw();
    }
});


// --- MENTÉS GOMB BEKÖTÉSE (Már biztonságosan kívül van) ---
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        // Ellenőrizzük, hogy létezik-e az auth.js-ben megírt saveFloorplan függvény
        if (typeof saveFloorplan === "function") {
            saveFloorplan();
        } else {
            console.error("A saveFloorplan függvény nem található!");
            alert("Hiba: A mentés funkció még nincs betöltve.");
        }
    });
}

// --- EGYÉB GOMBOK ÉS FÜGGVÉNYEK ---
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', () => {        
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
    else {
        infoType.innerText = "-";
        infoSize.innerText = "-";
    }
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

// PROGRAM INDÍTÁSA
draw();