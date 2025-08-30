import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

AFRAME.registerComponent('game-manager', {
    init: function () {
        this.CAPTURE_RADIUS = 15;
        this.CAPTURE_DURATION_NORMAL = 5000;
        this.CAPTURE_DURATION_STRONG = 8000;
        this.INVENTORY_LIMIT = 5;
        this.CONTAINMENT_UNIT_ID = "GHOSTBUSTERS_CONTAINMENT_UNIT_01";
        this.ECTO1_UNLOCK_COUNT = 5;

        this.firebaseConfig = {
            apiKey: "AIzaSyC8DE4F6mU9oyRw8cLU5vcfxOp5RxLcgHA",
            authDomain: "ghostbusters-ar-game.firebaseapp.com",
            databaseURL: "https://ghostbusters-ar-game-default-rtdb.firebaseio.com",
            projectId: "ghostbusters-ar-game",
            storageBucket: "ghostbusters-ar-game.appspot.com",
            messagingSenderId: "4705887791",
            appId: "1:4705887791:web:a1a4e360fb9f8415be08da"
        };

        this.locations = {
            "Praça Central": { lat: -27.630913, lon: -48.679793 },
            "Parque da Cidade": { lat: -27.639797, lon: -48.667749 }
        };
        this.ECTO1_POSITION = {};

        this.bindMethods();
        this.initializeDOMElements();
        this.initializeApp();
        this.addEventListeners();

        this.gameInitialized = false;
        this.hitTestSource = null;
        this.placedObjects = { ghost: false, ecto1: false };
        this.currentUser = null;
        this.selectedLocation = null;
        this.objectToPlace = null;
        this.isCapturing = false;
        this.captureTimer = null;
        this.progressInterval = null;
        this.inventory = [];
        this.map = null;
        this.playerMarker = null;
        this.ghostMarker = null;
        this.ecto1Marker = null;
        this.ghostData = {};
        this.userStats = { points: 0, captures: 0, ecto1Unlocked: false };
        this.html5QrCode = null;
    },

    bindMethods: function () {
        this.saveUserToDatabase = this.saveUserToDatabase.bind(this);
        this.onAuthStateChanged = this.onAuthStateChanged.bind(this);
        this.updateInventoryUI = this.updateInventoryUI.bind(this);
        this.depositGhosts = this.depositGhosts.bind(this);
        this.onScanSuccess = this.onScanSuccess.bind(this);
        this.startQrScanner = this.startQrScanner.bind(this);
        this.stopQrScanner = this.stopQrScanner.bind(this);
        this.initGame = this.initGame.bind(this);
        this.initMap = this.initMap.bind(this);
        this.showEcto1OnMap = this.showEcto1OnMap.bind(this);
        this.generateGhost = this.generateGhost.bind(this);
        this.startGps = this.startGps.bind(this);
        this.onGpsUpdate = this.onGpsUpdate.bind(this);
        this.checkProximity = this.checkProximity.bind(this);
        this.startCapture = this.startCapture.bind(this);
        this.cancelCapture = this.cancelCapture.bind(this);
        this.ghostCaptured = this.ghostCaptured.bind(this);
        this.setupHitTest = this.setupHitTest.bind(this);
        this.placeObject = this.placeObject.bind(this);
        this.tick = this.tick.bind(this);
    },

    initializeDOMElements: function () {
        this.loginScreen = document.getElementById('login-screen');
        this.locationScreen = document.getElementById('location-screen');
        this.enterButton = document.getElementById('enter-button');
        this.googleLoginButton = document.getElementById('google-login-button');
        this.gameUi = document.getElementById('game-ui');
        this.locationButtons = document.querySelectorAll('.location-button');
        this.minimapElement = document.getElementById('minimap');
        this.distanceInfo = document.getElementById('distance-info');
        this.inventoryIconContainer = document.getElementById('inventory-icon-container');
        this.inventoryModal = document.getElementById('inventory-modal');
        this.closeInventoryButton = document.getElementById('close-inventory-button');
        this.inventoryBadge = document.getElementById('inventory-badge');
        this.ghostList = document.getElementById('ghost-list');
        this.qrScannerScreen = document.getElementById('qr-scanner-screen');
        this.depositButton = document.getElementById('deposit-button');
        this.closeScannerButton = document.getElementById('close-scanner-button');
        this.reticle = document.getElementById('reticle');
        this.ghostComumEntity = document.getElementById('ghost-comum');
        this.ghostForteEntity = document.getElementById('ghost-forte');
        this.activeGhostEntity = null; // Novo: para rastrear o fantasma ativo
        this.ecto1Entity = document.getElementById('ecto-1');
        this.protonBeamSound = document.getElementById('proton-beam-sound');
        this.ghostCaptureSound = document.getElementById('ghost-capture-sound');
        this.inventoryFullSound = document.getElementById('inventory-full-sound');
        this.protonPackIcon = document.getElementById('proton-pack-icon');
        this.protonPackProgressBar = document.getElementById('proton-pack-progress-bar');
        this.protonPackProgressFill = document.getElementById('proton-pack-progress-fill');
    },

    initializeApp: function () {
        const app = initializeApp(this.firebaseConfig);
        this.auth = getAuth(app);
        this.database = getDatabase(app);
        this.provider = new GoogleAuthProvider();
        onAuthStateChanged(this.auth, this.onAuthStateChanged);
        this.googleLoginButton.style.display = 'block';
    },

    addEventListeners: function () {
        this.googleLoginButton.addEventListener('click', () => signInWithPopup(this.auth, this.provider));
        this.enterButton.addEventListener('click', async () => {
            if (!this.selectedLocation) return;
            try {
                await this.el.sceneEl.enterAR();
            } catch (e) { alert("Erro ao iniciar AR: " + e.message); }
        });
        this.locationButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.locationButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                this.selectedLocation = this.locations[button.dataset.locationName];
                this.enterButton.disabled = false;
                this.enterButton.style.display = 'block';
            });
        });
        this.inventoryIconContainer.addEventListener('click', () => this.inventoryModal.classList.remove('hidden'));
        this.closeInventoryButton.addEventListener('click', () => this.inventoryModal.classList.add('hidden'));
        this.depositButton.addEventListener('click', this.startQrScanner);
        this.closeScannerButton.addEventListener('click', this.stopQrScanner);
        this.protonPackIcon.addEventListener('mousedown', this.startCapture);
        this.protonPackIcon.addEventListener('mouseup', this.cancelCapture);
        this.protonPackIcon.addEventListener('mouseleave', this.cancelCapture);
        this.protonPackIcon.addEventListener('touchstart', this.startCapture);
        this.protonPackIcon.addEventListener('touchend', this.cancelCapture);
        this.protonPackIcon.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });
        this.el.sceneEl.addEventListener('enter-vr', this.initGame);
    },

    saveUserToDatabase: function (user) {
        const userRef = ref(this.database, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                this.userStats = snapshot.val();
                this.inventory = this.userStats.inventory || [];
            } else {
                const newUserStats = { displayName: user.displayName, email: user.email, points: 0, captures: 0, level: 1, inventory: [], ecto1Unlocked: false };
                set(userRef, newUserStats);
                this.userStats = newUserStats;
                this.inventory = [];
            }
            this.updateInventoryUI();
        });
    },

    onAuthStateChanged: function (user) {
        if (user) {
            this.currentUser = user;
            this.saveUserToDatabase(user);
            this.loginScreen.classList.add('hidden');
            this.locationScreen.classList.remove('hidden');
        } else {
            this.currentUser = null;
            this.loginScreen.classList.remove('hidden');
            this.locationScreen.classList.add('hidden');
            this.gameUi.classList.add('hidden');
            this.googleLoginButton.style.display = 'block';
        }
    },

    updateInventoryUI: function () {
        this.inventoryBadge.innerText = `${this.inventory.length}/${this.INVENTORY_LIMIT}`;
        this.ghostList.innerHTML = '';
        if (this.inventory.length === 0) {
            this.ghostList.innerHTML = '<li>Inventário vazio.</li>';
            this.depositButton.style.display = 'none';
        } else {
            this.inventory.forEach(ghost => {
                const li = document.createElement('li');
                li.textContent = `${ghost.type} (Pontos: ${ghost.points}) - ID: ${ghost.id}`;
                this.ghostList.appendChild(li);
            });
            this.depositButton.style.display = 'block';
        }
    },

    depositGhosts: function () {
        this.inventory = [];
        const userRef = ref(this.database, 'users/' + this.currentUser.uid);
        update(userRef, { inventory: this.inventory });
        this.updateInventoryUI();
        alert("Fantasmas depositados com sucesso!");
        this.generateGhost();
    },

    onScanSuccess: function (decodedText, decodedResult) {
        this.stopQrScanner();
        if (decodedText === this.CONTAINMENT_UNIT_ID) {
            this.depositGhosts();
        } else {
            alert("QR Code inválido!");
        }
    },

    startQrScanner: function () {
        this.inventoryModal.classList.add('hidden');
        this.qrScannerScreen.classList.remove('hidden');
        this.html5QrCode = new Html5Qrcode("qr-reader");
        this.html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, this.onScanSuccess, () => {}).catch(err => alert("Erro ao iniciar scanner de QR Code."));
    },

    stopQrScanner: function () {
        if (this.html5QrCode && this.html5QrCode.isScanning) {
            this.html5QrCode.stop().catch(err => console.warn("Falha ao parar o scanner de QR."));
        }
        this.qrScannerScreen.classList.add('hidden');
    },

    initGame: function () {
        this.gameInitialized = true;
        this.locationScreen.classList.add('hidden');
        this.gameUi.classList.remove('hidden');
        this.initMap();
        this.setupHitTest();
    },

    initMap: function () {
        this.ECTO1_POSITION = { lat: this.selectedLocation.lat + 0.0005, lon: this.selectedLocation.lon - 0.0005 };
        this.map = L.map(this.minimapElement).setView([this.selectedLocation.lat, this.selectedLocation.lon], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        if (this.userStats.ecto1Unlocked) this.showEcto1OnMap();
        this.generateGhost();
        this.startGps();
    },

    showEcto1OnMap: function () {
        const ectoIcon = L.divIcon({ className: 'ecto-marker', html: '<div style="font-size: 20px;">🚗</div>', iconSize: [20, 20] });
        if (!this.ecto1Marker) {
            this.ecto1Marker = L.marker([this.ECTO1_POSITION.lat, this.ECTO1_POSITION.lon], { icon: ectoIcon }).addTo(this.map);
        }
    },

    generateGhost: function () {
        if (this.inventory.length >= this.INVENTORY_LIMIT) {
            this.distanceInfo.innerText = "Inventário Cheio!";
            if(this.ghostMarker) this.ghostMarker.remove();
            return;
        }
        const radius = 0.0001;
        const isStrong = Math.random() < 0.25;
        this.ghostData = {
            lat: this.selectedLocation.lat + (Math.random() - 0.5) * radius * 2,
            lon: this.selectedLocation.lon + (Math.random() - 0.5) * radius * 2,
            type: isStrong ? 'Fantasma Forte' : 'Fantasma Comum',
            points: isStrong ? 25 : 10,
            captureDuration: isStrong ? this.CAPTURE_DURATION_STRONG : this.CAPTURE_DURATION_NORMAL
        };
        
        const iconUrl = isStrong ? 'assets/images/pke_meter.png' : 'assets/images/logo.png';
        const ghostIcon = L.icon({ iconUrl: iconUrl, iconSize: [35, 35] });
        if(this.ghostMarker) this.ghostMarker.setLatLng([this.ghostData.lat, this.ghostData.lon]).setIcon(ghostIcon);
        else this.ghostMarker = L.marker([this.ghostData.lat, this.ghostData.lon], { icon: ghostIcon }).addTo(this.map);
    },

    startGps: function () {
        navigator.geolocation.watchPosition(this.onGpsUpdate, 
            () => { alert("Não foi possível obter sua localização."); },
            { enableHighAccuracy: true }
        );
    },

    onGpsUpdate: function (position) {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        if (!this.playerMarker) {
            const playerIcon = L.divIcon({ className: 'player-marker', html: '<div style="background-color: #92F428; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>', iconSize: [15, 15] });
            this.playerMarker = L.marker([userLat, userLon], { icon: playerIcon }).addTo(this.map);
        } else {
            this.playerMarker.setLatLng([userLat, userLon]);
        }
        this.map.setView([userLat, userLon], this.map.getZoom());
        this.checkProximity(userLat, userLon);
    },

    checkProximity: function (userLat, userLon) {
        const R = 6371e3;
        let isNearObject = false;

        if (this.inventory.length < this.INVENTORY_LIMIT && this.ghostData && this.ghostData.lat) {
            const dPhiGhost = (this.ghostData.lat - userLat) * Math.PI / 180;
            const dLambdaGhost = (this.ghostData.lon - userLon) * Math.PI / 180;
            const aGhost = Math.sin(dPhiGhost / 2) * Math.sin(dPhiGhost / 2) + Math.cos(userLat * Math.PI / 180) * Math.cos(this.ghostData.lat * Math.PI / 180) * Math.sin(dLambdaGhost / 2) * Math.sin(dLambdaGhost / 2);
            const distanceGhost = R * (2 * Math.atan2(Math.sqrt(aGhost), Math.sqrt(1 - aGhost)));

            if (distanceGhost <= this.CAPTURE_RADIUS) {
                this.objectToPlace = 'ghost';
                this.activeGhostEntity = this.ghostData.type === 'Fantasma Forte' ? this.ghostForteEntity : this.ghostComumEntity;
                this.distanceInfo.innerText = `FANTASMA ${this.ghostData.type.toUpperCase()} PRÓXIMO!`;
                this.distanceInfo.style.color = "#ff0000";
                isNearObject = true;
            } else {
                this.distanceInfo.innerText = `Fantasma: ${distanceGhost.toFixed(0)}m`;
                this.distanceInfo.style.color = "#92F428";
            }
        }

        if (this.userStats.ecto1Unlocked && !isNearObject) {
            const dPhiEcto = (this.ECTO1_POSITION.lat - userLat) * Math.PI / 180;
            const dLambdaEcto = (this.ECTO1_POSITION.lon - userLon) * Math.PI / 180;
            const aEcto = Math.sin(dPhiEcto / 2) * Math.sin(dPhiEcto / 2) + Math.cos(userLat * Math.PI / 180) * Math.cos(this.ECTO1_POSITION.lat * Math.PI / 180) * Math.sin(dLambdaEcto / 2) * Math.sin(dLambdaEcto / 2);
            const distanceEcto = R * (2 * Math.atan2(Math.sqrt(aEcto), Math.sqrt(1 - aEcto)));

            if (distanceEcto <= this.CAPTURE_RADIUS) {
                this.objectToPlace = 'ecto1';
                this.distanceInfo.innerText = "ECTO-1 PRÓXIMO! OLHE AO REDOR!";
                this.distanceInfo.style.color = "#00aaff";
                isNearObject = true;
            }
        }

        if (!isNearObject) {
            this.objectToPlace = null;
            this.activeGhostEntity = null;
        }
    },

    startCapture: function () {
        if (this.isCapturing || !this.placedObjects.ghost || this.inventory.length >= this.INVENTORY_LIMIT) return;
        this.isCapturing = true;
        this.protonBeamSound.play();
        this.protonPackProgressBar.style.display = 'block';
        let startTime = Date.now();

        const duration = this.ghostData.captureDuration;
        this.progressInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            this.protonPackProgressFill.style.height = `${progress * 100}%`;
        }, 100);

        this.captureTimer = setTimeout(() => {
            this.ghostCaptured();
        }, duration);
    },

    cancelCapture: function () {
        if (!this.isCapturing) return;
        this.isCapturing = false;
        this.protonBeamSound.pause();
        this.protonBeamSound.currentTime = 0;
        clearTimeout(this.captureTimer);
        clearInterval(this.progressInterval);
        this.protonPackProgressBar.style.display = 'none';
        this.protonPackProgressFill.style.height = '0%';
    },

    ghostCaptured: function () {
        this.cancelCapture();
        this.ghostCaptureSound.play(); // Som de captura bem-sucedida
        if (this.activeGhostEntity) {
            this.activeGhostEntity.setAttribute('visible', false);
        }
        this.placedObjects.ghost = false;
        this.objectToPlace = null;

        this.inventory.push({ id: Date.now(), type: this.ghostData.type, points: this.ghostData.points });
        this.userStats.points += this.ghostData.points;
        this.userStats.captures += 1;
        this.updateInventoryUI();

        if (this.inventory.length === this.INVENTORY_LIMIT) {
            this.inventoryFullSound.play(); // Som de inventário cheio
        }

        if (this.userStats.captures >= this.ECTO1_UNLOCK_COUNT && !this.userStats.ecto1Unlocked) {
            this.userStats.ecto1Unlocked = true;
            this.showEcto1OnMap();
            alert("Você ouve um barulho de motor familiar... Algo especial apareceu no mapa!");
        }

        const userRef = ref(this.database, 'users/' + this.currentUser.uid);
        update(userRef, { points: this.userStats.points, captures: this.userStats.captures, inventory: this.inventory, ecto1Unlocked: this.userStats.ecto1Unlocked });

        alert(`Fantasma capturado! Você agora tem ${this.userStats.points} pontos.`);
        this.generateGhost();
    },

    setupHitTest: async function () {
        const session = this.el.sceneEl.renderer.xr.getSession();
        const referenceSpace = await session.requestReferenceSpace('viewer');
        this.hitTestSource = await session.requestHitTestSource({ space: referenceSpace });
    },

    tick: function (time, timeDelta) {
        if (!this.gameInitialized || !this.hitTestSource) return;

        const frame = this.el.sceneEl.renderer.xr.getFrame();
        if (!frame) return;

        const hitTestResults = frame.getHitTestResults(this.hitTestSource);

        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(this.el.sceneEl.renderer.xr.getReferenceSpace());
            this.reticle.setAttribute('visible', true);
            this.reticle.object3D.matrix.fromArray(pose.transform.matrix);
            this.reticle.object3D.matrix.decompose(this.reticle.object3D.position, this.reticle.object3D.quaternion, this.reticle.object3D.scale);
            
            // Posicionamento automático
            if (this.objectToPlace && !this.placedObjects[this.objectToPlace]) {
                this.placeObject();
            }
        } else {
            this.reticle.setAttribute('visible', false);
        }
    },

    placeObject: function () {
        if (!this.objectToPlace || this.placedObjects[this.objectToPlace] || !this.reticle.getAttribute('visible')) return;

        let entityToPlace;
        if (this.objectToPlace === 'ghost') {
            entityToPlace = this.activeGhostEntity;
        } else if (this.objectToPlace === 'ecto1') {
            entityToPlace = this.ecto1Entity;
        }

        if (entityToPlace) {
            const pos = this.reticle.object3D.position;
            entityToPlace.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
            entityToPlace.setAttribute('visible', 'true');
            entityToPlace.setAttribute('scale', '0.5 0.5 0.5');
            this.placedObjects[this.objectToPlace] = true;
            this.reticle.setAttribute('visible', 'false');
        }
    }
});