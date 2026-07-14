import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const categories = ["All", "Dairy", "Beverages", "Snacks", "Vegetables", "Others"];
const offerTags = ["None", "Today's Deal", "Buy 2 Get 1", "Combo Pack"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null); // User state for Login
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("shop"); // 'shop' ya 'offers'
  const [selectedOfferFilter, setSelectedOfferFilter] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [custInfo, setCustInfo] = useState({ name: '', address: '' });
  
  // Promotional Slides
  const [slides, setSlides] = useState([
    { id: 1, img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80", text: "⚡ SUMMER SPECIAL SALE: Min 10% OFF!" },
    { id: 2, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80", text: "🥤 COLD DRINKS & BEVERAGES: Garmi ka Ilaaj" },
    { id: 3, img: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=500&q=80", text: "🛒 GROCERY ESSENTIALS: Fresh Stock Everyday" }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Auth State Observer
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
        setCustInfo(prev => ({ ...prev, name: currentUser.displayName || '' }));
      } else {
        setUser(null);
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
      await signInWithPopup(auth, googleProvider);
      alert("Google Login Kamyab Raha! 🎉");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login nahi ho paya, kripya Firebase mein Google Provider check karein.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    await signInAnonymously(auth); // Fallback to anonymous for database rules
    setUser(null);
    alert("Logged out!");
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p) => {
    if (p.stock <= 0) return alert("Maaf karein, ye stock mein nahi hai!");
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      if (exist.qty >= p.stock) return alert("Maaf karein, stock khatam ho gaya!");
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

  const toggleWishlist = (p) => {
    setWishlist(wishlist.find(x => x.id === p.id) ? wishlist.filter(x => x.id !== p.id) : [...wishlist, p]);
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
        offerTag: el.itemOfferTag.value || "None", // Naya offer control
        isBestSeller: el.bestSeller.checked,
        isNewArrival: el.newArrival.checked
      });
      e.target.reset();
      alert("Saaman kamiyabi se jud gaya!");
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
    alert(`Banner ${index + 1} updated successfully!`);
  };

  const cartTotal = cart.reduce((a, c) => a + getDiscountedPrice(c.price, c.discount) * c.qty, 0);
  
  // Filtering system base on Active Tab (Shop vs Offers)
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

  const getCategoryColor = (cat) => {
    if (activeCategory !== cat) return 'bg-white text-gray-400 border border-gray-100';
    switch(cat) {
      case 'All': return 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg';
      case 'Dairy': return 'bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-lg';
      case 'Beverages': return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg';
      case 'Snacks': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg';
      case 'Vegetables': return 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-blue-50 via-white to-green-50 text-gray-900'} pb-32 transition-all duration-500`}>
      
      {/* Header */}
      <header className="p-4 bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-40 flex justify-between items-center border-b border-blue-50">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-orange-500 tracking-tighter italic">DAILY NEEDS HUB</h1>
          {user && <p className="text-[10px] font-bold text-gray-400">Welcome, {user.displayName}!</p>}
        </div>
        <div className="flex items-center gap-2">
           {user ? (
             <button onClick={handleLogout} className="text-[10px] bg-red-50 text-red-500 p-2 font-black rounded-xl">Logout</button>
           ) : (
             <button onClick={handleGoogleLogin} className="text-[10px] bg-blue-50 text-blue-600 p-2 font-black rounded-xl border border-blue-100 shadow-sm">👤 Login</button>
           )}
           <button onClick={() => setIsCartOpen(true)} className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all">
             🛒 ₹{cartTotal}
           </button>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {/* Search Bar */}
        <div className="p-4">
          <input 
            type="text" placeholder="🔍 Search (Milk, Soap, Kitkat...)" 
            className="w-full p-4 bg-white/90 rounded-2xl border-2 border-green-100 text-sm focus:border-blue-400 focus:outline-none shadow-sm transition-all"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {window.location.pathname === '/admin' ? (
          /* Admin View */
          <div className="p-4">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-50 text-black space-y-6">
               <h2 className="text-xl font-bold mb-4 text-blue-600">Admin Dashboard</h2>
               {!isAdmin ? (
                 <input type="password" placeholder="Password" className="border p-3 w-full rounded-xl" onChange={(e) => e.target.value === 'admin123' && setIsAdmin(true)} />
               ) : (
                 <>
                    {/* Banners Ads Management */}
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 space-y-3">
                      <h3 className="text-xs font-bold text-orange-700">⚙️ Manage Promotional Posters (Slider Ads)</h3>
                      {slides.map((s, index) => (
                        <div key={s.id} className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500">Poster Slider {s.id} URL:</label>
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
                        <label><input type="checkbox" name="bestSeller" /> ✨ Best Seller</label>
                        <label><input type="checkbox" name="newArrival" /> 🚀 New Arrival</label>
                        <div>
                          <label className="block text-[9px] text-gray-400">Offer Tag:</label>
                          <select name="itemOfferTag" className="p-1 border rounded text-[10px]">
                            {offerTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                          </select>
                        </div>
                      </div>

                      <input name="itemImg" placeholder="Image URL Link ya Emoji daalein" className="border p-3 rounded-xl bg-gray-50" required />
                      <select name="itemCategory" className="border p-3 rounded-xl bg-gray-50">
                        {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="submit" className="bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg">ADD ITEM</button>
                    </form>
                    
                    {/* Stock list control remaining same */}
                 </>
               )}
            </div>
          </div>
        ) : (
          /* Customer View */
          <>
            {/* Top Main Banner & Slider */}
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
                  </div>
                </div>

                {/* Categories Slider for Shop Tab */}
                <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                  {categories.map(c => (
                    <button key={c} onClick={() => setActiveCategory(c)} className={`px-5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-300 ${getCategoryColor(c)}`}>{c}</button>
                  ))}
                </div>
              </>
            )}

            {/* DYNAMIC OFFERS PAGE CONTENT CONTROL */}
            {activeTab === "offers" && (
              <div className="px-4 mb-2">
                <div className="bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 p-6 rounded-3xl text-white shadow-xl mb-4">
                  <h2 className="text-2xl font-black mb-1">⚡ SPECIAL OFFERS ZONE</h2>
                  <p className="text-xs opacity-90">Bumper deals aur combos sirf aapke liye!</p>
                </div>
                {/* Offer Sub filters */}
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {["All", "Today's Deal", "Buy 2 Get 1", "Combo Pack"].map(tag => (
                    <button key={tag} onClick={() => setSelectedOfferFilter(tag)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${selectedOfferFilter === tag ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-500'}`}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            <main className="p-4 grid grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-gray-400 font-bold bg-white/50 rounded-2xl border">Yahan abhi koi saaman nahi mila.</div>
              ) : (
                filtered.map(p => {
                  const hasDiscount = p.discount > 0;
                  const finalPrice = getDiscountedPrice(p.price, p.discount);
                  const cartItem = cart.find(x => x.id === p.id);
                  
                  return (
                    <div key={p.id} className="bg-white/90 backdrop-blur-sm p-3 rounded-[2rem] shadow-sm border border-white relative active:scale-95 transition-all">
                       <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 max-w-[80px]">
                          {p.offerTag && p.offerTag !== "None" && <span className="bg-orange-500 text-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm text-center uppercase">{p.offerTag}</span>}
                          {hasDiscount && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm text-center">{p.discount}% OFF</span>}
                          {p.isBestSeller && <span className="bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm text-center">✨ BEST</span>}
                       </div>

                       <div className="h-32 flex items-center justify-center mb-3 bg-gradient-to-b from-blue-50 via-white to-green-50 rounded-2xl overflow-hidden">
                         {p.img.includes('http') ? <img src={p.img} alt="product" className="h-full w-full object-cover rounded-2xl" /> : <span className="text-5xl">{p.img}</span>}
                       </div>
                       <div className="px-1 text-center">
                         <h3 className="font-bold text-gray-700 text-sm truncate">{p.name}</h3>
                         <div className="flex items-center justify-center gap-2 mt-1">
                           <span className="text-lg font-black text-blue-600">₹{finalPrice}</span>
                           {hasDiscount && <span className="text-xs text-gray-400 line-through font-bold">₹{p.price}</span>}
                         </div>
                         
                         <div className="mt-3">
                           {p.stock <= 0 ? (
                             <button disabled className="w-full py-3 rounded-2xl font-bold text-[10px] bg-gray-200 text-gray-400">OUT OF STOCK</button>
                           ) : cartItem ? (
                             <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl text-white p-1 font-black">
                               <button onClick={() => removeFromCart(p)} className="px-3 py-1.5 text-sm bg-white/20 rounded-xl">-</button>
                               <span className="text-xs">{cartItem.qty} Qty</span>
                               <button onClick={() => addToCart(p)} className="px-3 py-1.5 text-sm bg-white/20 rounded-xl">+</button>
                             </div>
                           ) : (
                             <button onClick={() => addToCart(p)} className="w-full py-3 rounded-2xl font-bold text-[10px] tracking-wider transition-all shadow-md bg-gradient-to-r from-blue-500 via-emerald-500 to-green-500 text-white shadow-blue-100">ADD TO BAG</button>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })
              )}
            </main>

            <footer className="p-8 bg-white/80 backdrop-blur-sm mt-10 border-t border-blue-50 text-center rounded-t-[2rem] shadow-inner mb-24">
              <h3 className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 mb-2">DAILY NEEDS HUB</h3>
              <div className="grid grid-cols-2 gap-3 mb-6 max-w-xs mx-auto">
                <a href="tel:+91918637589429" className="bg-blue-50 text-blue-600 p-3 rounded-2xl font-black text-xs border border-blue-100 flex items-center justify-center gap-1">📞 Call Now</a>
                <a href="https://wa.me/918637589429" className="bg-green-600 text-white p-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1">💬 WhatsApp</a>
              </div>
            </footer>

            {/* UPGRADED FIXED BOTTOM APP BAR FOR SHOP & OFFERS TABS */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-2 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex justify-around items-center rounded-t-[2rem]">
              <button onClick={() => setActiveTab("shop")} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === "shop" ? "text-blue-600 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🛒</span>
                <span className="text-[10px]">Shop</span>
              </button>
              <button onClick={() => setActiveTab("offers")} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === "offers" ? "text-red-500 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">🎁</span>
                <span className="text-[10px]">Offers Zone</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cart Drawer & Premium Invoice System (Remaining Same) */}
    </div>
  );
}
