const { db } = require("../config/firebaseConnect");
const firebase = require("firebase");
const AddDataPhantan = async (dulieu, collection, dconnect) => {
  try {
    if (Array.isArray(dulieu) && dulieu.length > 0) {
      await Promise.all(
        dulieu.map((doc) =>
          dconnect.collection(collection).doc(doc.id).set(doc)
        )
      );
      console.log("success");
    } else {
      console.log("Invalid data format");
    }
  } catch (error) {
    console.log(error);
    console.log({ error: error.message });
  }
  console.log("success endpoint");
};

module.exports = AddDataPhantan;
