import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// Firebase configuration (Netlify settings se aayega)
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
            <button onClick={() => setIsCartOpen(true)} className="bg-green-500 text-white px-3 py-1 rounded-lg">
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
                placeholder="Password likhein (admin123)" 
                className="border p-3 w-full rounded text-black"
                onChange={(e) => e.target.value === 'admin123' && setIsAdmin(true)}
              />
            </div>
          ) : (
            <div className="mt-5">
              <h2 className="text-2xl mb-4 font-bold text-center">Add New Item</h2>
              <form onSubmit={addProduct} className="flex flex-col gap-4">
                <input name="name" placeholder="Saaman ka naam (e.g. Milk)" className="border p-2 text-black rounded" required />
                <input name="price" type="number" placeholder="Price (₹)" className="border p-2 text-black rounded" required />
                <input name="img" placeholder="Photo Emoji (e.g. 🥛)" className="border p-2 text-black rounded" required />
                <button type="submit" className="bg-orange-500 text-white p-3 rounded-lg font-bold">SAVE ITEM</button>
                <button onClick={() => window.location.href='/'} className="text-blue-500 underline mt-2 text-center">Go to Home Page</button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <main className="p-4 grid grid-cols-2 gap-4">
          {products.length === 0 && <p className="col-span-2 text-center mt-10">Abhi koi saaman nahi hai. /admin par jaakar add karein!</p>}
          {products.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow border dark:border-gray-700">
               <div className="text-4xl mb-2">{p.img}</div>
               <h3 className="font-bold text-sm">{p.name}</h3>
               <p className="text-green-600 font-bold">₹{p.price}</p>
               <button onClick={() => addToCart(p)} className="w-full mt-2 bg-orange-500 text-white text-xs py-2 rounded-lg font-bold">ADD TO BAG</button>
            </div>
          ))}
        </main>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-xs bg-white dark:bg-gray-800 h-full p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Aapka Bag</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-red-500 font-bold">X Close</button>
            </div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between border-b py-2 text-sm">
                <span>{item.name} (x{item.qty})</span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}
            <div className="mt-4 font-bold text-xl">Total: ₹{cartTotal}</div>
            <button className="w-full mt-4 bg-green-500 text-white py-3 rounded-xl font-bold">WhatsApp Order Karein</button>
          </div>
        </div>
      )}
    </div>
  );
}
