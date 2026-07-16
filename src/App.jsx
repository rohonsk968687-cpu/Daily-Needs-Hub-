import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy, setDoc, getDoc, writeBatch } from 'firebase/firestore';

// Firebase Setup - Real Credentials Connected
const firebaseConfig = {
  apiKey: "AIzaSyChwU32Co32x2BFk5XQ04Gr_230JexB2KU",
  authDomain: "daily-needs-hub-15205.firebaseapp.com",
  projectId: "daily-needs-hub-15205",
  storageBucket: "daily-needs-hub-15205.firebasestorage.app",
  messagingSenderId: "9944785618",
  appId: "1:9944785618:web:8ebfa1d9cb834a3477c30b",
  measurementId: "G-J06SVVPVZF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const categories = ["All", "Dairy", "Beverages", "Snacks", "Vegetables", "Others"];
const offerTags = ["None", "Today's Deal", "Buy 2 Get 1", "Combo Pack", "Flash Sale"];
const BRAND_LOGO_URL = "/logo.png"; 
const MY_UPI_ID = "8637589429-3@ybl"; 
const ALLOWED_PINS = ["731204", "731240", "731215", "731224", "731236", "731214"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  
  // Isolated Navigation Rules & Security Matrix States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminUrl, setIsAdminUrl] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [activeTab, setActiveTab] = useState("shop"); 
  const [adminTab, setAdminTab] = useState("dashboard"); 
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedOfferFilter, setSelectedOfferFilter] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [legalModal, setLegalModal] = useState({ isOpen: false, title: '', content: '' });
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [flashTime, setFlashTime] = useState(3600); 

  // Combined state management for Profile and Address parameters
  const [custInfo, setCustInfo] = useState({ 
    name: '', 
    gender: 'Male',
    phone: '',
    vill: '', 
    landmark: '', 
    city: 'Nanoor',
    pin: '' 
  });

  const [slides, setSlides] = useState([
    { id: 1, img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80", text: "⚡ FLASH SALE LIVE: Grab Offers Instantly!" },
    { id: 2, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80", text: "🥤 COLD DRINKS & BEVERAGES: Garmi ka Ilaaj" },
    { id: 3, img: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=500&q=80", text: "🛒 GROCERY ESSENTIALS: Fresh Stock Everyday" },
    { id: 4, img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&q=80", text: "🥛 FRESH DAIRY PRODUCTS: Delivery at Doorstep" },
    { id: 5, img: "https://images.unsplash.com/photo-1543168256-418811576931?w=500&q=80", text: "🥬 FARM FRESH VEGETABLES: 100% Organic" }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);

  // Verification routing path allocation hooks
  useEffect(() => {
    if (window.location.pathname === "/admin" || window.location.hash === "#admin") {
      setIsAdminUrl(true);
    } else {
      setIsAdminUrl(false);
    }
  }, []);

  // Load cloud data structure metrics for profiles and carts
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const loadUserCloudData = async () => {
        // Load User Cart
        const cartDoc = await getDoc(doc(db, "carts", user.uid));
        if (cartDoc.exists()) {
          setCart(cartDoc.data().items || []);
        }
        // Load Profile & Location Data Meta Node
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) {
          setCustInfo(prev => ({ ...prev, ...profileDoc.data() }));
        }
      };
      loadUserCloudData();
    } else {
      const localCart = localStorage.getItem("dnh_guest_cart");
      if (localCart) {
        try { setCart(JSON.parse(localCart)); } catch(e) { console.log(e); }
      }
      const localProfile = localStorage.getItem("dnh_saved_address");
      if (localProfile) {
        try { setCustInfo(prev => ({ ...prev, ...JSON.parse(localProfile) })); } catch(e) {}
      }
    }
  }, [user]);

  const syncCart = async (updatedCart) => {
    setCart(updatedCart);
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "carts", user.uid), { items: updatedCart }, { merge: true });
    } else {
      localStorage.setItem("dnh_guest_cart", JSON.stringify(updatedCart));
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
        setCustInfo(prev => ({ ...prev, name: prev.name || currentUser.displayName || '' }));
      } else {
        setUser(null);
        if (!currentUser) {
          signInAnonymously(auth).catch(e => console.log("Anon auth bypass"));
        }
      }
    });

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    const flashTimer = setInterval(() => {
      setFlashTime(prev => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    
    const qProd = query(collection(db, "products"), orderBy("name"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qOrder = collection(db, "orders");
    const unsubOrder = onSnapshot(qOrder, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qNotif = collection(db, "notifications");
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { 
      clearInterval(timer); 
      clearInterval(flashTimer);
      unsubProd(); 
      unsubOrder(); 
      unsubNotif();
      unsubscribeAuth(); 
    };
  }, [slides.length]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if(result.user) {
        setUser(result.user);
      }
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCart([]);
    localStorage.removeItem("dnh_guest_cart");
    setCustInfo({ name: '', gender: 'Male', phone: '', vill: '', landmark: '', city: 'Nanoor', pin: '' });
    alert("Logged out successfully!");
  };

  const saveProfileDataToCloud = async () => {
    if (!custInfo.name || !custInfo.phone) return alert("Profile ke liye Name aur Phone parameters mandatory hain!");
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("dnh_saved_address", JSON.stringify(custInfo));
    alert("Profile parameters updated inside live database successfully!");
  };

  const saveAddressToLocal = async () => {
    if (!custInfo.vill || !custInfo.pin || !custInfo.city) return alert("Village, City aur Area PIN Code zaroori hain!");
    if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return alert(`Sorry! We do not deliver to ${custInfo.pin} yet. Please enter Nanoor/Bolpur verified pin code.`);
    }
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("dnh_saved_address", JSON.stringify(custInfo));
    alert("Shipping logistics coordinates verified and saved securely!");
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p) => {
    if (p.stock <= 0) return alert("OutOfStock: Item bacha nahi hai!");
    const exist = cart.find(x => x.id === p.id);
    let updatedCart = [];
    if (exist) {
      if (exist.qty >= p.stock) return alert("Stock limit reached!");
      updatedCart = cart.map(x => x.id === p.id ? { ...exist, qty: exist.qty + 1 } : x);
    } else {
      updatedCart = [...cart, { ...p, qty: 1 }];
    }
    syncCart(updatedCart);
  };

  const updateCartQty = (id, delta) => {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    const nextQty = item.qty + delta;
    let updatedCart = [];
    if (nextQty <= 0) {
      updatedCart = cart.filter(x => x.id !== id);
    } else {
      if (delta > 0 && nextQty > item.stock) return alert("Stock limit exceeded!");
      updatedCart = cart.map(x => x.id === id ? { ...item, qty: nextQty } : x);
    }
    syncCart(updatedCart);
  };

  const toggleWishlist = (p) => {
    const exist = wishlist.find(x => x.id === p.id);
    if (exist) {
      setWishlist(wishlist.filter(x => x.id !== p.id));
    } else {
      setWishlist([...wishlist, p]);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const el = e.target.elements;
    const imgArray = el.itemImg.value.split(",").map(url => url.trim());

    try {
      await addDoc(collection(db, "products"), { 
        name: el.itemName.value, 
        price: Number(el.itemPrice.value), 
        stock: Number(el.itemStock.value),
        discount: Number(el.itemDiscount.value) || 0, 
        images: imgArray.length > 0 && imgArray[0] !== "" ? imgArray : ["📦"], 
        category: el.itemCategory.value,
        offerTag: el.itemOfferTag.value || "None",
        specifications: el.itemSpecs.value || "No specifications loaded.",
        isBestSeller: el.bestSeller.checked,
        isNewArrival: el.newArrival.checked
      });
      e.target.reset();
      alert("Saaman jud gaya!");
    } catch (error) {
      alert("Database error!");
    }
  };

  const sendBroadcastNotification = async (e) => {
    e.preventDefault();
    const text = e.target.elements.notifText.value;
    if(!text) return;
    try {
      await addDoc(collection(db, "notifications"), {
        message: text,
        createdAt: new Date().toLocaleTimeString()
      });
      e.target.reset();
      alert("Notification Broadcasted Live!");
    } catch(err) { alert("Error broadcasting notification"); }
  };

  const updateProductData = async (id, field, value) => {
    let finalVal = value;
    if (field === "stock" || field === "price" || field === "discount") {
      finalVal = Number(value);
    }
    await updateDoc(doc(db, "products", id), { [field]: finalVal });
  };

  const updateOrderStatus = async (id, nextStatus) => {
    await updateDoc(doc(db, "orders", id), { status: nextStatus });
    alert("Order status updated successfully!");
  };

  const updateOrderPaymentStatus = async (id, nextPayStatus) => {
    await updateDoc(doc(db, "orders", id), { paymentStatus: nextPayStatus });
    alert("Payment verification status updated inside cloud database!");
  };

  const getSalesAnalytics = () => {
    const todayStr = new Date().toLocaleDateString();
    let todayVol = 0, weeklyVol = 0, monthlyVol = 0;
    
    orders.forEach(o => {
      const amt = Number(o.totalAmount) || 0;
      const orderDate = o.createdAt ? o.createdAt.split(',')[0] : '';
      
      if (orderDate === todayStr) {
        todayVol += amt;
      }
      weeklyVol += amt;
      monthlyVol += amt;
    });

    const averageTicketSize = orders.length > 0 ? Math.round(monthlyVol / orders.length) : 0;
    return { today: todayVol, weekly: weeklyVol, monthly: monthlyVol, avgTicket: averageTicketSize };
  };

  const salesMetrics = getSalesAnalytics();
  const outOfStockAlerts = products.filter(p => p.stock < 5);
  const cartTotal = cart.reduce((a, c) => a + getDiscountedPrice(c.price, c.discount) * c.qty, 0);
  
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "offers") {
      if (selectedOfferFilter === "Flash Sale") {
        return matchesSearch && p.offerTag === "Flash Sale";
      }
      const isOfferItem = p.offerTag && p.offerTag !== "None";
      const matchesOfferFilter = selectedOfferFilter === "All" || p.offerTag === selectedOfferFilter;
      return matchesSearch && isOfferItem && matchesOfferFilter;
    } else {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    }
  });

  const handleCheckoutInit = async () => {
    if(!custInfo.name || !custInfo.vill || !custInfo.pin || !custInfo.phone || !custInfo.city) {
      return alert("Naam, Phone, Village, City aur PIN Code bharna zaruri hai! Please check your profile configurations.");
    }
    if(!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return alert(`We cannot process this order! Currently we do not deliver to PIN: ${custInfo.pin}. Please use Bolpur or Nanoor valid address.`);
    }

    const fullAddressString = `${custInfo.vill}, ${custInfo.city}, Landmark: ${custInfo.landmark || 'N/A'}, PIN: ${custInfo.pin}`;
    
    try {
      const batch = writeBatch(db);
      let outOfStockFlag = false;
      let blockedItemName = "";

      for (let item of cart) {
        const prodRef = doc(db, "products", item.id);
        const prodSnap = await getDoc(prodRef);
        
        if (prodSnap.exists()) {
          const currentStock = prodSnap.data().stock || 0;
          if (currentStock < item.qty) {
            outOfStockFlag = true;
            blockedItemName = item.name;
            break;
          }
          batch.update(prodRef, { stock: currentStock - item.qty });
        }
      }

      if (outOfStockFlag) {
        return alert(`Sorry! ${blockedItemName} is out of stock or requested quantity exceeds available inventory.`);
      }

      await batch.commit();

      const docRef = await addDoc(collection(db, "orders"), {
        customerName: custInfo.name,
        phone: custInfo.phone,
        address: fullAddressString,
        userEmail: user ? user.email : "Anonymous",
        items: cart.map(i => ({ name: i.name, qty: i.qty, total: getDiscountedPrice(i.price, i.discount) * i.qty })),
        totalAmount: cartTotal,
        paymentMode: paymentType === "COD" ? "Cash on Delivery (COD)" : "Online UPI Payment",
        paymentStatus: paymentType === "UPI" ? "Awaiting Admin Verification ⏳" : "COD Pending Delivery",
        utr: paymentType === "UPI" ? "AUTO-UPI-INTENT" : "COD Mode Verification Complete",
        status: "Pending ⏳",
        createdAt: new Date().toLocaleString()
      });
      
      setCurrentOrderId(docRef.id);
      setShowInvoice(true); 
    } catch (e) {
      alert("Checkout error! Please try again.");
    }
  };

  const confirmCODModeSelection = async () => {
    try {
      await updateDoc(doc(db, "orders", currentOrderId), {
        paymentMode: "Cash on Delivery (COD)",
        paymentStatus: "COD Pending Delivery",
        utr: "COD Mode Verification Complete"
      });
      alert("COD Mode selected successfully for this receipt!");
    } catch(err) {
      console.log("Error updating checkout node");
    }
  };

  const sendWhatsAppNotification = () => {
    const itemsMsg = cart.map(i => `${i.name} (x${i.qty}) - ₹${getDiscountedPrice(i.price, i.discount) * i.qty}`).join(", ");
    const fullAddressString = `${custInfo.vill}, ${custInfo.city}, Landmark: ${custInfo.landmark || 'N/A'}, PIN: ${custInfo.pin}`;
    const modeLabel = paymentType === "COD" ? "Cash on Delivery (COD)" : "UPI Intent Flow Initialized";
    const msg = `Naya Order & Status: ${modeLabel} - Daily Needs Hub\nOrder ID: ${currentOrderId}\nNaam: ${custInfo.name}\nPhone: ${custInfo.phone}\nAddress: ${fullAddressString}\nItems: ${itemsMsg}\nTotal Bill: ₹${cartTotal}`;
    window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
    
    setShowInvoice(false);
    setCart([]);
    syncCart([]);
    setIsCartOpen(false);
  };

  const formatTimer = (time) => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryEmoji = (cat) => {
    switch(cat) {
      case 'All': return '🛍️';
      case 'Dairy': return '🥛';
      case 'Beverages': return '🥤';
      case 'Snacks': return '🍿';
      case 'Vegetables': return '🥬';
      default: return '📦';
    }
  };

  const handleOpenLegal = (type) => {
    let title = '';
    let content = '';

    if (type === 'about') {
      title = "About Our Store 🛒";
      content = `Daily Needs Hub (DNH) is your trusted online neighborhood grocery destination. Established with a mission to bring fresh dairy, farm-fresh vegetables, crisp snacks, and premium beverages straight to your doorstep in Bolpur and Nanoor regions.\n\nWe bridge the gap between quality food sources and your kitchen, ensuring lightning-fast delivery, highly competitive market-beating prices, and verified safe online experiences. Thank you for making us your daily shopping partner!`;
    } else if (type === 'privacy') {
      title = "Privacy Protection Policy 🛡️";
      content = `At Daily Needs Hub, your privacy is our supreme priority:\n\n1. Data Collection: We only collect essential delivery details like your Name, Shipping Address, and Contact Number for order processing.\n2. Payment Safety: We utilize universal secure UPI links. We never store credit cards, bank accounts, or sensitive UPI PINs on our servers.\n3. Account Security: Google Authentication guarantees secure, authorized tracking. We never share or sell customer data with third-party networks. Your trust is fully safe with us.`;
    } else if (type === 'refund') {
      title = "Refund & Return Terms 🔄";
      content = `We want you to shop with absolute confidence. Our easy refund criteria includes:\n\n1. Fresh Goods (Dairy, Vegetables): Eligible for immediate replacement or refund within 3 hours of delivery if found damaged or stale.\n2. Packed Items: Damaged packets or expired batches can be returned at the time of delivery itself.\n3. Refund Method: Approved refunds are credited instantly within 24 hours back to your original payment mode or UPI address.`;
    } else if (type === 'terms') {
      title = "Terms & Conditions 📜";
      content = `Welcome to Daily Needs Hub. By accessing our platform, you agree to these basic guidelines:\n\n1. Pricing: All rates listed on the application are verified and calculated accurately.\n2. Service Area: Currently active across Bolpur, Nanoor, Papuri, and adjacent Birbhum regions.\n3. Order Placement: Orders are confirmed once details are logged on WhatsApp or processed through the cash checkout invoice window. Fraudulent activities or dummy checks will result in account restriction.`;
    } else if (type === 'faq') {
      title = "Help & FAQs Desk ❓";
      content = `Q1. What are your delivery timings?\nAns: We deliver daily from 7:00 AM to 9:00 PM.\n\nQ2. Is there a minimum order limit?\nAns: No, you can order as little or as much as you like!\n\nQ3. How can I pay?\nAns: You can pay instantly using any mobile app like Google Pay, PhonePe, Paytm, or choose cash settlement upon arrival.\n\nQ4. How do I track my active orders?\nAns: Just navigate to the 'Account' tab on the bottom menu bar to see live status updates.`;
    }

    setLegalModal({ isOpen: true, title, content });
  };

  const getOrderStatusProgress = (status) => {
    switch(status) {
      case "Pending ⏳": return 25;
      case "Packed 📦": return 50;
      case "Out for Delivery 🚚": return 75;
      case "Delivered ✅": return 100;
      default: return 10;
    }
  };

  const getUPIIntentLink = () => {
    const merchantName = "Daily Needs Hub";
    const note = "Grocery Order Fast checkout Processing";
    return `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(merchantName)}&am=${cartTotal}&tn=${encodeURIComponent(note)}&cu=INR`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-amber-50/60 via-white to-emerald-50/60 text-gray-900'} pb-32 transition-all duration-500 font-sans`}>
      
      {/* Header View */}
      <header className="p-3 bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-40 flex justify-between items-center border-b border-orange-100 max-w-md mx-auto">
        <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => { if(!isAdmin) { setActiveTab("shop"); } }}>
          <img src={BRAND_LOGO_URL} alt="Logo" className="w-12 h-12 object-contain rounded-xl shadow-sm bg-orange-50 p-0.5" />
          <div className="flex flex-col items-start min-w-0">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-emerald-600 to-blue-600 tracking-tight uppercase leading-none">
              Daily Needs Hub
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
           {!isAdmin && (
             <>
               <button onClick={() => setIsNotifOpen(true)} className="p-2 bg-gray-100 rounded-full text-xs relative text-black">
                 🔔 {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{notifications.length}</span>}
               </button>
               <button onClick={() => setIsWishlistOpen(true)} className="p-2 bg-gray-100 rounded-full text-xs">❤️</button>
             </>
           )}
           {!user && !isAdmin && (
             <button onClick={handleGoogleLogin} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-md">
               Login
             </button>
           )}
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 rounded-full text-xs text-black">{darkMode ? '☀️' : '🌙'}</button>
        </div>
      </header>

      {/* Sticky Custom Search Bar on Top of layout */}
      {!isAdmin && !isAdminUrl && activeTab === "shop" && (
        <div className="sticky top-[69px] z-30 px-4 py-2 bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100 max-w-md mx-auto">
          <input 
            type="text" placeholder="🔍 Search fresh milk, cold drinks, snacks..." 
            className="w-full p-3 bg-white rounded-2xl border-2 border-orange-100 text-xs focus:border-emerald-500 focus:outline-none transition-all text-black font-semibold shadow-inner"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="max-w-md mx-auto">

        {/* ISOLATED ADMIN ROUTING INFRASTRUCTURE PANEL GRID */}
        {isAdminUrl ? (
          <div className="p-4">
            <div className="bg-white p-6 rounded-3xl shadow-xl text-black space-y-6 border border-orange-100">
               <h2 className="text-xl font-bold mb-2 text-orange-600 text-center uppercase tracking-wider">Secure Access Node</h2>
               {!isAdmin ? (
                 <div className="space-y-4">
                   <p className="text-[11px] text-center font-bold text-gray-400">Enter high-grade secure protocol password key to active structural dashboards</p>
                   <input 
                     type="password" 
                     placeholder="Enter Control Key Password" 
                     value={adminPassword}
                     className="border-2 p-3 w-full rounded-xl text-center font-black tracking-widest bg-gray-50 focus:outline-none" 
                     onChange={(e) => {
                       setAdminPassword(e.target.value);
                       if(e.target.value === 'Younus@968687') { setIsAdmin(true); setAdminTab("dashboard"); }
                     }} 
                   />
                 </div>
               ) : (
                 <div className="space-y-6">
                    
                    {/* Sales Dashboard Analytics Engine Module (Admin Tab 1) */}
                    {adminTab === "dashboard" && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 rounded-3xl p-5 text-white space-y-4 shadow-xl border border-slate-800">
                          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase">Live Sales Performance Engine</h3>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase">Today</p>
                              <p className="text-sm font-black text-emerald-400 mt-0.5">₹{salesMetrics.today}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase">Weekly Split</p>
                              <p className="text-sm font-black text-teal-400 mt-0.5">₹{salesMetrics.weekly}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase">Monthly Split</p>
                              <p className="text-sm font-black text-indigo-400 mt-0.5">₹{salesMetrics.monthly}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[11px] font-bold text-gray-300">
                            <span>Average Ticket Size / User Order:</span>
                            <span className="text-yellow-400 font-black text-xs">₹{salesMetrics.avgTicket}</span>
                          </div>
                        </div>

                        {/* Inventory Radar Matrix */}
                        <div className="bg-white p-4 rounded-3xl border border-red-100 shadow-sm space-y-3 text-black">
                          <h4 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-1">⚠️ Inventory Low Stock Alert Radar</h4>
                          <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                            {outOfStockAlerts.length === 0 ? (
                              <p className="text-[10px] font-bold text-gray-400 text-center py-4">All stocks are perfectly loaded above metrics.</p>
                            ) : (
                              outOfStockAlerts.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-xs p-2.5 bg-red-50/60 border border-red-100 rounded-xl font-bold">
                                  <span className="truncate max-w-[200px]">{p.name}</span>
                                  <span className="bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md">{p.stock} units left</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Item Form Payload Engine (Admin Tab 2) */}
                    {adminTab === "add-item" && (
                      <form onSubmit={addProduct} className="bg-white p-2 rounded-3xl grid gap-3 text-black">
                        <h3 className="text-xs font-black text-orange-600 uppercase tracking-wider">📦 Inject New Stock Payload</h3>
                        <input name="itemName" placeholder="Item / Product Name Title *" className="border p-3 rounded-xl bg-gray-50 text-xs font-semibold" required />
                        <div className="grid grid-cols-3 gap-2">
                          <input name="itemPrice" type="number" placeholder="Price (₹) *" className="border p-3 rounded-xl bg-gray-50 text-xs font-semibold" required />
                          <input name="itemDiscount" type="number" placeholder="Disc %" className="border p-3 rounded-xl bg-gray-50 text-xs font-semibold" />
                          <input name="itemStock" type="number" placeholder="Stock Qty *" className="border p-3 rounded-xl bg-gray-50 text-xs font-semibold" required />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black p-2.5 bg-gray-50 rounded-xl border">
                          <label className="flex items-center gap-1"><input type="checkbox" name="bestSeller" /> ✨ BestSeller</label>
                          <label className="flex items-center gap-1"><input type="checkbox" name="newArrival" /> 🚀 New Arrival</label>
                          <select name="itemOfferTag" className="p-1 border bg-white rounded font-bold text-[9px]">
                            {offerTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                          </select>
                        </div>
                        <input name="itemImg" placeholder="Multiple Links (Separated by Comma)" className="border p-3 rounded-xl bg-gray-50 text-xs font-semibold" required />
                        <textarea name="itemSpecs" placeholder="Product Details / Specifications" className="border p-3 rounded-xl bg-gray-50 text-xs font-semibold" rows="2" />
                        
                        <select name="itemCategory" className="border p-3 rounded-xl bg-gray-50 text-xs font-black">
                          {categories.slice(1).map(c => <option key={c} value={c}>{c} Section</option>)}
                        </select>
                        <button type="submit" className="bg-orange-600 text-white p-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow">ADD PRODUCT TO LIVE NODES</button>
                      </form>
                    )}

                    {/* Quick Counters Inventory Manager Sheet (Admin Tab 3) */}
                    {adminTab === "manage-items" && (
                      <div className="bg-white rounded-3xl space-y-4 text-black">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b pb-2">📋 Stock Controller Grid Metadata</h3>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                          {products.map(p => {
                            const isLow = p.stock < 5;
                            return (
                              <div key={p.id} className={`p-3 rounded-2xl flex flex-col gap-2 border transition-all ${isLow ? 'bg-red-50/40 border-red-200' : 'bg-gray-50/50'}`}>
                                <div className="flex justify-between items-start">
                                  <span className="text-xs font-black text-gray-800 truncate max-w-[70%]">{p.name}</span>
                                  <button onClick={async () => { if(window.confirm("Delete asset item?")) await deleteDoc(doc(db, "products", p.id)); }} className="text-[10px] text-red-500 font-bold underline">Delete</button>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-dashed">
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                                    <span>MRP: ₹{p.price}</span>
                                    <span>|</span>
                                    <span>Disc: {p.discount || 0}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => updateProductData(p.id, "stock", Math.max(0, p.stock - 1))} className="w-6 h-6 bg-white border font-black text-xs rounded-md shadow-sm flex items-center justify-center">-</button>
                                    <span className={`text-xs font-black px-2 ${isLow ? 'text-red-600' : 'text-slate-800'}`}>Stock: {p.stock}</span>
                                    <button onClick={() => updateProductData(p.id, "stock", p.stock + 1)} className="w-6 h-6 bg-white border font-black text-xs rounded-md shadow-sm flex items-center justify-center">+</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Orders Pipeline Engine Room (Admin Tab 4) */}
                    {adminTab === "orders" && (
                      <div className="space-y-3 text-black">
                        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                          <h3 className="text-xs font-black text-blue-800 uppercase tracking-wider">📦 Customer Order Pipelines Stream ({orders.length})</h3>
                        </div>
                        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                          {orders.map(ord => (
                            <div key={ord.id} className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-2 text-xs">
                              <div className="flex justify-between font-black border-b pb-1 text-gray-400">
                                <span>ID: ...{ord.id.slice(-6)}</span>
                                <span className="text-orange-600">₹{ord.totalAmount}</span>
                              </div>
                              <p><b>Grahak:</b> {ord.customerName}</p>
                              <p className="text-gray-600"><b>Address:</b> {ord.address}</p>
                              <p className="text-blue-700 font-bold"><b>Mode Selection:</b> {ord.paymentMode || "Online UPI payment"}</p>
                              <div className="flex items-center gap-1.5 font-bold">
                                <span>Verification Parameter:</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] ${ord.paymentStatus?.includes("Awaiting") ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                  {ord.paymentStatus || "Awaiting Admin Verification ⏳"}
                                </span>
                              </div>
                              {ord.utr && <p className="bg-gray-50 p-1 text-[10px] font-mono text-gray-500">Ref ID: {ord.utr}</p>}
                              
                              <div className="flex justify-between items-center pt-2 border-t gap-2">
                                <a href={`tel:${ord.phone || '8637589429'}`} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-200 rounded-xl font-black text-[10px] flex items-center gap-1 shadow-sm uppercase tracking-wide">
                                  📞 Call Buyer
                                </a>

                                {ord.paymentStatus?.includes("Awaiting") && (
                                  <button 
                                    onClick={() => updateOrderPaymentStatus(ord.id, "Approved & Paid ✅")}
                                    className="bg-emerald-600 text-white font-black text-[9px] px-2 py-1.5 rounded-xl uppercase tracking-wider shadow"
                                  >
                                    ✓ Approve Payment
                                  </button>
                                )}
                                
                                <select 
                                  className="p-1.5 border rounded-xl bg-gray-50 font-black text-[10px] shadow-sm text-slate-800"
                                  onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                                  defaultValue={ord.status}
                                >
                                  <option value="Pending ⏳">Pending ⏳</option>
                                  <option value="Packed 📦">Packed 📦</option>
                                  <option value="Out for Delivery 🚚">Out for Delivery 🚚</option>
                                  <option value="Delivered ✅">Delivered ✅</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Broadcast push element trigger room */}
                    {adminTab === "dashboard" && (
                      <div className="bg-white p-2 rounded-3xl">
                        <form onSubmit={sendBroadcastNotification} className="space-y-2">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">📢 Inject Broadcast Announcement</h3>
                          <input name="notifText" placeholder="Kya message push karna chahte hain?" className="w-full p-2.5 text-xs border bg-gray-50 rounded-xl text-black font-semibold" required />
                          <button type="submit" className="w-full bg-slate-900 text-white font-black p-2.5 text-xs rounded-xl shadow">Broadcast Alert</button>
                        </form>
                      </div>
                    )}

                 </div>
               )}
            </div>
          </div>
        ) : (
          /* =========================================
             CUSTOMER APPLICATION LAYOUT INTERFACES
             ========================================= */
          <>
            {activeTab === "shop" && (
              <>
                <div className="px-4 mb-4">
                  <div className="bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <h2 className="text-2xl font-black mb-1">Hello, {custInfo.name || "Guest Grahak"}! 👋</h2>
                    <p className="text-xs opacity-90 italic">Fresh Items, Best Price, Seedha Ghar Tak.</p>
                  </div>
                </div>

                {/* Flash Timer Tracker Banner */}
                <div className="px-4 mb-4">
                  <div className="bg-gradient-to-r from-red-600 to-pink-600 p-4 rounded-2xl text-white flex justify-between items-center shadow-lg">
                    <div>
                      <span className="bg-white text-red-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">🔥 Flash Deal</span>
                      <h4 className="text-sm font-black mt-1">Super Saving Hour Active</h4>
                    </div>
                    <div className="text-right font-mono bg-black/30 px-3 py-1.5 rounded-xl border border-white/20">
                      <p className="text-[8px] uppercase tracking-wider text-red-200">Ends In</p>
                      <p className="text-sm font-black text-yellow-300">{formatTimer(flashTime)}</p>
                    </div>
                  </div>
                </div>

                {/* Promos slider dynamic engine layout */}
                <div className="px-4 mb-4">
                  <div className="relative h-44 w-full overflow-hidden rounded-3xl shadow-xl border-2 border-white bg-gray-100">
                    {slides.map((s, idx) => (
                      <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <img src={s.img} alt="Promo banner" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
                          <p className="text-xs font-black bg-orange-600/80 px-2 py-0.5 rounded-md inline-block">{s.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "categories" && (
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 rounded-3xl text-white mb-6 shadow-md">
                  <h2 className="text-xl font-black">All Categories</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(c => (
                    <button key={c} onClick={() => { setActiveCategory(c); setActiveTab("shop"); }} className={`p-6 rounded-2xl bg-white text-left shadow-md border-2 font-black flex flex-col justify-between h-28 ${activeCategory === c ? 'border-orange-500 text-orange-600' : 'border-gray-100 text-gray-700'}`}>
                      <span className="text-3xl">{getCategoryEmoji(c)}</span>
                      <span className="text-sm">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "offers" && (
              <div className="px-4 mb-2">
                <div className="bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 p-6 rounded-3xl text-white shadow-xl mb-4">
                  <h2 className="text-2xl font-black mb-1">⚡ SPECIAL OFFERS ZONE</h2>
                </div>
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {["All", "Today's Deal", "Buy 2 Get 1", "Combo Pack", "Flash Sale"].map(tag => (
                    <button key={tag} onClick={() => setSelectedOfferFilter(tag)} className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${selectedOfferFilter === tag ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-100'}`}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            {/* UPGRADED PROFESSIONAL CUSTOMER ACCOUNT MODULE (My Profile + Saved Address + My Orders) */}
            {activeTab === "account" && (
              <div className="px-4 space-y-6 text-black">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-3xl text-white shadow-md">
                  <h2 className="text-xl font-black">👤 Account Hub</h2>
                  <p className="text-xs opacity-80">Profile configurations & saved logistics</p>
                </div>

                {/* Google Connection Authentication Node */}
                <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between">
                  <div>
                    {user ? (
                      <>
                        <h4 className="font-extrabold text-sm text-gray-800">{custInfo.name || user.displayName}</h4>
                        <p className="text-[10px] text-gray-400 font-bold">{user.email}</p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-extrabold text-sm text-gray-800">Welcome, Guest Grahak</h4>
                        <p className="text-[10px] text-gray-400 font-bold">Connect profile for cloud persistent cart sync</p>
                      </>
                    )}
                  </div>
                  {user ? (
                    <button onClick={handleLogout} className="bg-red-50 text-red-500 font-black text-xs px-3 py-2 rounded-xl border border-red-100">Logout</button>
                  ) : (
                    <button onClick={handleGoogleLogin} className="bg-blue-50 text-blue-600 font-black text-xs px-3 py-2 rounded-xl border border-blue-100">Connect Google</button>
                  )}
                </div>

                {/* SECTION 1: My Profile (Name, Gender, Mobile Number) */}
                <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-sm text-gray-800 flex items-center gap-1.5">👤 My Profile Panel</h3>
                    <button onClick={saveProfileDataToCloud} className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border font-black uppercase">Update Profile</button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase">Customer Full Name *</label>
                      <input 
                        type="text" placeholder="Enter Full Name" 
                        value={custInfo.name || ''}
                        className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                        onChange={(e) => setCustInfo({...custInfo, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Gender Selector</label>
                        <select 
                          value={custInfo.gender || 'Male'}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-bold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, gender: e.target.value})}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Mobile Contact Number *</label>
                        <input 
                          type="tel" placeholder="10-Digit Mobile" 
                          value={custInfo.phone || ''}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Saved Shipping Address (Landmark, Vill, City, Pin) */}
                <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-sm text-gray-800 flex items-center gap-1.5">📍 Saved Delivery Address</h3>
                    <button onClick={saveAddressToLocal} className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border font-black uppercase">Save Address</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Village / Locality Name *</label>
                        <input 
                          type="text" placeholder="Enter Village name" 
                          value={custInfo.vill || ''}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, vill: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">City / Town Name *</label>
                        <input 
                          type="text" placeholder="Enter City/Town" 
                          value={custInfo.city || ''}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, city: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Famous Landmark</label>
                        <input 
                          type="text" placeholder="Near school, temple etc." 
                          value={custInfo.landmark || ''}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, landmark: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Area PIN Code *</label>
                        <input 
                          type="number" placeholder="6-Digit PIN Code" 
                          value={custInfo.pin || ''}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, pin: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: My Orders (Order History & Step Track Pipelines) */}
                <div className="space-y-3">
                  <h3 className="font-black text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">📦 My Orders History & Live Tracking</h3>
                  {orders.filter(o => user ? o.userEmail === user.email : true).length === 0 ? (
                    <div className="p-6 text-center bg-white/40 border border-dashed rounded-2xl text-xs font-bold text-gray-400">
                      Koi active purchase history nahi mili bhai!
                    </div>
                  ) : (
                    orders.filter(o => user ? o.userEmail === user.email : true).map(o => (
                      <div key={o.id} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 border-l-4 border-l-orange-500 text-black">
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-gray-400">ID: ...{o.id.slice(-6)}</span>
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] shadow-sm font-black border border-emerald-100">{o.status}</span>
                        </div>
                        
                        {/* Interactive dynamic progress pipeline slider blocks */}
                        <div className="space-y-1">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${getOrderStatusProgress(o.status)}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-tight">
                            <span className={o.status.includes("Pending") ? "text-orange-600 font-extrabold" : ""}>Pending</span>
                            <span className={o.status.includes("Packed") ? "text-orange-600 font-extrabold" : ""}>Packed</span>
                            <span className={o.status.includes("Delivery") ? "text-orange-600 font-extrabold" : ""}>Out for Delivery</span>
                            <span className={o.status.includes("Delivered") ? "text-emerald-600 font-extrabold" : ""}>Delivered</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-600 font-bold border-b pb-1">
                          {o.items.map((it, idx) => <span key={idx}>{it.name} (x{it.qty}), </span>)}
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                          <p className="text-emerald-700">Payment: {o.paymentMode || "Online UPI payment"}</p>
                          {o.paymentStatus && <p className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px]">{o.paymentStatus}</p>}
                        </div>
                        <div className="flex justify-between items-center text-xs font-black pt-1 border-t border-dashed">
                          <span className="text-gray-400">Date: {o.createdAt?.split(',')[0]}</span>
                          <span className="text-orange-600 text-sm">₹{o.totalAmount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Main grid selection rendering workflow */}
            {activeTab !== "categories" && activeTab !== "account" && (
              <>
                {/* Horizontal sliders indicators directly embedded */}
                <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-transparent max-w-md mx-auto no-scrollbar">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black border transition-all duration-300 transform active:scale-95 whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-100'}`}
                    >
                      {getCategoryEmoji(cat)} {cat}
                    </button>
                  ))}
                </div>

                <main className="p-4 grid grid-cols-2 gap-4">
                  {filtered.map(p => {
                    const hasDiscount = p.discount > 0;
                    const finalPrice = getDiscountedPrice(p.price, p.discount);
                    const isWish = wishlist.find(x => x.id === p.id);
                    const pImages = p.images || [p.img || "📦"];
                    const isOutOfStock = p.stock <= 0;
                    return (
                      <div key={p.id} className="bg-white p-3 rounded-[2rem] shadow-md border-2 border-orange-100/60 relative flex flex-col justify-between text-black">
                         <div className="absolute top-3 left-3 Combined-Node z-10 flex flex-col gap-1">
                            {isOutOfStock ? (
                              <span className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Out of Stock</span>
                            ) : (
                              <>
                                {p.offerTag && p.offerTag !== "None" && <span className="bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">{p.offerTag}</span>}
                                {hasDiscount && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{p.discount}% OFF</span>}
                              </>
                            )}
                         </div>
                         
                         <button onClick={() => toggleWishlist(p)} className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-xs">
                           {isWish ? "❤️" : "🤍"}
                         </button>

                         <div onClick={() => { setSelectedProduct(p); setCurrentProductSlide(0); }} className="h-32 flex items-center justify-center mb-2 bg-gradient-to-b from-orange-50/50 via-white to-emerald-50/30 rounded-2xl overflow-hidden cursor-pointer">
                           {pImages[0].includes('http') ? <img src={pImages[0]} alt="product" className="h-full w-full object-cover rounded-2xl" /> : <span className="text-5xl">{pImages[0]}</span>}
                         </div>

                         <div className="px-1 text-center flex-1 flex flex-col justify-between">
                           <div>
                             <h3 onClick={() => { setSelectedProduct(p); setCurrentProductSlide(0); }} className="font-extrabold text-gray-800 text-xs truncate cursor-pointer underline">{p.name}</h3>
                             <div className="flex items-center justify-center gap-2 mt-0.5">
                               <span className="text-base font-black text-orange-600">₹{finalPrice}</span>
                               {hasDiscount && <span className="text-[10px] text-gray-400 line-through font-bold">₹{p.price}</span>}
                             </div>
                           </div>
                           <div className="mt-2 space-y-1">
                             {isOutOfStock ? (
                               <button disabled className="w-full py-2 bg-gray-200 text-gray-400 rounded-xl text-[10px] font-bold cursor-not-allowed">OUT OF STOCK</button>
                             ) : (
                               <>
                                 <button onClick={() => { addToCart(p); alert("Added to cart drawer!"); }} className="w-full py-1.5 bg-gray-100 text-gray-700 font-extrabold rounded-xl text-[10px] border border-gray-200 shadow-sm active:scale-95 transition-all">
                                   ADD TO CART
                                 </button>
                                 <button onClick={() => { addToCart(p); setIsCartOpen(true); }} className="w-full py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black rounded-xl text-[10px] shadow-sm active:scale-95 transition-all">
                                   ORDER NOW
                                 </button>
                               </>
                             )}
                           </div>
                         </div>
                      </div>
                    );
                  })}
                </main>
              </>
            )}

            {/* Corporate Footer System */}
            {activeTab === "shop" && (
              <footer className="mx-4 my-8 pt-6 text-gray-800 space-y-6 mb-28 border-t border-gray-200/60">
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-black">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2 text-center">🏆 Why Choose Daily Needs Hub</h4>
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                    <div className="flex items-center gap-1">⚡ <span><b>Fast Delivery:</b> Seedha aapke ghar tak shipping</span></div>
                    <div className="flex items-center gap-1">💰 <span><b>Best Price:</b> Subse sasta rate market se kam</span></div>
                    <div className="flex items-center gap-1">🛡️ <span><b>Secure Payment:</b> Verified Instant Engine</span></div>
                    <div className="flex items-center gap-1">⏰ <span><b>24x7 Support:</b> Hamesha aapki sewa me tayaar</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center">
                  <img src={BRAND_LOGO_URL} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                  <div>
                    <h3 className="text-base font-black uppercase">Daily Needs Hub</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Everyday Needs, Delivered Fast</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs font-bold text-gray-700 text-center">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 font-black uppercase">Company Info</p>
                    <p onClick={() => handleOpenLegal('about')} className="hover:underline cursor-pointer">About Our Hub</p>
                    <p onClick={() => handleOpenLegal('faq')} className="hover:underline cursor-pointer font-bold">Help & FAQs</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 font-black uppercase">Legal Protocols</p>
                    <p onClick={() => handleOpenLegal('privacy')} className="hover:underline cursor-pointer">Privacy Policy</p>
                    <p onClick={() => handleOpenLegal('refund')} className="hover:underline cursor-pointer">Refund & Returns</p>
                    <p onClick={() => handleOpenLegal('terms')} className="hover:underline cursor-pointer">Terms & Conditions</p>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col items-center">
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase text-center">Follow With Us</p>
                  <div className="flex gap-4">
                    <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                      <span>🌐</span> Facebook Official
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-100 shadow-sm">
                      <span>📸</span> Instagram Connect
                    </a>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-600 font-bold border-t pt-2 text-center">
                  <p>📞 Helpline: <a href="tel:+918637589429" className="text-emerald-600 underline">+91 8637589429</a></p>
                  <p>✉️ Mail desk: <a href="mailto:dailyneedshub@gmail.com" className="text-orange-600 underline">dailyneedshub@gmail.com</a></p>
                </div>

                <div className="text-[10px] font-extrabold text-gray-400 pt-2 border-t text-center leading-relaxed">
                  📍 Bolpur to Palitpur Road, Near Al Ameen Mission, Papuri, Nanoor, Birbhum, West Bengal, 731240
                </div>
              </footer>
            )}

            {/* Bottom Nav Bar Navigation Dock */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-orange-100 p-2 z-40 flex justify-around items-center rounded-t-[2rem] shadow-xl text-black max-w-md mx-auto">
              <button onClick={() => { setActiveTab("shop"); setActiveCategory("All"); }} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "shop" ? "text-orange-600 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🏠</span><span className="text-[10px]">Home</span>
              </button>
              <button onClick={() => setActiveTab("categories")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "categories" ? "text-emerald-600 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🗂️</span><span className="text-[10px]">Category</span>
              </button>
              <button onClick={() => setActiveTab("offers")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "offers" ? "text-red-500 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🎁</span><span className="text-[10px]">Offers</span>
              </button>
              <button onClick={() => setActiveTab("account")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "account" ? "text-blue-600 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">👤</span><span className="text-[10px]">Account</span>
              </button>
              <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center p-2 bg-gradient-to-r from-orange-500 to-emerald-500 text-white rounded-2xl px-2.5 py-1 shadow-md">
                <span className="text-[10px] font-black">🛒 Cart</span>
                <span className="text-[9px]">₹{cartTotal}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Special Dual Bottom Admin Navigation Dock */}
      {isAdminUrl && isAdmin && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-950 text-white border-t border-slate-800 p-2 z-50 flex justify-around items-center rounded-t-3xl shadow-2xl max-w-md mx-auto">
          <button onClick={() => setAdminTab("dashboard")} className={`flex flex-col items-center p-2 text-xs font-black ${adminTab === "dashboard" ? 'text-emerald-400 scale-105' : 'text-slate-500'}`}>
            <span>📊</span><span>Dashboard</span>
          </button>
          <button onClick={() => setAdminTab("add-item")} className={`flex flex-col items-center p-2 text-xs font-black ${adminTab === "add-item" ? 'text-orange-400 scale-105' : 'text-slate-500'}`}>
            <span>➕</span><span>Add Stock</span>
          </button>
          <button onClick={() => setAdminTab("manage-items")} className={`flex flex-col items-center p-2 text-xs font-black ${adminTab === "manage-items" ? 'text-yellow-400 scale-105' : 'text-slate-500'}`}>
            <span>📋</span><span>Stock Grid</span>
          </button>
          <button onClick={() => setAdminTab("orders")} className={`flex flex-col items-center p-2 text-xs font-black ${adminTab === "orders" ? 'text-blue-400 scale-105' : 'text-slate-500'}`}>
            <span>🚚</span><span>Orders Room</span>
          </button>
        </div>
      )}

      {/* Cart Drawer System */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-[2rem] text-black flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-orange-600">Shopping Cart Drawer</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-xs font-bold text-gray-400 border p-1 rounded-lg">Close X</button>
              </div>
              <div className="space-y-3 mb-6">
                <input placeholder="Customer Full Name *" value={custInfo.name} className="w-full p-3 border rounded-xl bg-gray-50 text-sm font-bold text-black" onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Select Payment Option</label>
                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <button 
                      onClick={() => setPaymentType("UPI")} 
                      className={`p-2 rounded-xl text-xs font-black border transition-all ${paymentType === "UPI" ? 'bg-orange-500 text-white border-orange-600' : 'bg-gray-50 text-gray-600'}`}
                    >
                      📱 Pay via UPI
                    </button>
                    <button 
                      onClick={() => setPaymentType("COD")} 
                      className={`p-2 rounded-xl text-xs font-black border transition-all ${paymentType === "COD" ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-gray-50 text-gray-600'}`}
                    >
                      💵 Pay on Delivery
                    </button>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-xl text-[10px] font-bold text-amber-800 border border-amber-200">
                  ⚠️ Deliveries are processed using profile criteria saved inside your Account tab Dashboard panel.
                </div>
              </div>

              {/* Advanced Cart Quantity Controls */}
              <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 font-bold py-10">Aapka cart khali hai bhai!</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2.5 border-b text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-gray-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-orange-500 font-bold">₹{getDiscountedPrice(item.price, item.discount)} / unit</p>
                      </div>
                      <div className="flex items-center gap-2.5 ml-4">
                        <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 bg-gray-100 border text-gray-800 rounded-lg flex items-center justify-center font-black text-sm active:bg-gray-200">-</button>
                        <span className="font-black text-sm w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 bg-gray-100 border text-gray-800 rounded-lg flex items-center justify-center font-black text-sm active:bg-gray-200">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-xl font-black mb-4 text-emerald-600"><span>Grand Total:</span><span>₹{cartTotal}</span></div>
              <button onClick={handleCheckoutInit} className="w-full bg-gradient-to-r from-orange-500 to-emerald-500 text-white py-3.5 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all">
                Proceed to Checkout Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Deep View Slideshow & Details Sheet */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 text-black overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm truncate">{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-xs bg-gray-100 px-2.5 py-1 rounded-lg font-bold">X Close</button>
            </div>

            <div className="relative h-44 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border">
              <img 
                src={(selectedProduct.images || [selectedProduct.img || "📦"])[currentProductSlide]} 
                alt="Product View" 
                className="w-full h-full object-cover"
              />
              {(selectedProduct.images || []).length > 1 && (
                <div className="absolute inset-x-2 bottom-2 flex justify-between">
                  <button onClick={() => setCurrentProductSlide(prev => (prev > 0 ? prev - 1 : (selectedProduct.images.length - 1)))} className="bg-white/80 p-1 rounded-full text-xs shadow font-black">◀</button>
                  <button onClick={() => setCurrentProductSlide(prev => (prev < (selectedProduct.images.length - 1) ? prev + 1 : 0))} className="bg-white/80 p-1 rounded-full text-xs shadow font-black">▶</button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Product Specifications</span>
              <p className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedProduct.specifications || "Premium high quality checked grocery asset."}
              </p>
            </div>

            <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); alert("Added to Bag!"); }} className="w-full bg-orange-600 text-white font-black py-3 rounded-xl text-xs uppercase shadow">
              Add This Item to Bag
            </button>
          </div>
        </div>
      )}

      {/* Wishlist Favorites Drawer Panel */}
      {isWishlistOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[70vh] overflow-y-auto text-black space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm">❤️ My Wishlist Favorites ({wishlist.length})</h3>
              <button onClick={() => setIsWishlistOpen(false)} className="text-xs font-bold text-gray-400">X</button>
            </div>
            {wishlist.length === 0 ? (
              <p className="text-xs font-bold text-center text-gray-400 py-10">Koi item favorite nahi kiya gaya.</p>
            ) : (
              wishlist.map(w => (
                <div key={w.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-xl border">
                  <span className="font-bold truncate max-w-[150px]">{w.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => addToCart(w)} className="bg-orange-500 text-white p-1 px-2 rounded font-bold text-[10px]">Move to Bag</button>
                    <button onClick={() => toggleWishlist(w)} className="text-red-500 font-bold">🗑</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Push Announcements Module Sheet */}
      {isNotifOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[60vh] overflow-y-auto text-black space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm">🔔 Store Announcements</h3>
              <button onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-gray-400">X</button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs font-bold text-center text-gray-400 py-10">Koi naya message nahi mila.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
                  <p className="font-medium text-blue-900">{n.message}</p>
                  <span className="text-[8px] text-gray-400 block text-right font-bold">{n.createdAt}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Highly Professional Cash Memo Invoice Panel */}
      {showInvoice && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-double border-orange-200 text-black space-y-5 my-10">
            
            <div className="text-center border-b-2 border-dashed border-gray-200 pb-3 space-y-0.5">
              <h2 className="text-2xl font-black uppercase tracking-tight text-orange-600">
                DAILY NEEDS HUB
              </h2>
              <p className="text-[9px] font-bold text-gray-500 uppercase">Premium Retail Cash Memo</p>
              <p className="text-[9px] text-gray-400 font-medium">📍 Papuri, Nanoor, Birbhum, WB, 731240</p>
              <div className="text-[9px] font-bold text-gray-600 flex justify-center gap-4 pt-1">
                <span>📞 +91 8637589429</span>
                <span>✉️ dailyneedshub@gmail.com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <p className="text-gray-400 uppercase font-black text-[8px]">Invoice Framework</p>
                <p className="font-bold text-gray-800 truncate">ID: {currentOrderId}</p>
                <p className="text-gray-500 font-medium">{new Date().toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 uppercase font-black text-[8px]">Shipping Target</p>
                <p className="font-extrabold text-orange-600 truncate">{custInfo.name}</p>
                <p className="text-gray-500 truncate font-semibold">{custInfo.vill}, {custInfo.city} (PIN-{custInfo.pin})</p>
              </div>
            </div>

            {paymentType === "UPI" ? (
              <div className="p-4 bg-orange-50/70 border-2 border-dashed border-orange-300 rounded-2xl text-center space-y-3 shadow-inner">
                <span className="text-[9px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">⚡ FLIPKART STYLE ONE-CLICK INTENT GATEWAY</span>
                <p className="text-[10px] text-gray-600 font-bold leading-tight">Niche click karte hi Google Pay/PhonePe open ho jayega. Back aate hi order confirm ho jayega!</p>
                
                <div className="bg-white p-2 rounded-xl inline-block border shadow-sm mx-auto">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getUPIIntentLink())}`} 
                    alt="Universal UPI Pay Link" 
                    className="w-32 h-32 mx-auto object-contain" 
                  />
                </div>

                <a 
                  href={getUPIIntentLink()}
                  className="block bg-gradient-to-r from-orange-600 to-red-500 text-white p-3 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all text-center uppercase tracking-wide"
                >
                  🚀 Click to Open PhonePe / GPay
                </a>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/80 border-2 border-dashed border-emerald-300 rounded-2xl text-center space-y-2 shadow-inner">
                <span className="text-[9px] bg-emerald-600 text-white px-3 py-0.5 rounded-full font-black uppercase tracking-wider">💵 CASH ON DELIVERY MODE</span>
                <p className="text-xs font-black text-emerald-900 pt-1">No advance payment required!</p>
                <p className="text-[11px] text-emerald-700 font-medium px-2">Aapka saaman packed hone ke baad delivery agent ko cash ya physical upi se payment karein jab saaman ghar pahuche.</p>
                <button 
                  onClick={confirmCODModeSelection} 
                  className="mt-1 bg-white text-emerald-700 font-bold border border-emerald-300 px-3 py-1 text-[10px] rounded-lg shadow-sm"
                >
                  Confirm COD Selection Matrix
                </button>
              </div>
            )}

            <div className="space-y-1.5 border-t pt-3 max-h-[15vh] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] text-gray-700">
                  <span className="font-bold">{item.name} <b className="text-gray-400 font-medium">x{item.qty}</b></span>
                  <span className="font-extrabold text-gray-900">₹{getDiscountedPrice(item.price, item.discount) * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t-2 border-dashed border-gray-200 pt-3 text-sm font-black text-emerald-600 uppercase">
              <span>Gross Total Amount Due:</span>
              <span className="text-base font-black">₹{cartTotal}</span>
            </div>

            <div className="border-t pt-3 flex flex-col items-end">
              <div className="text-center space-y-0.5 pr-2">
                <p className="font-serif italic text-sm font-bold text-indigo-700 tracking-wide selection:bg-none">
                  Younus Abedin
                </p>
                <div className="w-24 h-[1px] bg-gray-300 mx-auto"></div>
                <p className="text-[8px] font-black uppercase tracking-wider text-gray-400">Sales Manager Signature</p>
              </div>
            </div>

            <button 
              onClick={sendWhatsAppNotification} 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-2xl font-black shadow-md text-xs text-center uppercase tracking-wider"
            >
              ✅ Send Bill & Verification to WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Legal Content Modals */}
      {legalModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-black border shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm text-orange-600">{legalModal.title}</h3>
              <button onClick={() => setLegalModal({ isOpen: false, title: '', content: '' })} className="text-xs bg-gray-100 px-2.5 py-1 rounded-lg font-bold">Close X</button>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-semibold whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-[50vh] overflow-y-auto">
              {legalModal.content}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

