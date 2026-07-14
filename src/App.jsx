import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

// Firebase Setup
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const categories = ["All", "Dairy", "Beverages", "Snacks", "Vegetables", "Others"];
const offerTags = ["None", "Today's Deal", "Buy 2 Get 1", "Combo Pack"];

// Ab external link nahi, balki GitHub ka local file use hoga!
const BRAND_LOGO_URL = "/logo.png"; 

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("shop");
  const [selectedOfferFilter, setSelectedOfferFilter] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [custInfo, setCustInfo] = useState({ name: '', address: '' });
  
  const [slides, setSlides] = useState([
    { id: 1, img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80", text: "⚡ SUMMER SPECIAL SALE: Min 10% OFF!" },
    { id: 2, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80", text: "🥤 COLD DRINKS & BEVERAGES: Garmi ka Ilaaj" },
    { id: 3, img: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=500&q=80", text: "🛒 GROCERY ESSENTIALS: Fresh Stock Everyday" },
    { id: 4, img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&q=80", text: "🥛 FRESH DAIRY PRODUCTS: Delivery at Doorstep" },
    { id: 5, img: "https://images.unsplash.com/photo-1543168256-418811576931?w=500&q=80", text: "🥬 FARM FRESH VEGETABLES: 100% Organic" }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
        setCustInfo(prev => ({ ...prev, name: currentUser.displayName || '' }));
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
    
    const q = query(collection(db, "products"), orderBy("name"));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { clearInterval(timer); unsubscribeSnapshot(); unsubscribeAuth(); };
  }, [slides.length]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if(result.user) {
        setUser(result.user);
        setCustInfo(prev => ({ ...prev, name: result.user.displayName || '' }));
      }
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    alert("Logged out!");
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p) => {
    if (p.stock <= 0) return alert("Stock nahi hai!");
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      if (exist.qty >= p.stock) return alert("Stock limit reached!");
      setCart(cart.map(x => x.id === p.id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
  };

  const removeFromCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    if (!exist) return;
    if (exist.qty === 1) {
      setCart(cart.filter(x => x.id !== p.id));
    } else {
      setCart(cart.map(x => x.id === p.id ? { ...exist, qty: exist.qty - 1 } : x));
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const el = e.target.elements;
    try {
      await addDoc(collection(db, "products"), { 
        name: el.itemName.value, 
        price: Number(el.itemPrice.value), 
        stock: Number(el.itemStock.value),
        discount: Number(el.itemDiscount.value) || 0, 
        img: el.itemImg.value || "📦", 
        category: el.itemCategory.value,
        offerTag: el.itemOfferTag.value || "None",
        isBestSeller: el.bestSeller.checked,
        isNewArrival: el.newArrival.checked
      });
      e.target.reset();
      alert("Saaman jud gaya!");
    } catch (error) {
      alert("Database error!");
    }
  };

  const updateProductData = async (id, field, value) => {
    let finalVal = value;
    if (field === "stock" || field === "price" || field === "discount") {
      finalVal = Number(value);
    }
    await updateDoc(doc(db, "products", id), { [field]: finalVal });
  };

  const updateSlideUrl = (index, url) => {
    const updated = [...slides];
    updated[index].img = url;
    setSlides(updated);
    alert(`Banner ${index + 1} updated!`);
  };

  const cartTotal = cart.reduce((a, c) => a + getDiscountedPrice(c.price, c.discount) * c.qty, 0);
  
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "offers") {
      const isOfferItem = p.offerTag && p.offerTag !== "None";
      const matchesOfferFilter = selectedOfferFilter === "All" || p.offerTag === selectedOfferFilter;
      return matchesSearch && isOfferItem && matchesOfferFilter;
    } else {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    }
  });

  const handleOrder = () => {
    if(!custInfo.name || !custInfo.address) return alert("Naam aur Pata bharna zaruri hai!");
    const itemsMsg = cart.map(i => `${i.name} (x${i.qty}) - ₹${getDiscountedPrice(i.price, i.discount) * i.qty}`).join(", ");
    const msg = `Naya Order - Daily Needs Hub\n\nNaam: ${custInfo.name}\nAddress: ${custInfo.address}\nItems: ${itemsMsg}\nTotal: ₹${cartTotal}`;
    window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
    setShowInvoice(true);
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

  const getCategoryColor = (cat) => {
    if (activeCategory !== cat) return 'bg-white text-gray-500 border border-orange-100 hover:bg-orange-50';
    switch(cat) {
      case 'All': return 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white shadow-md transform scale-105';
      case 'Dairy': return 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md transform scale-105';
      case 'Beverages': return 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md transform scale-105';
      case 'Snacks': return 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md transform scale-105';
      case 'Vegetables': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md transform scale-105';
      default: return 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md transform scale-105';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-amber-50/60 via-white to-emerald-50/60 text-gray-900'} pb-32 transition-all duration-500 font-sans`}>
      
      {/* Premium Header with Dynamic Brand Logo */}
      <header className="p-3 bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-40 flex justify-between items-center border-b border-orange-100">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img src={BRAND_LOGO_URL} alt="Daily Needs Hub Logo" className="w-12 h-12 object-contain rounded-xl shadow-sm bg-orange-50 p-0.5 border border-orange-100" />
          <div className="flex flex-col items-start min-w-0">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-emerald-600 to-blue-600 tracking-tight font-sans uppercase leading-none">
              Daily Needs Hub
            </h1>
            {user && <p className="text-[10px] font-black text-emerald-600 mt-1">👤 {user.displayName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 rounded-full text-xs">{darkMode ? '☀️' : '🌙'}</button>
           {user ? (
             <button onClick={handleLogout} className="text-[10px] bg-red-50 text-red-500 px-3 py-2 font-black rounded-xl border border-red-100">Logout</button>
           ) : (
             <button onClick={handleGoogleLogin} className="text-[10px] bg-blue-50 text-blue-600 px-3 py-2 font-black rounded-xl border border-blue-100 shadow-sm">👤 Login</button>
           )}
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {/* Colourful Search Bar Accent */}
        <div className="p-4">
          <input 
            type="text" placeholder="🔍 Search fresh milk, cold drinks, snacks..." 
            className="w-full p-4 bg-white/95 rounded-2xl border-2 border-orange-200 text-sm focus:border-emerald-500 focus:outline-none shadow-md transition-all text-black font-medium placeholder-gray-400"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {window.location.pathname === '/admin' ? (
          /* Full Power Admin Dashboard Controls */
          <div className="p-4">
            <div className="bg-white p-6 rounded-3xl shadow-xl text-black space-y-6 border border-orange-100">
               <h2 className="text-xl font-bold mb-4 text-orange-600">Admin Control Room</h2>
               {!isAdmin ? (
                 <input type="password" placeholder="Password" className="border p-3 w-full rounded-xl" onChange={(e) => e.target.value === 'admin123' && setIsAdmin(true)} />
               ) : (
                 <>
                    {/* Banners Manager */}
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 space-y-3">
                      <h3 className="text-xs font-bold text-orange-700">⚙️ Manage 5 Dynamic Banners</h3>
                      {slides.map((s, index) => (
                        <div key={s.id} className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500">Banner Slider {s.id} Link:</label>
                          <input type="text" className="w-full p-2 text-xs border rounded-lg bg-white" defaultValue={s.img} onBlur={(e) => updateSlideUrl(index, e.target.value)} />
                        </div>
                      ))}
                    </div>

                    <form onSubmit={addProduct} className="grid gap-3">
                      <input name="itemName" placeholder="Item Name" className="border p-3 rounded-xl bg-gray-50" required />
                      <div className="grid grid-cols-3 gap-2">
                        <input name="itemPrice" type="number" placeholder="MRP (₹)" className="border p-3 rounded-xl bg-gray-50" required />
                        <input name="itemDiscount" type="number" placeholder="Disc %" className="border p-3 rounded-xl bg-gray-50" />
                        <input name="itemStock" type="number" placeholder="Stock" className="border p-3 rounded-xl bg-gray-50" required />
                      </div>
                      
                      <div className="flex gap-4 p-2 bg-gray-50 rounded-xl border border-dashed text-xs font-bold text-gray-600 justify-between items-center">
                        <label><input type="checkbox" name="bestSeller" /> ✨ Best</label>
                        <label><input type="checkbox" name="newArrival" /> 🚀 New</label>
                        <div>
                          <select name="itemOfferTag" className="p-1 border rounded text-[10px]">
                            {offerTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                          </select>
                        </div>
                      </div>

                      <input name="itemImg" placeholder="Image Link / Emoji" className="border p-3 rounded-xl bg-gray-50" required />
                      <select name="itemCategory" className="border p-3 rounded-xl bg-gray-50">
                        {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="submit" className="bg-orange-600 text-white p-4 rounded-xl font-bold shadow-lg">ADD ITEM LIVE</button>
                    </form>

                    {/* Inventory Price and Matrix Management Controls */}
                    <div className="space-y-2 pt-4 border-t">
                      <h3 className="font-bold text-sm text-gray-700">Live Inventory Manager Matrix</h3>
                      {products.map(p => (
                        <div key={p.id} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-800">{p.name}</span>
                            <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500 text-xs font-black">🗑 Delete</button>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-500">
                            <div>Stock: <input type="number" className="w-12 p-1 border rounded text-black font-bold" defaultValue={p.stock} onBlur={(e) => updateProductData(p.id, "stock", e.target.value)} /></div>
                            <div>Price: ₹<input type="number" className="w-12 p-1 border rounded text-black font-bold" defaultValue={p.price} onBlur={(e) => updateProductData(p.id, "price", e.target.value)} /></div>
                            <div>Disc%: <input type="number" className="w-10 p-1 border rounded text-black font-bold" defaultValue={p.discount || 0} onBlur={(e) => updateProductData(p.id, "discount", e.target.value)} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </>
               )}
            </div>
          </div>
        ) : (
          /* Customer UI Layout */
          <>
            {activeTab === "shop" && (
              <>
                <div className="px-4 mb-4">
                  <div className="bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-2xl font-black mb-1 tracking-wide">Aapki Apni Dukan! 🛒</h2>
                      <p className="text-xs opacity-90 font-medium italic">Fresh Items, Best Price, Seedha Ghar Tak.</p>
                    </div>
                  </div>
                </div>

                {/* 5-Poster High Contrast Slider */}
                <div className="px-4 mb-4">
                  <div className="relative h-44 w-full overflow-hidden rounded-3xl shadow-xl border-2 border-white bg-gray-100">
                    {slides.map((s, idx) => (
                      <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <img src={s.img} alt="Promo banner" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
                          <p className="text-xs font-black tracking-wide bg-orange-600/80 px-2 py-0.5 rounded-md inline-block">{s.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="absolute top-3 right-3 z-20 flex gap-1 bg-black/30 p-1 rounded-full">
                      {slides.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-orange-500 w-3' : 'bg-white/70'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "categories" && (
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 rounded-3xl text-white mb-6 shadow-md">
                  <h2 className="text-xl font-black">All Categories</h2>
                  <p className="text-xs opacity-80">Apni zarurat ke hisab se saaman chunein</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setActiveCategory(c); setActiveTab("shop"); }}
                      className={`p-6 rounded-2xl bg-white text-left shadow-md border-2 font-black flex flex-col justify-between h-28 transform active:scale-95 transition-all ${activeCategory === c ? 'border-orange-500 bg-orange-50/40 text-orange-600' : 'border-gray-100 text-gray-700'}`}
                    >
                      <span className="text-3xl">{getCategoryEmoji(c)}</span>
                      <span className="text-sm tracking-tight">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "offers" && (
              <div className="px-4 mb-2">
                <div className="bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 p-6 rounded-3xl text-white shadow-xl mb-4">
                  <h2 className="text-2xl font-black mb-1">⚡ SPECIAL OFFERS ZONE</h2>
                  <p className="text-xs opacity-90">Bumper deals aur combos sirf aapke liye!</p>
                </div>
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {["All", "Today's Deal", "Buy 2 Get 1", "Combo Pack"].map(tag => (
                    <button key={tag} onClick={() => setSelectedOfferFilter(tag)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border-2 ${selectedOfferFilter === tag ? 'bg-red-500 text-white border-red-600 shadow-md' : 'bg-white text-gray-500 border-gray-100'}`}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Colourful Dynamic Products Grid Layout */}
            {activeTab !== "categories" && (
              <main className="p-4 grid grid-cols-2 gap-4">
                {filtered.map(p => {
                  const hasDiscount = p.discount > 0;
                  const finalPrice = getDiscountedPrice(p.price, p.discount);
                  const cartItem = cart.find(x => x.id === p.id);
                  return (
                    <div key={p.id} className="bg-white p-3 rounded-[2rem] shadow-md border-2 border-orange-100/60 hover:border-emerald-200 relative flex flex-col justify-between transition-all">
                       <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                          {p.offerTag && p.offerTag !== "None" && <span className="bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm text-center uppercase tracking-wider">{p.offerTag}</span>}
                          {hasDiscount && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md text-center shadow-sm">{p.discount}% OFF</span>}
                       </div>
                       <div className="h-32 flex items-center justify-center mb-3 bg-gradient-to-b from-orange-50/50 via-white to-emerald-50/30 rounded-2xl overflow-hidden border border-gray-50">
                         {p.img.includes('http') ? <img src={p.img} alt="product" className="h-full w-full object-cover rounded-2xl" /> : <span className="text-5xl">{p.img}</span>}
                       </div>
                       <div className="px-1 text-center">
                         <h3 className="font-extrabold text-gray-800 text-sm truncate">{p.name}</h3>
                         
                         {/* RESTORED STRIKE-THROUGH ORIGINAL AMOUNT DISPLAY */}
                         <div className="flex items-center justify-center gap-2 mt-1">
                           <span className="text-lg font-black text-orange-600">₹{finalPrice}</span>
                           {hasDiscount && (
                             <span className="text-xs text-gray-400 line-through font-bold">₹{p.price}</span>
                           )}
                         </div>

                         <div className="mt-2.5">
                           {p.stock <= 0 ? (
                             <button disabled className="w-full py-2 bg-gray-200 text-gray-400 rounded-xl text-xs font-bold">OUT</button>
                           ) : cartItem ? (
                             <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-emerald-500 rounded-xl text-white p-1 font-black shadow-inner">
                               <button onClick={() => removeFromCart(p)} className="px-2 text-sm active:scale-75 transition-all">-</button>
                               <span className="text-xs">{cartItem.qty}</span>
                               <button onClick={() => addToCart(p)} className="px-2 text-sm active:scale-75 transition-all">+</button>
                             </div>
                           ) : (
                             <button onClick={() => addToCart(p)} className="w-full py-2 bg-gradient-to-r from-orange-500 to-emerald-500 text-white font-black rounded-xl text-xs shadow-sm active:scale-95 transition-all">ADD TO BAG</button>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })}
              </main>
            )}

            {/* Professional Open Layout Footer Section (No Boxes, Clean Typo) */}
            <footer className="mx-4 my-8 pt-6 text-gray-800 space-y-6 mb-28 border-t border-gray-200/60">
              
              {/* Logo & Headline */}
              <div className="flex items-center gap-3">
                <img src={BRAND_LOGO_URL} alt="Daily Needs Hub Footer Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
                <div>
                  <h3 className="text-base font-black tracking-tight text-gray-800 uppercase font-sans">Daily Needs Hub</h3>
                  <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Everyday Needs, Delivered Fast</p>
                </div>
              </div>
              
              {/* Follow Us Section with Authentic Vector SVGs */}
              <div className="space-y-2">
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Follow With Us</p>
                <div className="flex gap-4">
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-pink-600 transition-colors">
                    <svg className="w-4 h-4 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    YouTube
                  </a>
                </div>
              </div>

              {/* Contact Us Clean Typography Section */}
              <div className="space-y-1.5 font-sans">
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Contact Us</p>
                <div className="text-xs font-bold text-gray-600 space-y-1">
                  <p className="flex items-center gap-1">📞 Mobile: <a href="tel:+918637589429" className="text-emerald-600 underline font-extrabold">+91 8637589429</a></p>
                  <p className="flex items-center gap-1">✉️ Email: <a href="mailto:dailyneedshub@gmail.com" className="text-orange-600 underline font-extrabold">dailyneedshub@gmail.com</a></p>
                </div>
              </div>

              {/* Clean Interactive Privacy Policy Text */}
              <div className="space-y-1">
                <button onClick={() => setShowPrivacy(!showPrivacy)} className="text-xs font-extrabold text-blue-600 flex items-center justify-between w-full focus:outline-none">
                  <span>📄 Legal & Privacy Policy</span>
                  <span className="text-[9px]">{showPrivacy ? '▲' : '▼'}</span>
                </button>
                {showPrivacy && (
                  <div className="mt-1 p-3 bg-gray-50 rounded-xl text-[10px] text-gray-500 font-bold leading-relaxed space-y-1 border-l-2 border-orange-400">
                    <p><b>1. Data Privacy:</b> Customer data safely stored for quick dynamic order checks via WhatsApp API.</p>
                    <p><b>2. Returns Policy:</b> 24-hour return window applicable with the provided store cash memo retail invoice.</p>
                  </div>
                )}
              </div>

              {/* Strict Premium Landmark Address Footer Line */}
              <div className="text-xs font-extrabold text-gray-500 leading-relaxed pt-2 border-t border-gray-100">
                📍 Bolpur to Palitpur Road, Near Al Ameen Mission, Papuri, Nanoor, Birbhum, West Bengal, 731240
              </div>
            </footer>

            {/* Sticky Bottom Nav Component */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-orange-100 p-2 z-50 flex justify-around items-center rounded-t-[2rem] shadow-xl">
              <button onClick={() => { setActiveTab("shop"); setActiveCategory("All"); }} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "shop" ? "text-orange-600 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🛒</span><span className="text-[10px]">Shop</span>
              </button>
              <button onClick={() => setActiveTab("categories")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "categories" ? "text-emerald-600 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🗂️</span><span className="text-[10px]">Category</span>
              </button>
              <button onClick={() => setActiveTab("offers")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "offers" ? "text-red-500 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🎁</span><span className="text-[10px]">Offers</span>
              </button>
              <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center p-2 bg-gradient-to-r from-orange-500 to-emerald-500 text-white rounded-2xl px-3 py-1 shadow-md">
                <span className="text-xs font-black">🛍️ Basket</span>
                <span className="text-[10px]">₹{cartTotal}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cart Drawer Component */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-[2rem] text-black">
            {!showInvoice ? (
              <>
                <h2 className="text-xl font-black mb-6">Aapka Bag</h2>
                <div className="space-y-3 mb-6">
                  <input placeholder="Aapka Naam" value={custInfo.name} className="w-full p-3 border border-orange-100 rounded-xl bg-gray-50 text-sm text-black font-bold" onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} />
                  <textarea placeholder="Delivery Address" value={custInfo.address} className="w-full p-3 border border-orange-100 rounded-xl bg-gray-50 text-sm text-black font-bold" rows="3" onChange={(e) => setCustInfo({...custInfo, address: e.target.value})} />
                </div>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-3 border-b text-xs items-center">
                    <span className="font-extrabold text-gray-800">{item.name} (x{item.qty})</span>
                    <span className="font-black text-orange-600">₹{getDiscountedPrice(item.price, item.discount) * item.qty}</span>
                  </div>
                ))}
                <div className="mt-8">
                  <div className="flex justify-between text-2xl font-black mb-6 text-emerald-600"><span>Total:</span><span>₹{cartTotal}</span></div>
                  <button onClick={handleOrder} className="w-full bg-gradient-to-r from-orange-500 to-emerald-500 text-white py-4 rounded-2xl font-black text-lg mb-2 shadow-lg">WhatsApp Order</button>
                  <button onClick={() => setIsCartOpen(false)} className="w-full py-2 text-gray-400 text-xs text-center font-bold">CLOSE</button>
                </div>
              </>
            ) : (
              <div className="pt-4 space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-black text-emerald-600">ORDER CONFIRMED!</h2>
                </div>
                <div className="border-2 border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3 text-[11px] font-bold">
                  <p><b>Customer:</b> {custInfo.name}</p>
                  <p><b>Total Bill:</b> ₹{cartTotal}</p>
                </div>
                <button onClick={() => {setShowInvoice(false); setCart([]); setIsCartOpen(false);}} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-md">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
