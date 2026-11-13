import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  getDoc, 
  runTransaction 
} from 'firebase/firestore';

import AdminPanel from './components/AdminPanel';

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

const BRAND_NAME = "STYLE ZONE - X";
const BRAND_TAGLINE = "DEFINE YOUR STYLE.";
const MY_UPI_ID = "8637589429-3@ybl"; 
const ALLOWED_PINS = ["731204", "731240", "731215", "731224", "731236", "731214", "700001", "700019"];

const ADMIN_EMAILS = [
  "sekhyounusabedin2005@gmail.com",
  "stylezone.x0@gmail.com"
];

const FASHION_DEPARTMENTS = ["All", "Men", "Women", "Kids", "Footwear"];

const FASHION_COLLECTIONS_MAP = {
  "Men": [
    { name: "Oversized T-Shirts", icon: "👕" },
    { name: "Casual & Formal Shirts", icon: "👔" },
    { name: "Jeans & Cargo Pants", icon: "👖" },
    { name: "Jackets & Hoodies", icon: "🧥" },
    { name: "Ethnic Kurta Sets", icon: "🥻" }
  ],
  "Women": [
    { name: "Dresses & Gowns", icon: "👗" },
    { name: "Designer Kurtis", icon: "👚" },
    { name: "Sarees & Lehengas", icon: "🥻" },
    { name: "Tops & T-Shirts", icon: "👕" },
    { name: "Jeans & Trousers", icon: "👖" }
  ],
  "Kids": [
    { name: "Boys Clothing", icon: "🧒" },
    { name: "Girls Frocks & Tops", icon: "👧" },
    { name: "Baby Rompers", icon: "👶" },
    { name: "Kids Ethnic Wear", icon: "🥻" }
  ],
  "Footwear": [
    { name: "Sneakers & Streetwear", icon: "👟" },
    { name: "Sports & Running Shoes", icon: "🏃" },
    { name: "Casual Loafers", icon: "👞" },
    { name: "Formal Leather Shoes", icon: "👞" },
    { name: "Sandals & Slippers", icon: "🩴" },
    { name: "Women Heels & Flats", icon: "👠" }
  ]
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [saveForLater, setSaveForLater] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminUrl, setIsAdminUrl] = useState(false);
  const [activeTab, setActiveTab] = useState("shop"); 

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Video 1: Playful "Impossible" Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginNameInput, setLoginNameInput] = useState("");
  const [loginPhoneInput, setLoginPhoneInput] = useState("");
  const [dodgeOffset, setDodgeOffset] = useState({ x: 0, y: 0 });

  // Video 2: Expandable Search Pill State
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Video 3: AI Style Assistant Drawer State
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { sender: "ai", text: "Hey! Main STYLE ZONE - X ka AI Stylist hoon. Aapko aaj kya chahiye—Oversized Tees, Sneakers, ya Delivery Pincode check?" }
  ]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [activeCollection, setActiveCollection] = useState("All");
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [darkMode, setDarkMode] = useState(false);

  const [flashConfig, setFlashConfig] = useState({
    title: "LIMITED FLASH DROP",
    subtitle: "Extra 20% OFF on Orders ₹1499+ using code STYLE20",
    featuredProductId: "",
    posterUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80",
    expiryHours: 4
  });
  const [flashTime, setFlashTime] = useState(14400); 

  const [toast, setToast] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [custInfo, setCustInfo] = useState({ 
    name: '', phone: '', email: '', road: '', landmark: '', vill: '', city: 'Bolpur', dist: 'Birbhum', pin: '' 
  });

  const imageSliderRef = useRef(null);

  const [heroSlides] = useState([
    {
      id: 1,
      badge: "AUTUMN / WINTER '26",
      title: "OVERSIZED STREETWEAR",
      subtitle: "Heavyweight Cotton Tees, Cargo Pants & Denim Drops",
      btnText: "SHOP MEN",
      dept: "Men",
      img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80"
    },
    {
      id: 2,
      badge: "FESTIVE COUTURE",
      title: "ETHNIC & FLOWY DRESSES",
      subtitle: "Handcrafted Kurtas, Sarees & Contemporary Silhouettes",
      btnText: "SHOP WOMEN",
      dept: "Women",
      img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
    },
    {
      id: 3,
      badge: "KICKS & DROPS",
      title: "CHUNKY SNEAKERS & KICKS",
      subtitle: "Comfort Meets Street Hype. Built For Daily Motion",
      btnText: "SHOP FOOTWEAR",
      dept: "Footwear",
      img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80"
    }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const showToastMessage = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Escape key to close expanded search (Video 2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsSearchExpanded(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hardware Back Button Shield
  useEffect(() => {
    const handlePopState = () => {
      if (selectedProduct) return setSelectedProduct(null);
      if (isCartOpen) return setIsCartOpen(false);
      if (isWishlistOpen) return setIsWishlistOpen(false);
      if (isNotifOpen) return setIsNotifOpen(false);
      if (isCategoryModalOpen) return setIsCategoryModalOpen(false);
      if (isAiAssistantOpen) return setIsAiAssistantOpen(false);
      if (isLoginModalOpen) return setIsLoginModalOpen(false);
      if (isAddressModalOpen) return setIsAddressModalOpen(false);
      if (activeTab !== "shop") return setActiveTab("shop");
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct, isCartOpen, isWishlistOpen, isNotifOpen, isCategoryModalOpen, isAiAssistantOpen, isLoginModalOpen, isAddressModalOpen, activeTab]);

  const openModalWithHistory = (type, val = true) => {
    window.history.pushState({ modal: type }, "");
    if (type === 'product') setSelectedProduct(val);
    if (type === 'cart') setIsCartOpen(true);
    if (type === 'wishlist') setIsWishlistOpen(true);
    if (type === 'notif') setIsNotifOpen(true);
    if (type === 'category') setIsCategoryModalOpen(true);
    if (type === 'ai') setIsAiAssistantOpen(true);
    if (type === 'login') setIsLoginModalOpen(true);
  };

  useEffect(() => {
    const checkPath = () => {
      setIsAdminUrl(window.location.pathname.includes("/admin") || window.location.hash.includes("admin"));
    };
    checkPath();
    window.addEventListener("popstate", checkPath);
    window.addEventListener("hashchange", checkPath);
    return () => {
      window.removeEventListener("popstate", checkPath);
      window.removeEventListener("hashchange", checkPath);
    };
  }, []);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (user && !user.isAnonymous) {
        if (ADMIN_EMAILS.includes(user.email)) return setIsAdmin(true);
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          setIsAdmin(adminDoc.exists());
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    verifyAdmin();
  }, [user]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (!currentUser) signInAnonymously(auth).catch(() => {});
      }
    });

    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), 5500);
    const flashTimer = setInterval(() => setFlashTime(prev => (prev > 0 ? prev - 1 : 14400)), 1000);
    
    const unsubProd = onSnapshot(query(collection(db, "products"), orderBy("name")), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubNotif = onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubFlash = onSnapshot(doc(db, "settings", "flashDrop"), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setFlashConfig(d);
        if (d.expiryHours) setFlashTime(d.expiryHours * 3600);
      }
    }, () => {});

    return () => { 
      clearInterval(timer); 
      clearInterval(flashTimer);
      unsubProd(); 
      unsubNotif();
      unsubFlash();
      unsubAuth(); 
    };
  }, [heroSlides.length]);

  useEffect(() => {
    let unsubOrder = () => {};
    if (isAdmin) {
      unsubOrder = onSnapshot(query(collection(db, "orders")), (snapshot) => {
        const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sorted.sort((a, b) => new Date(b.rawDate || b.createdAt) - new Date(a.rawDate || a.createdAt));
        setOrders(sorted);
      }, () => {});
    } else if (user && !user.isAnonymous) {
      unsubOrder = onSnapshot(query(collection(db, "orders"), where("userId", "==", user.uid)), (snapshot) => {
        const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sorted.sort((a, b) => new Date(b.rawDate || b.createdAt) - new Date(a.rawDate || a.createdAt));
        setOrders(sorted);
      }, () => {});
    }
    return () => unsubOrder();
  }, [user, isAdmin]);

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setUser(res.user);
        setIsLoginModalOpen(false);
        showToastMessage("Welcome to STYLE ZONE - X ✨");
      }
    } catch (err) {
      showToastMessage("Login Error: " + err.message, "error");
    }
  };

  // Video 1: Dodge Logic for Incomplete Login Form
  const isLoginFormValid = loginNameInput.trim().length >= 3 && loginPhoneInput.trim().length >= 10;
  const handleDodgeButton = () => {
    if (!isLoginFormValid) {
      const randomX = (Math.random() > 0.5 ? 1 : -1) * (45 + Math.floor(Math.random() * 40));
      const randomY = (Math.random() > 0.5 ? 1 : -1) * 12;
      setDodgeOffset({ x: randomX, y: randomY });
    } else {
      setDodgeOffset({ x: 0, y: 0 });
    }
  };

  // Video 3: AI Stylist Prompt Handler
  const handleAiPrompt = (promptText) => {
    const newMsgs = [...aiMessages, { sender: "user", text: promptText }];
    let reply = "Aap hamare Men aur Women collection me trending pieces dekh sakte hain!";
    if (promptText.includes("Oversized")) {
      setActiveDepartment("Men");
      setActiveCollection("Oversized T-Shirts");
      reply = "Maine aapke liye Men's Oversized T-Shirts filter kar di hain! 👕";
    } else if (promptText.includes("Kicks") || promptText.includes("999")) {
      setActiveDepartment("Footwear");
      reply = "Footwear collection open kar diya gaya hai—sneakers aur daily kicks check karein! 👟";
    } else if (promptText.includes("Bolpur")) {
      reply = "✅ Haan! Bolpur (731204) aur aas-paas ke PIN codes par 2-3 din mein Express Delivery available hai.";
    }
    setAiMessages([...newMsgs, { sender: "ai", text: reply }]);
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p, quantity = 1, openCartAfter = false) => {
    if (p.stock <= 0) return showToastMessage("Out of stock!", "error");
    if (p.availableSizes && p.availableSizes.length > 0 && !selectedSizes[p.id]) {
      return showToastMessage("Please select size first!", "error");
    }
    const chosenSize = selectedSizes[p.id] || "Standard";
    const chosenColor = selectedColors[p.id] || (p.availableColors && p.availableColors[0]) || "Default";
    const itemKey = `${p.id}-${chosenSize}-${chosenColor}`;
    const exist = cart.find(x => x.itemKey === itemKey);
    const updatedCart = exist
      ? cart.map(x => (x.itemKey === itemKey) ? { ...exist, qty: exist.qty + quantity } : x)
      : [...cart, { ...p, itemKey, qty: quantity, selectedSize: chosenSize, selectedColor: chosenColor }];
    setCart(updatedCart);
    showToastMessage("Added to Shopping Bag 🛍️");
    if (openCartAfter) {
      setSelectedProduct(null);
      openModalWithHistory('cart');
    }
  };

  const handleSaveForLater = (p) => {
    if (!saveForLater.find(x => x.id === p.id)) {
      setSaveForLater([p, ...saveForLater]);
      showToastMessage("Saved for later 📌");
    }
  };

  const toggleWishlist = (p) => {
    const exist = wishlist.find(x => x.id === p.id);
    setWishlist(exist ? wishlist.filter(x => x.id !== p.id) : [...wishlist, p]);
    showToastMessage(exist ? "Removed from wishlist" : "Saved to Wishlist ❤️");
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return showToastMessage("Voice search not supported", "error");
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      setSearch(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const rawMRP = cart.reduce((a, c) => a + (Number(c.price) || 0) * c.qty, 0);
  const rawCartTotal = cart.reduce((a, c) => a + getDiscountedPrice(c.price, c.discount) * c.qty, 0);
  const deliveryFee = rawCartTotal >= 999 || rawCartTotal === 0 ? 0 : 40;
  const finalPayableTotal = rawCartTotal + deliveryFee;

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = activeDepartment === "All" || p.category === activeDepartment;
    const matchesCol = activeCollection === "All" || p.subCategory === activeCollection;
    return matchesSearch && matchesDept && matchesCol;
  });

  const formatTimer = (time) => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const similarProducts = selectedProduct ? products.filter(p => 
    p.id !== selectedProduct.id && 
    p.category === selectedProduct.category &&
    (selectedProduct.subCategory ? p.subCategory === selectedProduct.subCategory : true)
  ).slice(0, 6) : [];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-white' : 'bg-[#FAFAF9] text-zinc-900'} pb-28 transition-colors duration-300 font-sans`}>
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2.5 animate-bounce ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-zinc-950 text-white border border-zinc-700'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '⚡'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {isAdminUrl ? (
        <AdminPanel 
          db={db}
          user={user}
          isAdmin={isAdmin}
          products={products}
          orders={orders}
          notifications={notifications}
          flashConfig={flashConfig}
          setFlashConfig={setFlashConfig}
          setFlashTime={setFlashTime}
          showToastMessage={showToastMessage}
          handleGoogleLogin={handleGoogleLogin}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto">
          
          {/* LUXURY HEADER WITH EXPANDABLE CIRCULAR SEARCH PILL (Video 2) */}
          <header className={`${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'} backdrop-blur-md sticky top-0 z-40 border-b w-full shadow-sm`}>
            <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto gap-2">
              {!isSearchExpanded && (
                <div 
                  className="flex items-center gap-3 cursor-pointer" 
                  onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); setActiveCollection("All"); }}
                >
                  <div className="w-9 h-9 bg-zinc-950 text-white rounded-xl flex items-center justify-center font-black text-lg border border-zinc-700">
                    X
                  </div>
                  <div>
                    <h1 className="text-lg md:text-2xl font-black tracking-widest uppercase leading-none font-serif">{BRAND_NAME}</h1>
                    <p className="text-[8px] uppercase tracking-[0.25em] text-zinc-400 font-black mt-1">{BRAND_TAGLINE}</p>
                  </div>
                </div>
              )}

              {/* VIDEO 2: EXPANDABLE SEARCH TOGGLE PILL */}
              {isSearchExpanded ? (
                <div className="flex-1 flex items-center gap-2 animate-fadeIn">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 text-sm">🔍</span>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search anything... (Esc to close)" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-9 pr-16 py-2.5 rounded-full border-2 text-xs font-bold focus:outline-none transition-all ${darkMode ? 'bg-zinc-900 border-amber-500/60 text-white' : 'bg-zinc-50 border-zinc-950 text-zinc-900'}`}
                    />
                    <button 
                      onClick={() => { setIsSearchExpanded(false); setSearch(""); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
                    >
                      ✕
                    </button>
                  </div>
                  <button 
                    onClick={startVoiceSearch} 
                    className={`p-2.5 rounded-full border ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-zinc-950'}`}
                  >
                    🎙️
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {/* Circular Search Trigger Button */}
                  <button 
                    onClick={() => setIsSearchExpanded(true)} 
                    className={`p-2.5 rounded-full text-xs transition-all active:scale-90 ${darkMode ? 'bg-zinc-900 text-amber-400 border border-zinc-800' : 'bg-zinc-100 text-zinc-900'}`}
                    title="Search"
                  >
                    🔍
                  </button>

                  {/* AI Stylist Trigger (Video 3) */}
                  <button 
                    onClick={() => openModalWithHistory('ai')} 
                    className="p-2.5 rounded-full text-xs bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md active:scale-90"
                    title="AI Style Concierge"
                  >
                    ✨
                  </button>

                  <button 
                    onClick={() => openModalWithHistory('wishlist')} 
                    className={`p-2.5 rounded-full text-xs relative ${darkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}
                  >
                    ❤️ {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{wishlist.length}</span>}
                  </button>
                  
                  <button 
                    onClick={() => openModalWithHistory('cart')} 
                    className={`p-2.5 rounded-full text-xs relative ${darkMode ? 'bg-zinc-900 text-amber-400' : 'bg-zinc-100 text-zinc-950'}`}
                  >
                    🛍️ {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                        {cart.length}
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className={`p-2.5 rounded-full text-xs ${darkMode ? 'bg-zinc-800 text-amber-300' : 'bg-zinc-100 text-zinc-700'}`}
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* MAIN STORE CONTENT */}
          {activeTab === "shop" && (
            <>
              {/* HERO POSTERS */}
              <div className="px-4 my-3">
                <div className="relative h-72 md:h-[420px] w-full rounded-3xl overflow-hidden shadow-xl border border-zinc-800">
                  {heroSlides.map((s, idx) => (
                    <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                      <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent p-6 md:p-10 flex flex-col justify-center text-white">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full w-fit mb-2">
                          {s.badge}
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black uppercase font-serif max-w-sm">{s.title}</h2>
                        <p className="text-xs md:text-sm text-zinc-300 font-medium mb-4 max-w-xs">{s.subtitle}</p>
                        <button 
                          onClick={() => { setActiveDepartment(s.dept); setActiveCollection("All"); }}
                          className="w-fit bg-white text-zinc-950 px-6 py-2.5 rounded-full font-black text-xs uppercase"
                        >
                          {s.btnText} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FLASH SALE STRIP */}
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-4 rounded-3xl flex items-center justify-between border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">⚡</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">{flashConfig.title}</h4>
                      <p className="text-[10px] text-zinc-300 font-medium">{flashConfig.subtitle}</p>
                    </div>
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-2xl border border-white/10 font-mono font-black text-xs text-yellow-300">
                    {formatTimer(flashTime)}
                  </div>
                </div>
              </div>

              {/* SHOP BY DEPARTMENT */}
              <div className="px-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">SHOP BY DEPARTMENT</h3>
                  <span className="text-[10px] font-black uppercase text-zinc-500 cursor-pointer" onClick={() => { setActiveDepartment("All"); setActiveCollection("All"); }}>View All</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { title: "Men", img: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=300&q=80" },
                    { title: "Women", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80" },
                    { title: "Kids", img: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=300&q=80" },
                    { title: "Footwear", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&q=80" }
                  ].map(dept => (
                    <div 
                      key={dept.title} 
                      onClick={() => { setActiveDepartment(dept.title); setActiveCollection("All"); }}
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-2xl border transition-all ${
                        activeDepartment === dept.title 
                          ? (darkMode ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-zinc-950 text-white') 
                          : (darkMode ? 'bg-zinc-900/40 text-zinc-300 border-zinc-800' : 'bg-white text-zinc-800 border-zinc-200')
                      }`}
                    >
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden mb-1.5 border border-zinc-700">
                        <img src={dept.img} alt={dept.title} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-black uppercase">{dept.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUB-CATEGORY PILLS BELOW SHOP BY DEPARTMENT */}
              {activeDepartment !== "All" && FASHION_COLLECTIONS_MAP[activeDepartment] && (
                <div className="px-4 mb-5">
                  <div className={`p-2 rounded-2xl border overflow-x-auto no-scrollbar flex items-center gap-2 ${darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <button
                      onClick={() => setActiveCollection("All")}
                      className={`text-[11px] font-black px-3.5 py-1.5 rounded-xl whitespace-nowrap ${
                        activeCollection === "All"
                          ? (darkMode ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white')
                          : 'text-zinc-400'
                      }`}
                    >
                      All {activeDepartment}
                    </button>
                    {FASHION_COLLECTIONS_MAP[activeDepartment].map(col => (
                      <button
                        key={col.name}
                        onClick={() => setActiveCollection(col.name)}
                        className={`text-[11px] font-bold px-3.5 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 ${
                          activeCollection === col.name
                            ? (darkMode ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white')
                            : 'text-zinc-400'
                        }`}
                      >
                        <span>{col.icon}</span>
                        <span>{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUCT GRID WITH TRIPLE ACTIONS */}
              <div className="px-4 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map(p => {
                    const finalPrice = getDiscountedPrice(p.price, p.discount);
                    const isWish = wishlist.find(x => x.id === p.id);
                    return (
                      <div 
                        key={p.id} 
                        className={`rounded-2xl p-2.5 border flex flex-col justify-between relative ${
                          darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      >
                        <div 
                          className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100/70 cursor-pointer flex items-center justify-center p-2 mb-2"
                          onClick={() => { setActiveImageIndex(0); openModalWithHistory('product', p); }}
                        >
                          <img 
                            src={p.images?.[0] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80"} 
                            alt={p.name} 
                            className="w-full h-full object-contain" 
                          />
                          {p.discount > 0 && (
                            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              -{p.discount}%
                            </span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }} 
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-xs shadow-md"
                          >
                            {isWish ? "❤️" : "🤍"}
                          </button>
                        </div>

                        <div className="space-y-1 px-1">
                          <p className="text-[9px] font-black uppercase text-zinc-400 truncate">{p.brand}</p>
                          <h4 onClick={() => { setActiveImageIndex(0); openModalWithHistory('product', p); }} className="text-xs md:text-sm font-bold line-clamp-1 cursor-pointer">{p.name}</h4>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-sm md:text-base font-black">₹{finalPrice}</span>
                            {p.discount > 0 && <span className="text-[10px] text-zinc-400 line-through">₹{p.price}</span>}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-1 space-y-1.5">
                          <button 
                            onClick={() => addToCart(p, 1, true)} 
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow active:scale-95 transition-all"
                          >
                            ⚡ Buy Now
                          </button>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button 
                              onClick={() => addToCart(p, 1, false)} 
                              className={`py-1.5 rounded-xl font-black text-[9px] uppercase transition-all ${darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'}`}
                            >
                              + Bag
                            </button>
                            <button 
                              onClick={() => handleSaveForLater(p)} 
                              className={`py-1.5 rounded-xl font-bold text-[9px] uppercase transition-all ${darkMode ? 'bg-zinc-800/60 text-zinc-300' : 'bg-zinc-50 text-zinc-600 border'}`}
                            >
                              📌 Later
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* SAVED FOR LATER TAB */}
          {activeTab === "saved" && (
            <div className="p-4 max-w-xl mx-auto space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider">📌 Saved For Later ({saveForLater.length})</h3>
              {saveForLater.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-3xl space-y-2">
                  <span className="text-3xl">📌</span>
                  <p className="text-xs text-zinc-400 font-bold">No saved items right now.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {saveForLater.map(item => (
                    <div key={item.id} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <img src={item.images?.[0]} alt="" className="w-14 h-16 object-contain bg-zinc-100 rounded-xl p-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate">{item.name}</h4>
                        <p className="text-xs font-black text-amber-500">₹{getDiscountedPrice(item.price, item.discount)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => { setSaveForLater(saveForLater.filter(x => x.id !== item.id)); addToCart(item, 1, false); }} className="px-3 py-1 bg-amber-500 text-zinc-950 rounded-lg text-[10px] font-black uppercase">Move to Bag</button>
                        <button onClick={() => setSaveForLater(saveForLater.filter(x => x.id !== item.id))} className="text-[10px] text-zinc-400 underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <div className="p-4 max-w-xl mx-auto space-y-4">
              <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-lg">
                      {(custInfo.name || user?.displayName || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-base">{custInfo.name || user?.displayName || "STYLE ZONE Insider"}</h3>
                      <p className="text-xs text-zinc-400 font-bold">{user?.email || "Guest Shopper"}</p>
                    </div>
                  </div>
                  {!user && (
                    <button 
                      onClick={() => openModalWithHistory('login')}
                      className="px-4 py-2 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs uppercase"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              <div className={`rounded-3xl border divide-y text-xs font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800 divide-zinc-800' : 'bg-white border-zinc-200 divide-zinc-100'}`}>
                <div onClick={() => openModalWithHistory('category')} className="p-4 flex items-center justify-between cursor-pointer">
                  <span>🏷️ Explore All Categories</span><span>›</span>
                </div>
                <div onClick={() => openModalWithHistory('wishlist')} className="p-4 flex items-center justify-between cursor-pointer">
                  <span>❤️ My Wishlist</span><span>›</span>
                </div>
                <div onClick={() => setActiveTab("saved")} className="p-4 flex items-center justify-between cursor-pointer">
                  <span>📌 Saved For Later</span><span>›</span>
                </div>
              </div>

              {user ? (
                <button onClick={() => { signOut(auth); setUser(null); showToastMessage("Logged out"); }} className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase">Logout</button>
              ) : (
                <button onClick={() => openModalWithHistory('login')} className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase">Open Playful Login Card ✨</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIDEO 1: PLAYFUL "IMPOSSIBLE" DODGING LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121217] border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-white shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-black text-base tracking-wider uppercase text-amber-400">STYLE ZONE ACCESS</h3>
                <p className="text-[10px] text-zinc-400">Fill valid details to catch the Continue button!</p>
              </div>
              <button onClick={() => setIsLoginModalOpen(false)} className="p-1.5 rounded-full bg-zinc-800 text-xs">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Your Full Name (Min 3 chars)</label>
                <input 
                  value={loginNameInput}
                  onChange={(e) => { setLoginNameInput(e.target.value); setDodgeOffset({ x: 0, y: 0 }); }}
                  placeholder="e.g. Sekh Younus"
                  className="w-full bg-[#1A1A22] border border-zinc-700 p-3 rounded-xl font-bold text-white mt-1 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">10-Digit Mobile Number</label>
                <input 
                  type="tel"
                  value={loginPhoneInput}
                  onChange={(e) => { setLoginPhoneInput(e.target.value); setDodgeOffset({ x: 0, y: 0 }); }}
                  placeholder="e.g. 8637589429"
                  className="w-full bg-[#1A1A22] border border-zinc-700 p-3 rounded-xl font-bold text-white mt-1 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Dodging Continue Button */}
              <div className="pt-2 flex justify-center h-14 items-center">
                <button
                  onMouseEnter={handleDodgeButton}
                  onClick={() => {
                    if (!isLoginFormValid) {
                      handleDodgeButton();
                      showToastMessage("Pehle sahi Name aur 10-digit Phone bharo! 😜", "error");
                    } else {
                      setCustInfo({ ...custInfo, name: loginNameInput, phone: loginPhoneInput });
                      setIsLoginModalOpen(false);
                      showToastMessage(`Welcome ${loginNameInput}! 🎉`);
                    }
                  }}
                  style={{ transform: `translate(${dodgeOffset.x}px, ${dodgeOffset.y}px)` }}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-transform duration-200 shadow-lg ${
                    isLoginFormValid 
                      ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/30' 
                      : 'bg-amber-500 text-zinc-950'
                  }`}
                >
                  {isLoginFormValid ? "Locked & Ready →" : "Continue"}
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-2 text-[10px] text-zinc-500 uppercase font-bold">OR ONE-TAP</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200"
              >
                <span>G</span> Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO 3: AI STYLE ASSISTANT DRAWER */}
      {isAiAssistantOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-4 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-sm">✨</span>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider">STYLE ZONE AI Concierge</h3>
                  <p className="text-[10px] text-emerald-500 font-bold">● Online & Ready to Style</p>
                </div>
              </div>
              <button onClick={() => setIsAiAssistantOpen(false)} className="p-1.5 rounded-full bg-zinc-800 text-white text-xs">✕</button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar text-xs">
              {aiMessages.map((m, idx) => (
                <div key={idx} className={`p-3 rounded-2xl max-w-[85%] ${m.sender === 'ai' ? (darkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900') : 'bg-amber-500 text-zinc-950 font-bold ml-auto'}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Suggest Oversized Combo 👕", "Show Sneakers & Kicks 👟", "Check Bolpur (731204) Delivery 🚚"].map(chip => (
                <button 
                  key={chip}
                  onClick={() => handleAiPrompt(chip)}
                  className="text-[10px] font-black px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT VIEW MODAL */}
      {selectedProduct && (
        <div className={`fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
          <div className={`sticky top-0 backdrop-blur-md z-20 border-b px-4 py-3 flex items-center justify-between ${darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
            <button onClick={() => setSelectedProduct(null)} className="text-xs font-black uppercase bg-zinc-800 text-white px-3 py-1.5 rounded-full">← Back</button>
            <button onClick={() => toggleWishlist(selectedProduct)} className="p-2 bg-zinc-800 text-white rounded-full text-sm">
              {wishlist.find(x => x.id === selectedProduct.id) ? "❤️" : "🤍"}
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full p-4 space-y-6 pb-28">
            <div className="relative">
              <div 
                ref={imageSliderRef}
                className="w-full aspect-[4/5] rounded-3xl overflow-x-auto snap-x snap-mandatory flex no-scrollbar border bg-stone-100/80"
                onScroll={(e) => setActiveImageIndex(Math.round(e.target.scrollLeft / e.target.offsetWidth))}
              >
                {(selectedProduct.images || [selectedProduct.img]).map((img, idx) => (
                  <div key={idx} className="w-full h-full shrink-0 snap-center flex items-center justify-center p-3">
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
              {(selectedProduct.images || []).length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-black px-3 py-1 rounded-full">
                  {activeImageIndex + 1} / {selectedProduct.images.length}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-zinc-400">{selectedProduct.brand}</span>
              <h1 className="text-xl md:text-2xl font-black font-serif">{selectedProduct.name}</h1>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-2xl font-black">₹{getDiscountedPrice(selectedProduct.price, selectedProduct.discount)}</span>
                {selectedProduct.discount > 0 && <span className="text-xs font-black text-rose-500">{selectedProduct.discount}% OFF</span>}
              </div>
            </div>

            {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <span className="text-xs font-black uppercase">SELECT SIZE</span>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableSizes.map(sz => (
                    <button 
                      key={sz} 
                      onClick={() => setSelectedSizes({ ...selectedSizes, [selectedProduct.id]: sz })}
                      className={`px-4 py-2 rounded-xl text-xs font-black border ${selectedSizes[selectedProduct.id] === sz ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'border-zinc-700'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {similarProducts.length > 0 && (
              <div className="border-t pt-6 space-y-3">
                <h4 className="text-xs font-black uppercase">✨ SIMILAR {selectedProduct.category.toUpperCase()}</h4>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {similarProducts.map(sp => (
                    <div key={sp.id} onClick={() => { setActiveImageIndex(0); setSelectedProduct(sp); }} className="w-32 shrink-0 cursor-pointer text-center p-2 rounded-2xl border">
                      <img src={sp.images?.[0]} alt="" className="w-full aspect-[4/5] object-contain mb-1.5" />
                      <p className="text-[10px] font-bold truncate">{sp.name}</p>
                      <p className="text-[11px] font-black text-amber-500">₹{getDiscountedPrice(sp.price, sp.discount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`fixed bottom-0 inset-x-0 border-t p-3 z-50 flex gap-2 max-w-2xl mx-auto ${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
            <button onClick={() => handleSaveForLater(selectedProduct)} className="px-4 py-3 rounded-2xl font-black text-[11px] uppercase bg-zinc-800 text-white">📌 Later</button>
            <button onClick={() => addToCart(selectedProduct, 1, false)} className="flex-1 py-3 bg-zinc-800 text-white font-black rounded-2xl text-xs uppercase">Add to Bag</button>
            <button onClick={() => addToCart(selectedProduct, 1, true)} className="flex-1 py-3 bg-amber-500 text-zinc-950 font-black rounded-2xl text-xs uppercase">Buy Now ⚡</button>
          </div>
        </div>
      )}

      {/* CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs font-bold border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm uppercase">Shop By Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>✕</button>
            </div>
            <div className="space-y-2">
              {FASHION_DEPARTMENTS.slice(1).map(dept => (
                <div 
                  key={dept} 
                  onClick={() => { setActiveDepartment(dept); setActiveCollection("All"); setIsCategoryModalOpen(false); setActiveTab("shop"); }}
                  className="p-3 bg-zinc-800/40 hover:bg-amber-500 hover:text-zinc-950 rounded-2xl cursor-pointer flex justify-between items-center"
                >
                  <span className="font-black text-sm">{dept}</span>
                  <span>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING BAG DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-full max-w-md h-full p-4 shadow-2xl overflow-y-auto flex flex-col justify-between ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-black uppercase">Shopping Bag ({cart.length})</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg bg-zinc-800 text-white text-xs">✕</button>
              </div>
              <div className="space-y-3 max-h-[45vh] overflow-y-auto no-scrollbar">
                {cart.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 py-10">Your bag is empty.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.itemKey} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <img src={item.images?.[0]} alt="" className="w-14 h-16 object-contain bg-zinc-100 rounded-xl p-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{item.name}</h4>
                        <p className="text-[10px] text-zinc-400">Size: {item.selectedSize} • Qty: {item.qty}</p>
                        <p className="font-black text-amber-500">₹{getDiscountedPrice(item.price, item.discount) * item.qty}</p>
                      </div>
                      <button onClick={() => setCart(cart.filter(x => x.itemKey !== item.itemKey))} className="text-rose-500 font-bold text-xs">✕</button>
                    </div>
                  ))
                )}
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex justify-between text-zinc-400"><span>MRP Total</span><span>₹{rawMRP}</span></div>
                <div className="flex justify-between text-zinc-400"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
                <div className="flex justify-between border-t pt-2 font-black text-sm"><span>Payable Amount</span><span>₹{finalPayableTotal}</span></div>
              </div>
            </div>
            <button 
              onClick={() => {
                if (cart.length === 0) return showToastMessage("Bag is empty", "error");
                window.open(`upi://pay?pa=${MY_UPI_ID}&pn=STYLE%20ZONE%20X&am=${finalPayableTotal}&cu=INR`, '_blank');
                setCart([]);
                setIsCartOpen(false);
                showToastMessage("Order Initiated! 🎉");
              }}
              className="w-full py-3.5 bg-amber-500 text-zinc-950 font-black rounded-2xl text-xs uppercase"
            >
              Checkout Now (₹{finalPayableTotal}) →
            </button>
          </div>
        </div>
      )}

      {/* VIDEO 4: ANIMATED POP-OUT & GLOWING NOTCH BOTTOM NAVIGATION BAR */}
      {!isAdminUrl && (
        <nav className={`fixed bottom-2 inset-x-3 border p-2 z-40 flex justify-around items-center max-w-md md:max-w-lg mx-auto rounded-full shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
          {[
            { id: "shop", label: "Home", icon: "🏠", action: () => { setActiveTab("shop"); setActiveDepartment("All"); } },
            { id: "categories", label: "Categories", icon: "🏷️", action: () => openModalWithHistory('category') },
            { id: "saved", label: "Saved", icon: "📌", action: () => setActiveTab("saved") },
            { id: "bag", label: "Bag", icon: "🛍️", badge: cart.length, action: () => openModalWithHistory('cart') },
            { id: "account", label: "Account", icon: "👤", action: () => setActiveTab("account") }
          ].map(nav => {
            const isActive = (nav.id === "shop" && activeTab === "shop") || (nav.id === "saved" && activeTab === "saved") || (nav.id === "account" && activeTab === "account");
            return (
              <button
                key={nav.id}
                onClick={nav.action}
                className="relative flex flex-col items-center justify-center w-14 h-11 transition-all duration-300"
              >
                {/* Sliding Glow Circle Notch */}
                <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive 
                    ? '-translate-y-3 w-11 h-11 bg-gradient-to-tr from-amber-500 to-yellow-400 text-zinc-950 shadow-lg shadow-amber-500/40 scale-110' 
                    : 'w-8 h-8 text-zinc-400 hover:text-amber-500'
                }`}>
                  <span className="text-base">{nav.icon}</span>
                  {nav.badge > 0 && !isActive && (
                    <span className="absolute top-0 right-2 bg-amber-500 text-zinc-950 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {nav.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] uppercase tracking-wider font-black transition-all ${
                  isActive ? '-mt-2 text-amber-500 opacity-100' : 'mt-0.5 text-zinc-400 opacity-80'
                }`}>
                  {nav.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

    </div>
  );
}
