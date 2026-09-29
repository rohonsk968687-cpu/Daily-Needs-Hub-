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

// Firebase Setup - Production Connected
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
const BRAND_TAGLINE = "Define Your Style.";
const MY_UPI_ID = "8637589429-3@ybl"; 
const ALLOWED_PINS = ["731204", "731240", "731215", "731224", "731236", "731214", "700001", "700019"];

// Authorized Admin Emails
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

// Expanded Fashion Colors
const FASHION_COLORS = [
  "Black", "White", "Navy Blue", "Olive Green", "Beige", "Maroon", "Charcoal Grey",
  "Pink", "Baby Pink", "Lavender", "Sky Blue", "Mint Green", "Peach", "Coral", "Wine", "Mustard Yellow", "Rust"
];

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];
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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [activeCollection, setActiveCollection] = useState("All");
  
  const [priceFilter, setPriceFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  // 2-Minute Verification Modal & States
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [verificationCountdown, setVerificationCountdown] = useState(120);
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedOrderReceipt, setCompletedOrderReceipt] = useState(null);

  const [darkMode, setDarkMode] = useState(false);
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
  const [adminSelectedDept, setAdminSelectedDept] = useState("Men");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminDeptFilter, setAdminDeptFilter] = useState("All");
  const [editingProduct, setEditingProduct] = useState(null);

  // Customer Profile & Logistics
  const [custInfo, setCustInfo] = useState({ 
    name: '', 
    gender: 'Male',
    phone: '',
    vill: '', 
    landmark: '', 
    city: 'Bolpur',
    pin: '' 
  });

  const [heroSlides] = useState([
    {
      id: 1,
      badge: "AUTUMN / WINTER '26",
      title: "OVERSIZED STREETWEAR EDIT",
      subtitle: "Heavyweight Cotton Tees, Cargo Pants & Denim",
      btnText: "SHOP MEN",
      dept: "Men",
      img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80"
    },
    {
      id: 2,
      badge: "FESTIVE COUTURE",
      title: "ELEGANT ETHNIC & DRESSES",
      subtitle: "Handcrafted Kurtas, Sarees & Flowy Silhouettes",
      btnText: "SHOP WOMEN",
      dept: "Women",
      img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
    },
    {
      id: 3,
      badge: "KICKS & DROPS",
      title: "CHUNKY SNEAKERS & LOAFERS",
      subtitle: "Comfort Meets Hype. Footwear Built For Daily Motion",
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

    const savedRV = localStorage.getItem("szx_recently_viewed");
    if (savedRV) {
      try { setRecentlyViewed(JSON.parse(savedRV)); } catch(e){}
    }

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

  // Wishlist & Cart Persistence
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const loadUserCloudData = async () => {
        const cartDoc = await getDoc(doc(db, "carts", user.uid));
        if (cartDoc.exists()) setCart(cartDoc.data().items || []);
        
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) setCustInfo(prev => ({ ...prev, ...profileDoc.data() }));

        const wishDoc = await getDoc(doc(db, "wishlists", user.uid));
        if (wishDoc.exists()) setWishlist(wishDoc.data().items || []);
      };
      loadUserCloudData();
    } else {
      const localCart = localStorage.getItem("szx_guest_cart");
      if (localCart) {
        try { setCart(JSON.parse(localCart)); } catch(e) {}
      }
      const localWish = localStorage.getItem("szx_guest_wishlist");
      if (localWish) {
        try { setWishlist(JSON.parse(localWish)); } catch(e) {}
      }
      const localProfile = localStorage.getItem("szx_saved_address");
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

  // Auth & General Listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
        const profileDoc = await getDoc(doc(db, "profiles", currentUser.uid));
        if (profileDoc.exists()) {
          setCustInfo(prev => ({ ...prev, ...profileDoc.data() }));
        } else if (currentUser.displayName) {
          setCustInfo(prev => ({ ...prev, name: currentUser.displayName }));
        }
      } else {
        setUser(null);
        if (!currentUser) {
          signInAnonymously(auth).catch(() => {});
        }
      }
    });

    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), 5000);
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

    return () => { 
      clearInterval(timer); 
      clearInterval(flashTimer);
      unsubProd(); 
      unsubNotif();
      unsubRev();
      unsubCoup();
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

  // Real-time listener for current pending payment order
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
        const profileDoc = await getDoc(doc(db, "profiles", result.user.uid));
        if (profileDoc.exists()) {
          setCustInfo(prev => ({ ...prev, ...profileDoc.data() }));
        } else {
          setCustInfo(prev => ({ ...prev, name: result.user.displayName || '' }));
        }
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
    localStorage.removeItem("szx_guest_cart");
    setCustInfo({ name: '', gender: 'Male', phone: '', vill: '', landmark: '', city: 'Bolpur', pin: '' });
    showToastMessage("Logged out successfully!");
  };

  const saveAddressToLocal = async () => {
    if (!custInfo.name || !custInfo.phone || !custInfo.vill || !custInfo.pin || !custInfo.city) {
      return showToastMessage("All address fields are required!", "error");
    }
    if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Delivery unavailable for PIN: ${custInfo.pin}`, "error");
    }
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("szx_saved_address", JSON.stringify(custInfo));
    showToastMessage("Shipping address verified & locked!");
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
    showToastMessage(`Added ${quantity} item(s) to bag! 🛍️`);
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
      localStorage.setItem("szx_recently_viewed", JSON.stringify(updatedRV));
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
      showToastMessage("Listening for styles or shoes... 🎙️");
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

  // Cancel Order & Restore Stock via Transaction
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

  // 7-Day Return / Exchange System
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
      await addDoc(collection(db, "products"), { 
        name: el.itemName.value, 
        brand: el.itemBrand.value || "STYLE ZONE - X",
        category: el.itemCategory.value,
        subCategory: el.itemSubCategory.value || "General",
        price: Number(el.itemPrice.value), 
        discount: Number(el.itemDiscount.value) || 0, 
        stock: Number(el.itemStock.value), 
        images: imgArray, 
        availableSizes: activeSizesArray,
        availableColors: activeColorsArray.length > 0 ? activeColorsArray : ["Black", "White"],
        fabric: el.itemFabric.value || "100% Premium Cotton",
        fit: el.itemFit.value || "Relaxed Fit",
        specifications: el.itemSpecs.value || "Crafted for durability and breathable comfort.",
        isFeatured: el.isFeatured.checked,
        isTrending: el.isTrending.checked,
        isNewArrival: el.isNewArrival.checked,
        createdAt: new Date().toISOString()
      });
      e.target.reset();
      showToastMessage("Product published into STYLE ZONE - X catalogue!");
    } catch (error) {
      showToastMessage("Database write error!", "error");
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

  // Admin Notification Creator
  const handleCreateNotification = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToastMessage("Admin privileges required!", "error");
    const title = e.target.notifTitle.value.trim();
    const desc = e.target.notifDesc.value.trim();
    if (!title || !desc) return;
    try {
      await addDoc(collection(db, "notifications"), {
        title,
        desc,
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString()
      });
      e.target.reset();
      showToastMessage("Broadcast alert dispatched to customers! 📢");
    } catch (err) {
      showToastMessage("Error sending alert", "error");
    }
  };

  // Admin Delete Order
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

  // Admin Save Full Product Edit
  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !editingProduct) return;
    const el = e.target.elements;
    try {
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
        specifications: el.editSpecs.value
      });
      setEditingProduct(null);
      showToastMessage("Product details updated successfully! ✨");
    } catch (err) {
      showToastMessage("Failed to update product", "error");
    }
  };

  const rawCartTotal = cart.reduce((a, c) => a + getDiscountedPrice(c.price, c.discount) * c.qty, 0);
  const couponDeduction = appliedCoupon ? appliedCoupon.discount : 0;
  const deliveryFee = (rawCartTotal - couponDeduction) >= 999 || rawCartTotal === 0 ? 0 : 60;
  const finalPayableTotal = Math.max(0, rawCartTotal - couponDeduction + deliveryFee);

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

  // Atomic Stock Reservation + No-UTR 2-Minute Flow
  const handleCheckoutInit = async () => {
    if (!user || user.isAnonymous) {
      return showToastMessage("Please login with Google to complete your order!", "error");
    }
    if(!custInfo.name || !custInfo.vill || !custInfo.pin || !custInfo.phone || !custInfo.city) {
      return showToastMessage("Shipping details incomplete! Fill all fields.", "error");
    }
    if(!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Delivery unavailable for PIN: ${custInfo.pin}`, "error");
    }

    const fullAddressString = `${custInfo.vill}, ${custInfo.city}, Landmark: ${custInfo.landmark || 'N/A'}, PIN: ${custInfo.pin}`;
    
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
          userEmail: user.email || "N/A",
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
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    const note = "Fashion Order";
    return `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(merchantName)}&am=${finalPayableTotal}&tn=${encodeURIComponent(note)}&cu=INR`;
  };

  const productReviews = selectedProduct ? reviews.filter(r => r.productId === selectedProduct.id) : [];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-stone-50/50 text-zinc-900'} pb-32 transition-all duration-300 font-sans selection:bg-zinc-900 selection:text-white`}>
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2.5 animate-bounce ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-zinc-900 text-white'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '⚡'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Main Responsive Container */}
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Navigation Bar */}
        <header className="p-3.5 bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200/80 w-full max-w-md md:max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); setActiveCollection("All"); }}>
            <div className="w-9 h-9 bg-zinc-950 text-white rounded-xl flex items-center justify-center font-black tracking-tighter text-lg shadow-sm">
              X
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase leading-none font-serif">
                {BRAND_NAME}
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 font-black mt-0.5">{BRAND_TAGLINE}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-black uppercase tracking-wider text-zinc-600">
            {FASHION_DEPARTMENTS.map(dept => (
              <span 
                key={dept} 
                onClick={() => { setActiveDepartment(dept); setActiveCollection("All"); setActiveTab("shop"); }}
                className={`cursor-pointer hover:text-black transition-colors ${activeDepartment === dept ? 'text-black border-b-2 border-black pb-1' : ''}`}
              >
                {dept}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!isAdmin && !isAdminUrl && (
              <>
                <button onClick={() => setIsNotifOpen(true)} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-full text-xs relative transition-all" title="Notifications">
                  🔔 {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-zinc-950 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{notifications.length}</span>}
                </button>
                <button onClick={() => setIsWishlistOpen(true)} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-full text-xs relative transition-all" title="Wishlist">
                  ❤️ {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-zinc-950 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{wishlist.length}</span>}
                </button>
              </>
            )}
            {!user && !isAdmin && !isAdminUrl && (
              <button onClick={handleGoogleLogin} className="bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow transition-all">
                Login
              </button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-full text-xs transition-all">{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {/* Fashion Search Bar */}
        {!isAdmin && !isAdminUrl && activeTab === "shop" && (
          <div className="sticky top-[68px] z-30 px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-zinc-100 w-full max-w-md md:max-w-7xl mx-auto my-1 relative">
            <div className="flex items-center gap-2">
              <input 
                type="text" placeholder="Search oversized t-shirts, sneakers, dresses, kurtis..." 
                value={search}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs md:text-sm font-semibold text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all"
                onChange={(e) => setSearch(e.target.value)}
              />
              <button 
                onClick={startVoiceSearch} 
                className={`p-3 rounded-2xl border text-sm transition-all shadow-sm ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'}`}
                title="Voice Search"
              >
                🎙️
              </button>
            </div>

            {showSuggestions && search.length > 0 && (
              <div className="absolute top-full left-4 right-4 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-40 max-h-52 overflow-y-auto mt-1 p-2 text-xs font-bold">
                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => { setSearch(p.name); setShowSuggestions(false); }}
                    className="p-2.5 hover:bg-zinc-50 rounded-xl cursor-pointer flex items-center justify-between"
                  >
                    <span>{p.name} ({p.category})</span>
                    <span className="text-[11px] font-black text-zinc-900">₹{getDiscountedPrice(p.price, p.discount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="w-full max-w-md md:max-w-7xl mx-auto">

          {/* ADMIN PORTAL GATEWAY */}
          {isAdminUrl ? (
            <div className="p-4">
              <div className="bg-white p-6 rounded-3xl shadow-xl text-zinc-900 border border-zinc-200 max-w-3xl mx-auto">
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
                    <p className="text-xs text-zinc-500 font-bold">Sign in with an Authorized Admin Google Account:</p>
                    <button 
                      onClick={handleGoogleLogin} 
                      className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg"
                    >
                      Sign In with Admin Google Account
                    </button>
                    {user && !isAdmin && (
                      <p className="text-xs font-bold text-rose-600 pt-2">
                        Account ({user.email}) is not authorized as Admin!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Top Switcher Tabs */}
                    <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-zinc-100 rounded-2xl border">
                      <button 
                        onClick={() => setAdminTab("dashboard")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'dashboard' ? 'bg-zinc-950 text-white shadow' : 'text-zinc-600 hover:text-black'}`}
                      >
                        📊 Home
                      </button>
                      <button 
                        onClick={() => setAdminTab("add-item")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'add-item' ? 'bg-zinc-950 text-white shadow' : 'text-zinc-600 hover:text-black'}`}
                      >
                        ➕ Add Stock
                      </button>
                      <button 
                        onClick={() => setAdminTab("manage-items")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'manage-items' ? 'bg-zinc-950 text-white shadow' : 'text-zinc-600 hover:text-black'}`}
                      >
                        📋 Stock Grid
                      </button>
                      <button 
                        onClick={() => setAdminTab("orders")} 
                        className={`py-2 rounded-xl text-xs font-black transition-all ${adminTab === 'orders' ? 'bg-zinc-950 text-white shadow' : 'text-zinc-600 hover:text-black'}`}
                      >
                        🚚 Orders ({orders.length})
                      </button>
                    </div>

                    {/* Dashboard KPI Analytics */}
                    {adminTab === "dashboard" && (
                      <div className="space-y-4">
                        <div className="bg-zinc-950 rounded-3xl p-5 text-white space-y-4 shadow-xl">
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

                        {/* Broadcast Alerts Control (Admin Notification Sender) */}
                        <div className="p-4 bg-zinc-50 rounded-2xl border space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider">📢 Broadcast Customer Alert / Notification</h4>
                          <form onSubmit={handleCreateNotification} className="space-y-2">
                            <input name="notifTitle" placeholder="Notification Title (e.g. Flash Drop Live!)" className="w-full p-2 border rounded-xl text-xs font-bold bg-white" required />
                            <textarea name="notifDesc" placeholder="Notification message text..." className="w-full p-2 border rounded-xl text-xs font-medium bg-white" rows="2" required />
                            <button type="submit" className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-black">Publish Alert</button>
                          </form>
                          
                          <div className="space-y-1.5 pt-2">
                            <p className="text-[10px] font-black uppercase text-zinc-400">Active Notifications ({notifications.length}):</p>
                            {notifications.map(n => (
                              <div key={n.id} className="flex justify-between items-center bg-white p-2 border rounded-xl text-xs">
                                <div>
                                  <p className="font-bold">{n.title}</p>
                                  <p className="text-[10px] text-zinc-500">{n.desc}</p>
                                </div>
                                <button onClick={() => deleteDoc(doc(db, "notifications", n.id))} className="text-rose-600 font-bold p-1">🗑️</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* LIVE PAYMENT ALERT RADAR */}
                        {orders.filter(o => o.paymentStatus?.includes("2 Min Timer") || o.status?.includes("Awaiting")).length > 0 && (
                          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2 animate-pulse">
                            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                              🔔 LIVE PAYMENT ALERT! Customer Online (Waiting 2 Min Verification)
                            </h4>
                            {orders.filter(o => o.paymentStatus?.includes("2 Min Timer") || o.status?.includes("Awaiting")).map(pendingOrd => (
                              <div key={pendingOrd.id} className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-black text-zinc-900">{pendingOrd.customerName} - ₹{pendingOrd.totalAmount}</p>
                                  <p className="text-[10px] text-zinc-500 font-bold">{pendingOrd.phone} | Ref: #{pendingOrd.orderIdRef}</p>
                                </div>
                                <button 
                                  onClick={async () => {
                                    await updateDoc(doc(db, "orders", pendingOrd.id), {
                                      paymentStatus: "Paid & Verified ✅",
                                      status: "Confirmed 📦"
                                    });
                                    showToastMessage("Order approved! Customer screen auto-confirmed.");
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow"
                                >
                                  ✓ Confirm Payment Received
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Standardized Coupon Deployment Section */}
                        <div className="p-4 bg-zinc-50 rounded-2xl border space-y-2">
                          <h4 className="text-xs font-black uppercase tracking-wider">🏷️ Deploy Standardized Coupon</h4>
                          <form onSubmit={handleCreateCoupon} className="grid grid-cols-3 gap-2">
                            <input name="coupCode" placeholder="Code (e.g. SZX50)" className="p-2 border rounded-xl text-xs uppercase font-bold" required />
                            <select name="coupType" className="p-2 border rounded-xl text-xs font-bold">
                              <option value="fixed">Fixed ₹ Off</option>
                              <option value="percentage">Percentage % Off</option>
                            </select>
                            <input name="coupValue" type="number" placeholder="Discount Value" className="p-2 border rounded-xl text-xs font-bold" required />
                            <input name="coupMin" type="number" placeholder="Min Order (₹)" className="col-span-2 p-2 border rounded-xl text-xs font-bold" required />
                            <button type="submit" className="py-2 bg-zinc-950 text-white rounded-xl text-xs font-black">Publish Coupon</button>
                          </form>
                        </div>

                        {/* Critical Low Stock Radar */}
                        <div className="p-4 bg-zinc-50 rounded-2xl border space-y-2">
                          <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">⚠️ Critical Inventory Alert (&lt; 5 Units)</h4>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {products.filter(p => p.stock < 5).map(p => (
                              <div key={p.id} className="flex justify-between items-center text-xs font-bold p-2 bg-white rounded-xl border">
                                <span>{p.name} ({p.category})</span>
                                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black">{p.stock} Left</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Product Form with Expanded Colors */}
                    {adminTab === "add-item" && (
                      <form onSubmit={addProduct} className="bg-white p-2 rounded-3xl grid gap-3 text-xs font-bold">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">📦 Add New Fashion / Footwear SKU</h3>
                          <button type="button" onClick={() => setAdminTab("manage-items")} className="text-[10px] text-zinc-500 underline font-black">View Stock Grid →</button>
                        </div>
                        
                        <input name="itemName" placeholder="Product Title (e.g. Vintage Wash Oversized Tee) *" className="border p-3 rounded-xl bg-zinc-50" required />
                        
                        <div className="grid grid-cols-3 gap-2">
                          <input name="itemBrand" placeholder="Brand Label" defaultValue="STYLE ZONE - X" className="border p-3 rounded-xl bg-zinc-50" />
                          <select 
                            name="itemCategory" 
                            value={adminSelectedDept}
                            onChange={(e) => setAdminSelectedDept(e.target.value)}
                            className="border p-3 rounded-xl bg-zinc-50 font-black"
                          >
                            {FASHION_DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select name="itemSubCategory" className="border p-3 rounded-xl bg-zinc-50 font-bold">
                            <option value="General">General</option>
                            {FASHION_COLLECTIONS_MAP[adminSelectedDept]?.map(sub => (
                              <option key={sub.name} value={sub.name}>{sub.icon} {sub.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <input name="itemPrice" type="number" placeholder="Selling Price (₹) *" className="border p-3 rounded-xl bg-zinc-50" required />
                          <input name="itemDiscount" type="number" placeholder="Discount %" className="border p-3 rounded-xl bg-zinc-50" />
                          <input name="itemStock" type="number" placeholder="Stock Qty *" className="border p-3 rounded-xl bg-zinc-50" required />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input name="itemFabric" placeholder="Fabric (e.g. 240 GSM Terry Cotton)" className="border p-3 rounded-xl bg-zinc-50" />
                          <input name="itemFit" placeholder="Fit (e.g. Boxy Oversized / Slim)" className="border p-3 rounded-xl bg-zinc-50" />
                        </div>

                        {/* Sizing Matrix */}
                        <div className="p-3 bg-zinc-50 rounded-2xl border space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-zinc-500">Available Sizes Matrix:</p>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {(adminSelectedDept === "Footwear" ? [...FOOTWEAR_SIZES_ADULT, ...FOOTWEAR_SIZES_KIDS] : APPAREL_SIZES).map(sz => (
                              <label key={sz} className="flex items-center gap-1 bg-white px-2 py-1 rounded border cursor-pointer">
                                <input type="checkbox" name="adminSizes" value={sz} /> {sz}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Expanded Color Palette */}
                        <div className="p-3 bg-zinc-50 rounded-2xl border space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-zinc-500">Color Palette (Pink, Baby Pink, Lavender, etc.):</p>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {FASHION_COLORS.map(col => (
                              <label key={col} className="flex items-center gap-1 bg-white px-2 py-1 rounded border cursor-pointer">
                                <input type="checkbox" name="adminColors" value={col} /> {col}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-zinc-50 rounded-2xl border space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-zinc-500">Photography URLs (Up to 5):</p>
                          <input name="itemImg1" placeholder="Front View (Main Thumbnail) *" className="w-full border p-2 rounded-lg bg-white mb-1" required />
                          <input name="itemImg2" placeholder="Back / Side View" className="w-full border p-2 rounded-lg bg-white mb-1" />
                          <input name="itemImg3" placeholder="Model Full Body / Styling" className="w-full border p-2 rounded-lg bg-white mb-1" />
                          <input name="itemImg4" placeholder="Fabric Detail / Close-up" className="w-full border p-2 rounded-lg bg-white mb-1" />
                          <input name="itemImg5" placeholder="Sole / Inside View" className="w-full border p-2 rounded-lg bg-white" />
                        </div>

                        <textarea name="itemSpecs" placeholder="Complete Style Description & Wash Care..." className="border p-3 rounded-xl bg-zinc-50" rows="2" />

                        <div className="flex gap-4 p-2 bg-zinc-50 rounded-xl">
                          <label className="flex items-center gap-1"><input type="checkbox" name="isTrending" /> 🔥 Trending</label>
                          <label className="flex items-center gap-1"><input type="checkbox" name="isNewArrival" /> ✨ New Arrival</label>
                          <label className="flex items-center gap-1"><input type="checkbox" name="isFeatured" /> 🌟 Hero Featured</label>
                        </div>

                        <button type="submit" className="bg-zinc-950 hover:bg-zinc-800 text-white p-3.5 rounded-2xl font-black uppercase tracking-wider transition-all">PUBLISH TO STORE</button>
                      </form>
                    )}

                    {/* Stock Grid Manager with Edit Modal Trigger */}
                    {adminTab === "manage-items" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Search SKU..." 
                            value={adminSearchQuery} 
                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                            className="flex-1 p-2.5 border rounded-xl bg-zinc-50 text-xs font-bold" 
                          />
                          <select 
                            value={adminDeptFilter} 
                            onChange={(e) => setAdminDeptFilter(e.target.value)}
                            className="p-2.5 border rounded-xl bg-zinc-50 text-xs font-black"
                          >
                            <option value="All">All Departments</option>
                            {FASHION_DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                          {adminFilteredProducts.map(p => (
                            <div key={p.id} className="p-3 bg-zinc-50 border rounded-2xl flex justify-between items-center text-xs font-bold">
                              <div>
                                <p className="font-black text-sm">{p.name}</p>
                                <p className="text-[10px] text-zinc-400">{p.category} → {p.subCategory} | Stock: <span className="text-zinc-950 font-black">{p.stock}</span> | ₹{p.price}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingProduct(p)} className="p-2 bg-blue-50 text-blue-600 rounded-xl font-bold">✏️ Edit</button>
                                <button onClick={async () => { if(window.confirm("Delete item permanently?")) await deleteDoc(doc(db, "products", p.id)); }} className="p-2 bg-rose-50 text-rose-600 rounded-xl font-bold">🗑️ Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Orders Room with Instant Live Approval & Order Deletion */}
                    {adminTab === "orders" && (
                      <div className="space-y-3 max-h-[65vh] overflow-y-auto">
                        {orders.map(ord => (
                          <div key={ord.id} className="p-4 bg-zinc-50 border rounded-2xl space-y-2 text-xs">
                            <div className="flex justify-between items-center font-black border-b pb-1">
                              <span>Ref: #{ord.orderIdRef || ord.id.slice(0,6)}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black">₹{ord.totalAmount}</span>
                                <button onClick={() => handleDeleteOrder(ord.id)} className="p-1 text-rose-600 hover:bg-rose-100 rounded" title="Delete Order">🗑️</button>
                              </div>
                            </div>
                            <p><b>Buyer:</b> {ord.customerName} ({ord.phone})</p>
                            <p className="text-zinc-500"><b>Address:</b> {ord.address}</p>
                            <p className="text-zinc-700 font-bold"><b>Payment:</b> {ord.paymentMode} - <span className="text-emerald-700">{ord.paymentStatus}</span></p>
                            
                            <div className="bg-white p-2 rounded-xl border space-y-1">
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
                                className="p-1.5 border rounded-xl bg-white font-black text-[10px]"
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
                                  ✓ Approve UPI Payment
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
            /* CUSTOMER FACING STOREFRONT INTERFACES */
            <>
              {activeTab === "shop" && (
                <>
                  {/* Hero Carousel Section */}
                  <div className="px-4 mb-6">
                    <div className="relative h-64 md:h-96 w-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-200">
                      {heroSlides.map((s, idx) => (
                        <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                          <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-6 md:p-10 flex flex-col justify-end text-white">
                            <span className="text-[10px] uppercase tracking-widest font-black bg-white/20 px-3 py-1 rounded-full backdrop-blur-md w-fit mb-2">{s.badge}</span>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase leading-tight font-serif">{s.title}</h2>
                            <p className="text-xs md:text-sm text-zinc-300 font-medium mb-4">{s.subtitle}</p>
                            <button 
                              onClick={() => { setActiveDepartment(s.dept); setActiveCollection("All"); }}
                              className="w-fit bg-white text-zinc-950 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-lg"
                            >
                              {s.btnText} →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flash Sale Countdown Strip */}
                  <div className="px-4 mb-6">
                    <div className="bg-zinc-950 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">LIMITED FLASH DROP</h4>
                          <p className="text-[10px] text-zinc-400">Extra 20% OFF on Orders ₹1499+ using code STYLE20</p>
                        </div>
                      </div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-mono font-black text-xs text-yellow-400">
                        {formatTimer(flashTime)}
                      </div>
                    </div>
                  </div>

                  {/* Shop by Department Circles */}
                  <div className="px-4 mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">SHOP BY DEPARTMENT</h3>
                    <div className="grid grid-cols-4 gap-2.5 text-center">
                      {[
                        { title: "Men", img: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=300&q=80" },
                        { title: "Women", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80" },
                        { title: "Kids", img: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=300&q=80" },
                        { title: "Footwear", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&q=80" }
                      ].map(dept => (
                        <div 
                          key={dept.title} 
                          onClick={() => { setActiveDepartment(dept.title); setActiveCollection("All"); }}
                          className={`cursor-pointer group flex flex-col items-center p-2 rounded-2xl border transition-all ${activeDepartment === dept.title ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white text-zinc-800 border-zinc-200'}`}
                        >
                          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden mb-1.5 border">
                            <img src={dept.img} alt={dept.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider">{dept.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collection Sub-Category Strip */}
                  {activeDepartment !== "All" && FASHION_COLLECTIONS_MAP[activeDepartment] && (
                    <div className="px-4 mb-6">
                      <div className="p-3 bg-zinc-100 rounded-2xl flex gap-2 overflow-x-auto no-scrollbar">
                        <button 
                          onClick={() => setActiveCollection("All")}
                          className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeCollection === "All" ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-800'}`}
                        >
                          All {activeDepartment}
                        </button>
                        {FASHION_COLLECTIONS_MAP[activeDepartment].map(coll => (
                          <button 
                            key={coll.name} 
                            onClick={() => setActiveCollection(coll.name)}
                            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${activeCollection === coll.name ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-800'}`}
                          >
                            <span>{coll.icon}</span>
                            <span>{coll.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advanced Multi-Filters & Sort Bar */}
                  <div className="px-4 mb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Price:</span>
                        <select 
                          value={priceFilter} 
                          onChange={(e) => setPriceFilter(e.target.value)}
                          className="p-1.5 border rounded-lg bg-zinc-50 text-[11px] font-black"
                        >
                          <option value="All">All</option>
                          <option value="under500">&lt; ₹500</option>
                          <option value="500-1000">₹500 - ₹1K</option>
                          <option value="1000-2000">₹1K - ₹2K</option>
                          <option value="above2000">₹2K+</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Size:</span>
                        <select 
                          value={sizeFilter} 
                          onChange={(e) => setSizeFilter(e.target.value)}
                          className="p-1.5 border rounded-lg bg-zinc-50 text-[11px] font-black"
                        >
                          <option value="All">All</option>
                          {APPAREL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          {FOOTWEAR_SIZES_ADULT.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Sort:</span>
                        <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value)}
                          className="p-1.5 border rounded-lg bg-zinc-50 text-[11px] font-black"
                        >
                          <option value="recommended">Featured</option>
                          <option value="newest">Newest</option>
                          <option value="priceLow">Price: Low</option>
                          <option value="priceHigh">Price: High</option>
                          <option value="discount">Discount</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Product Grid - Full Fit Images No Cut */}
                  {isProductsLoading ? (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1,2,3,4].map(idx => (
                        <div key={idx} className="bg-white rounded-3xl p-3 border animate-pulse space-y-3">
                          <div className="h-48 bg-zinc-200 rounded-2xl w-full"></div>
                          <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                          <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed p-6 space-y-2">
                          <span className="text-4xl block">🔍</span>
                          <h4 className="font-black text-sm">No Fashion Pieces Found</h4>
                          <p className="text-xs text-zinc-400 font-bold">Try adjusting filters.</p>
                        </div>
                      ) : (
                        filtered.map(p => {
                          const finalPrice = getDiscountedPrice(p.price, p.discount);
                          const isWish = wishlist.find(x => x.id === p.id);
                          const mainImg = p.images?.[0] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80";
                          return (
                            <div key={p.id} className="bg-white rounded-3xl p-3 border border-zinc-200/80 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
                              <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden bg-stone-100/70 mb-2 cursor-pointer flex items-center justify-center p-1.5" onClick={() => addToRecentlyViewed(p)}>
                                <img src={mainImg} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }} 
                                  className="absolute top-2.5 right-2.5 p-2 bg-white/90 backdrop-blur-sm rounded-full text-xs shadow-md"
                                >
                                  {isWish ? "❤️" : "🤍"}
                                </button>
                                {p.discount > 0 && (
                                  <span className="absolute bottom-2.5 left-2.5 bg-zinc-950 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                    {p.discount}% OFF
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{p.brand || "STYLE ZONE - X"}</p>
                                <h4 onClick={() => addToRecentlyViewed(p)} className="text-xs font-black text-zinc-900 truncate cursor-pointer hover:underline">{p.name}</h4>
                                
                                <div className="flex items-center gap-2 pt-0.5">
                                  <span className="text-sm font-black text-zinc-950">₹{finalPrice}</span>
                                  {p.discount > 0 && <span className="text-[10px] text-zinc-400 line-through font-bold">₹{p.price}</span>}
                                </div>
                              </div>

                              <div className="mt-3 flex gap-2">
                                <button 
                                  onClick={() => addToRecentlyViewed(p)} 
                                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black text-[10px] uppercase rounded-xl transition-all"
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

                  {/* Recently Viewed Strip */}
                  {recentlyViewed.length > 0 && (
                    <div className="mx-4 my-8 p-4 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">👁️ RECENTLY VIEWED STYLES</h4>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar">
                        {recentlyViewed.map(rv => (
                          <div key={rv.id} onClick={() => addToRecentlyViewed(rv)} className="w-24 shrink-0 cursor-pointer text-center">
                            <div className="h-28 w-full rounded-2xl overflow-hidden border mb-1 bg-stone-100/70 p-1 flex items-center justify-center">
                              <img src={rv.images?.[0]} alt={rv.name} className="w-full h-full object-contain" />
                            </div>
                            <p className="text-[10px] font-black truncate">{rv.name}</p>
                            <p className="text-[10px] font-extrabold text-zinc-900">₹{getDiscountedPrice(rv.price, rv.discount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Storefront Bottom About & Info Section */}
                  <footer className="mt-12 border-t border-zinc-200/80 bg-white p-6 md:p-10 space-y-6 text-zinc-800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-zinc-950 text-white rounded flex items-center justify-center font-black text-xs">X</div>
                          <span className="font-serif font-black text-sm tracking-widest">{BRAND_NAME}</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Your premium hub for oversized streetwear, high-grade knitwear, ethnic silhouettes, and sneakers.
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <h5 className="font-black uppercase tracking-wider text-zinc-400 text-[10px]">Shop Departments</h5>
                        <p onClick={() => { setActiveDepartment("Men"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="cursor-pointer hover:underline text-zinc-600">Men's Streetwear</p>
                        <p onClick={() => { setActiveDepartment("Women"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="cursor-pointer hover:underline text-zinc-600">Women's Couture</p>
                        <p onClick={() => { setActiveDepartment("Footwear"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="cursor-pointer hover:underline text-zinc-600">Sneakers & Kicks</p>
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <h5 className="font-black uppercase tracking-wider text-zinc-400 text-[10px]">Assurance & Policy</h5>
                        <p className="text-zinc-600">✓ 7-Day Hassle Free Returns</p>
                        <p className="text-zinc-600">✓ 100% Genuine Fabrics</p>
                        <p className="text-zinc-600">✓ Express Delivery in PIN: 731204 & Region</p>
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <h5 className="font-black uppercase tracking-wider text-zinc-400 text-[10px]">Support & Contact</h5>
                        <p className="text-zinc-600">WhatsApp: +91 8637589429</p>
                        <p className="text-zinc-600">Email: stylezone.x0@gmail.com</p>
                        <p className="text-zinc-600">Bolpur, West Bengal - 731204</p>
                      </div>
                    </div>
                    <div className="border-t border-zinc-100 pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-zinc-400 font-bold gap-2">
                      <span>© {new Date().getFullYear()} STYLE ZONE - X. All rights reserved.</span>
                      <span>Designed & Developed for Speed & Style.</span>
                    </div>
                  </footer>
                </>
              )}

              {/* Flipkart-Style Account Section */}
              {activeTab === "account" && (
                <div className="p-3 md:p-6 space-y-4 max-w-xl mx-auto pb-10">
                  {/* Top Profile Card */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                          {(custInfo.name || user?.displayName || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-zinc-900 leading-tight">
                            Hey, {custInfo.name || user?.displayName || "Style Zone Insider"}
                          </h3>
                          <p className="text-xs text-zinc-400 font-bold mt-0.5">{user?.email || custInfo.phone || "Guest Shopper"}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowSupportModal(true)} className="p-2 border border-zinc-200 rounded-xl text-xs font-black flex items-center gap-1">
                        🎧 Help
                      </button>
                    </div>

                    {/* Orders & Wishlist Dual Action Pills */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <div 
                        onClick={() => {
                          const elem = document.getElementById("my-orders-scroll-target");
                          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-3 border border-zinc-200 rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-xl">📦</span>
                        <div>
                          <p className="font-black text-xs">Orders</p>
                          <p className="text-[10px] text-zinc-400 font-bold">{orders.length} Placed</p>
                        </div>
                      </div>
                      <div 
                        onClick={() => setIsWishlistOpen(true)}
                        className="p-3 border border-zinc-200 rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-xl text-blue-600">💙</span>
                        <div>
                          <p className="font-black text-xs">Wishlist</p>
                          <p className="text-[10px] text-zinc-400 font-bold">{wishlist.length} Items</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile & Delivery Address Settings */}
                  <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-4 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        📍 Saved Delivery Address
                      </span>
                      <button onClick={saveAddressToLocal} className="px-3 py-1 bg-zinc-950 text-white rounded-xl text-[10px] font-black">
                        Save
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input placeholder="Full Name *" value={custInfo.name} onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} className="col-span-2 p-2.5 bg-zinc-50 border rounded-xl font-bold" />
                      <input placeholder="10-Digit Mobile *" value={custInfo.phone} onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})} className="col-span-2 p-2.5 bg-zinc-50 border rounded-xl font-bold" />
                      <input placeholder="Village / Street / House *" value={custInfo.vill} onChange={(e) => setCustInfo({...custInfo, vill: e.target.value})} className="col-span-2 p-2.5 bg-zinc-50 border rounded-xl font-bold" />
                      <input placeholder="City" value={custInfo.city} onChange={(e) => setCustInfo({...custInfo, city: e.target.value})} className="p-2.5 bg-zinc-50 border rounded-xl font-bold" />
                      <input placeholder="Pincode *" value={custInfo.pin} onChange={(e) => setCustInfo({...custInfo, pin: e.target.value})} className="p-2.5 bg-zinc-50 border rounded-xl font-bold" />
                    </div>
                  </div>

                  {/* Flipkart Styled Account Menu Lists */}
                  <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm divide-y text-xs font-bold text-zinc-700">
                    <div onClick={() => setIsNotifOpen(true)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50">
                      <span className="flex items-center gap-2.5">🔔 Notification Settings</span>
                      <span>›</span>
                    </div>
                    <div onClick={() => setShowSizeGuide(true)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50">
                      <span className="flex items-center gap-2.5">📏 Official Size Guide</span>
                      <span>›</span>
                    </div>
                    <div onClick={() => setShowSupportModal(true)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50">
                      <span className="flex items-center gap-2.5">🎧 Help Center & Contact</span>
                      <span>›</span>
                    </div>
                  </div>

                  {/* Customer's OWN Orders History */}
                  <div id="my-orders-scroll-target" className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">📦 MY WARDROBE ORDERS ({orders.length})</h4>
                    {orders.length === 0 ? (
                      <div className="text-center py-8 bg-white border border-dashed rounded-2xl space-y-1">
                        <span className="text-2xl">🛍️</span>
                        <p className="text-xs text-zinc-400 font-bold">No orders placed yet.</p>
                      </div>
                    ) : (
                      orders.map(o => (
                        <div key={o.id} className="p-4 bg-white border rounded-2xl space-y-2 text-xs font-bold shadow-sm">
                          <div className="flex justify-between items-center border-b pb-1 font-black">
                            <span>Ref: #{o.orderIdRef || o.id.slice(0,6)}</span>
                            <span className="bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded text-[10px]">{o.status}</span>
                          </div>
                          {o.items?.map((it, idx) => (
                            <p key={idx} className="text-zinc-600">• {it.name} [{it.size}, {it.color}] x{it.qty}</p>
                          ))}
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-black">Total: ₹{o.totalAmount}</span>
                            <div className="flex gap-2">
                              {o.status.includes("Confirmed") && (
                                <button onClick={() => handleCancelOrder(o)} className="text-rose-600 underline text-[10px]">Cancel & Restore</button>
                              )}
                              {o.status.includes("Delivered") && (
                                <button onClick={() => handleReturnOrder(o)} className="text-blue-600 underline text-[10px]">7-Day Return</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {user ? (
                    <button onClick={handleLogout} className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase mt-4">Logout Account</button>
                  ) : (
                    <button onClick={handleGoogleLogin} className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase mt-4">Sign in with Google</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* FULL SCREEN PRODUCT DETAILS MODAL - FULL FIT (NO CUTS) */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto text-zinc-900 flex flex-col justify-between animate-fadeIn">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b px-4 py-3 flex items-center justify-between shadow-sm">
            <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-zinc-100 px-3 py-1.5 rounded-full">
              ← Close
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleWishlist(selectedProduct)} className="p-2 bg-zinc-100 rounded-full text-sm">
                {wishlist.find(x => x.id === selectedProduct.id) ? "❤️" : "🤍"}
              </button>
              <button onClick={() => handleShareProduct(selectedProduct, 'copy')} className="p-2 bg-zinc-100 rounded-full text-sm">
                🔗
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full p-4 space-y-6 pb-28">
            <div className="relative h-96 md:h-[480px] rounded-3xl overflow-hidden bg-stone-100/80 border flex items-center justify-center p-3">
              <img 
                src={(selectedProduct.images || [selectedProduct.img])[currentProductSlide]} 
                alt={selectedProduct.name} 
                className="w-full h-full object-contain" 
              />
              {(selectedProduct.images || []).length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {currentProductSlide + 1} / {selectedProduct.images.length}
                </div>
              )}
            </div>

            {(selectedProduct.images || []).length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {selectedProduct.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setCurrentProductSlide(idx)}
                    className={`w-16 h-20 rounded-xl overflow-hidden border-2 cursor-pointer bg-stone-100/70 p-1 flex items-center justify-center transition-all ${currentProductSlide === idx ? 'border-zinc-950 scale-105 shadow-sm' : 'border-zinc-200 opacity-60'}`}
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
                    <span className="text-xs font-black text-rose-600">{selectedProduct.discount}% OFF</span>
                  </>
                )}
              </div>
            </div>

            {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider">SELECT SIZE</span>
                  <span onClick={() => setShowSizeGuide(true)} className="text-[10px] font-black uppercase text-zinc-500 underline cursor-pointer">Size Guide 📏</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableSizes.map(sz => (
                    <button 
                      key={sz} 
                      onClick={() => setSelectedSizes({ ...selectedSizes, [selectedProduct.id]: sz })}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${selectedSizes[selectedProduct.id] === sz ? 'bg-zinc-950 text-white border-zinc-950 scale-105 shadow-md' : 'bg-white text-zinc-800 border-zinc-200'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct.availableColors && selectedProduct.availableColors.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <span className="text-xs font-black uppercase tracking-wider">SELECT COLOR</span>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableColors.map(col => (
                    <button 
                      key={col} 
                      onClick={() => setSelectedColors({ ...selectedColors, [selectedProduct.id]: col })}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${selectedColors[selectedProduct.id] === col ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white text-zinc-700 border-zinc-200'}`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-zinc-50 rounded-2xl border space-y-2">
              <span className="text-xs font-black uppercase tracking-wider">🚚 Check Delivery Speed</span>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Enter 6-digit Pincode" 
                  value={pinCheckInput} 
                  onChange={(e) => handlePinCheck(e.target.value)} 
                  className="flex-1 p-2.5 bg-white border rounded-xl text-xs font-bold" 
                />
                <button onClick={() => handlePinCheck(pinCheckInput)} className="px-4 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-black">Check</button>
              </div>
              {pinCheckMsg && <p className="text-[10px] font-black">{pinCheckMsg.text}</p>}
            </div>

            <div className="border-t pt-4 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider">FABRIC & CRAFT SPECIFICATIONS</span>
              <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-4 rounded-2xl border">
                <div><span className="text-zinc-400">Fabric:</span> <b>{selectedProduct.fabric || "Cotton Knit"}</b></div>
                <div><span className="text-zinc-400">Fit:</span> <b>{selectedProduct.fit || "Relaxed Fit"}</b></div>
                <div><span className="text-zinc-400">Occasion:</span> <b>Casual / Streetwear</b></div>
                <div><span className="text-zinc-400">Policy:</span> <b>7 Days Exchange</b></div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed pt-2">{selectedProduct.specifications}</p>
            </div>

            {/* Verified Reviews Stream */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider">REVIEWS ({productReviews.length})</span>
                <span className="text-xs font-black text-amber-500">⭐ 4.5 / 5.0</span>
              </div>

              <form onSubmit={handleSubmitReview} className="p-3 bg-zinc-50 rounded-2xl border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-zinc-500">Leave Rating:</span>
                  <select 
                    value={reviewRating} 
                    onChange={(e) => setReviewRating(e.target.value)}
                    className="p-1 border rounded bg-white text-xs font-black"
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
                  className="w-full p-2.5 bg-white border rounded-xl text-xs" 
                  rows="2"
                />
                <button type="submit" className="w-full py-2 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                  Submit Review
                </button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {productReviews.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 font-bold text-center py-2">No reviews yet for this design.</p>
                ) : (
                  productReviews.map(rev => (
                    <div key={rev.id} className="p-2.5 bg-zinc-50 border rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-zinc-900">
                          {rev.userName} 
                          {rev.isVerifiedBuyer && <span className="ml-1 text-emerald-600 text-[10px] font-bold">✓ Verified Buyer</span>}
                        </span>
                        <span className="text-[10px] text-amber-500">{"★".repeat(rev.rating)}</span>
                      </div>
                      <p className="text-zinc-600 text-[11px]">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t p-3.5 z-50 flex gap-3 max-w-2xl mx-auto shadow-2xl">
            <button 
              onClick={() => addToCart(selectedProduct, productPageQty)}
              className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider"
            >
              Add to Bag
            </button>
            <button 
              onClick={() => {
                addToCart(selectedProduct, productPageQty);
                setSelectedProduct(null);
                setIsCartOpen(true);
              }}
              className="flex-1 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-xl"
            >
              Buy Now →
            </button>
          </div>
        </div>
      )}

      {/* Bag / Cart Drawer System */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-3xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-black uppercase tracking-widest">SHOPPING BAG ({cart.length})</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-xs font-black p-1 bg-zinc-100 rounded-lg">✕</button>
              </div>

              <div className="space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <span className="text-4xl block">🛍️</span>
                    <p className="text-xs text-zinc-400 font-black">Your Style Bag is Empty.</p>
                  </div>
                ) : (
                  cart.map(it => (
                    <div key={it.itemKey} className="flex justify-between items-center p-2.5 bg-zinc-50 border rounded-2xl text-xs">
                      <div>
                        <h4 className="font-black truncate max-w-[180px]">{it.name}</h4>
                        <p className="text-[10px] text-zinc-400">Size: {it.selectedSize} | Color: {it.selectedColor}</p>
                        <p className="font-black mt-1">₹{getDiscountedPrice(it.price, it.discount) * it.qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQty(it.itemKey, -1)} className="w-6 h-6 bg-white border rounded font-black">-</button>
                        <span className="font-black">{it.qty}</span>
                        <button onClick={() => updateCartQty(it.itemKey, 1)} className="w-6 h-6 bg-white border rounded font-black">+</button>
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
                  className="flex-1 p-2 bg-zinc-50 border rounded-xl text-xs font-black uppercase"
                />
                <button type="submit" className="px-3.5 py-2 bg-zinc-950 text-white rounded-xl text-xs font-black">Apply</button>
              </form>

              {/* Bill Details */}
              <div className="p-3 bg-zinc-50 rounded-2xl border space-y-1.5 text-xs font-bold">
                <div className="flex justify-between text-zinc-500"><span>Bag Total</span><span>₹{rawCartTotal}</span></div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600"><span>Coupon ({appliedCoupon.code})</span><span>-₹{couponDeduction}</span></div>
                )}
                <div className="flex justify-between text-zinc-500"><span>Shipping</span><span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
                <div className="flex justify-between border-t pt-1 font-black text-sm"><span>Payable Amount</span><span>₹{finalPayableTotal}</span></div>
              </div>
            </div>

            {/* Payment & Order Placement Flow */}
            <div className="pt-3 border-t space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs font-black">
                <button onClick={() => setPaymentType("UPI")} className={`py-2 rounded-xl border ${paymentType === "UPI" ? 'bg-zinc-950 text-white' : 'bg-zinc-100'}`}>Prepaid UPI</button>
                <button onClick={() => setPaymentType("COD")} className={`py-2 rounded-xl border ${paymentType === "COD" ? 'bg-zinc-950 text-white' : 'bg-zinc-100'}`}>Cash on Delivery</button>
              </div>

              {paymentType === "UPI" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-center">
                  <p className="text-xs font-black text-emerald-900">⚡ Instant 2-Minute UPI Verification</p>
                  <p className="text-[10px] text-emerald-700 font-bold leading-tight">
                    Confirm karte hi UPI app khulega. Payment hote hi 2 min me admin verify karke instant confirm karega!
                  </p>
                </div>
              )}

              <button 
                onClick={handleCheckoutInit}
                className="w-full py-3.5 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
              >
                Confirm & Pay (₹{finalPayableTotal}) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Drawer with Full Empty State Handling */}
      {isWishlistOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-3xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-black uppercase tracking-widest">SAVED TO WISHLIST ({wishlist.length})</h3>
                <button onClick={() => setIsWishlistOpen(false)} className="text-xs font-black p-1 bg-zinc-100 rounded-lg">✕</button>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <span className="text-5xl block">🤍</span>
                  <h4 className="font-black text-sm text-zinc-900">Your Wishlist is Empty!</h4>
                  <p className="text-xs text-zinc-400 font-bold max-w-xs mx-auto">
                    Explore our freshest drops and tap the heart icon on any style to save it here.
                  </p>
                  <button 
                    onClick={() => { setIsWishlistOpen(false); setActiveTab("shop"); }}
                    className="px-6 py-2.5 bg-zinc-950 text-white rounded-full text-xs font-black uppercase tracking-wider shadow"
                  >
                    Start Exploring Now →
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
                  {wishlist.map(p => (
                    <div key={p.id} className="flex gap-3 p-3 bg-zinc-50 border rounded-2xl items-center justify-between">
                      <div className="w-16 h-16 rounded-xl bg-white border p-1 flex items-center justify-center shrink-0">
                        <img src={p.images?.[0] || p.img} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-xs truncate">{p.name}</h4>
                        <p className="text-xs font-black text-zinc-900 mt-0.5">₹{getDiscountedPrice(p.price, p.discount)}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button 
                          onClick={() => {
                            addToRecentlyViewed(p);
                            setIsWishlistOpen(false);
                          }}
                          className="px-2.5 py-1 bg-zinc-950 text-white rounded-lg text-[10px] font-black"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => toggleWishlist(p)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Notification Drawer */}
      {isNotifOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-3xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-black uppercase tracking-widest">NOTIFICATIONS ({notifications.length})</h3>
                <button onClick={() => setIsNotifOpen(false)} className="text-xs font-black p-1 bg-zinc-100 rounded-lg">✕</button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-20 space-y-2">
                  <span className="text-4xl block">🔔</span>
                  <p className="text-xs text-zinc-400 font-bold">No new notifications right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3.5 bg-zinc-50 border rounded-2xl space-y-1">
                      <div className="flex justify-between items-center font-black text-xs text-zinc-900">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">{n.date || "Today"}</span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed font-medium">{n.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 text-xs font-bold text-zinc-900 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black uppercase text-sm">Edit Product SKU: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 bg-zinc-100 rounded">✕</button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="grid gap-3">
              <input name="editName" defaultValue={editingProduct.name} placeholder="Title" className="border p-2.5 rounded-xl bg-zinc-50" required />
              
              <div className="grid grid-cols-2 gap-2">
                <input name="editBrand" defaultValue={editingProduct.brand || "STYLE ZONE - X"} placeholder="Brand" className="border p-2.5 rounded-xl bg-zinc-50" />
                <select name="editCategory" defaultValue={editingProduct.category} className="border p-2.5 rounded-xl bg-zinc-50 font-black">
                  {FASHION_DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <input name="editSubCategory" defaultValue={editingProduct.subCategory || "General"} placeholder="Sub Category" className="border p-2.5 rounded-xl bg-zinc-50" />

              <div className="grid grid-cols-3 gap-2">
                <input name="editPrice" type="number" defaultValue={editingProduct.price} placeholder="Price" className="border p-2.5 rounded-xl bg-zinc-50" required />
                <input name="editDiscount" type="number" defaultValue={editingProduct.discount || 0} placeholder="Discount %" className="border p-2.5 rounded-xl bg-zinc-50" />
                <input name="editStock" type="number" defaultValue={editingProduct.stock} placeholder="Stock" className="border p-2.5 rounded-xl bg-zinc-50" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input name="editFabric" defaultValue={editingProduct.fabric || ""} placeholder="Fabric" className="border p-2.5 rounded-xl bg-zinc-50" />
                <input name="editFit" defaultValue={editingProduct.fit || ""} placeholder="Fit" className="border p-2.5 rounded-xl bg-zinc-50" />
              </div>

              <textarea name="editSpecs" defaultValue={editingProduct.specifications || ""} placeholder="Specifications" rows="3" className="border p-2.5 rounded-xl bg-zinc-50" />

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 bg-zinc-950 text-white rounded-xl font-black uppercase">Save Changes</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-3 bg-zinc-100 rounded-xl font-black uppercase">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-MINUTE CUSTOMER VERIFICATION POPUP (NO UTR MANUAL INPUT) */}
      {activePaymentOrder && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-zinc-900 shadow-2xl">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl mx-auto animate-pulse">
              ⏳
            </div>
            
            <h3 className="text-lg font-black font-serif">Verifying Your Payment</h3>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed">
              We have opened your UPI app. Please complete payment of <b>₹{activePaymentOrder.totalAmount}</b>.
            </p>

            <div className="p-3 bg-zinc-100 rounded-2xl font-mono text-xl font-black text-amber-600 tracking-wider">
              {formatTimer(verificationCountdown)}
            </div>

            <p className="text-[11px] text-zinc-400 font-semibold">
              Admin is actively monitoring incoming UPI transfer. Your screen will auto-refresh as soon as it is confirmed.
            </p>

            <div className="space-y-2 pt-2 border-t">
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

      {/* Invoice Modal for Confirmed Orders */}
      {showInvoice && completedOrderReceipt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs font-bold text-zinc-900">
            <div className="text-center border-b pb-2">
              <h3 className="font-serif font-black text-lg">{BRAND_NAME}</h3>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{BRAND_TAGLINE}</p>
            </div>
            <p className="text-emerald-700 font-black text-center text-sm">🎉 Order Confirmed & Ready For Dispatch!</p>
            <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
              <p>Order Ref: #{completedOrderReceipt.orderIdRef}</p>
              <p>Total Paid: ₹{completedOrderReceipt.totalAmount}</p>
              <p>Mode: {completedOrderReceipt.paymentMode}</p>
            </div>
            <button onClick={sendWhatsAppNotification} className="w-full py-3 bg-zinc-950 text-white rounded-xl font-black uppercase">
              Send Invoice to WhatsApp 💬
            </button>
          </div>
        </div>
      )}

      {/* Floating Customer Support Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <button 
          onClick={() => setShowSupportModal(true)} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs uppercase"
        >
          <span>💬</span>
          <span className="hidden md:inline">Support</span>
        </button>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold text-zinc-900">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black uppercase">Customer Care & Support 🎧</h3>
              <button onClick={() => setShowSupportModal(false)}>✕</button>
            </div>
            <p className="text-zinc-500">Need help with sizing, delivery tracking, or exchanges?</p>
            <div className="space-y-2">
              <a href="https://wa.me/918637589429?text=Hi%20Style%20Zone%20X%20Support" target="_blank" rel="noreferrer" className="block p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-center font-black">
                Chat on WhatsApp (+91 8637589429)
              </a>
              <a href="mailto:stylezone.x0@gmail.com" className="block p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-center font-black">
                Email: stylezone.x0@gmail.com
              </a>
              <a href="tel:+918637589429" className="block p-3 bg-zinc-50 text-zinc-800 border rounded-xl text-center font-black">
                Call Direct Concierge
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-xs font-bold">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black uppercase">Official Size Guide 📏</h3>
              <button onClick={() => setShowSizeGuide(false)}>✕</button>
            </div>
            <table className="w-full text-center border">
              <thead><tr className="bg-zinc-100"><th className="p-1 border">Size</th><th className="p-1 border">Chest</th><th className="p-1 border">Length</th></tr></thead>
              <tbody>
                <tr><td className="p-1 border">S</td><td className="p-1 border">38"</td><td className="p-1 border">27"</td></tr>
                <tr><td className="p-1 border">M</td><td className="p-1 border">40"</td><td className="p-1 border">28"</td></tr>
                <tr><td className="p-1 border">L</td><td className="p-1 border">42"</td><td className="p-1 border">29"</td></tr>
                <tr><td className="p-1 border">XL</td><td className="p-1 border">44"</td><td className="p-1 border">30"</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Nav Dock (Hidden in Admin View) */}
      {!isAdminUrl && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-2 z-40 flex justify-around items-center max-w-md md:max-w-xl mx-auto rounded-t-3xl shadow-2xl">
          <button onClick={() => { setActiveTab("shop"); setActiveDepartment("All"); }} className="flex flex-col items-center text-zinc-800">
            <span className="text-base">🏠</span>
            <span className="text-[9px] font-black uppercase">Home</span>
          </button>
          <button onClick={() => { setActiveDepartment("Men"); setActiveTab("shop"); }} className="flex flex-col items-center text-zinc-500 hover:text-black">
            <span className="text-base">👔</span>
            <span className="text-[9px] font-black uppercase">Men</span>
          </button>
          <button onClick={() => { setActiveDepartment("Women"); setActiveTab("shop"); }} className="flex flex-col items-center text-zinc-500 hover:text-black">
            <span className="text-base">👗</span>
            <span className="text-[9px] font-black uppercase">Women</span>
          </button>
          <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center bg-zinc-950 text-white px-3 py-1 rounded-2xl shadow">
            <span className="text-[9px] font-black">🛍️ {cart.length}</span>
            <span className="text-[8px]">₹{finalPayableTotal}</span>
          </button>
          <button onClick={() => setActiveTab("account")} className="flex flex-col items-center text-zinc-500 hover:text-black">
            <span className="text-base">👤</span>
            <span className="text-[9px] font-black uppercase">Account</span>
          </button>
        </div>
      )}

    </div>
  );
}
