const { db } = require("../config/firebaseConnect");
const firebase = require("firebase");
const AddDataPhantan = async (dulieu, collection) => {
  if (Array.isArray(dulieu)) {
    await dulieu.forEach(async (doc) => {
      await db.collection(collection).doc(doc.id).set(doc);
    });
  } else {
    console.warn("error in firebase");
  }
};

module.exports = AddDataPhantan;
//
