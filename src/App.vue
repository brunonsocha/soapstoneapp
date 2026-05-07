<template>
  <div class="app-container">
    <Transition name="fade" mode="out-in">
      <div v-if="!user" key="login" class="login-wrapper text-center">
        <h1 class="soapstone-title">Orange Soapstone</h1>
        <p class="subtitle">Brunon & Filip</p>
        <div class="auth-box shadow">
          <div class="mb-4">
            <input v-model="email" type="email" class="form-control form-control-custom" placeholder="Email">
            <input v-model="password" type="password" class="form-control form-control-custom" placeholder="Password">
          </div>
          <div class="d-grid gap-2">
            <div class="d-flex gap-2">
              <button @click="emailLogin" class="btn btn-orange py-2 flex-grow-1">ENTER</button>
              <button @click="emailRegister" class="btn btn-orange py-2 flex-grow-1">REGISTER</button>
            </div>
  
              <button @click="googleLogin" class="btn btn-google py-2">
                <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" width="18" class="me-2">
                Sign in with Google
              </button>
            </div>
          <p v-if="error" class="error-msg mt-3">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="isLoading" key="loading" class="text-center">
        <h2 class="soapstone-title">Loading...</h2>
      </div>

      <div v-else-if="!nicknameSet" key="setup" class="setup-nick text-center p-4">
        <h1 class="soapstone-title">Choose your name</h1>
        <p class="subtitle">How do you want to be known?</p>
        <div class="auth-box shadow mx-auto">
          <input v-model="tempNickname" type="text" class="form-control form-control-custom mb-3" placeholder="Enter Nickname...">
          <button @click="saveNickname" class="btn btn-orange w-100">CONFIRM</button>
          <p v-if="nickError" class="error-msg mt-2">{{ nickError }}</p>
        </div>
      </div>
      <div v-else key="app" class="content-wrapper text-center p-4">
        <h2 class="soapstone-title">Welcome!</h2>
        <div class="user-info my-4">
          <p class="mb-1">Greetings, <strong class="text-orange">{{ nickname }}</strong></p>
          <small class="text-muted">{{ user.email }}</small>
        </div>
        
        <div class="map-placeholder border border-warning rounded p-5 mb-4">
          TODO: IMPLEMENT THE MAP HERE
        </div>

        <button @click="logout" class="btn btn-outline-danger px-4 btn-sm">Leave</button>
      </div>

    </Transition>
  </div>
</template>
