import { ref, computed, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  GeoPoint,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

const RECEIVED_PIN_IDS_KEY = "soapstone.receivedPinIds";

const mapPinDoc = (snapshot) => {
  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    id: snapshot.id,
    ownerUid: data.ownerUid,
    createdAt: data.createdAt,
    lat: data.location.latitude,
    lng: data.location.longitude,
    type: data.type || "text",
    content: data.content || "",
  };
};

export const useLeafletMap = ({ user, rangeMeters = 500 } = {}) => {
  const mapEl = ref(null);
  const userCoords = ref(null);
  const selectedPin = ref(null);
  const statusMessage = ref("");
  const pins = ref([]);

  let map;
  let userMarker;
  let userRangeCircle;
  const pinMarkers = new Map();

  const canShareSelectedPin = computed(() => Boolean(selectedPin.value));

  const userIcon = L.divIcon({
    className: "soapstone-user-dot",
    html: "<span></span>",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const pinIcon = L.divIcon({
    className: "soapstone-pin",
    html: "",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  const getReceivedPinIds = () => {
    try {
      return JSON.parse(localStorage.getItem(RECEIVED_PIN_IDS_KEY) ?? "[]");
    } catch {
      return [];
    }
  };

  const rememberReceivedPinId = (pinId) => {
    const ids = new Set(getReceivedPinIds());
    ids.add(pinId);
    localStorage.setItem(RECEIVED_PIN_IDS_KEY, JSON.stringify([...ids]));
  };

  const createEmptyPin = async ({ ownerUid, lat, lng }) => {
    const docRef = await addDoc(collection(db, "pins"), {
      createdAt: serverTimestamp(),
      location: new GeoPoint(lat, lng),
      ownerUid,
    });

    return {
      id: docRef.id,
      ownerUid,
      lat,
      lng,
      photoUrl: null,
    };
  };

  const getPinById = async (pinId) => {
    const snapshot = await getDoc(doc(db, "pins", pinId));
    return mapPinDoc(snapshot);
  };

  const getPinsByOwner = async (ownerUid) => {
    const pinsQuery = query(
      collection(db, "pins"),
      where("ownerUid", "==", ownerUid),
    );
    const snapshot = await getDocs(pinsQuery);

    return snapshot.docs.map(mapPinDoc).filter(Boolean);
  };

  const getDistanceToPin = (pin) => {
    if (!map || !userCoords.value) return null;

    return map.distance(
      [userCoords.value.lat, userCoords.value.lng],
      [pin.lat, pin.lng],
    );
  };

  const isPinInRange = (pin) => {
    const distance = getDistanceToPin(pin);
    return distance !== null && distance <= rangeMeters;
  };

  const updateUserLocation = (event) => {
    const { lat, lng } = event.latlng;
    userCoords.value = { lat, lng, accuracy: event.accuracy };

    if (!userMarker) {
      userMarker = L.marker([lat, lng], {
        icon: userIcon,
        interactive: false,
      }).addTo(map);
    } else {
      userMarker.setLatLng([lat, lng]);
    }

    if (!userRangeCircle) {
      userRangeCircle = L.circle([lat, lng], {
        radius: rangeMeters,
        color: "#ffcc00",
        weight: 2,
        fillColor: "#ff8c00",
        fillOpacity: 0.18,
      }).addTo(map);
    } else {
      userRangeCircle.setLatLng([lat, lng]);
      userRangeCircle.setRadius(rangeMeters);
    }
  };

  const selectPin = (pin, marker) => {
    selectedPin.value = pin;

    if (!isPinInRange(pin)) {
      statusMessage.value = "Podejdź bliżej. Pinezka jest poza Twoim zasięgiem";
      marker.closePopup();
      return;
    }

    statusMessage.value = "";
    let popupHtml = "";
    if (pin.type === "image") {
      popupHtml = `<div class="photo-popup"><img src="${pin.content}" alt="Photo"></div>`;
    } else if (pin.type === "voice") {
      popupHtml = `<div class="audio-popup"><audio controls src="${pin.content}"></audio></div>`;
    } else {
      popupHtml = `<div class="text-popup"><p>${pin.content}</p></div>`;
    }
    marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 600 }).openPopup();
    
  };

  const addPin = (pin) => {
    if (!map || pinMarkers.has(pin.id)) return;

    const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon }).addTo(map);
    marker.on("click", () => selectPin(pin, marker));
    pinMarkers.set(pin.id, marker);
  };

  const setPins = (nextPins) => {
    pins.value = nextPins;
    nextPins.forEach(addPin);
  };

  const loadPins = async () => {
    if (!user?.uid) return;

    const ownedPins = await getPinsByOwner(user.uid);

    const sharedPinId = new URLSearchParams(window.location.search).get("pin");
    const receivedIds = new Set(getReceivedPinIds());

    if (sharedPinId) {
      receivedIds.add(sharedPinId);
      rememberReceivedPinId(sharedPinId);
    }

    const receivedPins = await Promise.all([...receivedIds].map(getPinById));

    setPins([...ownedPins, ...receivedPins.filter(Boolean)]);
  };

  const centerOnUser = () => {
    if (map && userCoords.value) {
      map.setView([userCoords.value.lat, userCoords.value.lng], 16);
    }
  };

  const savePinToFirestore = async (type, content) => {
    const docRef = await addDoc(collection(db, "pins"), {
      createdAt: serverTimestamp(),
      location: new GeoPoint(userCoords.value.lat, userCoords.value.lng),
      ownerUid: user.value.uid, 
      type: type,
      content: content
    });

    const newPin = {
      id: docRef.id,
      ownerUid: user.value.uid,
      lat: userCoords.value.lat,
      lng: userCoords.value.lng,
      type,
      content
    };

    pins.value.push(newPin);
    addPin(newPin);
    selectedPin.value = newPin;
    centerOnUser();
  };

  const createPinHere = async (type) => {
    if (!userCoords.value) {
      statusMessage.value = "Najpierw pozwól aplikacji pobrać lokalizację";
      return;
    }

    if (type === "text") {
      const msg = prompt("Wpisz swoją wiadomość:");
      if (msg) await savePinToFirestore("text", msg);
    } 
  
    else if (type === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        statusMessage.value = "Przesyłanie obrazu...";
        const fileRef = sRef(storage, `pins/${user.value.uid}/${Date.now()}_${file.name}`);
      
        try {
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          await savePinToFirestore("image", url);
          statusMessage.value = "Obraz zapisany!";
        } catch (err) {
          statusMessage.value = "Błąd przesyłania.";
        }
      };
      input.click();
    } 
  
    else if (type === "voice") {
      statusMessage.value = "Nagrywanie głosowe będzie dostępne wkrótce.";
    }
  };

  const shareSelectedPin = async () => {
    if (!selectedPin.value) return;

    const url = `${window.location.origin}${window.location.pathname}?pin=${selectedPin.value.id}`;

    if (navigator.share) {
      await navigator.share({
        title: "Soapstone pin",
        text: "Find my pin",
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      statusMessage.value = "Link skopiowany.";
    }
  };

  onMounted(async () => {
    map = L.map(mapEl.value).setView([50.0647, 19.945], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("locationfound", updateUserLocation);
    map.on("locationerror", () => {
      statusMessage.value = "Nie udało się pobrać lokalizacji";
    });

    map.locate({
      watch: true,
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
    });

    await loadPins();
  });

  onUnmounted(() => {
    if (!map) return;

    map.stopLocate();
    map.remove();
    map = null;
  });

  return {
    mapEl,
    userCoords,
    selectedPin,
    statusMessage,
    pins,
    canShareSelectedPin,
    centerOnUser,
    createPinHere,
    shareSelectedPin,
    loadPins,
  };
};
