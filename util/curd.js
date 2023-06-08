const firebase = require("firebase");
require("firebase/storage");
require("firebase/firestore");
require("firebase/auth");

const AddDataPhantan = async (value, columns, config) => {
  let isConnected = false;
  let db;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    db = firebase.firestore();
    await db.enableNetwork();
    isConnected = true;

    if (Array.isArray(value) && value.length > 0) {
      const batch = db.batch();

      value.forEach((doc) => {
        const docRef = db.collection(columns).doc(); //.doc(doc.id).set(doc)
        batch.set(docRef, doc);
      }); 

      await batch.commit();
      console.log("Data added to Firestore successfully");
    } else {
      console.log("Invalid data format");
    }
  } catch (error) {
    console.error("Error adding data to Firestore:", error);
    throw error;
  } finally {
    if (isConnected) {
      await db.disableNetwork();
    }
  }
};

module.exports = AddDataPhantan;
