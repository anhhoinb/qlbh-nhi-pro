"use client";

import { useState } from "react";

import {
  addDoc,
  collection,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function MigratePage() {

  const [loading, setLoading] =
    useState(false);

  const importCollection = async (
    collectionName: string,
    data: any
  ) => {

    try {

      if (!data) return;

      const firstKey =
        Object.keys(data)[0];

      if (!firstKey) return;

      const raw =
        data[firstKey] || {};

      const items =
        Array.isArray(raw)
          ? raw
          : Object.values(raw);

      for (const item of items as any[]) {

        if (
          !item ||
          typeof item !== "object"
        ) {
          continue;
        }

        await addDoc(
          collection(db, collectionName),
          item
        );

      }

      console.log(
        "Imported:",
        collectionName
      );

    } catch (error) {

      console.log(
        "ERROR:",
        collectionName,
        error
      );

    }

  };

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    setLoading(true);

    try {

      const text =
        await file.text();

      const parsed =
        JSON.parse(text);

      console.log(parsed);

      await importCollection(
        "products",
        parsed.products
      );

      await importCollection(
        "customers",
        parsed.customers
      );

      await importCollection(
        "orders",
        parsed.sells
      );

      await importCollection(
        "users",
        parsed.users
      );

      await importCollection(
        "product_groups",
        parsed.shop_product_group
      );

      await importCollection(
        "product_units",
        parsed.shop_product_unit
      );

      alert(
        "Import FULL DATABASE thành công"
      );

    } catch (error) {

      console.log(error);

      alert("Import lỗi");

    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow">

        <h1 className="text-4xl font-bold text-blue-700 mb-8">
          Import FULL DATABASE
        </h1>

        <input
          type="file"
          accept=".json"
          onChange={handleFile}
          className="w-full border p-4 rounded-2xl text-black"
        />

        {loading && (

          <div className="mt-5 text-blue-700 font-semibold">

            Đang migrate dữ liệu...

          </div>

        )}

      </div>

    </main>
  );
}