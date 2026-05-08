import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "./firebase";

export const checkAdmin =
  async () => {

    const user =
      auth.currentUser;

    if (!user) {

      return false;
    }

    const docRef = doc(
      db,
      "users",
      "admin"
    );

    const snap =
      await getDoc(docRef);

    if (!snap.exists()) {

      return false;
    }

    const data = snap.data();

    return (
      data.email === user.email &&
      data.role === "admin"
    );
  };