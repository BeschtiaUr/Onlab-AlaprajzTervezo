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
const db = firebase.firestore();

//DOM ELEMENTS
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const mainApp = document.getElementById('main-app');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authError = document.getElementById('authError');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const createNewPlanBtn = document.getElementById('createNewPlanBtn');
const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');

createNewPlanBtn.addEventListener('click', () => {
    currentPlanId = null;

    nodes.length = 0;
    walls.length = 0;
    furnitures.length = 0;
    windows.length = 0;
    doors.length = 0;

    dashboardScreen.style.display = 'none';
    mainApp.style.display = 'flex';

    if (typeof draw === 'function') draw();
    if (typeof updateDataBar === 'function') updateDataBar();
})

dashboardLogoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => { 
        emailInput.value = ''; 
        passwordInput.value = ''; 
    });
});

//AUTH STATE CHANGE LISTENER
auth.onAuthStateChanged((user) => {
    if (user) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        mainApp.style.display = 'none';
        console.log("Logged in as:", user.email);
        
        fetchUserPlans(user.uid);
    } else {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
        mainApp.style.display = 'none';
    }
});

function fetchUserPlans(userId) {
    const plansList = document.getElementById('saved-plans-list');
    plansList.innerHTML = '<p>Loading plans...</p>';

    // Query Firestore for documents where the userId matches
    db.collection("floorplans").where("userId", "==", userId).get()
        .then((querySnapshot) => {
            plansList.innerHTML = ''; // Clear loading text
            
            if (querySnapshot.empty) {
                plansList.innerHTML = '<p>No saved plans yet.</p>';
                return;
            }

            //Going through saved plans
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                //WRAPPER CONTAINER
                const rowDiv = document.createElement('div');
                rowDiv.style.display = 'flex';
                rowDiv.style.gap = '10px';
                rowDiv.style.width = '100%';

                //LOAD BUTTON
                const loadBtn = document.createElement('button');
                loadBtn.className = 'tool-btn';
                loadBtn.style.flexGrow = '1'; // Makes it take up most of the space
                const dateText = data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleDateString() : "Unknown Date";
                loadBtn.innerText = `Plan from ${dateText}`; 
                
                loadBtn.onclick = () => {
                    currentPlanId = doc.id; 
                    loadSpecificPlan(doc.id, data);
                };

                //DELETE BUTTON
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'clear-btn'; // Using your existing red button style
                deleteBtn.innerText = 'X';
                deleteBtn.style.padding = '10px';
                deleteBtn.style.marginTop = '0'; // Override the margin from your CSS

                //Attaching the Firebase Delete logic
                deleteBtn.onclick = () => {
                    const isConfirmed = confirm("Are you sure you want to delete this plan? This cannot be undone.");
                    if (isConfirmed) {
                        db.collection("floorplans").doc(doc.id).delete()
                            .then(() => {
                                console.log("Document successfully deleted!");
                                // Refresh the list
                                fetchUserPlans(userId); 
                            })
                            .catch((error) => {
                                console.error("Error removing document: ", error);
                                alert("Failed to delete the plan.");
                            });
                    }
                };
                
                //Adding the buttons to the row and then the row to the list
                rowDiv.appendChild(loadBtn);
                rowDiv.appendChild(deleteBtn);
                plansList.appendChild(rowDiv);
            });
        })
        .catch((error) => console.error("Error loading plans:", error));
}

function loadSpecificPlan(planID, planData){
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        
        nodes.length = 0;
        walls.length = 0;
        windows.length = 0;
        doors.length = 0;
        furnitures.length = 0;

        //ONLY push data if it exists in the cloud save
        if (planData.nodes) nodes.push(...planData.nodes);
        if (planData.walls) walls.push(...planData.walls);
        if (planData.windows) windows.push(...planData.windows);
        if (planData.doors) doors.push(...planData.doors);
        if (planData.furnitures) furnitures.push(...planData.furnitures);

        loadFloorplan(planID);
}

// --- MENTÉS FUNKCIÓ ---
function saveFloorplan() {
    const user = auth.currentUser;
    if (!user) return;

    const dataToSave = {
        userId: user.uid, 
        nodes: nodes,
        walls: walls,
        windows: windows,
        doors: doors,
        furnitures: furnitures,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (currentPlanId === null) {
        db.collection("floorplans").add(dataToSave)
            .then((docRef) => {
                currentPlanId = docRef.id;
                alert("New plan successfully created and saved!");
            });
    } else {
        db.collection("floorplans").doc(currentPlanId).set(dataToSave)
            .then(() => {
                alert("Plan successfully updated!");
            });
    }
}

// --- BETÖLTÉS FUNKCIÓ ---
function loadFloorplan(planID) {
    console.log("Getting data");
    db.collection("floorplans").doc(planID).get()
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
                
                //Várunk egy picit, hogy minden szkript betöltsön, majd rajzolunk
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

// --- LOGIN / REGISTER / LOGOUT ---
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