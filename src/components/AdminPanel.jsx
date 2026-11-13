import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';

export default function AdminPanel({ 
  db, 
  user, 
  isAdmin, 
  products, 
  orders, 
  notifications, 
  flashConfig, 
  setFlashConfig, 
  setFlashTime, 
  showToastMessage, 
  handleGoogleLogin 
}) {
  const [currentView, setCurrentView] = useState("overview"); // overview, ordersTable, kanban, timeline, inventory, addStock, broadcast
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const [adminProductDept, setAdminProductDept] = useState("Men");
  const [adminProductSubCategory, setAdminProductSubCategory] = useState("Oversized T-Shirts");

  const FASHION_DEPARTMENTS = ["Men", "Women", "Kids", "Footwear"];
  const FASHION_COLLECTIONS_MAP = {
    "Men": ["Oversized T-Shirts", "Casual & Formal Shirts", "Jeans & Cargo Pants", "Jackets & Hoodies", "Ethnic Kurta Sets"],
    "Women": ["Dresses & Gowns", "Designer Kurtis", "Sarees & Lehengas", "Tops & T-Shirts", "Jeans & Trousers"],
    "Kids": ["Boys Clothing", "Girls Frocks & Tops", "Baby Rompers", "Kids Ethnic Wear"],
    "Footwear": ["Sneakers & Streetwear", "Sports & Running Shoes", "Casual Loafers", "Formal Leather Shoes", "Sandals & Slippers"]
  };

  const FASHION_COLORS = [
    "Black", "White", "Navy Blue", "Olive Green", "Beige", "Maroon", "Charcoal Grey",
    "Lavender", "Baby Pink", "Sky Blue", "Mustard Yellow", "Wine", "Rust", "Cream", "Mint Green",
    "Mocha Brown", "Sage Green", "Coral", "Royal Blue", "Slate Grey"
  ];

  const FABRIC_OPTIONS = [
    "100% French Terry Cotton (240+ GSM)",
    "100% Combed Heavy Cotton (180-220 GSM)",
    "Premium Woven Linen Blend",
    "Heavyweight Twill Denim",
    "Dry-Fit Performance Micro-Poly",
    "Flowy Rayon Mulberry Blend",
    "Thermal Fleece Polar Knit",
    "Breathable Mesh & EVA Sole"
  ];

  const FIT_OPTIONS = [
    "Oversized / Drop Shoulder Fit",
    "Relaxed Boxy Street Fit",
    "Classic Regular Fit",
    "Slim Tailored Cut",
    "Cropped Silhouette",
    "Tapered Cargo Fit",
    "True-to-Size Comfort Footwear"
  ];

  const APPAREL_SIZES_ADULT = ["S", "M", "L", "XL", "XXL", "3XL"];
  const KIDS_SIZES = ["0-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "5-6Y", "7-8Y", "9-10Y"];
  const FOOTWEAR_SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];

  // 6-KPI Calculations (Video 5)
  const totalSalesRevenue = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);
  const pendingPaymentCount = orders.filter(o => o.paymentStatus?.includes("Verifying") || o.status?.includes("Awaiting")).length;
  const processingCount = orders.filter(o => o.status?.includes("Confirmed") || o.status?.includes("Packing") || o.status?.includes("Shipped")).length;
  const deliveredCount = orders.filter(o => o.status?.includes("Delivered")).length;
  const cancelledCount = orders.filter(o => o.status?.includes("Cancelled")).length;
  const refundCount = orders.filter(o => o.status?.includes("Exchange") || o.status?.includes("Refund")).length;

  const totalUnitsInStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStockCount = products.filter(p => Number(p.stock) <= 4).length;

  const stages = [
    { key: "To pack", title: "To Pack", statusMatch: "Confirmed 📦", color: "border-amber-500/40 text-amber-400" },
    { key: "Packing", title: "Packing", statusMatch: "Packing ⏳", color: "border-orange-500/40 text-orange-400" },
    { key: "Ready to ship", title: "Ready to Ship", statusMatch: "Ready to ship 🏷️", color: "border-yellow-500/40 text-yellow-300" },
    { key: "Shipped", title: "Delivered / Shipped", statusMatch: "Shipped 🚚", color: "border-emerald-500/40 text-emerald-400" }
  ];

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      showToastMessage(`Order moved to: ${newStatus}`);
    } catch {
      showToastMessage("Failed to update status", "error");
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToastMessage("Admin unauthorized", "error");
    const el = e.target.elements;

    const images = [
      el.itemImg1?.value?.trim(),
      el.itemImg2?.value?.trim(),
      el.itemImg3?.value?.trim(),
      el.itemImg4?.value?.trim(),
      el.itemImg5?.value?.trim()
    ].filter(Boolean);

    const activeSizes = [];
    e.target.querySelectorAll('input[name="adminSizes"]:checked').forEach(cb => activeSizes.push(cb.value));

    const activeColors = [];
    e.target.querySelectorAll('input[name="adminColors"]:checked').forEach(cb => activeColors.push(cb.value));

    try {
      const isFlash = el.isFlashDeal?.checked || false;
      const docRef = await addDoc(collection(db, "products"), {
        name: el.itemName.value,
        brand: el.itemBrand?.value || "STYLE ZONE - X",
        category: el.itemCategory.value,
        subCategory: el.itemSubCategory.value || "General",
        price: Number(el.itemPrice.value),
        discount: Number(el.itemDiscount.value) || 0,
        stock: Number(el.itemStock.value),
        images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80"],
        availableSizes: activeSizes.length > 0 ? activeSizes : ["M", "L", "XL"],
        availableColors: activeColors.length > 0 ? activeColors : ["Black", "White"],
        fabric: el.itemFabric.value,
        fit: el.itemFit.value,
        specifications: el.itemSpecs.value || "Premium streetwear collection.",
        isFlashDeal: isFlash,
        createdAt: new Date().toISOString()
      });

      if (isFlash) {
        await setDoc(doc(db, "settings", "flashDrop"), { featuredProductId: docRef.id }, { merge: true }).catch(() => {});
      }

      e.target.reset();
      showToastMessage("Product published to catalog! 🚀");
      setCurrentView("inventory");
    } catch (err) {
      showToastMessage("Failed to save product: " + err.message, "error");
    }
  };

  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const el = e.target.elements;
    try {
      const isFlash = el.editIsFlash?.checked || false;
      await updateDoc(doc(db, "products", editingProduct.id), {
        name: el.editName.value,
        price: Number(el.editPrice.value),
        stock: Number(el.editStock.value),
        isFlashDeal: isFlash
      });

      if (isFlash) {
        await setDoc(doc(db, "settings", "flashDrop"), { featuredProductId: editingProduct.id }, { merge: true }).catch(() => {});
      }

      setEditingProduct(null);
      showToastMessage("SKU updated successfully!");
    } catch (err) {
      showToastMessage("Update error: " + err.message, "error");
    }
  };

  const handleUpdateFlash = async (e) => {
    e.preventDefault();
    const el = e.target.elements;
    const newConfig = {
      title: el.flashTitle.value.trim() || "LIMITED FLASH DROP",
      subtitle: el.flashSub.value.trim() || "Extra 20% OFF",
      featuredProductId: el.flashProduct.value || "",
      posterUrl: el.flashPoster.value.trim() || flashConfig.posterUrl,
      expiryHours: Number(el.flashHours.value) || 4
    };
    try {
      await setDoc(doc(db, "settings", "flashDrop"), newConfig, { merge: true });
      setFlashConfig(newConfig);
      setFlashTime(newConfig.expiryHours * 3600);
      showToastMessage("Flash Deal updated live!");
    } catch {
      setFlashConfig(newConfig);
      showToastMessage("Flash deal saved locally", "info");
    }
  };

  const handleBroadcastNotification = async (e) => {
    e.preventDefault();
    const title = e.target.notifTitle.value.trim();
    const desc = e.target.notifDesc.value.trim();
    const poster = e.target.notifPoster.value.trim();
    if (!title || !desc) return;
    try {
      await addDoc(collection(db, "notifications"), {
        title,
        desc,
        posterUrl: poster || null,
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString()
      });
      e.target.reset();
      showToastMessage("Alert broadcasted to all users! 📢");
    } catch {
      showToastMessage("Broadcast error", "error");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0B0E] text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-[#141419] border border-amber-500/20 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
            🔒
          </div>
          <h2 className="text-lg font-black tracking-wider uppercase text-amber-400">STYLE ZONE - X COMMAND</h2>
          <p className="text-xs text-zinc-400">Sign in with your authorized Admin Google account to access orders, analytics & stock.</p>
          <button 
            onClick={handleGoogleLogin} 
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            Sign In with Admin Google
          </button>
        </div>
      </div>
    );
  }

  const filteredOrdersTable = orders.filter(ord => {
    const matchesSearch = (ord.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (ord.orderIdRef || ord.id).toLowerCase().includes(searchQuery.toLowerCase());
    if (orderStatusFilter === "All") return matchesSearch;
    if (orderStatusFilter === "Pending") return matchesSearch && (ord.paymentStatus?.includes("Verifying") || ord.status?.includes("Awaiting"));
    if (orderStatusFilter === "Processing") return matchesSearch && (ord.status?.includes("Confirmed") || o.status?.includes("Packing") || o.status?.includes("Shipped"));
    if (orderStatusFilter === "Delivered") return matchesSearch && ord.status?.includes("Delivered");
    if (orderStatusFilter === "Cancelled") return matchesSearch && ord.status?.includes("Cancelled");
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950 flex flex-col md:flex-row pb-24 md:pb-0">
      
      {/* DARK MATTE & AMBER SIDEBAR (Video 6) */}
      <aside className="w-full md:w-64 bg-[#111116] border-b md:border-b-0 md:border-r border-zinc-800/80 p-4 flex md:flex-col justify-between shrink-0 sticky top-0 md:h-screen z-30">
        <div className="space-y-5 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-black text-zinc-950 text-sm shadow-amber-500/30 shadow-lg">
                X
              </div>
              <div>
                <h1 className="text-xs font-black tracking-widest uppercase text-white">STYLE ZONE - X</h1>
                <p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">Command Suite</p>
              </div>
            </div>
            <button 
              onClick={() => { window.location.href = "/"; }}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold"
            >
              Store →
            </button>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Search orders, SKUs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181820] border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500 text-zinc-200"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
          </div>

          <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Dashboard & KPIs", icon: "📊" },
              { id: "ordersTable", label: "Orders Table", icon: "📋", badge: orders.length },
              { id: "kanban", label: "Kanban Board", icon: "🗂️" },
              { id: "timeline", label: "Timeline Schedule", icon: "📅" },
              { id: "inventory", label: "The Shelf (Stock)", icon: "🧪", badge: lowStockCount > 0 ? `${lowStockCount} Low` : null },
              { id: "addStock", label: "Add New SKU", icon: "➕" },
              { id: "broadcast", label: "Flash & Alerts", icon: "⚡" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  currentView === item.id 
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2.5 pt-4 border-t border-zinc-800/70">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-xs text-amber-400">
            {user?.displayName ? user.displayName.charAt(0) : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-zinc-200">{user?.displayName || "Admin Operator"}</p>
            <p className="text-[9px] text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-4 md:p-7 overflow-y-auto max-h-screen no-scrollbar space-y-6">
        
        {/* TOP 6 KPI CARDS (Video 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("All"); }} className="cursor-pointer bg-[#14141A] hover:border-amber-500/40 border border-zinc-800 p-3.5 rounded-2xl space-y-1 transition-all">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
              <span>Total Orders</span>
              <span className="text-amber-400">📦</span>
            </div>
            <p className="text-xl font-black text-white">{orders.length}</p>
            <p className="text-[9px] text-emerald-400 font-bold">₹{totalSalesRevenue.toLocaleString()} Sales</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Pending"); }} className="cursor-pointer bg-[#14141A] hover:border-amber-500/40 border border-zinc-800 p-3.5 rounded-2xl space-y-1 transition-all">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
              <span>Pending Pay</span>
              <span className="text-yellow-400">⏳</span>
            </div>
            <p className="text-xl font-black text-yellow-400">{pendingPaymentCount}</p>
            <p className="text-[9px] text-zinc-500 font-bold">Awaiting UPI check</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Processing"); }} className="cursor-pointer bg-[#14141A] hover:border-amber-500/40 border border-zinc-800 p-3.5 rounded-2xl space-y-1 transition-all">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
              <span>Processing</span>
              <span className="text-blue-400">🚚</span>
            </div>
            <p className="text-xl font-black text-blue-400">{processingCount}</p>
            <p className="text-[9px] text-zinc-500 font-bold">Packing & Transit</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Delivered"); }} className="cursor-pointer bg-[#14141A] hover:border-amber-500/40 border border-zinc-800 p-3.5 rounded-2xl space-y-1 transition-all">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
              <span>Delivered</span>
              <span className="text-emerald-400">✅</span>
            </div>
            <p className="text-xl font-black text-emerald-400">{deliveredCount}</p>
            <p className="text-[9px] text-zinc-500 font-bold">Completed drops</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Cancelled"); }} className="cursor-pointer bg-[#14141A] hover:border-amber-500/40 border border-zinc-800 p-3.5 rounded-2xl space-y-1 transition-all">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
              <span>Cancelled</span>
              <span className="text-rose-400">❌</span>
            </div>
            <p className="text-xl font-black text-rose-400">{cancelledCount}</p>
            <p className="text-[9px] text-zinc-500 font-bold">Stock restored</p>
          </div>

          <div className="bg-[#14141A] border border-zinc-800 p-3.5 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
              <span>Exchanges</span>
              <span className="text-purple-400">🔄</span>
            </div>
            <p className="text-xl font-black text-purple-400">{refundCount}</p>
            <p className="text-[9px] text-zinc-500 font-bold">7-day requests</p>
          </div>
        </div>

        {/* VIEW 1: OVERVIEW WITH AMBER PROGRESS BARS (Video 6) */}
        {currentView === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Department Progress Bars (Video 6) */}
              <div className="lg:col-span-2 bg-[#14141A] border border-zinc-800 p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Department Fulfillment & Inventory Health</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">{totalUnitsInStock} Total Units</span>
                </div>
                <div className="space-y-3.5 text-xs">
                  {FASHION_DEPARTMENTS.map((dept, i) => {
                    const deptItems = products.filter(p => p.category === dept);
                    const pct = Math.min(100, Math.max(15, deptItems.length * 18));
                    return (
                      <div key={dept} className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-zinc-200">{dept} Collection ({deptItems.length} SKUs)</span>
                          <span className="text-amber-400">{pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Revenue Target Gauge */}
              <div className="bg-[#14141A] border border-zinc-800 p-5 rounded-3xl flex flex-col justify-between items-center text-center">
                <p className="text-xs font-black uppercase text-zinc-400 tracking-wider w-full text-left">Monthly Revenue Goal</p>
                <div className="relative w-36 h-36 flex items-center justify-center my-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#22222B" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="#F59E0B" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.round((totalSalesRevenue / 50000) * 100))) / 100}
                      strokeLinecap="round" 
                      fill="transparent" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white">{Math.min(100, Math.round((totalSalesRevenue / 50000) * 100))}%</span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">of ₹50K</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">Current: ₹{totalSalesRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Structured Order Table Preview */}
            <div className="bg-[#14141A] border border-zinc-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">Recent Order List</h3>
                <button onClick={() => setCurrentView("ordersTable")} className="text-xs text-amber-400 font-bold hover:underline">
                  View Full Order Table →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
                      <th className="py-2.5 px-2">Order ID</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Items</th>
                      <th className="py-2.5 px-2">Total</th>
                      <th className="py-2.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {orders.slice(0, 6).map(ord => (
                      <tr key={ord.id} className="hover:bg-zinc-800/30">
                        <td className="py-3 px-2 font-mono font-bold text-amber-400">#{ord.orderIdRef || ord.id.slice(0, 6)}</td>
                        <td className="py-3 px-2 font-bold text-zinc-200">{ord.customerName}</td>
                        <td className="py-3 px-2 text-zinc-400">{ord.items?.length || 1} pcs</td>
                        <td className="py-3 px-2 font-black text-white">₹{ord.totalAmount}</td>
                        <td className="py-3 px-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FULL STRUCTURED ORDERS TABLE (Video 5) */}
        {currentView === "ordersTable" && (
          <div className="bg-[#14141A] border border-zinc-800 rounded-3xl p-5 space-y-4 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">Order List & Management</h2>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                {["All", "Pending", "Processing", "Delivered", "Cancelled"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setOrderStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      orderStatusFilter === tab ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
                    <th className="py-3 px-2">Product / Items</th>
                    <th className="py-3 px-2">Order ID</th>
                    <th className="py-3 px-2">Customer & Phone</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Status Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredOrdersTable.map(ord => (
                    <tr key={ord.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-2">
                        <div className="space-y-0.5">
                          {ord.items?.map((it, i) => (
                            <p key={i} className="font-bold text-zinc-200">{it.name} <span className="text-zinc-500">({it.size} x{it.qty})</span></p>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-amber-400">#{ord.orderIdRef || ord.id.slice(0, 6)}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-zinc-200">{ord.customerName}</p>
                        <p className="text-[10px] text-zinc-500">{ord.phone}</p>
                      </td>
                      <td className="py-3 px-2 font-black text-white">₹{ord.totalAmount}</td>
                      <td className="py-3 px-2 text-[10px] text-zinc-400">{ord.createdAt}</td>
                      <td className="py-3 px-2">
                        <select 
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                          className="bg-[#1D1D26] border border-zinc-700 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-amber-300"
                        >
                          <option value="Confirmed 📦">Confirmed 📦</option>
                          <option value="Packing ⏳">Packing ⏳</option>
                          <option value="Ready to ship 🏷️">Ready to ship 🏷️</option>
                          <option value="Shipped 🚚">Shipped 🚚</option>
                          <option value="Delivered ✅">Delivered ✅</option>
                          <option value="Cancelled ❌">Cancelled ❌</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: KANBAN BOARD (Video 6) */}
        {currentView === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-start animate-fadeIn">
            {stages.map(col => {
              const colOrders = orders.filter(o => o.status === col.statusMatch || (col.key === "To pack" && !o.status));
              return (
                <div key={col.key} className="bg-[#14141A] border border-zinc-800 rounded-2xl p-3.5 space-y-3">
                  <div className={`flex justify-between items-center border-b pb-2 ${col.color}`}>
                    <span className="font-black text-xs tracking-wider uppercase">{col.title}</span>
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-black flex items-center justify-center">
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="space-y-2.5 min-h-[280px]">
                    {colOrders.map(ord => (
                      <div key={ord.id} className="bg-[#1B1B24] border border-zinc-800 p-3 rounded-xl space-y-2 text-xs shadow-md">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-amber-400">#{ord.orderIdRef || ord.id.slice(0, 6)}</span>
                          <span className="font-black text-white">₹{ord.totalAmount}</span>
                        </div>
                        <p className="font-bold text-zinc-200">{ord.customerName}</p>
                        <p className="text-[10px] text-zinc-500 line-clamp-2">{ord.address}</p>
                        <div className="pt-1">
                          {col.key === "To pack" && (
                            <button onClick={() => updateOrderStatus(ord.id, "Packing ⏳")} className="w-full py-1.5 bg-amber-500 text-zinc-950 rounded-lg font-black text-[10px]">
                              Start Packing →
                            </button>
                          )}
                          {col.key === "Packing" && (
                            <button onClick={() => updateOrderStatus(ord.id, "Ready to ship 🏷️")} className="w-full py-1.5 bg-orange-500 text-zinc-950 rounded-lg font-black text-[10px]">
                              Mark Ready →
                            </button>
                          )}
                          {col.key === "Ready to ship" && (
                            <button onClick={() => updateOrderStatus(ord.id, "Shipped 🚚")} className="w-full py-1.5 bg-emerald-500 text-zinc-950 rounded-lg font-black text-[10px]">
                              Dispatch Order ✓
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 4: TIMELINE SCHEDULE VIEW (Video 6) */}
        {currentView === "timeline" && (
          <div className="bg-[#14141A] border border-zinc-800 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">Dispatch & Delivery Timeline</h2>
            <div className="space-y-4 border-l-2 border-amber-500/40 ml-3 pl-5">
              {orders.map(ord => (
                <div key={ord.id} className="relative bg-[#1B1B24] border border-zinc-800 p-4 rounded-2xl space-y-1.5 text-xs">
                  <span className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-[#14141A]" />
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-black text-amber-400">#{ord.orderIdRef || ord.id.slice(0, 6)} • {ord.createdAt}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300">{ord.status}</span>
                  </div>
                  <p className="font-bold text-white">{ord.customerName} — ₹{ord.totalAmount}</p>
                  <p className="text-[11px] text-zinc-400">{ord.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: INVENTORY LIQUID TUBES */}
        {currentView === "inventory" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#14141A] border border-zinc-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Stock Tube Matrix</h3>
                <button onClick={() => setCurrentView("addStock")} className="px-3.5 py-1.5 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs">
                  + Add Piece
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {products.map(p => {
                  const stockNum = Number(p.stock) || 0;
                  const percentage = Math.min(100, Math.max(8, (stockNum / 20) * 100));
                  const isLow = stockNum <= 4;
                  return (
                    <div key={p.id} className="bg-[#1B1B24] border border-zinc-800 p-3 rounded-2xl flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-28 rounded-full border-2 border-zinc-700 bg-zinc-900 relative overflow-hidden flex flex-col justify-end p-0.5">
                        <div 
                          style={{ height: `${percentage}%` }}
                          className={`w-full rounded-full transition-all duration-700 ${
                            isLow ? 'bg-gradient-to-t from-rose-600 to-amber-500' : 'bg-gradient-to-t from-amber-500 to-yellow-300'
                          }`}
                        />
                      </div>
                      <p className="font-bold text-xs truncate w-full text-zinc-200">{p.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLow ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {stockNum} pcs
                      </span>
                      <div className="flex gap-2 text-[10px]">
                        <button onClick={() => setEditingProduct(p)} className="text-amber-400 underline">Edit</button>
                        <button onClick={async () => { if(window.confirm("Delete item?")) await deleteDoc(doc(db, "products", p.id)); }} className="text-rose-400 underline">Del</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: CREATE SKU */}
        {currentView === "addStock" && (
          <div className="max-w-2xl mx-auto bg-[#14141A] border border-zinc-800 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <h2 className="text-base font-black tracking-wider uppercase text-amber-400">Publish Fresh SKU</h2>
            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <input name="itemName" placeholder="Piece Title *" className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" required />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  name="itemCategory" 
                  value={adminProductDept} 
                  onChange={(e) => {
                    setAdminProductDept(e.target.value);
                    const defaults = FASHION_COLLECTIONS_MAP[e.target.value];
                    if (defaults && defaults.length > 0) setAdminProductSubCategory(defaults[0]);
                  }}
                  className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white"
                >
                  {FASHION_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                  name="itemSubCategory" 
                  value={adminProductSubCategory}
                  onChange={(e) => setAdminProductSubCategory(e.target.value)}
                  className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white"
                >
                  {FASHION_COLLECTIONS_MAP[adminProductDept]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input name="itemPrice" type="number" placeholder="Price (₹) *" className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" required />
                <input name="itemDiscount" type="number" placeholder="Discount %" className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" />
                <input name="itemStock" type="number" placeholder="Stock *" className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" required />
              </div>
              <div className="space-y-1.5">
                <input name="itemImg1" placeholder="Image 1 URL (Required)" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white" required />
                <input name="itemImg2" placeholder="Image 2 URL" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white" />
                <input name="itemImg3" placeholder="Image 3 URL" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white" />
                <input name="itemImg4" placeholder="Image 4 URL" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white" />
                <input name="itemImg5" placeholder="Image 5 URL" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(adminProductDept === "Men" || adminProductDept === "Women") && APPAREL_SIZES_ADULT.map(sz => (
                  <label key={sz} className="flex items-center gap-1 bg-[#1B1B24] border border-zinc-800 px-2.5 py-1 rounded-lg">
                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["M", "L", "XL"].includes(sz)} />
                    <span>{sz}</span>
                  </label>
                ))}
                {adminProductDept === "Kids" && KIDS_SIZES.map(sz => (
                  <label key={sz} className="flex items-center gap-1 bg-[#1B1B24] border border-zinc-800 px-2.5 py-1 rounded-lg">
                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["2-3Y", "4-5Y"].includes(sz)} />
                    <span>{sz}</span>
                  </label>
                ))}
                {adminProductDept === "Footwear" && FOOTWEAR_SIZES.map(sz => (
                  <label key={sz} className="flex items-center gap-1 bg-[#1B1B24] border border-zinc-800 px-2.5 py-1 rounded-lg">
                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["UK 7", "UK 8", "UK 9"].includes(sz)} />
                    <span>{sz}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-zinc-800 rounded-xl bg-[#1B1B24]">
                {FASHION_COLORS.map(col => (
                  <label key={col} className="flex items-center gap-1 bg-[#14141A] px-2 py-0.5 border border-zinc-800 rounded text-[10px]">
                    <input type="checkbox" name="adminColors" value={col} defaultChecked={["Black", "White"].includes(col)} />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="itemFabric" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white">
                  {FABRIC_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select name="itemFit" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white">
                  {FIT_OPTIONS.map(fit => <option key={fit} value={fit}>{fit}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <input type="checkbox" name="isFlashDeal" className="accent-amber-500" />
                <span className="font-black text-amber-400">⚡ Feature in Flash Drop</span>
              </label>
              <textarea name="itemSpecs" placeholder="Details..." rows="2" className="w-full bg-[#1B1B24] border border-zinc-800 p-2 rounded-xl text-white" />
              <button type="submit" className="w-full py-3 bg-amber-500 text-zinc-950 font-black rounded-xl uppercase">
                Publish Piece
              </button>
            </form>
          </div>
        )}

        {/* VIEW 7: BROADCAST & FLASH DROPS */}
        {currentView === "broadcast" && (
          <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
            <div className="bg-[#14141A] border border-zinc-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black uppercase text-amber-400">⚡ Flash Drop Controller</h3>
              <form onSubmit={handleUpdateFlash} className="space-y-2.5 text-xs">
                <input name="flashTitle" defaultValue={flashConfig.title} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" />
                <input name="flashSub" defaultValue={flashConfig.subtitle} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" />
                <div className="grid grid-cols-2 gap-2">
                  <select name="flashProduct" defaultValue={flashConfig.featuredProductId} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white">
                    <option value="">None (Site-wide)</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input name="flashHours" type="number" defaultValue={flashConfig.expiryHours || 4} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" />
                </div>
                <input name="flashPoster" defaultValue={flashConfig.posterUrl} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" />
                <button type="submit" className="w-full py-2.5 bg-amber-500 text-zinc-950 font-black rounded-xl uppercase">Update Flash Drop</button>
              </form>
            </div>

            <div className="bg-[#14141A] border border-zinc-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black uppercase text-amber-400">📢 Broadcast Customer Alert</h3>
              <form onSubmit={handleBroadcastNotification} className="space-y-2.5 text-xs">
                <input name="notifTitle" placeholder="Alert Title" className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl font-bold text-white" required />
                <textarea name="notifDesc" placeholder="Message..." rows="2" className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl text-white" required />
                <input name="notifPoster" placeholder="Poster URL (Optional)" className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl text-white" />
                <button type="submit" className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-xl uppercase">Send Alert</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* EDIT SKU MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#14141A] border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="uppercase font-black text-amber-400">Edit SKU: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveProductEdit} className="space-y-3">
              <input name="editName" defaultValue={editingProduct.name} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl" required />
              <div className="grid grid-cols-2 gap-2">
                <input name="editPrice" type="number" defaultValue={editingProduct.price} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl" required />
                <input name="editStock" type="number" defaultValue={editingProduct.stock} className="w-full bg-[#1B1B24] border border-zinc-800 p-2.5 rounded-xl" required />
              </div>
              <label className="flex items-center gap-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <input type="checkbox" name="editIsFlash" defaultChecked={editingProduct.isFlashDeal || false} className="accent-amber-500" />
                <span className="font-black text-amber-400">⚡ Feature in Flash Drop</span>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-zinc-950 rounded-xl font-black uppercase">Save</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-3 bg-zinc-800 rounded-xl font-black">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
