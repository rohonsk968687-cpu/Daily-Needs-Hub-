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
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  getDoc, 
  runTransaction 
} from 'firebase/firestore';

// Bramble Dark Admin Panel Component
import AdminPanel from './components/AdminPanel';

// Firebase Setup
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

// Brand Attributes
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
  const [reviews, setReviews] = useState([]);
  
  const [dynamicCoupons, setDynamicCoupons] = useState([
    { code: "STYLE100", discountType: "fixed", discountValue: 100, minOrder: 999 },
    { code: "STYLE20", discountType: "percentage", discountValue: 20, minOrder: 1499 }
  ]);
  const [user, setUser] = useState(null);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Admin Access Control
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminUrl, setIsAdminUrl] = useState(false);
  const [activeTab, setActiveTab] = useState("shop"); 

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [activeCollection, setActiveCollection] = useState("All");
  
  // Filter & Sort States
  const [priceFilter, setPriceFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  // Payment States
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [verificationCountdown, setVerificationCountdown] = useState(120);

  const [darkMode, setDarkMode] = useState(false);

  // Dynamic Flash Drop
  const [flashConfig, setFlashConfig] = useState({
    title: "LIMITED FLASH DROP",
    subtitle: "Extra 20% OFF on Orders ₹1499+ using code STYLE20",
    featuredProductId: "",
    posterUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80",
    expiryHours: 4
  });
  const [flashTime, setFlashTime] = useState(14400); 

  const [toast, setToast] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [productPageQty, setProductPageQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [pinCheckInput, setPinCheckInput] = useState("");
  const [pinCheckMsg, setPinCheckMsg] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [custInfo, setCustInfo] = useState({ 
    name: '', 
    nickName: '',
    gender: 'Male',
    phone: '',
    email: '', 
    road: '',
    landmark: '', 
    vill: '', 
    city: 'Bolpur',
    dist: 'Birbhum',
    pin: '' 
  });

  const imageSliderRef = useRef(null);

  // 5 Hero Advertising Posters
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
    },
    {
      id: 4,
      badge: "CLASSIC FIT",
      title: "TAILORED CASUAL SHIRTS",
      subtitle: "Premium linen, structured collars, and everyday comfort",
      btnText: "SHOP SHIRTS",
      dept: "Men",
      img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80"
    },
    {
      id: 5,
      badge: "URBAN WINTER",
      title: "HOODIES & BOMBER JACKETS",
      subtitle: "Fleece layered outerwear designed for winter nights",
      btnText: "SHOP JACKETS",
      dept: "Men",
      img: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=80"
    }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const showToastMessage = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Hardware Back Button Handler
  useEffect(() => {
    const handlePopState = () => {
      if (selectedProduct) {
        setSelectedProduct(null);
        return;
      }
      if (isCartOpen) {
        setIsCartOpen(false);
        return;
      }
      if (isWishlistOpen) {
        setIsWishlistOpen(false);
        return;
      }
      if (isNotifOpen) {
        setIsNotifOpen(false);
        return;
      }
      if (isCategoryModalOpen) {
        setIsCategoryModalOpen(false);
        return;
      }
      if (isFilterDrawerOpen) {
        setIsFilterDrawerOpen(false);
        return;
      }
      if (isAddressModalOpen) {
        setIsAddressModalOpen(false);
        return;
      }
      if (activeTab !== "shop") {
        setActiveTab("shop");
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    selectedProduct, isCartOpen, isWishlistOpen, isNotifOpen, 
    isCategoryModalOpen, isFilterDrawerOpen, isAddressModalOpen, activeTab
  ]);

  const openModalWithHistory = (type, val = true) => {
    window.history.pushState({ modal: type }, "");
    if (type === 'product') setSelectedProduct(val);
    if (type === 'cart') setIsCartOpen(true);
    if (type === 'wishlist') setIsWishlistOpen(true);
    if (type === 'notif') setIsNotifOpen(true);
    if (type === 'category') setIsCategoryModalOpen(true);
    if (type === 'filter') setIsFilterDrawerOpen(true);
  };

  // PWA Check
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsAlreadyInstalled(true);
      setShowInstallBanner(false);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsAlreadyInstalled(true);
      setShowInstallBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerPwaInstall = async () => {
    if (isAlreadyInstalled) return showToastMessage("App is already installed on phone! 📲", "info");
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsAlreadyInstalled(true);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      showToastMessage("Chrome menu (⋮) par jakar 'Install App' dabayein!", "info");
    }
  };

  // Path detection
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

  // Admin Check
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

  // Cloud Data Sync
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const loadData = async () => {
        try {
          const cartDoc = await getDoc(doc(db, "carts", user.uid));
          if (cartDoc.exists()) setCart(cartDoc.data().items || []);
          
          const profileDoc = await getDoc(doc(db, "profiles", user.uid));
          if (profileDoc.exists()) setCustInfo(prev => ({ ...prev, ...profileDoc.data() }));

          const wishDoc = await getDoc(doc(db, "wishlists", user.uid));
          if (wishDoc.exists()) setWishlist(wishDoc.data().items || []);

          const sflDoc = await getDoc(doc(db, "saveForLater", user.uid));
          if (sflDoc.exists()) setSaveForLater(sflDoc.data().items || []);
        } catch {}
      };
      loadData();
    } else {
      const localCart = localStorage.getItem("szx_guest_cart");
      if (localCart) try { setCart(JSON.parse(localCart)); } catch {}
      const localWish = localStorage.getItem("szx_guest_wishlist");
      if (localWish) try { setWishlist(JSON.parse(localWish)); } catch {}
      const localSfl = localStorage.getItem("szx_guest_sfl");
      if (localSfl) try { setSaveForLater(JSON.parse(localSfl)); } catch {}
    }
  }, [user]);

  const syncCart = async (updatedCart) => {
    setCart(updatedCart);
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "carts", user.uid), { items: updatedCart }, { merge: true }).catch(() => {});
    } else {
      localStorage.setItem("szx_guest_cart", JSON.stringify(updatedCart));
    }
  };

  const syncWishlistCloud = async (updatedWish) => {
    setWishlist(updatedWish);
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "wishlists", user.uid), { items: updatedWish }, { merge: true }).catch(() => {});
    } else {
      localStorage.setItem("szx_guest_wishlist", JSON.stringify(updatedWish));
    }
  };

  const syncSaveForLater = async (updatedSfl) => {
    setSaveForLater(updatedSfl);
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "saveForLater", user.uid), { items: updatedSfl }, { merge: true }).catch(() => {});
    } else {
      localStorage.setItem("szx_guest_sfl", JSON.stringify(updatedSfl));
    }
  };

  // Auth & Database Real-time Listeners
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (!currentUser) signInAnonymously(auth).catch(() => {});
      }
    });

    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), 5500);
    const flashTimer = setInterval(() => setFlashTime(prev => (prev > 0 ? prev - 1 : 14400)), 1000);
    
    const qProd = query(collection(db, "products"), orderBy("name"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsProductsLoading(false); 
    }, () => setIsProductsLoading(false));

    const qNotif = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const qRev = collection(db, "reviews");
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      unsubRev();
      unsubFlash();
      unsubAuth(); 
    };
  }, [heroSlides.length]);

  // Orders Listener
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

  // 2-Min Timer
  useEffect(() => {
    let timer = null;
    if (activePaymentOrder && verificationCountdown > 0) {
      timer = setInterval(() => setVerificationCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activePaymentOrder, verificationCountdown]);

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setUser(res.user);
        showToastMessage("Signed in ✨");
      }
    } catch (err) {
      showToastMessage("Login Error: " + err.message, "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setCart([]);
    setWishlist([]);
    setSaveForLater([]);
    showToastMessage("Logged out successfully");
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p, quantity = 1, openCartAfter = false) => {
    if (p.stock <= 0) return showToastMessage("Out of stock!", "error");

    if (p.availableSizes && p.availableSizes.length > 0 && !selectedSizes[p.id]) {
      return showToastMessage("Please select size!", "error");
    }

    const chosenSize = selectedSizes[p.id] || "Standard";
    const chosenColor = selectedColors[p.id] || (p.availableColors && p.availableColors[0]) || "Default";
    const itemKey = `${p.id}-${chosenSize}-${chosenColor}`;

    const exist = cart.find(x => x.itemKey === itemKey);
    let updatedCart = [];

    if (exist) {
      if (exist.qty + quantity > p.stock) return showToastMessage("Stock limit reached!", "error");
      updatedCart = cart.map(x => (x.itemKey === itemKey) ? { ...exist, qty: exist.qty + quantity } : x);
    } else {
      updatedCart = [...cart, { 
        ...p, 
        itemKey,
        qty: quantity, 
        selectedSize: chosenSize,
        selectedColor: chosenColor 
      }];
    }
    syncCart(updatedCart);
    showToastMessage("Added to Shopping Bag 🛍️");
    if (openCartAfter) {
      setSelectedProduct(null);
      openModalWithHistory('cart');
    }
  };

  const handleSaveForLater = (p) => {
    const exist = saveForLater.find(x => x.id === p.id);
    if (!exist) {
      const updated = [p, ...saveForLater];
      syncSaveForLater(updated);
      showToastMessage("Saved for later 📌");
    } else {
      showToastMessage("Already in Saved list 📌", "info");
    }
  };

  const moveToCartFromSfl = (item) => {
    const updatedSfl = saveForLater.filter(x => x.id !== item.id);
    syncSaveForLater(updatedSfl);
    addToCart(item, 1, false);
  };

  const updateCartQty = (itemKey, delta) => {
    const item = cart.find(x => x.itemKey === itemKey);
    if (!item) return;
    const nextQty = item.qty + delta;
    let updatedCart = [];
    if (nextQty <= 0) {
      updatedCart = cart.filter(x => x.itemKey !== itemKey);
    } else {
      if (delta > 0 && nextQty > item.stock) return showToastMessage("Stock limit reached!", "error");
      updatedCart = cart.map(x => (x.itemKey === itemKey) ? { ...item, qty: nextQty } : x);
    }
    syncCart(updatedCart);
  };

  const moveToWishlist = (item) => {
    updateCartQty(item.itemKey, -item.qty);
    toggleWishlist(item);
  };

  const toggleWishlist = (p) => {
    const exist = wishlist.find(x => x.id === p.id);
    let updatedWish = [];
    if (exist) {
      updatedWish = wishlist.filter(x => x.id !== p.id);
      showToastMessage("Removed from wishlist");
    } else {
      updatedWish = [...wishlist, p];
      showToastMessage("Saved to Wishlist ❤️");
    }
    syncWishlistCloud(updatedWish);
  };

  const addToRecentlyViewed = (p) => {
    setActiveImageIndex(0);
    setProductPageQty(1);
    openModalWithHistory('product', p);

    const exists = recentlyViewed.find(x => x.id === p.id);
    if (!exists) {
      const updated = [p, ...recentlyViewed.slice(0, 7)];
      setRecentlyViewed(updated);
      const storageKey = user && !user.isAnonymous ? `szx_recently_viewed_${user.uid}` : "szx_guest_recently_viewed";
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  // Modern Audio-Wave Voice Search
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return showToastMessage("Voice search not supported", "error");
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => {
      setIsListening(true);
      showToastMessage("Listening for styles or kicks... 🎙️");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
      showToastMessage(`Searching: "${transcript}"`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleCheckoutInit = async () => {
    if (!user || user.isAnonymous) return showToastMessage("Please login with Google!", "error");
    if (!custInfo.vill || !custInfo.pin || !custInfo.phone) {
      return openModalWithHistory('address');
    }
    if (paymentType === "UPI") {
      window.open(`upi://pay?pa=${MY_UPI_ID}&pn=STYLE%20ZONE%20X&am=${finalPayableTotal}&cu=INR`, '_blank');
    }
    showToastMessage("Order Placed Successfully!");
    setCart([]);
    syncCart([]);
    setIsCartOpen(false);
  };

  // Cart Pricing Calculations
  const rawMRP = cart.reduce((a, c) => a + (Number(c.price) || 0) * c.qty, 0);
  const rawCartTotal = cart.reduce((a, c) => a + getDiscountedPrice(c.price, c.discount) * c.qty, 0);
  const totalItemSavings = rawMRP - rawCartTotal;
  const couponDeduction = appliedCoupon ? appliedCoupon.discount : 0;
  const deliveryFee = (rawCartTotal - couponDeduction) >= 999 || rawCartTotal === 0 ? 0 : 40;
  const finalPayableTotal = Math.max(0, rawCartTotal - couponDeduction + deliveryFee);
  const totalSavedEntireOrder = totalItemSavings + couponDeduction;

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

  // Strict Similar Products (Exact Category & Subcategory Only)
  const similarProducts = selectedProduct ? products.filter(p => 
    p.id !== selectedProduct.id && 
    p.category === selectedProduct.category &&
    (selectedProduct.subCategory ? p.subCategory === selectedProduct.subCategory : true)
  ).slice(0, 6) : [];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-white' : 'bg-[#FAFAF9] text-zinc-900'} pb-28 transition-colors duration-300 font-sans`}>
      
      {/* Toast Container */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2.5 animate-bounce ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-zinc-950 text-white border border-zinc-700'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '⚡'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ADMIN ROUTE DISPATCHER */}
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
          darkMode={darkMode}
        />
      ) : (
        /* CUSTOMER STOREFRONT VIEW */
        <div className="w-full max-w-7xl mx-auto">
          
          {/* HEADER (Bag in place of Profile) */}
          <header className={`${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'} backdrop-blur-md sticky top-0 z-40 border-b w-full shadow-sm`}>
            <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); setActiveCollection("All"); }}
              >
                <div className="w-9 h-9 bg-zinc-950 text-white rounded-xl flex items-center justify-center font-black tracking-tighter text-lg shadow-sm border border-zinc-700">
                  X
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase leading-none font-serif">
                    {BRAND_NAME}
                  </h1>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-[0.25em] text-zinc-400 font-black mt-1">
                    {BRAND_TAGLINE}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openModalWithHistory('notif')} 
                  className={`p-2.5 rounded-full text-xs relative ${darkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}
                >
                  🔔 {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{notifications.length}</span>}
                </button>
                <button 
                  onClick={() => openModalWithHistory('wishlist')} 
                  className={`p-2.5 rounded-full text-xs relative ${darkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}
                >
                  ❤️ {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{wishlist.length}</span>}
                </button>
                
                {/* DIRECT HEADER SHOPPING BAG */}
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
            </div>
          </header>

          {/* SEARCH BAR WITH CYBER-WAVE MIC */}
          <div className={`px-4 py-2.5 border-b sticky top-[60px] md:top-[65px] z-30 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="max-w-7xl mx-auto relative flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search dresses, oversized tees, kicks..." 
                  value={search}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-xs md:text-sm font-semibold focus:outline-none ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Glowing Wave Mic */}
              <button 
                onClick={startVoiceSearch} 
                className={`relative p-2.5 px-3 rounded-2xl border flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-rose-600 text-white shadow-rose-500/50 shadow-lg animate-pulse border-rose-500' 
                    : (darkMode ? 'bg-gradient-to-r from-zinc-900 to-zinc-850 text-amber-400 border-zinc-800' : 'bg-zinc-100 text-zinc-900 border-zinc-200')
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className={`w-0.5 h-3 rounded-full ${isListening ? 'bg-white animate-bounce' : 'bg-amber-500'}`}></span>
                  <span className={`w-0.5 h-4 rounded-full ${isListening ? 'bg-white animate-pulse' : 'bg-amber-400'}`}></span>
                  <span className="text-xs px-0.5">🎙️</span>
                  <span className={`w-0.5 h-4 rounded-full ${isListening ? 'bg-white animate-pulse' : 'bg-amber-400'}`}></span>
                  <span className={`w-0.5 h-3 rounded-full ${isListening ? 'bg-white animate-bounce' : 'bg-amber-500'}`}></span>
                </div>
              </button>
            </div>
          </div>

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

              {/* SHOP BY DEPARTMENT CIRCLES */}
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

              {/* SUB-CATEGORY PILLS: PLACED EXACTLY BELOW SHOP BY DEPARTMENT */}
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

              {/* 2-COLUMN PRODUCT GRID WITH TRIPLE ACTION CONTROLS */}
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
                          onClick={() => addToRecentlyViewed(p)}
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
                          <h4 onClick={() => addToRecentlyViewed(p)} className="text-xs md:text-sm font-bold line-clamp-1 cursor-pointer">{p.name}</h4>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-sm md:text-base font-black">₹{finalPrice}</span>
                            {p.discount > 0 && <span className="text-[10px] text-zinc-400 line-through">₹{p.price}</span>}
                          </div>
                        </div>

                        {/* TRIPLE ACTIONS: Buy Now, Bag, Save for Later */}
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
                        <button onClick={() => moveToCartFromSfl(item)} className="px-3 py-1 bg-amber-500 text-zinc-950 rounded-lg text-[10px] font-black uppercase">Move to Bag</button>
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
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-lg">
                    {(custInfo.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-base">{custInfo.name || "STYLE ZONE Insider"}</h3>
                    <p className="text-xs text-zinc-400 font-bold">{user?.email || "Guest Shopper"}</p>
                  </div>
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
                <div onClick={triggerPwaInstall} className="p-4 flex items-center justify-between cursor-pointer text-amber-500">
                  <span>📲 {isAlreadyInstalled ? "App Installed ✓" : "Install App on Phone"}</span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">{isAlreadyInstalled ? "Done" : "Install"}</span>
                </div>
              </div>

              {user ? (
                <button onClick={handleLogout} className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase">Logout</button>
              ) : (
                <button onClick={handleGoogleLogin} className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase">Sign in with Google</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* FULL PRODUCT DETAILS MODAL (TOUCH SWIPE CAROUSEL) */}
      {selectedProduct && (
        <div className={`fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between animate-fadeIn ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
          <div className={`sticky top-0 backdrop-blur-md z-20 border-b px-4 py-3 flex items-center justify-between ${darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
            <button onClick={() => setSelectedProduct(null)} className="text-xs font-black uppercase bg-zinc-800 text-white px-3 py-1.5 rounded-full">
              ← Back
            </button>
            <button onClick={() => toggleWishlist(selectedProduct)} className="p-2 bg-zinc-800 text-white rounded-full text-sm">
              {wishlist.find(x => x.id === selectedProduct.id) ? "❤️" : "🤍"}
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full p-4 space-y-6 pb-28">
            {/* NATURAL TOUCH SWIPE CAROUSEL */}
            <div className="relative">
              <div 
                ref={imageSliderRef}
                className="w-full aspect-[4/5] rounded-3xl overflow-x-auto snap-x snap-mandatory flex no-scrollbar border bg-stone-100/80"
                onScroll={(e) => {
                  const scrollLeft = e.target.scrollLeft;
                  const width = e.target.offsetWidth;
                  setActiveImageIndex(Math.round(scrollLeft / width));
                }}
              >
                {(selectedProduct.images || [selectedProduct.img]).map((img, idx) => (
                  <div key={idx} className="w-full h-full shrink-0 snap-center flex items-center justify-center p-3">
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>

              {(selectedProduct.images || []).length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-sm">
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

            {/* Sizes */}
            {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <span className="text-xs font-black uppercase tracking-wider">SELECT SIZE</span>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableSizes.map(sz => (
                    <button 
                      key={sz} 
                      onClick={() => setSelectedSizes({ ...selectedSizes, [selectedProduct.id]: sz })}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${selectedSizes[selectedProduct.id] === sz ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-transparent text-zinc-300 border-zinc-700'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STRICT SIMILAR PRODUCTS */}
            {similarProducts.length > 0 && (
              <div className="border-t pt-6 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider">
                  ✨ SIMILAR {selectedProduct.category.toUpperCase()} & {selectedProduct.subCategory?.toUpperCase()}
                </h4>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {similarProducts.map(sp => (
                    <div 
                      key={sp.id} 
                      onClick={() => addToRecentlyViewed(sp)} 
                      className="w-32 shrink-0 cursor-pointer text-center p-2 rounded-2xl border"
                    >
                      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-stone-100/70 p-1 flex items-center justify-center mb-1.5">
                        <img src={sp.images?.[0]} alt={sp.name} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-[10px] font-bold truncate">{sp.name}</p>
                      <p className="text-[11px] font-black text-amber-500">₹{getDiscountedPrice(sp.price, sp.discount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TRIPLE ACTIONS DETAIL BAR */}
          <div className={`fixed bottom-0 inset-x-0 border-t p-3 z-50 flex gap-2 max-w-2xl mx-auto shadow-2xl ${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
            <button 
              onClick={() => handleSaveForLater(selectedProduct)} 
              className={`px-4 py-3 rounded-2xl font-black text-[11px] uppercase ${darkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}
            >
              📌 Later
            </button>
            <button 
              onClick={() => addToCart(selectedProduct, productPageQty, false)} 
              className="flex-1 py-3 bg-zinc-800 text-white font-black rounded-2xl text-xs uppercase"
            >
              Add to Bag
            </button>
            <button 
              onClick={() => addToCart(selectedProduct, productPageQty, true)} 
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-xs uppercase shadow-xl"
            >
              Buy Now ⚡
            </button>
          </div>
        </div>
      )}

      {/* CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs font-bold border shadow-2xl ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm uppercase">Shop By Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>✕</button>
            </div>
            <div className="space-y-2">
              {FASHION_DEPARTMENTS.slice(1).map(dept => (
                <div 
                  key={dept} 
                  onClick={() => {
                    setActiveDepartment(dept);
                    setActiveCollection("All");
                    setIsCategoryModalOpen(false);
                    setActiveTab("shop");
                  }}
                  className="p-3 bg-zinc-800/40 hover:bg-amber-500 hover:text-zinc-950 rounded-2xl cursor-pointer flex justify-between items-center transition-colors"
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
                <h3 className="text-sm font-black uppercase tracking-wider">Shopping Bag ({cart.length})</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg bg-zinc-800 text-white text-xs">✕</button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-1">
                    <span className="text-4xl block">🛍️</span>
                    <p className="text-xs text-zinc-400 font-bold">Your bag is empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.itemKey} className={`p-3 rounded-2xl border space-y-2 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="flex gap-3">
                        <img src={item.images?.[0]} alt={item.name} className="w-16 h-20 object-contain bg-zinc-100 rounded-xl p-1" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate">{item.name}</h4>
                          <p className="text-[10px] text-zinc-400">Size: {item.selectedSize} | Color: {item.selectedColor}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-black text-sm">₹{getDiscountedPrice(item.price, item.discount) * item.qty}</span>
                            {item.discount > 0 && <span className="text-[10px] text-zinc-400 line-through">₹{item.price * item.qty}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-2 text-xs">
                        <div className="flex items-center border rounded-xl overflow-hidden bg-zinc-800">
                          <button onClick={() => updateCartQty(item.itemKey, -1)} className="px-2.5 py-1 text-white font-black">-</button>
                          <span className="px-3 font-bold text-white">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.itemKey, 1)} className="px-2.5 py-1 text-white font-black">+</button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateCartQty(item.itemKey, -item.qty)} className="text-[11px] font-bold text-zinc-400 hover:text-rose-500">Remove</button>
                          <button onClick={() => moveToWishlist(item)} className="text-[11px] font-bold text-blue-400">Move to Wishlist</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Price Details Breakdown */}
              <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <h4 className="font-black uppercase tracking-wider text-[11px] border-b pb-1">Price Details</h4>
                <div className="flex justify-between text-zinc-400"><span>Price ({cart.length} items)</span><span>₹{rawMRP}</span></div>
                <div className="flex justify-between text-emerald-500"><span>Discounts</span><span>-₹{totalItemSavings}</span></div>
                <div className="flex justify-between text-zinc-400"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
                <div className="flex justify-between border-t pt-2 font-black text-sm"><span>Total Amount</span><span>₹{finalPayableTotal}</span></div>
              </div>
            </div>

            <button 
              onClick={handleCheckoutInit}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95"
            >
              Proceed to Checkout (₹{finalPayableTotal}) →
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      {!isAdminUrl && (
        <nav className={`fixed bottom-0 inset-x-0 border-t p-2 z-40 flex justify-around items-center max-w-md md:max-w-xl mx-auto rounded-t-3xl shadow-2xl ${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
          <button 
            onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); }} 
            className={`flex flex-col items-center transition-colors ${activeTab === 'shop' ? 'text-amber-500 font-black' : 'text-zinc-400'}`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Home</span>
          </button>
          
          <button 
            onClick={() => openModalWithHistory('category')} 
            className="flex flex-col items-center text-zinc-400 hover:text-amber-500 transition-colors"
          >
            <span className="text-lg">🏷️</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Categories</span>
          </button>

          <button 
            onClick={() => setActiveTab("saved")} 
            className={`flex flex-col items-center transition-colors ${activeTab === 'saved' ? 'text-amber-500 font-black' : 'text-zinc-400'}`}
          >
            <span className="text-lg">📌</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Saved</span>
          </button>

          <button 
            onClick={() => openModalWithHistory('cart')} 
            className="flex flex-col items-center relative text-zinc-400"
          >
            <div className="relative">
              <span className="text-lg">🛍️</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-zinc-950 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[9px] uppercase tracking-wider font-black mt-0.5">Bag</span>
          </button>

          <button 
            onClick={() => setActiveTab("account")} 
            className={`flex flex-col items-center transition-colors ${activeTab === 'account' ? 'text-amber-500 font-black' : 'text-zinc-400'}`}
          >
            <span className="text-lg">👤</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Account</span>
          </button>
        </nav>
      )}

    </div>
  );
}
