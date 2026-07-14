import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const categories = ["All", "Dairy", "Beverages", "Snacks", "Vegetables", "Others"];

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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
    signInAnonymously(auth).catch(err => console.error("Auth Error:", err));
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    const q = query(collection(db, "products"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { clearInterval(timer); unsubscribe(); };
  }, [slides.length]);

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return Math.round(price - (price * discount) / 100);
  };

  const addToCart = (p) => {
    if (p.stock <= 0) return alert("Maaf karein, ye stock mein nahi hai!");
    const exist = cart.find(x => x.id === p.id);
    setCart(exist ? cart.map(x => x.id === p.id ? { ...exist, qty: exist.qty + 1 } : x) : [...cart, { ...p, qty: 1 }]);
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
        isBestSeller: el.bestSeller.checked,
        isNewArrival: el.newArrival.checked
      });
      
      e.target.reset();
      alert("Saaman kamiyabi se discount aur badges ke sath jud gaya!");
    } catch (error) {
      alert("Database error! Kripya check karein.");
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
  
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && 
    (activeCategory === "All" || p.category === activeCategory)
  );

  const handleOrder = () => {
    if(!custInfo.name || !custInfo.address) return alert("Naam aur Pata bharna zaruri hai!");
    const itemsMsg = cart.map(i => {
      const finalP = getDiscountedPrice(i.price, i.discount);
      return `${i.name} (x${i.qty}) - ₹${finalP * i.qty}`;
    }).join(", ");
    
    const msg = `Naya Order - Daily Needs Hub\n\nNaam: ${custInfo.name}\nAddress: ${custInfo.address}\nItems: ${itemsMsg}\nTotal: ₹${cartTotal}\n\nKripya Payment details bhejein.`;
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

  const renderProductImage = (imgSource) => {
    if (imgSource && (imgSource.startsWith('http://') || imgSource.startsWith('https://') || imgSource.startsWith('data:image'))) {
      return <img src={imgSource} alt="product" className="h-full w-full object-cover rounded-2xl" />;
    }
    return <span className="text-5xl">{imgSource || "📦"}</span>;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-blue-50 via-white to-green-50 text-gray-900'} pb-32 transition-all duration-500`}>
      
      {/* Header */}
      <header className="p-4 bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-40 flex justify-between items-center border-b border-blue-50">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-orange-500 tracking-tighter italic">
          DAILY NEEDS HUB
        </h1>
        <div className="flex items-center gap-3">
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 rounded-full">{darkMode ? '☀️' : '🌙'}</button>
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
                      
                      {/* NEW ADMIN BADGE CONTROL CHECKBOXES */}
                      <div className="flex gap-6 p-2 bg-gray-50 rounded-xl border border-dashed text-xs font-bold text-gray-600">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" name="bestSeller" className="rounded" /> ✨ Best Seller
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" name="newArrival" className="rounded" /> 🚀 New Arrival
                        </label>
                      </div>

                      <input name="itemImg" placeholder="Image URL Link ya Emoji daalein" className="border p-3 rounded-xl bg-gray-50" required />
                      <select name="itemCategory" className="border p-3 rounded-xl bg-gray-50">
                        {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="submit" className="bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg">ADD ITEM</button>
                    </form>
                    
                    <div className="space-y-2">
                      <h3 className="font-bold border-b pb-2">Manage Stock & Discounts</h3>
                      {products.map(p => (
                        <div key={p.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-700">{p.name}</span>
                            <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500 text-xs">🗑--- Delete</button>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px]">
                            <div>Stock: <input type="number" className="w-12 p-1 border rounded" defaultValue={p.stock} onBlur={(e) => updateProductData(p.id, "stock", e.target.value)} /></div>
                            <div>Price: ₹<input type="number" className="w-12 p-1 border rounded" defaultValue={p.price} onBlur={(e) => updateProductData(p.id, "price", e.target.value)} /></div>
                            <div>Disc%: <input type="number" className="w-10 p-1 border rounded" defaultValue={p.discount || 0} onBlur={(e) => updateProductData(p.id, "discount", e.target.value)} /></div>
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
            {/* Top Main Banner */}
            <div className="px-4 mb-4">
              <div className="bg-gradient-to-r from-orange-500 via-blue-500 to-green-500 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-black mb-1 tracking-wide">Aapki Apni Dukan! 🛒</h2>
                  <p className="text-xs opacity-90 font-medium italic">Fresh Items, Best Price, Seedha Ghar Tak.</p>
                </div>
              </div>
            </div>

            {/* Promotional Slider Ads */}
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
                    <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/50'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <main className="p-4 grid grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-gray-400 font-bold bg-white/50 rounded-2xl border">Is category mein abhi koi saaman nahi hai.</div>
              ) : (
                filtered.map(p => {
                  const hasDiscount = p.discount > 0;
                  const finalPrice = getDiscountedPrice(p.price, p.discount);
                  
                  return (
                    <div key={p.id} className="bg-white/90 backdrop-blur-sm p-3 rounded-[2rem] shadow-sm border border-white relative active:scale-95 transition-all">
                       
                       {/* DYNAMIC BADGES ON PRODUCT CARDS */}
                       <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 max-w-[80px]">
                          {hasDiscount && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm text-center">{p.discount}% OFF</span>}
                          {p.isBestSeller && <span className="bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm text-center">✨ BEST</span>}
                          {p.isNewArrival && <span className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm text-center">🚀 NEW</span>}
                       </div>

                       <button onClick={() => toggleWishlist(p)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full shadow-sm text-sm">
                         {wishlist.find(x => x.id === p.id) ? '❤️' : '🤍'}
                       </button>
                       <div className="h-32 flex items-center justify-center mb-3 bg-gradient-to-b from-blue-50 via-white to-green-50 rounded-2xl overflow-hidden">
                         {renderProductImage(p.img)}
                       </div>
                       <div className="px-1 text-center">
                         <h3 className="font-bold text-gray-700 text-sm truncate">{p.name}</h3>
                         <div className="flex items-center justify-center gap-2 mt-1">
                           <span className="text-lg font-black text-blue-600">₹{finalPrice}</span>
                           {hasDiscount && <span className="text-xs text-gray-400 line-through font-bold">₹{p.price}</span>}
                         </div>
                         <p className={`text-[9px] font-bold mt-1 ${p.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{p.stock > 0 ? `${p.stock} in Stock` : 'Out of Stock'}</p>
                         <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`w-full mt-3 py-3 rounded-2xl font-bold text-[10px] tracking-wider transition-all shadow-md ${p.stock > 0 ? 'bg-gradient-to-r from-blue-500 via-emerald-500 to-green-500 text-white shadow-blue-100' : 'bg-gray-200 text-gray-400'}`}>ADD TO BAG</button>
                       </div>
                    </div>
                  );
                })
              )}
            </main>

            {/* TRUST & POLICY FOOTER */}
            <footer className="p-8 bg-white/80 backdrop-blur-sm mt-10 border-t border-blue-50 text-center rounded-t-[2rem] shadow-inner mb-24">
              <h3 className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 mb-2">DAILY NEEDS HUB</h3>
              <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">Shop No. 4, Main Market Road, Near City Tower</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6 max-w-xs mx-auto">
                <a href="tel:+91918637589429" className="bg-blue-50 text-blue-600 p-3 rounded-2xl font-black text-xs border border-blue-100 shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all">📞 Call Now</a>
                <a href="https://wa.me/918637589429" className="bg-green-600 text-white p-3 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-1 active:scale-95 transition-all">💬 WhatsApp</a>
              </div>

              <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-400 underline decoration-dashed">
                 <span className="cursor-pointer">Privacy Policy</span>
                 <span className="cursor-pointer">Refund Policy</span>
                 <span className="cursor-pointer">FAQs</span>
              </div>
              <p className="mt-6 text-[9px] text-gray-400 font-bold tracking-wider">© 2026 DAILY NEEDS HUB - FAST DELIVERY</p>
            </footer>

            {/* FIXED BOTTOM NAVIGATION BAR FOR CATEGORIES */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 p-3 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[2rem]">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-2">
                {categories.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-5 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-300 ${getCategoryColor(c)}`}>{c}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Full Cart Drawer System */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-[2rem] text-black">
            {!showInvoice ? (
              <>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 mb-6">Aapka Bag</h2>
                <div className="space-y-3 mb-6">
                  <input placeholder="Aapka Naam" className="w-full p-3 border border-blue-100 rounded-xl bg-gray-50 text-sm" onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} />
                  <textarea placeholder="Delivery Address" className="w-full p-3 border border-blue-100 rounded-xl bg-gray-50 text-sm" rows="3" onChange={(e) => setCustInfo({...custInfo, address: e.target.value})} />
                </div>
                {cart.map(item => {
                  const finalP = getDiscountedPrice(item.price, item.discount);
                  return (
                    <div key={item.id} className="flex justify-between py-3 border-b border-gray-100 text-xs">
                      <span><b>{item.qty}x</b> {item.name} {item.discount > 0 && <span className="text-[9px] text-red-500">(-{item.discount}%)</span>}</span>
                      <span className="font-bold text-blue-600">₹{finalP * item.qty}</span>
                    </div>
                  );
                })}
                <div className="mt-8">
                  <div className="flex justify-between text-2xl font-black mb-6 text-green-600"><span>Total:</span><span>₹{cartTotal}</span></div>
                  <button onClick={handleOrder} className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 rounded-2xl font-bold shadow-lg text-lg mb-2">WhatsApp Order</button>
                  <button onClick={() => setIsCartOpen(false)} className="w-full py-2 text-gray-400 text-xs font-bold">CLOSE</button>
                </div>
              </>
            ) : (
              <div className="text-center pt-10">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-2">Order Confirmed!</h2>
                <div className="p-4 bg-green-50 rounded-2xl text-left text-xs space-y-2 mb-6 border border-green-100">
                   <p><b>Bill To:</b> {custInfo.name}</p>
                   <p><b>Total Bill:</b> ₹{cartTotal}</p>
                   <p className="text-[10px] text-gray-500 italic">Bill copy has been shared on WhatsApp.</p>
                </div>
                <button onClick={() => {setShowInvoice(false); setCart([]); setIsCartOpen(false);}} className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 rounded-2xl font-bold shadow-lg">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
