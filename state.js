const canvas = document.getElementById('floorplan');
const ctx = canvas.getContext('2d');

// --- ADATOK (Ez kerül majd a Firebase-be) ---
let nodes = []; // Csomópontok {x, y}
let walls = []; // Falak {startNode, endNode}

// ÚJ ADATOK:
let windows = []; // Ablakok { wallIndex: number, position: number (0-1), length: number }
let doors = []; // Ajtók { wallIndex: number, position: number (0-1), length: number }

// --- AKTUÁLIS ÁLLAPOT (Csak a böngészőben kell) ---
// ÚJ: Az aktuálisan kijelölt eszköz ("walls", "windows", "doors")
let currentTool = "walls"; 

let isDrawing = false;
let isNinetyDegreeMode = false; 
let currentStartNode = null;
let mousePosition = { x: 0, y: 0 };
const SNAP_DISTANCE = 15; 
const GRID_SIZE = 20;

let draggedWallIndex = null; 
let lastMousePos = { x: 0, y: 0 }; 
let hoveredWallIndex = null;