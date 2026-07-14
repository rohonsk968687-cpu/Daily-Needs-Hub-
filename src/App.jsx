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
  
  // 5 Banners - Controlled from Admin
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-blue-50 via-white to-green-50 text-gray-900'} pb-32 transition-all duration-500`}>
      
      {/* Upgraded Header with Logo Icon */}
      <header className="p-4 bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-40 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="bg-gradient-to-br from-blue-600 to-green-500 p-2 rounded-xl shadow-md flex-shrink-0 text-white text-xl">
             🏬
          </div>
          <div className="flex flex-col items-start min-w-0">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-600 to-orange-500 tracking-tight italic uppercase leading-none">
              DAILY NEEDS HUB
            </h1>
            {user && <p className="text-[10px] font-bold text-green-600 truncate max-w-[150px] mt-1">👤 {user.displayName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 rounded-full text-xs">{darkMode ? '☀️' : '🌙'}</button>
           {user ? (
             <button onClick={handleLogout} className="text-[10px] bg-red-50 text-red-500 p-2 font-black rounded-xl">Logout</button>
           ) : (
             <button onClick={handleGoogleLogin} className="text-[10px] bg-blue-50 text-blue-600 p-2 font-black rounded-xl border border-blue-100 shadow-sm">👤 Login</button>
           )}
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {/* Search Bar */}
        <div className="p-4">
          <input 
            type="text" placeholder="🔍 Search (Milk, Soap, Kitkat...)" 
            className="w-full p-4 bg-white/90 rounded-2xl border-2 border-green-50 text-sm focus:border-blue-400 focus:outline-none shadow-sm transition-all text-black"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {window.location.pathname === '/admin' ? (
          /* Restored Admin View with Stock Management Controls */
          <div className="p-4">
            <div className="bg-white p-6 rounded-3xl shadow-xl text-black space-y-6">
               <h2 className="text-xl font-bold mb-4 text-blue-600">Admin Dashboard</h2>
               {!isAdmin ? (
                 <input type="password" placeholder="Password" className="border p-3 w-full rounded-xl" onChange={(e) => e.target.value === 'admin123' && setIsAdmin(true)} />
               ) : (
                 <>
                    {/* 5 Banners Ads Management */}
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 space-y-3">
                      <h3 className="text-xs font-bold text-orange-700">⚙️ Manage 5 Promotional Banners</h3>
                      {slides.map((s, index) => (
                        <div key={s.id} className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500">Banner Ad {s.id} URL Link:</label>
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

                      <input name="itemImg" placeholder="Image URL ya Emoji" className="border p-3 rounded-xl bg-gray-50" required />
                      <select name="itemCategory" className="border p-3 rounded-xl bg-gray-50">
                        {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="submit" className="bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg">ADD ITEM</button>
                    </form>

                    {/* Full Stock List Manager Controls */}
                    <div className="space-y-2 pt-4 border-t">
                      <h3 className="font-bold text-sm text-gray-700">Live Inventory & Prices</h3>
                      {products.map(p => (
                        <div key={p.id} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-800">{p.name}</span>
                            <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500 text-xs font-black">🗑 Delete</button>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-500">
                            <div>Stock: <input type="number" className="w-12 p-1 border rounded text-black" defaultValue={p.stock} onBlur={(e) => updateProductData(p.id, "stock", e.target.value)} /></div>
                            <div>Price: ₹<input type="number" className="w-12 p-1 border rounded text-black" defaultValue={p.price} onBlur={(e) => updateProductData(p.id, "price", e.target.value)} /></div>
                            <div>Disc%: <input type="number" className="w-10 p-1 border rounded text-black" defaultValue={p.discount || 0} onBlur={(e) => updateProductData(p.id, "discount", e.target.value)} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </>
               )}
            </div>
          </div>
        ) : (
          /* Customer View */
          <>
            {activeTab === "shop" && (
              <>
                <div className="px-4 mb-4">
                  <div className="bg-gradient-to-r from-orange-500 via-blue-500 to-green-500 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-2xl font-black mb-1 tracking-wide">Aapki Apni Dukan! 🛒</h2>
                      <p className="text-xs opacity-90 font-medium italic">Fresh Items, Best Price, Seedha Ghar Tak.</p>
                    </div>
                  </div>
                </div>

                {/* 5-Slide Promotional Carousel */}
                <div className="px-4 mb-4">
                  <div className="relative h-40 w-full overflow-hidden rounded-3xl shadow-lg border border-white bg-gray-200">
                    {slides.map((s, idx) => (
                      <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <img src={s.img} alt="Promo banner" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                          <p className="text-xs font-black tracking-wide">{s.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="absolute top-3 right-3 z-20 flex gap-1">
                      {slides.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-3' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "categories" && (
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-5 rounded-3xl text-white mb-6 shadow-md">
                  <h2 className="text-xl font-black">All Categories</h2>
                  <p className="text-xs opacity-80">Apni zarurat ke hisab se saaman chunein</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setActiveCategory(c); setActiveTab("shop"); }}
                      className={`p-6 rounded-2xl bg-white text-left shadow-sm border font-black flex flex-col justify-between h-28 ${activeCategory === c ? 'border-blue-500 ring-2 ring-blue-100 text-blue-600' : 'border-gray-100 text-gray-700'}`}
                    >
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
                  <p className="text-xs opacity-90">Bumper deals aur combos sirf aapke liye!</p>
                </div>
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {["All", "Today's Deal", "Buy 2 Get 1", "Combo Pack"].map(tag => (
                    <button key={tag} onClick={() => setSelectedOfferFilter(tag)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${selectedOfferFilter === tag ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-500'}`}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Products Layout */}
            {activeTab !== "categories" && (
              <main className="p-4 grid grid-cols-2 gap-4">
                {filtered.map(p => {
                  const hasDiscount = p.discount > 0;
                  const finalPrice = getDiscountedPrice(p.price, p.discount);
                  const cartItem = cart.find(x => x.id === p.id);
                  return (
                    <div key={p.id} className="bg-white/90 backdrop-blur-sm p-3 rounded-[2rem] shadow-sm border border-white relative flex flex-col justify-between">
                       <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                          {p.offerTag && p.offerTag !== "None" && <span className="bg-orange-500 text-white text-[7px] font-black px-1 py-0.5 rounded uppercase">{p.offerTag}</span>}
                          {hasDiscount && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md text-center">{p.discount}% OFF</span>}
                       </div>
                       <div className="h-32 flex items-center justify-center mb-3 bg-gradient-to-b from-blue-50 via-white to-green-50 rounded-2xl overflow-hidden">
                         {p.img.includes('http') ? <img src={p.img} alt="product" className="h-full w-full object-cover rounded-2xl" /> : <span className="text-5xl">{p.img}</span>}
                       </div>
                       <div className="px-1 text-center">
                         <h3 className="font-bold text-gray-700 text-sm truncate">{p.name}</h3>
                         <span className="text-lg font-black text-blue-600">₹{finalPrice}</span>
                         <div className="mt-2">
                           {p.stock <= 0 ? (
                             <button disabled className="w-full py-2 bg-gray-200 text-gray-400 rounded-xl text-xs">OUT</button>
                           ) : cartItem ? (
                             <div className="flex items-center justify-between bg-blue-600 rounded-xl text-white p-1">
                               <button onClick={() => removeFromCart(p)} className="px-2 font-black">-</button>
                               <span className="text-xs">{cartItem.qty}</span>
                               <button onClick={() => addToCart(p)} className="px-2 font-black">+</button>
                             </div>
                           ) : (
                             <button onClick={() => addToCart(p)} className="w-full py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold rounded-xl text-xs">ADD</button>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })}
              </main>
            )}

            {/* Premium Personalized Address & Social Footer */}
            <footer className="mx-4 my-6 p-6 bg-white rounded-3xl border border-gray-100 text-gray-800 shadow-sm space-y-6 mb-24">
              <div className="flex items-center gap-2 border-b pb-4">
                <span className="text-2xl">🏬</span>
                <h3 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">DAILY NEEDS HUB</h3>
              </div>
              
              {/* Follow With Us Section */}
              <div className="space-y-2">
                <p className="text-xs font-black tracking-wider text-gray-400 uppercase">Follow With Us</p>
                <div className="flex gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 p-2.5 rounded-xl font-bold text-sm">🌐 Facebook</a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="bg-pink-50 text-pink-500 p-2.5 rounded-xl font-bold text-sm">📸 Instagram</a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="bg-red-50 text-red-600 p-2.5 rounded-xl font-bold text-sm">📺 YouTube</a>
                </div>
              </div>

              {/* Contact Us Section */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-black tracking-wider text-gray-400 uppercase">Contact Us</p>
                <div className="text-xs space-y-1 font-bold text-gray-600">
                  <p>📞 Phone: <a href="tel:+918637589429" className="text-blue-600 underline">+91 8637589429</a></p>
                  <p>✉️ Email: <a href="mailto:dailyneedshub@gmail.com" className="text-blue-600 underline">dailyneedshub@gmail.com</a></p>
                </div>
              </div>

              {/* Togglable Privacy Policy */}
              <div className="border-t pt-4">
                <button onClick={() => setShowPrivacy(!showPrivacy)} className="text-xs font-black text-blue-600 flex items-center justify-between w-full">
                  <span>📄 Privacy Policy & Terms</span>
                  <span>{showPrivacy ? '🔼' : '🔽'}</span>
                </button>
                {showPrivacy && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl text-[10px] text-gray-500 font-medium leading-relaxed space-y-2">
                    <p><b>1. Information We Collect:</b> Grahak ka naam aur delivery address sirf WhatsApp order process aur dynamic display ke liye Firebase database mein secure rakha jata hai.</p>
                    <p><b>2. Orders & Payments:</b> Sabhi orders WhatsApp direct message ke through final hote hain. COD ya online payment verification delivery ke waqt kiya jata hai.</p>
                    <p><b>3. Returns & Refunds:</b> Agar koi product damage ya kharab nikalta hai, toh aap retail memo bill ke saath store manager se 24 ghante ke andar contact kar sakte hain.</p>
                  </div>
                )}
              </div>

              {/* Strict Landmark Address Block */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 rounded-2xl border text-center text-xs font-bold text-gray-600 leading-relaxed">
                📍 Near al ameen mission , Papuri, Nanoor , Birbhum, 731240.
              </div>
            </footer>

            {/* Sticky Bottom Nav */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 p-2 z-50 flex justify-around items-center rounded-t-[2rem] shadow-lg">
              <button onClick={() => { setActiveTab("shop"); setActiveCategory("All"); }} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "shop" ? "text-blue-600 font-black" : "text-gray-400 font-bold"}`}>
                <span>🛒</span><span className="text-[10px]">Shop</span>
              </button>
              <button onClick={() => setActiveTab("categories")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "categories" ? "text-teal-600 font-black" : "text-gray-400 font-bold"}`}>
                <span>🗂️</span><span className="text-[10px]">Category</span>
              </button>
              <button onClick={() => setActiveTab("offers")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "offers" ? "text-red-500 font-black" : "text-gray-400 font-bold"}`}>
                <span>🎁</span><span className="text-[10px]">Offers</span>
              </button>
              <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center p-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl px-3 py-1">
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
                  <input placeholder="Aapka Naam" value={custInfo.name} className="w-full p-3 border border-blue-100 rounded-xl bg-gray-50 text-sm text-black" onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} />
                  <textarea placeholder="Delivery Address" value={custInfo.address} className="w-full p-3 border border-blue-100 rounded-xl bg-gray-50 text-sm text-black" rows="3" onChange={(e) => setCustInfo({...custInfo, address: e.target.value})} />
                </div>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-3 border-b text-xs items-center">
                    <span className="font-bold text-gray-800">{item.name} (x{item.qty})</span>
                    <span className="font-bold text-blue-600">₹{getDiscountedPrice(item.price, item.discount) * item.qty}</span>
                  </div>
                ))}
                <div className="mt-8">
                  <div className="flex justify-between text-2xl font-black mb-6 text-green-600"><span>Total:</span><span>₹{cartTotal}</span></div>
                  <button onClick={handleOrder} className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 rounded-2xl font-bold text-lg mb-2">WhatsApp Order</button>
                  <button onClick={() => setIsCartOpen(false)} className="w-full py-2 text-gray-400 text-xs text-center">CLOSE</button>
                </div>
              </>
            ) : (
              <div className="pt-4 space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-black text-green-600">ORDER CONFIRMED!</h2>
                </div>
                <div className="border-2 border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3 text-[11px]">
                  <p><b>Customer:</b> {custInfo.name}</p>
                  <p><b>Total Bill:</b> ₹{cartTotal}</p>
                </div>
                <button onClick={() => {setShowInvoice(false); setCart([]); setIsCartOpen(false);}} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
