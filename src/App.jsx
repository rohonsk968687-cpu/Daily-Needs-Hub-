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

// 3D Ultra-Premium SVG Icons Component
const Icon3D = ({ name, className = "w-5 h-5" }) => {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="h3d" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <path d="M16 4L4 14H8V27H14V20H18V27H24V14H28L16 4Z" fill="url(#h3d)" />
          <path d="M16 4L28 14H24L16 7.3L8 14H4L16 4Z" fill="#FEF3C7" opacity="0.8" />
        </svg>
      );
    case "category":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="c3d" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="10" height="10" rx="3" fill="url(#c3d)" />
          <rect x="18" y="4" width="10" height="10" rx="5" fill="#93C5FD" />
          <rect x="4" y="18" width="10" height="10" rx="5" fill="#60A5FA" />
          <rect x="18" y="18" width="10" height="10" rx="3" fill="url(#c3d)" />
        </svg>
      );
    case "saved":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="s3d" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
          </defs>
          <path d="M7 5C7 3.89543 7.89543 3 9 3H23C24.1046 3 25 3.89543 25 5V28L16 22.5L7 28V5Z" fill="url(#s3d)" />
          <path d="M9 3H23C24.1 3 25 3.9 25 5V8H7V5C7 3.9 7.9 3 9 3Z" fill="#FBCFE8" opacity="0.7" />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="b3d" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <path d="M6 10H26L28 28H4L6 10Z" fill="url(#b3d)" />
          <path d="M11 10V8C11 5.23858 13.2386 3 16 3C18.7614 3 21 5.23858 21 8V10" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="14" r="1.5" fill="#ECFDF5" />
          <circle cx="20" cy="14" r="1.5" fill="#ECFDF5" />
        </svg>
      );
    case "account":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="u3d" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="11" r="6" fill="url(#u3d)" />
          <path d="M6 27C6 22.0294 10.4772 18 16 18C21.5228 18 26 22.0294 26 27H6Z" fill="url(#u3d)" />
        </svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none">
          <defs>
            <radialGradient id="aiOrb" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="45%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#4F46E5" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="16" fill="url(#aiOrb)" />
          <path d="M18 8L20.5 15.5L28 18L20.5 20.5L18 28L15.5 20.5L8 18L15.5 15.5L18 8Z" fill="#FFFFFF" />
          <circle cx="25" cy="11" r="2" fill="#FEF08A" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="hrt3d" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          <path d="M16 28C16 28 4 20.4 4 11.5C4 7.9 6.9 5 10.5 5C12.8 5 14.8 6.2 16 8C17.2 6.2 19.2 5 21.5 5C25.1 5 28 7.9 28 11.5C28 20.4 16 28 16 28Z" fill="url(#hrt3d)" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <defs>
            <linearGradient id="srch3d" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          <circle cx="14" cy="14" r="9" stroke="url(#srch3d)" strokeWidth="3.5" fill="#FEF3C7" fillOpacity="0.2" />
          <path d="M21 21L28 28" stroke="url(#srch3d)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Playful Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginNameInput, setLoginNameInput] = useState("");
  const [loginPhoneInput, setLoginPhoneInput] = useState("");
  const [dodgeOffset, setDodgeOffset] = useState({ x: 0, y: 0 });

  // Expandable Search Pill State
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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

  // Payment, 2-Min Verification & Invoice States (Restored)
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [verificationCountdown, setVerificationCountdown] = useState(120);
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedOrderReceipt, setCompletedOrderReceipt] = useState(null);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [activeCollection, setActiveCollection] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  const [darkMode, setDarkMode] = useState(false);
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

    const handleAiPointerUp = () => {
      setIsDraggingAi(false);
    };

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

  // Escape key to close expanded search
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
  }, [selectedProduct, isCartOpen, isWishlistOpen, isNotifOpen, isFilterDrawerOpen, isCategoryModalOpen, isAiAssistantOpen, isLoginModalOpen, isAddressModalOpen, isProfileModalOpen, showSizeGuide, showSupportModal, activeTab]);

  const openModalWithHistory = (type, val = true) => {
    window.history.pushState({ modal: type }, "");
    if (type === 'product') setSelectedProduct(val);
    if (type === 'cart') setIsCartOpen(true);
    if (type === 'wishlist') setIsWishlistOpen(true);
    if (type === 'notif') setIsNotifOpen(true);
    if (type === 'filter') setIsFilterDrawerOpen(true);
    if (type === 'category') setIsCategoryModalOpen(true);
    if (type === 'ai') setIsAiAssistantOpen(true);
    if (type === 'login') setIsLoginModalOpen(true);
    if (type === 'address') setIsAddressModalOpen(true);
    if (type === 'profile') setIsProfileModalOpen(true);
  };

  // PWA Installation Check
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

  // Account Cloud Data Sync
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
      const localProfile = localStorage.getItem("szx_saved_address");
      if (localProfile) try { setCustInfo(prev => ({ ...prev, ...JSON.parse(localProfile) })); } catch {}
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

  // Core Listeners
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
      setIsProductsLoading(false);
    }, () => setIsProductsLoading(false));

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

  // 2-Minute Payment Verification Countdown & Auto-Confirm Listener
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
          setCart([]);
          syncCart([]);
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

  // Playful Login Button Dodge
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

  // FULL ENGLISH CUSTOMER AI STYLIST ENGINE
  const handleAiPrompt = (promptText) => {
    const clean = promptText.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    const newMsgs = [...aiMessages, { sender: "user", text: clean }];
    let reply = "Explore our latest Men, Women, Kids, and Footwear collections! You can also ask me for items under a specific price or check delivery for your PIN code.";

    if (lower.includes("oversized") || lower.includes("t-shirt") || lower.includes("tee")) {
      setActiveDepartment("Men");
      setActiveCollection("Oversized T-Shirts");
      setActiveTab("shop");
      reply = "I have curated our Men's Oversized T-Shirts collection for you. Heavyweight 240+ GSM cotton drops are now displayed on your screen.";
    } else if (lower.includes("sneaker") || lower.includes("kick") || lower.includes("shoe") || lower.includes("footwear")) {
      setActiveDepartment("Footwear");
      setActiveCollection("All");
      setActiveTab("shop");
      reply = "Switched to the Footwear Lounge! Check out our chunky sneakers, loafers, and daily kicks.";
    } else if (lower.includes("women") || lower.includes("dress") || lower.includes("kurti")) {
      setActiveDepartment("Women");
      setActiveCollection("All");
      setActiveTab("shop");
      reply = "Displaying Women's Couture—featuring designer kurtis, flowy dresses, and festive wear.";
    } else if (lower.includes("under 999") || lower.includes("under 1000") || lower.includes("budget")) {
      setPriceFilter("500-1000");
      setActiveTab("shop");
      reply = "Applied smart budget filter: showing all fashion pieces priced between ₹500 and ₹1,000!";
    } else if (lower.match(/\b\d{6}\b/)) {
      const pin = lower.match(/\b\d{6}\b/)[0];
      if (ALLOWED_PINS.includes(pin)) {
        reply = `✅ Express Delivery Confirmed! PIN ${pin} is eligible for 2–3 day doorstep delivery with Cash on Delivery & UPI options.`;
      } else {
        reply = `⚠️ PIN ${pin} is outside our current express zone (${ALLOWED_PINS.slice(0, 4).join(", ")}). Reach out via WhatsApp concierge for special courier arrangements.`;
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
    syncCart(updatedCart);
    showToastMessage("Added to Shopping Bag 🛍️");
    if (openCartAfter) {
      setSelectedProduct(null);
      openModalWithHistory('cart');
    }
  };

  const updateCartQty = (itemKey, delta) => {
    const item = cart.find(x => x.itemKey === itemKey);
    if (!item) return;
    const nextQty = item.qty + delta;
    let updated = [];
    if (nextQty <= 0) {
      updated = cart.filter(x => x.itemKey !== itemKey);
    } else {
      if (delta > 0 && nextQty > item.stock) return showToastMessage("Stock limit reached!", "error");
      updated = cart.map(x => (x.itemKey === itemKey) ? { ...item, qty: nextQty } : x);
    }
    syncCart(updated);
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

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    const targetCoup = dynamicCoupons.find(c => c.code === cleanCode);
    if (targetCoup) {
      if (rawCartTotal < (targetCoup.minOrder || 0)) {
        return showToastMessage(`Min order ₹${targetCoup.minOrder} required!`, "error");
      }
      const disc = targetCoup.discountType === "fixed"
        ? targetCoup.discountValue
        : Math.round((rawCartTotal * targetCoup.discountValue) / 100);
      setAppliedCoupon({ code: cleanCode, discount: disc });
      showToastMessage(`Coupon Applied! ₹${disc} OFF`);
    } else {
      showToastMessage("Invalid coupon code!", "error");
    }
  };

  // Full Transaction Checkout (Restored)
  const handleCheckoutInit = async () => {
    if (!user || user.isAnonymous) {
      setIsCartOpen(false);
      return openModalWithHistory('login');
    }
    if (!custInfo.name || !custInfo.vill || !custInfo.pin || !custInfo.phone) {
      return openModalWithHistory('address');
    }
    if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
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
          if (!prodDoc.exists()) throw new Error(`Product ${item.name} not found!`);
          const currentStock = prodDoc.data().stock || 0;
          if (currentStock < item.qty) throw new Error(`Only ${currentStock} left for ${item.name}!`);
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
          userEmail: user.email || "N/A",
          items: cart.map(i => ({
            id: i.id,
            name: i.name,
            qty: i.qty,
            total: getDiscountedPrice(i.price, i.discount) * i.qty,
            size: i.selectedSize || "Standard",
            color: i.selectedColor || "Default"
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
        window.open(`upi://pay?pa=${MY_UPI_ID}&pn=STYLE%20ZONE%20X&am=${finalPayableTotal}&cu=INR`, '_blank');
        setActivePaymentOrder(createdOrder);
        setVerificationCountdown(120);
      } else {
        setCompletedOrderReceipt(createdOrder);
        setShowInvoice(true);
        setCart([]);
        syncCart([]);
        showToastMessage("Order placed with Cash on Delivery! 🎉");
      }
    } catch (e) {
      showToastMessage(e.message || "Checkout failed", "error");
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
      showToastMessage("Review submission error", "error");
    }
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
  const totalItemSavings = rawMRP - rawCartTotal;
  const couponDeduction = appliedCoupon ? appliedCoupon.discount : 0;
  const deliveryFee = (rawCartTotal - couponDeduction) >= 999 || rawCartTotal === 0 ? 0 : 40;
  const finalPayableTotal = Math.max(0, rawCartTotal - couponDeduction + deliveryFee);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = activeDepartment === "All" || p.category === activeDepartment;
    const matchesCol = activeCollection === "All" || p.subCategory === activeCollection;
    const finalPrice = getDiscountedPrice(p.price, p.discount);
    let matchesPrice = true;
    if (priceFilter === "under500") matchesPrice = finalPrice < 500;
    else if (priceFilter === "500-1000") matchesPrice = finalPrice >= 500 && finalPrice <= 1000;
    else if (priceFilter === "1000-2000") matchesPrice = finalPrice >= 1000 && finalPrice <= 2000;
    else if (priceFilter === "above2000") matchesPrice = finalPrice > 2000;
    let matchesSize = sizeFilter === "All" || (p.availableSizes && p.availableSizes.includes(sizeFilter));
    return matchesSearch && matchesDept && matchesCol && matchesPrice && matchesSize;
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
          dynamicCoupons={dynamicCoupons}
          flashConfig={flashConfig}
          setFlashConfig={setFlashConfig}
          setFlashTime={setFlashTime}
          showToastMessage={showToastMessage}
          handleGoogleLogin={handleGoogleLogin}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto">
          
          {/* 3D ICON LUXURY HEADER WITH EXPANDABLE SEARCH PILL */}
          <header className={`${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'} backdrop-blur-md sticky top-0 z-40 border-b w-full shadow-sm`}>
            <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto gap-2">
              {!isSearchExpanded && (
                <div 
                  className="flex items-center gap-3 cursor-pointer group" 
                  onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); setActiveCollection("All"); }}
                >
                  <div className="w-9 h-9 bg-gradient-to-tr from-zinc-950 to-zinc-800 text-amber-400 rounded-xl flex items-center justify-center font-black text-lg border border-amber-500/40 shadow-md group-hover:scale-105 transition-transform">
                    X
                  </div>
                  <div>
                    <h1 className="text-lg md:text-2xl font-black tracking-widest uppercase leading-none font-serif">{BRAND_NAME}</h1>
                    <p className="text-[8px] uppercase tracking-[0.25em] text-zinc-400 font-black mt-1">{BRAND_TAGLINE}</p>
                  </div>
                </div>
              )}

              {isSearchExpanded ? (
                <div className="flex-1 flex items-center gap-2 animate-fadeIn">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Icon3D name="search" className="w-4 h-4" />
                    </span>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search oversized tees, dresses, sneakers... (Esc)" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-10 pr-12 py-2.5 rounded-full border-2 text-xs font-bold focus:outline-none transition-all ${darkMode ? 'bg-zinc-900 border-amber-500/60 text-white' : 'bg-zinc-50 border-zinc-950 text-zinc-900'}`}
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
                    className={`p-2.5 rounded-full border transition-all ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-zinc-950'}`}
                  >
                    🎙️
                  </button>
                  <button 
                    onClick={() => openModalWithHistory('filter')} 
                    className="p-2.5 rounded-full bg-zinc-800 text-white text-xs"
                  >
                    ⚙️
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSearchExpanded(true)} 
                    className={`p-2.5 rounded-full transition-all hover:scale-110 active:scale-90 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-100'}`}
                    title="Search"
                  >
                    <Icon3D name="search" className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => openModalWithHistory('wishlist')} 
                    className={`p-2.5 rounded-full relative transition-all hover:scale-110 active:scale-90 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-100'}`}
                  >
                    <Icon3D name="heart" className="w-4 h-4" />
                    {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{wishlist.length}</span>}
                  </button>
                  
                  <button 
                    onClick={() => openModalWithHistory('cart')} 
                    className={`p-2.5 rounded-full relative transition-all hover:scale-110 active:scale-90 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-100'}`}
                  >
                    <Icon3D name="bag" className="w-4 h-4" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                        {cart.length}
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className={`p-2.5 rounded-full text-xs transition-all hover:rotate-12 ${darkMode ? 'bg-zinc-800 text-amber-300' : 'bg-zinc-100 text-zinc-700'}`}
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* STOREFRONT SHOP TAB */}
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
                          className="w-fit bg-white text-zinc-950 px-6 py-2.5 rounded-full font-black text-xs uppercase hover:scale-105 transition-transform"
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
                <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-4 rounded-3xl flex items-center justify-between border border-zinc-800 shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-bounce">⚡</span>
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
                  <button onClick={() => openModalWithHistory('filter')} className="text-[10px] font-black uppercase text-amber-500">⚙️ Filter & Sort</button>
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
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                        activeDepartment === dept.title 
                          ? (darkMode ? 'bg-zinc-900 text-white border-amber-500/50 shadow-lg' : 'bg-zinc-950 text-white shadow-lg') 
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

              {/* SUB-CATEGORY PILLS */}
              {activeDepartment !== "All" && FASHION_COLLECTIONS_MAP[activeDepartment] && (
                <div className="px-4 mb-5 animate-fadeIn">
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

              {/* ANIMATED PRODUCT GRID WITH TRIPLE ACTIONS */}
              <div className="px-4 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map(p => {
                    const finalPrice = getDiscountedPrice(p.price, p.discount);
                    const isWish = wishlist.find(x => x.id === p.id);
                    return (
                      <div 
                        key={p.id} 
                        className={`rounded-2xl p-2.5 border flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                          darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      >
                        <div 
                          className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100/70 cursor-pointer flex items-center justify-center p-2 mb-2 group"
                          onClick={() => openProductDetail(p)}
                        >
                          <img 
                            src={p.images?.[0] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80"} 
                            alt={p.name} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                          {p.discount > 0 && (
                            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
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
                          <p className="text-[9px] font-black uppercase text-zinc-400 truncate">{p.brand}</p>
                          <h4 onClick={() => openProductDetail(p)} className="text-xs md:text-sm font-bold line-clamp-1 cursor-pointer">{p.name}</h4>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-sm md:text-base font-black">₹{finalPrice}</span>
                            {p.discount > 0 && <span className="text-[10px] text-zinc-400 line-through">₹{p.price}</span>}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-1 space-y-1.5">
                          <button 
                            onClick={() => addToCart(p, 1, true)} 
                            className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow active:scale-95 transition-all"
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

              {/* RECENTLY VIEWED STRIP (RESTORED) */}
              {recentlyViewed.length > 0 && (
                <div className={`mx-4 my-6 p-4 rounded-3xl border space-y-3 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">👁️ Recently Viewed</h4>
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
                        <button onClick={() => { syncSaveForLater(saveForLater.filter(x => x.id !== item.id)); addToCart(item, 1, false); }} className="px-3 py-1 bg-amber-500 text-zinc-950 rounded-lg text-[10px] font-black uppercase">Move to Bag</button>
                        <button onClick={() => syncSaveForLater(saveForLater.filter(x => x.id !== item.id))} className="text-[10px] text-zinc-400 underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FULL ACCOUNT, PROFILE, ADDRESS & ORDERS TAB (RESTORED) */}
          {activeTab === "account" && (
            <div className="p-4 max-w-xl mx-auto space-y-4 animate-fadeIn">
              <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-zinc-950 flex items-center justify-center font-black text-lg">
                      {(custInfo.name || user?.displayName || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-base">{custInfo.name || user?.displayName || "STYLE ZONE Insider"}</h3>
                      <p className="text-xs text-zinc-400 font-bold">{user?.email || custInfo.phone || "Guest Shopper"}</p>
                    </div>
                  </div>
                  {!user && (
                    <button onClick={() => openModalWithHistory('login')} className="px-4 py-2 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs uppercase">
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              <div className={`rounded-3xl border divide-y text-xs font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800 divide-zinc-800' : 'bg-white border-zinc-200 divide-zinc-100'}`}>
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
                <div onClick={triggerPwaInstall} className="p-4 flex items-center justify-between cursor-pointer text-amber-500">
                  <span>📲 {isAlreadyInstalled ? "App Installed ✓" : "Install App on Phone"}</span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">{isAlreadyInstalled ? "Done" : "Install"}</span>
                </div>
              </div>

              {/* MY ORDERS HISTORY WITH CANCEL & 7-DAY EXCHANGE (RESTORED) */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">📦 My Orders ({orders.length})</h4>
                {orders.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 py-6 border border-dashed rounded-2xl">No orders placed yet.</p>
                ) : (
                  orders.map(o => (
                    <div key={o.id} className={`p-4 border rounded-3xl space-y-2 text-xs font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-mono text-amber-500">#{o.orderIdRef || o.id.slice(0, 6)}</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 text-[10px]">{o.status}</span>
                      </div>
                      {o.items?.map((it, idx) => (
                        <p key={idx} className="text-zinc-400">• {it.name} [{it.size}, {it.color}] x{it.qty}</p>
                      ))}
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-black">Total: ₹{o.totalAmount}</span>
                        {o.status?.includes("Confirmed") && (
                          <button onClick={() => handleCancelOrder(o)} className="text-rose-500 underline text-[10px]">Cancel & Restore Stock</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {user ? (
                <button onClick={() => { signOut(auth); setUser(null); showToastMessage("Logged out"); }} className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase">Logout</button>
              ) : (
                <button onClick={() => openModalWithHistory('login')} className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase">Sign In / Create Account ✨</button>
              )}
            </div>
          )}
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
          title="Drag to move • Tap for English AI Stylist"
        >
          <div className="relative flex items-center gap-2 bg-zinc-950/90 backdrop-blur-xl border border-amber-500/50 p-2 pr-3.5 rounded-full shadow-2xl shadow-amber-500/25 hover:scale-105 transition-transform">
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 opacity-40 blur group-hover:opacity-75 animate-pulse -z-10" />
            <Icon3D name="ai" className="w-8 h-8" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-none">AI Stylist</p>
              <p className="text-[8px] font-bold text-amber-400 mt-0.5">Drag / Ask</p>
            </div>
          </div>
        </div>
      )}

      {/* FULL ENGLISH AI PERSONAL STYLIST DRAWER */}
      {isAiAssistantOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-4 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2.5">
                <Icon3D name="ai" className="w-8 h-8" />
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider">STYLE ZONE - X AI Concierge</h3>
                  <p className="text-[10px] text-emerald-500 font-bold">● English Fashion & Delivery Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsAiAssistantOpen(false)} className="p-1.5 rounded-full bg-zinc-800 text-white text-xs">✕</button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar text-xs">
              {aiMessages.map((m, idx) => (
                <div key={idx} className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${m.sender === 'ai' ? (darkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900') : 'bg-amber-500 text-zinc-950 font-black ml-auto'}`}>
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
                  className="text-[10px] font-black px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500 hover:text-zinc-950 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleAiPrompt(aiInputText); }}
              className="flex gap-2 pt-1"
            >
              <input
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Ask AI in English..."
                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold focus:outline-none ${darkMode ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200'}`}
              />
              <button type="submit" className="px-4 py-2.5 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs uppercase">
                Ask
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PLAYFUL DODGING LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121217] border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-black text-base tracking-wider uppercase text-amber-400">STYLE ZONE ACCESS</h3>
                <p className="text-[10px] text-zinc-400">Enter valid Name & 10-digit Phone to lock the button!</p>
              </div>
              <button onClick={() => setIsLoginModalOpen(false)} className="p-1.5 rounded-full bg-zinc-800 text-xs">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <input 
                value={loginNameInput}
                onChange={(e) => { setLoginNameInput(e.target.value); setDodgeOffset({ x: 0, y: 0 }); }}
                placeholder="Full Name (Min 3 chars)"
                className="w-full bg-[#1A1A22] border border-zinc-700 p-3 rounded-xl font-bold text-white"
              />
              <input 
                type="tel"
                value={loginPhoneInput}
                onChange={(e) => { setLoginPhoneInput(e.target.value); setDodgeOffset({ x: 0, y: 0 }); }}
                placeholder="10-Digit Mobile Number"
                className="w-full bg-[#1A1A22] border border-zinc-700 p-3 rounded-xl font-bold text-white"
              />
              <div className="pt-2 flex justify-center h-14 items-center">
                <button
                  onMouseEnter={handleDodgeButton}
                  onClick={() => {
                    if (!isLoginFormValid) {
                      handleDodgeButton();
                      showToastMessage("Complete Name & 10-digit Phone first! 😜", "error");
                    } else {
                      setCustInfo({ ...custInfo, name: loginNameInput, phone: loginPhoneInput });
                      setIsLoginModalOpen(false);
                      showToastMessage(`Welcome ${loginNameInput}! 🎉`);
                    }
                  }}
                  style={{ transform: `translate(${dodgeOffset.x}px, ${dodgeOffset.y}px)` }}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-transform duration-200 ${
                    isLoginFormValid ? 'bg-emerald-500 text-zinc-950' : 'bg-amber-500 text-zinc-950'
                  }`}
                >
                  {isLoginFormValid ? "Locked & Ready →" : "Continue"}
                </button>
              </div>
              <button onClick={handleGoogleLogin} className="w-full py-3 bg-white text-zinc-950 font-black rounded-xl text-xs uppercase">
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL WITH TOUCH SWIPE, PINCODE CHECK & VERIFIED REVIEWS */}
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
                <div className="flex justify-between">
                  <span className="text-xs font-black uppercase">SELECT SIZE</span>
                  <button onClick={() => setShowSizeGuide(true)} className="text-[10px] font-black text-amber-500 underline">Size Guide 📏</button>
                </div>
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

            {/* Pincode Checker (Restored) */}
            <div className={`p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <span className="text-xs font-black uppercase">🚚 Check Express Delivery</span>
              <div className="flex gap-2">
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
                  className={`flex-1 p-2.5 border rounded-xl text-xs font-bold ${darkMode ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white'}`} 
                />
              </div>
              {pinCheckMsg && <p className="text-[10px] font-black">{pinCheckMsg}</p>}
            </div>

            {/* Verified Reviews (Restored) */}
            <div className="border-t pt-4 space-y-3">
              <span className="text-xs font-black uppercase">⭐ Customer Reviews ({productReviews.length})</span>
              <form onSubmit={handleSubmitReview} className="flex gap-2">
                <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} className="p-2 rounded-xl bg-zinc-800 text-white text-xs font-black">
                  <option value="5">5★</option>
                  <option value="4">4★</option>
                  <option value="3">3★</option>
                </select>
                <input value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Write a review..." className="flex-1 p-2 rounded-xl border text-xs bg-transparent" />
                <button type="submit" className="px-3 py-2 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black">Post</button>
              </form>
              {productReviews.map(r => (
                <div key={r.id} className="p-2.5 rounded-xl border text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{r.userName} {r.isVerifiedBuyer && <span className="text-emerald-500 text-[10px]">✓ Verified</span>}</span>
                    <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="text-zinc-400">{r.comment}</p>
                </div>
              ))}
            </div>

            {similarProducts.length > 0 && (
              <div className="border-t pt-6 space-y-3">
                <h4 className="text-xs font-black uppercase">✨ SIMILAR {selectedProduct.category.toUpperCase()}</h4>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {similarProducts.map(sp => (
                    <div key={sp.id} onClick={() => openProductDetail(sp)} className="w-32 shrink-0 cursor-pointer text-center p-2 rounded-2xl border">
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

      {/* SHOPPING BAG DRAWER WITH COUPONS, ADDRESS & COD/UPI (RESTORED) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-full max-w-md h-full p-4 shadow-2xl overflow-y-auto flex flex-col justify-between ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-black uppercase">Shopping Bag ({cart.length})</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg bg-zinc-800 text-white text-xs">✕</button>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Deliver To:</p>
                  <p className="font-black truncate max-w-[200px]">{custInfo.vill ? `${custInfo.vill}, ${custInfo.pin}` : "Set delivery address"}</p>
                </div>
                <button onClick={() => openModalWithHistory('address')} className="px-3 py-1.5 bg-amber-500 text-zinc-950 rounded-xl font-black text-[10px]">
                  {custInfo.vill ? "Change" : "Add Address"}
                </button>
              </div>

              <div className="space-y-3 max-h-[35vh] overflow-y-auto no-scrollbar">
                {cart.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 py-10">Your bag is empty.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.itemKey} className={`p-3 rounded-2xl border space-y-2 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="flex gap-3">
                        <img src={item.images?.[0]} alt="" className="w-14 h-16 object-contain bg-zinc-100 rounded-xl p-1" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate">{item.name}</h4>
                          <p className="text-[10px] text-zinc-400">Size: {item.selectedSize}</p>
                          <p className="font-black text-amber-500">₹{getDiscountedPrice(item.price, item.discount) * item.qty}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <div className="flex items-center border rounded-xl overflow-hidden bg-zinc-800">
                          <button onClick={() => updateCartQty(item.itemKey, -1)} className="px-2.5 py-1 text-white font-black">-</button>
                          <span className="px-3 font-bold text-white">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.itemKey, 1)} className="px-2.5 py-1 text-white font-black">+</button>
                        </div>
                        <button onClick={() => updateCartQty(item.itemKey, -item.qty)} className="text-rose-500 font-bold text-[11px]">Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input placeholder="Coupon (STYLE100 / STYLE20)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className={`flex-1 p-2 border rounded-xl text-xs font-black uppercase ${darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50'}`} />
                <button type="submit" className="px-3.5 py-2 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black">Apply</button>
              </form>

              <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex justify-between text-zinc-400"><span>MRP Total</span><span>₹{rawMRP}</span></div>
                <div className="flex justify-between text-emerald-500"><span>Item Discounts</span><span>-₹{totalItemSavings}</span></div>
                {appliedCoupon && <div className="flex justify-between text-emerald-500"><span>Coupon ({appliedCoupon.code})</span><span>-₹{couponDeduction}</span></div>}
                <div className="flex justify-between text-zinc-400"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
                <div className="flex justify-between border-t pt-2 font-black text-sm"><span>Payable Amount</span><span>₹{finalPayableTotal}</span></div>
              </div>
            </div>

            <div className="pt-3 border-t space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-black">
                <button onClick={() => setPaymentType("UPI")} className={`py-2 rounded-xl border ${paymentType === "UPI" ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-white'}`}>Prepaid UPI</button>
                <button onClick={() => setPaymentType("COD")} className={`py-2 rounded-xl border ${paymentType === "COD" ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-white'}`}>Cash on Delivery</button>
              </div>
              <button onClick={handleCheckoutInit} className="w-full py-3.5 bg-amber-500 text-zinc-950 font-black rounded-2xl text-xs uppercase">
                Place Order (₹{finalPayableTotal}) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-MINUTE UPI VERIFICATION MODAL (RESTORED) */}
      {activePaymentOrder && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-white">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-2xl mx-auto animate-pulse">⏳</div>
            <h3 className="text-lg font-black">Verifying UPI Payment</h3>
            <p className="text-xs text-zinc-400">Complete payment of <b>₹{activePaymentOrder.totalAmount}</b>. Admin is verifying your transfer.</p>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl font-mono text-xl font-black text-amber-500">
              {formatTimer(verificationCountdown)}
            </div>
            <button onClick={() => setActivePaymentOrder(null)} className="text-xs text-zinc-400 underline">Check Status in My Orders</button>
          </div>
        </div>
      )}

      {/* WHATSAPP INVOICE RECEIPT MODAL (RESTORED) */}
      {showInvoice && completedOrderReceipt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs font-bold text-white">
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

      {/* ADDRESS & PROFILE MODALS (RESTORED) */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="uppercase font-black text-amber-400">📍 Delivery Address</h3>
              <button onClick={() => setIsAddressModalOpen(false)}>✕</button>
            </div>
            <input value={custInfo.name} onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} placeholder="Receiver Name *" className="w-full p-2.5 bg-zinc-800 rounded-xl" />
            <input value={custInfo.phone} onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})} placeholder="Mobile Number *" className="w-full p-2.5 bg-zinc-800 rounded-xl" />
            <input value={custInfo.vill} onChange={(e) => setCustInfo({...custInfo, vill: e.target.value})} placeholder="Village / Area *" className="w-full p-2.5 bg-zinc-800 rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <input value={custInfo.city} onChange={(e) => setCustInfo({...custInfo, city: e.target.value})} placeholder="City" className="w-full p-2.5 bg-zinc-800 rounded-xl" />
              <input value={custInfo.pin} onChange={(e) => setCustInfo({...custInfo, pin: e.target.value})} placeholder="PIN Code (731204) *" className="w-full p-2.5 bg-zinc-800 rounded-xl" />
            </div>
            <button onClick={saveAddressData} className="w-full py-3 bg-amber-500 text-zinc-950 rounded-xl font-black uppercase">Save Address</button>
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="uppercase font-black text-amber-400">👤 My Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)}>✕</button>
            </div>
            <input value={custInfo.name} onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} placeholder="Full Name" className="w-full p-2.5 bg-zinc-800 rounded-xl" />
            <input value={custInfo.phone} onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})} placeholder="Mobile Number" className="w-full p-2.5 bg-zinc-800 rounded-xl" />
            <button onClick={saveProfileData} className="w-full py-3 bg-amber-500 text-zinc-950 rounded-xl font-black uppercase">Save Profile</button>
          </div>
        </div>
      )}

      {/* FILTER DRAWER (RESTORED) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
          <div className="w-full max-w-xs h-full bg-zinc-900 text-white p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-sm font-black uppercase">Filter & Sort</h3>
                <button onClick={() => setIsFilterDrawerOpen(false)}>✕</button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2.5 rounded-xl bg-zinc-800 text-xs font-bold">
                <option value="recommended">Recommended</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="w-full p-2.5 rounded-xl bg-zinc-800 text-xs font-bold">
                <option value="All">All Prices</option>
                <option value="under500">Under ₹500</option>
                <option value="500-1000">₹500 - ₹1000</option>
                <option value="1000-2000">₹1000 - ₹2000</option>
                <option value="above2000">Above ₹2000</option>
              </select>
            </div>
            <button onClick={() => setIsFilterDrawerOpen(false)} className="w-full py-3 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs uppercase">Apply</button>
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

      {/* SIZE GUIDE & SUPPORT MODALS (RESTORED) */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <h3 className="uppercase font-black">📏 Official Size Guide</h3>
              <button onClick={() => setShowSizeGuide(false)}>✕</button>
            </div>
            <p className="text-zinc-400">S: 38" Chest | M: 40" Chest | L: 42" Chest | XL: 44" Chest</p>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-3 text-xs font-bold text-white">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <h3 className="uppercase font-black">🎧 Customer Concierge</h3>
              <button onClick={() => setShowSupportModal(false)}>✕</button>
            </div>
            <a href="https://wa.me/918637589429" target="_blank" rel="noreferrer" className="block p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-center">WhatsApp: +91 8637589429</a>
          </div>
        </div>
      )}

      {/* ANIMATED POP-OUT & 3D ICON BOTTOM NAVIGATION DOCK */}
      {!isAdminUrl && (
        <nav className={`fixed bottom-2 inset-x-3 border p-2 z-40 flex justify-around items-center max-w-md md:max-w-lg mx-auto rounded-full shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-zinc-200'}`}>
          {[
            { id: "shop", label: "Home", icon: <Icon3D name="home" className="w-5 h-5" />, action: () => { setActiveTab("shop"); setActiveDepartment("All"); } },
            { id: "categories", label: "Categories", icon: <Icon3D name="category" className="w-5 h-5" />, action: () => openModalWithHistory('category') },
            { id: "saved", label: "Saved", icon: <Icon3D name="saved" className="w-5 h-5" />, action: () => setActiveTab("saved") },
            { id: "bag", label: "Bag", icon: <Icon3D name="bag" className="w-5 h-5" />, badge: cart.length, action: () => openModalWithHistory('cart') },
            { id: "account", label: "Account", icon: <Icon3D name="account" className="w-5 h-5" />, action: () => setActiveTab("account") }
          ].map(nav => {
            const isActive = (nav.id === "shop" && activeTab === "shop") || (nav.id === "saved" && activeTab === "saved") || (nav.id === "account" && activeTab === "account");
            return (
              <button
                key={nav.id}
                onClick={nav.action}
                className="relative flex flex-col items-center justify-center w-14 h-11 transition-all duration-300"
              >
                <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive 
                    ? '-translate-y-3 w-11 h-11 bg-zinc-950 border-2 border-amber-400 shadow-lg shadow-amber-500/40 scale-110' 
                    : 'w-8 h-8 hover:scale-110'
                }`}>
                  {nav.icon}
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
