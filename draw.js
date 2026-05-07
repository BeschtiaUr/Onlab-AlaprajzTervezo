//Grid
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

//ABLAK RAJZOLÁSA
function drawWindow(x, y, angle, length, t) {
    ctx.save(); //Elmentjük a vászon eredeti állapotát
    ctx.translate(x, y); //A vászon origóját az ablak közepére toljuk
    ctx.rotate(angle); //Elforgatjuk a vásznat a fal szögébe

    const halfT = t / 2;

    //Fehér háttér
    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -(halfT + 1), length, t + 2);

    //Az ablaküveg vonalai
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    const glassOffSet = Math.max(1, t / 5)
    ctx.moveTo(-length / 2, -glassOffSet); ctx.lineTo(length / 2, -glassOffSet);
    ctx.moveTo(-length / 2, glassOffSet);  ctx.lineTo(length / 2, glassOffSet);
    ctx.stroke();

    //A keret két széle
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -halfT); ctx.lineTo(-length / 2, halfT);
    ctx.moveTo(length / 2, -halfT);  ctx.lineTo(length / 2, halfT);
    ctx.stroke();

    ctx.restore();
}

//AJTÓ RAJZOLÁSA
function drawDoor(x, y, angle, length, t, isMirrored = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (isMirrored) {
        ctx.scale(-1, 1); 
    }

    const halfT = t / 2;

    //Kivágjuk a falat
    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -(halfT + 1), length, t + 2);
    //Ajtólap
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-length / 2, -halfT);
    ctx.lineTo(-length / 2, -halfT - length);
    ctx.stroke();

    //Nyitásirány íve
    ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); //5px vonal, 5px szünet
    ctx.beginPath();
    ctx.arc(-length / 2, -halfT, length, 0, -Math.PI / 2, true); //Ív húzása
    ctx.stroke();
    ctx.setLineDash([]); //Szaggatott vonal kikapcsolása

    //A falvégek lezárása
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -halfT); ctx.lineTo(-length / 2, halfT);
    ctx.moveTo(length / 2, -halfT);  ctx.lineTo(length / 2, halfT);
    ctx.stroke();

    ctx.restore();
}

// ---  BÚTOROK RAJZOLÁSA ---
function drawFurnitureItem(x, y, type, angle, customSize, isHover = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const size = customSize/100; // Használjuk a globális bútor méretet

    ctx.globalAlpha = isHover ? 0.5 : 1.0; // Ha csak előnézet, legyen átlátszó
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';

    if (type === 'bed') {
        // Franciaágy
        ctx.fillStyle = '#f1c40f'; // Sárga takaró
        ctx.fillRect(-size*40, -size*50, size*80, size*100); 
        ctx.fillStyle = '#fff'; // Párnák
        ctx.fillRect(-size*35, -size*45, size*30, size*20);
        ctx.fillRect(size*5, -size*45, size*30, size*20);
        ctx.strokeRect(-size*40, -size*50, size*80, size*100);
    } 
    else if (type === 'sofa') {
        // Kanapé
        ctx.fillStyle = '#e74c3c'; // Piros ülőke
        ctx.fillRect(-size*50, -size*25, size*100, size*50); 
        ctx.fillStyle = '#c0392b'; // Háttámla és karfa
        ctx.fillRect(-size*50, -size*25, size*100, size*15); // Háttámla
        ctx.fillRect(-size*50, -size*10, size*20, size*35); // Bal karfa
        ctx.fillRect(size*30, -size*10, size*20, size*35); // Jobb karfa
        ctx.strokeRect(-size*50, -size*25, size*100, size*50);
    } 
    else if (type === 'table') {
        ctx.fillStyle = '#ecf0f1'; // Asztallap
        ctx.fillRect(-size*20, -size*40, size*40, size*80);
        ctx.strokeRect(-size*20, -size*40, size*40, size*80);
    }

    ctx.restore();
}

function drawBackgroundImage() {
    if (bgImage) { 
        const scale = Math.min(canvas.width / bgImage.width, canvas.height / bgImage.height);
        const drawWidth = bgImage.width * scale;
        const drawHeight = bgImage.height * scale;
        const x = (canvas.width / 2) - (drawWidth / 2);
        const y = (canvas.height / 2) - (drawHeight / 2);

        ctx.globalAlpha = bgOpacity; // Használjuk a dinamikus átlátszóságot
        ctx.drawImage(bgImage, x, y, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0; 
    }
}

//FŐ RAJZOLÓ FÜGGVÉNY
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    drawBackgroundImage(); // Ha van háttérkép, rajzoljuk ki először

    drawGrid();

    ctx.lineCap = 'round';
    if(isShowingPlans){
        //KÉSZ FALAK
        walls.forEach((wall, index) => {
            const start = nodes[wall.startNode];
            const end = nodes[wall.endNode];
            const currentT = wall.thickness || 20;
            
            ctx.beginPath();
            if (currentTool === 'walls' && index === draggedWallIndex) {
                ctx.strokeStyle = '#05a9af'; 
                ctx.lineWidth = currentT;
            } 
            else if (currentTool === 'walls' && index === hoveredWallIndex) {
                ctx.strokeStyle = '#ff4444'; 
                ctx.lineWidth = currentT;
            } 
            else {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = currentT;
            }
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });

        //KÉSZ ABLAKOK ÉS AJTÓK RAJZOLÁSA
        windows.forEach((win, index) => {
            const w = walls[win.wallIndex];
            const currentT = w.thickness || 20;
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            //Kiszámoljuk az X, Y koordinátát
            const x = n1.x + (n2.x - n1.x) * win.position;
            const y = n1.y + (n2.y - n1.y) * win.position;
            const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
            if (index === hoveredWindowIndex || index === draggedWindowIndex) {
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            drawWindow(x, y, angle, win.length, currentT);
            ctx.shadowBlur = 0;

        });

        doors.forEach((door, index) => {
            const w = walls[door.wallIndex];
            const currentT = w.thickness || 20;
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            
            // 1. Az X és Y mindig marad az eredeti, hogy a falon maradjon az ajtó!
            const x = n1.x + (n2.x - n1.x) * door.position;
            const y = n1.y + (n2.y - n1.y) * door.position;

            const rotation = door.doorRotation || 0; // Alapértelmezett forgatás 0

            const isFlipped = (rotation === 1 || rotation === 3);
            const isMirrored = (rotation === 2 || rotation === 3);
            
            // 2. Csak a szöget forgatjuk meg 180 fokkal (Math.PI)
            const baseAngle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
            const angle = isFlipped ? baseAngle + Math.PI : baseAngle;

            if (index === hoveredDoorIndex || index === draggedDoorIndex) {
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            drawDoor(x, y, angle, door.length, currentT, isMirrored);
            ctx.shadowBlur = 0;
        });

        //ELŐNÉZET
        if (currentTool !== 'walls' && hoveredWallIndex !== null) {
            const w = walls[hoveredWallIndex];
            const currentT = w.thickness || 20;
            const n1 = nodes[w.startNode];
            const n2 = nodes[w.endNode];
            const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
            
            ctx.globalAlpha = 0.5;
            if (currentTool === 'windows') drawWindow(mousePosition.x, mousePosition.y, angle, 60, currentT);
            if (currentTool === 'doors') drawDoor(mousePosition.x, mousePosition.y, angle, 50, currentT);
            ctx.globalAlpha = 1.0; // Visszaállítjuk az átlátszatlanságot
        }

        //ÉPP HÚZOTT FAL
        if (currentTool === 'walls' && isDrawing && currentStartNode !== null) {
            const start = nodes[currentStartNode];
            ctx.lineWidth = wallThickness;
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

        furnitures.forEach((f, index) => {
            // Kijelölés vizualizálása (Piros keret, ha felette az egér)
            if (index === hoveredFurnitureIndex || index === draggedFurnitureIndex) {
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            const currentSize = f.size || 100; 
            drawFurnitureItem(f.x, f.y, f.type, f.angle, currentSize);            
            ctx.shadowBlur = 0; // Reset
        });

        // 6. BÚTOR ELŐNÉZET (Hover)
        if (currentTool === 'furniture' && selectedFurnitureType) {
            drawFurnitureItem(mousePosition.x, mousePosition.y, selectedFurnitureType, currentFurnitureAngle, furnitureSize, true);
        }

        //PIROS CSOMÓPONTOK
        if (currentTool === 'walls') {
            ctx.fillStyle = '#ff0000';
            nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        if (typeof updateDataBar === 'function') updateDataBar();
    }
}