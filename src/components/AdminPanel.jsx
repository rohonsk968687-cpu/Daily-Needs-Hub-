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
  handleGoogleLogin, 
  darkMode 
}) {
  // Navigation & Sub-tabs
  const [currentView, setCurrentView] = useState("overview"); // overview, kanban, inventory, addStock, broadcast
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  // Dynamic Add Stock Form State
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

  // Metrics Calculations
  const totalSalesRevenue = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);
  const totalUnitsInStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStockCount = products.filter(p => Number(p.stock) <= 4).length;
  const outOfStockCount = products.filter(p => Number(p.stock) <= 0).length;

  // Kanban Pipeline Stages
  const stages = [
    { key: "To pack", title: "To pack", statusMatch: "Confirmed 📦" },
    { key: "Packing", title: "Packing", statusMatch: "Packing ⏳" },
    { key: "Ready to ship", title: "Ready to ship", statusMatch: "Ready to ship 🏷️" },
    { key: "Shipped", title: "Shipped", statusMatch: "Shipped 🚚" }
  ];

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      showToastMessage(`Order updated to: ${newStatus}`);
    } catch (err) {
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
        brand: el.itemBrand.value || "STYLE ZONE - X",
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
        brand: el.editBrand.value,
        category: el.editCategory.value,
        subCategory: el.editSubCategory.value,
        price: Number(el.editPrice.value),
        discount: Number(el.editDiscount.value) || 0,
        stock: Number(el.editStock.value),
        fabric: el.editFabric.value,
        fit: el.editFit.value,
        specifications: el.editSpecs.value,
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
    } catch (err) {
      setFlashConfig(newConfig);
      showToastMessage("Flash deal saved locally", "info");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-[#101016]/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
            🔒
          </div>
          <h2 className="text-lg font-black tracking-wider uppercase">BRAMBLE ADMIN ACCESS</h2>
          <p className="text-xs text-zinc-400">Please authenticate with an authorized management email to enter the command center.</p>
          <button 
            onClick={handleGoogleLogin} 
            className="w-full py-3 bg-white text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-200 active:scale-95 transition-all shadow-lg"
          >
            Authenticate with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white flex flex-col md:flex-row pb-24 md:pb-0">
      
      {/* LEFT NAVIGATION DOCK (Bramble Style) */}
      <aside className="w-full md:w-64 bg-[#0d0d12]/95 border-b md:border-b-0 md:border-r border-zinc-800 p-4 flex md:flex-col justify-between shrink-0 sticky top-0 md:h-screen z-30 backdrop-blur-xl">
        <div className="space-y-6 w-full">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-sm shadow-indigo-500/30 shadow-lg">
                B
              </div>
              <div>
                <h1 className="text-xs font-black tracking-widest uppercase">STYLE ZONE - X</h1>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Command Console</p>
              </div>
            </div>
            <button 
              onClick={() => { window.location.href = "/"; }}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold"
              title="Return to Store"
            >
              Exit
            </button>
          </div>

          {/* Quick command search bar */}
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="Quick search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#15151e] border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 text-zinc-200"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "kanban", label: "Fulfillment", icon: "📦", badge: orders.length },
              { id: "inventory", label: "The Shelf (Stock)", icon: "🧪", badge: lowStockCount > 0 ? `${lowStockCount} Low` : null },
              { id: "addStock", label: "Create SKU", icon: "➕" },
              { id: "broadcast", label: "Promos & Drops", icon: "⚡" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  currentView === item.id 
                    ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User profile bottom */}
        <div className="hidden md:flex items-center gap-2.5 pt-4 border-t border-zinc-800/70">
          <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-black text-xs text-violet-300">
            {user?.displayName ? user.displayName.charAt(0) : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-zinc-200">{user?.displayName || "Admin Operator"}</p>
            <p className="text-[9px] text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* MAIN BRAMBLE VIEWPORT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen no-scrollbar space-y-6">
        
        {/* VIEW 1: OVERVIEW & ANALYTICS DASHBOARD */}
        {currentView === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Greeting Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Store Performance Overview</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {orders.length} orders total • ₹{totalSalesRevenue.toLocaleString()} in gross sales • {lowStockCount} SKUs need restock
                </p>
              </div>
              <button 
                onClick={() => setCurrentView("addStock")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
              >
                + Create SKU
              </button>
            </div>

            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-[#101017]/90 border border-zinc-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gross Sales</p>
                <p className="text-xl md:text-2xl font-black text-white">₹{totalSalesRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-400 font-bold">↑ 18.4% this month</p>
              </div>
              <div className="bg-[#101017]/90 border border-zinc-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Orders</p>
                <p className="text-xl md:text-2xl font-black text-white">{orders.length}</p>
                <p className="text-[10px] text-indigo-400 font-bold">{orders.filter(o => o.status?.includes("Confirmed")).length} pending pack</p>
              </div>
              <div className="bg-[#101017]/90 border border-zinc-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Units In Hand</p>
                <p className="text-xl md:text-2xl font-black text-white">{totalUnitsInStock}</p>
                <p className="text-[10px] text-amber-400 font-bold">{products.length} active variants</p>
              </div>
              <div className="bg-[#101017]/90 border border-zinc-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Restock Alerts</p>
                <p className="text-xl md:text-2xl font-black text-rose-400">{lowStockCount}</p>
                <p className="text-[10px] text-zinc-400 font-bold">{outOfStockCount} completely sold out</p>
              </div>
            </div>

            {/* Neon Chart & Goal Radial Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#101017]/90 border border-zinc-800/80 p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black uppercase text-zinc-400 tracking-wider">Sales Velocity</p>
                    <p className="text-lg font-black text-white mt-0.5">₹{totalSalesRevenue.toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] bg-zinc-800 px-3 py-1 rounded-full text-zinc-300 font-bold">Live Trends</span>
                </div>
                {/* SVG Synthetic Curved Neon Line */}
                <div className="w-full h-36 relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="neonGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 0,90 Q 60,30 120,70 T 240,40 T 360,80 T 500,20 L 500,120 L 0,120 Z" 
                      fill="url(#neonGlow)" 
                    />
                    <path 
                      d="M 0,90 Q 60,30 120,70 T 240,40 T 360,80 T 500,20" 
                      fill="none" 
                      stroke="#818cf8" 
                      strokeWidth="3" 
                    />
                  </svg>
                </div>
              </div>

              {/* Monthly Goal Radial Gauge */}
              <div className="bg-[#101017]/90 border border-zinc-800/80 p-5 rounded-3xl flex flex-col justify-between items-center text-center">
                <p className="text-xs font-black uppercase text-zinc-400 tracking-wider w-full text-left">Monthly Target</p>
                <div className="relative w-36 h-36 flex items-center justify-center my-3">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#1f1f2e" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="#6366f1" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * 68) / 100}
                      strokeLinecap="round" 
                      fill="transparent" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white">68%</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Achieved</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">Target: ₹1,00,000</p>
              </div>
            </div>

            {/* Recent Orders Overview Glass Table */}
            <div className="bg-[#101017]/90 border border-zinc-800/80 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">Latest Live Orders</h3>
                <button onClick={() => setCurrentView("kanban")} className="text-xs text-indigo-400 font-bold hover:underline">
                  Open Kanban Pipeline →
                </button>
              </div>
              <div className="divide-y divide-zinc-800/60 overflow-x-auto">
                {orders.slice(0, 5).map(ord => (
                  <div key={ord.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center font-black text-xs">
                        {ord.customerName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-200">{ord.customerName} ({ord.phone})</p>
                        <p className="text-[10px] text-zinc-500">#{ord.orderIdRef || ord.id.slice(0, 6)} • {ord.paymentMode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-white">₹{ord.totalAmount}</span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: KANBAN FULFILLMENT PIPELINE */}
        {currentView === "kanban" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black tracking-wider uppercase">Fulfillment Pipeline</h2>
                <p className="text-xs text-zinc-400">Move orders through packaging and dispatch states.</p>
              </div>
              <span className="text-xs font-bold text-zinc-400">Total: {orders.length} orders</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-start">
              {stages.map(col => {
                const colOrders = orders.filter(o => o.status === col.statusMatch || (col.key === "To pack" && !o.status));
                return (
                  <div key={col.key} className="bg-[#101017]/80 border border-zinc-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
                      <span className="font-black text-xs tracking-wider uppercase text-zinc-300">{col.title}</span>
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-black flex items-center justify-center">
                        {colOrders.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[300px]">
                      {colOrders.map(ord => (
                        <div key={ord.id} className="bg-[#151520] border border-zinc-800 hover:border-indigo-500/50 p-3 rounded-xl space-y-2 text-xs transition-all shadow-md">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-indigo-400">#{ord.orderIdRef || ord.id.slice(0, 6)}</span>
                            <span className="font-black text-white">₹{ord.totalAmount}</span>
                          </div>
                          <p className="font-bold text-zinc-200">{ord.customerName}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-2">{ord.address}</p>

                          <div className="text-[10px] text-zinc-400 border-t border-zinc-800/60 pt-1.5 space-y-0.5">
                            {ord.items?.map((it, idx) => (
                              <p key={idx}>• {it.name} [{it.size}] x{it.qty}</p>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            {col.key === "To pack" && (
                              <button 
                                onClick={() => updateOrderStatus(ord.id, "Packing ⏳")}
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px]"
                              >
                                Start Packing →
                              </button>
                            )}
                            {col.key === "Packing" && (
                              <button 
                                onClick={() => updateOrderStatus(ord.id, "Ready to ship 🏷️")}
                                className="w-full py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold text-[10px]"
                              >
                                Mark Ready →
                              </button>
                            )}
                            {col.key === "Ready to ship" && (
                              <button 
                                onClick={() => updateOrderStatus(ord.id, "Shipped 🚚")}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px]"
                              >
                                Mark Shipped ✓
                              </button>
                            )}
                            {col.key === "Shipped" && (
                              <span className="text-[10px] text-emerald-400 font-bold">✓ Dispatched</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: INVENTORY "THE SHELF" (Liquid Tube Meters) */}
        {currentView === "inventory" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black tracking-wider uppercase">The Shelf (Live Inventory)</h2>
                <p className="text-xs text-zinc-400">Glowing liquid level tubes showing available stock in each piece.</p>
              </div>
              <button 
                onClick={() => setCurrentView("addStock")}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
              >
                + Add Piece
              </button>
            </div>

            <div className="bg-[#101017]/90 border border-zinc-800 p-5 rounded-3xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Stock Tube Matrix</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {products.map(p => {
                  const stockNum = Number(p.stock) || 0;
                  const percentage = Math.min(100, Math.max(8, (stockNum / 20) * 100));
                  const isLow = stockNum <= 4;
                  return (
                    <div key={p.id} className="bg-[#151520] border border-zinc-800/80 p-3 rounded-2xl flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-32 rounded-full border-2 border-zinc-700 bg-zinc-900/80 relative overflow-hidden flex flex-col justify-end p-0.5">
                        <div 
                          style={{ height: `${percentage}%` }}
                          className={`w-full rounded-full transition-all duration-700 ${
                            isLow 
                              ? 'bg-gradient-to-t from-rose-600 to-amber-500 shadow-rose-500/50 shadow-lg' 
                              : 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-cyan-500/40 shadow-lg'
                          }`}
                        />
                      </div>
                      <p className="font-bold text-xs truncate w-full text-zinc-200">{p.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLow ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        {stockNum} pcs left
                      </span>
                      <button 
                        onClick={() => setEditingProduct(p)} 
                        className="text-[10px] text-zinc-400 hover:text-white underline"
                      >
                        Edit SKU
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#101017]/90 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Catalog Registry</h3>
              <div className="divide-y divide-zinc-800">
                {products.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt="" className="w-10 h-12 object-contain bg-zinc-900 rounded-lg p-1" />
                      <div>
                        <p className="font-bold text-zinc-200">{p.name} {p.isFlashDeal && <span className="text-amber-400">⚡ [Flash]</span>}</p>
                        <p className="text-[10px] text-zinc-500">{p.category} → {p.subCategory} • ₹{p.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingProduct(p)} className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold">Edit</button>
                      <button onClick={async () => { if(window.confirm("Delete item?")) await deleteDoc(doc(db, "products", p.id)); }} className="px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: CREATE SKU (5 Images + Dynamic Sub-Category Dropdown) */}
        {currentView === "addStock" && (
          <div className="max-w-2xl mx-auto bg-[#101017]/90 border border-zinc-800 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <h2 className="text-base font-black tracking-wider uppercase">Publish Fresh SKU (5 Images & Variants)</h2>
            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Piece Title *</label>
                <input name="itemName" placeholder="e.g. Acid Wash Heavyweight Boxy Tee" className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Department</label>
                  <select 
                    name="itemCategory" 
                    value={adminProductDept} 
                    onChange={(e) => {
                      setAdminProductDept(e.target.value);
                      const defaults = FASHION_COLLECTIONS_MAP[e.target.value];
                      if (defaults && defaults.length > 0) setAdminProductSubCategory(defaults[0]);
                    }}
                    className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1"
                  >
                    {FASHION_DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Sub-Category Collection</label>
                  <select 
                    name="itemSubCategory" 
                    value={adminProductSubCategory}
                    onChange={(e) => setAdminProductSubCategory(e.target.value)}
                    className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1"
                  >
                    {FASHION_COLLECTIONS_MAP[adminProductDept]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Price (₹) *</label>
                  <input name="itemPrice" type="number" placeholder="1299" className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Discount %</label>
                  <input name="itemDiscount" type="number" placeholder="20" className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Stock Count *</label>
                  <input name="itemStock" type="number" placeholder="10" className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">5 Product Images (URLs)</label>
                <input name="itemImg1" placeholder="Image 1 (Front View - Required)" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white" required />
                <input name="itemImg2" placeholder="Image 2 (Back / Silhouette)" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white" />
                <input name="itemImg3" placeholder="Image 3 (Fabric Close-up)" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white" />
                <input name="itemImg4" placeholder="Image 4 (Model Wearing)" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white" />
                <input name="itemImg5" placeholder="Image 5 (Lifestyle / Packaging)" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white" />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Sizes for: {adminProductDept}</label>
                <div className="flex flex-wrap gap-2">
                  {(adminProductDept === "Men" || adminProductDept === "Women") && APPAREL_SIZES_ADULT.map(sz => (
                    <label key={sz} className="flex items-center gap-1 bg-[#151520] border border-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer">
                      <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["M", "L", "XL"].includes(sz)} />
                      <span className="font-bold">{sz}</span>
                    </label>
                  ))}
                  {adminProductDept === "Kids" && KIDS_SIZES.map(sz => (
                    <label key={sz} className="flex items-center gap-1 bg-[#151520] border border-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer">
                      <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["2-3Y", "4-5Y"].includes(sz)} />
                      <span className="font-bold">{sz}</span>
                    </label>
                  ))}
                  {adminProductDept === "Footwear" && FOOTWEAR_SIZES.map(sz => (
                    <label key={sz} className="flex items-center gap-1 bg-[#151520] border border-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer">
                      <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["UK 7", "UK 8", "UK 9"].includes(sz)} />
                      <span className="font-bold">{sz}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Color Palette</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-zinc-800 rounded-xl bg-[#151520]">
                  {FASHION_COLORS.map(col => (
                    <label key={col} className="flex items-center gap-1 bg-[#101017] px-2 py-0.5 border border-zinc-800 rounded text-[10px] cursor-pointer">
                      <input type="checkbox" name="adminColors" value={col} defaultChecked={["Black", "White"].includes(col)} />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Fabric</label>
                  <select name="itemFabric" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white">
                    {FABRIC_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Silhouette</label>
                  <select name="itemFit" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white">
                    {FIT_OPTIONS.map(fit => <option key={fit} value={fit}>{fit}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <input type="checkbox" name="isFlashDeal" className="accent-amber-500" />
                <span className="font-black text-amber-400 text-xs">⚡ Feature this SKU in Today's Flash Drop</span>
              </label>

              <textarea name="itemSpecs" placeholder="Styling notes & fabric details..." rows="2" className="w-full bg-[#151520] border border-zinc-800 p-2 rounded-xl text-white" />

              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-600/30">
                Publish Piece to Catalog
              </button>
            </form>
          </div>
        )}

        {/* VIEW 5: FLASH DROPS & ALERTS */}
        {currentView === "broadcast" && (
          <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
            <div className="bg-[#101017]/90 border border-zinc-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">⚡ Flash Drop Live Controller</h3>
              <form onSubmit={handleUpdateFlash} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Offer Title</label>
                  <input name="flashTitle" defaultValue={flashConfig.title} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Subtitle / Code</label>
                  <input name="flashSub" defaultValue={flashConfig.subtitle} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Featured SKU</label>
                    <select name="flashProduct" defaultValue={flashConfig.featuredProductId} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1">
                      <option value="">None (Site-wide)</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Duration (Hours)</label>
                    <input name="flashHours" type="number" defaultValue={flashConfig.expiryHours || 4} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Poster Image URL</label>
                  <input name="flashPoster" defaultValue={flashConfig.posterUrl} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl font-bold text-white mt-1" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl uppercase">
                  Update Flash Drop Live
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* EDIT MODAL POPUP */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#101017] border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-4 text-xs font-bold text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="uppercase font-black">Edit SKU: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveProductEdit} className="space-y-3">
              <input name="editName" defaultValue={editingProduct.name} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl" required />
              <div className="grid grid-cols-2 gap-2">
                <input name="editPrice" type="number" defaultValue={editingProduct.price} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl" required />
                <input name="editStock" type="number" defaultValue={editingProduct.stock} className="w-full bg-[#151520] border border-zinc-800 p-2.5 rounded-xl" required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <input type="checkbox" name="editIsFlash" defaultChecked={editingProduct.isFlashDeal || false} className="accent-amber-500" />
                <span className="font-black text-amber-400 text-xs">⚡ Feature in Flash Drop</span>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-indigo-600 rounded-xl font-black uppercase">Save Changes</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-3 bg-zinc-800 rounded-xl font-black">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
