import {
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function updateProductNames() {
  const snapshot = await getDocs(collection(db, "products"));

  const docs = snapshot.docs;

  let updated = 0;

  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);

    const chunk = docs.slice(i, i + 500);

    chunk.forEach((docSnap) => {
      const data = docSnap.data();

      const updateData: any = {};

      if (!data.main_name) {
        updateData.main_name = data.name || "";
      }

      if (!data.short_name) {
        updateData.short_name = data.name || "";
      }

      if (Object.keys(updateData).length > 0) {
        batch.update(docSnap.ref, updateData);
        updated++;
      }
    });

    await batch.commit();

    console.log(
      `Đã xử lý ${Math.min(i + 500, docs.length)}/${docs.length}`
    );
  }

  console.log(`Hoàn tất. Đã cập nhật ${updated} sản phẩm.`);
}