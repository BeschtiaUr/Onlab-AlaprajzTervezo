// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDHaYZpz2GhafrWh9mxac6bBae2t6cWV70",
  authDomain: "alaprajztervezo.firebaseapp.com",
  projectId: "alaprajztervezo",
  storageBucket: "alaprajztervezo.firebasestorage.app",
  messagingSenderId: "1068490270194",
  appId: "1:1068490270194:web:b5468082f3b1355ee6b76b",
  measurementId: "G-L4477L00VP"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); // ÚJ: Firestore elindítása

// 2. DOM ELEMENTS
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authError = document.getElementById('authError');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

// 3. LISTEN TO AUTHENTICATION STATE
auth.onAuthStateChanged((user) => {
    if (user) {
        loginScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        console.log("Logged in as:", user.email);
        
        // ÚJ: Belépéskor automatikusan betöltjük a mentett tervet!
        loadFloorplan(user.uid);
    } else {
        loginScreen.style.display = 'flex';
        mainApp.style.display = 'none';
    }
});

// --- MENTÉS FUNKCIÓ ---
function saveFloorplan() {
    const user = auth.currentUser;
    if (!user) return;

    // Összecsomagoljuk a state.js-ben lévő változókat
    const dataToSave = {
        nodes: nodes,
        walls: walls,
        windows: windows,
        doors: doors,
        furnitures: furnitures,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Mentés a 'floorplans' kollekcióba, a felhasználó ID-jával
    db.collection("floorplans").doc(user.uid).set(dataToSave)
        .then(() => {
            console.log("Succeesfully saved to Cloud!");
            alert("Succeesfully saved to Cloud!");
        })
        .catch((error) => {
            console.error("Error during save:", error);
        });
}

// --- ÚJ: BETÖLTÉS FUNKCIÓ ---
function loadFloorplan(userId) {
    console.log("Getting data");
    db.collection("floorplans").doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                
                // Csak akkor töltjük be, ha az adat létezik a mentésben
                if (data.nodes) { nodes.length = 0; nodes.push(...data.nodes); }
                if (data.walls) { walls.length = 0; walls.push(...data.walls); }
                if (data.windows) { windows.length = 0; windows.push(...data.windows); }
                if (data.doors) { doors.length = 0; doors.push(...data.doors); }
                if (data.furnitures) { furnitures.length = 0; furnitures.push(...data.furnitures); }
                
                console.log("Floorplan successfully loaded!");
                
                // Fontos: Várunk egy picit, hogy minden szkript betöltsön, majd rajzolunk
                setTimeout(() => {
                    if (typeof draw === "function") draw();
                    if (typeof updateDataBar === "function") updateDataBar();
                }, 100);
            } else {
                console.log("There is no saved plan.");
            }
        })
        .catch((error) => {
            console.error("Error during load:", error);
        });
}

// 4. LOGIN / REGISTER / LOGOUT
loginBtn.addEventListener('click', () => {
    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .catch(error => { authError.innerText = error.message; authError.style.display = 'block'; });
});

registerBtn.addEventListener('click', () => {
    auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
        .catch(error => { authError.innerText = error.message; authError.style.display = 'block'; });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => { emailInput.value = ''; passwordInput.value = ''; });
});