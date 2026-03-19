const canvas = document.getElementById('floorplan');
const ctx = canvas.getContext('2d');

let nodes = []; // Csomópontok {x, y}
let walls = []; // Falak {startNode, endNode}

let windows = [];
let doors = [];

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