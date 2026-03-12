const canvas = document.getElementById('floorplan');
const ctx = canvas.getContext('2d');

//Adatok
let nodes = []; //Csomópontok(x, y)
let walls = []; // Falak (start, index)

//Aktuális állapot
let isDrawing = false;
let currentStartNode = null;
let mousePosition = { x: 0, y: 0 };
const SNAP_DISTANCE = 40; 

//Egér lenyomás
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    const clickPos = getMousePos(e);
    //Van-e pont a kattanási közelben
    const snappedNodeIndex = findClosestNode(clickPos.x, clickPos.y);

    if (!isDrawing) {
        //van
        isDrawing = true;
        if (snappedNodeIndex !== null) {
            currentStartNode = snappedNodeIndex; //kattanás
        } else {
            //nincs
            nodes.push({ x: clickPos.x, y: clickPos.y });
            currentStartNode = nodes.length - 1;
        }
    } else {
        let endNodeIndex;
        if (snappedNodeIndex !== null) {
            endNodeIndex = snappedNodeIndex; //kattanás
        } else {
            //nem
            nodes.push({ x: clickPos.x, y: clickPos.y });
            endNodeIndex = nodes.length - 1;
        }

        //Fal hozzáadása a listához
        walls.push({ startNode: currentStartNode, endNode: endNodeIndex });
        
        currentStartNode = endNodeIndex; 
    }
    draw(); //kirajzolás
});

//Fal húzása
canvas.addEventListener('mousemove', (e) => {
    mousePosition = getMousePos(e);
    if (isDrawing) {
        draw(); //Rajzolás(mert mozog, ezért mindig)
    }
});

//Jobb klikk megszakítja a rajzolást
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    isDrawing = false;
    currentStartNode = null;
    draw();
});

//Segédfüggvények

//Egér koordinátája
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

//Kattanás
function findClosestNode(x, y) {
    for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - x;
        const dy = nodes[i].y - y;
        const distance = Math.sqrt(dx * dx + dy * dy); // $c = \sqrt{a^2 + b^2}$
        if (distance < SNAP_DISTANCE) {
            return i; //legközeleppi pont visszaadása
        }
    }
    return null;
}

//Rajzolás
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);//Törlés

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#333';
    ctx.lineCap = 'round';

    walls.forEach(wall => {
        const start = nodes[wall.startNode];
        const end = nodes[wall.endNode];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });

    //Átmeneti fal rajzolása
    if (isDrawing && currentStartNode !== null) {
        const start = nodes[currentStartNode];
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)'; // Félig átlátszó
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        //Húzásnál kattanás
        const snappedNodeIndex = findClosestNode(mousePosition.x, mousePosition.y);
        if (snappedNodeIndex !== null) {
             ctx.lineTo(nodes[snappedNodeIndex].x, nodes[snappedNodeIndex].y);
        } else {
             ctx.lineTo(mousePosition.x, mousePosition.y);
        }
        ctx.stroke();
    }

    //Pöttyök
    ctx.fillStyle = '#ff0000';
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

//Első rajzolás
draw();