<template>
  <div class="text-composer-overlay" @click.self="emit('cancel')">
    <div class="text-composer-panel">
      <h3 class="text-composer-title">Text Message</h3>

      <textarea v-model="message" class="text-composer-input" rows="6" placeholder="Write your message"></textarea>

      <div class="text-composer-actions">
        <button type="button" class="btn btn-orange" :disabled="!trimmedMessage" @click="emit('save', trimmedMessage)">
          Save
        </button>

        <button type="button" class="text-composer-secondary-button" @click="emit('cancel')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const emit = defineEmits(["save", "cancel"]);

const message = ref("");
const trimmedMessage = computed(() => message.value.trim());
</script>

<style scoped>
.text-composer-overlay {
  position: absolute;
  inset: 0;
  z-index: 3100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--app-overlay-strong);
}

.text-composer-panel {
  width: min(100%, 420px);
  padding: 20px;
  background: var(--app-dark-box);
  border: 1px solid var(--app-panel-border);
  border-radius: 8px;
}

.text-composer-title {
  margin: 0 0 12px;
  color: var(--app-orange);
  font-size: 1.1rem;
}

.text-composer-input {
  width: 100%;
  min-height: 140px;
  padding: 12px;
  color: var(--app-white);
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--app-panel-border-soft);
  border-radius: 6px;
  resize: vertical;
}

.text-composer-input:focus {
  outline: none;
  border-color: var(--app-orange);
}

.text-composer-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.text-composer-actions button {
  flex: 1;
}

.btn-orange {
  color: var(--app-brown);
  background: var(--app-orange);
  border: 1px solid var(--app-orange);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.btn-orange:hover,
.btn-orange:focus {
  color: var(--app-brown);
  background: var(--app-yellow);
  border-color: var(--app-yellow);
}

.text-composer-secondary-button {
  flex: 1;
  padding: 0.75rem 1rem;
  color: var(--app-text);
  background: transparent;
  border: 1px solid var(--app-panel-border);
  border-radius: 6px;
}

.text-composer-secondary-button:hover,
.text-composer-secondary-button:focus {
  background: rgba(255, 255, 255, 0.06);
}

@media (max-width: 720px) {
  .text-composer-overlay {
    position: fixed;
  }
}
</style>
