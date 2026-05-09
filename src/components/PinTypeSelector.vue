<template>
  <div class="pin-type-overlay">
    <div class="type-selector-box text-center">
      <h3 class="soapstone-title mb-4">Choose Message Type</h3>
      
      <div class="d-flex justify-content-around gap-4">
        <div class="type-option" @click="emit('select', 'text')">
          <div class="icon-circle"><i class="bi bi-chat-left-text"></i></div>
          <span>TEXT</span>
        </div>

        <div class="type-option" @click="emit('select', 'image')">
          <div class="icon-circle"><i class="bi bi-camera"></i></div>
          <span>IMAGE</span>
        </div>

        <div class="type-option" @click="emit('select', 'voice')">
          <div class="icon-circle"><i class="bi bi-mic"></i></div>
          <span>VOICE</span>
        </div>
      </div>

      <button @click="emit('cancel')" class="btn btn-outline-light mt-5 btn-sm">
        CLOSE MENU
      </button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['select', 'cancel']);
</script>

<style scoped>
.pin-type-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
}

.type-selector-box {
  background: #1a110a; /* Soulslike dark brown */
  padding: 3rem;
  border: 1px solid var(--app-orange);
  border-radius: 4px;
  width: 90%;
  max-width: 480px;
}

.type-option {
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-option:hover {
  transform: translateY(-5px);
  color: var(--app-orange);
}

.icon-circle {
  width: 75px;
  height: 75px;
  background: var(--app-orange);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.2rem;
  color: #000;
  margin-bottom: 12px;
  box-shadow: 0 0 20px rgba(255, 140, 0, 0.3);
}

.type-option span {
  font-family: 'Junicode', serif;
  font-weight: bold;
  letter-spacing: 2px;
  font-size: 0.75rem;
}
</style>