import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

// Firebase Config (Netlify environment variables se automatic aayega)
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || "{}");
const app = initializeApp(firebaseConfig);
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

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // --- Logic Functions ---
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
    const { name, price, img, category, stock } = e.target;
    await addDoc(collection(db, "products"), { 
      name: name.value, price: Number(price.value), img: img.value, 
      category: category.value, stock: Number(stock.value) 
    });
    e.target.reset();
    alert("Saaman jud gaya!");
  };

  const updateStock = async (id, newStock) => {
    await updateDoc(doc(db, "products", id), { stock: Number(newStock) });
  };

  const cartTotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && 
    (activeCategory === "All" || p.category === activeCategory)
  );

  const handleOrder = () => {
    if(!custInfo.name || !custInfo.address) return alert("Naam aur Pata bharna zaruri hai!");
    const itemsMsg = cart.map(i => `${i.name} (x${i.qty})`).join(", ");
    const msg = `Naya Order - Daily Needs Hub\n\nNaam: ${custInfo.name}\nAddress: ${custInfo.address}\nItems: ${itemsMsg}\nTotal: ₹${cartTotal}\n\nKripya Payment details bhejein.`;
    window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
    setShowInvoice(true);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-50 via-white to-yellow-50 text-gray-900'} pb-10 transition-all duration-500`}>
      
      {/* Header */}
      <header className="p-4 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 flex justify-between items-center border-b border-orange-100">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-500 tracking-tighter italic">
          DAILY NEEDS HUB
        </h1>
        <div className="flex items-center gap-3">
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 rounded-full">{darkMode ? '☀️' : '🌙'}</button>
           <button onClick={() => setIsCartOpen(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all">
             🛒 ₹{cartTotal}
           </button>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {/* Search Bar */}
        <div className="p-4">
          <input 
            type="text" placeholder="Search (Milk, Soap, Kitkat...)" 
            className="w-full p-4 bg-white/90 rounded-2xl border-2 border-orange-100 text-sm focus:border-orange-400 focus:outline-none shadow-sm transition-all"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {window.location.pathname === '/admin' ? (
          /* Admin View */
          <div className="p-4">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-orange-50">
               <h2 className="text-xl font-bold mb-4 text-orange-600">Admin Dashboard</h2>
               {!isAdmin ? (
                 <input type="password" placeholder="Password" className="border p-3 w-full rounded-xl" onChange={(e) => e.target.value === 'admin123' && setIsAdmin(true)} />
               ) : (
                 <div className="space-y-6">
                    <form onSubmit={addProduct} className="grid gap-3">
                      <input name="name" placeholder="Item Name" className="border p-3 rounded-xl bg-gray-50" required />
                      <div className="grid grid-cols-2 gap-2">
                        <input name="price" type="number" placeholder="Price" className="border p-3 rounded-xl bg-gray-50" required />
                        <input name="stock" type="number" placeholder="Stock Qty" className="border p-3 rounded-xl bg-gray-50" required />
                      </div>
                      <input name="img" placeholder="Emoji ya Image Link" className="border p-3 rounded-xl bg-gray-50" required />
                      <select name="category" className="border p-3 rounded-xl bg-gray-50">
                        {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button className="bg-orange-500 text-white p-4 rounded-xl font-bold shadow-lg">ADD ITEM</button>
                    </form>
                    <div className="space-y-2">
                      <h3 className="font-bold border-b pb-2">Manage Stock</h3>
                      {products.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold">{p.name} (Qty: {p.stock})</span>
                          <div className="flex gap-2">
                             <input type="number" className="w-16 p-1 border rounded" onBlur={(e) => updateStock(p.id, e.target.value)} placeholder="New" />
                             <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          </div>
        ) : (
          /* Customer View */
          <>
            <div className="px-4 mb-2">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-400 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-black mb-1">Aapki Apni Dukan! 🛒</h2>
                  <p className="text-xs opacity-90 font-medium italic">Fresh Items, Best Price, Seedha Ghar Tak.</p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-20">🛍️</div>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)} className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === c ? 'bg-orange-500 text-white shadow-md scale-105' : 'bg-white text-gray-400 border border-orange-50'}`}>{c}</button>
              ))}
            </div>

            {/* Products Grid */}
            <main className="p-4 grid grid-cols-2 gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white/80 backdrop-blur-sm p-3 rounded-[2rem] shadow-md border border-white relative active:scale-95 transition-all">
                   <button onClick={() => toggleWishlist(p)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full shadow-sm text-sm">
                     {wishlist.find(x => x.id === p.id) ? '❤️' : '🤍'}
                   </button>
                   <div className="h-32 flex items-center justify-center text-5xl mb-3 bg-gradient-to-b from-orange-50 to-white rounded-2xl overflow-hidden">
                     {p.img.includes('http') ? <img src={p.img} className="h-full w-full object-cover" /> : p.img}
                   </div>
                   <div className="px-1 text-center">
                     <h3 className="font-bold text-gray-700 text-sm truncate">{p.name}</h3>
                     <p className="text-lg font-black text-orange-600">₹{p.price}</p>
                     <p className={`text-[9px] font-bold mt-1 ${p.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {p.stock > 0 ? `${p.stock} in Stock` : 'Out of Stock'}
                     </p>
                     <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`w-full mt-3 py-3 rounded-2xl font-bold text-[10px] ${p.stock > 0 ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}>
                       ADD TO BAG
                     </button>
                   </div>
                </div>
              ))}
            </main>
          </>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 shadow-2xl overflow-y-auto rounded-l-[2rem]">
            {!showInvoice ? (
              <>
                <h2 className="text-2xl font-black text-orange-600 mb-6">Aapka Bag</h2>
                <div className="space-y-3 mb-6">
                  <input placeholder="Aapka Naam" className="w-full p-3 border rounded-xl bg-gray-50 text-sm" onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} />
                  <textarea placeholder="Delivery Address" className="w-full p-3 border rounded-xl bg-gray-50 text-sm" rows="3" onChange={(e) => setCustInfo({...custInfo, address: e.target.value})} />
                </div>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-3 border-b border-gray-100 text-xs">
                    <span><b>{item.qty}x</b> {item.name}</span>
                    <span className="font-bold">₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div className="mt-8">
                  <div className="flex justify-between text-2xl font-black mb-6 text-orange-600"><span>Total:</span><span>₹{cartTotal}</span></div>
                  <button onClick={handleOrder} className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg text-lg mb-2">WhatsApp Order</button>
                  <button onClick={() => setIsCartOpen(false)} className="w-full py-2 text-gray-400 text-xs font-bold">CLOSE</button>
                </div>
              </>
            ) : (
              /* Invoice */
              <div className="text-center pt-10">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-2">Order Confirmed!</h2>
                <div className="p-4 bg-orange-50 rounded-2xl text-left text-xs space-y-2 mb-6">
                   <p><b>Bill To:</b> {custInfo.name}</p>
                   <p><b>Total Bill:</b> ₹{cartTotal}</p>
                   <p className="text-[10px] text-gray-500 italic">Bill copy has been shared on WhatsApp.</p>
                </div>
                <button onClick={() => {setShowInvoice(false); setCart([]); setIsCartOpen(false);}} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

