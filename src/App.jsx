import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// Firebase configuration (Netlify variables se aayega)
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

    // Load Products
    useEffect(() => {
        signInAnonymously(auth);
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
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

    const cartTotal = cart.reduce((a, c) => a + c.price * c.qty, 0);

    const sendWhatsApp = () => {
        let text = "Naya Order (Daily Needs Hub):%0A";
        cart.forEach(item => text += `- ${item.name} (x${item.qty})%0A`);
        text += `%0ATotal: ₹${cartTotal}`;
        window.open(`https://wa.me/918637589429?text=${text}`);
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <header className="p-4 shadow-md bg-white dark:bg-gray-800 sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-xl font-bold text-orange-500">Daily Needs Hub</h1>
                <div className="flex gap-4">
                    <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
                    <button onClick={() => setIsCartOpen(true)} className="bg-green-500 text-white px-3 py-1 rounded-lg">
                        🛒 ₹{cartTotal}
                    </button>
                </div>
            </header>

            <main className="p-4 grid grid-cols-2 gap-4">
                {products.map(p => (
                    <div key={p.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow border dark:border-gray-700">
                        <div className="text-4xl mb-2">{p.img || '📦'}</div>
                        <h3 className="font-bold text-sm">{p.name}</h3>
                        <p className="text-green-600 font-bold">₹{p.price}</p>
                        <button 
                            onClick={() => addToCart(p)}
                            className="w-full mt-2 bg-orange-500 text-white text-xs py-2 rounded-lg font-bold"
                        >
                            ADD TO BAG
                        </button>
                    </div>
                ))}
            </main>

            {isCartOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
                    <div className="w-full max-w-xs bg-white dark:bg-gray-800 h-full p-4 overflow-y-auto">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">Aapka Bag</h2>
                            <button onClick={() => setIsCartOpen(false)}>❌</button>
                        </div>
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between border-b py-2 text-sm">
                                <span>{item.name} (x{item.qty})</span>
                                <span>₹{item.price * item.qty}</span>
                            </div>
                        ))}
                        <div className="mt-4 font-bold text-xl">Total: ₹{cartTotal}</div>
                        <button 
                            onClick={sendWhatsApp}
                            className="w-full mt-6 bg-green-500 text-white py-3 rounded-xl font-bold"
                        >
                            WhatsApp Order Karein
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
