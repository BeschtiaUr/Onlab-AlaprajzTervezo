const canvas = document.getElementById('floorplan');
const ctx = canvas.getContext('2d');

// --- ADATOK ---
let nodes = []; // Csomópontok {x, y}
let walls = []; // Falak {startNode, endNode}

// --- AKTUÁLIS ÁLLAPOT ---
let isDrawing = false;
let isNinetyDegreeMode = false; // ÚJ: 90 fokos mód állapota
let currentStartNode = null;
let mousePosition = { x: 0, y: 0 };
const SNAP_DISTANCE = 15; 
const GRID_SIZE = 20;

let draggedNodeIndex = null; // Mozgatáshoz
let selectedWallIndex = null; // Törléshez