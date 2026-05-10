<template>
  <div class="viewer-overlay" @click.self="emit('close')">
    <div class="viewer-panel">
      <div class="viewer-meta">
        <span class="viewer-badge">{{ messageTypeLabel }}</span>
        <span class="viewer-coords">
          {{ props.pin.lat.toFixed(5) }}, {{ props.pin.lng.toFixed(5) }}
        </span>
        <span v-if="formattedCreatedAt" class="viewer-created-at">
          {{ formattedCreatedAt }}
        </span>
        <span v-if="formattedExpiresIn" class="viewer-created-at">
          {{ formattedExpiresIn }}
        </span>
      </div>

      <div class="viewer-content">
        <img
          v-if="props.pin.type === 'image'"
          :src="props.pin.content"
          alt="Pin image"
          class="viewer-image"
        />

        <audio
          v-else-if="props.pin.type === 'voice'"
          :src="props.pin.content"
          controls
          class="viewer-audio"
        ></audio>

        <div v-else class="viewer-text-shell">
          <p class="viewer-text">{{ props.pin.content }}</p>
        </div>
      </div>

      <button class="viewer-close" type="button" @click="reportPin">
        Report
      </button>

      <button class="viewer-close" type="button" @click="emit('close')">
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  pin: { type: Object, required: true },
});

const emit = defineEmits(["close", "report"]);

const reportPin = () => {
  const matter = window.prompt("Report reason:", "offensive language");

  if (!matter?.trim()) {
    return;
  }

  emit("report", matter.trim());
};

const messageTypeLabel = computed(() => {
  if (props.pin.type === "image") return "Image message";
  if (props.pin.type === "voice") return "Voice message";
  return "Text";
});

const formattedCreatedAt = computed(() => {
  const value = props.pin.createdAt;
  if (!value) return "";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
});

const formattedExpiresIn = computed(() => {
  const value = props.pin.expiresAt;
  if (!value) return "";

  const expiresAt = value.toDate();
  const hoursLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / (60 * 60 * 1000)),
  );

  return `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} to expire`;
});
</script>

<style scoped>
.viewer-overlay {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  background: rgba(0, 0, 0, 0.72);
}

.viewer-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding: 20px;
  background: #14100c;
  border: 1px solid rgba(255, 140, 0, 0.55);
  border-radius: 0;
  overflow: auto;
}

.viewer-close {
  align-self: flex-end;
  margin-bottom: 16px;
  padding: 8px 12px;
  color: var(--app-text);
  background: transparent;
  border: 1px solid rgba(255, 140, 0, 0.6);
  border-radius: 4px;
}

.viewer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.viewer-badge,
.viewer-coords,
.viewer-created-at {
  padding: 6px 10px;
  border: 1px solid rgba(255, 140, 0, 0.35);
  border-radius: 999px;
  color: var(--app-text);
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.82rem;
}

.viewer-content {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.viewer-image {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  object-fit: contain;
}

.viewer-audio {
  width: min(640px, 100%);
}

.viewer-text-shell {
  width: 100%;
  padding: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 140, 0, 0.18);
  border-radius: 8px;
}

.viewer-text {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.35rem);
  line-height: 1.6;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 720px) {
  .viewer-overlay {
    position: fixed;
    inset: 0;
  }

  .viewer-panel {
    width: 100%;
    min-height: 100%;
    padding: 16px;
    border-radius: 0;
  }

  .viewer-close {
    width: 100%;
    margin-top: 12px;
    margin-bottom: 0;
  }

  .viewer-meta {
    margin-bottom: 12px;
  }

  .viewer-content {
    min-height: 180px;
  }

  .viewer-image {
    max-height: 48vh;
  }

  .viewer-text-shell {
    padding: 14px;
  }

  .viewer-text {
    font-size: 1rem;
  }
}
</style>
