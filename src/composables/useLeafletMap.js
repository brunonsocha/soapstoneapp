import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  GeoPoint,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

const mapPinDoc = (snapshot) => {
  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    id: snapshot.id,
    ownerUid: data.ownerUid,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    lat: data.location.latitude,
    lng: data.location.longitude,
    type: data.type || "text",
    content: data.content || "",
  };
};

export const useLeafletMap = ({ user, rangeMeters = 500 } = {}) => {
  const PIN_POLL_INTERVAL_MS = 60 * 1000;

  const mapEl = ref(null);
  const userCoords = ref(null);
  const selectedPin = ref(null);
  const statusMessage = ref("");
  const pins = ref([]);
  const isRecordingVoice = ref(false);

  let map;
  let userMarker;
  let userRangeCircle;
  let statusTimeout;
  let pinPollingInterval = null;
  let isLoadingPins = false;

  const pinMarkers = new Map();

  const canShareSelectedPin = computed(() => Boolean(selectedPin.value));
  const readablePins = computed(() =>
    pins.value
      .map((pin) => {
        const distance = getDistanceToPin(pin);
        return {
          ...pin,
          distance: distance ?? Infinity,
          distanceLabel:
            distance === null
              ? ""
              : distance < 1000
                ? `${Math.round(distance)} m`
                : `${(distance / 1000).toFixed(1)} km`,
        };
      })
      .filter((pin) => pin.distance <= rangeMeters)
      .sort((left, right) => left.distance - right.distance),
  );

  watch(statusMessage, (message) => {
    if (!message) return;

    clearTimeout(statusTimeout);

    statusTimeout = setTimeout(() => {
      statusMessage.value = "";
    }, 4000);
  });

  const userIcon = L.divIcon({
    className: "mailstone-user-dot",
    html: "<span></span>",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const pinIcon = L.divIcon({
    className: "mailstone-pin",
    html: "",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  const getAllPins = async () => {
    const pinsQuery = await getDocs(collection(db, "pins"));
    return pinsQuery.docs.map(mapPinDoc).filter(Boolean);
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

  const selectPin = (pin) => {
    if (!isPinInRange(pin)) {
      selectedPin.value = null;
      statusMessage.value = "Come closer! Pin is out of your range";
      return;
    }

    selectedPin.value = pin;
    statusMessage.value = "";
  };

  const addPin = (pin) => {
    if (!map || pinMarkers.has(pin.id)) return;

    const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon }).addTo(map);
    marker.on("click", () => selectPin(pin));
    pinMarkers.set(pin.id, marker);
  };

  const setPins = (nextPins) => {
    pinMarkers.forEach((marker) => marker.remove());
    pinMarkers.clear();
    pins.value = nextPins;
    nextPins.forEach(addPin);

    if (!selectedPin.value) return;

    const refreshedSelectedPin = nextPins.find(
      (pin) => pin.id === selectedPin.value.id,
    );

    selectedPin.value = refreshedSelectedPin ?? null;
  };

  const loadPins = async () => {
    if (!user.value?.uid || isLoadingPins) return;

    isLoadingPins = true;

    try {
      const allPins = await getAllPins();
      setPins(allPins);
    } catch (error) {
      console.error(error);
      statusMessage.value = "Couldn't refresh pins";
    } finally {
      isLoadingPins = false;
    }
  };

  const startPinPolling = () => {
    if (pinPollingInterval) return;

    pinPollingInterval = window.setInterval(() => {
      void loadPins();
    }, PIN_POLL_INTERVAL_MS);
  };

  const stopPinPolling = () => {
    if (!pinPollingInterval) return;

    window.clearInterval(pinPollingInterval);
    pinPollingInterval = null;
  };

  watch(
    () => user.value?.uid,
    async (uid) => {
      if (!uid) {
        stopPinPolling();
        setPins([]);
        selectedPin.value = null;
        statusMessage.value = "";
        return;
      }

      await loadPins();
      startPinPolling();
    },
    { immediate: true },
  );

  const centerOnUser = () => {
    if (map && userCoords.value) {
      map.setView([userCoords.value.lat, userCoords.value.lng], 16);
    }
  };

  const closeSelectedPin = () => {
    selectedPin.value = null;
  };

  const openReadablePin = (pin) => {
    selectPin(pin);
  };

  const openVoiceRecorder = () => {
    if (!userCoords.value) {
      statusMessage.value = "First, allow the app to fetch your location";
      return;
    }

    if (!user.value?.uid) {
      statusMessage.value = "Log in again";
      return;
    }

    statusMessage.value = "";
    isRecordingVoice.value = true;
  };

  const closeVoiceRecorder = () => {
    isRecordingVoice.value = false;
  };

  const PIN_LIFETIME_MS = 24 * 60 * 60 * 1000;

  const savePinToFirestore = async (type, content) => {
    const createdAt = new Date();

    const docRef = await addDoc(collection(db, "pins"), {
      createdAt: serverTimestamp(),
      location: new GeoPoint(userCoords.value.lat, userCoords.value.lng),
      ownerUid: user.value.uid,
      type: type,
      content: content,
    });

    const snapshot = await getDoc(docRef);
    const serverCreatedAt = snapshot.data().createdAt;

    const expiresAt = Timestamp.fromMillis(
      serverCreatedAt.toMillis() + PIN_LIFETIME_MS,
    );

    await updateDoc(docRef, {
      expiresAt,
    });

    const newPin = {
      id: docRef.id,
      ownerUid: user.value.uid,
      createdAt,
      expiresAt,
      lat: userCoords.value.lat,
      lng: userCoords.value.lng,
      type,
      content,
    };

    pins.value.push(newPin);
    addPin(newPin);
    selectedPin.value = newPin;
    centerOnUser();
  };

  const createPinHere = async (type) => {
    if (!userCoords.value) {
      statusMessage.value = "First, allow the app to fetch your location";
      return;
    }

    if (!user.value?.uid) {
      statusMessage.value = "Log in again";
      return;
    }

    if (type === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        statusMessage.value = "Uploading image...";
        const fileRef = sRef(
          storage,
          `pins/${user.value.uid}/${Date.now()}_${file.name}`,
        );

        try {
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          await savePinToFirestore("image", url);
          statusMessage.value = "Image saved!";
        } catch (err) {
          statusMessage.value = "Error uploading image";
        }
      };
      input.click();
    }
  };

  const saveTextPin = async (message) => {
    const trimmedMessage = message?.trim();

    if (!trimmedMessage) return;

    if (!userCoords.value) {
      statusMessage.value = "First, allow the app to fetch your location";
      return;
    }

    if (!user.value?.uid) {
      statusMessage.value = "Log in again";
      return;
    }

    await savePinToFirestore("text", trimmedMessage);
  };

  const saveVoicePin = async (audioBlob) => {
    if (!audioBlob) return;

    if (!userCoords.value || !user.value?.uid) {
      statusMessage.value = "Log in again";
      isRecordingVoice.value = false;
      return;
    }

    statusMessage.value = "Uploading recording...";

    const extension = audioBlob.type.includes("ogg") ? "ogg" : "webm";
    const fileRef = sRef(
      storage,
      `pins/${user.value.uid}/voice/${Date.now()}.${extension}`,
    );

    try {
      await uploadBytes(fileRef, audioBlob, {
        contentType: audioBlob.type || "audio/webm",
      });

      const url = await getDownloadURL(fileRef);
      await savePinToFirestore("voice", url);

      statusMessage.value = "Recording saved!";
      isRecordingVoice.value = false;
    } catch (error) {
      statusMessage.value = "Error uploading recording";
    }
  };

  const shareSelectedPin = async () => {
    if (!selectedPin.value) return;

    const { id, lat, lng } = selectedPin.value;
    const appUrl = `${window.location.origin}`;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const shareText = [
      "I left you a message in MailStone!",
      `Come here: ${mapsUrl}`,
      `And use our app: ${appUrl}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "MailStone pin",
          text: shareText,
          url: mapsUrl,
        });
        statusMessage.value = "Udostępniono";
      } else {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareText);
          window.alert("The text for sharing has been copied to clipboard.");
          statusMessage.value = "Text copied.";
        } else {
          window.prompt("Copy and share this text:", shareText);
        }
      }
    } catch (error) {
      statusMessage.value = "Nothing's been shared.";
    }
  };

  const reportSelectedPin = async (matter) => {
    if (!selectedPin.value) {
      statusMessage.value = "Select a pin first";
      return;
    }

    if (!user.value?.uid) {
      statusMessage.value = "Log in again";
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        createdAt: serverTimestamp(),
        matter,
        pinId: selectedPin.value.id,
        reporterId: user.value.uid,
      });

      statusMessage.value = "Report sent";
      closeSelectedPin();
    } catch (err) {
      console.error(err);
      statusMessage.value = "Could not send report";
    }
  };

  onMounted(async () => {
    map = L.map(mapEl.value).setView([50.0647, 19.945], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("locationfound", updateUserLocation);
    map.on("locationerror", () => {
      statusMessage.value = "Failed to fetch location";
    });

    map.locate({
      watch: true,
      setView: false,
      maxZoom: 16,
      enableHighAccuracy: true,
    });

    await loadPins();
    startPinPolling();
  });

  onUnmounted(() => {
    clearTimeout(statusTimeout);
    stopPinPolling();

    if (!map) return;

    pinMarkers.forEach((marker) => marker.remove());
    pinMarkers.clear();
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
    isRecordingVoice,
    readablePins,
    canShareSelectedPin,
    centerOnUser,
    closeSelectedPin,
    createPinHere,
    openVoiceRecorder,
    closeVoiceRecorder,
    openReadablePin,
    saveTextPin,
    shareSelectedPin,
    saveVoicePin,
    loadPins,
    reportSelectedPin,
  };
};
