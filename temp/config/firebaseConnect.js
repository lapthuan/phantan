const firebase = require("firebase");
require("firebase/storage");
require("firebase/firestore");
require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyDiB3WHxKnIGK22R7rN1O8NDsyGSg2FXEg",
  authDomain: "phantan-9e83c.firebaseapp.com",
  projectId: "phantan-9e83c",
  storageBucket: "phantan-9e83c.appspot.com",
  messagingSenderId: "654603545032",
  appId: "1:654603545032:web:59c93defa296f3cda2f8fd",
  measurementId: "G-Q0KPQ1LMWB",
  databaseURL: "https://ecommerce-with-react-2ac06.firebaseio.com",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

module.exports = { auth, db, storage };
