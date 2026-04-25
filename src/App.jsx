import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

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
  const [custInfo, setCustInfo] = useState({ name: '', address: '', upiId: '918637589429@paytm' }); // Apni UPI ID yahan dalein

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // --- Core Functions ---
  const addToCart = (p) => {
    if (p.stock <= 0) return alert("Out of Stock!");
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
    if(!custInfo.name || !custInfo.address) return alert("Pata bharein!");
    const upiLink = `upi://pay?pa=${custInfo.upiId}&pn=DailyNeeds&am=${cartTotal}&cu=INR`;
    const itemsMsg = cart.map(i => `${i.name} (x${i.qty})`).join(", ");
    const msg = `Naya Order!\n\nNaam: ${custInfo.name}\nAddress: ${custInfo.address}\nItems: ${itemsMsg}\nTotal: ₹${cartTotal}\nPayment: UPI Requested`;
    window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
    setShowInvoice(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-10">
      {/* Header & Search */}
      <header className="p-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-black text-orange-500 tracking-tighter">DAILY NEEDS HUB</h1>
          <button onClick={() => setIsCartOpen(true)} className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">🛒 ₹{cartTotal}</button>
        </div>
        <input 
          type="text" placeholder="Search items (Milk, Soap...)" 
          className="w-full p-3 bg-gray-100 rounded-2xl border-none text-sm focus:ring-2 focus:ring-orange-300"
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {window.location.pathname === '/admin' ? (
        /* Admin Dashboard & Stock Management */
        <div className="p-4 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Admin Sales & Stock</h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-500 p-4 rounded-2xl text-white">
              <p className="text-xs opacity-80">Total Items</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="bg-red-500 p-4 rounded-2xl text-white">
              <p className="text-xs opacity-80">Out of Stock</p>
              <p className="text-2xl font-bold">{products.filter(p => p.stock <= 0).length}</p>
            </div>
          </div>

          <form onSubmit={addProduct} className="bg-white p-4 rounded-2xl shadow mb-8 grid gap-3">
            <h3 className="font-bold">Add New Stock</h3>
            <input name="name" placeholder="Item Name" className="border p-2 rounded-lg" required />
            <div className="grid grid-cols-2 gap-2">
              <input name="price" type="number" placeholder="Price" className="border p-2 rounded-lg" required />
              <input name="stock" type="number" placeholder="Stock Qty" className="border p-2 rounded-lg" required />
            </div>
            <input name="img" placeholder="Emoji ya Link" className="border p-2 rounded-lg" required />
            <select name="category" className="border p-2 rounded-lg">
              {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="bg-orange-500 text-white p-3 rounded-lg font-bold">ADD TO INVENTORY</button>
          </form>

          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                </div>
                <div className="flex gap-2">
                  <input type="number" className="w-16 border rounded p-1 text-xs" onBlur={(e) => updateStock(p.id, e.target.value)} placeholder="New Stock" />
                  <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500 font-bold">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Customer Frontend */
        <>
          <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap ${activeCategory === c ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-400 border'}`}>{c}</button>
            ))}
          </div>

          <main className="p-4 grid grid-cols-2 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 relative">
                 <button onClick={() => toggleWishlist(p)} className="absolute top-2 right-2 text-lg">{wishlist.find(x => x.id === p.id) ? '❤️' : '🤍'}</button>
                 <div className="h-28 flex items-center justify-center text-5xl mb-2 bg-gray-50 rounded-xl">
                   {p.img.includes('http') ? <img src={p.img} className="h-full w-full object-cover rounded-xl" /> : p.img}
                 </div>
                 <h3 className="font-bold text-xs truncate">{p.name}</h3>
                 <div className="flex justify-between items-center mt-1">
                   <p className="text-orange-500 font-black">₹{p.price}</p>
                   <p className={`text-[8px] font-bold ${p.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{p.stock > 0 ? `${p.stock} Left` : 'Sold Out'}</p>
                 </div>
                 <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`w-full mt-3 py-2 rounded-xl font-bold text-[10px] ${p.stock > 0 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>ADD TO BAG</button>
              </div>
            ))}
          </main>
        </>
      )}

      {/* Cart, UPI & Invoice Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 shadow-2xl overflow-y-auto">
            {!showInvoice ? (
              <>
                <h2 className="text-2xl font-black text-orange-500 mb-6">CHECKOUT</h2>
                <div className="space-y-3 mb-8">
                  <input placeholder="Customer Name" className="w-full p-3 border rounded-xl text-sm bg-gray-50" onChange={(e) => setCustInfo({...custInfo, name: e.target.value})} />
                  <textarea placeholder="Delivery Address" className="w-full p-3 border rounded-xl text-sm bg-gray-50" onChange={(e) => setCustInfo({...custInfo, address: e.target.value})} />
                </div>
                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                  <p className="text-[10px] font-bold text-blue-600 mb-1">UPI PAYMENT PREVIEW</p>
                  <p className="text-xs text-gray-600">Scan QR or Click to Pay after Order</p>
                </div>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-2 border-b text-xs">
                    <span>{item.name} x{item.qty}</span>
                    <span className="font-bold">₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div className="mt-8">
                  <div className="flex justify-between text-xl font-bold mb-6"><span>Total:</span><span>₹{cartTotal}</span></div>
                  <button onClick={handleOrder} className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg mb-2">Order & Pay via UPI</button>
                  <button onClick={() => setIsCartOpen(false)} className="w-full py-2 text-gray-400 text-xs">Back to Shop</button>
                </div>
              </>
            ) : (
              /* Invoice Bill View */
              <div id="invoice" className="text-left">
                <h2 className="text-center font-bold text-xl mb-4 border-b pb-2">TAX INVOICE</h2>
                <p className="text-xs"><b>Customer:</b> {custInfo.name}</p>
                <p className="text-xs"><b>Date:</b> {new Date().toLocaleDateString()}</p>
                <p className="text-xs mb-4"><b>Address:</b> {custInfo.address}</p>
                <table className="w-full text-xs mb-6">
                  <tr className="border-b"><th className="text-left py-2">Item</th><th>Qty</th><th>Amt</th></tr>
                  {cart.map(i => (
                    <tr key={i.id} className="border-b"><td className="py-2">{i.name}</td><td className="text-center">{i.qty}</td><td className="text-right">₹{i.price * i.qty}</td></tr>
                  ))}
                </table>
                <div className="text-right font-bold text-lg mb-8">Total Paid: ₹{cartTotal}</div>
                <div className="text-center text-[10px] text-gray-400 italic">Thank you for shopping at Daily Needs Hub!</div>
                <button onClick={() => {setShowInvoice(false); setCart([]); setIsCartOpen(false);}} className="w-full bg-orange-500 text-white py-3 rounded-xl mt-10 font-bold">DONE</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

