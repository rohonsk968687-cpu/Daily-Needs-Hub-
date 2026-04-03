import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// Firebase configuration (Netlify settings se automatic aayega)
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || "{}");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    signInAnonymously(auth);
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      setCart(cart.map(x => x.id === p.id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const price = e.target.price.value;
    const img = e.target.img.value;
    await addDoc(collection(db, "products"), { name, price: Number(price), img });
    e.target.reset();
    alert("Saaman add ho gaya!");
  };

  const cartTotal = cart.reduce((a, c) => a + c.price * c.qty, 0);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="p-4 shadow-md bg-white dark:bg-gray-800 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-orange-500">Daily Needs Hub</h1>
        <div className="flex gap-4">
          <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          {window.location.pathname !== '/admin' && (
            <button onClick={() => setIsCartOpen(true)} className="bg-green-500 text-white px-3 py-1 rounded-lg font-bold">
              🛒 ₹{cartTotal}
            </button>
          )}
        </div>
      </header>

      {window.location.pathname === '/admin' ? (
        <div className="p-6 max-w-sm mx-auto">
          {!isAdmin ? (
            <div className="text-center mt-10">
              <h2 className="text-2xl mb-4 font-bold">Admin Login</h2>
              <input 
                type="password" 
                placeholder="Password (admin123)" 
                className="border p-3 w-full rounded text-black"
                onChange={(e) => e.target.value === 'admin123' && setIsAdmin(true)}
              />
            </div>
          ) : (
            <div className="mt-5">
              <h2 className="text-2xl mb-4 font-bold text-center">Add New Item</h2>
              <form onSubmit={addProduct} className="flex flex-col gap-4">
                <input name="name" placeholder="Item Name" className="border p-2 text-black rounded" required />
                <input name="price" type="number" placeholder="Price (₹)" className="border p-2 text-black rounded" required />
                <input name="img" placeholder="Emoji (🥛) ya Photo Link" className="border p-2 text-black rounded" required />
                <button type="submit" className="bg-orange-500 text-white p-3 rounded-lg font-bold">SAVE ITEM</button>
                <button onClick={() => window.location.href='/'} className="text-blue-500 underline mt-2 text-center text-sm">Go to Home Page</button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-orange-500 to-yellow-400 p-8 text-white text-center rounded-b-3xl mb-6 shadow-lg">
            <h2 className="text-3xl font-extrabold mb-2">Aapki Apni Dukan! 🛒</h2>
            <p className="text-sm opacity-90">Fresh Items, Best Price, Seedha Aapke Ghar.</p>
          </div>

          <main className="p-4 grid grid-cols-2 gap-4">
            {products.length === 0 && <p className="col-span-2 text-center mt-10 text-gray-400">Abhi koi saaman nahi hai.</p>}
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border dark:border-gray-700">
                 <div className="h-32 w-full flex items-center justify-center mb-2 overflow-hidden rounded-lg bg-gray-50">
                   {p.img.includes('http') ? (
                     <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                   ) : (
                     <span className="text-4xl">{p.img}</span>
                   )}
                 </div>
                 <h3 className="font-bold text-sm">{p.name}</h3>
                 <p className="text-green-600 font-bold text-lg">₹{p.price}</p>
                 <button onClick={() => addToCart(p)} className="w-full mt-2 bg-orange-500 text-white text-xs py-2 rounded-lg font-bold shadow-md active:scale-95">ADD TO BAG</button>
              </div>
            ))}
          </main>

          <footer className="p-8 bg-white dark:bg-gray-800 mt-10 border-t-2 border-orange-50 dark:border-gray-700 text-center">
            <h3 className="font-bold text-xl text-orange-500 mb-2">Daily Needs Hub</h3>
            <p className="text-sm text-gray-500 mb-4 italic">Main Market, Near City Tower, Aapka Pata.</p>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-200 inline-block w-full max-w-xs">
              <p className="text-xs font-bold text-green-600 uppercase mb-1">Order on WhatsApp</p>
              <p className="text-lg font-bold text-gray-800">+91 918637589429</p>
            </div>
          </footer>
        </>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-xs bg-white dark:bg-gray-800 h-full p-6 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-orange-500">Aapka Bag</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-red-500 text-xl font-bold">✕</button>
            </div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b py-4">
                <div><p className="font-bold">{item.name}</p><p className="text-xs text-gray-400 text-left">Qty: {item.qty}</p></div>
                <span className="font-bold text-green-600">₹{item.price * item.qty}</span>
              </div>
            ))}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-xl font-bold mb-6"><span>Total:</span><span>₹{cartTotal}</span></div>
              <button 
                onClick={() => {
                  const msg = `Hello! Order details: ${cart.map(i => `${i.name} (x${i.qty})`).join(", ")}. Total: ₹${cartTotal}`;
                  window.open(`https://wa.me/918637589429?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg"
              >
                WhatsApp Order Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
