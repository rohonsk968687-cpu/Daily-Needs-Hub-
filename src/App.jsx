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
const BRAND_LOGO_URL = "/logo.png"; 

// Aapka Sahi UPI ID
const MY_UPI_ID = "8637589429-3@ybl"; 

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("shop"); // 'shop', 'categories', 'offers', 'orders'
  const [selectedOfferFilter, setSelectedOfferFilter] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");
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
    
    const qProd = query(collection(db, "products"), orderBy("name"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qOrder = collection(db, "orders");
    const unsubOrder = onSnapshot(qOrder, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { clearInterval(timer); unsubProd(); unsubOrder(); unsubscribeAuth(); };
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

  const updateOrderStatus = async (id, nextStatus) => {
    await updateDoc(doc(db, "orders", id), { status: nextStatus });
    alert("Order status updated successfully!");
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

  const handleCheckoutInit = async () => {
    if(!custInfo.name || !custInfo.address) return alert("Naam aur Pata bharna zaruri hai!");
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        customerName: custInfo.name,
        address: custInfo.address,
        userEmail: user ? user.email : "Anonymous",
        items: cart.map(i => ({ name: i.name, qty: i.qty, total: getDiscountedPrice(i.price, i.discount) * i.qty })),
        totalAmount: cartTotal,
        status: "Pending ⏳",
        createdAt: new Date().toLocaleString()
      });
      setCurrentOrderId(docRef.id);
      setShowInvoice(true); 
    } catch (e) {
      alert("Order create karne mein dikkat aayi.");
    }
  };

  const sendWhatsAppNotification = () => {
    const itemsMsg = cart.map(i => `${i.name} (x${i.qty}) - ₹${getDiscountedPrice(i.price, i.discount) * i.qty}`).join(", ");
    const msg = `Naya Order & Payment Done - Daily Needs Hub\nOrder ID: ${currentOrderId}\nNaam: ${custInfo.name}\nAddress: ${custInfo.address}\nItems: ${itemsMsg}\nTotal Bill: ₹${cartTotal}\n\nKripya Payment aur order deliver kijiye.`;
    window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
    
    setShowInvoice(false);
    setCart([]);
    setIsCartOpen(false);
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-amber-50/60 via-white to-emerald-50/60 text-gray-900'} pb-32 transition-all duration-500 font-sans`}>
      
      {/* Header */}
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
        {/* Search Bar */}
        {activeTab === "shop" && (
          <div className="p-4">
            <input 
              type="text" placeholder="🔍 Search fresh milk, cold drinks, snacks..." 
              className="w-full p-4 bg-white/95 rounded-2xl border-2 border-orange-200 text-sm focus:border-emerald-500 focus:outline-none shadow-md transition-all text-black font-medium"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {window.location.pathname === '/admin' ? (
          /* Full Power Admin View */
          <div className="p-4">
            <div className="bg-white p-6 rounded-3xl shadow-xl text-black space-y-6 border border-orange-100">
               <h2 className="text-xl font-bold mb-4 text-orange-600">Admin Dashboard</h2>
               {!isAdmin ? (
                 <input type="password" placeholder="Password" className="border p-3 w-full rounded-xl" onChange={(e) => e.target.value === 'admin123' && setIsAdmin(true)} />
               ) : (
                 <>
                    {/* Live Tracking Order Control Room */}
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-3">
                      <h3 className="text-xs font-black text-blue-800">📦 CUSTOMER ORDERS INCOMING DASHBOARD ({orders.length})</h3>
                      {orders.map(ord => (
                        <div key={ord.id} className="p-3 bg-white rounded-xl text-xs space-y-1 shadow-sm border">
                          <p><b>Customer:</b> {ord.customerName}</p>
                          <p><b>Total Bill:</b> ₹{ord.totalAmount}</p>
                          <p><b>Time:</b> {ord.createdAt}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-[10px] text-orange-600">Status: {ord.status}</span>
                            <select 
                              className="p-1 border rounded text-[10px] bg-gray-50 font-bold"
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

                    {/* Banners Manager */}
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 space-y-3">
                      <h3 className="text-xs font-bold text-orange-700">⚙️ Manage 5 Dynamic Banners</h3>
                      {slides.map((s, index) => (
                        <div key={s.id} className="space-y-1">
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
                      <div className="flex justify-between items-center text-xs font-bold p-2 bg-gray-50 rounded-xl">
                        <label><input type="checkbox" name="bestSeller" /> ✨ Best</label>
                        <label><input type="checkbox" name="newArrival" /> 🚀 New</label>
                        <select name="itemOfferTag" className="p-1 border rounded text-[10px]">
                          {offerTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                        </select>
                      </div>
                      <input name="itemImg" placeholder="Image Link / Emoji" className="border p-3 rounded-xl bg-gray-50" required />
                      <select name="itemCategory" className="border p-3 rounded-xl bg-gray-50">
                        {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="submit" className="bg-orange-600 text-white p-4 rounded-xl font-bold">ADD ITEM LIVE</button>
                    </form>

                    {/* Matrix Management Controls */}
                    <div className="space-y-2 pt-4 border-t">
                      {products.map(p => (
                        <div key={p.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-bold">{p.name}</span>
                          <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500 font-black">🗑 Delete</button>
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
                  <div className="bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <h2 className="text-2xl font-black mb-1">Aapki Apni Dukan! 🛒</h2>
                    <p className="text-xs opacity-90 italic">Fresh Items, Best Price, Seedha Ghar Tak.</p>
                  </div>
                </div>

                {/* Slider */}
                <div className="px-4 mb-4">
                  <div className="relative h-44 w-full overflow-hidden rounded-3xl shadow-xl border-2 border-white bg-gray-100">
                    {slides.map((s, idx) => (
                      <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <img src={s.img} alt="Promo banner" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
                          <p className="text-xs font-black bg-orange-600/80 px-2 py-0.5 rounded-md inline-block">{s.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "categories" && (
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 rounded-3xl text-white mb-6 shadow-md">
                  <h2 className="text-xl font-black">All Categories</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(c => (
                    <button key={c} onClick={() => { setActiveCategory(c); setActiveTab("shop"); }} className={`p-6 rounded-2xl bg-white text-left shadow-md border-2 font-black flex flex-col justify-between h-28 ${activeCategory === c ? 'border-orange-500 text-orange-600' : 'border-gray-100 text-gray-700'}`}>
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
                </div>
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {["All", "Today's Deal", "Buy 2 Get 1", "Combo Pack"].map(tag => (
                    <button key={tag} onClick={() => setSelectedOfferFilter(tag)} className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${selectedOfferFilter === tag ? 'bg-red-500 text-white' : 'bg-white text-gray-500'}`}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            {/* TRACK TAB FOR CLIENTS */}
            {activeTab === "orders" && (
              <div className="px-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 rounded-3xl text-white mb-4 shadow-md">
                  <h2 className="text-xl font-black">📦 Live Order Tracker</h2>
                  <p className="text-xs opacity-80">Apne order ka real-time live status check karein</p>
                </div>
                <div className="space-y-3">
                  {orders.filter(o => user ? o.userEmail === user.email : true).length === 0 ? (
                    <p className="text-center font-bold text-gray-400 py-6">Abhi tak koi order history nahi mili.</p>
                  ) : (
                    orders.filter(o => user ? o.userEmail === user.email : true).map(o => (
                      <div key={o.id} className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-gray-500">ID: ...{o.id.slice(-6)}</span>
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{o.status}</span>
                        </div>
                        <div className="text-xs text-gray-600 font-bold">
                          {o.items.map((it, idx) => <span key={idx}>{it.name} (x{it.qty}), </span>)}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t text-xs font-black">
                          <span>Grand Total:</span>
                          <span className="text-orange-600">₹{o.totalAmount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Products Grid Layout */}
            {activeTab !== "categories" && activeTab !== "orders" && (
              <main className="p-4 grid grid-cols-2 gap-4">
                {filtered.map(p => {
                  const hasDiscount = p.discount > 0;
                  const finalPrice = getDiscountedPrice(p.price, p.discount);
                  const cartItem = cart.find(x => x.id === p.id);
                  return (
                    <div key={p.id} className="bg-white p-3 rounded-[2rem] shadow-md border-2 border-orange-100/60 relative flex flex-col justify-between">
                       <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                          {p.offerTag && p.offerTag !== "None" && <span className="bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">{p.offerTag}</span>}
                          {hasDiscount && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{p.discount}% OFF</span>}
                       </div>
                       <div className="h-32 flex items-center justify-center mb-3 bg-gradient-to-b from-orange-50/50 via-white to-emerald-50/30 rounded-2xl overflow-hidden">
                         {p.img.includes('http') ? <img src={p.img} alt="product" className="h-full w-full object-cover rounded-2xl" /> : <span className="text-5xl">{p.img}</span>}
                       </div>
                       <div className="px-1 text-center">
                         <h3 className="font-extrabold text-gray-800 text-sm truncate">{p.name}</h3>
                         <div className="flex items-center justify-center gap-2 mt-1">
                           <span className="text-lg font-black text-orange-600">₹{finalPrice}</span>
                           {hasDiscount && <span className="text-xs text-gray-400 line-through font-bold">₹{p.price}</span>}
                         </div>
                         <div className="mt-2.5">
                           {p.stock <= 0 ? (
                             <button disabled className="w-full py-2 bg-gray-200 text-gray-400 rounded-xl text-xs font-bold">OUT</button>
                           ) : cartItem ? (
                             <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-emerald-500 rounded-xl text-white p-1 font-black">
                               <button onClick={() => removeFromCart(p)} className="px-2 text-sm">-</button>
                               <span className="text-xs">{cartItem.qty}</span>
                               <button onClick={() => addToCart(p)} className="px-2 text-sm">+</button>
                             </div>
                           ) : (
                             <button onClick={() => addToCart(p)} className="w-full py-2 bg-gradient-to-r from-orange-500 to-emerald-500 text-white font-black rounded-xl text-xs">ADD TO BAG</button>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })}
              </main>
            )}

            {/* Footer */}
            <footer className="mx-4 my-8 pt-6 text-gray-800 space-y-6 mb-28 border-t border-gray-200/60">
              <div className="flex items-center gap-3">
                <img src={BRAND_LOGO_URL} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                <div>
                  <h3 className="text-base font-black uppercase">Daily Needs Hub</h3>
                  <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Everyday Needs, Delivered Fast</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Follow With Us</p>
                <div className="flex gap-4">
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-blue-600">Facebook</a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-pink-600">Instagram</a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-red-600">YouTube</a>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-600 space-y-1">
                  <p>📞 Mobile: <a href="tel:+918637589429" className="text-emerald-600 underline">+91 8637589429</a></p>
                  <p>✉️ Email: <a href="mailto:dailyneedshub@gmail.com" className="text-orange-600 underline">dailyneedshub@gmail.com</a></p>
                </div>
              </div>
              <div className="text-xs font-extrabold text-gray-500 pt-2 border-t">
                📍 Bolpur to Palitpur Road, Near Al Ameen Mission, Papuri, Nanoor, Birbhum, West Bengal, 731240
              </div>
            </footer>

            {/* 🌟 5-TAB UPGRADED FIXED BOTTOM NAVIGATION BAR 🌟 */}
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
              
              {/* FIXED DIRECT TRACK NAVIGATION ICON ENTRY */}
              <button onClick={() => setActiveTab("orders")} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === "orders" ? "text-purple-600 font-black scale-105" : "text-gray-400 font-bold"}`}>
                <span className="text-lg">📦</span><span className="text-[10px]">Track</span>
              </button>
              
              <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center p-2 bg-gradient-to-r from-orange-500 to-emerald-500 text-white rounded-2xl px-2.5 py-1 shadow-md">
                <span className="text-[10px] font-black">🛍️ Bag</span>
                <span className="text-[9px]">₹{cartTotal}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cart Drawer System */}
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
                  <button onClick={handleCheckoutInit} className="w-full bg-gradient-to-r from-orange-500 to-emerald-500 text-white py-4 rounded-2xl font-black text-lg mb-2 shadow-lg">Proceed to Payment</button>
                  <button onClick={() => setIsCartOpen(false)} className="w-full py-2 text-gray-400 text-xs text-center font-bold">CLOSE</button>
                </div>
              </>
            ) : (
              <div className="pt-2 space-y-4">
                <div className="text-center">
                  <span className="text-3xl">📝</span>
                  <h2 className="text-md font-black text-orange-600 uppercase">Verify Bill & Pay</h2>
                </div>

                <div className="p-4 bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-2xl text-center space-y-3 shadow-inner">
                  <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-black">⚡ INSTANT UPI PAYMENT</span>
                  <p className="text-[11px] text-gray-600 font-bold">Scan QR code using Google Pay, PhonePe or Paytm</p>
                  
                  <div className="bg-white p-2 rounded-xl inline-block border shadow-sm mx-auto">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${MY_UPI_ID}&pn=DailyNeedsHub&am=${cartTotal}&cu=INR`)}`} 
                      alt="UPI QR Payment Link" 
                      className="w-36 h-36 mx-auto object-contain" 
                    />
                  </div>

                  <a 
                    href={`intent://pay?pa=${MY_UPI_ID}&pn=DailyNeedsHub&am=${cartTotal}&cu=INR#Intent;scheme=upi;package=in.org.npci.upiapp;end`}
                    className="block bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all"
                  >
                    🚀 Pay via Mobile UPI App
                  </a>
                </div>

                <div className="border border-orange-100 rounded-2xl p-4 bg-gray-50/30 text-[11px] font-bold text-gray-700 space-y-2 shadow-sm">
                  <p className="border-b pb-1 text-center font-black text-gray-800 text-xs uppercase">Retail Cash Memo</p>
                  <p><b>Order ID:</b> {currentOrderId}</p>
                  <p><b>Grahak:</b> {custInfo.name}</p>
                  <p className="border-t pt-1 flex justify-between text-orange-600 font-black text-xs"><span>Total Amount:</span><span>₹{cartTotal}</span></p>
                </div>

                <button 
                  onClick={sendWhatsAppNotification} 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black shadow-md text-sm text-center tracking-wide uppercase"
                >
                  ✅ Send Order Details to WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
