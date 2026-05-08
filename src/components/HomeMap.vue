<template>
  <section class="map-shell">
    <div ref="mapEl" class="map-root"></div>

    <div class="map-toolbar">
      <button @click="centerOnUser">Locate</button>
      <button @click="createPinHere">Place pin</button>
      <button :disabled="!canShareSelectedPin" @click="shareSelectedPin">
        Share
      </button>
    </div>

    <p v-if="statusMessage" class="map-status">{{ statusMessage }}</p>
  </section>
</template>

<script setup>
import { useLeafletMap } from "../composables/useLeafletMap";

const props = defineProps({
  user: { type: Object, required: true },
});

const {
  mapEl,
  statusMessage,
  canShareSelectedPin,
  centerOnUser,
  createPinHere,
  shareSelectedPin,
} = useLeafletMap({ user: props.user, rangeMeters: 500 });
</script>

<style scoped>
.map-shell {
  position: relative;
  width: 100%;
}

.map-root {
  width: 100%;
  min-height: 420px;
  height: 70vh;
}

.map-toolbar {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 500;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.map-toolbar button:disabled {
  opacity: 0.45;
}

.map-status {
  margin-top: 12px;
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
  background: #ff8c00;
  border: 2px solid #1a110a;
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
