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

    try {

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap =
        await getDoc(userRef);

      if (
        !userSnap.exists()
      ) {
        return false;
      }

      const data =
        userSnap.data();

      const role =
        String(
          data.role || ""
        )
          .trim()
          .toLowerCase();

      return (
        role === "admin" ||
        data.permissions
          ?.admin === true
      );

    } catch (error) {

      console.error(error);

      return false;
    }
  };