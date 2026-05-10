<template>
  <div class="available-overlay" @click.self="emit('close')">
    <div class="available-panel">
      <div class="available-header">
        <h3 class="available-title">Nearby messages</h3>
        <button type="button" class="available-close" @click="emit('close')">
          Close
        </button>
      </div>

      <p v-if="!props.pins.length" class="available-empty">
        No messages are currently within range.
      </p>

      <div v-else class="available-list">
        <button
          v-for="pin in props.pins"
          :key="pin.id"
          type="button"
          class="available-item"
          @click="emit('select', pin)"
        >
          <span class="available-type">{{ getTypeLabel(pin.type) }}</span>
          <span class="available-preview">{{ getPreview(pin) }}</span>
          <span class="available-meta">
            {{ pin.distanceLabel }}
            <template v-if="formatCreatedAt(pin.createdAt)">
              · {{ formatCreatedAt(pin.createdAt) }}
            </template>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  pins: { type: Array, required: true },
});

const emit = defineEmits(["close", "select"]);

const getTypeLabel = (type) => {
  if (type === "image") return "Image";
  if (type === "voice") return "Voice";
  return "Text";
};

const getPreview = (pin) => {
  if (pin.type === "image") return "Photo message";
  if (pin.type === "voice") return "Voice recording";
  return pin.content || "Text message";
};

const formatCreatedAt = (value) => {
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
};
</script>

<style scoped>
.available-overlay {
  position: absolute;
  inset: 0;
  z-index: 2900;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  background: var(--app-overlay);
}

.available-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding: 20px;
  background: var(--app-brown);
  border: 1px solid var(--app-panel-border);
  overflow: auto;
}

.available-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.available-title {
  margin: 0;
  color: var(--app-orange);
}

.available-close {
  padding: 8px 12px;
  color: var(--app-text);
  background: transparent;
  border: 1px solid var(--app-panel-border);
  border-radius: 4px;
}

.available-empty {
  margin: 0;
}

.available-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.available-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 14px;
  text-align: left;
  color: var(--app-text);
  background: var(--app-panel-fill);
  border: 1px solid var(--app-panel-border-faint);
  border-radius: 8px;
}

.available-item:hover,
.available-item:focus {
  color: var(--app-text);
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--app-panel-border);
}

.available-type {
  color: var(--app-orange);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.available-preview {
  white-space: pre-wrap;
  word-break: break-word;
}

.available-meta {
  color: var(--app-text-muted);
  font-size: 0.82rem;
}

@media (max-width: 720px) {
  .available-overlay {
    position: fixed;
    inset: 0;
  }

  .available-panel {
    padding: 16px;
  }

  .available-header {
    align-items: stretch;
    flex-direction: column;
  }

  .available-close {
    width: 100%;
  }
}
</style>
