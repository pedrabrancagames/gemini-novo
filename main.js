import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const CAPTURE_RADIUS = 15;
    const CAPTURE_DURATION = 5000;
    const INVENTORY_LIMIT = 5;
    const CONTAINMENT_UNIT_ID = "GHOSTBUSTERS_CONTAINMENT_UNIT_01";

    const firebaseConfig = {
        apiKey: "AIzaSyC8DE4F6mU9oyRw8cLU5vcfxOp5RxLcgHA",
        authDomain: "ghostbusters-ar-game.firebaseapp.com",
        databaseURL: "https://ghostbusters-ar-game-default-rtdb.firebaseio.com",
        projectId: "ghostbusters-ar-game",
        storageBucket: "ghostbusters-ar-game.appspot.com",
        messagingSenderId: "4705887791",
        appId: "1:4705887791:web:a1a4e360fb9f8415be08da"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);
    const provider = new GoogleAuthProvider();

    const locations = {
        "Praça Central": { lat: -27.630913, lon: -48.679793 },
        "Parque da Cidade": { lat: -27.639797, lon: -48.667749 }
    };

    const sceneEl = document.getElementById('ar-scene');
    const loginScreen = document.getElementById('login-screen');
    const locationScreen = document.getElementById('location-screen');
    const enterButton = document.getElementById('enter-button');
    const googleLoginButton = document.getElementById('google-login-button');
    const gameUi = document.getElementById('game-ui');
    const locationButtons = document.querySelectorAll('.location-button');
    const minimapElement = document.getElementById('minimap');
    const distanceInfo = document.getElementById('distance-info');
    const captureButton = document.getElementById('capture-button');
    const captureProgress = document.getElementById('capture-progress');
    const inventoryIconContainer = document.getElementById('inventory-icon-container');
    const inventoryModal = document.getElementById('inventory-modal');
    const closeInventoryButton = document.getElementById('close-inventory-button');
    const inventoryBadge = document.getElementById('inventory-badge');
    const ghostList = document.getElementById('ghost-list');
    const qrScannerScreen = document.getElementById('qr-scanner-screen');
    const depositButton = document.getElementById('deposit-button');
    const closeScannerButton = document.getElementById('close-scanner-button');

    const reticle = document.getElementById('reticle');
    const ghostEntity = document.getElementById('ghost');
    const protonBeamSound = document.getElementById('proton-beam-sound');
    const captureSuccessSound = document.getElementById('capture-success-sound');

    let gameInitialized = false;
    let hitTestSource = null;
    let ghostPlaced = false;
    let currentUser = null;
    let selectedLocation = null;
    let canPlaceGhost = false;
    let isCapturing = false;
    let captureTimer, progressInterval;
    let inventory = [];

    let map, playerMarker, ghostMarker;
    let ghostPosition = {};
    let userStats = { points: 0, captures: 0 };
    let html5QrCode;

    function saveUserToDatabase(user) {
        const userRef = ref(database, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                userStats = snapshot.val();
                inventory = userStats.inventory || [];
            } else {
                const newUserStats = { displayName: user.displayName, email: user.email, points: 0, captures: 0, level: 1, inventory: [] };
                set(userRef, newUserStats);
                userStats = newUserStats;
                inventory = [];
            }
            updateInventoryUI();
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            saveUserToDatabase(user);
            loginScreen.classList.add('hidden');
            locationScreen.classList.remove('hidden');
        } else {
            currentUser = null;
            loginScreen.classList.remove('hidden');
            locationScreen.classList.add('hidden');
            gameUi.classList.add('hidden');
            googleLoginButton.style.display = 'block';
        }
    });

    function updateInventoryUI() {
        inventoryBadge.innerText = `${inventory.length}/${INVENTORY_LIMIT}`;
        ghostList.innerHTML = '';
        if (inventory.length === 0) {
            ghostList.innerHTML = '<li>Inventário vazio.</li>';
            depositButton.style.display = 'none';
        } else {
            inventory.forEach(ghost => {
                const li = document.createElement('li');
                li.textContent = ghost.type + ' - ID: ' + ghost.id;
                ghostList.appendChild(li);
            });
            depositButton.style.display = 'block';
        }
    }

    function depositGhosts() {
        inventory = [];
        const userRef = ref(database, 'users/' + currentUser.uid);
        update(userRef, { inventory: inventory });
        updateInventoryUI();
        alert("Fantasmas depositados com sucesso!");
        generateGhost();
    }

    function onScanSuccess(decodedText, decodedResult) {
        stopQrScanner();
        if (decodedText === CONTAINMENT_UNIT_ID) {
            depositGhosts();
        } else {
            alert("QR Code inválido!");
        }
    }

    function startQrScanner() {
        inventoryModal.classList.add('hidden');
        qrScannerScreen.classList.remove('hidden');
        html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccess, (errorMessage) => {}).catch(err => alert("Erro ao iniciar scanner de QR Code."));
    }

    function stopQrScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.warn("Falha ao parar o scanner de QR."));
        }
        qrScannerScreen.classList.add('hidden');
    }

    function initGame() {
        gameInitialized = true;
        locationScreen.classList.add('hidden');
        gameUi.style.display = 'block';
        initMap();
        const renderer = sceneEl.renderer;
        const xrSession = renderer.xr.getSession();
        if (xrSession) setupHitTest(xrSession, renderer);
    }

    function initMap() {
        map = L.map(minimapElement).setView([selectedLocation.lat, selectedLocation.lon], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        generateGhost();
        startGps();
    }

    function generateGhost() {
        if (inventory.length >= INVENTORY_LIMIT) {
            distanceInfo.innerText = "Inventário Cheio!";
            if(ghostMarker) ghostMarker.remove();
            return;
        }
        const radius = 0.0001;
        ghostPosition.lat = selectedLocation.lat + (Math.random() - 0.5) * radius * 2;
        ghostPosition.lon = selectedLocation.lon + (Math.random() - 0.5) * radius * 2;
        
        const ghostIcon = L.icon({ iconUrl: 'assets/images/logo.png', iconSize: [30, 30] });
        if(ghostMarker) ghostMarker.setLatLng([ghostPosition.lat, ghostPosition.lon]);
        else ghostMarker = L.marker([ghostPosition.lat, ghostPosition.lon], { icon: ghostIcon }).addTo(map);
    }

    function startGps() {
        navigator.geolocation.watchPosition(onGpsUpdate, 
            () => { alert("Não foi possível obter sua localização."); },
            { enableHighAccuracy: true }
        );
    }

    function onGpsUpdate(position) {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        if (!playerMarker) {
            const playerIcon = L.divIcon({ className: 'player-marker', html: '<div style="background-color: #92F428; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>', iconSize: [15, 15] });
            playerMarker = L.marker([userLat, userLon], { icon: playerIcon }).addTo(map);
        } else {
            playerMarker.setLatLng([userLat, userLon]);
        }
        map.setView([userLat, userLon], map.getZoom());
        checkProximity(userLat, userLon);
    }

    function checkProximity(userLat, userLon) {
        if (inventory.length >= INVENTORY_LIMIT) return;
        const R = 6371e3;
        const phi1 = userLat * Math.PI/180, phi2 = ghostPosition.lat * Math.PI/180;
        const dPhi = (ghostPosition.lat-userLat) * Math.PI/180;
        const dLambda = (ghostPosition.lon-userLon) * Math.PI/180;
        const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda/2) * Math.sin(dLambda/2);
        const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

        distanceInfo.innerText = `Fantasma: ${distance.toFixed(0)}m`;
        if (distance <= CAPTURE_RADIUS) {
            canPlaceGhost = true;
            distanceInfo.innerText = "FANTASMA PRÓXIMO! OLHE AO REDOR!";
            distanceInfo.style.color = "#ff0000";
        } else {
            canPlaceGhost = false;
            distanceInfo.style.color = "#92F428";
        }
    }

    function startCapture() {
        if (isCapturing || !ghostPlaced || inventory.length >= INVENTORY_LIMIT) return;
        isCapturing = true;
        protonBeamSound.play();
        let startTime = Date.now();

        progressInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / CAPTURE_DURATION, 1);
            captureProgress.style.transform = `translateY(${100 - progress * 100}%)`;
        }, 100);

        captureTimer = setTimeout(() => {
            ghostCaptured();
        }, CAPTURE_DURATION);
    }

    function cancelCapture() {
        if (!isCapturing) return;
        isCapturing = false;
        protonBeamSound.pause();
        protonBeamSound.currentTime = 0;
        clearTimeout(captureTimer);
        clearInterval(progressInterval);
        captureProgress.style.transform = 'translateY(100%)';
    }

    function ghostCaptured() {
        cancelCapture();
        captureSuccessSound.play();
        ghostEntity.setAttribute('visible', false);
        ghostPlaced = false;
        canPlaceGhost = false;

        inventory.push({ id: Date.now(), type: 'Fantasma Comum' });
        userStats.points += 10;
        userStats.captures += 1;
        updateInventoryUI();

        const userRef = ref(database, 'users/' + currentUser.uid);
        update(userRef, { points: userStats.points, captures: userStats.captures, inventory: inventory });

        alert(`Fantasma capturado! Você agora tem ${userStats.points} pontos.`);
        generateGhost();
    }

    async function setupHitTest(session, renderer) {
        const referenceSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource({ space: referenceSpace });
        renderer.setAnimationLoop(onXRFrame);
    }

    function onXRFrame(timestamp, frame) {
        if (!frame || !hitTestSource || ghostPlaced) { // DEBUG: Removido !canPlaceGhost para teste
            // reticle.setAttribute('visible', 'false');
            // return;
        }
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(sceneEl.renderer.xr.getReferenceSpace());
            reticle.setAttribute('visible', true);
            reticle.object3D.matrix.fromArray(pose.transform.matrix);
            reticle.object3D.matrix.decompose(reticle.object3D.position, reticle.object3D.quaternion, reticle.object3D.scale);
        } else {
            reticle.setAttribute('visible', false);
        }
    }

    function placeGhost() {
        if (ghostPlaced || !reticle.getAttribute('visible')) return;
        ghostEntity.setAttribute('position', reticle.object3D.position);
        ghostEntity.setAttribute('visible', 'true');
        const scale = 0.3;
        ghostEntity.object3D.scale.set(scale, scale, scale);
        ghostPlaced = true;
        reticle.setAttribute('visible', 'false');
    }

    // --- Event Listeners ---
    googleLoginButton.addEventListener('click', () => signInWithPopup(auth, provider));
    enterButton.addEventListener('click', async () => {
        alert("O botão 'Iniciar Caça' foi clicado! Tentando entrar em modo AR...");
        if (!selectedLocation) return;
        try {
            await sceneEl.enterAR();
        } catch (e) { alert("Erro ao iniciar AR"); }
    });
    inventoryIconContainer.addEventListener('click', () => inventoryModal.classList.remove('hidden'));
    closeInventoryButton.addEventListener('click', () => inventoryModal.classList.add('hidden'));
    depositButton.addEventListener('click', startQrScanner);
    closeScannerButton.addEventListener('click', stopQrScanner);
    captureButton.addEventListener('mousedown', startCapture);
    captureButton.addEventListener('mouseup', cancelCapture);
    captureButton.addEventListener('mouseleave', cancelCapture);
    captureButton.addEventListener('touchstart', startCapture);
    captureButton.addEventListener('touchend', cancelCapture);
    sceneEl.addEventListener('enter-vr', initGame);
    sceneEl.addEventListener('click', (event) => {
        if (event.target.classList.contains('ui-element')) return;
        if (gameInitialized) placeGhost();
    });

    googleLoginButton.style.display = 'block';
});
