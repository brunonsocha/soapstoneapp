import { ref, onMounted } from 'vue'
import { auth, googleProvider, db } from './firebase'
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore' 

const user = ref(null)
const email = ref('')
const password = ref('')
const error = ref('')

const nickname = ref('')
const tempNickname = ref('')
const nicknameSet = ref(false)
const nickError = ref('')
const isLoading = ref(true) 

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser
    if (currentUser) {
      await fetchUserNickname(currentUser.uid)
    } else {
      nicknameSet.value = false
      nickname.value = ''
    }
    isLoading.value = false 
  })
})

const emailRegister = async () => {
  if (password.value.length < 6) {
    error.value = "Use a longer password."
    return
  }
  
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value)
  } catch (err) {
    console.error(err.code)
    if (err.code === 'auth/email-already-in-use') {
      error.value = "That email is already taken."
    } else {
      error.value = "Registration failed."
    }
  }
}

const fetchUserNickname = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid))
    if (userDoc.exists()) {
      nickname.value = userDoc.data().nickname
      nicknameSet.value = true
    } else {
      nicknameSet.value = false
    }
  } catch (err) {
    console.error("Firestore Error:", err)
    error.value = "Access denied"
  }
}

const saveNickname = async () => {
  if (tempNickname.value.length < 3) {
    nickError.value = "Name must be at least 3 characters."
    return
  }
  
  try {
    await setDoc(doc(db, "users", user.value.uid), {
      nickname: tempNickname.value,
      email: user.value.email,
      role: 'traveler',
      joinedAt: new Date()
    })
    
    nickname.value = tempNickname.value
    nicknameSet.value = true
  } catch (err) {
    nickError.value = "Permission denied"
    console.log(err)
  }
}

const googleLogin = async () => {
  try {
    await signInWithPopup(auth, googleProvider)
  } catch (err) {
    error.value = "Google Login Error"
  }
}

const emailLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
  } catch (err) {
    error.value = "Invalid credentials"
  }
}

const logout = () => {
  signOut(auth)
  nicknameSet.value = false
}