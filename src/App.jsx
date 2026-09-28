import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy, setDoc, getDoc, writeBatch } from 'firebase/firestore';

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

// STYLE ZONE - X Fashion & Footwear Hierarchy
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

const FASHION_COLORS = ["Black", "White", "Navy Blue", "Olive Green", "Beige", "Maroon", "Charcoal Grey"];
const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];
const FOOTWEAR_SIZES_ADULT = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];
const FOOTWEAR_SIZES_KIDS = ["Kids 1", "Kids 2", "Kids 3", "Kids 4", "Kids 5", "Kids 6", "Kids 7", "Kids 8", "Kids 9", "Kids 10"];

const BRAND_NAME = "STYLE ZONE - X";
const BRAND_TAGLINE = "Define Your Style.";
const MY_UPI_ID = "8637589429-3@ybl"; 
const ALLOWED_PINS = ["731204", "731240", "731215", "731224", "731236", "731214", "700001", "700019"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Navigation & Access Control
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
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [activeCollection, setActiveCollection] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [legalModal, setLegalModal] = useState({ isOpen: false, title: '', content: '' });
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [flashTime, setFlashTime] = useState(14400); 

  // Micro Interactions & Polish
  const [toast, setToast] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Variant Selections on Product View
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [productPageQty, setProductPageQty] = useState(1);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);

  // Pincode validation
  const [pinCheckInput, setPinCheckInput] = useState("");
  const [pinCheckMsg, setPinCheckMsg] = useState(null);

  // Coupon Engine
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

  // Fashion Hero Banner Sliders
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
    if (window.location.pathname === "/admin" || window.location.hash === "#admin") {
      setIsAdminUrl(true);
    } else {
      setIsAdminUrl(false);
    }
    const savedRV = localStorage.getItem("szx_recently_viewed");
    if (savedRV) {
      try { setRecentlyViewed(JSON.parse(savedRV)); } catch(e){}
    }
  }, []);

  // Firebase Persistent Cloud State
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const loadUserCloudData = async () => {
        const cartDoc = await getDoc(doc(db, "carts", user.uid));
        if (cartDoc.exists()) {
          setCart(cartDoc.data().items || []);
        }
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) {
          setCustInfo(prev => ({ ...prev, ...profileDoc.data() }));
        }
        const wishDoc = await getDoc(doc(db, "wishlists", user.uid));
        if (wishDoc.exists()) {
          setWishlist(wishDoc.data().items || []);
        }
      };
      loadUserCloudData();
    } else {
      const localCart = localStorage.getItem("szx_guest_cart");
      if (localCart) {
        try { setCart(JSON.parse(localCart)); } catch(e) {}
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
    }
  };

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

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    const flashTimer = setInterval(() => {
      setFlashTime(prev => (prev > 0 ? prev - 1 : 14400));
    }, 1000);
    
    const qProd = query(collection(db, "products"), orderBy("name"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsProductsLoading(false); 
    }, () => setIsProductsLoading(false));

    const unsubOrder = onSnapshot(collection(db, "orders"), (snapshot) => {
      const sortedDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      sortedDocs.sort((a, b) => new Date(b.rawDate || b.createdAt) - new Date(a.rawDate || a.createdAt));
      setOrders(sortedDocs);
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
  }, [heroSlides.length]);

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
        showToastMessage("Welcome back, " + result.user.displayName + " ✨");
      }
    } catch (error) {
      showToastMessage("Login Error: " + error.message, "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCart([]);
    localStorage.removeItem("szx_guest_cart");
    setCustInfo({ name: '', gender: 'Male', phone: '', vill: '', landmark: '', city: 'Bolpur', pin: '' });
    showToastMessage("Logged out successfully!");
  };

  const saveProfileDataToCloud = async () => {
    if (!custInfo.name || !custInfo.phone) return showToastMessage("Name and mobile number are mandatory!", "error");
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("szx_saved_address", JSON.stringify(custInfo));
    showToastMessage("Profile & measurements updated successfully!");
  };

  const saveAddressToLocal = async () => {
    if (!custInfo.vill || !custInfo.pin || !custInfo.city) return showToastMessage("Complete shipping address required!", "error");
    if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Currently delivering to selected zones only (PIN: ${custInfo.pin} not covered).`, "error");
    }
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("szx_saved_address", JSON.stringify(custInfo));
    showToastMessage("Shipping address verified and locked!");
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
      showToastMessage("Listening for apparel or kicks... 🎙️");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
      showToastMessage(`Searching fashion for: "${transcript}"`);
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
      showToastMessage("Product link copied to clipboard! 📋");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Cancel this order permanently?")) {
      try {
        await updateDoc(doc(db, "orders", orderId), { status: "Cancelled ❌" });
        showToastMessage("Order cancelled successfully!");
      } catch (err) {
        showToastMessage("Failed to cancel order", "error");
      }
    }
  };

  const handleReturnOrder = async (orderId) => {
    const reason = prompt("Reason for 7-Day Exchange/Return (e.g., Wrong Size, Color, Fit):");
    if (reason) {
      try {
        await updateDoc(doc(db, "orders", orderId), { 
          status: "Exchange Requested 🔄", 
          returnReason: reason 
        });
        showToastMessage("Return/Exchange initiated! Executive will inspect at pickup.");
      } catch (err) {
        showToastMessage("Failed to process request", "error");
      }
    }
  };

  // Coupon Apply Logic
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === "STYLE100") {
      if (rawCartTotal < 999) return showToastMessage("Minimum order of ₹999 required for STYLE100!", "error");
      setAppliedCoupon({ code: "STYLE100", discount: 100 });
      showToastMessage("🎉 Coupon Applied! ₹100 Flat OFF");
    } else if (cleanCode === "STYLE20") {
      if (rawCartTotal < 1499) return showToastMessage("Minimum order of ₹1499 required for STYLE20!", "error");
      const percDisc = Math.round(rawCartTotal * 0.20);
      setAppliedCoupon({ code: "STYLE20", discount: percDisc });
      showToastMessage(`🎉 Coupon Applied! 20% OFF (-₹${percDisc})`);
    } else {
      showToastMessage("Invalid or expired coupon code!", "error");
    }
  };

  // Add Product to Fashion Catalogue
  const addProduct = async (e) => {
    e.preventDefault();
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
        fit: el.item
