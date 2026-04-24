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
function drawWindow(x, y, angle, length) {
    ctx.save(); //Elmentjük a vászon eredeti állapotát
    ctx.translate(x, y); //A vászon origóját az ablak közepére toljuk
    ctx.rotate(angle); //Elforgatjuk a vásznat a fal szögébe

    //Fehér háttér
    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -11, length, 22);

    //Az ablaküveg vonalai
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(-length / 2, -4); ctx.lineTo(length / 2, -4);
    ctx.moveTo(-length / 2, 4);  ctx.lineTo(length / 2, 4);
    ctx.stroke();

    //A keret két széle
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -10); ctx.lineTo(-length / 2, 10);
    ctx.moveTo(length / 2, -10);  ctx.lineTo(length / 2, 10);
    ctx.stroke();

    ctx.restore();
}

//AJTÓ RAJZOLÁSA
function drawDoor(x, y, angle, length) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    //Kivágjuk a falat
    ctx.fillStyle = 'white';
    ctx.fillRect(-length / 2, -11, length, 22);

    //Ajtólap
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-length / 2, -10);
    ctx.lineTo(-length / 2, -10 - length);
    ctx.stroke();

    //Nyitásirány íve
    ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); //5px vonal, 5px szünet
    ctx.beginPath();
    ctx.arc(-length / 2, -10, length, 0, -Math.PI / 2, true); //Ív húzása
    ctx.stroke();
    ctx.setLineDash([]); //Szaggatott vonal kikapcsolása

    //A falvégek lezárása
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -10); ctx.lineTo(-length / 2, 10);
    ctx.moveTo(length / 2, -10);  ctx.lineTo(length / 2, 10);
    ctx.stroke();

    ctx.restore();
}

// ---  BÚTOROK RAJZOLÁSA ---
function drawFurnitureItem(x, y, type, angle, isHover = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.globalAlpha = isHover ? 0.5 : 1.0; // Ha csak előnézet, legyen átlátszó
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';

    if (type === 'bed') {
        // Franciaágy
        ctx.fillStyle = '#f1c40f'; // Sárga takaró
        ctx.fillRect(-40, -50, 80, 100);
        ctx.fillStyle = '#fff'; // Párnák
        ctx.fillRect(-35, -45, 30, 20);
        ctx.fillRect(5, -45, 30, 20);
        ctx.strokeRect(-40, -50, 80, 100);
    } 
    else if (type === 'sofa') {
        // Kanapé
        ctx.fillStyle = '#e74c3c'; // Piros ülőke
        ctx.fillRect(-50, -25, 100, 50); 
        ctx.fillStyle = '#c0392b'; // Háttámla és karfa
        ctx.fillRect(-50, -25, 100, 15); // Háttámla
        ctx.fillRect(-50, -10, 20, 35); // Bal karfa
        ctx.fillRect(30, -10, 20, 35); // Jobb karfa
        ctx.strokeRect(-50, -25, 100, 50);
    } 
    else if (type === 'table') {
        ctx.fillStyle = '#ecf0f1'; // Asztallap
        ctx.fillRect(-20, -40, 40, 80);
        ctx.strokeRect(-20, -40, 40, 80);
    }

    ctx.restore();
}


//FŐ RAJZOLÓ FÜGGVÉNY
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
    if (bgImage) {
        // Kiszámoljuk az arányokat, hogy a kép beférjen a vászonra, de ne torzuljon
        const scale = Math.min(canvas.width / bgImage.width, canvas.height / bgImage.height);
        const drawWidth = bgImage.width * scale;
        const drawHeight = bgImage.height * scale;
        const x = (canvas.width / 2) - (drawWidth / 2);
        const y = (canvas.height / 2) - (drawHeight / 2);

        ctx.globalAlpha = 0.4; // 40%-os átlátszóság a háttérhez
        ctx.drawImage(bgImage, x, y, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0; // Visszaállítjuk az átlátszóságot a falakhoz
    }

    drawGrid();

    ctx.lineCap = 'round';

    //KÉSZ FALAK
    walls.forEach((wall, index) => {
        const start = nodes[wall.startNode];
        const end = nodes[wall.endNode];
        
        ctx.beginPath();
        if (currentTool === 'walls' && index === draggedWallIndex) {
            ctx.strokeStyle = '#05a9af'; 
            ctx.lineWidth = 20;
        } 
        else if (currentTool === 'walls' && index === hoveredWallIndex) {
            ctx.strokeStyle = '#ff4444'; 
            ctx.lineWidth = 20;
        } 
        else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 20;
        }
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });

    //KÉSZ ABLAKOK ÉS AJTÓK RAJZOLÁSA
    windows.forEach(win => {
        const w = walls[win.wallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        //Kiszámoljuk az X, Y koordinátát
        const x = n1.x + (n2.x - n1.x) * win.position;
        const y = n1.y + (n2.y - n1.y) * win.position;
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        drawWindow(x, y, angle, win.length);
    });

    doors.forEach(door => {
        const w = walls[door.wallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const x = n1.x + (n2.x - n1.x) * door.position;
        const y = n1.y + (n2.y - n1.y) * door.position;
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        drawDoor(x, y, angle, door.length);
    });

    //ELŐNÉZET
    if (currentTool !== 'walls' && hoveredWallIndex !== null) {
        const w = walls[hoveredWallIndex];
        const n1 = nodes[w.startNode];
        const n2 = nodes[w.endNode];
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        
        ctx.globalAlpha = 0.5;
        if (currentTool === 'windows') drawWindow(mousePosition.x, mousePosition.y, angle, 60);
        if (currentTool === 'doors') drawDoor(mousePosition.x, mousePosition.y, angle, 50);
        ctx.globalAlpha = 1.0; // Visszaállítjuk az átlátszatlanságot
    }

    //ÉPP HÚZOTT FAL
    if (currentTool === 'walls' && isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        ctx.lineWidth = 20;
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
        drawFurnitureItem(f.x, f.y, f.type, f.angle);
        ctx.shadowBlur = 0; // Reset
    });

    // 6. BÚTOR ELŐNÉZET (Hover)
    if (currentTool === 'furniture' && selectedFurnitureType) {
        drawFurnitureItem(mousePosition.x, mousePosition.y, selectedFurnitureType, currentFurnitureAngle, true);
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