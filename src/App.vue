<template>
  <div class="app-container">
    <Transition name="fade" mode="out-in">
      <div v-if="isLoading" key="loading" class="app-loading">
        <h2 class="soapstone-title">Loading...</h2>
      </div>

      <LoginPanel
        v-else-if="!user"
        key="login"
        v-model:email="email"
        v-model:password="password"
        :error="error"
        @standard-login="emailLogin"
        @register="emailRegister"
        @google-login="googleLogin"
      />

      <NicknameSetup
        v-else-if="!nicknameSet"
        key="nickname"
        v-model:nickname="tempNickname"
        :error="nickError"
        @save="saveNickname"
      />

      <HomePanel
        v-else
        key="home"
        :user="user"
        :nickname="nickname"
        @logout="logout"
      />
    </Transition>
  </div>
</template>

<script setup>
import LoginPanel from "./components/LoginPanel.vue";
import NicknameSetup from "./components/NicknameSetup.vue";
import HomePanel from "./components/HomePanel.vue";
import { useAuth } from "./composables/useAuth";

const {
  user,
  email,
  password,
  error,
  nickname,
  tempNickname,
  nicknameSet,
  nickError,
  isLoading,
  emailRegister,
  saveNickname,
  googleLogin,
  emailLogin,
  logout,
} = useAuth();
</script>

<style scoped>
.app-loading {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--app-orange);
}

.app-container {
  width: 100%;
  height: 100dvh;
  background: var(--app-dark-box);
}
</style>
