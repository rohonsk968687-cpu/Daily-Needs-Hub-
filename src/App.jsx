import React, { useState, useEffect } from 'react';
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
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  getDoc, 
  runTransaction 
} from 'firebase/firestore';

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

const FASHION_COLORS = [
  "Black", "White", "Navy Blue", "Olive Green", "Beige", "Maroon", "Charcoal Grey",
  "Lavender", "Baby Pink", "Sky Blue", "Mustard Yellow", "Wine", "Rust", "Cream", "Mint Green"
];

const FABRIC_OPTIONS = [
  "100% French Terry Cotton (240+ GSM)",
  "100% Combed Cotton (180 GSM)",
  "Linen Cotton Blend",
  "Denim / Twill Heavyweight",
  "Polyester Spandex (Dry Fit)",
  "Rayon / Silk Flowy Blend",
  "Fleece / Sherpa Warm Knit",
  "Pure Georgette / Chiffon",
  "Breathable Mesh & EVA Sole"
];

const FIT_OPTIONS = [
  "Oversized / Drop Shoulder Fit",
  "Relaxed Streetwear Fit",
  "Regular / Classic Fit",
  "Slim Fit",
  "Boxy Crop Fit",
  "Skinny Fit",
  "Straight Leg Fit",
  "True to Size / Comfort Footwear"
];

const APPAREL_SIZES_ADULT = ["S", "M", "L", "XL", "XXL", "3XL"];
const KIDS_CLOTHING_SIZES = ["0-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "5-6Y", "7-8Y", "9-10Y", "11-12Y", "13-14Y"];
const FOOTWEAR_SIZES_ADULT = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];
const FOOTWEAR_SIZES_KIDS = ["Kids 1", "Kids 2", "Kids 3", "Kids 4", "Kids 5", "Kids 6", "Kids 7", "Kids 8", "Kids 9", "Kids 10"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
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
  const [adminTab, setAdminTab] = useState("dashboard"); 

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // PWA Install State & Check
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

  // Verification & Payment States
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [verificationCountdown, setVerificationCountdown] = useState(120);
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedOrderReceipt, setCompletedOrderReceipt] = useState(null);

  const [darkMode, setDarkMode] = useState(false);

  // Flash Drop Config
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
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [productPageQty, setProductPageQty] = useState(1);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [pinCheckInput, setPinCheckInput] = useState("");
  const [pinCheckMsg, setPinCheckMsg] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Admin Controls
  const [adminProductDept, setAdminProductDept] = useState("Men");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminDeptFilter, setAdminDeptFilter] = useState("All");
  const [editingProduct, setEditingProduct] = useState(null);

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

  // 5 High-Definition Advertising Posters
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

  // Check if App is already Installed on Phone
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
    if (isStandalone) {
      setIsAlreadyInstalled(true);
      setShowInstallBanner(false);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsAlreadyInstalled(true);
      setShowInstallBanner(false);
      showToastMessage("App installed successfully! 🎉");
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerPwaInstall = async () => {
    if (isAlreadyInstalled) {
      return showToastMessage("STYLE ZONE - X is already installed on your device! 📲", "info");
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToastMessage("Thank you for installing STYLE ZONE - X App! 🚀");
        setIsAlreadyInstalled(true);
      }
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      showToastMessage("Chrome menu (⋮) par jakar 'Install App' ya 'Add to Home screen' dabayein!", "info");
    }
  };

  useEffect(() => {
    const checkPath = () => {
      if (window.location.pathname.includes("/admin") || window.location.hash.includes("admin")) {
        setIsAdminUrl(true);
      } else {
        setIsAdminUrl(false);
      }
    };
    checkPath();
    window.addEventListener("popstate", checkPath);
    window.addEventListener("hashchange", checkPath);

    return () => {
      window.removeEventListener("popstate", checkPath);
      window.removeEventListener("hashchange", checkPath);
    };
  }, []);

  // Admin Verification
  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (user && !user.isAnonymous) {
        if (ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
          return;
        }
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    verifyAdminStatus();
  }, [user]);

  // Account Data Sync
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const loadUserCloudData = async () => {
        const cartDoc = await getDoc(doc(db, "carts", user.uid));
        if (cartDoc.exists()) setCart(cartDoc.data().items || []);
        
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) {
          setCustInfo(prev => ({ 
            ...prev, 
            ...profileDoc.data(),
            email: user.email || profileDoc.data().email || prev.email 
          }));
        } else {
          setCustInfo(prev => ({
            ...prev,
            name: user.displayName || prev.name,
            email: user.email || prev.email
          }));
        }

        const wishDoc = await getDoc(doc(db, "wishlists", user.uid));
        if (wishDoc.exists()) setWishlist(wishDoc.data().items || []);

        const accountRV = localStorage.getItem(`szx_recently_viewed_${user.uid}`);
        if (accountRV) {
          try { setRecentlyViewed(JSON.parse(accountRV)); } catch(e){}
        } else {
          setRecentlyViewed([]);
        }
      };
      loadUserCloudData();
    } else {
      const localCart = localStorage.getItem("szx_guest_cart");
      if (localCart) {
        try { setCart(JSON.parse(localCart)); } catch(e) {}
      } else {
        setCart([]);
      }
      const localWish = localStorage.getItem("szx_guest_wishlist");
      if (localWish) {
        try { setWishlist(JSON.parse(localWish)); } catch(e) {}
      } else {
        setWishlist([]);
      }
      const localProfile = localStorage.getItem("szx_saved_address");
      if (localProfile) {
        try { setCustInfo(prev => ({ ...prev, ...JSON.parse(localProfile) })); } catch(e) {}
      }
      const guestRV = localStorage.getItem("szx_guest_recently_viewed");
      if (guestRV) {
        try { setRecentlyViewed(JSON.parse(guestRV)); } catch(e){}
      } else {
        setRecentlyViewed([]);
      }
    }
  }, [user]);

  const syncCart = async (updatedCart) => {
    setCart(updatedCart);
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "carts", user.uid), { items: updatedCart }, { merge: true });
    } else {
      localStorage.setItem("szx_guest_cart", JSON.stringify(updatedCart));
    }
  };

  const syncWishlistCloud = async (updatedWish) => {
    setWishlist(updatedWish);
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "wishlists", user.uid), { items: updatedWish }, { merge: true });
    } else {
      localStorage.setItem("szx_guest_wishlist", JSON.stringify(updatedWish));
    }
  };

  // Auth & Real-time Listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (!currentUser) {
          signInAnonymously(auth).catch(() => {});
        }
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
    });

    const qRev = collection(db, "reviews");
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qCoup = collection(db, "coupons");
    const unsubCoup = onSnapshot(qCoup, (snapshot) => {
      if (!snapshot.empty) {
        setDynamicCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const unsubFlash = onSnapshot(doc(db, "settings", "flashDrop"), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setFlashConfig(d);
        if (d.expiryHours) setFlashTime(d.expiryHours * 3600);
      }
    });

    return () => { 
      clearInterval(timer); 
      clearInterval(flashTimer);
      unsubProd(); 
      unsubNotif();
      unsubRev();
      unsubCoup();
      unsubFlash();
      unsubscribeAuth(); 
    };
  }, [heroSlides.length]);

  // Scoped Orders Listener
  useEffect(() => {
    let unsubOrder = () => {};
    if (isAdmin) {
      const qAdminOrders = query(collection(db, "orders"));
      unsubOrder = onSnapshot(qAdminOrders, (snapshot) => {
        const sortedDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sortedDocs.sort((a, b) => new Date(b.rawDate || b.createdAt) - new Date(a.rawDate || a.createdAt));
        setOrders(sortedDocs);
      });
    } else if (user && !user.isAnonymous) {
      const qUserOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
      unsubOrder = onSnapshot(qUserOrders, (snapshot) => {
        const sortedDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sortedDocs.sort((a, b) => new Date(b.rawDate || b.createdAt) - new Date(a.rawDate || a.createdAt));
        setOrders(sortedDocs);
      });
    } else {
      setOrders([]);
    }

    return () => unsubOrder();
  }, [user, isAdmin]);

  // 2-Minute Payment Verification Timer
  useEffect(() => {
    let timer = null;
    if (activePaymentOrder && verificationCountdown > 0) {
      timer = setInterval(() => {
        setVerificationCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activePaymentOrder, verificationCountdown]);

  // Real-time verification listener
  useEffect(() => {
    if (!activePaymentOrder) return;
    const unsub = onSnapshot(doc(db, "orders", activePaymentOrder.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.paymentStatus === "Paid & Verified ✅" || data.status === "Confirmed 📦") {
          setCompletedOrderReceipt({ id: docSnap.id, ...data });
          setActivePaymentOrder(null);
          setShowInvoice(true);
          setCart([]);
          syncCart([]);
          showToastMessage("🎉 Payment Received & Verified! Order Confirmed.");
        }
      }
    });
    return () => unsub();
  }, [activePaymentOrder]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if(result.user) {
        setUser(result.user);
        showToastMessage("Welcome to STYLE ZONE - X ✨");
      }
    } catch (error) {
      showToastMessage("Login Error: " + error.message, "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setCart([]);
    setWishlist([]);
    setRecentlyViewed([]);
    setCustInfo({ 
      name: '', nickName: '', gender: 'Male', phone: '', email: '', 
      road: '', landmark: '', vill: '', city: 'Bolpur', dist: 'Birbhum', pin: '' 
    });
    showToastMessage("Logged out successfully! Session cleared.");
  };

  const saveProfileData = async () => {
    if (!custInfo.name || !custInfo.phone) {
      return showToastMessage("Name and mobile number are required!", "error");
    }
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("szx_saved_address", JSON.stringify(custInfo));
    setIsProfileModalOpen(false);
    showToastMessage("My Profile updated successfully! 👤");
  };

  const saveAddressData = async () => {
    if (!custInfo.vill || !custInfo.pin || !custInfo.city || !custInfo.phone) {
      return showToastMessage("Please fill Village, City, PIN and Phone!", "error");
    }
    if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Delivery currently unavailable for PIN: ${custInfo.pin}`, "error");
    }
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("szx_saved_address", JSON.stringify(custInfo));
    setIsAddressModalOpen(false);
    showToastMessage("Saved Delivery Address updated! 📍");
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p, quantity = 1) => {
    if (p.stock <= 0) return showToastMessage("Selected piece is currently out of stock!", "error");

    if (p.availableSizes && p.availableSizes.length > 0 && !selectedSizes[p.id]) {
      return showToastMessage("Please select your Size to proceed!", "error");
    }

    const chosenSize = selectedSizes[p.id] || "Standard";
    const chosenColor = selectedColors[p.id] || (p.availableColors && p.availableColors[0]) || "Default";
    const itemKey = `${p.id}-${chosenSize}-${chosenColor}`;

    const exist = cart.find(x => x.itemKey === itemKey);
    let updatedCart = [];

    if (exist) {
      if (exist.qty + quantity > p.stock) return showToastMessage("Stock limit reached for this variant!", "error");
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
    showToastMessage(`Added ${quantity} piece to bag! 🛍️`);
  };

  const updateCartQty = (itemKey, delta) => {
    const item = cart.find(x => x.itemKey === itemKey);
    if (!item) return;
    const nextQty = item.qty + delta;
    let updatedCart = [];
    if (nextQty <= 0) {
      updatedCart = cart.filter(x => x.itemKey !== itemKey);
    } else {
      if (delta > 0 && nextQty > item.stock) return showToastMessage("Maximum available inventory reached!", "error");
      updatedCart = cart.map(x => (x.itemKey === itemKey) ? { ...item, qty: nextQty } : x);
    }
    syncCart(updatedCart);
  };

  const moveToWishlist = (item) => {
    updateCartQty(item.itemKey, -item.qty);
    toggleWishlist(item);
    showToastMessage("Moved to Wishlist ❤️");
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
    setSelectedProduct(p);
    setCurrentProductSlide(0);
    setProductPageQty(1);
    setPinCheckMsg(null);

    const exists = recentlyViewed.find(x => x.id === p.id);
    let updatedRV = [];
    if (!exists) {
      updatedRV = [p, ...recentlyViewed.slice(0, 7)];
      setRecentlyViewed(updatedRV);
      const storageKey = user && !user.isAnonymous ? `szx_recently_viewed_${user.uid}` : "szx_guest_recently_viewed";
      localStorage.setItem(storageKey, JSON.stringify(updatedRV));
    }
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return showToastMessage("Voice search not supported on this browser", "error");
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

  const handleShareProduct = (p, platform) => {
    const shareText = `Explore "${p.name}" at ₹${getDiscountedPrice(p.price, p.discount)} on STYLE ZONE - X:`;
    const shareUrl = window.location.href;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      showToastMessage("Product link copied! 📋");
    }
  };

  const handleCancelOrder = async (order) => {
    if (!user || (order.userId !== user.uid && !isAdmin)) {
      return showToastMessage("Unauthorized action!", "error");
    }
    if (window.confirm("Cancel this order? Reserved stock will be restored automatically.")) {
      try {
        await runTransaction(db, async (transaction) => {
          for (let it of order.items) {
            const prodRef = doc(db, "products", it.id);
            const prodDoc = await transaction.get(prodRef);
            if (prodDoc.exists()) {
              const currentStock = prodDoc.data().stock || 0;
              transaction.update(prodRef, { stock: currentStock + it.qty });
            }
          }
          const orderRef = doc(db, "orders", order.id);
          transaction.update(orderRef, { status: "Cancelled ❌" });
        });
        showToastMessage("Order cancelled & stock restored! 🔄");
      } catch (err) {
        showToastMessage("Failed to cancel order: " + err.message, "error");
      }
    }
  };

  const handleReturnOrder = async (order) => {
    if (!user || (order.userId !== user.uid && !isAdmin)) {
      return showToastMessage("Unauthorized action!", "error");
    }
    const reason = prompt("Select reason for 7-Day Exchange/Return:\n1. Wrong Size\n2. Fabric Quality Concern\n3. Defective Stitching\n4. Better Style Found");
    if (reason) {
      try {
        await updateDoc(doc(db, "orders", order.id), { 
          status: "Exchange Requested 🔄", 
          returnReason: reason 
        });
        showToastMessage("Return/Exchange initiated! Executive will inspect at pickup.");
      } catch (err) {
        showToastMessage("Failed to process request", "error");
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return showToastMessage("Please write a short review!", "error");
    if (!selectedProduct) return;
    if (!user || user.isAnonymous) return showToastMessage("Please login with Google to write a review!", "error");

    const hasBoughtAndDelivered = orders.some(ord => 
      ord.userId === user.uid && 
      ord.status?.includes("Delivered") &&
      ord.items?.some(it => it.id === selectedProduct.id || it.name === selectedProduct.name)
    );

    try {
      await addDoc(collection(db, "reviews"), {
        productId: selectedProduct.id,
        userId: user.uid,
        userName: custInfo.name || user.displayName || "Customer",
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
        isVerifiedBuyer: hasBoughtAndDelivered,
        createdAt: new Date().toLocaleDateString()
      });
      setReviewComment("");
      showToastMessage(hasBoughtAndDelivered ? "Verified Review published! ⭐" : "Review submitted! ⭐");
    } catch(err) {
      showToastMessage("Failed to publish review", "error");
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    const targetCoup = dynamicCoupons.find(c => c.code === cleanCode);

    if (targetCoup) {
      if (rawCartTotal < (targetCoup.minOrder || 0)) {
        return showToastMessage(`Min order of ₹${targetCoup.minOrder} required for ${cleanCode}!`, "error");
      }
      let disc = 0;
      if (targetCoup.discountType === "fixed") {
        disc = targetCoup.discountValue;
      } else if (targetCoup.discountType === "percentage") {
        disc = Math.round((rawCartTotal * targetCoup.discountValue) / 100);
      } else if (targetCoup.discount) {
        disc = targetCoup.discount;
      }

      setAppliedCoupon({ code: cleanCode, discount: disc });
      showToastMessage(`🎉 Coupon Applied! ₹${disc} OFF`);
    } else {
      showToastMessage("Invalid or expired coupon code!", "error");
    }
  };

  // 5 Images & Dynamic Sizes per Department Add Product
  const addProduct = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToastMessage("Admin privileges required!", "error");
    const el = e.target.elements;

    const img1 = el.itemImg1?.value?.trim() || "";
    const img2 = el.itemImg2?.value?.trim() || "";
    const img3 = el.itemImg3?.value?.trim() || "";
    const img4 = el.itemImg4?.value?.trim() || "";
    const img5 = el.itemImg5?.value?.trim() || "";

    const rawImagesArray = [img1, img2, img3, img4, img5].filter(url => url !== "");
    const imgArray = rawImagesArray.length > 0 ? rawImagesArray : ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80"];

    const activeSizesArray = [];
    e.target.querySelectorAll('input[name="adminSizes"]:checked').forEach(cb => activeSizesArray.push(cb.value));

    const activeColorsArray = [];
    e.target.querySelectorAll('input[name="adminColors"]:checked').forEach(cb => activeColorsArray.push(cb.value));

    try {
      const docRef = await addDoc(collection(db, "products"), { 
        name: el.itemName.value, 
        brand: el.itemBrand.value || "STYLE ZONE - X",
        category: el.itemCategory.value,
        subCategory: el.itemSubCategory.value || "General",
        price: Number(el.itemPrice.value), 
        discount: Number(el.itemDiscount.value) || 0, 
        stock: Number(el.itemStock.value), 
        images: imgArray, 
        availableSizes: activeSizesArray.length > 0 ? activeSizesArray : ["M", "L", "XL"],
        availableColors: activeColorsArray.length > 0 ? activeColorsArray : ["Black", "White"],
        fabric: el.itemFabric.value || "100% French Terry Cotton (240+ GSM)",
        fit: el.itemFit.value || "Oversized / Drop Shoulder Fit",
        specifications: el.itemSpecs.value || "Crafted for durability and breathable comfort.",
        isFlashDeal: el.isFlashDeal?.checked || false,
        createdAt: new Date().toISOString()
      });

      // If marked as flash deal, auto-assign to flashDrop config
      if (el.isFlashDeal?.checked) {
        await setDoc(doc(db, "settings", "flashDrop"), { featuredProductId: docRef.id }, { merge: true });
      }

      e.target.reset();
      showToastMessage("Product published into STYLE ZONE - X catalogue!");
      setAdminTab("manage-items");
    } catch (error) {
      showToastMessage("Database write error: " + error.message, "error");
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToastMessage("Admin privileges required!", "error");
    const el = e.target.elements;
    try {
      await addDoc(collection(db, "coupons"), {
        code: el.coupCode.value.toUpperCase().trim(),
        discountType: el.coupType.value,
        discountValue: Number(el.coupValue.value) || 0,
        minOrder: Number(el.coupMin.value) || 0
      });
      el.reset();
      showToastMessage("Coupon deployed live!");
    } catch(err) {
      showToastMessage("Failed to create coupon", "error");
    }
  };

  // Notification with Poster
  const handleCreateNotification = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToastMessage("Admin privileges required!", "error");
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
      showToastMessage("Broadcast alert with poster dispatched! 📢");
    } catch (err) {
      showToastMessage("Error sending alert", "error");
    }
  };

  // Flash Drop Controller Save
  const handleUpdateFlashDrop = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToastMessage("Admin required!", "error");
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
      showToastMessage("⚡ Flash Drop settings updated live!");
    } catch (err) {
      showToastMessage("Failed to update flash settings", "error");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!isAdmin) return showToastMessage("Admin privileges required!", "error");
    if (window.confirm("Permanently delete this order record? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
        showToastMessage("Order deleted from database!");
      } catch (err) {
        showToastMessage("Failed to delete order", "error");
      }
    }
  };

  // Edit Product Submission (Fixed Stock Grid Edit Bug)
  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !editingProduct) return;
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
        await setDoc(doc(db, "settings", "flashDrop"), { featuredProductId: editingProduct.id }, { merge: true });
      }

      setEditingProduct(null);
      showToastMessage("Product details & stock updated successfully! ✨");
    } catch (err) {
      showToastMessage("Failed to update product: " + err.message, "error");
    }
  };

  // Flipkart Cart Pricing Calculations
  const rawMRP = cart.reduce((a, c) => a + (Number(c.price) || 0) * c.qty, 0);
  const rawCartTotal = cart.reduce((a, c) => a + getDiscountedPrice(c.price, c.discount) * c.qty, 0);
  const totalItemSavings = rawMRP - rawCartTotal;
  const couponDeduction = appliedCoupon ? appliedCoupon.discount : 0;
  const deliveryFee = (rawCartTotal - couponDeduction) >= 999 || rawCartTotal === 0 ? 0 : 40;
  const finalPayableTotal = Math.max(0, rawCartTotal - couponDeduction + deliveryFee);
  const totalSavedEntireOrder = totalItemSavings + couponDeduction;

  // Filter & Search Engine
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
                          (p.subCategory && p.subCategory.toLowerCase().includes(search.toLowerCase()));
    const matchesDepartment = activeDepartment === "All" || p.category === activeDepartment;
    const matchesCollection = activeCollection === "All" || p.subCategory === activeCollection;

    const finalPrice = getDiscountedPrice(p.price, p.discount);
    let matchesPrice = true;
    if (priceFilter === "under500") matchesPrice = finalPrice < 500;
    else if (priceFilter === "500-1000") matchesPrice = finalPrice >= 500 && finalPrice <= 1000;
    else if (priceFilter === "1000-2000") matchesPrice = finalPrice >= 1000 && finalPrice <= 2000;
    else if (priceFilter === "above2000") matchesPrice = finalPrice > 2000;

    let matchesSize = true;
    if (sizeFilter !== "All") {
      matchesSize = p.availableSizes && p.availableSizes.includes(sizeFilter);
    }

    return matchesSearch && matchesDepartment && matchesCollection && matchesPrice && matchesSize;
  }).sort((a, b) => {
    const priceA = getDiscountedPrice(a.price, a.discount);
    const priceB = getDiscountedPrice(b.price, b.discount);
    if (sortBy === "priceLow") return priceA - priceB;
    if (sortBy === "priceHigh") return priceB - priceA;
    if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === "discount") return (b.discount || 0) - (a.discount || 0);
    return 0;
  });

  const adminFilteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(adminSearchQuery.toLowerCase());
    const matchesDept = adminDeptFilter === "All" || p.category === adminDeptFilter;
    return matchesSearch && matchesDept;
  });

  const handleCheckoutInit = async () => {
    if (!user || user.isAnonymous) {
      return showToastMessage("Please login with Google to complete your order!", "error");
    }
    if(!custInfo.name || !custInfo.vill || !custInfo.pin || !custInfo.phone || !custInfo.city) {
      return showToastMessage("Shipping details incomplete! Fill Saved Address.", "error");
    }
    if(!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Delivery unavailable for PIN: ${custInfo.pin}`, "error");
    }

    const fullAddressString = `${custInfo.road ? custInfo.road + ', ' : ''}${custInfo.vill}, Landmark: ${custInfo.landmark || 'N/A'}, ${custInfo.city}, Dist: ${custInfo.dist}, PIN: ${custInfo.pin}`;
    
    try {
      let createdOrder = null;

      await runTransaction(db, async (transaction) => {
        const productReads = [];
        for (let item of cart) {
          const prodRef = doc(db, "products", item.id);
          const prodDoc = await transaction.get(prodRef);
          if (!prodDoc.exists()) {
            throw new Error(`Product ${item.name} not found!`);
          }
          const currentStock = prodDoc.data().stock || 0;
          if (currentStock < item.qty) {
            throw new Error(`Out of stock: Only ${currentStock} left for ${item.name}!`);
          }
          productReads.push({ ref: prodRef, nextStock: currentStock - item.qty });
        }

        for (let update of productReads) {
          transaction.update(update.ref, { stock: update.nextStock });
        }

        const newOrderRef = doc(collection(db, "orders"));
        const orderPayload = {
          orderIdRef: `SZ-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: user.uid,
          customerName: custInfo.name,
          phone: custInfo.phone,
          address: fullAddressString,
          userEmail: user.email || custInfo.email || "N/A",
          items: cart.map(i => ({ 
            id: i.id,
            name: i.name, 
            qty: i.qty, 
            total: getDiscountedPrice(i.price, i.discount) * i.qty, 
            size: i.selectedSize || "N/A",
            color: i.selectedColor || "N/A"
          })),
          rawTotal: rawCartTotal,
          couponDiscount: couponDeduction,
          deliveryFee: deliveryFee,
          totalAmount: finalPayableTotal,
          paymentMode: paymentType === "COD" ? "Cash on Delivery" : "Prepaid UPI",
          paymentStatus: paymentType === "UPI" ? "Verifying (2 Min Timer) ⏳" : "COD (Pay on Delivery)",
          status: paymentType === "COD" ? "Confirmed 📦" : "Awaiting Verification ⏳",
          createdAt: new Date().toLocaleString(),
          rawDate: new Date().toISOString()
        };

        transaction.set(newOrderRef, orderPayload);
        createdOrder = { id: newOrderRef.id, ...orderPayload };
      });

      setIsCartOpen(false);

      if (paymentType === "UPI") {
        window.open(getUPIIntentLink(), '_blank');
        setActivePaymentOrder(createdOrder);
        setVerificationCountdown(120);
      } else {
        setCompletedOrderReceipt(createdOrder);
        setShowInvoice(true);
        setCart([]);
        syncCart([]);
        showToastMessage("Order placed successfully with Cash on Delivery!");
      }
    } catch (e) {
      showToastMessage(e.message || "Transaction aborted!", "error");
    }
  };

  const sendWhatsAppNotification = () => {
    if (!completedOrderReceipt) return;
    const itemsMsg = completedOrderReceipt.items.map(i => `${i.name} [Size: ${i.size}, Color: ${i.color}] (x${i.qty}) - ₹${i.total}`).join(", ");
    const msg = `⚡ *NEW ORDER: STYLE ZONE - X*\nRef ID: #${completedOrderReceipt.orderIdRef}\nCustomer: ${completedOrderReceipt.customerName}\nPhone: ${completedOrderReceipt.phone}\nAddress: ${completedOrderReceipt.address}\nItems: ${itemsMsg}\nTotal Amount: ₹${completedOrderReceipt.totalAmount}\nPayment: ${completedOrderReceipt.paymentMode}`;
    window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
    setShowInvoice(false);
  };

  const formatTimer = (time) => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePinCheck = (pin) => {
    setPinCheckInput(pin);
    if (!pin || pin.length < 6) {
      setPinCheckMsg(null);
      return;
    }
    if (ALLOWED_PINS.includes(pin.trim())) {
      setPinCheckMsg({ type: "success", text: "✅ Express Fashion Delivery Available (2-3 Days)" });
    } else {
      setPinCheckMsg({ type: "error", text: "❌ Delivery to this PIN will open in next phase." });
    }
  };

  const getUPIIntentLink = () => {
    const merchantName = "STYLE ZONE X";
    return `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(merchantName)}&am=${finalPayableTotal}&tn=${encodeURIComponent("STYLE ZONE X Order")}&cu=INR`;
  };

  const productReviews = selectedProduct ? reviews.filter(r => r.productId === selectedProduct.id) : [];

  const similarProducts = selectedProduct ? products.filter(p => 
    p.id !== selectedProduct.id && 
    (p.category === selectedProduct.category || p.subCategory === selectedProduct.subCategory)
  ).slice(0, 6) : [];

  // Helper for Product Image Slide in Modal
  const nextSlide = () => {
    if (!selectedProduct || !selectedProduct.images) return;
    setCurrentProductSlide(prev => (prev + 1) % selectedProduct.images.length);
  };

  const prevSlide = () => {
    if (!selectedProduct || !selectedProduct.images) return;
    setCurrentProductSlide(prev => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-white' : 'bg-[#FAFAF9] text-zinc-900'} pb-28 transition-colors duration-300 font-sans selection:bg-zinc-900 selection:text-white`}>
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2.5 animate-bounce ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-zinc-950 text-white border border-zinc-700'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '⚡'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* PWA Floating Install Banner (Hidden if already installed) */}
      {showInstallBanner && !isAlreadyInstalled && !isAdminUrl && (
        <div className="fixed top-16 inset-x-3 md:max-w-md md:mx-auto z-40 bg-zinc-950 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-zinc-700 animate-bounce">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📲</span>
            <div>
              <p className="font-black text-xs">Install STYLE ZONE - X App</p>
              <p className="text-[10px] text-zinc-400 font-medium">Faster shopping & direct home screen access</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={triggerPwaInstall}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs rounded-xl shadow active:scale-95"
            >
              Install
            </button>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="p-1 text-zinc-400 hover:text-white text-xs font-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto">
        
        {/* PERMANENT HIGH-VISIBILITY LUXURY HEADER */}
        <header className={`${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'} backdrop-blur-md sticky top-0 z-40 border-b w-full shadow-sm`}>
          <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); setActiveCollection("All"); }}
            >
              <div className="w-9 h-9 bg-zinc-950 text-white rounded-xl flex items-center justify-center font-black tracking-tighter text-lg shadow-sm border border-zinc-700 group-hover:bg-amber-600 transition-colors">
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
              {!isAdminUrl && (
                <>
                  <button 
                    onClick={() => setIsNotifOpen(true)} 
                    className={`p-2.5 rounded-full text-xs relative transition-all active:scale-95 ${darkMode ? 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`} 
                    title="Notifications"
                  >
                    🔔 {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{notifications.length}</span>}
                  </button>
                  <button 
                    onClick={() => setIsWishlistOpen(true)} 
                    className={`p-2.5 rounded-full text-xs relative transition-all active:scale-95 ${darkMode ? 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`} 
                    title="Wishlist"
                  >
                    ❤️ {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{wishlist.length}</span>}
                  </button>
                </>
              )}
              
              {!user && !isAdminUrl && (
                <button onClick={handleGoogleLogin} className="bg-zinc-950 text-white border border-zinc-700 text-[11px] font-black px-4 py-2 rounded-xl shadow transition-all active:scale-95">
                  Sign In
                </button>
              )}
              {user && !isAdminUrl && (
                <button onClick={() => setActiveTab("account")} className={`p-2 rounded-full text-xs ${darkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`} title="Profile">
                  👤
                </button>
              )}
              
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`p-2.5 rounded-full text-xs transition-all ${darkMode ? 'bg-zinc-800 text-amber-300' : 'bg-zinc-100 text-zinc-700'}`}
                title="Toggle Theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* Department Pills */}
          {!isAdminUrl && (
            <div className={`px-4 py-2 border-t overflow-x-auto no-scrollbar flex items-center gap-3 ${darkMode ? 'border-zinc-850' : 'border-zinc-100'}`}>
              {FASHION_DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  onClick={() => { setActiveDepartment(dept); setActiveCollection("All"); setActiveTab("shop"); }}
                  className={`text-xs uppercase font-black tracking-wider px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    activeDepartment === dept 
                      ? (darkMode ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white shadow-sm') 
                      : (darkMode ? 'text-zinc-400 bg-zinc-900' : 'text-zinc-500 bg-zinc-100/70')
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* PERMANENT SEARCH BAR */}
        {!isAdminUrl && (
          <div className={`px-4 py-2.5 border-b sticky top-[95px] md:top-[100px] z-30 shadow-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="max-w-7xl mx-auto relative flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search dresses, oversized tees, sneakers, kurtis..." 
                  value={search}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-xs md:text-sm font-semibold focus:outline-none transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={startVoiceSearch} 
                className={`p-2.5 px-3 rounded-2xl border text-sm transition-all shadow-sm ${isListening ? 'bg-rose-600 text-white animate-pulse' : (darkMode ? 'bg-zinc-900 text-zinc-200 border-zinc-800' : 'bg-zinc-100 text-zinc-800 border-zinc-200')}`}
                title="Voice Search"
              >
                🎙️
              </button>
              <button 
                onClick={() => setIsFilterDrawerOpen(true)}
                className={`p-2.5 px-3 rounded-2xl border text-sm transition-all shadow-sm ${darkMode ? 'bg-zinc-900 text-zinc-200 border-zinc-800' : 'bg-zinc-100 text-zinc-800 border-zinc-200'}`}
                title="Filters"
              >
                ⚙️
              </button>

              {showSuggestions && search.length > 0 && (
                <div className={`absolute top-full left-0 right-0 border rounded-2xl shadow-2xl z-40 max-h-52 overflow-y-auto mt-1 p-2 text-xs font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
                  {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => { setSearch(p.name); setShowSuggestions(false); }}
                      className="p-2.5 hover:bg-zinc-800/40 rounded-xl cursor-pointer flex items-center justify-between"
                    >
                      <span>{p.name} ({p.category})</span>
                      <span className="text-[11px] font-black text-amber-500">₹{getDiscountedPrice(p.price, p.discount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="w-full max-w-md md:max-w-7xl mx-auto">

          {/* ADMIN PORTAL GATEWAY */}
          {isAdminUrl ? (
            <div className="p-4">
              <div className={`p-6 rounded-3xl shadow-xl border max-w-3xl mx-auto ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest leading-none">STYLE ZONE - X ACCESS</h2>
                    <p className="text-[10px] uppercase text-zinc-400 font-bold mt-0.5">Admin Management Control Center</p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => { setIsAdmin(false); window.location.href = "/"; }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-black"
                    >
                      Exit Admin
                    </button>
                  )}
                </div>
                
                {!isAdmin ? (
                  <div className="space-y-4 max-w-xs mx-auto py-8 text-center">
                    <p className="text-xs text-zinc-400 font-bold">Sign in with an Authorized Admin Google Account:</p>
                    <button 
                      onClick={handleGoogleLogin} 
                      className="w-full py-3 bg-zinc-950 text-white border border-zinc-800 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg"
                    >
                      Sign In with Admin Google Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={`grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl border ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                      <button 
                        onClick={() => setAdminTab("dashboard")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'dashboard' ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-950 text-white') : 'text-zinc-400'}`}
                      >
                        📊 Home
                      </button>
                      <button 
                        onClick={() => setAdminTab("add-item")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'add-item' ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-950 text-white') : 'text-zinc-400'}`}
                      >
                        ➕ Add Stock
                      </button>
                      <button 
                        onClick={() => setAdminTab("manage-items")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'manage-items' ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-950 text-white') : 'text-zinc-400'}`}
                      >
                        📋 Stock Grid
                      </button>
                      <button 
                        onClick={() => setAdminTab("orders")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'orders' ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-950 text-white') : 'text-zinc-400'}`}
                      >
                        🚚 Orders ({orders.length})
                      </button>
                    </div>

                    {/* 1. Dashboard Tab */}
                    {adminTab === "dashboard" && (
                      <div className="space-y-6">
                        <div className="bg-zinc-950 rounded-3xl p-5 text-white space-y-4 shadow-xl border border-zinc-800">
                          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Live Commerce Engine</h3>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white/5 p-3 rounded-2xl">
                              <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Total Sales</p>
                              <p className="text-base font-black text-emerald-400 mt-1">₹{orders.reduce((a,c) => a + (Number(c.totalAmount) || 0), 0)}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl">
                              <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Total Orders</p>
                              <p className="text-base font-black text-white mt-1">{orders.length}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl">
                              <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Active SKUs</p>
                              <p className="text-base font-black text-yellow-400 mt-1">{products.length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Flash Drop Live Controller */}
                        <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                          <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                            ⚡ Dynamic Flash Drop & Deal Controller
                          </h4>
                          <form onSubmit={handleUpdateFlashDrop} className="space-y-2.5 text-xs">
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Deal Title</label>
                              <input name="flashTitle" defaultValue={flashConfig.title} className="w-full p-2 border rounded-xl font-bold bg-white text-zinc-900" />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Subtitle / Offer Code</label>
                              <input name="flashSub" defaultValue={flashConfig.subtitle} className="w-full p-2 border rounded-xl font-bold bg-white text-zinc-900" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-zinc-400 font-bold uppercase">Select Featured Item</label>
                                <select name="flashProduct" defaultValue={flashConfig.featuredProductId} className="w-full p-2 border rounded-xl font-bold bg-white text-zinc-900">
                                  <option value="">None (General Offer)</option>
                                  {products.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-zinc-400 font-bold uppercase">Duration (Hours)</label>
                                <input name="flashHours" type="number" defaultValue={flashConfig.expiryHours || 4} className="w-full p-2 border rounded-xl font-bold bg-white text-zinc-900" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Flash Deal Poster Image URL</label>
                              <input name="flashPoster" defaultValue={flashConfig.posterUrl} placeholder="https://..." className="w-full p-2 border rounded-xl font-bold bg-white text-zinc-900" />
                            </div>
                            <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl uppercase">
                              Update Flash Drop Live
                            </button>
                          </form>
                        </div>

                        {/* Broadcast Alerts Control with Poster */}
                        <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                          <h4 className="text-xs font-black uppercase tracking-wider">📢 Broadcast Customer Alert with Poster</h4>
                          <form onSubmit={handleCreateNotification} className="space-y-2">
                            <input name="notifTitle" placeholder="Notification Title" className="w-full p-2 border rounded-xl text-xs font-bold bg-white text-zinc-900" required />
                            <textarea name="notifDesc" placeholder="Notification text..." className="w-full p-2 border rounded-xl text-xs font-medium bg-white text-zinc-900" rows="2" required />
                            <input name="notifPoster" placeholder="Poster Image URL (optional)" className="w-full p-2 border rounded-xl text-xs font-medium bg-white text-zinc-900" />
                            <button type="submit" className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-black">Publish Alert</button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* 2. Add Stock Tab (With 5 Images, Department Specific Sizes, Fabrics, Fits, Colors) */}
                    {adminTab === "add-item" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider">➕ Add Fresh Inventory Piece</h3>
                        <form onSubmit={addProduct} className="space-y-3 text-xs">
                          <div>
                            <label className="text-[10px] text-zinc-400 font-bold uppercase">Item Name *</label>
                            <input name="itemName" placeholder="e.g. Oversized Acid Wash Heavyweight Tee" className="w-full p-2.5 border rounded-xl font-bold bg-white text-zinc-900" required />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Brand</label>
                              <input name="itemBrand" defaultValue="STYLE ZONE - X" className="w-full p-2.5 border rounded-xl font-bold bg-white text-zinc-900" />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Department</label>
                              <select 
                                name="itemCategory" 
                                value={adminProductDept} 
                                onChange={(e) => setAdminProductDept(e.target.value)}
                                className="w-full p-2.5 border rounded-xl font-bold bg-white text-zinc-900"
                              >
                                {FASHION_DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-zinc-400 font-bold uppercase">Sub-Category Collection</label>
                            <input name="itemSubCategory" placeholder="e.g. Oversized T-Shirts / Sneakers" className="w-full p-2.5 border rounded-xl font-bold bg-white text-zinc-900" />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">MRP Price (₹) *</label>
                              <input name="itemPrice" type="number" placeholder="1299" className="w-full p-2.5 border rounded-xl font-bold bg-white text-zinc-900" required />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Discount %</label>
                              <input name="itemDiscount" type="number" placeholder="20" className="w-full p-2.5 border rounded-xl font-bold bg-white text-zinc-900" />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Stock Count *</label>
                              <input name="itemStock" type="number" placeholder="10" className="w-full p-2.5 border rounded-xl font-bold bg-white text-zinc-900" required />
                            </div>
                          </div>

                          {/* 5 Product Images */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-bold uppercase">5 Product Images (URLs)</label>
                            <input name="itemImg1" placeholder="Image 1 (Main Front - Required)" className="w-full p-2 border rounded-xl bg-white text-zinc-900" required />
                            <input name="itemImg2" placeholder="Image 2 (Back / Side View)" className="w-full p-2 border rounded-xl bg-white text-zinc-900" />
                            <input name="itemImg3" placeholder="Image 3 (Fabric Detail Close-up)" className="w-full p-2 border rounded-xl bg-white text-zinc-900" />
                            <input name="itemImg4" placeholder="Image 4 (Model / On-Body Fit)" className="w-full p-2 border rounded-xl bg-white text-zinc-900" />
                            <input name="itemImg5" placeholder="Image 5 (Lifestyle / Packaging)" className="w-full p-2 border rounded-xl bg-white text-zinc-900" />
                          </div>

                          {/* Department Specific Sizing (No Mix-ups) */}
                          <div className="p-3 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-1.5">
                            <label className="text-[10px] text-amber-400 font-bold uppercase block">
                              Available Sizes for: {adminProductDept}
                            </label>
                            
                            {/* Men & Women Adult Apparel Sizes */}
                            {(adminProductDept === "Men" || adminProductDept === "Women") && (
                              <div className="flex flex-wrap gap-2">
                                {APPAREL_SIZES_ADULT.map(sz => (
                                  <label key={sz} className="flex items-center gap-1 bg-white text-zinc-900 px-2.5 py-1 border rounded-lg cursor-pointer">
                                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["M", "L", "XL"].includes(sz)} />
                                    <span className="font-bold">{sz}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Kids Clothing Age Sizes */}
                            {adminProductDept === "Kids" && (
                              <div className="flex flex-wrap gap-2">
                                {KIDS_CLOTHING_SIZES.map(sz => (
                                  <label key={sz} className="flex items-center gap-1 bg-white text-zinc-900 px-2 py-1 border rounded-lg cursor-pointer">
                                    <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["2-3Y", "4-5Y"].includes(sz)} />
                                    <span className="font-bold">{sz}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Footwear Adult & Kids Sizes */}
                            {adminProductDept === "Footwear" && (
                              <div className="space-y-2">
                                <p className="text-[9px] uppercase font-bold text-zinc-400">Adult Footwear (UK Sizes):</p>
                                <div className="flex flex-wrap gap-2">
                                  {FOOTWEAR_SIZES_ADULT.map(sz => (
                                    <label key={sz} className="flex items-center gap-1 bg-white text-zinc-900 px-2 py-1 border rounded-lg cursor-pointer">
                                      <input type="checkbox" name="adminSizes" value={sz} defaultChecked={["UK 7", "UK 8", "UK 9"].includes(sz)} />
                                      <span className="font-bold">{sz}</span>
                                    </label>
                                  ))}
                                </div>
                                <p className="text-[9px] uppercase font-bold text-zinc-400 pt-1">Kids Footwear Sizes:</p>
                                <div className="flex flex-wrap gap-2">
                                  {FOOTWEAR_SIZES_KIDS.map(sz => (
                                    <label key={sz} className="flex items-center gap-1 bg-white text-zinc-900 px-2 py-1 border rounded-lg cursor-pointer">
                                      <input type="checkbox" name="adminSizes" value={sz} />
                                      <span className="font-bold">{sz}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Clothes Colors Palette Selection */}
                          <div>
                            <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Color Options</label>
                            <div className="flex flex-wrap gap-1.5">
                              {FASHION_COLORS.map(col => (
                                <label key={col} className="flex items-center gap-1 bg-white text-zinc-900 px-2 py-0.5 border rounded-lg text-[10px] cursor-pointer">
                                  <input type="checkbox" name="adminColors" value={col} defaultChecked={["Black", "White"].includes(col)} />
                                  <span className="font-bold">{col}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Fabric & Fit Standard Select Dropdowns */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Fabric / Material</label>
                              <select name="itemFabric" className="w-full p-2 border rounded-xl bg-white text-zinc-900 font-bold">
                                {FABRIC_OPTIONS.map(fab => <option key={fab} value={fab}>{fab}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Fitting Silhouette</label>
                              <select name="itemFit" className="w-full p-2 border rounded-xl bg-white text-zinc-900 font-bold">
                                {FIT_OPTIONS.map(fit => <option key={fit} value={fit}>{fit}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-2 cursor-pointer bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                              <input type="checkbox" name="isFlashDeal" className="w-4 h-4 accent-amber-500" />
                              <span className="font-black text-amber-400 text-xs">⚡ Feature this item in Today's Flash Drop</span>
                            </label>
                          </div>

                          <textarea name="itemSpecs" placeholder="Product details & styling notes..." rows="2" className="w-full p-2.5 border rounded-xl bg-white text-zinc-900" />

                          <button type="submit" className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg">
                            Publish Stock Item
                          </button>
                        </form>
                      </div>
                    )}

                    {/* 3. Manage Items Stock Grid (Edit Button Fully Working) */}
                    {adminTab === "manage-items" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Search SKU..." 
                            value={adminSearchQuery} 
                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                            className="flex-1 p-2.5 border rounded-xl bg-white text-zinc-900 text-xs font-bold" 
                          />
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                          {adminFilteredProducts.map(p => (
                            <div key={p.id} className={`p-3 border rounded-2xl flex justify-between items-center text-xs font-bold ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                              <div>
                                <p className="font-black text-sm">{p.name} {p.isFlashDeal && <span className="text-amber-400 text-[10px]">⚡ [Flash Drop]</span>}</p>
                                <p className="text-[10px] text-zinc-400">{p.category} → {p.subCategory} | Stock: <span className="text-amber-500 font-black">{p.stock}</span> | ₹{p.price}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingProduct(p)} className="p-2 bg-blue-50 text-blue-600 rounded-xl font-bold">✏ Edit</button>
                                <button onClick={async () => { if(window.confirm("Delete item permanently?")) await deleteDoc(doc(db, "products", p.id)); }} className="p-2 bg-rose-50 text-rose-600 rounded-xl font-bold">🗑️ Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Orders Room */}
                    {adminTab === "orders" && (
                      <div className="space-y-3 max-h-[65vh] overflow-y-auto">
                        {orders.map(ord => (
                          <div key={ord.id} className={`p-4 border rounded-2xl space-y-2 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className="flex justify-between items-center font-black border-b pb-1">
                              <span>Ref: #{ord.orderIdRef || ord.id.slice(0,6)}</span>
                              <span className="text-sm font-black">₹{ord.totalAmount}</span>
                            </div>
                            <p><b>Buyer:</b> {ord.customerName} ({ord.phone})</p>
                            <p className="text-zinc-400"><b>Address:</b> {ord.address}</p>
                            <p className="text-zinc-300 font-bold"><b>Payment:</b> {ord.paymentMode} - <span className="text-emerald-500">{ord.paymentStatus}</span></p>
                            
                            <div className={`p-2 rounded-xl border space-y-1 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                              {ord.items?.map((it, idx) => (
                                <p key={idx}>• {it.name} [{it.size}, {it.color}] x{it.qty}</p>
                              ))}
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                              <select 
                                value={ord.status} 
                                onChange={async (e) => {
                                  await updateDoc(doc(db, "orders", ord.id), { status: e.target.value });
                                  showToastMessage("Status updated!");
                                }}
                                className="p-1.5 border rounded-xl bg-white text-zinc-900 font-black text-[10px]"
                              >
                                <option value="Confirmed 📦">Confirmed 📦</option>
                                <option value="Shipped 🚚">Shipped 🚚</option>
                                <option value="Out for Delivery 📦">Out for Delivery 📦</option>
                                <option value="Delivered ✅">Delivered ✅</option>
                                <option value="Exchange Requested 🔄">Exchange Requested 🔄</option>
                                <option value="Cancelled ❌">Cancelled ❌</option>
                              </select>

                              {ord.paymentStatus?.includes("Timer") && (
                                <button 
                                  onClick={async () => {
                                    await updateDoc(doc(db, "orders", ord.id), { 
                                      paymentStatus: "Paid & Verified ✅",
                                      status: "Confirmed 📦"
                                    });
                                    showToastMessage("Payment Approved! Customer notified.");
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-xl font-black text-[10px]"
                                >
                                  ✓ Approve UPI
                                </button>
                              )}
                              
                              <a href={`tel:${ord.phone}`} className="px-3 py-1.5 bg-zinc-950 text-white rounded-xl font-black text-[10px]">Call</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CUSTOMER FACING STOREFRONT */
            <>
              {activeTab === "shop" && (
                <>
                  {/* 5 ADVERTISING LUXURY HERO POSTERS */}
                  <div className="px-4 my-3">
                    <div className="relative h-72 md:h-[420px] w-full rounded-3xl overflow-hidden shadow-xl border border-zinc-800">
                      {heroSlides.map((s, idx) => (
                        <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                          <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent p-6 md:p-10 flex flex-col justify-center text-white">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full backdrop-blur-md w-fit mb-2">
                              {s.badge}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase leading-tight font-serif max-w-sm">
                              {s.title}
                            </h2>
                            <p className="text-xs md:text-sm text-zinc-300 font-medium mb-4 max-w-xs leading-relaxed">
                              {s.subtitle}
                            </p>
                            <button 
                              onClick={() => { setActiveDepartment(s.dept); setActiveCollection("All"); }}
                              className="w-fit bg-white text-zinc-950 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
                            >
                              {s.btnText} →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DYNAMIC FLASH SALE STRIP */}
                  <div className="px-4 mb-4">
                    <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-4 rounded-3xl flex items-center justify-between shadow-lg border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-pulse">⚡</span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">{flashConfig.title}</h4>
                          <p className="text-[10px] text-zinc-300 font-medium">{flashConfig.subtitle}</p>
                        </div>
                      </div>
                      <div className="bg-white/10 px-3 py-2 rounded-2xl border border-white/10 font-mono font-black text-xs text-yellow-300 tracking-wider">
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
                          className={`cursor-pointer group flex flex-col items-center p-2 rounded-2xl border transition-all ${
                            activeDepartment === dept.title 
                              ? (darkMode ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-zinc-950 text-white border-zinc-950 shadow-md') 
                              : (darkMode ? 'bg-zinc-900/40 text-zinc-300 border-zinc-800' : 'bg-white text-zinc-800 border-zinc-200/80')
                          }`}
                        >
                          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden mb-1.5 border border-zinc-700">
                            <img src={dept.img} alt={dept.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider">{dept.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SHIFTED SUB-CATEGORY PILLS: PLACED EXACTLY BELOW SHOP BY DEPARTMENT */}
                  {activeDepartment !== "All" && FASHION_COLLECTIONS_MAP[activeDepartment] && (
                    <div className="px-4 mb-5">
                      <div className={`p-2 rounded-2xl border overflow-x-auto no-scrollbar flex items-center gap-2 ${darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <button
                          onClick={() => setActiveCollection("All")}
                          className={`text-[11px] font-black px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                            activeCollection === "All"
                              ? (darkMode ? 'bg-white text-zinc-950 shadow-sm' : 'bg-zinc-950 text-white shadow-sm')
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          All {activeDepartment}
                        </button>
                        {FASHION_COLLECTIONS_MAP[activeDepartment].map(col => (
                          <button
                            key={col.name}
                            onClick={() => setActiveCollection(col.name)}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                              activeCollection === col.name
                                ? (darkMode ? 'bg-white text-zinc-950 shadow-sm' : 'bg-zinc-950 text-white shadow-sm')
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>{col.icon}</span>
                            <span>{col.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2-COLUMN LUXURY PRODUCT GRID */}
                  <div className="px-4 mb-8">
                    {isProductsLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[1,2,3,4].map(idx => (
                          <div key={idx} className={`rounded-2xl p-2.5 border animate-pulse space-y-2 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                            <div className="aspect-[4/5] bg-zinc-800 rounded-xl w-full"></div>
                            <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                            <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filtered.length === 0 ? (
                          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed p-6 space-y-2">
                            <span className="text-4xl block">🔍</span>
                            <h4 className="font-black text-sm">No Fashion Pieces Found</h4>
                            <p className="text-xs text-zinc-400 font-bold">Try adjusting your filters or department.</p>
                          </div>
                        ) : (
                          filtered.map(p => {
                            const finalPrice = getDiscountedPrice(p.price, p.discount);
                            const isWish = wishlist.find(x => x.id === p.id);
                            const mainImg = p.images?.[0] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80";
                            return (
                              <div 
                                key={p.id} 
                                className={`rounded-2xl p-2 border transition-all duration-300 flex flex-col justify-between group relative ${
                                  darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200/80 text-zinc-900'
                                }`}
                              >
                                <div 
                                  className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100/70 cursor-pointer flex items-center justify-center p-2 mb-2"
                                  onClick={() => addToRecentlyViewed(p)}
                                >
                                  <img 
                                    src={mainImg} 
                                    alt={p.name} 
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                  />

                                  {p.discount > 0 && (
                                    <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow">
                                      -{p.discount}%
                                    </span>
                                  )}

                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }} 
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-xs shadow-md active:scale-90 transition-transform"
                                  >
                                    {isWish ? "❤️" : "🤍"}
                                  </button>
                                </div>

                                <div className="space-y-1 px-1">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 truncate">
                                    {p.brand || "STYLE ZONE - X"}
                                  </p>
                                  <h4 
                                    onClick={() => addToRecentlyViewed(p)} 
                                    className="text-xs md:text-sm font-bold line-clamp-2 leading-snug cursor-pointer hover:underline"
                                  >
                                    {p.name}
                                  </h4>

                                  <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                    <span>★ 4.8</span>
                                    <span className="text-zinc-400 font-medium">(24)</span>
                                  </div>

                                  <div className="pt-0.5">
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                      <span className="text-sm md:text-base font-black">
                                        ₹{finalPrice}
                                      </span>
                                      {p.discount > 0 && (
                                        <span className="text-[10px] md:text-xs text-zinc-400 line-through font-bold">
                                          ₹{p.price}
                                        </span>
                                      )}
                                    </div>
                                    {p.discount > 0 && (
                                      <p className="text-[9px] text-emerald-500 font-black">
                                        Save ₹{p.price - finalPrice}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-2.5 pt-1">
                                  <button 
                                    onClick={() => addToRecentlyViewed(p)} 
                                    className={`w-full py-2 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all active:scale-95 ${
                                      darkMode ? 'bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-100' : 'bg-zinc-100 hover:bg-zinc-950 hover:text-white text-zinc-900'
                                    }`}
                                  >
                                    Quick View
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* RECENTLY VIEWED ROW */}
                  {recentlyViewed.length > 0 && (
                    <div className={`mx-4 my-8 p-4 rounded-3xl border shadow-sm space-y-3 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200/80'}`}>
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                          👁️ Recently Viewed
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-bold">{recentlyViewed.length} items</span>
                      </div>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                        {recentlyViewed.map(rv => (
                          <div 
                            key={rv.id} 
                            onClick={() => addToRecentlyViewed(rv)} 
                            className="w-28 shrink-0 cursor-pointer text-center group"
                          >
                            <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-stone-100/70 p-1.5 flex items-center justify-center mb-1 group-hover:border-zinc-500 transition-all">
                              <img src={rv.images?.[0] || rv.img} alt={rv.name} className="w-full h-full object-contain" />
                            </div>
                            <p className="text-[10px] font-bold truncate">{rv.name}</p>
                            <p className="text-[10px] font-black text-amber-500">₹{getDiscountedPrice(rv.price, rv.discount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STORE FOOTER */}
                  <footer className={`mt-12 border-t p-6 md:p-10 space-y-6 ${darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-zinc-950 text-white rounded flex items-center justify-center font-black text-xs border border-zinc-700">X</div>
                          <span className="font-serif font-black text-sm tracking-widest">{BRAND_NAME}</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Your premium hub for oversized streetwear, knitwear, ethnic silhouettes, and sneakers.
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <h5 className="font-black uppercase tracking-wider text-zinc-400 text-[10px]">Shop Departments</h5>
                        <p onClick={() => { setActiveDepartment("Men"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="cursor-pointer hover:underline">Men's Streetwear</p>
                        <p onClick={() => { setActiveDepartment("Women"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="cursor-pointer hover:underline">Women's Couture</p>
                        <p onClick={() => { setActiveDepartment("Footwear"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="cursor-pointer hover:underline">Sneakers & Kicks</p>
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <h5 className="font-black uppercase tracking-wider text-zinc-400 text-[10px]">Assurance & Policy</h5>
                        <p>✓ 7-Day Hassle Free Returns</p>
                        <p>✓ 100% Genuine Fabrics</p>
                        <p>✓ Express Delivery in PIN: 731204 & Region</p>
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <h5 className="font-black uppercase tracking-wider text-zinc-400 text-[10px]">Support & Contact</h5>
                        <p>WhatsApp: +91 8637589429</p>
                        <p>Email: stylezone.x0@gmail.com</p>
                        <p>Bolpur, West Bengal - 731204</p>
                      </div>
                    </div>
                    <div className="border-t border-zinc-800 pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-zinc-400 font-bold gap-2">
                      <span>© {new Date().getFullYear()} STYLE ZONE - X. All rights reserved.</span>
                      <span>Designed & Engineered for Speed & Style.</span>
                    </div>
                  </footer>
                </>
              )}

              {/* ACCOUNT SECTION (Shows installed status) */}
              {activeTab === "account" && (
                <div className="p-3 md:p-6 space-y-4 max-w-xl mx-auto pb-10">
                  <div className={`p-5 rounded-3xl border shadow-sm space-y-3 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-lg">
                          {(custInfo.name || user?.displayName || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-base leading-tight">
                            Hey, {custInfo.name || user?.displayName || "Style Zone Insider"}
                          </h3>
                          <p className="text-xs text-zinc-400 font-bold mt-0.5">{user?.email || custInfo.email || custInfo.phone || "Guest Shopper"}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowSupportModal(true)} className="p-2 border border-zinc-700 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95">
                        🎧 Help
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <div 
                        onClick={() => {
                          const elem = document.getElementById("my-orders-scroll-target");
                          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`p-3 border rounded-2xl flex items-center gap-2.5 cursor-pointer transition-colors ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}
                      >
                        <span className="text-xl">📦</span>
                        <div>
                          <p className="font-black text-xs">Orders</p>
                          <p className="text-[10px] text-zinc-400 font-bold">{orders.length} Placed</p>
                        </div>
                      </div>
                      <div 
                        onClick={() => setIsWishlistOpen(true)}
                        className={`p-3 border rounded-2xl flex items-center gap-2.5 cursor-pointer transition-colors ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}
                      >
                        <span className="text-xl text-rose-600">❤️</span>
                        <div>
                          <p className="font-black text-xs">Wishlist</p>
                          <p className="text-[10px] text-zinc-400 font-bold">{wishlist.length} Items</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Settings Menu */}
                  <div className={`rounded-3xl border shadow-sm divide-y text-xs font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200 divide-zinc-800' : 'bg-white border-zinc-200 text-zinc-700 divide-zinc-100'}`}>
                    <div onClick={() => setIsProfileModalOpen(true)} className="p-4 flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-2.5">👤 My Profile (Name, Gender, Contact)</span>
                      <span>›</span>
                    </div>
                    <div onClick={() => setIsAddressModalOpen(true)} className="p-4 flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-2.5">📍 Saved Addresses (House, Landmark, Dist)</span>
                      <span>›</span>
                    </div>

                    {/* Dynamic PWA Button: Changes text if already installed */}
                    <div 
                      onClick={triggerPwaInstall} 
                      className={`p-4 flex items-center justify-between cursor-pointer ${isAlreadyInstalled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}
                    >
                      <span className="flex items-center gap-2.5 font-black">
                        {isAlreadyInstalled ? "📲 STYLE ZONE - X App (Installed) ✓" : "📲 Install STYLE ZONE - X App on Phone"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isAlreadyInstalled ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-zinc-950'}`}>
                        {isAlreadyInstalled ? "Installed" : "Install"}
                      </span>
                    </div>

                    <div onClick={() => setIsNotifOpen(true)} className="p-4 flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-2.5">🔔 Notification Settings</span>
                      <span>›</span>
                    </div>
                    <div onClick={() => setShowSizeGuide(true)} className="p-4 flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-2.5">📏 Official Size Guide</span>
                      <span>›</span>
                    </div>
                    <div onClick={() => setShowSupportModal(true)} className="p-4 flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-2.5">🎧 Help Center & WhatsApp</span>
                      <span>›</span>
                    </div>
                  </div>

                  {/* Orders History */}
                  <div id="my-orders-scroll-target" className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">📦 MY WARDROBE ORDERS ({orders.length})</h4>
                    {orders.length === 0 ? (
                      <div className={`text-center py-8 border border-dashed rounded-3xl space-y-1 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                        <span className="text-2xl">🛍️</span>
                        <p className="text-xs text-zinc-400 font-bold">No orders placed yet.</p>
                      </div>
                    ) : (
                      orders.map(o => (
                        <div key={o.id} className={`p-4 border rounded-3xl space-y-2 text-xs font-bold shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`}>
                          <div className="flex justify-between items-center border-b pb-1 font-black">
                            <span>Ref: #{o.orderIdRef || o.id.slice(0,6)}</span>
                            <span className="bg-zinc-800 text-amber-400 px-2 py-0.5 rounded text-[10px]">{o.status}</span>
                          </div>
                          {o.items?.map((it, idx) => (
                            <p key={idx} className="text-zinc-400">• {it.name} [{it.size}, {it.color}] x{it.qty}</p>
                          ))}
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-black">Total: ₹{o.totalAmount}</span>
                            <div className="flex gap-2">
                              {o.status.includes("Confirmed") && (
                                <button onClick={() => handleCancelOrder(o)} className="text-rose-500 underline text-[10px]">Cancel & Restore</button>
                              )}
                              {o.status.includes("Delivered") && (
                                <button onClick={() => handleReturnOrder(o)} className="text-blue-400 underline text-[10px]">7-Day Return</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {user ? (
                    <button onClick={handleLogout} className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase mt-4 active:scale-95">Logout Account</button>
                  ) : (
                    <button onClick={handleGoogleLogin} className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase mt-4 active:scale-95">Sign in with Google</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* FILTER DRAWER */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-full max-w-xs h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-black uppercase">Filter & Sort</h3>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1 rounded-lg bg-zinc-800 text-white text-xs">✕</button>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black block mb-1">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-zinc-800 text-white font-bold">
                  <option value="recommended">Featured / Recommended</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="discount">Biggest Discount %</option>
                  <option value="newest">New Arrivals</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black block mb-1">Price Range</label>
                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-zinc-800 text-white font-bold">
                  <option value="All">All Prices</option>
                  <option value="under500">Under ₹500</option>
                  <option value="500-1000">₹500 - ₹1000</option>
                  <option value="1000-2000">₹1000 - ₹2000</option>
                  <option value="above2000">Above ₹2000</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black block mb-1">Size</label>
                <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-zinc-800 text-white font-bold">
                  <option value="All">All Sizes</option>
                  {APPAREL_SIZES_ADULT.concat(KIDS_CLOTHING_SIZES, FOOTWEAR_SIZES_ADULT).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => setIsFilterDrawerOpen(false)} className="w-full py-3 bg-amber-500 text-zinc-950 font-black rounded-xl uppercase text-xs">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* FLIPKART DESIGNED PROFESSIONAL CART */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-full max-w-md h-full p-4 shadow-2xl overflow-y-auto flex flex-col justify-between ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider">Shopping Bag ({cart.length})</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg bg-zinc-800 text-white text-xs">✕</button>
              </div>

              {/* Delivery Address Pill */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Where should we deliver your order?</p>
                  <p className="font-black truncate max-w-[200px]">{custInfo.vill ? `${custInfo.vill}, ${custInfo.pin}` : "No address selected"}</p>
                </div>
                <button onClick={() => setIsAddressModalOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-black text-[10px]">
                  {custInfo.vill ? "Change" : "Add or select address"}
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-[35vh] overflow-y-auto no-scrollbar">
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
                            <span className="text-[10px] text-emerald-500 font-bold">{item.discount}% off</span>
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

              {/* Coupon Engine */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2 pt-1">
                <input 
                  placeholder="Coupon Code (STYLE100 / STYLE20)" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                  className={`flex-1 p-2 border rounded-xl text-xs font-black uppercase ${darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`}
                />
                <button type="submit" className="px-3.5 py-2 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black">Apply</button>
              </form>

              {/* Price Details Breakdown */}
              <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <h4 className="font-black uppercase tracking-wider text-[11px] border-b pb-1">Price Details</h4>
                <div className="flex justify-between text-zinc-400">
                  <span>Price ({cart.length} items)</span>
                  <span>₹{rawMRP}</span>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>Discounts</span>
                  <span>-₹{totalItemSavings}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{couponDeduction}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Charges</span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-black text-sm">
                  <span>Total Amount</span>
                  <span>₹{finalPayableTotal}</span>
                </div>
                {totalSavedEntireOrder > 0 && (
                  <p className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 p-2 rounded-xl text-center">
                    🎉 You'll Save ₹{totalSavedEntireOrder} on this order
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Checkout Actions */}
            <div className="pt-3 border-t space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-black">
                <button onClick={() => setPaymentType("UPI")} className={`py-2 rounded-xl border ${paymentType === "UPI" ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-white'}`}>Prepaid UPI</button>
                <button onClick={() => setPaymentType("COD")} className={`py-2 rounded-xl border ${paymentType === "COD" ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-white'}`}>Cash on Delivery</button>
              </div>
              <button 
                onClick={handleCheckoutInit}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95"
              >
                Proceed to Checkout (₹{finalPayableTotal}) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PRODUCT DETAILS MODAL (WITH INTERACTIVE SLIDER BUTTONS & TOUCH SWIPE) */}
      {selectedProduct && (
        <div className={`fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between animate-fadeIn ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
          <div className={`sticky top-0 backdrop-blur-md z-20 border-b px-4 py-3 flex items-center justify-between shadow-sm ${darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
            <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-zinc-800 text-white px-3 py-1.5 rounded-full">
              ← Close
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleWishlist(selectedProduct)} className="p-2 bg-zinc-800 text-white rounded-full text-sm">
                {wishlist.find(x => x.id === selectedProduct.id) ? "❤️" : "🤍"}
              </button>
              <button onClick={() => handleShareProduct(selectedProduct, 'copy')} className="p-2 bg-zinc-800 text-white rounded-full text-sm">
                🔗
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full p-4 space-y-6 pb-28">
            {/* Interactive Image Slider with Left/Right Arrows */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-stone-100/80 border flex items-center justify-center p-3">
              <img 
                src={(selectedProduct.images || [selectedProduct.img])[currentProductSlide]} 
                alt={selectedProduct.name} 
                className="w-full h-full object-contain transition-all duration-300" 
              />
              
              {/* Left Arrow Button */}
              {(selectedProduct.images || []).length > 1 && (
                <button 
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center font-black text-xl shadow-lg active:scale-90"
                >
                  ‹
                </button>
              )}

              {/* Right Arrow Button */}
              {(selectedProduct.images || []).length > 1 && (
                <button 
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center font-black text-xl shadow-lg active:scale-90"
                >
                  ›
                </button>
              )}

              {(selectedProduct.images || []).length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {currentProductSlide + 1} / {selectedProduct.images.length}
                </div>
              )}
            </div>

            {/* Thumbnails Row */}
            {(selectedProduct.images || []).length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {selectedProduct.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setCurrentProductSlide(idx)}
                    className={`w-16 h-20 rounded-xl overflow-hidden border-2 cursor-pointer bg-stone-100/70 p-1 flex items-center justify-center transition-all ${currentProductSlide === idx ? 'border-amber-500 scale-105 shadow-sm' : 'border-zinc-700 opacity-60'}`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{selectedProduct.brand || "STYLE ZONE - X"}</span>
              <h1 className="text-xl md:text-2xl font-black font-serif">{selectedProduct.name}</h1>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-2xl font-black">₹{getDiscountedPrice(selectedProduct.price, selectedProduct.discount)}</span>
                {selectedProduct.discount > 0 && (
                  <>
                    <span className="text-sm text-zinc-400 line-through font-bold">₹{selectedProduct.price}</span>
                    <span className="text-xs font-black text-rose-500">{selectedProduct.discount}% OFF</span>
                  </>
                )}
              </div>
            </div>

            {/* Size Selector */}
            {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider">SELECT SIZE</span>
                  <span onClick={() => setShowSizeGuide(true)} className="text-[10px] font-black uppercase text-amber-500 underline cursor-pointer">Size Guide 📏</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableSizes.map(sz => (
                    <button 
                      key={sz} 
                      onClick={() => setSelectedSizes({ ...selectedSizes, [selectedProduct.id]: sz })}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${selectedSizes[selectedProduct.id] === sz ? 'bg-amber-500 text-zinc-950 border-amber-500 scale-105 shadow-md' : 'bg-transparent text-zinc-300 border-zinc-700'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Palette Selector */}
            {selectedProduct.availableColors && selectedProduct.availableColors.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <span className="text-xs font-black uppercase tracking-wider">SELECT COLOR</span>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableColors.map(col => (
                    <button 
                      key={col} 
                      onClick={() => setSelectedColors({ ...selectedColors, [selectedProduct.id]: col })}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${selectedColors[selectedProduct.id] === col ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-transparent text-zinc-300 border-zinc-700'}`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <span className="text-xs font-black uppercase tracking-wider">🚚 Check Delivery Speed</span>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Enter 6-digit Pincode" 
                  value={pinCheckInput} 
                  onChange={(e) => handlePinCheck(e.target.value)} 
                  className={`flex-1 p-2.5 border rounded-xl text-xs font-bold ${darkMode ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                />
                <button onClick={() => handlePinCheck(pinCheckInput)} className="px-4 py-2.5 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black">Check</button>
              </div>
              {pinCheckMsg && <p className="text-[10px] font-black">{pinCheckMsg.text}</p>}
            </div>

            <div className="border-t pt-4 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider">FABRIC & CRAFT SPECIFICATIONS</span>
              <div className={`grid grid-cols-2 gap-2 text-xs p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div><span className="text-zinc-400">Fabric:</span> <b>{selectedProduct.fabric || "Cotton Knit"}</b></div>
                <div><span className="text-zinc-400">Fit:</span> <b>{selectedProduct.fit || "Relaxed Fit"}</b></div>
                <div><span className="text-zinc-400">Occasion:</span> <b>Casual / Streetwear</b></div>
                <div><span className="text-zinc-400">Policy:</span> <b>7 Days Exchange</b></div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed pt-2">{selectedProduct.specifications}</p>
            </div>

            {/* SIMILAR PRODUCTS SECTION */}
            {similarProducts.length > 0 && (
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    ✨ SIMILAR STYLES YOU MAY LIKE
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-bold">{similarProducts.length} recommendations</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {similarProducts.map(sp => (
                    <div 
                      key={sp.id} 
                      onClick={() => addToRecentlyViewed(sp)} 
                      className={`w-32 shrink-0 cursor-pointer text-center group p-2 rounded-2xl border transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                    >
                      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-stone-100/70 p-1 flex items-center justify-center mb-1.5">
                        <img src={sp.images?.[0] || sp.img} alt={sp.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="text-[10px] font-bold truncate">{sp.name}</p>
                      <p className="text-[11px] font-black text-amber-500">₹{getDiscountedPrice(sp.price, sp.discount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Reviews Stream */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider">REVIEWS ({productReviews.length})</span>
                <span className="text-xs font-black text-amber-500">⭐ 4.8 / 5.0</span>
              </div>

              <form onSubmit={handleSubmitReview} className={`p-3 rounded-2xl border space-y-2 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Leave Rating:</span>
                  <select 
                    value={reviewRating} 
                    onChange={(e) => setReviewRating(e.target.value)}
                    className="p-1 border rounded bg-zinc-800 text-white text-xs font-black"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </select>
                </div>
                <textarea 
                  placeholder="Share feedback on fabric, fitting, or stitch quality..." 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl text-xs ${darkMode ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                  rows="2"
                />
                <button type="submit" className="w-full py-2 bg-amber-500 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  Submit Review
                </button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {productReviews.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 font-bold text-center py-2">No reviews yet for this design.</p>
                ) : (
                  productReviews.map(rev => (
                    <div key={rev.id} className={`p-2.5 border rounded-xl space-y-1 text-xs ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-black">
                          {rev.userName} 
                          {rev.isVerifiedBuyer && <span className="ml-1 text-emerald-500 text-[10px] font-bold">✓ Verified Buyer</span>}
                        </span>
                        <span className="text-[10px] text-amber-500">{"★".repeat(rev.rating)}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px]">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={`fixed bottom-0 inset-x-0 border-t p-3.5 z-50 flex gap-3 max-w-2xl mx-auto shadow-2xl ${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
            <button 
              onClick={() => addToCart(selectedProduct, productPageQty)}
              className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider active:scale-95"
            >
              Add to Bag
            </button>
            <button 
              onClick={() => {
                addToCart(selectedProduct, productPageQty);
                setSelectedProduct(null);
                setIsCartOpen(true);
              }}
              className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-xl active:scale-95"
            >
              Buy Now →
            </button>
          </div>
        </div>
      )}

      {/* ADMIN EDIT PRODUCT MODAL (WITH FLASH DEAL TOGGLE & FULL CONTROL) */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 max-w-lg w-full space-y-4 text-xs font-bold border shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black uppercase text-sm">Edit Product SKU: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 bg-zinc-800 text-white rounded">✕</button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="grid gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Item Name</label>
                <input name="editName" defaultValue={editingProduct.name} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold" required />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Brand</label>
                  <input name="editBrand" defaultValue={editingProduct.brand || "STYLE ZONE - X"} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Department</label>
                  <select name="editCategory" defaultValue={editingProduct.category} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-black">
                    {FASHION_DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Sub Category</label>
                <input name="editSubCategory" defaultValue={editingProduct.subCategory || "General"} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Price (₹)</label>
                  <input name="editPrice" type="number" defaultValue={editingProduct.price} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold" required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Discount %</label>
                  <input name="editDiscount" type="number" defaultValue={editingProduct.discount || 0} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Stock Count</label>
                  <input name="editStock" type="number" defaultValue={editingProduct.stock} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Fabric</label>
                  <select name="editFabric" defaultValue={editingProduct.fabric || FABRIC_OPTIONS[0]} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold">
                    {FABRIC_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Fit</label>
                  <select name="editFit" defaultValue={editingProduct.fit || FIT_OPTIONS[0]} className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-bold">
                    {FIT_OPTIONS.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                  <input type="checkbox" name="editIsFlash" defaultChecked={editingProduct.isFlashDeal || false} className="w-4 h-4 accent-amber-500" />
                  <span className="font-black text-amber-400 text-xs">⚡ Feature this item in Today's Flash Drop</span>
                </label>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Specifications</label>
                <textarea name="editSpecs" defaultValue={editingProduct.specifications || ""} rows="3" className="w-full border p-2.5 rounded-xl bg-white text-zinc-900 font-medium" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-zinc-950 rounded-xl font-black uppercase">Save Changes</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-3 bg-zinc-800 text-white rounded-xl font-black uppercase">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MY PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className={`rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold border shadow-2xl ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider">👤 My Profile Details</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1 bg-zinc-800 text-white rounded-lg">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">Full Name</label>
                <input 
                  value={custInfo.name} 
                  onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} 
                  placeholder="e.g. Sekh Younus"
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">Nick Name</label>
                <input 
                  value={custInfo.nickName} 
                  onChange={(e) => setCustInfo({...custInfo, nickName: e.target.value})} 
                  placeholder="e.g. Younus"
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">Gender</label>
                <select 
                  value={custInfo.gender} 
                  onChange={(e) => setCustInfo({...custInfo, gender: e.target.value})}
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">Mobile Number</label>
                <input 
                  type="tel"
                  value={custInfo.phone} 
                  onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})} 
                  placeholder="10-digit phone"
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={saveProfileData} 
                className="w-full py-3 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 shadow"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className={`rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold border shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider">📍 Saved Delivery Address</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="p-1 bg-zinc-800 text-white rounded-lg">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">House No / Road / Street</label>
                <input 
                  value={custInfo.road} 
                  onChange={(e) => setCustInfo({...custInfo, road: e.target.value})} 
                  placeholder="e.g. Main Market Road, Near Post Office"
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">Landmark</label>
                <input 
                  value={custInfo.landmark} 
                  onChange={(e) => setCustInfo({...custInfo, landmark: e.target.value})} 
                  placeholder="e.g. Water Tank / School"
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">Village / Area / Town *</label>
                <input 
                  value={custInfo.vill} 
                  onChange={(e) => setCustInfo({...custInfo, vill: e.target.value})} 
                  placeholder="e.g. Papuri / Nanoor"
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-black">City *</label>
                  <input 
                    value={custInfo.city} 
                    onChange={(e) => setCustInfo({...custInfo, city: e.target.value})} 
                    placeholder="Bolpur"
                    className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-black">District (Dist) *</label>
                  <input 
                    value={custInfo.dist} 
                    onChange={(e) => setCustInfo({...custInfo, dist: e.target.value})} 
                    placeholder="Birbhum"
                    className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-black">Pincode (PIN) *</label>
                <input 
                  type="number"
                  value={custInfo.pin} 
                  onChange={(e) => setCustInfo({...custInfo, pin: e.target.value})} 
                  placeholder="e.g. 731204"
                  className="w-full p-2.5 bg-zinc-800 border-zinc-700 border rounded-xl mt-1 font-bold text-white" 
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={saveAddressData} 
                className="w-full py-3 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 shadow"
              >
                Save Delivery Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-MINUTE CUSTOMER PAYMENT VERIFICATION MODAL */}
      {activePaymentOrder && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-white shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-2xl mx-auto animate-pulse">
              ⏳
            </div>
            
            <h3 className="text-lg font-black font-serif">Verifying Your Payment</h3>
            <p className="text-xs text-zinc-400 font-bold leading-relaxed">
              We have opened your UPI app. Please complete payment of <b>₹{activePaymentOrder.totalAmount}</b>.
            </p>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl font-mono text-xl font-black text-amber-500 tracking-wider">
              {formatTimer(verificationCountdown)}
            </div>

            <p className="text-[11px] text-zinc-500 font-semibold">
              Admin is actively monitoring incoming UPI transfer. Your screen will auto-refresh as soon as it is confirmed.
            </p>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <a 
                href={getUPIIntentLink()} 
                target="_blank" 
                rel="noreferrer" 
                className="block py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow"
              >
                Re-open UPI App (GPay/PhonePe)
              </a>
              <button 
                onClick={() => {
                  if (window.confirm("Close verification window? You can view order status under Account tab.")) {
                    setActivePaymentOrder(null);
                  }
                }}
                className="text-xs text-zinc-400 font-bold underline"
              >
                Close & Check in Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {showInvoice && completedOrderReceipt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs font-bold text-white">
            <div className="text-center border-b border-zinc-800 pb-2">
              <h3 className="font-serif font-black text-lg">{BRAND_NAME}</h3>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{BRAND_TAGLINE}</p>
            </div>
            <p className="text-emerald-400 font-black text-center text-sm">🎉 Order Confirmed & Ready For Dispatch!</p>
            <div className="p-3 bg-zinc-950 rounded-xl space-y-1 border border-zinc-800">
              <p>Order Ref: #{completedOrderReceipt.orderIdRef}</p>
              <p>Total Paid: ₹{completedOrderReceipt.totalAmount}</p>
              <p>Mode: {completedOrderReceipt.paymentMode}</p>
            </div>
            <button onClick={sendWhatsAppNotification} className="w-full py-3 bg-amber-500 text-zinc-950 rounded-xl font-black uppercase">
              Send Invoice to WhatsApp 💬
            </button>
          </div>
        </div>
      )}

      {/* FLOATING SUPPORT BUTTON */}
      <div className="fixed bottom-20 right-4 z-40">
        <button 
          onClick={() => setShowSupportModal(true)} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-2xl flex items-center gap-1.5 font-black text-xs uppercase active:scale-95"
          title="Direct Concierge"
        >
          <span>💬</span>
          <span className="hidden md:inline">Support</span>
        </button>
      </div>

      {/* SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black uppercase">Customer Care & Support 🎧</h3>
              <button onClick={() => setShowSupportModal(false)}>✕</button>
            </div>
            <p className="text-zinc-400">Need help with sizing, delivery tracking, or exchanges?</p>
            <div className="space-y-2">
              <a href="https://wa.me/918637589429?text=Hi%20Style%20Zone%20X%20Support" target="_blank" rel="noreferrer" className="block p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-center font-black">
                Chat on WhatsApp (+91 8637589429)
              </a>
              <a href="mailto:stylezone.x0@gmail.com" className="block p-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-center font-black">
                Email: stylezone.x0@gmail.com
              </a>
              <a href="tel:+918637589429" className="block p-3 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl text-center font-black">
                Call Direct Concierge
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black uppercase">Official Size Guide 📏</h3>
              <button onClick={() => setShowSizeGuide(false)}>✕</button>
            </div>
            <table className="w-full text-center border border-zinc-700">
              <thead><tr className={darkMode ? 'bg-zinc-800' : 'bg-zinc-100'}><th className="p-1 border border-zinc-700">Size</th><th className="p-1 border border-zinc-700">Chest</th><th className="p-1 border border-zinc-700">Length</th></tr></thead>
              <tbody>
                <tr><td className="p-1 border border-zinc-700">S</td><td className="p-1 border border-zinc-700">38"</td><td className="p-1 border border-zinc-700">27"</td></tr>
                <tr><td className="p-1 border border-zinc-700">M</td><td className="p-1 border border-zinc-700">40"</td><td className="p-1 border border-zinc-700">28"</td></tr>
                <tr><td className="p-1 border border-zinc-700">L</td><td className="p-1 border border-zinc-700">42"</td><td className="p-1 border border-zinc-700">29"</td></tr>
                <tr><td className="p-1 border border-zinc-700">XL</td><td className="p-1 border border-zinc-700">44"</td><td className="p-1 border border-zinc-700">30"</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      {!isAdminUrl && (
        <nav className={`fixed bottom-0 inset-x-0 border-t p-2 z-40 flex justify-around items-center max-w-md md:max-w-xl mx-auto rounded-t-3xl shadow-2xl ${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
          <button 
            onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); setActiveCollection("All"); }} 
            className={`flex flex-col items-center transition-colors ${activeTab === 'shop' && activeDepartment === 'All' ? 'text-amber-500 font-black' : 'text-zinc-400'}`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Home</span>
          </button>
          
          <button 
            onClick={() => { setActiveDepartment("Men"); setActiveCollection("All"); setActiveTab("shop"); }} 
            className={`flex flex-col items-center transition-colors ${activeTab === 'shop' && activeDepartment === 'Men' ? 'text-amber-500 font-black' : 'text-zinc-400'}`}
          >
            <span className="text-lg">👕</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Men</span>
          </button>

          <button 
            onClick={() => { setActiveDepartment("Women"); setActiveCollection("All"); setActiveTab("shop"); }} 
            className={`flex flex-col items-center transition-colors ${activeTab === 'shop' && activeDepartment === 'Women' ? 'text-amber-500 font-black' : 'text-zinc-400'}`}
          >
            <span className="text-lg">👗</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Women</span>
          </button>

          <button 
            onClick={() => setIsCartOpen(true)} 
            className="flex flex-col items-center relative text-zinc-300"
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
