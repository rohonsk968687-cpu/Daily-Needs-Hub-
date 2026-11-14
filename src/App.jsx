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

// Ultra-Premium 3D SVG Icon Set
const Icon3D = ({ name, className = "w-5 h-5" }) => {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="h3dP" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <path d="M16 4L4 14H8V27H14V20H18V27H24V14H28L16 4Z" fill="url(#h3dP)" />
          <path d="M16 4L28 14H24L16 7.3L8 14H4L16 4Z" fill="#FAE8FF" opacity="0.85" />
        </svg>
      );
    case "category":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="c3dP" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="10" height="10" rx="3" fill="url(#c3dP)" />
          <rect x="18" y="4" width="10" height="10" rx="5" fill="#C4B5FD" />
          <rect x="4" y="18" width="10" height="10" rx="5" fill="#818CF8" />
          <rect x="18" y="18" width="10" height="10" rx="3" fill="url(#c3dP)" />
        </svg>
      );
    case "saved":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="s3dP" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
          </defs>
          <path d="M7 5C7 3.89543 7.89543 3 9 3H23C24.1046 3 25 3.89543 25 5V28L16 22.5L7 28V5Z" fill="url(#s3dP)" />
          <path d="M9 3H23C24.1 3 25 3.9 25 5V8H7V5C7 3.9 7.9 3 9 3Z" fill="#FBCFE8" opacity="0.7" />
        </svg>
      );
    case "account":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="u3dP" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="11" r="6" fill="url(#u3dP)" />
          <path d="M6 27C6 22.0294 10.4772 18 16 18C21.5228 18 26 22.0294 26 27H6Z" fill="url(#u3dP)" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="hrt3dP" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#C026D3" />
            </linearGradient>
          </defs>
          <path d="M16 28C16 28 4 20.4 4 11.5C4 7.9 6.9 5 10.5 5C12.8 5 14.8 6.2 16 8C17.2 6.2 19.2 5 21.5 5C25.1 5 28 7.9 28 11.5C28 20.4 16 28 16 28Z" fill="url(#hrt3dP)" />
        </svg>
      );
    case "mic3d":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="micG" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <rect x="11" y="3" width="10" height="16" rx="5" fill="url(#micG)" />
          <path d="M7 14C7 18.9706 11.0294 23 16 23C20.9706 23 25 18.9706 25 14" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 23V28M11 28H21" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none">
          <defs>
            <radialGradient id="aiOrbP" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#F0ABFC" />
              <stop offset="50%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#312E81" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="16" fill="url(#aiOrbP)" />
          <path d="M18 8L20.5 15.5L28 18L20.5 20.5L18 28L15.5 20.5L8 18L15.5 15.5L18 8Z" fill="#FFFFFF" />
          <circle cx="25" cy="11" r="2" fill="#E9D5FF" />
        </svg>
      );
    default:
      return null;
  }
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [wishlist, setWishlist] = useState([]);
  const [saveForLater, setSaveForLater] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  const [dynamicCoupons, setDynamicCoupons] = useState([
    { code: "STYLE100", discountType: "fixed", discountValue: 100, minOrder: 999 },
    { code: "STYLE20", discountType: "percentage", discountValue: 20, minOrder: 1499 }
  ]);
  const [user, setUser] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminUrl, setIsAdminUrl] = useState(false);
  const [activeTab, setActiveTab] = useState("shop"); 

  // Modals & Drawers
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Direct Single-Item 2-Step Express Checkout Modal State (No Bag)
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Address Selection/Form, 2 = Payment & Confirm
  const [addressMode, setAddressMode] = useState("saved"); // "saved" or "new"
  const [newOrderAddress, setNewOrderAddress] = useState({
    name: "", phone: "", vill: "", landmark: "", city: "Bolpur", pin: ""
  });

  // Playful Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginNameInput, setLoginNameInput] = useState("");
  const [loginPhoneInput, setLoginPhoneInput] = useState("");
  const [dodgeOffset, setDodgeOffset] = useState({ x: 0, y: 0 });

  // Draggable Bottom-Right English AI Stylist State
  const [aiPos, setAiPos] = useState({ x: 0, y: 0 });
  const [isDraggingAi, setIsDraggingAi] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { 
      sender: "ai", 
      text: "Hello! I am the STYLE ZONE - X Personal AI Stylist. Ask me to find oversized streetwear, check express delivery for your PIN code, or recommend outfits under your budget!" 
    }
  ]);

  // Payment, 2-Min Verification & Invoice States
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [verificationCountdown, setVerificationCountdown] = useState(120);
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedOrderReceipt, setCompletedOrderReceipt] = useState(null);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [activeCollection, setActiveCollection] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  // Midnight-Purple Dark Default (with toggle)
  const [darkMode, setDarkMode] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

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

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [pinCheckInput, setPinCheckInput] = useState("");
  const [pinCheckMsg, setPinCheckMsg] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [custInfo, setCustInfo] = useState({ 
    name: '', nickName: '', gender: 'Male', phone: '', email: '', 
    road: '', landmark: '', vill: '', city: 'Bolpur', dist: 'Birbhum', pin: '' 
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

  // Draggable Floating AI Button Handlers
  const handleAiPointerDown = (e) => {
    setIsDraggingAi(true);
    hasDraggedRef.current = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX - aiPos.x, y: clientY - aiPos.y };
  };

  useEffect(() => {
    const handleAiPointerMove = (e) => {
      if (!isDraggingAi) return;
      hasDraggedRef.current = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const newX = Math.min(20, Math.max(-window.innerWidth + 90, clientX - dragStartRef.current.x));
      const newY = Math.min(20, Math.max(-window.innerHeight + 140, clientY - dragStartRef.current.y));
      setAiPos({ x: newX, y: newY });
    };

    const handleAiPointerUp = () => setIsDraggingAi(false);

    if (isDraggingAi) {
      window.addEventListener("mousemove", handleAiPointerMove);
      window.addEventListener("mouseup", handleAiPointerUp);
      window.addEventListener("touchmove", handleAiPointerMove, { passive: false });
      window.addEventListener("touchend", handleAiPointerUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleAiPointerMove);
      window.removeEventListener("mouseup", handleAiPointerUp);
      window.removeEventListener("touchmove", handleAiPointerMove);
      window.removeEventListener("touchend", handleAiPointerUp);
    };
  }, [isDraggingAi]);

  // Hardware Back Button Shield
  useEffect(() => {
    const handlePopState = () => {
      if (checkoutItem) return setCheckoutItem(null);
      if (selectedProduct) return setSelectedProduct(null);
      if (isWishlistOpen) return setIsWishlistOpen(false);
      if (isFilterDrawerOpen) return setIsFilterDrawerOpen(false);
      if (isCategoryModalOpen) return setIsCategoryModalOpen(false);
      if (isAiAssistantOpen) return setIsAiAssistantOpen(false);
      if (isLoginModalOpen) return setIsLoginModalOpen(false);
      if (isAddressModalOpen) return setIsAddressModalOpen(false);
      if (isProfileModalOpen) return setIsProfileModalOpen(false);
      if (showSizeGuide || showSupportModal) {
        setShowSizeGuide(false);
        setShowSupportModal(false);
        return;
      }
      if (activeTab !== "shop") return setActiveTab("shop");
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [checkoutItem, selectedProduct, isWishlistOpen, isFilterDrawerOpen, isCategoryModalOpen, isAiAssistantOpen, isLoginModalOpen, isAddressModalOpen, isProfileModalOpen, showSizeGuide, showSupportModal, activeTab]);

  const openModalWithHistory = (type, val = true) => {
    window.history.pushState({ modal: type }, "");
    if (type === 'product') setSelectedProduct(val);
    if (type === 'wishlist') setIsWishlistOpen(true);
    if (type === 'filter') setIsFilterDrawerOpen(true);
    if (type === 'category') setIsCategoryModalOpen(true);
    if (type === 'ai') setIsAiAssistantOpen(true);
    if (type === 'login') setIsLoginModalOpen(true);
    if (type === 'address') setIsAddressModalOpen(true);
    if (type === 'profile') setIsProfileModalOpen(true);
  };

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) setIsAlreadyInstalled(true);
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsAlreadyInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerPwaInstall = async () => {
    if (isAlreadyInstalled) return showToastMessage("App is already installed on your device! 📲", "info");
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsAlreadyInstalled(true);
      setDeferredPrompt(null);
    } else {
      showToastMessage("Open Chrome menu (⋮) and tap 'Install App'!", "info");
    }
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
    if (user && !user.isAnonymous) {
      const loadData = async () => {
        try {
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
      const localWish = localStorage.getItem("szx_guest_wishlist");
      if (localWish) try { setWishlist(JSON.parse(localWish)); } catch {}
      const localSfl = localStorage.getItem("szx_guest_sfl");
      if (localSfl) try { setSaveForLater(JSON.parse(localSfl)); } catch {}
      const localProfile = localStorage.getItem("szx_saved_address");
      if (localProfile) try { setCustInfo(prev => ({ ...prev, ...JSON.parse(localProfile) })); } catch {}
    }
  }, [user]);

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

    const unsubRev = onSnapshot(collection(db, "reviews"), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubCoup = onSnapshot(collection(db, "coupons"), (snapshot) => {
      if (!snapshot.empty) setDynamicCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      unsubCoup();
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

  useEffect(() => {
    let timer = null;
    if (activePaymentOrder && verificationCountdown > 0) {
      timer = setInterval(() => setVerificationCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activePaymentOrder, verificationCountdown]);

  useEffect(() => {
    if (!activePaymentOrder) return;
    const unsub = onSnapshot(doc(db, "orders", activePaymentOrder.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.paymentStatus === "Paid & Verified ✅" || data.status === "Confirmed 📦") {
          setCompletedOrderReceipt({ id: docSnap.id, ...data });
          setActivePaymentOrder(null);
          setShowInvoice(true);
          showToastMessage("🎉 Payment Verified! Order Confirmed.");
        }
      }
    });
    return () => unsub();
  }, [activePaymentOrder]);

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

  const saveProfileData = async () => {
    if (!custInfo.name || !custInfo.phone) return showToastMessage("Name & mobile number required!", "error");
    if (user && !user.isAnonymous) await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true }).catch(() => {});
    localStorage.setItem("szx_saved_address", JSON.stringify(custInfo));
    setIsProfileModalOpen(false);
    showToastMessage("Profile updated! 👤");
  };

  const saveAddressData = async () => {
    if (!custInfo.vill || !custInfo.pin || !custInfo.city || !custInfo.phone) {
      return showToastMessage("Fill Village, City, PIN and Phone!", "error");
    }
    if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Delivery unavailable for PIN: ${custInfo.pin}`, "error");
    }
    if (user && !user.isAnonymous) await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true }).catch(() => {});
    localStorage.setItem("szx_saved_address", JSON.stringify(custInfo));
    setIsAddressModalOpen(false);
    showToastMessage("Delivery Address saved! 📍");
  };

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

  const handleAiPrompt = (promptText) => {
    const clean = promptText.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    const newMsgs = [...aiMessages, { sender: "user", text: clean }];
    let reply = "Explore our Men, Women, Kids, and Footwear drops! Ask me for oversized tees, sneakers under ₹1000, or check delivery for your PIN code.";

    if (lower.includes("oversized") || lower.includes("t-shirt") || lower.includes("tee")) {
      setActiveDepartment("Men");
      setActiveCollection("Oversized T-Shirts");
      setActiveTab("shop");
      reply = "Curated Men's Oversized T-Shirts for you! Heavyweight 240+ GSM cotton pieces are now on your screen.";
    } else if (lower.includes("sneaker") || lower.includes("kick") || lower.includes("shoe") || lower.includes("footwear")) {
      setActiveDepartment("Footwear");
      setActiveCollection("All");
      setActiveTab("shop");
      reply = "Opened Footwear Lounge! Check out our chunky sneakers and daily kicks.";
    } else if (lower.includes("women") || lower.includes("dress") || lower.includes("kurti")) {
      setActiveDepartment("Women");
      setActiveCollection("All");
      setActiveTab("shop");
      reply = "Displaying Women's Couture—designer kurtis, dresses, and festive wear.";
    } else if (lower.includes("under 999") || lower.includes("under 1000") || lower.includes("budget")) {
      setPriceFilter("500-1000");
      setActiveTab("shop");
      reply = "Smart budget filter applied: showing fashion pieces between ₹500 and ₹1,000!";
    } else if (lower.match(/\b\d{6}\b/)) {
      const pin = lower.match(/\b\d{6}\b/)[0];
      if (ALLOWED_PINS.includes(pin)) {
        reply = `✅ Express Delivery Confirmed! PIN ${pin} is eligible for 2–3 day doorstep delivery.`;
      } else {
        reply = `⚠️ PIN ${pin} is outside our current express zone (${ALLOWED_PINS.slice(0, 4).join(", ")}).`;
      }
    } else if (lower.includes("coupon") || lower.includes("discount") || lower.includes("offer")) {
      reply = "🎟️ Active Promo Codes: Use 'STYLE100' for ₹100 OFF on orders ₹999+, or 'STYLE20' for 20% OFF on orders ₹1,499+!";
    }

    setAiMessages([...newMsgs, { sender: "ai", text: reply }]);
    setAiInputText("");
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  // POINT 5: SINGLE-ITEM DIRECT BUY NOW TRIGGER (NO BAG SYSTEM)
  const triggerDirectBuyNow = (p) => {
    if (p.stock <= 0) return showToastMessage("Out of stock!", "error");
    if (p.availableSizes && p.availableSizes.length > 0 && !selectedSizes[p.id]) {
      openProductDetail(p);
      return showToastMessage("Please select your Size first!", "error");
    }
    const chosenSize = selectedSizes[p.id] || (p.availableSizes?.[0]) || "Standard";
    const chosenColor = selectedColors[p.id] || (p.availableColors?.[0]) || "Default";
    
    setSelectedProduct(null);
    setCheckoutItem({ ...p, selectedSize: chosenSize, selectedColor: chosenColor });
    setCheckoutQty(1);
    setCheckoutStep(1);
    setAppliedCoupon(null);
    setAddressMode(custInfo.vill && custInfo.pin ? "saved" : "new");
    window.history.pushState({ modal: "expressCheckout" }, "");
  };

  // Single-Item Checkout Totals
  const itemUnitMRP = checkoutItem ? Number(checkoutItem.price) || 0 : 0;
  const itemUnitSalePrice = checkoutItem ? getDiscountedPrice(checkoutItem.price, checkoutItem.discount) : 0;
  const singleRawTotal = itemUnitSalePrice * checkoutQty;
  const singleCouponDeduction = appliedCoupon ? appliedCoupon.discount : 0;
  const singleDeliveryFee = (singleRawTotal - singleCouponDeduction) >= 999 || singleRawTotal === 0 ? 0 : 40;
  const singleFinalPayable = Math.max(0, singleRawTotal - singleCouponDeduction + singleDeliveryFee);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    const targetCoup = dynamicCoupons.find(c => c.code === cleanCode);
    if (targetCoup) {
      if (singleRawTotal < (targetCoup.minOrder || 0)) {
        return showToastMessage(`Min order ₹${targetCoup.minOrder} required!`, "error");
      }
      const disc = targetCoup.discountType === "fixed"
        ? targetCoup.discountValue
        : Math.round((singleRawTotal * targetCoup.discountValue) / 100);
      setAppliedCoupon({ code: cleanCode, discount: disc });
      showToastMessage(`Coupon Applied! ₹${disc} OFF`);
    } else {
      showToastMessage("Invalid coupon code!", "error");
    }
  };

  const handleProceedToPaymentStep = () => {
    if (addressMode === "saved") {
      if (!custInfo.vill || !custInfo.pin || !custInfo.phone) {
        return showToastMessage("Saved address incomplete! Switch to 'New Address' or fill details.", "error");
      }
      if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
        return showToastMessage(`Delivery unavailable for PIN: ${custInfo.pin}`, "error");
      }
    } else {
      if (!newOrderAddress.name || !newOrderAddress.phone || !newOrderAddress.vill || !newOrderAddress.pin) {
        return showToastMessage("Please enter Receiver Name, Mobile, Village & PIN!", "error");
      }
      if (!ALLOWED_PINS.includes(newOrderAddress.pin.trim())) {
        return showToastMessage(`Delivery unavailable for PIN: ${newOrderAddress.pin}`, "error");
      }
    }
    setCheckoutStep(2);
  };

  const handleConfirmSingleItemOrder = async () => {
    if (!user || user.isAnonymous) {
      setCheckoutItem(null);
      return openModalWithHistory('login');
    }
    if (!checkoutItem) return;

    const activeAddr = addressMode === "saved" ? custInfo : newOrderAddress;
    const fullAddressString = `${activeAddr.vill}${activeAddr.landmark ? ', Landmark: ' + activeAddr.landmark : ''}, ${activeAddr.city || 'Bolpur'}, PIN: ${activeAddr.pin}`;

    try {
      let createdOrder = null;
      await runTransaction(db, async (transaction) => {
        const prodRef = doc(db, "products", checkoutItem.id);
        const prodDoc = await transaction.get(prodRef);
        if (!prodDoc.exists()) throw new Error("Product not found!");
        const currentStock = prodDoc.data().stock || 0;
        if (currentStock < checkoutQty) throw new Error(`Only ${currentStock} left in stock!`);
        
        transaction.update(prodRef, { stock: currentStock - checkoutQty });

        const newOrderRef = doc(collection(db, "orders"));
        const orderPayload = {
          orderIdRef: `SZ-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: user.uid,
          customerName: activeAddr.name || custInfo.name || "Customer",
          phone: activeAddr.phone,
          address: fullAddressString,
          userEmail: user.email || "N/A",
          items: [{
            id: checkoutItem.id,
            name: checkoutItem.name,
            qty: checkoutQty,
            total: singleRawTotal,
            size: checkoutItem.selectedSize,
            color: checkoutItem.selectedColor
          }],
          rawTotal: singleRawTotal,
          couponDiscount: singleCouponDeduction,
          deliveryFee: singleDeliveryFee,
          totalAmount: singleFinalPayable,
          paymentMode: paymentType === "COD" ? "Cash on Delivery" : "Prepaid UPI",
          paymentStatus: paymentType === "UPI" ? "Verifying (2 Min Timer) ⏳" : "COD (Pay on Delivery)",
          status: paymentType === "COD" ? "Confirmed 📦" : "Awaiting Verification ⏳",
          createdAt: new Date().toLocaleString(),
          rawDate: new Date().toISOString()
        };
        transaction.set(newOrderRef, orderPayload);
        createdOrder = { id: newOrderRef.id, ...orderPayload };
      });

      setCheckoutItem(null);
      if (paymentType === "UPI") {
        window.open(`upi://pay?pa=${MY_UPI_ID}&pn=STYLE%20ZONE%20X&am=${singleFinalPayable}&cu=INR`, '_blank');
        setActivePaymentOrder(createdOrder);
        setVerificationCountdown(120);
      } else {
        setCompletedOrderReceipt(createdOrder);
        setShowInvoice(true);
        showToastMessage("Order Confirmed with Cash on Delivery! 🎉");
      }
    } catch (e) {
      showToastMessage(e.message || "Order failed", "error");
    }
  };

  const handleSaveForLater = (p) => {
    if (!saveForLater.find(x => x.id === p.id)) {
      const updated = [p, ...saveForLater];
      syncSaveForLater(updated);
      showToastMessage("Saved for later 📌");
    } else {
      showToastMessage("Already in Saved list", "info");
    }
  };

  const toggleWishlist = (p) => {
    const exist = wishlist.find(x => x.id === p.id);
    const updated = exist ? wishlist.filter(x => x.id !== p.id) : [...wishlist, p];
    syncWishlistCloud(updated);
    showToastMessage(exist ? "Removed from wishlist" : "Saved to Wishlist ❤️");
  };

  const openProductDetail = (p) => {
    setActiveImageIndex(0);
    setPinCheckMsg(null);
    openModalWithHistory('product', p);
    if (!recentlyViewed.find(x => x.id === p.id)) {
      setRecentlyViewed([p, ...recentlyViewed.slice(0, 7)]);
    }
  };

  const handleCancelOrder = async (order) => {
    if (window.confirm("Cancel this order? Stock will be restored automatically.")) {
      try {
        await runTransaction(db, async (transaction) => {
          for (let it of order.items) {
            const prodRef = doc(db, "products", it.id);
            const prodDoc = await transaction.get(prodRef);
            if (prodDoc.exists()) {
              transaction.update(prodRef, { stock: (prodDoc.data().stock || 0) + it.qty });
            }
          }
          transaction.update(doc(db, "orders", order.id), { status: "Cancelled ❌" });
        });
        showToastMessage("Order cancelled & stock restored! 🔄");
      } catch {
        showToastMessage("Cancellation failed", "error");
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim() || !selectedProduct) return;
    if (!user || user.isAnonymous) return openModalWithHistory('login');
    const isVerified = orders.some(o => o.userId === user.uid && o.status?.includes("Delivered") && o.items?.some(it => it.id === selectedProduct.id));
    try {
      await addDoc(collection(db, "reviews"), {
        productId: selectedProduct.id,
        userId: user.uid,
        userName: custInfo.name || user.displayName || "Verified Shopper",
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
        isVerifiedBuyer: isVerified,
        createdAt: new Date().toLocaleDateString()
      });
      setReviewComment("");
      showToastMessage("Review published! ⭐");
    } catch {
      showToastMessage("Review error", "error");
    }
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return showToastMessage("Voice search not supported", "error");
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => {
      setIsListening(true);
      showToastMessage("Listening for outfits or sneakers... 🎙️");
    };
    recognition.onresult = (e) => {
      setSearch(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
                          (p.subCategory && p.subCategory.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = activeDepartment === "All" || p.category === activeDepartment;
    const matchesCol = activeCollection === "All" || p.subCategory === activeCollection;
    const finalPrice = getDiscountedPrice(p.price, p.discount);
    let matchesPrice = true;
    if (priceFilter === "under500") matchesPrice = finalPrice < 500;
    else if (priceFilter === "500-1000") matchesPrice = finalPrice >= 500 && finalPrice <= 1000;
    else if (priceFilter === "1000-2000") matchesPrice = finalPrice >= 1000 && finalPrice <= 2000;
    else if (priceFilter === "above2000") matchesPrice = finalPrice > 2000;
    return matchesSearch && matchesDept && matchesCol && matchesPrice;
  }).sort((a, b) => {
    const pA = getDiscountedPrice(a.price, a.discount);
    const pB = getDiscountedPrice(b.price, b.discount);
    if (sortBy === "priceLow") return pA - pB;
    if (sortBy === "priceHigh") return pB - pA;
    if (sortBy === "discount") return (b.discount || 0) - (a.discount || 0);
    return 0;
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

  const productReviews = selectedProduct ? reviews.filter(r => r.productId === selectedProduct.id) : [];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[radial-gradient(ellipse_at_top,_#1E103C_0%,_#090514_55%,_#05030A_100%)] text-white' : 'bg-[#F5F3FF] text-zinc-900'} pb-28 transition-colors duration-300 font-sans relative overflow-x-hidden`}>
      
      {/* Floating Ambient 3D Glow Orbs */}
      {darkMode && (
        <>
          <div className="pointer-events-none fixed top-20 -left-20 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="pointer-events-none fixed bottom-24 -right-20 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse" />
        </>
      )}

      {toast && (
        <div className={`fixed top-12 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2.5 animate-bounce ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#190E36] text-white border border-purple-400/40'}`}>
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
          dynamicCoupons={dynamicCoupons}
          flashConfig={flashConfig}
          setFlashConfig={setFlashConfig}
          setFlashTime={setFlashTime}
          showToastMessage={showToastMessage}
          handleGoogleLogin={handleGoogleLogin}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto relative z-10">
          
          {/* POINT 2: TOP ANNOUNCEMENT BAR + MINIMAL 3D HEADER (ONLY WISHLIST & DARK MODE) */}
          <div className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-700 text-white text-[10px] md:text-xs font-black tracking-wider uppercase py-1.5 px-4 text-center shadow-md">
            ✨ {flashConfig.title} • {flashConfig.subtitle} ⚡
          </div>

          <header className={`${darkMode ? 'bg-[#0D071E]/90 border-purple-500/20' : 'bg-white/90 border-purple-200'} backdrop-blur-xl sticky top-0 z-40 border-b w-full shadow-lg`}>
            <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); setActiveCollection("All"); }}
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl border border-purple-300/40 shadow-lg shadow-purple-600/30 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  X
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-black tracking-widest uppercase leading-none font-serif bg-gradient-to-r from-white via-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
                    {darkMode ? BRAND_NAME : <span className="text-zinc-950">{BRAND_NAME}</span>}
                  </h1>
                  <p className="text-[8px] uppercase tracking-[0.25em] text-purple-400 font-black mt-1">{BRAND_TAGLINE}</p>
                </div>
              </div>

              {/* ONLY 2 BUTTONS IN HEADER: 3D WISHLIST & 3D THEME TOGGLE */}
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => openModalWithHistory('wishlist')} 
                  className={`p-2.5 rounded-2xl relative transition-all duration-300 hover:scale-110 hover:-rotate-6 active:scale-90 shadow-md ${darkMode ? 'bg-[#190E36] border border-purple-500/30' : 'bg-purple-100'}`}
                  title="Wishlist"
                >
                  <Icon3D name="heart" className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-fuchsia-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setDarkMode(!darkMode)} 
                  className={`p-2.5 rounded-2xl text-sm transition-all duration-300 hover:scale-110 hover:rotate-12 active:scale-90 shadow-md ${darkMode ? 'bg-[#190E36] border border-purple-500/30 text-amber-300' : 'bg-purple-100 text-purple-900'}`}
                  title="Toggle Theme"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>

            {/* POINT 3: STICKY LIVE SEARCH BAR + 3D VOICE MIC */}
            <div className={`px-4 py-2.5 border-t ${darkMode ? 'bg-[#0B0619]/95 border-purple-500/15' : 'bg-purple-50/90 border-purple-200'}`}>
              <div className="max-w-7xl mx-auto flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 text-sm">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search oversized tees, kurtis, sneakers..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-9 pr-8 py-2.5 rounded-2xl border text-xs md:text-sm font-bold focus:outline-none transition-all ${darkMode ? 'bg-[#170D33] border-purple-500/30 text-white placeholder-purple-300/40 focus:border-fuchsia-400' : 'bg-white border-purple-200 text-zinc-900'}`}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 font-black">✕</button>
                  )}
                </div>

                {/* 3D Professional Voice Search Mic Button */}
                <button 
                  onClick={startVoiceSearch} 
                  className={`p-2.5 px-3 rounded-2xl border transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg ${
                    isListening 
                      ? 'bg-rose-600 border-rose-400 animate-pulse shadow-rose-500/50' 
                      : (darkMode ? 'bg-[#170D33] border-purple-500/40 shadow-purple-600/20' : 'bg-white border-purple-200')
                  }`}
                  title="3D Voice Search"
                >
                  <Icon3D name="mic3d" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* STOREFRONT SHOP TAB */}
          {activeTab === "shop" && (
            <>
              {/* HERO POSTERS */}
              <div className="px-4 my-3">
                <div className="relative h-72 md:h-[420px] w-full rounded-3xl overflow-hidden shadow-2xl border border-purple-500/30">
                  {heroSlides.map((s, idx) => (
                    <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                      <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#090514]/95 via-[#130B29]/60 to-transparent p-6 md:p-10 flex flex-col justify-center text-white">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-black bg-purple-500/25 text-purple-200 border border-purple-400/40 px-3 py-1 rounded-full w-fit mb-2">
                          {s.badge}
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black uppercase font-serif max-w-sm">{s.title}</h2>
                        <p className="text-xs md:text-sm text-purple-100/80 font-medium mb-4 max-w-xs">{s.subtitle}</p>
                        <button 
                          onClick={() => { setActiveDepartment(s.dept); setActiveCollection("All"); }}
                          className="w-fit bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-6 py-2.5 rounded-full font-black text-xs uppercase hover:scale-105 transition-transform shadow-lg shadow-purple-600/40"
                        >
                          {s.btnText} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FLASH SALE COUNTDOWN BAR */}
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-[#180D36] via-[#24124D] to-[#180D36] text-white p-4 rounded-3xl flex items-center justify-between border border-purple-500/30 shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-bounce">⚡</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-fuchsia-300">{flashConfig.title}</h4>
                      <p className="text-[10px] text-purple-200/80 font-medium">{flashConfig.subtitle}</p>
                    </div>
                  </div>
                  <div className="bg-purple-950/80 px-3 py-2 rounded-2xl border border-purple-400/30 font-mono font-black text-xs text-purple-200">
                    {formatTimer(flashTime)}
                  </div>
                </div>
              </div>

              {/* SHOP BY DEPARTMENT */}
              <div className="px-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-300/80">SHOP BY DEPARTMENT</h3>
                  <button onClick={() => openModalWithHistory('filter')} className="text-[10px] font-black uppercase text-fuchsia-400">⚙️ Filter & Sort</button>
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
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 ${
                        activeDepartment === dept.title 
                          ? 'bg-gradient-to-b from-purple-600/40 to-indigo-900/60 text-white border-fuchsia-400 shadow-lg shadow-purple-600/25' 
                          : (darkMode ? 'bg-[#140C2B]/80 text-purple-200 border-purple-500/20' : 'bg-white text-zinc-800 border-purple-200')
                      }`}
                    >
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden mb-1.5 border border-purple-400/40">
                        <img src={dept.img} alt={dept.title} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-black uppercase">{dept.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUB-CATEGORY PILLS */}
              {activeDepartment !== "All" && FASHION_COLLECTIONS_MAP[activeDepartment] && (
                <div className="px-4 mb-5 animate-fadeIn">
                  <div className={`p-2 rounded-2xl border overflow-x-auto no-scrollbar flex items-center gap-2 ${darkMode ? 'bg-[#140C2B]/80 border-purple-500/20' : 'bg-white border-purple-200'}`}>
                    <button
                      onClick={() => setActiveCollection("All")}
                      className={`text-[11px] font-black px-3.5 py-1.5 rounded-xl whitespace-nowrap ${
                        activeCollection === "All"
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                          : 'text-purple-300/70'
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
                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                            : 'text-purple-300/70'
                        }`}
                      >
                        <span>{col.icon}</span>
                        <span>{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* POINT 5 & 6: 3D ANIMATED PRODUCT GRID (NO BAG BUTTON - ONLY BUY NOW & SAVE FOR LATER) */}
              <div className="px-4 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filtered.map(p => {
                    const finalPrice = getDiscountedPrice(p.price, p.discount);
                    const isWish = wishlist.find(x => x.id === p.id);
                    return (
                      <div 
                        key={p.id} 
                        className={`rounded-3xl p-2.5 border flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-600/20 ${
                          darkMode ? 'bg-[#130B29]/90 backdrop-blur-xl border-purple-500/25 text-white' : 'bg-white border-purple-200 text-zinc-900'
                        }`}
                      >
                        <div 
                          className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100/90 cursor-pointer flex items-center justify-center p-2 mb-2 group"
                          onClick={() => openProductDetail(p)}
                        >
                          <img 
                            src={p.images?.[0] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80"} 
                            alt={p.name} 
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                          />
                          {p.discount > 0 && (
                            <span className="absolute top-2 left-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow">
                              -{p.discount}%
                            </span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }} 
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow-md active:scale-90 transition-transform"
                          >
                            {isWish ? <Icon3D name="heart" className="w-4 h-4" /> : "🤍"}
                          </button>
                        </div>

                        <div className="space-y-1 px-1">
                          <p className="text-[9px] font-black uppercase text-purple-400 truncate">{p.brand}</p>
                          <h4 onClick={() => openProductDetail(p)} className="text-xs md:text-sm font-bold line-clamp-1 cursor-pointer">{p.name}</h4>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-sm md:text-base font-black">₹{finalPrice}</span>
                            {p.discount > 0 && <span className="text-[10px] text-purple-300/50 line-through">₹{p.price}</span>}
                          </div>
                        </div>

                        {/* ONLY DIRECT BUY NOW & SAVE FOR LATER (BAG REMOVED) */}
                        <div className="mt-2.5 pt-1 space-y-1.5">
                          <button 
                            onClick={() => triggerDirectBuyNow(p)} 
                            className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            ⚡ Buy Now
                          </button>
                          <button 
                            onClick={() => handleSaveForLater(p)} 
                            className={`w-full py-1.5 rounded-xl font-bold text-[9px] uppercase transition-all ${darkMode ? 'bg-[#1D113D] hover:bg-purple-900/50 text-purple-200 border border-purple-500/20' : 'bg-purple-50 text-purple-800 border border-purple-200'}`}
                          >
                            📌 Save for Later
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENTLY VIEWED STRIP */}
              {recentlyViewed.length > 0 && (
                <div className={`mx-4 my-6 p-4 rounded-3xl border space-y-3 ${darkMode ? 'bg-[#130B29]/90 border-purple-500/20' : 'bg-white border-purple-200'}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-300">👁️ Recently Viewed</h4>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {recentlyViewed.map(rv => (
                      <div key={rv.id} onClick={() => openProductDetail(rv)} className="w-24 shrink-0 cursor-pointer text-center">
                        <img src={rv.images?.[0]} alt="" className="w-full aspect-[4/5] object-contain bg-stone-100 rounded-xl p-1 mb-1" />
                        <p className="text-[10px] font-bold truncate">{rv.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SAVED FOR LATER TAB */}
          {activeTab === "saved" && (
            <div className="p-4 max-w-xl mx-auto space-y-4 animate-fadeIn">
              <h3 className="font-black text-sm uppercase tracking-wider text-purple-300">📌 Buy It Later / Saved ({saveForLater.length})</h3>
              {saveForLater.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-purple-500/30 rounded-3xl space-y-2">
                  <span className="text-3xl">📌</span>
                  <p className="text-xs text-purple-300/70 font-bold">No saved items right now.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {saveForLater.map(item => (
                    <div key={item.id} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${darkMode ? 'bg-[#130B29] border-purple-500/25' : 'bg-white border-purple-200'}`}>
                      <img src={item.images?.[0]} alt="" className="w-14 h-16 object-contain bg-stone-100 rounded-xl p-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate">{item.name}</h4>
                        <p className="text-xs font-black text-fuchsia-400">₹{getDiscountedPrice(item.price, item.discount)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => triggerDirectBuyNow(item)} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg text-[10px] font-black uppercase">Buy Now ⚡</button>
                        <button onClick={() => syncSaveForLater(saveForLater.filter(x => x.id !== item.id))} className="text-[10px] text-purple-300/60 underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <div className="p-4 max-w-xl mx-auto space-y-4 animate-fadeIn">
              <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-[#130B29] border-purple-500/25' : 'bg-white border-purple-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center font-black text-lg">
                      {(custInfo.name || user?.displayName || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-base">{custInfo.name || user?.displayName || "STYLE ZONE Insider"}</h3>
                      <p className="text-xs text-purple-300/70 font-bold">{user?.email || custInfo.phone || "Guest Shopper"}</p>
                    </div>
                  </div>
                  {!user && (
                    <button onClick={() => openModalWithHistory('login')} className="px-4 py-2 bg-purple-600 text-white font-black rounded-xl text-xs uppercase">
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              <div className={`rounded-3xl border divide-y text-xs font-bold ${darkMode ? 'bg-[#130B29] border-purple-500/25 divide-purple-500/15' : 'bg-white border-purple-200 divide-purple-100'}`}>
                <div onClick={() => openModalWithHistory('profile')} className="p-4 flex items-center justify-between cursor-pointer">
                  <span>👤 My Profile (Name, Gender, Mobile)</span><span>›</span>
                </div>
                <div onClick={() => openModalWithHistory('address')} className="p-4 flex items-center justify-between cursor-pointer">
                  <span>📍 Saved Delivery Address ({custInfo.pin || "Set PIN"})</span><span>›</span>
                </div>
                <div onClick={() => setShowSizeGuide(true)} className="p-4 flex items-center justify-between cursor-pointer">
                  <span>📏 Official Size Guide</span><span>›</span>
                </div>
                <div onClick={() => setShowSupportModal(true)} className="p-4 flex items-center justify-between cursor-pointer">
                  <span>🎧 Customer Concierge & WhatsApp</span><span>›</span>
                </div>
                <div onClick={triggerPwaInstall} className="p-4 flex items-center justify-between cursor-pointer text-fuchsia-400">
                  <span>📲 {isAlreadyInstalled ? "App Installed ✓" : "Install App on Phone"}</span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">{isAlreadyInstalled ? "Done" : "Install"}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-300">📦 My Orders ({orders.length})</h4>
                {orders.length === 0 ? (
                  <p className="text-center text-xs text-purple-300/60 py-6 border border-dashed border-purple-500/30 rounded-2xl">No orders placed yet.</p>
                ) : (
                  orders.map(o => (
                    <div key={o.id} className={`p-4 border rounded-3xl space-y-2 text-xs font-bold ${darkMode ? 'bg-[#130B29] border-purple-500/25' : 'bg-white border-purple-200'}`}>
                      <div className="flex justify-between items-center border-b border-purple-500/20 pb-1">
                        <span className="font-mono text-fuchsia-400">#{o.orderIdRef || o.id.slice(0, 6)}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 text-[10px]">{o.status}</span>
                      </div>
                      {o.items?.map((it, idx) => (
                        <p key={idx} className="text-purple-200/70">• {it.name} [{it.size}, {it.color}] x{it.qty}</p>
                      ))}
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-black">Total: ₹{o.totalAmount}</span>
                        {o.status?.includes("Confirmed") && (
                          <button onClick={() => handleCancelOrder(o)} className="text-rose-400 underline text-[10px]">Cancel & Restore Stock</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {user ? (
                <button onClick={() => { signOut(auth); setUser(null); showToastMessage("Logged out"); }} className="w-full py-3 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-2xl font-black text-xs uppercase">Logout</button>
              ) : (
                <button onClick={() => openModalWithHistory('login')} className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-2xl font-black text-xs uppercase">Sign In / Create Account ✨</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* POINT 5: 2-STEP 3D DIRECT EXPRESS CHECKOUT MODAL (ADDRESS SELECT/FORM -> PAYMENT) */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#130B29] border border-purple-400/40 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            
            {/* Header & Step Progress */}
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-fuchsia-300">
                  {checkoutStep === 1 ? "Step 1: Delivery Address" : "Step 2: Payment & Confirm"}
                </h3>
                <p className="text-[10px] text-purple-300/70">Single-Item Direct Express Checkout</p>
              </div>
              <button onClick={() => setCheckoutItem(null)} className="p-1.5 rounded-full bg-purple-950 text-purple-200">✕</button>
            </div>

            {/* Selected Product Preview Card */}
            <div className="p-3 rounded-2xl bg-[#1C113B] border border-purple-500/25 flex items-center gap-3">
              <img src={checkoutItem.images?.[0]} alt="" className="w-14 h-16 object-contain bg-white rounded-xl p-1" />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-xs truncate">{checkoutItem.name}</h4>
                <p className="text-[10px] text-purple-300">Size: {checkoutItem.selectedSize} • Color: {checkoutItem.selectedColor}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-black text-sm text-fuchsia-400">₹{itemUnitSalePrice}</span>
                  <div className="flex items-center border border-purple-500/30 rounded-lg overflow-hidden bg-purple-950">
                    <button onClick={() => setCheckoutQty(Math.max(1, checkoutQty - 1))} className="px-2 py-0.5 font-black">-</button>
                    <span className="px-2.5 font-bold">{checkoutQty}</span>
                    <button onClick={() => setCheckoutQty(Math.min(checkoutItem.stock || 5, checkoutQty + 1))} className="px-2 py-0.5 font-black">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 1: ADDRESS SELECTION (SAVED VS NEW ADDRESS FORM) */}
            {checkoutStep === 1 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAddressMode("saved")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      addressMode === "saved" 
                        ? 'bg-purple-600/30 border-fuchsia-400 shadow-lg' 
                        : 'bg-[#1B1038] border-purple-500/20 opacity-70'
                    }`}
                  >
                    <p className="font-black text-[11px] text-white">📍 Saved Address</p>
                    <p className="text-[9px] text-purple-300 truncate mt-0.5">
                      {custInfo.vill ? `${custInfo.vill}, ${custInfo.pin}` : "Not saved yet"}
                    </p>
                  </button>

                  <button
                    onClick={() => setAddressMode("new")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      addressMode === "new" 
                        ? 'bg-purple-600/30 border-fuchsia-400 shadow-lg' 
                        : 'bg-[#1B1038] border-purple-500/20 opacity-70'
                    }`}
                  >
                    <p className="font-black text-[11px] text-white">➕ Other Address</p>
                    <p className="text-[9px] text-purple-300 mt-0.5">Ship to another location</p>
                  </button>
                </div>

                {addressMode === "saved" ? (
                  <div className="p-4 rounded-2xl bg-[#1B1038] border border-purple-500/25 space-y-1">
                    {custInfo.vill && custInfo.pin ? (
                      <>
                        <p className="font-black text-white">{custInfo.name} ({custInfo.phone})</p>
                        <p className="text-purple-200/80">{custInfo.road ? `${custInfo.road}, ` : ''}{custInfo.vill}, {custInfo.city}, PIN: {custInfo.pin}</p>
                      </>
                    ) : (
                      <p className="text-amber-300 font-bold">No saved address found. Please select "Other Address" above to enter your delivery details.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 bg-[#1B1038] p-3.5 rounded-2xl border border-purple-500/25">
                    <input 
                      value={newOrderAddress.name} 
                      onChange={(e) => setNewOrderAddress({...newOrderAddress, name: e.target.value})} 
                      placeholder="Receiver Full Name *" 
                      className="w-full p-2.5 bg-[#120A26] border border-purple-500/30 rounded-xl font-bold text-white" 
                    />
                    <input 
                      type="tel"
                      value={newOrderAddress.phone} 
                      onChange={(e) => setNewOrderAddress({...newOrderAddress, phone: e.target.value})} 
                      placeholder="Receiver Mobile Number *" 
                      className="w-full p-2.5 bg-[#120A26] border border-purple-500/30 rounded-xl font-bold text-white" 
                    />
                    <input 
                      value={newOrderAddress.vill} 
                      onChange={(e) => setNewOrderAddress({...newOrderAddress, vill: e.target.value})} 
                      placeholder="Village / Street / House No *" 
                      className="w-full p-2.5 bg-[#120A26] border border-purple-500/30 rounded-xl font-bold text-white" 
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        value={newOrderAddress.city} 
                        onChange={(e) => setNewOrderAddress({...newOrderAddress, city: e.target.value})} 
                        placeholder="City (Bolpur)" 
                        className="w-full p-2.5 bg-[#120A26] border border-purple-500/30 rounded-xl font-bold text-white" 
                      />
                      <input 
                        type="number"
                        value={newOrderAddress.pin} 
                        onChange={(e) => setNewOrderAddress({...newOrderAddress, pin: e.target.value})} 
                        placeholder="PIN Code (731204) *" 
                        className="w-full p-2.5 bg-[#120A26] border border-purple-500/30 rounded-xl font-bold text-white" 
                      />
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleProceedToPaymentStep}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-black rounded-2xl uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-transform"
                >
                  Next: Payment Options →
                </button>
              </div>
            )}

            {/* STEP 2: PAYMENT METHOD (UPI / COD) & ORDER CONFIRMATION */}
            {checkoutStep === 2 && (
              <div className="space-y-3 animate-fadeIn">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input placeholder="Promo Code (STYLE100 / STYLE20)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1 p-2.5 bg-[#1B1038] border border-purple-500/30 rounded-xl font-black uppercase text-white" />
                  <button type="submit" className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-black">Apply</button>
                </form>

                <div className="p-3.5 rounded-2xl bg-[#1B1038] border border-purple-500/25 space-y-1.5">
                  <div className="flex justify-between text-purple-300/70"><span>Item Price ({checkoutQty} pc)</span><span>₹{singleRawTotal}</span></div>
                  {appliedCoupon && <div className="flex justify-between text-emerald-400"><span>Coupon ({appliedCoupon.code})</span><span>-₹{singleCouponDeduction}</span></div>}
                  <div className="flex justify-between text-purple-300/70"><span>Express Delivery</span><span>{singleDeliveryFee === 0 ? "FREE" : `₹${singleDeliveryFee}`}</span></div>
                  <div className="flex justify-between border-t border-purple-500/20 pt-2 font-black text-sm text-white"><span>Total Payable</span><span>₹{singleFinalPayable}</span></div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-purple-300">Select Payment Method</p>
                  <div className="grid grid-cols-2 gap-2 font-black">
                    <button 
                      onClick={() => setPaymentType("UPI")} 
                      className={`p-3 rounded-2xl border text-center transition-all ${paymentType === "UPI" ? 'bg-purple-600 border-fuchsia-400 text-white shadow-lg' : 'bg-[#1B1038] border-purple-500/25 text-purple-300'}`}
                    >
                      📱 Online UPI
                    </button>
                    <button 
                      onClick={() => setPaymentType("COD")} 
                      className={`p-3 rounded-2xl border text-center transition-all ${paymentType === "COD" ? 'bg-purple-600 border-fuchsia-400 text-white shadow-lg' : 'bg-[#1B1038] border-purple-500/25 text-purple-300'}`}
                    >
                      💵 Cash on Delivery
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setCheckoutStep(1)} className="px-4 py-3.5 bg-purple-950 text-purple-200 rounded-2xl font-black uppercase">
                    ← Back
                  </button>
                  <button 
                    onClick={handleConfirmSingleItemOrder}
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black rounded-2xl uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-transform"
                  >
                    Confirm Order (₹{singleFinalPayable}) ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAGGABLE (MOVEABLE) BOTTOM-RIGHT ENGLISH AI STYLIST ORB */}
      {!isAdminUrl && (
        <div
          onMouseDown={handleAiPointerDown}
          onTouchStart={handleAiPointerDown}
          onClick={() => {
            if (!hasDraggedRef.current) openModalWithHistory('ai');
          }}
          style={{
            transform: `translate(${aiPos.x}px, ${aiPos.y}px)`,
            touchAction: "none"
          }}
          className="fixed bottom-20 right-4 z-40 cursor-grab active:cursor-grabbing select-none group"
        >
          <div className="relative flex items-center gap-2 bg-[#140B2E]/95 backdrop-blur-xl border border-fuchsia-400/50 p-2 pr-3.5 rounded-full shadow-2xl shadow-purple-600/40 hover:scale-105 transition-transform">
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 opacity-50 blur group-hover:opacity-85 animate-pulse -z-10" />
            <Icon3D name="ai" className="w-8 h-8" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-none">AI Stylist</p>
              <p className="text-[8px] font-bold text-fuchsia-300 mt-0.5">Move / Ask</p>
            </div>
          </div>
        </div>
      )}

      {/* FULL ENGLISH AI PERSONAL STYLIST DRAWER */}
      {isAiAssistantOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-5 border border-purple-400/40 bg-[#130B29] text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-purple-500/25 pb-3">
              <div className="flex items-center gap-2.5">
                <Icon3D name="ai" className="w-8 h-8" />
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-fuchsia-300">STYLE ZONE - X AI Concierge</h3>
                  <p className="text-[10px] text-emerald-400 font-bold">● English Fashion & Delivery Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsAiAssistantOpen(false)} className="p-1.5 rounded-full bg-purple-950 text-purple-200 text-xs">✕</button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar text-xs">
              {aiMessages.map((m, idx) => (
                <div key={idx} className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${m.sender === 'ai' ? 'bg-[#1D113D] border border-purple-500/20 text-purple-100' : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black ml-auto'}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                "Show Oversized T-Shirts",
                "Find Sneakers & Footwear",
                "Outfits under 1000",
                "Check delivery for 731204",
                "Active promo coupons"
              ].map(chip => (
                <button 
                  key={chip}
                  onClick={() => handleAiPrompt(chip)}
                  className="text-[10px] font-black px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 hover:bg-purple-600 hover:text-white transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAiPrompt(aiInputText); }} className="flex gap-2 pt-1">
              <input
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Ask AI in English..."
                className="flex-1 p-2.5 rounded-xl border border-purple-500/30 bg-[#1D113D] text-white text-xs font-bold focus:outline-none"
              />
              <button type="submit" className="px-4 py-2.5 bg-purple-600 text-white font-black rounded-xl text-xs uppercase">Ask</button>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL (NO BAG BUTTON - ONLY BUY NOW & SAVE FOR LATER) */}
      {selectedProduct && (
        <div className={`fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between ${darkMode ? 'bg-[#0A0618] text-white' : 'bg-white text-zinc-900'}`}>
          <div className={`sticky top-0 backdrop-blur-md z-20 border-b px-4 py-3 flex items-center justify-between ${darkMode ? 'bg-[#0D071E]/90 border-purple-500/20' : 'bg-white/95 border-purple-200'}`}>
            <button onClick={() => setSelectedProduct(null)} className="text-xs font-black uppercase bg-purple-900 text-white px-3.5 py-1.5 rounded-full">← Back</button>
            <button onClick={() => toggleWishlist(selectedProduct)} className="p-2 bg-purple-950 text-white rounded-full">
              {wishlist.find(x => x.id === selectedProduct.id) ? <Icon3D name="heart" className="w-5 h-5" /> : "🤍"}
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full p-4 space-y-6 pb-28">
            <div className="relative">
              <div 
                ref={imageSliderRef}
                className="w-full aspect-[4/5] rounded-3xl overflow-x-auto snap-x snap-mandatory flex no-scrollbar border border-purple-500/30 bg-stone-100"
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
              <span className="text-[10px] font-black uppercase text-purple-400">{selectedProduct.brand}</span>
              <h1 className="text-xl md:text-2xl font-black font-serif">{selectedProduct.name}</h1>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-2xl font-black">₹{getDiscountedPrice(selectedProduct.price, selectedProduct.discount)}</span>
                {selectedProduct.discount > 0 && <span className="text-xs font-black text-rose-500">{selectedProduct.discount}% OFF</span>}
              </div>
            </div>

            {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
              <div className="space-y-2 border-t border-purple-500/20 pt-4">
                <div className="flex justify-between">
                  <span className="text-xs font-black uppercase">SELECT SIZE</span>
                  <button onClick={() => setShowSizeGuide(true)} className="text-[10px] font-black text-fuchsia-400 underline">Size Guide 📏</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableSizes.map(sz => (
                    <button 
                      key={sz} 
                      onClick={() => setSelectedSizes({ ...selectedSizes, [selectedProduct.id]: sz })}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${selectedSizes[selectedProduct.id] === sz ? 'bg-purple-600 text-white border-fuchsia-400 scale-105' : 'border-purple-500/30'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-[#130B29] border-purple-500/25' : 'bg-purple-50 border-purple-200'}`}>
              <span className="text-xs font-black uppercase">🚚 Check Express Delivery</span>
              <input 
                type="number" 
                placeholder="Enter 6-digit PIN (e.g. 731204)" 
                value={pinCheckInput} 
                onChange={(e) => {
                  setPinCheckInput(e.target.value);
                  if (e.target.value.length === 6) {
                    setPinCheckMsg(ALLOWED_PINS.includes(e.target.value) ? "✅ Express Delivery Available (2-3 Days)" : "❌ Delivery opening soon in this PIN.");
                  } else setPinCheckMsg(null);
                }} 
                className={`w-full p-2.5 border rounded-xl text-xs font-bold ${darkMode ? 'bg-[#1C113B] border-purple-500/30 text-white' : 'bg-white'}`} 
              />
              {pinCheckMsg && <p className="text-[10px] font-black">{pinCheckMsg}</p>}
            </div>

            <div className="border-t border-purple-500/20 pt-4 space-y-3">
              <span className="text-xs font-black uppercase">⭐ Customer Reviews ({productReviews.length})</span>
              <form onSubmit={handleSubmitReview} className="flex gap-2">
                <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} className="p-2 rounded-xl bg-purple-950 text-white text-xs font-black">
                  <option value="5">5★</option>
                  <option value="4">4★</option>
                  <option value="3">3★</option>
                </select>
                <input value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Write a review..." className="flex-1 p-2 rounded-xl border border-purple-500/30 text-xs bg-transparent" />
                <button type="submit" className="px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-black">Post</button>
              </form>
              {productReviews.map(r => (
                <div key={r.id} className="p-2.5 rounded-xl border border-purple-500/20 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{r.userName} {r.isVerifiedBuyer && <span className="text-emerald-400 text-[10px]">✓ Verified</span>}</span>
                    <span className="text-amber-400">{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="text-purple-200/70">{r.comment}</p>
                </div>
              ))}
            </div>

            {similarProducts.length > 0 && (
              <div className="border-t border-purple-500/20 pt-6 space-y-3">
                <h4 className="text-xs font-black uppercase">✨ SIMILAR {selectedProduct.category.toUpperCase()}</h4>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {similarProducts.map(sp => (
                    <div key={sp.id} onClick={() => openProductDetail(sp)} className="w-32 shrink-0 cursor-pointer text-center p-2 rounded-2xl border border-purple-500/25">
                      <img src={sp.images?.[0]} alt="" className="w-full aspect-[4/5] object-contain mb-1.5" />
                      <p className="text-[10px] font-bold truncate">{sp.name}</p>
                      <p className="text-[11px] font-black text-fuchsia-400">₹{getDiscountedPrice(sp.price, sp.discount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ONLY SAVE FOR LATER & DIRECT BUY NOW IN PRODUCT DETAIL BAR */}
          <div className={`fixed bottom-0 inset-x-0 border-t p-3 z-50 flex gap-2.5 max-w-2xl mx-auto ${darkMode ? 'bg-[#0D071E]/95 border-purple-500/25' : 'bg-white/95 border-purple-200'}`}>
            <button onClick={() => handleSaveForLater(selectedProduct)} className="px-5 py-3.5 rounded-2xl font-black text-xs uppercase bg-purple-950 text-purple-200 border border-purple-500/30">
              📌 Save for Later
            </button>
            <button onClick={() => triggerDirectBuyNow(selectedProduct)} className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-black rounded-2xl text-xs uppercase shadow-lg">
              Buy Now ⚡
            </button>
          </div>
        </div>
      )}

      {/* WISHLIST MODAL */}
      {isWishlistOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs text-white max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
              <h3 className="font-black uppercase text-fuchsia-300">❤️ My Wishlist ({wishlist.length})</h3>
              <button onClick={() => setIsWishlistOpen(false)}>✕</button>
            </div>
            {wishlist.length === 0 ? (
              <p className="text-center text-purple-300/60 py-8">Your wishlist is empty.</p>
            ) : (
              wishlist.map(w => (
                <div key={w.id} className="p-3 rounded-2xl bg-[#1C113B] border border-purple-500/20 flex items-center justify-between gap-3">
                  <img src={w.images?.[0]} alt="" className="w-12 h-14 object-contain bg-white rounded-xl p-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{w.name}</p>
                    <p className="font-black text-fuchsia-400">₹{getDiscountedPrice(w.price, w.discount)}</p>
                  </div>
                  <button onClick={() => { setIsWishlistOpen(false); triggerDirectBuyNow(w); }} className="px-3 py-1.5 bg-purple-600 rounded-xl font-black text-[10px]">Buy Now</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PLAYFUL DODGING LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="font-black text-base tracking-wider uppercase text-fuchsia-300">STYLE ZONE ACCESS</h3>
                <p className="text-[10px] text-purple-300/70">Enter valid Name & 10-digit Phone to unlock!</p>
              </div>
              <button onClick={() => setIsLoginModalOpen(false)} className="p-1.5 rounded-full bg-purple-950 text-xs">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <input value={loginNameInput} onChange={(e) => { setLoginNameInput(e.target.value); setDodgeOffset({ x: 0, y: 0 }); }} placeholder="Full Name (Min 3 chars)" className="w-full bg-[#1C113B] border border-purple-500/30 p-3 rounded-xl font-bold text-white" />
              <input type="tel" value={loginPhoneInput} onChange={(e) => { setLoginPhoneInput(e.target.value); setDodgeOffset({ x: 0, y: 0 }); }} placeholder="10-Digit Mobile Number" className="w-full bg-[#1C113B] border border-purple-500/30 p-3 rounded-xl font-bold text-white" />
              <div className="pt-2 flex justify-center h-14 items-center">
                <button
                  onMouseEnter={handleDodgeButton}
                  onClick={() => {
                    if (!isLoginFormValid) {
                      handleDodgeButton();
                      showToastMessage("Fill valid Name & Phone first! 😜", "error");
                    } else {
                      setCustInfo({ ...custInfo, name: loginNameInput, phone: loginPhoneInput });
                      setIsLoginModalOpen(false);
                      showToastMessage(`Welcome ${loginNameInput}! 🎉`);
                    }
                  }}
                  style={{ transform: `translate(${dodgeOffset.x}px, ${dodgeOffset.y}px)` }}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-transform duration-200 ${
                    isLoginFormValid ? 'bg-emerald-500 text-zinc-950' : 'bg-purple-600 text-white'
                  }`}
                >
                  {isLoginFormValid ? "Locked & Ready →" : "Continue"}
                </button>
              </div>
              <button onClick={handleGoogleLogin} className="w-full py-3 bg-white text-zinc-950 font-black rounded-xl text-xs uppercase">Continue with Google</button>
            </div>
          </div>
        </div>
      )}

      {/* 2-MINUTE UPI VERIFICATION & WHATSAPP INVOICE MODALS */}
      {activePaymentOrder && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-white">
            <div className="w-14 h-14 bg-purple-500/20 text-fuchsia-300 rounded-full flex items-center justify-center text-2xl mx-auto animate-pulse">⏳</div>
            <h3 className="text-lg font-black">Verifying UPI Payment</h3>
            <p className="text-xs text-purple-200/70">Complete payment of <b>₹{activePaymentOrder.totalAmount}</b>. Admin is verifying your transfer.</p>
            <div className="p-3 bg-[#0A0518] border border-purple-500/30 rounded-2xl font-mono text-xl font-black text-fuchsia-400">
              {formatTimer(verificationCountdown)}
            </div>
            <button onClick={() => setActivePaymentOrder(null)} className="text-xs text-purple-300 underline">Check Status in My Orders</button>
          </div>
        </div>
      )}

      {showInvoice && completedOrderReceipt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs font-bold text-white">
            <h3 className="font-serif font-black text-lg text-center">{BRAND_NAME}</h3>
            <p className="text-emerald-400 font-black text-center">🎉 Order Confirmed! Ref: #{completedOrderReceipt.orderIdRef}</p>
            <button 
              onClick={() => {
                const msg = `⚡ *NEW ORDER: STYLE ZONE - X*\nRef: #${completedOrderReceipt.orderIdRef}\nName: ${completedOrderReceipt.customerName}\nTotal: ₹${completedOrderReceipt.totalAmount}`;
                window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
                setShowInvoice(false);
              }}
              className="w-full py-3 bg-emerald-500 text-zinc-950 rounded-xl font-black uppercase"
            >
              Send Receipt on WhatsApp 💬
            </button>
          </div>
        </div>
      )}

      {/* ADDRESS, PROFILE, FILTER & CATEGORIES MODALS */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
              <h3 className="uppercase font-black text-fuchsia-300">📍 Saved Delivery Address</h3>
              <button onClick={() => setIsAddressModalOpen(false)}>✕</button>
            </div>
            <input value={custInfo.name} onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} placeholder="Receiver Name *" className="w-full p-2.5 bg-[#1C113B] rounded-xl" />
            <input value={custInfo.phone} onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})} placeholder="Mobile Number *" className="w-full p-2.5 bg-[#1C113B] rounded-xl" />
            <input value={custInfo.vill} onChange={(e) => setCustInfo({...custInfo, vill: e.target.value})} placeholder="Village / Area *" className="w-full p-2.5 bg-[#1C113B] rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <input value={custInfo.city} onChange={(e) => setCustInfo({...custInfo, city: e.target.value})} placeholder="City" className="w-full p-2.5 bg-[#1C113B] rounded-xl" />
              <input value={custInfo.pin} onChange={(e) => setCustInfo({...custInfo, pin: e.target.value})} placeholder="PIN Code (731204) *" className="w-full p-2.5 bg-[#1C113B] rounded-xl" />
            </div>
            <button onClick={saveAddressData} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black uppercase">Save Address</button>
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
              <h3 className="uppercase font-black text-fuchsia-300">👤 My Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)}>✕</button>
            </div>
            <input value={custInfo.name} onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} placeholder="Full Name" className="w-full p-2.5 bg-[#1C113B] rounded-xl" />
            <input value={custInfo.phone} onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})} placeholder="Mobile Number" className="w-full p-2.5 bg-[#1C113B] rounded-xl" />
            <button onClick={saveProfileData} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black uppercase">Save Profile</button>
          </div>
        </div>
      )}

      {isFilterDrawerOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-end">
          <div className="w-full max-w-xs h-full bg-[#130B29] text-white p-6 flex flex-col justify-between border-l border-purple-500/25">
            <div className="space-y-4">
              <div className="flex justify-between border-b border-purple-500/20 pb-2">
                <h3 className="text-sm font-black uppercase">Filter & Sort</h3>
                <button onClick={() => setIsFilterDrawerOpen(false)}>✕</button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#1C113B] text-xs font-bold">
                <option value="recommended">Recommended</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#1C113B] text-xs font-bold">
                <option value="All">All Prices</option>
                <option value="under500">Under ₹500</option>
                <option value="500-1000">₹500 - ₹1000</option>
                <option value="1000-2000">₹1000 - ₹2000</option>
                <option value="above2000">Above ₹2000</option>
              </select>
            </div>
            <button onClick={() => setIsFilterDrawerOpen(false)} className="w-full py-3 bg-purple-600 text-white font-black rounded-xl text-xs uppercase">Apply</button>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs font-bold border border-purple-500/30 bg-[#130B29] text-white">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-2">
              <h3 className="font-black text-sm uppercase text-fuchsia-300">Shop By Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>✕</button>
            </div>
            <div className="space-y-2">
              {FASHION_DEPARTMENTS.slice(1).map(dept => (
                <div 
                  key={dept} 
                  onClick={() => { setActiveDepartment(dept); setActiveCollection("All"); setIsCategoryModalOpen(false); setActiveTab("shop"); }}
                  className="p-3 bg-[#1C113B] hover:bg-purple-600 rounded-2xl cursor-pointer flex justify-between items-center transition-colors"
                >
                  <span className="font-black text-sm">{dept}</span>
                  <span>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between border-b border-purple-500/20 pb-2">
              <h3 className="uppercase font-black">📏 Official Size Guide</h3>
              <button onClick={() => setShowSizeGuide(false)}>✕</button>
            </div>
            <p className="text-purple-200/80">S: 38" Chest | M: 40" Chest | L: 42" Chest | XL: 44" Chest</p>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#130B29] border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between border-b border-purple-500/20 pb-2">
              <h3 className="uppercase font-black">🎧 Customer Concierge</h3>
              <button onClick={() => setShowSupportModal(false)}>✕</button>
            </div>
            <a href="https://wa.me/918637589429" target="_blank" rel="noreferrer" className="block p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-center">WhatsApp: +91 8637589429</a>
          </div>
        </div>
      )}

      {/* POINT 4: 4-BUTTON 3D ANIMATED BOTTOM DOCK (HOME, CATEGORIES, SAVED, ACCOUNT - NO BAG) */}
      {!isAdminUrl && (
        <nav className={`fixed bottom-2.5 inset-x-4 border p-2 z-40 flex justify-around items-center max-w-md mx-auto rounded-full shadow-2xl backdrop-blur-2xl ${darkMode ? 'bg-[#120A26]/95 border-purple-500/30 shadow-purple-900/40' : 'bg-white/95 border-purple-200'}`}>
          {[
            { id: "shop", label: "Home", icon: <Icon3D name="home" className="w-5 h-5" />, action: () => { setActiveTab("shop"); setActiveDepartment("All"); } },
            { id: "categories", label: "Category", icon: <Icon3D name="category" className="w-5 h-5" />, action: () => openModalWithHistory('category') },
            { id: "saved", label: "Saved", icon: <Icon3D name="saved" className="w-5 h-5" />, badge: saveForLater.length, action: () => setActiveTab("saved") },
            { id: "account", label: "Account", icon: <Icon3D name="account" className="w-5 h-5" />, action: () => setActiveTab("account") }
          ].map(nav => {
            const isActive = (nav.id === "shop" && activeTab === "shop") || (nav.id === "saved" && activeTab === "saved") || (nav.id === "account" && activeTab === "account");
            return (
              <button
                key={nav.id}
                onClick={nav.action}
                className="relative flex flex-col items-center justify-center w-16 h-11 transition-all duration-300"
              >
                <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive 
                    ? '-translate-y-3.5 w-12 h-12 bg-gradient-to-tr from-purple-600 to-fuchsia-600 border-2 border-purple-200 shadow-lg shadow-purple-500/50 scale-110' 
                    : 'w-8 h-8 hover:scale-110'
                }`}>
                  {nav.icon}
                  {nav.badge > 0 && !isActive && (
                    <span className="absolute top-0 right-2 bg-fuchsia-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {nav.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] uppercase tracking-wider font-black transition-all ${
                  isActive ? '-mt-2.5 text-fuchsia-400 opacity-100' : 'mt-0.5 text-purple-300/70 opacity-85'
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
