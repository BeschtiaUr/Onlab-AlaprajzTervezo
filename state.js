const canvas = document.getElementById('floorplan');
const ctx = canvas.getContext('2d');

let currentPlanId = null; // Holds the Firestore Document ID
let currentPlanName = "My New Plan"; // Optional: Let users name their plans

let nodes = []; // Csomópontok {x, y}
let walls = []; // Falak {startNode, endNode}

let windows = [];
let doors = [];

let bgImage = null;
let bgOpacity = 1.0; // Alapértelmezett átlátszatlanság

let wallThickness =20;
let furnitureSize = 100; // Bútorok alapértelmezett mérete


let currentTool = "walls"; 

let isDrawing = false;
let isNinetyDegreeMode = false; 
let isShowingPlans = true;
let currentStartNode = null;
let mousePosition = { x: 0, y: 0 };
const SNAP_DISTANCE = 15; 
const GRID_SIZE = 20;

let draggedWallIndex = null; 
let lastMousePos = { x: 0, y: 0 }; 
let hoveredWallIndex = null;

let maybeDraggingWallIndex = null;
let mouseDownPos = { x: 0, y: 0 };

let furnitures = []; // Bútorok { type: string, x: number, y: number, angle: number }
let selectedFurnitureType = null; // Milyen bútort választottunk a jobb menüből

let hoveredFurnitureIndex = null; // Törléshez/Mozgatáshoz
let draggedFurnitureIndex = null; // Mozgatáshoz

let hoveredDoorIndex = null;
let draggedDoorIndex = null;

let hoveredWindowIndex = null;
let draggedWindowIndex = null;


let currentFurnitureAngle = 0; // A kezedben lévő bútor aktuális forgatási szöge