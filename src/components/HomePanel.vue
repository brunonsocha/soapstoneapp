<template>
  <div key="app" class="home-screen d-flex flex-column overflow-hidden">
    <header
      class="app-header navbar navbar-dark px-3 flex-shrink-0 position-relative"
    >
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#mainMenu"
      >
        ☰
      </button>

      <h1 class="app-title ms-auto me-5 m-0">MailStone</h1>
    </header>
    <div
      id="mainMenu"
      class="offcanvas offcanvas-start text-bg-dark"
      tabindex="-1"
    >
      <div class="offcanvas-header">
        <h2 id="mainMenuLabel" class="offcanvas-title">MENU</h2>

        <button
          type="button"
          class="btn-close menu-close"
          data-bs-dismiss="offcanvas"
        ></button>
      </div>

      <div class="offcanvas-body logout-button-container">
        <button
          type="button"
          class="btn btn-outline-danger w-100"
          data-bs-dismiss="offcanvas"
          @click="emit('logout')"
        >
          Log Out
        </button>
      </div>
    </div>

    <AppMap :user="props.user" />
  </div>
</template>

<script setup>
import AppMap from "./AppMap.vue";

const props = defineProps({
  user: Object,
  nickname: String,
});

const emit = defineEmits(["logout"]);
</script>

<style scoped>
.home-screen {
  height: 100%;
  width: 100%;
}

.app-header {
  height: 56px;
  background: var(--app-brown);
  border-bottom: 1px solid var(--app-panel-border-soft);
  color: var(--app-white);
  .navbar-toggler {
    border: 1px solid var(--app-white);
    color: var(--app-white);
  }
}

.app-title {
  letter-spacing: 0.2em;
  color: var(--app-white);
  font-size: x-large;
}

.menu-close {
  transform: scale(2.5);
  padding-left: 2rem;
  color: var(--app-white);
  filter: invert(1) grayscale(100%) brightness(200%);
}

.logout-button-container {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
}

.logout-button-container button {
  font-weight: bolder;
  filter: saturate(2.5);
}
</style>
