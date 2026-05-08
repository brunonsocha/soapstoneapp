<template>
  <div key="app" class="content-wrapper text-center p-4">
    <h2 class="soapstone-title">Welcome!</h2>
    <div class="user-info my-4">
      <p class="mb-1">
        Greetings, <strong class="text-orange">{{ props.nickname }}</strong>
      </p>
      <small class="text-muted">{{ props.user.email }}</small>
    </div>

    <!-- <div class="map-placeholder border border-warning rounded p-5 mb-4 w-100">
      TODO: IMPLEMENT THE MAP HERE
    </div> -->
    <AppMap :user="props.user" />

    <button @click="emit('logout')" class="btn btn-outline-danger px-4 btn-sm">
      Leave
    </button>
  </div>
</template>

<script setup>
import AppMap from "./HomeMap.vue";

const props = defineProps({
  user: Object,
  nickname: String,
});

const emit = defineEmits(["logout"]);
</script>
