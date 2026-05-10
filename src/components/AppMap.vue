<template>
  <section class="map-shell">
    <div ref="mapEl" class="map-root"></div>

    <Transition name="fade">
      <PinMessageViewer
        v-if="selectedPin"
        :pin="selectedPin"
        @close="closeSelectedPin"
        @report="reportSelectedPin"
      />
    </Transition>

    <Transition name="fade">
      <AvailablePinsList
        v-if="isViewingReadablePins"
        :pins="readablePins"
        @close="isViewingReadablePins = false"
        @select="handleReadablePinSelection"
      />
    </Transition>

    <Transition name="fade">
      <VoiceRecorder
        v-if="isRecordingVoice"
        @save="handleVoiceSave"
        @cancel="closeVoiceRecorder"
      />
    </Transition>

    <Transition name="fade">
      <PinTypeSelector
        v-if="isSelectingType"
        @select="handleTypeSelection"
        @cancel="isSelectingType = false"
      />
    </Transition>

    <div class="map-toolbar">
      <button @click="centerOnUser">Locate</button>

      <button @click="isSelectingType = true">Place pin</button>

      <button :disabled="!canShareSelectedPin" @click="shareSelectedPin">
        Share
      </button>

      <button @click="isViewingReadablePins = true">Nearby</button>
    </div>

    <p v-if="statusMessage" class="map-status">{{ statusMessage }}</p>
  </section>
</template>

<script setup>
import { ref, toRef } from "vue";
import AvailablePinsList from "./AvailablePinsList.vue";
import PinTypeSelector from "./PinTypeSelector.vue";
import PinMessageViewer from "./PinMessageViewer.vue";
import VoiceRecorder from "./VoiceRecorder.vue";
import { useLeafletMap } from "../composables/useLeafletMap";

const props = defineProps({
  user: { type: Object, required: true },
});
const user = toRef(props, "user");
const isSelectingType = ref(false);
const isViewingReadablePins = ref(false);

const {
  mapEl,
  selectedPin,
  statusMessage,
  readablePins,
  canShareSelectedPin,
  centerOnUser,
  closeSelectedPin,
  createPinHere,
  isRecordingVoice,
  openVoiceRecorder,
  closeVoiceRecorder,
  openReadablePin,
  shareSelectedPin,
  saveVoicePin,
  reportSelectedPin,
} = useLeafletMap({ user, rangeMeters: 500 });

const handleTypeSelection = (type) => {
  isSelectingType.value = false;

  if (type === "voice") {
    openVoiceRecorder();
    return;
  }

  createPinHere(type);
};

const handleVoiceSave = async (blob) => {
  await saveVoicePin(blob);
};

const handleReadablePinSelection = (pin) => {
  isViewingReadablePins.value = false;
  openReadablePin(pin);
};
</script>

<style scoped>
.map-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-root {
  width: 100%;
  min-height: 420px;
  height: 100%;
  border: 1px solid var(--app-orange);
  border-radius: 4px;
}

.map-toolbar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 25px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  padding: 8px 16px;
  border: 1px solid var(--app-orange);
  border-radius: 2px;
}

.map-toolbar button:disabled {
  opacity: 0.45;
}

.map-status {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  max-width: min(720px, calc(100% - 32px));
  margin: 0;
  padding: 8px 14px;
  color: var(--app-white);
  background: rgba(0, 0, 0, 0.88);
  border: 1px solid var(--app-orange);
  border-radius: 6px;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.3;
}

:global(.soapstone-user-dot span) {
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #3388ff;
  border: 4px solid white;
  box-shadow: 0 0 0 8px rgba(51, 136, 255, 0.25);
}

:global(.soapstone-pin) {
  background: var(--app-orange);
  border: 2px solid var(--app-brown);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

:global(.photo-popup img) {
  display: block;
  max-width: 320px;
  width: 100%;
  height: auto;
}
</style>
