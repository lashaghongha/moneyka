import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_xpYT8Orj74wVBD3rj8oKC9bnMkM8qXY",
  authDomain: "moneyka-7cf63.firebaseapp.com",
  projectId: "moneyka-7cf63",
  storageBucket: "moneyka-7cf63.firebasestorage.app",
  messagingSenderId: "689012333116",
  appId: "1:689012333116:web:fb5c0de63149e83b9e8139",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
