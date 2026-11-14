import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';

const Icon3D = ({ type, className = "w-5 h-5" }) => {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <defs>
          <linearGradient id="gDashP" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="11" height="11" rx="3" fill="url(#gDashP)" />
        <rect x="18" y="3" width="11" height="7" rx="2.5" fill="#E9D5FF" opacity="0.85" />
        <rect x="18" y="14" width="11" height="15" rx="3" fill="url(#gDashP)" />
        <rect x="3" y="18" width="11" height="11" rx="3" fill="#9333EA" opacity="0.75" />
      </svg>
    ),
    orders: (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <defs>
          <linearGradient id="gBoxP" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        <path d="M16 3L28 9.5V22.5L16 29L4 22.5V9.5L16 3Z" fill="url(#gBoxP)" />
        <path d="M16 3L28 9.5L16 16L4 9.5L16 3Z" fill="#BAE6FD" />
        <path d="M16 16V29L28 22.5V9.5L16 16Z" fill="#4338CA" opacity="0.6" />
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <defs>
          <linearGradient id="gAiP" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="13" fill="url(#gAiP)" />
        <path d="M16 7L18.2 13.8L25 16L18.2 18.2L16 25L13.8 18.2L7 16L13.8 13.8L16 7Z" fill="#FFFFFF" />
      </svg>
    ),
    inventory: (
      <svg viewBox="0 0 32 32" className={className} fill="none">
        <defs>
          <linearGradient id="gInvP" x1="0" y1="0" x2="0" y2="32">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect x="9" y="3" width="14" height="26" rx="7" stroke="#A7F3D0" strokeWidth="2.5" fill="#064E3B" />
        <rect x="11.5" y="12" width="9" height="14.5" rx="4.5" fill="url(#gInvP)" />
      </svg>
    )
  };
  return icons[type] || null;
};

export default function AdminPanel({ 
  db, 
  user, 
  isAdmin, 
  products, 
  orders, 
  notifications, 
  dynamicCoupons = [],
  flashConfig, 
  setFlashConfig, 
  setFlashTime, 
  showToastMessage, 
  handleGoogleLogin 
}) {
  const [currentView, setCurrentView] = useState("overview"); 
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const [isAdminAiOpen, setIsAdminAiOpen] = useState(false);
  const [adminAiInput, setAdminAiInput] = useState("");
  const [adminAiLogs, setAdminAiLogs] = useState([
    {
      sender: "ai",
      text: "Welcome Commander. I am the STYLE ZONE - X Executive AI. I have full control over Orders, Inventory, Coupons, and Flash Drops. Give me a command in English."
    }
  ]);

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

  const totalSalesRevenue = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);
  const pendingPaymentOrders = orders.filter(o => o.paymentStatus?.includes("Verifying") || o.status?.includes("Awaiting"));
  const processingCount = orders.filter(o => o.status?.includes("Confirmed") || o.status?.includes("Packing") || o.status?.includes("Shipped")).length;
  const deliveredCount = orders.filter(o => o.status?.includes("Delivered")).length;
  const cancelledCount = orders.filter(o => o.status?.includes("Cancelled")).length;
  const refundCount = orders.filter(o => o.status?.includes("Exchange") || o.status?.includes("Refund")).length;

  const totalUnitsInStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStockItems = products.filter(p => Number(p.stock) <= 4);

  const stages = [
    { key: "To pack", title: "To Pack", statusMatch: "Confirmed 📦", color: "border-purple-500/40 text-purple-300" },
    { key: "Packing", title: "Packing", statusMatch: "Packing ⏳", color: "border-fuchsia-500/40 text-fuchsia-300" },
    { key: "Ready to ship", title: "Ready to Ship", statusMatch: "Ready to ship 🏷️", color: "border-indigo-500/40 text-indigo-300" },
    { key: "Shipped", title: "Shipped", statusMatch: "Shipped 🚚", color: "border-emerald-500/40 text-emerald-300" }
  ];

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      showToastMessage(`Order status updated to: ${newStatus}`);
    } catch {
      showToastMessage("Failed to update status", "error");
    }
  };

  const approveUpiPayment = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        paymentStatus: "Paid & Verified ✅",
        status: "Confirmed 📦"
      });
      showToastMessage("UPI Payment Verified & Order Confirmed!");
    } catch {
      showToastMessage("Approval failed", "error");
    }
  };

  const executeAdminAiCommand = async (rawCommand) => {
    const cmd = rawCommand.trim();
    if (!cmd) return;
    const lower = cmd.toLowerCase();
    const updatedLogs = [...adminAiLogs, { sender: "admin", text: cmd }];

    if (lower.includes("approve") && (lower.includes("upi") || lower.includes("payment") || lower.includes("pending"))) {
      if (pendingPaymentOrders.length === 0) {
        setAdminAiLogs([...updatedLogs, { sender: "ai", text: "All UPI payments are already verified. 0 pending verification orders." }]);
      } else {
        for (const ord of pendingPaymentOrders) {
          await updateDoc(doc(db, "orders", ord.id), {
            paymentStatus: "Paid & Verified ✅",
            status: "Confirmed 📦"
          }).catch(() => {});
        }
        showToastMessage(`AI Verified ${pendingPaymentOrders.length} UPI orders!`);
        setAdminAiLogs([...updatedLogs, { sender: "ai", text: `✅ Executed: Approved and confirmed ${pendingPaymentOrders.length} pending UPI payment(s).` }]);
      }
      setAdminAiInput("");
      return;
    }

    if (lower.includes("low stock") || lower.includes("restock") || lower.includes("inventory")) {
      setCurrentView("inventory");
      if (lowStockItems.length === 0) {
        setAdminAiLogs([...updatedLogs, { sender: "ai", text: "Inventory levels are healthy! All SKUs have more than 4 units." }]);
      } else {
        const names = lowStockItems.map(i => `${i.name} (${i.stock} left)`).join(", ");
        setAdminAiLogs([...updatedLogs, { sender: "ai", text: `⚠️ Restock Alert: ${lowStockItems.length} item(s) low: ${names}.` }]);
      }
      setAdminAiInput("");
      return;
    }

    if (lower.includes("create coupon") || lower.includes("new coupon")) {
      const codeMatch = cmd.match(/coupon\s+([A-Za-z0-9]+)/i);
      const numMatch = cmd.match(/(\d+)/g);
      const newCode = codeMatch ? codeMatch[1].toUpperCase() : `VIP${Math.floor(10 + Math.random() * 89)}`;
      const discVal = numMatch ? Number(numMatch[numMatch.length - 1]) : 150;
      try {
        await addDoc(collection(db, "coupons"), {
          code: newCode,
          discountType: "fixed",
          discountValue: discVal,
          minOrder: 999
        });
        showToastMessage(`AI Created Coupon: ${newCode}`);
        setAdminAiLogs([...updatedLogs, { sender: "ai", text: `🎟️ Live Coupon Deployed: "${newCode}" is active for ₹${discVal} OFF.` }]);
      } catch {
        setAdminAiLogs([...updatedLogs, { sender: "ai", text: "Network error deploying coupon." }]);
      }
      setAdminAiInput("");
      return;
    }

    if (lower.includes("revenue") || lower.includes("report") || lower.includes("sales")) {
      const stockValue = products.reduce((s, p) => s + (Number(p.price) * Number(p.stock)), 0);
      setAdminAiLogs([...updatedLogs, { 
        sender: "ai", 
        text: `📊 Executive Report:\n• Gross Revenue: ₹${totalSalesRevenue.toLocaleString()}\n• Orders: ${orders.length} (${deliveredCount} Delivered, ${processingCount} Processing)\n• Inventory Valuation: ₹${stockValue.toLocaleString()} (${totalUnitsInStock} units)` 
      }]);
      setAdminAiInput("");
      return;
    }

    setAdminAiLogs([...updatedLogs, { 
      sender: "ai", 
      text: "Command ready. Try: 'Approve all pending UPI payments', 'Show low stock items', 'Generate revenue report', or 'Create coupon VIP150 for 150 off'." 
    }]);
    setAdminAiInput("");
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
        discount: Number(el.editDiscount?.value || 0),
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

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const el = e.target.elements;
    try {
      await addDoc(collection(db, "coupons"), {
        code: el.coupCode.value.toUpperCase().trim(),
        discountType: el.coupType.value,
        discountValue: Number(el.coupValue.value) || 100,
        minOrder: Number(el.coupMin.value) || 0
      });
      e.target.reset();
      showToastMessage("Coupon deployed live!");
    } catch {
      showToastMessage("Coupon creation error", "error");
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
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1E103C_0%,_#090514_60%,_#05030A_100%)] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="bg-[#120B24]/90 backdrop-blur-2xl border border-purple-500/30 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-purple-500/15 border border-purple-400/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Icon3D type="ai" className="w-9 h-9" />
          </div>
          <h2 className="text-lg font-black tracking-wider uppercase text-purple-300">STYLE ZONE - X COMMAND</h2>
          <p className="text-xs text-purple-200/70">Authenticate with your authorized Admin Google account to access the Next-Gen SaaS Console.</p>
          <button 
            onClick={handleGoogleLogin} 
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-purple-600/30"
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
    if (orderStatusFilter === "Processing") return matchesSearch && (ord.status?.includes("Confirmed") || ord.status?.includes("Packing") || ord.status?.includes("Shipped"));
    if (orderStatusFilter === "Delivered") return matchesSearch && ord.status?.includes("Delivered");
    if (orderStatusFilter === "Cancelled") return matchesSearch && ord.status?.includes("Cancelled");
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#1D0F3B_0%,_#0A0618_55%,_#06030F_100%)] text-zinc-100 font-sans selection:bg-purple-500 selection:text-white flex flex-col md:flex-row pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Floating Ambient 3D Glow Orbs */}
      <div className="pointer-events-none fixed top-10 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="pointer-events-none fixed bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />

      {/* DEEP MIDNIGHT-PURPLE SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0E081F]/90 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-purple-500/20 p-4 flex md:flex-col justify-between shrink-0 sticky top-0 md:h-screen z-30">
        <div className="space-y-5 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center font-black text-white text-base shadow-purple-500/40 shadow-lg">
                X
              </div>
              <div>
                <h1 className="text-xs font-black tracking-widest uppercase text-white">STYLE ZONE - X</h1>
                <p className="text-[9px] text-purple-300/80 font-bold uppercase tracking-wider">Next-Gen Console</p>
              </div>
            </div>
            <button 
              onClick={() => { window.location.href = "/"; }}
              className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-200 rounded-lg text-[10px] font-bold transition-all"
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
              className="w-full bg-[#160E2E] border border-purple-500/25 rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-purple-400 text-white transition-all"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400 text-xs">🔍</span>
          </div>

          <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Dashboard & KPIs", icon: <Icon3D type="dashboard" className="w-4 h-4" /> },
              { id: "ordersTable", label: "Orders Table", icon: <Icon3D type="orders" className="w-4 h-4" />, badge: orders.length },
              { id: "kanban", label: "Kanban Board", icon: "🗂️" },
              { id: "timeline", label: "Timeline View", icon: "📅" },
              { id: "inventory", label: "The Shelf (Stock)", icon: <Icon3D type="inventory" className="w-4 h-4" />, badge: lowStockItems.length > 0 ? `${lowStockItems.length} Low` : null },
              { id: "addStock", label: "Add New SKU", icon: "➕" },
              { id: "broadcast", label: "Coupons & Drops", icon: "⚡" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 whitespace-nowrap ${
                  currentView === item.id 
                    ? 'bg-gradient-to-r from-purple-600/30 to-fuchsia-600/20 text-purple-200 border border-purple-400/50 shadow-lg shadow-purple-600/20 scale-[1.02]' 
                    : 'text-purple-200/60 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm flex items-center">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden md:block space-y-3 pt-4 border-t border-purple-500/20">
          <button 
            onClick={() => setIsAdminAiOpen(true)}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-600/30 via-fuchsia-600/25 to-indigo-600/30 border border-purple-400/40 hover:border-fuchsia-400 flex items-center gap-2.5 text-left transition-all group hover:scale-[1.02]"
          >
            <Icon3D type="ai" className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            <div>
              <p className="text-xs font-black text-white">Executive AI</p>
              <p className="text-[9px] text-purple-300 font-bold">Auto-Verify & Audit</p>
            </div>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-4 md:p-7 overflow-y-auto max-h-screen no-scrollbar space-y-6 relative z-10">
        
        {/* TOP 6 KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("All"); }} className="cursor-pointer bg-[#130B29]/90 backdrop-blur-xl hover:border-purple-400/50 hover:-translate-y-1 border border-purple-500/20 p-3.5 rounded-2xl space-y-1 transition-all shadow-lg">
            <div className="flex justify-between items-center text-[10px] text-purple-300/70 font-bold uppercase">
              <span>Total Orders</span>
              <Icon3D type="orders" className="w-4 h-4" />
            </div>
            <p className="text-xl font-black text-white">{orders.length}</p>
            <p className="text-[9px] text-emerald-400 font-bold">₹{totalSalesRevenue.toLocaleString()} Sales</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Pending"); }} className="cursor-pointer bg-[#130B29]/90 backdrop-blur-xl hover:border-purple-400/50 hover:-translate-y-1 border border-purple-500/20 p-3.5 rounded-2xl space-y-1 transition-all shadow-lg">
            <div className="flex justify-between items-center text-[10px] text-purple-300/70 font-bold uppercase">
              <span>Pending Pay</span>
              <span className="text-amber-400">⏳</span>
            </div>
            <p className="text-xl font-black text-amber-400">{pendingPaymentOrders.length}</p>
            <p className="text-[9px] text-purple-300/50 font-bold">Awaiting UPI check</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Processing"); }} className="cursor-pointer bg-[#130B29]/90 backdrop-blur-xl hover:border-purple-400/50 hover:-translate-y-1 border border-purple-500/20 p-3.5 rounded-2xl space-y-1 transition-all shadow-lg">
            <div className="flex justify-between items-center text-[10px] text-purple-300/70 font-bold uppercase">
              <span>Processing</span>
              <span className="text-sky-400">🚚</span>
            </div>
            <p className="text-xl font-black text-sky-400">{processingCount}</p>
            <p className="text-[9px] text-purple-300/50 font-bold">Packing & Transit</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Delivered"); }} className="cursor-pointer bg-[#130B29]/90 backdrop-blur-xl hover:border-purple-400/50 hover:-translate-y-1 border border-purple-500/20 p-3.5 rounded-2xl space-y-1 transition-all shadow-lg">
            <div className="flex justify-between items-center text-[10px] text-purple-300/70 font-bold uppercase">
              <span>Delivered</span>
              <span className="text-emerald-400">✅</span>
            </div>
            <p className="text-xl font-black text-emerald-400">{deliveredCount}</p>
            <p className="text-[9px] text-purple-300/50 font-bold">Completed drops</p>
          </div>

          <div onClick={() => { setCurrentView("ordersTable"); setOrderStatusFilter("Cancelled"); }} className="cursor-pointer bg-[#130B29]/90 backdrop-blur-xl hover:border-purple-400/50 hover:-translate-y-1 border border-purple-500/20 p-3.5 rounded-2xl space-y-1 transition-all shadow-lg">
            <div className="flex justify-between items-center text-[10px] text-purple-300/70 font-bold uppercase">
              <span>Cancelled</span>
              <span className="text-rose-400">❌</span>
            </div>
            <p className="text-xl font-black text-rose-400">{cancelledCount}</p>
            <p className="text-[9px] text-purple-300/50 font-bold">Stock restored</p>
          </div>

          <div className="bg-[#130B29]/90 backdrop-blur-xl border border-purple-500/20 p-3.5 rounded-2xl space-y-1 shadow-lg">
            <div className="flex justify-between items-center text-[10px] text-purple-300/70 font-bold uppercase">
              <span>Exchanges</span>
              <span className="text-fuchsia-400">🔄</span>
            </div>
            <p className="text-xl font-black text-fuchsia-400">{refundCount}</p>
            <p className="text-[9px] text-purple-300/50 font-bold">7-day requests</p>
          </div>
        </div>

        {/* VIEW 1: OVERVIEW */}
        {currentView === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#130B29]/90 backdrop-blur-xl border border-purple-500/20 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">Department Inventory Health</h3>
                  <span className="text-[10px] text-purple-300/60 font-bold">{totalUnitsInStock} Total Units</span>
                </div>
                <div className="space-y-3.5 text-xs">
                  {FASHION_DEPARTMENTS.map((dept) => {
                    const deptItems = products.filter(p => p.category === dept);
                    const pct = Math.min(100, Math.max(15, deptItems.length * 18));
                    return (
                      <div key={dept} className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-white">{dept} Collection ({deptItems.length} SKUs)</span>
                          <span className="text-fuchsia-400">{pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-purple-950 rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-400 rounded-full transition-all duration-700" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#130B29]/90 backdrop-blur-xl border border-purple-500/20 p-5 rounded-3xl flex flex-col justify-between items-center text-center shadow-xl">
                <p className="text-xs font-black uppercase text-purple-300/70 tracking-wider w-full text-left">Monthly Revenue Goal</p>
                <div className="relative w-36 h-36 flex items-center justify-center my-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#231447" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="#A855F7" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.round((totalSalesRevenue / 50000) * 100))) / 100}
                      strokeLinecap="round" 
                      fill="transparent" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white">{Math.min(100, Math.round((totalSalesRevenue / 50000) * 100))}%</span>
                    <span className="text-[9px] uppercase tracking-wider text-purple-300 font-bold">of ₹50K</span>
                  </div>
                </div>
                <p className="text-[11px] text-purple-200/70">Current: ₹{totalSalesRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-[#130B29]/90 backdrop-blur-xl border border-purple-500/20 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Recent Live Orders</h3>
                <button onClick={() => setCurrentView("ordersTable")} className="text-xs text-purple-300 font-bold hover:underline">
                  Manage All Orders →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-purple-500/20 text-[10px] uppercase text-purple-300/60">
                      <th className="py-2.5 px-2">Order ID</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Payment</th>
                      <th className="py-2.5 px-2">Total</th>
                      <th className="py-2.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/15">
                    {orders.slice(0, 6).map(ord => (
                      <tr key={ord.id} className="hover:bg-purple-900/20">
                        <td className="py-3 px-2 font-mono font-bold text-purple-300">#{ord.orderIdRef || ord.id.slice(0, 6)}</td>
                        <td className="py-3 px-2 font-bold text-white">{ord.customerName}</td>
                        <td className="py-3 px-2 text-purple-200/70">{ord.paymentStatus}</td>
                        <td className="py-3 px-2 font-black text-white">₹{ord.totalAmount}</td>
                        <td className="py-3 px-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
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

        {/* VIEW 2: FULL ORDERS TABLE */}
        {currentView === "ordersTable" && (
          <div className="bg-[#130B29]/90 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-5 space-y-4 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-purple-500/20 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-purple-300">Order Management Table</h2>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                {["All", "Pending", "Processing", "Delivered", "Cancelled"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setOrderStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      orderStatusFilter === tab ? 'bg-purple-600 text-white font-black' : 'bg-purple-950/70 text-purple-300/70'
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
                  <tr className="border-b border-purple-500/20 text-[10px] uppercase text-purple-300/60">
                    <th className="py-3 px-2">Item</th>
                    <th className="py-3 px-2">Order ID</th>
                    <th className="py-3 px-2">Customer & Address</th>
                    <th className="py-3 px-2">Amount & Payment</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/15">
                  {filteredOrdersTable.map(ord => (
                    <tr key={ord.id} className="hover:bg-purple-900/20">
                      <td className="py-3 px-2">
                        {ord.items?.map((it, i) => (
                          <p key={i} className="font-bold text-white">{it.name} <span className="text-purple-300/60">[{it.size}, {it.color}]</span></p>
                        ))}
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-purple-300">#{ord.orderIdRef || ord.id.slice(0, 6)}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-white">{ord.customerName} ({ord.phone})</p>
                        <p className="text-[10px] text-purple-200/60 max-w-xs truncate">{ord.address}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-black text-white">₹{ord.totalAmount}</p>
                        <p className="text-[10px] text-emerald-400">{ord.paymentStatus}</p>
                      </td>
                      <td className="py-3 px-2 space-y-1.5">
                        <select 
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                          className="bg-[#1C113B] border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-purple-200 block w-full"
                        >
                          <option value="Confirmed 📦">Confirmed 📦</option>
                          <option value="Packing ⏳">Packing ⏳</option>
                          <option value="Ready to ship 🏷️">Ready to ship 🏷️</option>
                          <option value="Shipped 🚚">Shipped 🚚</option>
                          <option value="Delivered ✅">Delivered ✅</option>
                          <option value="Cancelled ❌">Cancelled ❌</option>
                        </select>
                        <div className="flex gap-1.5">
                          {ord.paymentStatus?.includes("Verifying") && (
                            <button onClick={() => approveUpiPayment(ord.id)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black">
                              ✓ Approve UPI
                            </button>
                          )}
                          <a href={`tel:${ord.phone}`} className="px-2 py-1 bg-purple-900 text-purple-200 rounded-lg text-[9px] font-bold">Call</a>
                          <button onClick={async () => { if(window.confirm("Delete order?")) await deleteDoc(doc(db, "orders", ord.id)); }} className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-bold">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: KANBAN BOARD */}
        {currentView === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-start animate-fadeIn">
            {stages.map(col => {
              const colOrders = orders.filter(o => o.status === col.statusMatch || (col.key === "To pack" && !o.status));
              return (
                <div key={col.key} className="bg-[#130B29]/90 border border-purple-500/20 rounded-2xl p-3.5 space-y-3">
                  <div className={`flex justify-between items-center border-b pb-2 ${col.color}`}>
                    <span className="font-black text-xs tracking-wider uppercase">{col.title}</span>
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-200 text-[10px] font-black flex items-center justify-center">
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="space-y-2.5 min-h-[280px]">
                    {colOrders.map(ord => (
                      <div key={ord.id} className="bg-[#1B1038] border border-purple-500/25 p-3 rounded-xl space-y-2 text-xs shadow-md">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-purple-300">#{ord.orderIdRef || ord.id.slice(0, 6)}</span>
                          <span className="font-black text-white">₹{ord.totalAmount}</span>
                        </div>
                        <p className="font-bold text-white">{ord.customerName}</p>
                        <p className="text-[10px] text-purple-200/60 line-clamp-2">{ord.address}</p>
                        <div className="pt-1">
                          {col.key === "To pack" && (
                            <button onClick={() => updateOrderStatus(ord.id, "Packing ⏳")} className="w-full py-1.5 bg-purple-600 text-white rounded-lg font-black text-[10px]">
                              Start Packing →
                            </button>
                          )}
                          {col.key === "Packing" && (
                            <button onClick={() => updateOrderStatus(ord.id, "Ready to ship 🏷️")} className="w-full py-1.5 bg-fuchsia-600 text-white rounded-lg font-black text-[10px]">
                              Mark Ready →
                            </button>
                          )}
                          {col.key === "Ready to ship" && (
                            <button onClick={() => updateOrderStatus(ord.id, "Shipped 🚚")} className="w-full py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[10px]">
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

        {/* VIEW 4: TIMELINE VIEW */}
        {currentView === "timeline" && (
          <div className="bg-[#130B29]/90 border border-purple-500/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <h2 className="text-sm font-black uppercase tracking-wider text-purple-300">Dispatch & Delivery Timeline</h2>
            <div className="space-y-4 border-l-2 border-purple-500/40 ml-3 pl-5">
              {orders.map(ord => (
                <div key={ord.id} className="relative bg-[#1B1038] border border-purple-500/25 p-4 rounded-2xl space-y-1.5 text-xs">
                  <span className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-[#130B29]" />
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-black text-purple-300">#{ord.orderIdRef || ord.id.slice(0, 6)} • {ord.createdAt}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-200">{ord.status}</span>
                  </div>
                  <p className="font-bold text-white">{ord.customerName} — ₹{ord.totalAmount}</p>
                  <p className="text-[11px] text-purple-200/70">{ord.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: INVENTORY LIQUID TUBES */}
        {currentView === "inventory" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#130B29]/90 border border-purple-500/20 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">Stock Tube Matrix</h3>
                <button onClick={() => setCurrentView("addStock")} className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black rounded-xl text-xs">
                  + Add Piece
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {products.map(p => {
                  const stockNum = Number(p.stock) || 0;
                  const percentage = Math.min(100, Math.max(8, (stockNum / 20) * 100));
                  const isLow = stockNum <= 4;
                  return (
                    <div key={p.id} className="bg-[#1B1038] border border-purple-500/25 p-3 rounded-2xl flex flex-col items-center text-center space-y-2 hover:-translate-y-1 transition-transform">
                      <div className="w-10 h-28 rounded-full border-2 border-purple-400/40 bg-[#0D071E] relative overflow-hidden flex flex-col justify-end p-0.5">
                        <div 
                          style={{ height: `${percentage}%` }}
                          className={`w-full rounded-full transition-all duration-700 ${
                            isLow ? 'bg-gradient-to-t from-rose-600 to-amber-500' : 'bg-gradient-to-t from-purple-600 to-cyan-400'
                          }`}
                        />
                      </div>
                      <p className="font-bold text-xs truncate w-full text-white">{p.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLow ? 'bg-rose-500/20 text-rose-300' : 'bg-purple-500/20 text-purple-200'}`}>
                        {stockNum} pcs
                      </span>
                      <div className="flex gap-2 text-[10px]">
                        <button onClick={() => setEditingProduct(p)} className="text-purple-300 underline">Edit</button>
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
          <div className="max-w-2xl mx-auto bg-[#130B29]/90 border border-purple-500/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <h2 className="text-base font-black tracking-wider uppercase text-purple-300">Publish Fresh SKU</h2>
            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <input name="itemName" placeholder="Piece Title *" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" required />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  name="itemCategory" 
                  value={adminProductDept} 
                  onChange={(e) => {
                    setAdminProductDept(e.target.value);
                    const defaults = FASHION_COLLECTIONS_MAP[e.target.value];
                    if (defaults && defaults.length > 0) setAdminProductSubCategory(defaults[0]);
                  }}
                  className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white"
                >
                  {FASHION_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                  name="itemSubCategory" 
                  value={adminProductSubCategory}
                  onChange={(e) => setAdminProductSubCategory(e.target.value)}
                  className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white"
                >
                  {FASHION_COLLECTIONS_MAP[adminProductDept]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input name="itemPrice" type="number" placeholder="Price (₹) *" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" required />
                <input name="itemDiscount" type="number" placeholder="Discount %" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" />
                <input name="itemStock" type="number" placeholder="Stock *" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" required />
              </div>
              <div className="space-y-1.5">
                <input name="itemImg1" placeholder="Image 1 URL (Required)" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white" required />
                <input name="itemImg2" placeholder="Image 2 URL" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white" />
                <input name="itemImg3" placeholder="Image 3 URL" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white" />
                <input name="itemImg4" placeholder="Image 4 URL" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white" />
                <input name="itemImg5" placeholder="Image 5 URL" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(adminProductDept === "Men" || adminProductDept === "Women") && APPAREL_SIZES_ADULT.map(sz => (
                  <label key={sz} className="flex items-center gap-1 bg-[#1B1038] border border-purple-500/25 px-2.5 py-1 rounded-lg">
                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["M", "L", "XL"].includes(sz)} />
                    <span>{sz}</span>
                  </label>
                ))}
                {adminProductDept === "Kids" && KIDS_SIZES.map(sz => (
                  <label key={sz} className="flex items-center gap-1 bg-[#1B1038] border border-purple-500/25 px-2.5 py-1 rounded-lg">
                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["2-3Y", "4-5Y"].includes(sz)} />
                    <span>{sz}</span>
                  </label>
                ))}
                {adminProductDept === "Footwear" && FOOTWEAR_SIZES.map(sz => (
                  <label key={sz} className="flex items-center gap-1 bg-[#1B1038] border border-purple-500/25 px-2.5 py-1 rounded-lg">
                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["UK 7", "UK 8", "UK 9"].includes(sz)} />
                    <span>{sz}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-purple-500/25 rounded-xl bg-[#1B1038]">
                {FASHION_COLORS.map(col => (
                  <label key={col} className="flex items-center gap-1 bg-[#130B29] px-2 py-0.5 border border-purple-500/25 rounded text-[10px]">
                    <input type="checkbox" name="adminColors" value={col} defaultChecked={["Black", "White"].includes(col)} />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="itemFabric" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white">
                  {FABRIC_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select name="itemFit" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white">
                  {FIT_OPTIONS.map(fit => <option key={fit} value={fit}>{fit}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 bg-purple-500/15 p-2.5 rounded-xl border border-purple-400/30">
                <input type="checkbox" name="isFlashDeal" className="accent-purple-500" />
                <span className="font-black text-purple-300">⚡ Feature in Flash Drop</span>
              </label>
              <textarea name="itemSpecs" placeholder="Details..." rows="2" className="w-full bg-[#1B1038] border border-purple-500/25 p-2 rounded-xl text-white" />
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black rounded-xl uppercase shadow-lg">
                Publish Piece
              </button>
            </form>
          </div>
        )}

        {/* VIEW 7: COUPONS, FLASH DROPS & ALERTS */}
        {currentView === "broadcast" && (
          <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
            <div className="bg-[#130B29]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black uppercase text-purple-300">⚡ Flash Drop Controller</h3>
              <form onSubmit={handleUpdateFlash} className="space-y-2.5 text-xs">
                <input name="flashTitle" defaultValue={flashConfig.title} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" />
                <input name="flashSub" defaultValue={flashConfig.subtitle} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" />
                <div className="grid grid-cols-2 gap-2">
                  <select name="flashProduct" defaultValue={flashConfig.featuredProductId} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white">
                    <option value="">None (Site-wide)</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input name="flashHours" type="number" defaultValue={flashConfig.expiryHours || 4} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" />
                </div>
                <input name="flashPoster" defaultValue={flashConfig.posterUrl} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" />
                <button type="submit" className="w-full py-2.5 bg-purple-600 text-white font-black rounded-xl uppercase">Update Flash Drop</button>
              </form>
            </div>

            <div className="bg-[#130B29]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black uppercase text-purple-300">🎟️ Create Promo Coupon</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input name="coupCode" placeholder="Code (e.g. FESTIVE50)" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold uppercase text-white" required />
                  <select name="coupType" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white">
                    <option value="fixed">Fixed ₹ OFF</option>
                    <option value="percentage">Percentage % OFF</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input name="coupValue" type="number" placeholder="Discount Value" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" required />
                  <input name="coupMin" type="number" placeholder="Min Order ₹" className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl font-bold text-white" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-black rounded-xl uppercase">Deploy Coupon</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* FLOATING ADMIN SUPER-AI CO-PILOT BUTTON */}
      <button
        onClick={() => setIsAdminAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-2xl shadow-purple-500/50 hover:scale-110 active:scale-95 transition-all flex items-center gap-2 border border-white/20"
      >
        <Icon3D type="ai" className="w-7 h-7" />
        <span className="text-xs font-black uppercase pr-1 hidden sm:inline">Executive AI</span>
      </button>

      {/* ADMIN SUPER-AI CO-PILOT DRAWER */}
      {isAdminAiOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#130B29] border border-purple-400/40 rounded-3xl p-5 max-w-lg w-full space-y-4 text-xs text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-purple-500/25 pb-3">
              <div className="flex items-center gap-2.5">
                <Icon3D type="ai" className="w-8 h-8" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-purple-300">Executive AI Co-Pilot</h3>
                  <p className="text-[10px] text-emerald-400 font-bold">● Full Database Authority Active</p>
                </div>
              </div>
              <button onClick={() => setIsAdminAiOpen(false)} className="p-1.5 rounded-full bg-purple-950 text-purple-200">✕</button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar">
              {adminAiLogs.map((log, i) => (
                <div key={i} className={`p-3 rounded-2xl whitespace-pre-line leading-relaxed ${log.sender === 'ai' ? 'bg-[#1D113D] border border-purple-500/20 text-purple-100' : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black ml-auto max-w-[85%]'}`}>
                  {log.text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                "Approve all pending UPI payments",
                "Show low stock items",
                "Generate revenue report",
                "Create coupon VIP150 for 150 off"
              ].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => executeAdminAiCommand(cmd)}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-400/30 hover:bg-purple-600 hover:text-white transition-all"
                >
                  ⚡ {cmd}
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); executeAdminAiCommand(adminAiInput); }}
              className="flex gap-2 pt-1"
            >
              <input
                value={adminAiInput}
                onChange={(e) => setAdminAiInput(e.target.value)}
                placeholder="Instruct Admin AI in English..."
                className="flex-1 bg-[#1D113D] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:border-purple-400 focus:outline-none"
              />
              <button type="submit" className="px-4 py-2.5 bg-purple-600 text-white font-black rounded-xl uppercase">
                Run
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SKU MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
              <h3 className="uppercase font-black text-purple-300">Edit SKU: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveProductEdit} className="space-y-3">
              <input name="editName" defaultValue={editingProduct.name} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl" required />
              <div className="grid grid-cols-3 gap-2">
                <input name="editPrice" type="number" defaultValue={editingProduct.price} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl" required />
                <input name="editDiscount" type="number" defaultValue={editingProduct.discount || 0} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl" />
                <input name="editStock" type="number" defaultValue={editingProduct.stock} className="w-full bg-[#1B1038] border border-purple-500/25 p-2.5 rounded-xl" required />
              </div>
              <label className="flex items-center gap-2 bg-purple-500/15 p-2.5 rounded-xl border border-purple-400/30">
                <input type="checkbox" name="editIsFlash" defaultChecked={editingProduct.isFlashDeal || false} className="accent-purple-500" />
                <span className="font-black text-purple-300">⚡ Feature in Flash Drop</span>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black uppercase">Save</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-3 bg-purple-950 rounded-xl font-black">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
