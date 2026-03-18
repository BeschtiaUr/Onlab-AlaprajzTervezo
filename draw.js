// Háttérrács
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

// --- FŐ RAJZOLÓ FÜGGVÉNY ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    drawGrid(); 

    ctx.lineCap = 'round';

    // 1. Kész falak
    walls.forEach((wall, index) => {
        const start = nodes[wall.startNode];
        const end = nodes[wall.endNode];
        
        ctx.beginPath();
        if (index === selectedWallIndex) {
            ctx.strokeStyle = '#ff4444'; // Piros, ha ki van jelölve
            ctx.lineWidth = 7;
        } else {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 5;
        }
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });

    // 2. Épp húzott (ideiglenes) fal
    if (isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        ctx.lineWidth = 5;
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

    // 3. Piros csomópontok
    ctx.fillStyle = '#ff0000';
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}