export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">

        <aside className="w-64 bg-blue-700 text-white min-h-screen p-5">
          <h1 className="text-3xl font-bold mb-10">
            QLBH Nhi Pro
          </h1>

          <ul className="space-y-4">
            <li className="bg-blue-600 p-3 rounded-xl">
              Dashboard
            </li>

            <li className="hover:bg-blue-600 p-3 rounded-xl cursor-pointer">
              Sản phẩm
            </li>

            <li className="hover:bg-blue-600 p-3 rounded-xl cursor-pointer">
              Bán hàng
            </li>

            <li className="hover:bg-blue-600 p-3 rounded-xl cursor-pointer">
              Khách hàng
            </li>

            <li className="hover:bg-blue-600 p-3 rounded-xl cursor-pointer">
              Kho hàng
            </li>

            <li className="hover:bg-blue-600 p-3 rounded-xl cursor-pointer">
              Công nợ
            </li>
          </ul>
        </aside>

        <section className="flex-1 p-8">

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Dashboard
            </h2>

            <button className="bg-blue-700 text-white px-5 py-3 rounded-xl">
              + Tạo đơn hàng
            </button>
          </div>

          <div className="grid grid-cols-4 gap-6">

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500">
                Doanh thu
              </p>

              <h3 className="text-3xl font-bold text-blue-700 mt-3">
                125.000.000đ
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500">
                Đơn hàng
              </p>

              <h3 className="text-3xl font-bold text-green-600 mt-3">
                320
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500">
                Khách hàng
              </p>

              <h3 className="text-3xl font-bold text-orange-500 mt-3">
                120
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500">
                Sản phẩm
              </p>

              <h3 className="text-3xl font-bold text-purple-600 mt-3">
                560
              </h3>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}