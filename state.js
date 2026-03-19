const canvas = document.getElementById('floorplan');
const ctx = canvas.getContext('2d');

// --- ADATOK ---
let nodes = []; // Csomópontok {x, y}
let walls = []; // Falak {startNode, endNode}

// --- AKTUÁLIS ÁLLAPOT ---
let isDrawing = false;
let isNinetyDegreeMode = false; 
let currentStartNode = null;
let mousePosition = { x: 0, y: 0 };
const SNAP_DISTANCE = 15; 
const GRID_SIZE = 20;

let draggedWallIndex = null; // Ezentúl falat mozgatunk, nem pontot
let lastMousePos = { x: 0, y: 0 }; // Segít kiszámolni, mennyit húztál az egéren
let hoveredWallIndex = null; // ÚJ: selectedWallIndex helyett!