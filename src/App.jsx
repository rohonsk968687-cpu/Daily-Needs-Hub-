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

// Upgraded New Premium Categories List Layout
const categories = [
  "All", 
  "Dairy & Milk", 
  "Cold drinks & Beverages", 
  "Ice-Creams & Frozen",
  "Snacks & Munchies", 
  "Chocolates & Sweets", 
  "Home Daily Needs & Grocery",
  "Fashion & Clothing",
  "Shoes & Footwear",
  "Personal care"
];

// Complete Sub-Category Mappings with Visual Icons & Labels
const subCategoriesMap = {
  "Dairy & Milk": [
    { name: "Fresh Milk", icon: "🥛" },
    { name: "Curd & Dahi", icon: "🥣" },
    { name: "Lassi & Butter Milk", icon: "🥤" },
    { name: "Paneer & Cheese", icon: "🧀" },
    { name: "Butter & Ghee", icon: "🧈" }
  ],
  "Cold drinks & Beverages": [
    { name: "Soft Drinks", icon: "🥤" },
    { name: "Energy Drinks", icon: "⚡" },
    { name: "Juices & Mango Drinks", icon: "🧃" },
    { name: "Tea & Coffee", icon: "☕" }
  ],
  "Ice-Creams & Frozen": [
    { name: "Cone & Cups", icon: "🍦" },
    { name: "Family Packs", icon: "🍨" },
    { name: "Chocobar & Candy", icon: "🍭" }
  ],
  "Snacks & Munchies": [
    { name: "Chips & Kurkure", icon: "🍿" },
    { name: "Biscuits & Cookies", icon: "🍪" },
    { name: "Namkeen & Chanachur", icon: "🥨" },
    { name: "Noodles & Pasta", icon: "🍜" }
  ],
  "Chocolates & Sweets": [
    { name: "Cadbury & Premium", icon: "🍫" },
    { name: "Candies & Toffees", icon: "🍬" },
    { name: "Traditional Sweets", icon: "🍯" }
  ],
  "Home Daily Needs & Grocery": [
    { name: "Atta, Rice & Dal", icon: "🌾" },
    { name: "Oil & Spices (Masala)", icon: "🧂" },
    { name: "Sauce & Ketchup", icon: "🥫" },
    { name: "Cleaning & Detergent", icon: "🧹" }
  ],
  "Fashion & Clothing": [
    { name: "T-Shirts", icon: "👕" },
    { name: "Shirts", icon: "👔" },
    { name: "Jeans & Trousers", icon: "👖" },
    { name: "Sarees & Ethnic Wear", icon: "🥻" },
    { name: "Ladies Tops & Kurtis", icon: "👗" },
    { name: "Kids Wear", icon: "👶" }
  ],
  "Shoes & Footwear": [
    { name: "Sports Shoes", icon: "👟" },
    { name: "Casual Shoes", icon: "👞" },
    { name: "Slippers & Flip-Flops", icon: "🩴" },
    { name: "Sandals", icon: "👡" }
  ],
  "Personal care": [
    { name: "Soap & Body Wash", icon: "🧼" },
    { name: "Toothpaste & Brush", icon: "🪥" },
    { name: "Hair Shampoo & Oil", icon: "🧴" },
    { name: "Face Wash & Cream", icon: "✨" }
  ]
};

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
  
  // Feature 19: Enhanced Shimmer Skeleton Loaders State
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  
  // Isolated Navigation Rules & Security Matrix States (Feature 1, 2)
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
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [selectedOfferFilter, setSelectedOfferFilter] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [legalModal, setLegalModal] = useState({ isOpen: false, title: '', content: '' });
  const [paymentType, setPaymentType] = useState("UPI"); 
  const [flashTime, setFlashTime] = useState(3600); 

  // Feature 16: Modern Toast Notifications System
  const [toast, setToast] = useState(null);

  // Feature 8: Recently Viewed Items List
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Feature 5, 6: Voice Search & Search Suggestions State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Feature 20: Image Pinch-Zoom Modal State
  const [isZoomOpen, setIsNotifZoomOpen] = useState(false);

  // Client-side transient variant selection hook
  const [selectedSizes, setSelectedSizes] = useState({});

  // Product Page Local Quantity Selector State
  const [productPageQty, setProductPageQty] = useState(1);

  // Delivery Pin Code Check State for Flipkart View
  const [pinCheckInput, setPinCheckInput] = useState("");
  const [pinCheckMsg, setPinCheckMsg] = useState(null);

  // Admin Selected Category State for Add Product Form
  const [adminSelectedCategory, setAdminSelectedCategory] = useState(categories[1]);

  // Expanded Category State for Category View Tab
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Admin Stock Grid Search & Edit Modal States
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("All");
  const [editingProduct, setEditingProduct] = useState(null);

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
    { id: 2, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80", text: "🥤 COLD DRINKS & BEVERAGES: Beat the Summer Heat!" },
    { id: 3, img: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=500&q=80", text: "🛒 GROCERY ESSENTIALS: Fresh Stock Everyday" },
    { id: 4, img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&q=80", text: "🥛 FRESH DAIRY PRODUCTS: Delivery at Doorstep" },
    { id: 5, img: "https://images.unsplash.com/photo-1543168256-418811576931?w=500&q=80", text: "🥬 FARM FRESH VEGETABLES: 100% Organic" }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);

  // Custom Toast Notification Trigger
  const showToastMessage = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Verification routing path allocation hooks
  useEffect(() => {
    if (window.location.pathname === "/admin" || window.location.hash === "#admin") {
      setIsAdminUrl(true);
    } else {
      setIsAdminUrl(false);
    }

    // Load Recently Viewed from local storage
    const savedRV = localStorage.getItem("dnh_recently_viewed");
    if (savedRV) {
      try { setRecentlyViewed(JSON.parse(savedRV)); } catch(e){}
    }
  }, []);

  // Load cloud data structure metrics for profiles, carts & Wishlist Cloud Sync (Feature 11)
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
        // Wishlist Cloud Sync (Feature 11)
        const wishDoc = await getDoc(doc(db, "wishlists", user.uid));
        if (wishDoc.exists()) {
          setWishlist(wishDoc.data().items || []);
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

  // Feature 11: Sync Wishlist with Cloud
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
          signInAnonymously(auth).catch(e => console.log("Anon authentication active"));
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
      setIsProductsLoading(false); 
    }, (error) => {
      setIsProductsLoading(false);
    });

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
  }, [slides.length]);

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
        showToastMessage("Logged in as " + result.user.displayName);
      }
    } catch (error) {
      showToastMessage("Login Error: " + error.message, "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCart([]);
    localStorage.removeItem("dnh_guest_cart");
    setCustInfo({ name: '', gender: 'Male', phone: '', vill: '', landmark: '', city: 'Nanoor', pin: '' });
    showToastMessage("Logged out successfully!");
  };

  const saveProfileDataToCloud = async () => {
    if (!custInfo.name || !custInfo.phone) return showToastMessage("Name and phone number mandatory!", "error");
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("dnh_saved_address", JSON.stringify(custInfo));
    showToastMessage("Profile parameters updated and saved permanently!");
  };

  const saveAddressToLocal = async () => {
    if (!custInfo.vill || !custInfo.pin || !custInfo.city) return showToastMessage("Village, City, and PIN Code are mandatory!", "error");
    if (!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Delivery unavailable for area PIN: ${custInfo.pin}`, "error");
    }
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, "profiles", user.uid), custInfo, { merge: true });
    }
    localStorage.setItem("dnh_saved_address", JSON.stringify(custInfo));
    showToastMessage("Shipping delivery address verified & locked!");
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p, quantity = 1) => {
    if (p.stock <= 0) return showToastMessage("Requested product is out of stock!", "error");

    if ((p.category === "Shoes & Footwear" || p.category === "Fashion & Clothing") && !selectedSizes[p.id] && p.availableSizes && p.availableSizes.length > 0) {
      return showToastMessage("Please select item size first!", "error");
    }

    const chosenSize = selectedSizes[p.id] || null;
    const exist = cart.find(x => x.id === p.id && x.selectedSize === chosenSize);
    let updatedCart = [];

    if (exist) {
      if (exist.qty + quantity > p.stock) return showToastMessage("Inventory limit reached!", "error");
      updatedCart = cart.map(x => (x.id === p.id && x.selectedSize === chosenSize) ? { ...exist, qty: exist.qty + quantity } : x);
    } else {
      updatedCart = [...cart, { ...p, qty: quantity, selectedSize: chosenSize }];
    }
    syncCart(updatedCart);
    showToastMessage(`Added ${quantity} unit(s) to bag! 🛒`);
  };

  const updateCartQty = (id, delta, sizeVariant) => {
    const item = cart.find(x => x.id === id && x.selectedSize === sizeVariant);
    if (!item) return;
    const nextQty = item.qty + delta;
    let updatedCart = [];
    if (nextQty <= 0) {
      updatedCart = cart.filter(x => !(x.id === id && x.selectedSize === sizeVariant));
    } else {
      if (delta > 0 && nextQty > item.stock) return showToastMessage("Maximum inventory limit reached!", "error");
      updatedCart = cart.map(x => (x.id === id && x.selectedSize === sizeVariant) ? { ...item, qty: nextQty } : x);
    }
    syncCart(updatedCart);
  };

  // Feature 11: Wishlist Toggle with Cloud Sync
  const toggleWishlist = (p) => {
    const exist = wishlist.find(x => x.id === p.id);
    let updatedWish = [];
    if (exist) {
      updatedWish = wishlist.filter(x => x.id !== p.id);
      showToastMessage("Removed from favorites");
    } else {
      updatedWish = [...wishlist, p];
      showToastMessage("Added to favorites ❤️");
    }
    syncWishlistCloud(updatedWish);
  };

  // Feature 8: Add to Recently Viewed List
  const addToRecentlyViewed = (p) => {
    setSelectedProduct(p);
    setCurrentProductSlide(0);
    setProductPageQty(1);
    setPinCheckMsg(null);

    const exists = recentlyViewed.find(x => x.id === p.id);
    let updatedRV = [];
    if (!exists) {
      updatedRV = [p, ...recentlyViewed.slice(0, 5)];
      setRecentlyViewed(updatedRV);
      localStorage.setItem("dnh_recently_viewed", JSON.stringify(updatedRV));
    }
  };

  // Feature 6: Voice Search Functionality
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return showToastMessage("Voice search not supported on this browser", "error");
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => {
      setIsListening(true);
      showToastMessage("Listening... Speak product name 🎙️");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
      showToastMessage(`Searching for: "${transcript}"`);
    };
    recognition.onerror = () => {
      setIsListening(false);
      showToastMessage("Voice recognition error", "error");
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Feature 10: One-Click Product Social Share
  const handleShareProduct = (p, platform) => {
    const shareText = `Check out ${p.name} at ₹${getDiscountedPrice(p.price, p.discount)} on Daily Needs Hub!`;
    const shareUrl = window.location.href;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      showToastMessage("Link copied to clipboard! 📋");
    }
  };

  // Feature 12: Order Cancel Request
  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this pending order?")) {
      try {
        await updateDoc(doc(db, "orders", orderId), { status: "Cancelled ❌" });
        showToastMessage("Order cancelled successfully!");
      } catch (err) {
        showToastMessage("Failed to cancel order", "error");
      }
    }
  };

  // Feature 13: Order Return / Exchange Request
  const handleReturnOrder = async (orderId) => {
    if (window.confirm("Raise Return/Exchange request for this delivered order?")) {
      try {
        await updateDoc(doc(db, "orders", orderId), { status: "Return Requested 🔄" });
        showToastMessage("Return Request submitted! Manager will contact you shortly.");
      } catch (err) {
        showToastMessage("Failed to submit request", "error");
      }
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const el = e.target.elements;

    const img1 = el.itemImg1?.value?.trim() || "";
    const img2 = el.itemImg2?.value?.trim() || "";
    const img3 = el.itemImg3?.value?.trim() || "";
    const img4 = el.itemImg4?.value?.trim() || "";
    const img5 = el.itemImg5?.value?.trim() || "";

    const rawImagesArray = [img1, img2, img3, img4, img5].filter(url => url !== "");
    const imgArray = rawImagesArray.length > 0 ? rawImagesArray : ["📦"];

    const activeSizesArray = [];
    const sizeCheckboxes = e.target.querySelectorAll('input[name="adminSizes"]:checked');
    sizeCheckboxes.forEach(cb => activeSizesArray.push(cb.value));

    try {
      await addDoc(collection(db, "products"), { 
        name: el.itemName.value, 
        price: Number(el.itemPrice.value), 
        stock: Number(el.itemStock.value), 
        discount: Number(el.itemDiscount.value) || 0, 
        images: imgArray, 
        category: el.itemCategory.value,
        subCategory: el.itemSubCategory.value || "General",
        offerTag: el.itemOfferTag.value || "None",
        specifications: el.itemSpecs.value || "Premium quality guaranteed checked asset.",
        isBestSeller: el.bestSeller.checked,
        isNewArrival: el.newArrival.checked,
        availableSizes: activeSizesArray
      });
      e.target.reset();
      setAdminSelectedCategory(categories[1]);
      showToastMessage("Product batch deployed successfully!");
    } catch (error) {
      showToastMessage("Database write failure!", "error");
    }
  };

  const handleSaveFullProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const el = e.target.elements;

    const img1 = el.editImg1?.value?.trim() || "";
    const img2 = el.editImg2?.value?.trim() || "";
    const img3 = el.editImg3?.value?.trim() || "";
    const img4 = el.editImg4?.value?.trim() || "";
    const img5 = el.editImg5?.value?.trim() || "";

    const rawImagesArray = [img1, img2, img3, img4, img5].filter(url => url !== "");
    const imgArray = rawImagesArray.length > 0 ? rawImagesArray : editingProduct.images;

    try {
      await updateDoc(doc(db, "products", editingProduct.id), {
        name: el.editName.value,
        category: el.editCategory.value,
        subCategory: el.editSubCategory.value,
        price: Number(el.editPrice.value),
        discount: Number(el.editDiscount.value) || 0,
        stock: Number(el.editStock.value),
        specifications: el.editSpecs.value,
        images: imgArray
      });
      setEditingProduct(null);
      showToastMessage("Product updated successfully!");
    } catch (err) {
      showToastMessage("Error updating product!", "error");
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
      showToastMessage("Broadcast alert sent!");
    } catch(err) { showToastMessage("Notification push error", "error"); }
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
    showToastMessage("Pipeline status updated!");
  };

  const updateOrderPaymentStatus = async (id, nextPayStatus) => {
    await updateDoc(doc(db, "orders", id), { paymentStatus: nextPayStatus });
    showToastMessage("Payment parameters verified!");
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
      const matchesSubCategory = activeSubCategory === "All" || p.subCategory === activeSubCategory;
      return matchesSearch && matchesCategory && matchesSubCategory;
    }
  });

  const adminFilteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(adminSearchQuery.toLowerCase());
    const matchesCategory = adminCategoryFilter === "All" || p.category === adminCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const checkOperationalHours = () => {
    const currentHour = new Date().getHours();
    if (isAdmin) return true;
    if (currentHour < 7 || currentHour >= 21) {
      return false;
    }
    return true;
  };

  const handleCheckoutInit = async () => {
    if (!checkOperationalHours()) {
      return showToastMessage("Store Closed! Accepting orders strictly 7:00 AM - 9:00 PM.", "error");
    }

    if(!custInfo.name || !custInfo.vill || !custInfo.pin || !custInfo.phone || !custInfo.city) {
      return showToastMessage("Name, Phone, Village, City and PIN Code are mandatory fields.", "error");
    }
    if(!ALLOWED_PINS.includes(custInfo.pin.trim())) {
      return showToastMessage(`Service unreachable for PIN: ${custInfo.pin}`, "error");
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
        return showToastMessage(`Transaction aborted: ${blockedItemName} has insufficient stock.`, "error");
      }

      await batch.commit();

      const docRef = await addDoc(collection(db, "orders"), {
        customerName: custInfo.name,
        phone: custInfo.phone,
        address: fullAddressString,
        userEmail: user ? user.email : "Anonymous",
        items: cart.map(i => ({ name: i.name, qty: i.qty, total: getDiscountedPrice(i.price, i.discount) * i.qty, size: i.selectedSize || null })),
        totalAmount: cartTotal,
        paymentMode: paymentType === "COD" ? "Cash on Delivery (COD)" : "Online UPI Payment",
        paymentStatus: paymentType === "UPI" ? "Awaiting Admin Verification ⏳" : "COD Pending Delivery",
        utr: paymentType === "UPI" ? "AUTO-UPI-INTENT" : "COD Mode Verification Complete",
        status: "Pending ⏳",
        createdAt: new Date().toLocaleString(),
        rawDate: new Date().toISOString()
      });
      
      setCurrentOrderId(docRef.id);
      setShowInvoice(true); 
    } catch (e) {
      showToastMessage("Checkout sequence verification failure.", "error");
    }
  };

  const confirmCODModeSelection = async () => {
    try {
      await updateDoc(doc(db, "orders", currentOrderId), {
        paymentMode: "Cash on Delivery (COD)",
        paymentStatus: "COD Pending Delivery",
        utr: "COD Mode Verification Complete"
      });
      showToastMessage("Cash on Delivery parameters accepted!");
    } catch(err) {
      console.log("Database update error");
    }
  };

  const sendWhatsAppNotification = () => {
    const itemsMsg = cart.map(i => `${i.name} ${i.selectedSize ? `(Size: ${i.selectedSize})` : ''} (x${i.qty}) - ₹${getDiscountedPrice(i.price, i.discount) * i.qty}`).join(", ");
    const fullAddressString = `${custInfo.vill}, ${custInfo.city}, Landmark: ${custInfo.landmark || 'N/A'}, PIN: ${custInfo.pin}`;
    const msg = `New Order Confirmed - Daily Needs Hub\nOrder ID: ${currentOrderId}\nCustomer Name: ${custInfo.name}\nContact: ${custInfo.phone}\nAddress: ${fullAddressString}\nItems Summary: ${itemsMsg}\nTotal Bill: ₹${cartTotal}`;
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
      case 'Dairy & Milk': return '🥛';
      case 'Cold drinks & Beverages': return '🥤';
      case 'Ice-Creams & Frozen': return '🍦';
      case 'Snacks & Munchies': return '🍿';
      case 'Chocolates & Sweets': return '🍫';
      case 'Home Daily Needs & Grocery': return '🏠';
      case 'Fashion & Clothing': return '👔';
      case 'Shoes & Footwear': return '👟';
      case 'Personal care': return '🧼';
      default: return '📦';
    }
  };

  const handleOpenLegal = (type) => {
    let title = '';
    let content = '';

    if (type === 'about') {
      title = "About Our Store 🛒";
      content = `Daily Needs Hub (DNH) is your trusted online neighborhood grocery & lifestyle destination. Established with a mission to bring fresh dairy, farm-fresh vegetables, crisp snacks, footwear, and fashion items straight to your doorstep in Bolpur and Nanoor regions.\n\nWe bridge the gap between quality food sources and your kitchen, ensuring lightning-fast delivery, highly competitive market-beating prices, and verified safe online experiences. Thank you for making us your daily shopping partner!`;
    } else if (type === 'privacy') {
      title = "Privacy Protection Policy 🛡️";
      content = `At Daily Needs Hub, your privacy is our supreme priority:\n\n1. Data Collection: We only collect essential delivery details like your Name, Shipping Address, and Contact Number for order processing.\n2. Payment Safety: We utilize universal secure UPI links. We never store credit cards, bank accounts, or sensitive UPI PINs on our servers.\n3. Account Security: Persistent profile sync guarantees auto-restored saved address details upon login.`;
    } else if (type === 'refund') {
      title = "Refund & Return Terms 🔄";
      content = `We want you to shop with absolute confidence. Our easy refund criteria includes:\n\n1. Fresh Goods (Dairy, Vegetables): Eligible for immediate replacement or refund within 3 hours of delivery if found damaged or stale.\n2. Fashion & Shoes: Size exchanges available within 24 hours of delivery.\n3. Refund Method: Approved refunds are credited instantly within 24 hours back to your original payment mode or UPI address.`;
    } else if (type === 'terms') {
      title = "Terms & Conditions 📜";
      content = `Welcome to Daily Needs Hub. By accepting our platform frameworks, you express consent to our regulatory standard guidelines:\n\n1. Pricing: All rates listed on the application are verified and calculated accurately.\n2. Service Area: Currently active across Bolpur, Nanoor, Papuri, and adjacent Birbhum regions.\n3. Order Placement: Orders are confirmed once details are logged on WhatsApp or processed through the cash checkout invoice window. Fraudulent activities or dummy checks will result in account restriction.`;
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

  const handlePinCheck = (pin) => {
    setPinCheckInput(pin);
    if (!pin || pin.length < 6) {
      setPinCheckMsg(null);
      return;
    }
    if (ALLOWED_PINS.includes(pin.trim())) {
      setPinCheckMsg({ type: "success", text: "✅ Express 30-Min Delivery Available at " + pin });
    } else {
      setPinCheckMsg({ type: "error", text: "❌ Sorry, we do not deliver to PIN " + pin + " yet!" });
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-amber-50/60 via-white to-emerald-50/60 text-gray-900'} pb-32 transition-all duration-500 font-sans`}>
      
      {/* FEATURE 16: Modern Toast Notifications System */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2 animate-bounce ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* DESKTOP & MOBILE RESPONSIVE CONTAINER WRAPPER */}
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Header View */}
        <header className="p-3 bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-40 flex justify-between items-center border-b border-orange-100 w-full max-w-md md:max-w-7xl mx-auto rounded-b-2xl">
          <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => { if(!isAdmin) { setActiveTab("shop"); } }}>
            <img src={BRAND_LOGO_URL} alt="Logo" className="w-12 h-12 object-contain rounded-xl shadow-sm bg-orange-50 p-0.5" />
            <div className="flex flex-col items-start min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-emerald-600 to-blue-600 tracking-tight uppercase leading-none">
                Daily Needs Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
             {!isAdmin && (
               <>
                 <button onClick={() => setIsNotifOpen(true)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs relative text-black transition-all">
                   🔔 {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{notifications.length}</span>}
                 </button>
                 <button onClick={() => setIsWishlistOpen(true)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs relative text-black transition-all">
                   ❤️ {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{wishlist.length}</span>}
                 </button>
               </>
             )}
             {!user && !isAdmin && (
               <button onClick={handleGoogleLogin} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black px-3.5 py-2 rounded-xl shadow-md transition-all">
                 Login
               </button>
             )}
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-black transition-all">{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {/* Sticky Custom Search Bar + Voice Search (Feature 5, 6) */}
        {!isAdmin && !isAdminUrl && activeTab === "shop" && (
          <div className="sticky top-[69px] z-30 px-4 py-2 bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100 w-full max-w-md md:max-w-7xl mx-auto my-2 rounded-2xl relative">
            <div className="flex items-center gap-2">
              <input 
                type="text" placeholder="🔍 Search milk, snacks, shoes, t-shirts, grocery..." 
                value={search}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full p-3.5 bg-white rounded-2xl border-2 border-orange-100 text-xs md:text-sm focus:border-emerald-500 focus:outline-none transition-all text-black font-semibold shadow-inner"
                onChange={(e) => setSearch(e.target.value)}
              />
              <button 
                onClick={startVoiceSearch} 
                className={`p-3 rounded-2xl border shadow-sm transition-all text-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
                title="Voice Search 🎤"
              >
                🎙️
              </button>
            </div>

            {/* Feature 5: Smart Search Dropdown Suggestions */}
            {showSuggestions && search.length > 0 && (
              <div className="absolute top-full left-4 right-4 bg-white border border-gray-100 rounded-2xl shadow-xl z-40 max-h-48 overflow-y-auto mt-1 p-2 text-xs font-bold text-gray-800">
                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => { setSearch(p.name); setShowSuggestions(false); }}
                    className="p-2.5 hover:bg-orange-50 rounded-xl cursor-pointer flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-orange-500 font-mono">₹{getDiscountedPrice(p.price, p.discount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="w-full max-w-md md:max-w-7xl mx-auto">

          {/* ISOLATED ADMIN ROUTING INFRASTRUCTURE PANEL GRID */}
          {isAdminUrl ? (
            <div className="p-4">
              <div className="bg-white p-6 rounded-3xl shadow-xl text-black space-y-6 border border-orange-100 max-w-3xl mx-auto">
                 <h2 className="text-xl font-bold mb-2 text-orange-600 text-center uppercase tracking-wider">Secure Access Node</h2>
                 {!isAdmin ? (
                   <div className="space-y-4">
                     <p className="text-[11px] text-center font-bold text-gray-400">Enter high-grade secure protocol password key to activate structural dashboards</p>
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
                            
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Select Category *</label>
                              <select 
                                name="itemCategory" 
                                value={adminSelectedCategory}
                                onChange={(e) => setAdminSelectedCategory(e.target.value)}
                                className="border p-3 w-full rounded-xl bg-gray-50 text-xs font-black"
                              >
                                {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Select Sub-Category *</label>
                              <select 
                                name="itemSubCategory" 
                                className="border p-3 w-full rounded-xl bg-gray-50 text-xs font-bold"
                              >
                                <option value="General">General</option>
                                {subCategoriesMap[adminSelectedCategory] && subCategoriesMap[adminSelectedCategory].map(sub => (
                                  <option key={sub.name} value={sub.name}>{sub.icon} {sub.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

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
                            
                          {/* Dynamic Sizing Checkboxes for Kids (1-13), Adult Shoes (1-10) and Apparel */}
                          <div className="bg-gray-50 p-3 rounded-2xl border space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block border-b pb-1">Available Sizes Checklist:</label>
                            
                            <div>
                              <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1">👞 Adult Footwear (UK 1 - 10):</span>
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-gray-700">
                                {["UK 1", "UK 2", "UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"].map(sz => (
                                  <label key={sz} className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border shadow-sm cursor-pointer">
                                    <input type="checkbox" value={sz} name="adminSizes" className="rounded text-emerald-600" />
                                    {sz}
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-[8px] font-black text-indigo-600 uppercase block mb-1">👶 Kids Footwear (Kids 1 - 13):</span>
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-gray-700">
                                {["Kids 1", "Kids 2", "Kids 3", "Kids 4", "Kids 5", "Kids 6", "Kids 7", "Kids 8", "Kids 9", "Kids 10", "Kids 11", "Kids 12", "Kids 13"].map(sz => (
                                  <label key={sz} className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border shadow-sm cursor-pointer">
                                    <input type="checkbox" value={sz} name="adminSizes" className="rounded text-indigo-600" />
                                    {sz}
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-[8px] font-black text-orange-600 uppercase block mb-1">👕 Fashion & Clothing:</span>
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-gray-700">
                                {["S", "M", "L", "XL", "XXL", "Free Size"].map(sz => (
                                  <label key={sz} className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border shadow-sm cursor-pointer">
                                    <input type="checkbox" value={sz} name="adminSizes" className="rounded text-orange-600" />
                                    {sz}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 5 Separate Image URL Input Fields */}
                          <div className="bg-gray-50 p-3 rounded-2xl border space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block border-b pb-1">Upload Product Images (Up to 5 URLs):</label>
                            <div className="grid gap-2">
                              <input name="itemImg1" placeholder="Image URL 1 (Main Thumbnail) *" className="border p-2.5 rounded-xl bg-white text-xs font-semibold" required />
                              <input name="itemImg2" placeholder="Image URL 2 (Optional)" className="border p-2.5 rounded-xl bg-white text-xs font-semibold" />
                              <input name="itemImg3" placeholder="Image URL 3 (Optional)" className="border p-2.5 rounded-xl bg-white text-xs font-semibold" />
                              <input name="itemImg4" placeholder="Image URL 4 (Optional)" className="border p-2.5 rounded-xl bg-white text-xs font-semibold" />
                              <input name="itemImg5" placeholder="Image URL 5 (Optional)" className="border p-2.5 rounded-xl bg-white text-xs font-semibold" />
                            </div>
                          </div>

                          <textarea name="itemSpecs" placeholder="Product Details / Specifications" className="border p-3 rounded-xl bg-gray-50 text-xs font-semibold" rows="2" />
                            
                          <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white p-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow transition-all">ADD PRODUCT TO LIVE NODES</button>
                        </form>
                      )}

                      {/* Stock Controller Grid (Admin Tab 3) */}
                      {adminTab === "manage-items" && (
                        <div className="bg-white rounded-3xl space-y-4 text-black p-2">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b pb-2">📋 Stock Controller Grid Metadata</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border">
                            <input 
                              type="text" 
                              placeholder="🔍 Instant Search 200+ Products..." 
                              value={adminSearchQuery}
                              onChange={(e) => setAdminSearchQuery(e.target.value)}
                              className="border p-2.5 rounded-xl bg-white text-xs font-bold text-black focus:outline-none"
                            />
                            <select 
                              value={adminCategoryFilter} 
                              onChange={(e) => setAdminCategoryFilter(e.target.value)}
                              className="border p-2.5 rounded-xl bg-white text-xs font-black text-gray-800"
                            >
                              {categories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "Filter All Categories" : cat}</option>)}
                            </select>
                          </div>

                          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {adminFilteredProducts.length === 0 ? (
                              <p className="text-center text-xs font-bold text-gray-400 py-8">No matching items found in inventory.</p>
                            ) : (
                              adminFilteredProducts.map(p => {
                                const isLow = p.stock < 5;
                                return (
                                  <div key={p.id} className={`p-3 rounded-2xl flex flex-col gap-2 border transition-all ${isLow ? 'bg-red-50/40 border-red-200' : 'bg-gray-50/50'}`}>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-xs font-black text-gray-800 truncate block max-w-[200px]">{p.name}</span>
                                        <span className="text-[9px] text-gray-400 font-bold">{p.category} → {p.subCategory || "General"}</span>
                                      </div>
                                      <div className="flex gap-2 items-center">
                                        <button onClick={() => setEditingProduct(p)} className="text-[10px] bg-blue-50 text-blue-600 font-extrabold border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100 transition-all">✏️ Edit</button>
                                        <button onClick={async () => { if(window.confirm("Delete asset item?")) await deleteDoc(doc(db, "products", p.id)); }} className="text-[10px] text-red-500 font-bold underline">Delete</button>
                                      </div>
                                    </div>
                                      
                                    <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-gray-100">
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] font-black text-gray-400 uppercase">Price (₹ MRP)</label>
                                        <input 
                                          type="number" 
                                          defaultValue={p.price} 
                                          className="border rounded p-1 text-xs font-bold w-full bg-gray-50"
                                          onBlur={(e) => updateProductData(p.id, "price", e.target.value)}
                                        />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] font-black text-gray-400 uppercase">Discount Rate %</label>
                                        <input 
                                          type="number" 
                                          defaultValue={p.discount || 0} 
                                          className="border rounded p-1 text-xs font-bold w-full bg-gray-50"
                                          onBlur={(e) => updateProductData(p.id, "discount", e.target.value)}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1 border-t border-dashed">
                                      <div className="text-[9px] text-gray-400 font-bold">
                                        {p.availableSizes && p.availableSizes.length > 0 ? `Sizes: ${p.availableSizes.join(', ')}` : 'Standard Unit'}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => updateProductData(p.id, "stock", Math.max(0, p.stock - 1))} className="w-6 h-6 bg-white border font-black text-xs rounded-md shadow-sm flex items-center justify-center">-</button>
                                        <span className={`text-xs font-black px-2 ${isLow ? 'text-red-600' : 'text-slate-800'}`}>Stock: {p.stock}</span>
                                        <button onClick={() => updateProductData(p.id, "stock", p.stock + 1)} className="w-6 h-6 bg-white border font-black text-xs rounded-md shadow-sm flex items-center justify-center">+</button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
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
                                <p><b>Customer:</b> {ord.customerName}</p>
                                <p className="text-gray-600"><b>Address:</b> {ord.address}</p>
                                <p className="text-blue-700 font-bold"><b>Mode Selection:</b> {ord.paymentMode || "Online UPI payment"}</p>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>Verification Parameter:</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${ord.paymentStatus?.includes("Awaiting") ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                    {ord.paymentStatus || "Awaiting Admin Verification ⏳"}
                                  </span>
                                </div>
                                {ord.utr && <p className="bg-gray-50 p-1 text-[10px] font-mono text-gray-500">Ref ID: {ord.utr}</p>}
                                
                                <div className="bg-slate-50 p-2 rounded-xl text-[10px] space-y-1 font-semibold text-gray-700">
                                  {ord.items?.map((it, idx) => (
                                    <p key={idx}>• {it.name} {it.size ? `(Size: ${it.size})` : ''} x{it.qty}</p>
                                  ))}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t gap-2">
                                  <a href={`tel:${ord.phone || '8637589429'}`} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-200 rounded-xl font-black text-[10px] flex items-center gap-1 shadow-sm uppercase tracking-wide">
                                    📞 Call Buyer
                                  </a>

                                  <button 
                                    onClick={async () => { if(window.confirm("Permanently wipe this order statement history?")) await deleteDoc(doc(db, "orders", ord.id)); }}
                                    className="text-[10px] text-red-500 border border-red-200 px-2 py-1.5 rounded-xl font-bold bg-red-50 hover:bg-red-100 transition-all"
                                  >
                                    Wipe 🗑️
                                  </button>

                                  {ord.paymentStatus?.includes("Awaiting") && (
                                    <button 
                                      onClick={() => updateOrderPaymentStatus(ord.id, "Approved & Paid ✅")}
                                      className="bg-emerald-600 text-white font-black text-[9px] px-2 py-1.5 rounded-xl uppercase tracking-wider shadow"
                                    >
                                      ✓ Approve
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
                            <input name="notifText" placeholder="Enter broadcast message payload" className="w-full p-2.5 text-xs border bg-gray-50 rounded-xl text-black font-semibold" required />
                            <button type="submit" className="w-full bg-slate-900 text-white font-black p-2.5 text-xs rounded-xl shadow">Broadcast Alert</button>
                          </form>
                        </div>
                      )}

                   </div>
                 )}
              </div>
            </div>
          ) : (
            /* CUSTOMER APPLICATION LAYOUT INTERFACES */
            <>
              {activeTab === "shop" && (
                <>
                  <div className="px-4 mb-4">
                    <div className="bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                      <h2 className="text-2xl font-black mb-1">Hello, {custInfo.name || "Guest Customer"}! 👋</h2>
                      <p className="text-xs opacity-90 italic">Fresh Items, Best Price, Straight to Your Doorstep.</p>
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
                    <div className="relative h-44 md:h-64 w-full overflow-hidden rounded-3xl shadow-xl border-2 border-white bg-gray-100">
                      {slides.map((s, idx) => (
                        <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                          <img src={s.img} alt="Promo banner" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-white">
                            <p className="text-xs md:text-sm font-black bg-orange-600/90 px-3 py-1 rounded-lg inline-block">{s.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ULTRA-PROFESSIONAL SUB-CATEGORY GRID ACCORDION MATRIX */}
              {activeTab === "categories" && (
                <div className="px-4 mb-4">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 rounded-3xl text-white mb-6 shadow-md">
                    <h2 className="text-xl md:text-2xl font-black">All Categories & Departments</h2>
                    <p className="text-xs opacity-90">Tap on any category to explore curated sub-departments</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(c => {
                      const isAll = c === "All";
                      const isExpanded = expandedCategory === c;
                      const subs = subCategoriesMap[c] || [];

                      return (
                        <div key={c} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
                          <button 
                            onClick={() => {
                              if (isAll) {
                                setActiveCategory("All");
                                setActiveSubCategory("All");
                                setActiveTab("shop");
                              } else {
                                setExpandedCategory(isExpanded ? null : c);
                              }
                            }} 
                            className={`w-full p-4.5 text-left font-black flex items-center justify-between transition-colors ${activeCategory === c ? 'bg-orange-50/60 text-orange-600' : 'bg-white text-gray-800'}`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-2xl shadow-inner border border-orange-200/50">
                                {getCategoryEmoji(c)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm md:text-base font-black tracking-tight">{c}</span>
                                {!isAll && subs.length > 0 && <span className="text-[10px] text-gray-400 font-bold uppercase">{subs.length} Sub-Categories Available</span>}
                              </div>
                            </div>
                            {!isAll && (
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${isExpanded ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            )}
                          </button>

                          {/* PROFESSIONAL GLASS-GRID SUB-CATEGORY ACCORDION */}
                          {!isAll && isExpanded && (
                            <div className="bg-gradient-to-b from-orange-50/30 to-amber-50/50 p-3.5 border-t border-orange-100/60 space-y-2.5">
                              <button
                                onClick={() => {
                                  setActiveCategory(c);
                                  setActiveSubCategory("All");
                                  setActiveTab("shop");
                                }}
                                className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs text-center shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all uppercase tracking-wider"
                              >
                                <span>✨ View All Items in {c}</span>
                              </button>
                              
                              <div className="grid grid-cols-2 gap-2.5 pt-1">
                                {subs.map(sub => (
                                  <button
                                    key={sub.name}
                                    onClick={() => {
                                      setActiveCategory(c);
                                      setActiveSubCategory(sub.name);
                                      setActiveTab("shop");
                                    }}
                                    className={`p-3 rounded-2xl bg-white border transition-all flex items-center gap-2.5 shadow-sm hover:shadow-md text-left active:scale-95 ${activeSubCategory === sub.name ? 'border-orange-500 bg-orange-50/80 text-orange-600 font-extrabold' : 'border-gray-200/80 text-gray-800 font-bold'}`}
                                  >
                                    <span className="text-xl p-1 bg-gray-50 rounded-xl border">{sub.icon}</span>
                                    <span className="text-xs leading-tight line-clamp-2">{sub.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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

              {/* UPGRADED STRUCTURED PROFILE AND SHIPPING ACCOUNT MODULE */}
              {activeTab === "account" && (
                <div className="px-4 space-y-6 text-black pb-12 max-w-4xl mx-auto">
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
                          <h4 className="font-extrabold text-sm text-gray-800">Welcome, Guest Customer</h4>
                          <p className="text-[10px] text-gray-400 font-bold">Connect profile for cloud persistent cart sync</p>
                        </>
                      )}
                    </div>
                    {user ? (
                      <button onClick={handleLogout} className="bg-red-50 text-red-500 font-black text-xs px-3 py-2 rounded-xl border border-red-100 hover:bg-red-100 transition-all">Logout</button>
                    ) : (
                      <button onClick={handleGoogleLogin} className="bg-blue-50 text-blue-600 font-black text-xs px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all">Connect Google</button>
                    )}
                  </div>

                  {/* CARD SECTION 1: My Profile */}
                  <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-black text-sm text-gray-800 flex items-center gap-1.5">👤 My Profile</h3>
                      <button onClick={saveProfileDataToCloud} className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border font-black uppercase hover:bg-blue-100 transition-all">Update Profile</button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Customer Full Name</label>
                        <input 
                          type="text" placeholder="Enter Full Name" 
                          value={custInfo.name || ''}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Gender</label>
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
                    </div>
                  </div>

                  {/* CARD SECTION 2: Saved Address */}
                  <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-black text-sm text-gray-800 flex items-center gap-1.5">📍 Saved Address Details</h3>
                      <button onClick={saveAddressToLocal} className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border font-black uppercase hover:bg-emerald-100 transition-all">Save Permanent</button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase">Customer Mobile Phone Number *</label>
                        <input 
                          type="tel" placeholder="10-Digit Mobile" 
                          value={custInfo.phone || ''}
                          className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                          onChange={(e) => setCustInfo({...custInfo, phone: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase">Village Name *</label>
                          <input 
                            type="text" placeholder="Village" 
                            value={custInfo.vill || ''}
                            className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                            onChange={(e) => setCustInfo({...custInfo, vill: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase">City / Town Name *</label>
                          <input 
                            type="text" placeholder="City/Town" 
                            value={custInfo.city || ''}
                            className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                            onChange={(e) => setCustInfo({...custInfo, city: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase">Famous Landmark / Building</label>
                          <input 
                            type="text" placeholder="Near school, shop etc." 
                            value={custInfo.landmark || ''}
                            className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                            onChange={(e) => setCustInfo({...custInfo, landmark: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase">6-Digit Area PIN Code *</label>
                          <input 
                            type="number" placeholder="PIN Code" 
                            value={custInfo.pin || ''}
                            className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold mt-0.5 text-black"
                            onChange={(e) => setCustInfo({...custInfo, pin: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD SECTION 3: My Orders with Cancel & Return Features (Feature 12, 13) */}
                  <div className="space-y-3">
                    <h3 className="font-black text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">📦 My Orders History & Live Tracking</h3>
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto no-scrollbar pr-0.5">
                      {orders.filter(o => custInfo.phone ? o.phone === custInfo.phone : (user ? o.userEmail === user.email : true)).length === 0 ? (
                        <div className="p-6 text-center bg-white/40 border border-dashed rounded-2xl text-xs font-bold text-gray-400">
                          No active purchase history record discovered for this configuration number.
                        </div>
                      ) : (
                        orders.filter(o => custInfo.phone ? o.phone === custInfo.phone : (user ? o.userEmail === user.email : true)).map(o => (
                          <div key={o.id} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 border-l-4 border-l-orange-500 text-black text-xs">
                            <div className="flex justify-between font-black">
                              <span className="text-gray-400 font-mono">ID: #{o.id.substring(0, 7).toUpperCase()}</span>
                              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-emerald-100">{o.status}</span>
                            </div>
                              
                            {/* Live Progress pipeline indicators */}
                            <div className="space-y-1">
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${getOrderStatusProgress(o.status)}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-tight">
                                <span>Ordered</span>
                                <span>Packed</span>
                                <span>Shipping</span>
                                <span>Delivered</span>
                              </div>
                            </div>

                            <div className="text-[11px] text-gray-600 font-bold border-b pb-1 space-y-0.5">
                              {o.items?.map((it, idx) => (
                                <p key={idx}>• {it.name} {it.size ? `(Size: ${it.size})` : ''} <span className="text-gray-400 font-mono">(x{it.qty})</span></p>
                              ))}
                            </div>
                            
                            {/* Feature 12 & 13: Cancel & Return Order Action Buttons */}
                            <div className="flex justify-between items-center text-[10px] font-bold pt-1">
                              <p className="text-emerald-700">Payment: {o.paymentMode || "Online UPI payment"}</p>
                              
                              {o.status.includes("Pending") && (
                                <button onClick={() => handleCancelOrder(o.id)} className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-xl font-black">
                                  Cancel Order ❌
                                </button>
                              )}

                              {o.status.includes("Delivered") && (
                                <button onClick={() => handleReturnOrder(o.id)} className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-xl font-black">
                                  Return / Exchange 🔄
                                </button>
                              )}
                            </div>

                            <div className="flex justify-between items-center font-black pt-1 border-t border-dashed">
                              <span className="text-gray-400 text-[10px]">Date: {o.createdAt?.split(',')[0]}</span>
                              <span className="text-orange-600 text-sm">Total: ₹{o.totalAmount}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Legal Action Matrix Trigger Links */}
                  <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-black tracking-wider text-slate-400 uppercase pt-2">
                    <span onClick={() => handleOpenLegal('about')} className="cursor-pointer hover:underline">About</span>
                    <span onClick={() => handleOpenLegal('privacy')} className="cursor-pointer hover:underline">Privacy</span>
                    <span onClick={() => handleOpenLegal('refund')} className="cursor-pointer hover:underline">Refund</span>
                    <span onClick={() => handleOpenLegal('terms')} className="cursor-pointer hover:underline">Terms</span>
                  </div>

                </div>
              )}

              {/* DESKTOP & MOBILE RESPONSIVE PRODUCT GRID SYSTEM */}
              {activeTab !== "categories" && activeTab !== "account" && (
                <>
                  {/* Horizontal Category Slider Bar */}
                  <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-transparent w-full no-scrollbar">
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => { setActiveCategory(cat); setActiveSubCategory("All"); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-black border transition-all duration-300 transform active:scale-95 whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-100'}`}
                      >
                        {getCategoryEmoji(cat)} {cat}
                      </button>
                    ))}
                  </div>

                  {/* SUB-CATEGORY CHIPS BAR */}
                  {activeCategory !== "All" && subCategoriesMap[activeCategory] && (
                    <div className="px-4 py-3 bg-orange-50/70 border-y border-orange-200 w-full mb-3 shadow-inner rounded-2xl">
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-2">Sub-Categories:</p>
                      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                        <button
                          onClick={() => setActiveSubCategory("All")}
                          className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all whitespace-nowrap shadow-sm active:scale-95 ${activeSubCategory === "All" ? 'bg-emerald-600 text-white border-emerald-700 shadow-md' : 'bg-white text-gray-700 border-gray-200'}`}
                        >
                          🌟 All Items
                        </button>
                        {subCategoriesMap[activeCategory].map(sub => (
                          <button
                            key={sub.name}
                            onClick={() => setActiveSubCategory(sub.name)}
                            className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all flex items-center gap-2 whitespace-nowrap shadow-sm active:scale-95 ${activeSubCategory === sub.name ? 'bg-emerald-600 text-white border-emerald-700 shadow-md' : 'bg-white text-gray-800 border-orange-200/80'}`}
                          >
                            <span className="text-base">{sub.icon}</span>
                            <span>{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SKELETON LOADERS FOR PRODUCT GRID */}
                  {isProductsLoading ? (
                    <main className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(idx => (
                        <div key={idx} className="bg-white p-4 rounded-[2rem] border-2 border-slate-100/60 flex flex-col justify-between animate-pulse">
                          <div className="h-36 bg-slate-200 rounded-2xl w-full mb-3"></div>
                          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto mb-3"></div>
                          <div className="h-8 bg-slate-200 rounded-xl w-full"></div>
                        </div>
                      ))}
                    </main>
                  ) : (
                    <main className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filtered.map(p => {
                        const hasDiscount = p.discount > 0;
                        const finalPrice = getDiscountedPrice(p.price, p.discount);
                        const isWish = wishlist.find(x => x.id === p.id);
                        const pImages = p.images || [p.img || "📦"];
                        const isOutOfStock = p.stock <= 0;
                        return (
                          <div key={p.id} className="bg-white p-3 rounded-[2rem] shadow-md hover:shadow-xl border-2 border-orange-100/60 hover:border-orange-300 transition-all duration-300 relative flex flex-col justify-between text-black">
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
                             
                             <button onClick={() => toggleWishlist(p)} className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-xs hover:scale-110 transition-transform">
                               {isWish ? "❤️" : "🤍"}
                             </button>

                             <div onClick={() => addToRecentlyViewed(p)} className="h-36 md:h-44 flex items-center justify-center mb-2 bg-gradient-to-b from-orange-50/50 via-white to-emerald-50/30 rounded-2xl overflow-hidden cursor-pointer">
                               {pImages[0].includes('http') ? <img src={pImages[0]} alt="product" className="h-full w-full object-cover rounded-2xl hover:scale-105 transition-transform duration-500" /> : <span className="text-5xl">{pImages[0]}</span>}
                             </div>

                             <div className="px-1 text-center flex-1 flex flex-col justify-between">
                               <div>
                                 <h3 onClick={() => addToRecentlyViewed(p)} className="font-extrabold text-gray-800 text-xs md:text-sm truncate cursor-pointer underline">{p.name}</h3>
                                   
                                 {/* Dynamic Sizing Selector */}
                                 {(p.availableSizes && p.availableSizes.length > 0) && (
                                   <div className="mt-1.5 mb-1 text-left">
                                     <label className="text-[8px] font-black text-slate-400 uppercase block tracking-tight">Select Size *</label>
                                     <select
                                       value={selectedSizes[p.id] || ""}
                                       onChange={(e) => setSelectedSizes({ ...selectedSizes, [p.id]: e.target.value })}
                                       className="w-full p-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-black focus:outline-none"
                                     >
                                       <option value="" disabled>Choose Size</option>
                                       {p.availableSizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                     </select>
                                   </div>
                                 )}

                                 <div className="flex items-center justify-center gap-2 mt-0.5">
                                   <span className="text-base md:text-lg font-black text-orange-600">₹{finalPrice}</span>
                                   {hasDiscount && <span className="text-[10px] md:text-xs text-gray-400 line-through font-bold">₹{p.price}</span>}
                                 </div>
                               </div>
                               <div className="mt-2 space-y-1">
                                 {isOutOfStock ? (
                                   <button disabled className="w-full py-2 bg-gray-200 text-gray-400 rounded-xl text-[10px] font-bold cursor-not-allowed">OUT OF STOCK</button>
                                 ) : (
                                   <>
                                     <button onClick={() => { addToCart(p); }} className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-xl text-[10px] border border-gray-200 shadow-sm active:scale-95 transition-all">
                                       ADD TO CART
                                     </button>
                                     <button onClick={() => { addToCart(p); if(!p.availableSizes || p.availableSizes.length === 0 || selectedSizes[p.id]) setIsCartOpen(true); }} className="w-full py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-xl text-[10px] shadow-sm active:scale-95 transition-all">
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
                  )}

                  {/* Feature 8: Recently Viewed Items Horizontal Bar */}
                  {recentlyViewed.length > 0 && (
                    <div className="mx-4 my-6 p-4 bg-white rounded-3xl border border-orange-100 shadow-sm space-y-3">
                      <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1">👁️ Recently Viewed Items</h4>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                        {recentlyViewed.map(rv => (
                          <div key={rv.id} onClick={() => addToRecentlyViewed(rv)} className="w-24 shrink-0 bg-gray-50 p-2 rounded-2xl border text-center cursor-pointer">
                            <div className="h-16 w-full flex items-center justify-center overflow-hidden rounded-xl bg-white mb-1">
                              <img src={rv.images?.[0] || rv.img} alt="rv" className="h-full w-full object-cover" />
                            </div>
                            <p className="text-[10px] font-bold truncate text-gray-800">{rv.name}</p>
                            <p className="text-[10px] font-black text-orange-600">₹{getDiscountedPrice(rv.price, rv.discount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Corporate Footer Architecture Modules */}
              {activeTab === "shop" && (
                <footer className="mx-4 my-8 pt-6 text-gray-800 space-y-6 mb-28 border-t border-gray-200/60 max-w-7xl mx-auto">
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-black">
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2 text-center">🏆 Why Choose Daily Needs Hub</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] md:text-xs font-bold">
                      <div className="flex items-center gap-1">⚡ <span><b>Fast Delivery:</b> Straight to your doorstep logistics</span></div>
                      <div className="flex items-center gap-1">💰 <span><b>Best Price:</b> Budget friendly pricing structures</span></div>
                      <div className="flex items-center gap-1">🛡️ <span><b>Secure Payment:</b> Verified Instant Gateways</span></div>
                      <div className="flex items-center gap-1">⏰ <span><b>24x7 Support:</b> Always ready to assist customers</span></div>
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
                      <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm hover:scale-105 transition-transform">
                        <span>🌐</span> Facebook Official
                      </a>
                      <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-100 shadow-sm hover:scale-105 transition-transform">
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
              <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-orange-100 p-2 z-40 flex justify-around items-center rounded-t-[2rem] shadow-xl text-black max-w-md md:max-w-xl mx-auto">
                <button onClick={() => { setActiveTab("shop"); setActiveCategory("All"); setActiveSubCategory("All"); }} className="flex flex-col items-center p-2 rounded-xl text-gray-400 hover:text-orange-600 font-bold transition-colors">
                  <span className="text-lg">🏠</span><span className="text-[10px]">Home</span>
                </button>
                <button onClick={() => setActiveTab("categories")} className="flex flex-col items-center p-2 rounded-xl text-gray-400 hover:text-emerald-600 font-bold transition-colors">
                  <span className="text-lg">🗂️</span><span className="text-[10px]">Category</span>
                </button>
                <button onClick={() => setActiveTab("offers")} className="flex flex-col items-center p-2 rounded-xl text-gray-400 hover:text-red-500 font-bold transition-colors">
                  <span className="text-lg">🎁</span><span className="text-[10px]">Offers</span>
                </button>
                <button onClick={() => setActiveTab("account")} className="flex flex-col items-center p-2 rounded-xl text-gray-400 hover:text-blue-600 font-bold transition-colors">
                  <span className="text-lg">👤</span><span className="text-[10px]">Account</span>
                </button>
                <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center p-2 bg-gradient-to-r from-orange-500 to-emerald-500 text-white rounded-2xl px-3 py-1 shadow-md hover:scale-105 transition-transform">
                  <span className="text-[10px] font-black">🛒 Cart</span>
                  <span className="text-[9px]">₹{cartTotal}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Special Dual Bottom Admin Navigation Dock */}
      {isAdminUrl && isAdmin && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-950 text-white border-t border-slate-800 p-2 z-50 flex justify-around items-center rounded-t-3xl shadow-2xl max-w-md md:max-w-xl mx-auto">
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

      {/* Feature 18: Smart Cart Drawer with Empty State Graphic */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-[2rem] text-black flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-orange-600">Shopping Cart Drawer</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-xs font-bold text-gray-400 border p-1 px-2 rounded-lg hover:bg-gray-100">Close X</button>
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

              {/* Advanced Cart Quantity Controls & Empty State */}
              <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <span className="text-5xl block">🛒</span>
                    <p className="text-xs text-gray-400 font-black">Your cart drawer is completely empty.</p>
                    <button onClick={() => { setIsCartOpen(false); setActiveTab("shop"); }} className="bg-orange-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow">Start Shopping</button>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2.5 border-b text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-gray-800 truncate">{item.name}</p>
                        {item.selectedSize && <p className="text-[10px] text-indigo-600 font-bold">Selected Variant Size: {item.selectedSize}</p>}
                        <p className="text-[10px] text-orange-500 font-bold">₹{getDiscountedPrice(item.price, item.discount)} / unit</p>
                      </div>
                      <div className="flex items-center gap-2.5 ml-4">
                        <button onClick={() => updateCartQty(item.id, -1, item.selectedSize)} className="w-6 h-6 bg-gray-100 border text-gray-800 rounded-lg flex items-center justify-center font-black text-sm active:bg-gray-200">-</button>
                        <span className="font-black text-sm w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1, item.selectedSize)} className="w-6 h-6 bg-gray-100 border text-gray-800 rounded-lg flex items-center justify-center font-black text-sm active:bg-gray-200">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-xl font-black mb-4 text-emerald-600"><span>Grand Total:</span><span>₹{cartTotal}</span></div>
              <button onClick={handleCheckoutInit} className="w-full bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 text-white py-3.5 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all">
                Proceed to Checkout Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLIPKART-STYLE FULL SCREEN PRODUCT DETAILS PAGE OVERLAY (Feature 4, 9, 10, 20) */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto text-black flex flex-col justify-between animate-fadeIn">
          
          {/* Flipkart Style Top Bar Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="flex items-center gap-2 text-sm font-extrabold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-all"
            >
              <span>←</span> <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleWishlist(selectedProduct)} className="p-2 bg-gray-100 rounded-full text-sm">
                {wishlist.find(x => x.id === selectedProduct.id) ? "❤️" : "🤍"}
              </button>
              <button onClick={() => { setSelectedProduct(null); setIsCartOpen(true); }} className="p-2 bg-orange-100 text-orange-600 rounded-full text-sm relative">
                🛒 {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
              </button>
            </div>
          </div>

          {/* Product Page Scrollable Body */}
          <div className="max-w-3xl mx-auto w-full p-4 space-y-6 pb-28">
            
            {/* Feature 20: Large Product Image with Pinch Zoom Trigger */}
            <div className="relative w-full h-80 md:h-96 bg-gradient-to-b from-orange-50/30 to-gray-50 rounded-3xl overflow-hidden border flex items-center justify-center shadow-inner">
              <img 
                src={(selectedProduct.images || [selectedProduct.img || "📦"])[currentProductSlide]} 
                alt="Product View" 
                onClick={() => setIsNotifZoomOpen(true)}
                className="w-full h-full object-contain p-4 transition-all duration-300 cursor-zoom-in"
              />
              
              {(selectedProduct.images || []).length > 1 && (
                <>
                  <button onClick={() => setCurrentProductSlide(prev => (prev > 0 ? prev - 1 : (selectedProduct.images.length - 1)))} className="absolute left-3 bg-white/90 hover:bg-white text-black p-2 rounded-full text-sm shadow-md font-black">◀</button>
                  <button onClick={() => setCurrentProductSlide(prev => (prev < (selectedProduct.images.length - 1) ? prev + 1 : 0))} className="absolute right-3 bg-white/90 hover:bg-white text-black p-2 rounded-full text-sm shadow-md font-black">▶</button>
                  
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {currentProductSlide + 1} / {selectedProduct.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Feature 10: One-Click Product Social Share Links */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border">
              <span className="text-xs font-black text-gray-600 uppercase">Share Product:</span>
              <div className="flex gap-3">
                <button onClick={() => handleShareProduct(selectedProduct, 'whatsapp')} className="text-base bg-white p-2 rounded-xl border shadow-sm hover:scale-110 transition-transform">💬</button>
                <button onClick={() => handleShareProduct(selectedProduct, 'facebook')} className="text-base bg-white p-2 rounded-xl border shadow-sm hover:scale-110 transition-transform">🌐</button>
                <button onClick={() => handleShareProduct(selectedProduct, 'telegram')} className="text-base bg-white p-2 rounded-xl border shadow-sm hover:scale-110 transition-transform">✈️</button>
                <button onClick={() => handleShareProduct(selectedProduct, 'copy')} className="text-base bg-white p-2 rounded-xl border shadow-sm hover:scale-110 transition-transform">📋</button>
              </div>
            </div>

            {/* Title & Rating & Offer Tag (Feature 4) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {selectedProduct.offerTag && selectedProduct.offerTag !== "None" && (
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{selectedProduct.offerTag}</span>
                )}
                {selectedProduct.isBestSeller && <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">✨ Bestseller</span>}
              </div>

              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">{selectedProduct.name}</h1>
              
              {/* Feature 4: Flipkart Style Rating & Verified Review Badge */}
              <div className="flex items-center gap-2">
                <span className="bg-emerald-700 text-white text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  4.3 ★
                </span>
                <span className="text-xs text-gray-500 font-bold">(128 Verified Buyer Reviews)</span>
              </div>
            </div>

            {/* Price & Discount Callout */}
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl font-black text-orange-600">₹{getDiscountedPrice(selectedProduct.price, selectedProduct.discount)}</span>
                {selectedProduct.discount > 0 && (
                  <>
                    <span className="text-sm text-gray-400 line-through font-bold">₹{selectedProduct.price}</span>
                    <span className="text-xs text-emerald-600 font-black">{selectedProduct.discount}% Special Discount Applied</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-gray-500 font-semibold">Inclusive of all local taxes & delivery charges</p>
            </div>

            {/* Size Selection */}
            {(selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0) && (
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">Select Preferred Variant Size *</label>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.availableSizes.map(sz => (
                    <button 
                      key={sz} 
                      onClick={() => setSelectedSizes({ ...selectedSizes, [selectedProduct.id]: sz })}
                      className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${selectedSizes[selectedProduct.id] === sz ? 'bg-orange-500 text-white border-orange-600 shadow-md scale-105' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between border-t border-b py-3">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Select Quantity:</span>
              <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-xl border">
                <button 
                  onClick={() => setProductPageQty(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 bg-white text-gray-800 font-black text-base rounded-lg border shadow-sm flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <span className="font-black text-sm w-6 text-center">{productPageQty}</span>
                <button 
                  onClick={() => setProductPageQty(prev => Math.min(selectedProduct.stock, prev + 1))}
                  className="w-8 h-8 bg-white text-gray-800 font-black text-base rounded-lg border shadow-sm flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Pincode Checker */}
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wider block">🚚 Check Express Delivery Availability</span>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Enter 6-Digit PIN Code" 
                  value={pinCheckInput}
                  onChange={(e) => handlePinCheck(e.target.value)}
                  className="flex-1 p-2.5 border rounded-xl bg-gray-50 text-xs font-bold text-black focus:outline-none"
                />
                <button onClick={() => handlePinCheck(pinCheckInput)} className="bg-slate-800 text-white text-xs font-black px-4 rounded-xl shadow">
                  Check
                </button>
              </div>
              {pinCheckMsg && (
                <p className={`text-xs font-black pt-1 ${pinCheckMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pinCheckMsg.text}
                </p>
              )}
            </div>

            {/* Full Product Description & Specifications */}
            <div className="space-y-2 border-t pt-3">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">📝 Product Details & Specifications</h3>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-700 font-medium leading-relaxed whitespace-pre-line">
                {selectedProduct.specifications || "Premium high quality checked grocery asset. 100% fresh and verified quality guaranteed."}
              </div>
            </div>

            {/* Feature 9: Similar Products Recommendation ("You May Also Like") */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">🌟 You May Also Like (Similar Items)</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).slice(0, 5).map(sp => (
                  <div key={sp.id} onClick={() => addToRecentlyViewed(sp)} className="w-28 shrink-0 bg-white p-2 rounded-2xl border text-center cursor-pointer shadow-sm">
                    <div className="h-20 w-full flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 mb-1">
                      <img src={sp.images?.[0] || sp.img} alt="sp" className="h-full w-full object-cover" />
                    </div>
                    <p className="text-[10px] font-extrabold truncate text-gray-800">{sp.name}</p>
                    <p className="text-[10px] font-black text-orange-600">₹{getDiscountedPrice(sp.price, sp.discount)}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Flipkart-Style Fixed Sticky Bottom Action Bar */}
          <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 z-50 flex gap-3 shadow-2xl max-w-3xl mx-auto">
            <button 
              onClick={() => { 
                addToCart(selectedProduct, productPageQty); 
              }}
              className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black rounded-2xl text-xs md:text-sm border border-gray-300 shadow-sm uppercase tracking-wider active:scale-95 transition-all"
            >
              🛒 Add To Cart
            </button>
            <button 
              onClick={() => { 
                addToCart(selectedProduct, productPageQty); 
                if(!selectedProduct.availableSizes || selectedProduct.availableSizes.length === 0 || selectedSizes[selectedProduct.id]) {
                  setSelectedProduct(null); 
                  setIsCartOpen(true); 
                }
              }}
              className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-2xl text-xs md:text-sm shadow-lg uppercase tracking-wider active:scale-95 transition-all"
            >
              ⚡ Buy Now (₹{getDiscountedPrice(selectedProduct.price, selectedProduct.discount) * productPageQty})
            </button>
          </div>

        </div>
      )}

      {/* Feature 20: Image Pinch-Zoom Modal View */}
      {isZoomOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button onClick={() => setIsNotifZoomOpen(false)} className="absolute top-4 right-4 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-black">X Close</button>
          <img src={(selectedProduct.images || [selectedProduct.img])[currentProductSlide]} alt="Zoom" className="max-w-full max-h-full object-contain scale-110" />
        </div>
      )}

      {/* FULL PRODUCT EDIT MODAL FOR ADMIN */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 text-black overflow-y-auto max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm text-orange-600 uppercase">✏️ Edit Complete Product Details</h3>
              <button onClick={() => setEditingProduct(null)} className="text-xs bg-gray-100 px-2.5 py-1 rounded-lg font-bold">X Close</button>
            </div>

            <form onSubmit={handleSaveFullProductEdit} className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Product Name Title *</label>
                <input name="editName" defaultValue={editingProduct.name} className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-bold text-black" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Category *</label>
                  <select name="editCategory" defaultValue={editingProduct.category} className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-bold text-black">
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Sub-Category *</label>
                  <input name="editSubCategory" defaultValue={editingProduct.subCategory || "General"} className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-bold text-black" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">MRP (₹) *</label>
                  <input name="editPrice" type="number" defaultValue={editingProduct.price} className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-bold text-black" required />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Discount %</label>
                  <input name="editDiscount" type="number" defaultValue={editingProduct.discount || 0} className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-bold text-black" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Stock Qty *</label>
                  <input name="editStock" type="number" defaultValue={editingProduct.stock} className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-bold text-black" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Product Image URLs (1 to 5)</label>
                <div className="grid gap-1.5">
                  <input name="editImg1" defaultValue={editingProduct.images?.[0] || ""} placeholder="Image 1 URL" className="w-full p-2 border rounded-lg bg-gray-50 text-[10px] font-semibold" />
                  <input name="editImg2" defaultValue={editingProduct.images?.[1] || ""} placeholder="Image 2 URL" className="w-full p-2 border rounded-lg bg-gray-50 text-[10px] font-semibold" />
                  <input name="editImg3" defaultValue={editingProduct.images?.[2] || ""} placeholder="Image 3 URL" className="w-full p-2 border rounded-lg bg-gray-50 text-[10px] font-semibold" />
                  <input name="editImg4" defaultValue={editingProduct.images?.[3] || ""} placeholder="Image 4 URL" className="w-full p-2 border rounded-lg bg-gray-50 text-[10px] font-semibold" />
                  <input name="editImg5" defaultValue={editingProduct.images?.[4] || ""} placeholder="Image 5 URL" className="w-full p-2 border rounded-lg bg-gray-50 text-[10px] font-semibold" />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Product Specifications & Description</label>
                <textarea name="editSpecs" defaultValue={editingProduct.specifications || ""} rows="3" className="w-full p-2.5 border rounded-xl bg-gray-50 text-xs font-semibold text-black" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-100 font-black text-xs rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-black text-xs rounded-xl shadow">Save All Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 14: Printable Cash Memo Invoice Modal */}
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
                <p className="text-[10px] text-gray-600 font-bold leading-tight">Click the link below to initialize Google Pay / PhonePe securely. Order completes once redirected!</p>
                
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
                <p className="text-[11px] text-emerald-700 font-medium px-2">Please handover cash equivalent balance or execute mobile UPI transfers directly to the shipping carrier asset once products arrive safely.</p>
                <button 
                  onClick={confirmCODModeSelection} 
                  className="mt-1 bg-white text-emerald-700 font-bold border border-emerald-300 px-3 py-1 text-[10px] rounded-lg shadow-sm hover:bg-emerald-50"
                >
                  Confirm COD Selection Matrix
                </button>
              </div>
            )}

            <div className="space-y-1.5 border-t pt-3 max-h-[15vh] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] text-gray-700">
                  <span className="font-bold">{item.name} {item.selectedSize ? `(Size: ${item.selectedSize})` : ''} <b className="text-gray-400 font-medium">x{item.qty}</b></span>
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
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 rounded-2xl font-black shadow-md text-xs text-center uppercase tracking-wider transition-all"
            >
              ✅ Send Bill & Verification to WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Legal Content Modals */}
      {legalModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-black border shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm text-orange-600">{legalModal.title}</h3>
              <button onClick={() => setLegalModal({ isOpen: false, title: '', content: '' })} className="text-xs bg-gray-100 px-2.5 py-1 rounded-lg font-bold hover:bg-gray-200">Close X</button>
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

