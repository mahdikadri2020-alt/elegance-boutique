// Update Router Configuration
/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Trash2, 
  TrendingUp, Users, Image as ImageIcon, CheckCircle, Lock, 
  Eye, EyeOff, LogOut, ShoppingBag, X, Phone, MapPin, Loader, UploadCloud, Edit, Plus,
  ArrowLeft, ChevronRight, Star, Share2, Truck, Save, Map, Filter
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, 
  doc, updateDoc, getDoc, setDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- Configuration Firebase ---
// Using environment variables provided by the platform or falling back to defaults
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAlWIMQPdg9F48Q2r6M3Xxv3pJq08Hk8ps",
  authDomain: "elegance-boutique-38d2b.firebaseapp.com",
  projectId: "elegance-boutique-38d2b",
  storageBucket: "elegance-boutique-38d2b.firebasestorage.app",
  messagingSenderId: "858754859112",
  appId: "1:858754859112:web:4a43992d7d2d0cb98afbdd",
  measurementId: "G-9F5KQS0PGH"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants ---
const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
  "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
  "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
  "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
];

// --- Styles Globaux ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@200;300;400;500;600&display=swap');
    
    body {
      font-family: 'Montserrat', sans-serif;
      overflow-x: hidden;
      background-color: #fcfcfc;
    }
    
    .logo-font {
      font-family: 'Playfair Display', serif;
    }

    .slide-in {
      animation: slideIn 0.3s ease-out forwards;
    }

    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

// --- Composant Panel Admin ---
const AdminPanel = ({ onBackToStore }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryFees, setDeliveryFees] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // État pour l'édition
  const [editingProduct, setEditingProduct] = useState(null);

  // Local state for fee editing to avoid constant re-renders from Firebase
  const [localFees, setLocalFees] = useState({});

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Costumes',
    description: '',
    images: [],
    sizes: [],
    colors: []
  });

  const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const SHOE_SIZES = [];
  for (let i = 35; i <= 45; i += 0.5) {
    SHOE_SIZES.push(i.toString());
  }
  const AVAILABLE_COLORS = ['Noir', 'Blanc', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Gris', 'Beige', 'Marron', 'Rose'];

  // Auth Effect
  useEffect(() => {
    // Only subscribe to auth state changes, init is handled in App
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Data Fetching Effect
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
    }, (error) => console.error("Products fetch error:", error));

    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ords);
    }, (error) => console.error("Orders fetch error:", error));

    const feesRef = collection(db, 'artifacts', appId, 'public', 'data', 'delivery_fees');
    const unsubscribeFees = onSnapshot(feesRef, (snapshot) => {
      const feesMap = {};
      snapshot.docs.forEach(doc => {
        feesMap[doc.id] = doc.data();
      });
      setDeliveryFees(feesMap);
      setLocalFees(prev => ({...feesMap, ...prev}));
    }, (error) => console.error("Fees fetch error:", error));

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeFees();
    };
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    setTimeout(() => {
      if (loginData.username === 'admin' && loginData.password === 'adil123789') {
        setIsAuthenticated(true);
      } else {
        setLoginError('Identifiants incorrects. Veuillez réessayer.');
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleFeeChange = (wilaya, type, value) => {
    setLocalFees(prev => {
      const currentData = prev[wilaya] || { home: 800, desk: 400 };
      return {
        ...prev,
        [wilaya]: {
          ...currentData,
          [type]: value === '' ? 0 : (parseInt(value) || 0)
        }
      };
    });
  };

  const saveFee = async (wilaya) => {
    const feeData = localFees[wilaya] || { home: 800, desk: 400 };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery_fees', wilaya), feeData);
      alert(`Tarifs mis à jour pour ${wilaya}`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.size > 500 * 1024) { 
        alert(`L'image ${file.name} est trop volumineuse (max 500kb).`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewProductImage = (index) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleSize = (size) => {
    setNewProduct(prev => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const toggleColor = (color) => {
    setNewProduct(prev => {
      const colors = prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors };
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    if (newProduct.images.length === 0) {
      alert("Veuillez ajouter au moins une image.");
      return;
    }

    setIsSubmitting(true);
    try {
      const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      await addDoc(productsRef, {
        ...newProduct,
        image: newProduct.images[0], // Fallback image principale
        price: parseFloat(newProduct.price),
        createdAt: new Date().toISOString()
      });
      setNewProduct({
        name: '',
        price: '',
        category: 'Costumes',
        description: '',
        images: [],
        sizes: [],
        colors: []
      });
      setActiveTab('products');
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Erreur lors de l'ajout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Logic pour l'édition ---

  const handleEditClick = (product) => {
    const initialImages = product.images || (product.image ? [product.image] : []);
    setEditingProduct({ 
      ...product, 
      images: initialImages,
      colors: product.colors || []
    });
  };

  const handleEditImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 500 * 1024) {
        alert("Image trop volumineuse (max 500KB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEditProductImage = (index) => {
    setEditingProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleEditSize = (size) => {
    setEditingProduct(prev => {
      const sizes = prev.sizes ? prev.sizes : [];
      const newSizes = sizes.includes(size)
        ? sizes.filter(s => s !== size)
        : [...sizes, size];
      return { ...prev, sizes: newSizes };
    });
  };

  const toggleEditColor = (color) => {
    setEditingProduct(prev => {
      const colors = prev.colors ? prev.colors : [];
      const newColors = colors.includes(color)
        ? colors.filter(c => c !== color)
        : [...colors, color];
      return { ...prev, colors: newColors };
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!user || !editingProduct) return;

    if (editingProduct.images.length === 0) {
        alert("Le produit doit avoir au moins une image.");
        return;
    }

    setIsSubmitting(true);
    try {
      const productRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', editingProduct.id);
      await updateDoc(productRef, {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price),
        category: editingProduct.category,
        images: editingProduct.images,
        image: editingProduct.images[0],
        sizes: editingProduct.sizes || [],
        colors: editingProduct.colors || []
      });
      setEditingProduct(null); 
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Erreur lors de la modification.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const deleteItem = async (col, id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', id);
      await updateDoc(orderRef, { status });
    } catch (error) {
      console.error("Update status error:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-indigo-950 font-sans">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 slide-in">
          <button onClick={onBackToStore} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm uppercase tracking-widest transition-colors">
            <X size={16} /> Retour à la boutique
          </button>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4 text-amber-600">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">ÉLÉGANCE Admin</h1>
            <p className="text-slate-500 mt-2">Connectez-vous pour gérer la boutique</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nom d'utilisateur</label>
              <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" placeholder="admin" value={loginData.username} onChange={(e) => setLoginData({...loginData, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" placeholder="••••••••" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {loginError && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center animate-pulse">{loginError}</div>}
            <button type="submit" disabled={isLoggingIn} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95">
              {isLoggingIn ? <Loader className="animate-spin" size={20} /> : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-left" dir="ltr">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col gap-8 shadow-xl shrink-0">
        <div className="text-center">
          <h1 className="text-2xl font-serif tracking-widest text-amber-500 logo-font">Élégance (V2)</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Haute Couture</p>
        </div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}><LayoutDashboard size={20} /><span>Tableau de bord</span></button>
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'products' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}><Package size={20} /><span>Produits</span></button>
          <button onClick={() => setActiveTab('add-product')} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'add-product' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}><PlusCircle size={20} /><span>Ajouter un produit</span></button>
          <button onClick={() => setActiveTab('delivery')} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'delivery' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}><Truck size={20} /><span>Livraison (التوصيل)</span></button>
          <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}><ShoppingCart size={20} /><span>Commandes</span> {orders.filter(o => o.status === 'pending').length > 0 && <span className="ml-auto bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">{orders.filter(o => o.status === 'pending').length}</span>}</button>
        </nav>
        <div className="mt-auto space-y-4">
          <button onClick={onBackToStore} className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-transparent"><ShoppingBag size={20} /><span>Aller à la Boutique</span></button>
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all border border-transparent"><LogOut size={20} /><span>Déconnexion</span></button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        {/* ... (Existing Admin Panel Content remains unchanged) ... */}
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Aperçu de la boutique'}
              {activeTab === 'products' && 'Gestion des produits'}
              {activeTab === 'add-product' && 'Ajouter une nouvelle pièce'}
              {activeTab === 'delivery' && 'Tarifs de Livraison'}
              {activeTab === 'orders' && 'Commandes clients'}
            </h2>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500">
              <p className="text-slate-500 text-sm">Ventes Totales</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{orders.reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString()} <span className="text-sm font-normal">DZD</span></h3>
              <div className="mt-4 flex items-center text-green-500 text-xs font-bold gap-1"><TrendingUp size={14} /> <span>+12% ce mois</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-slate-800"><p className="text-slate-500 text-sm">Produits Actifs</p><h3 className="text-3xl font-bold text-slate-800 mt-2">{products.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500"><p className="text-slate-500 text-sm">Commandes en cours</p><h3 className="text-3xl font-bold text-slate-800 mt-2">{orders.filter(o => o.status === 'pending').length}</h3></div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr><th className="p-4 text-sm font-semibold text-slate-600">Produit</th><th className="p-4 text-sm font-semibold text-slate-600">Catégorie</th><th className="p-4 text-sm font-semibold text-slate-600">Prix</th><th className="p-4 text-sm font-semibold text-slate-600">Actions</th></tr>
                </thead>
                <tbody>
                  {products.length === 0 && (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">Aucun produit ajouté. Allez dans l'onglet "Ajouter un produit".</td></tr>
                  )}
                  {products.map((p) => {
                    const thumbnail = (p.images && p.images.length > 0) ? p.images[0] : p.image;
                    return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={thumbnail} className="w-12 h-12 rounded-lg object-cover shadow-sm bg-slate-100" alt={p.name} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">{p.category}</span></td>
                      <td className="p-4 font-bold text-slate-800">{p.price.toLocaleString()} DZD</td>
                      <td className="p-4 flex gap-2">
                          <button onClick={() => handleEditClick(p)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"><Edit size={18} /></button>
                          <button onClick={() => deleteItem('products', p.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal d'édition */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 animate-fade-in relative">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-slate-800">Modifier le produit</h3>
                 <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Nom du produit</label>
                    <input required className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Prix (DZD)</label>
                    <input required type="number" className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-700">Catégorie</label>
                  <select className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}>
                    <option>Costumes</option>
                    <option>Chemises</option>
                    <option>Chaussures</option>
                    <option>Accessoires</option>
                    <option>Manteaux</option>
                    <option>Pantalon</option>
                  </select>
                </div>
                
                {/* Sizes for Edit */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Tailles disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {(editingProduct.category === 'Chaussures' ? SHOE_SIZES : CLOTHING_SIZES).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleEditSize(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                          (editingProduct.sizes || []).includes(size)
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-amber-500 hover:text-amber-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors for Edit */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Couleurs disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleEditColor(color)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                          (editingProduct.colors || []).includes(color)
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-amber-500 hover:text-amber-600'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Images */}
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Images du produit</label>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {editingProduct.images && editingProduct.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeEditProductImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="relative aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={handleEditImagesUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Plus size={24} />
                      <span className="text-[10px] mt-1 font-bold uppercase">Ajouter</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 p-4 rounded-xl font-bold hover:bg-slate-50 transition-colors">Annuler</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-xl font-bold transition-all shadow-md">
                    {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
                    </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'add-product' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm animate-fade-in">
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-bold text-slate-700">Nom du produit</label><input required className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} /></div>
                <div><label className="text-sm font-bold text-slate-700">Prix (DZD)</label><input required type="number" className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} /></div>
              </div>
              <div><label className="text-sm font-bold text-slate-700">Catégorie</label><select className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}><option>Costumes</option><option>Chemises</option><option>Chaussures</option><option>Accessoires</option><option>Manteaux</option><option>Pantalon</option></select></div>
              
              {/* Size Select */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Tailles disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {(newProduct.category === 'Chaussures' ? SHOE_SIZES : CLOTHING_SIZES).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                        newProduct.sizes.includes(size)
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-amber-500 hover:text-amber-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Select */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Couleurs disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                        newProduct.colors.includes(color)
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-amber-500 hover:text-amber-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Images Multiples */}
              <div>
                <label className="text-sm font-bold text-slate-700">Images du produit</label>
                <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50">
                  
                  {/* Grid des images sélectionnées */}
                  {newProduct.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {newProduct.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeNewProductImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col items-center justify-center relative hover:bg-slate-100 transition-colors rounded-lg p-4 cursor-pointer">
                      <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleImagesUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {newProduct.images.length > 0 ? "Ajouter d'autres images" : "Cliquez pour ajouter des images"}
                    </p>
                    <p className="text-xs text-slate-400">PNG, JPG jusqu'à 500 Ko</p>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-xl font-bold transition-all transform active:scale-95 shadow-md hover:shadow-lg">
                {isSubmitting ? 'Enregistrement...' : 'Publier le produit'}
              </button>
            </form>
          </div>
        )}

        {/* ... (Delivery and Orders tabs remain unchanged) ... */}
        {activeTab === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Gestion des Tarifs de Livraison (Wilayas)</h3>
                <p className="text-sm text-slate-500">Définissez les prix de livraison pour chaque wilaya. Cliquez sur l'icône de sauvegarde pour enregistrer.</p>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 border-b border-slate-100">
                     <tr>
                       <th className="p-4 text-sm font-semibold text-slate-600">Wilaya</th>
                       <th className="p-4 text-sm font-semibold text-slate-600">Prix Bureau (Stop Desk)</th>
                       <th className="p-4 text-sm font-semibold text-slate-600">Prix Domicile</th>
                       <th className="p-4 text-sm font-semibold text-slate-600 w-24">Action</th>
                     </tr>
                   </thead>
                   <tbody>
                     {WILAYAS.map((wilaya, index) => {
                       const fees = localFees[wilaya] || { home: 800, desk: 400 };
                       const deskVal = fees.desk !== undefined ? fees.desk : 400;
                       const homeVal = fees.home !== undefined ? fees.home : 800;
                       
                       return (
                         <tr key={wilaya} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-700">
                              <span className="inline-block w-8 text-slate-400 font-normal text-xs">{index + 1}</span> {wilaya}
                            </td>
                            <td className="p-4">
                               <div className="relative max-w-[150px]">
                                 <input 
                                   type="number" 
                                   value={deskVal}
                                   onChange={(e) => handleFeeChange(wilaya, 'desk', e.target.value)}
                                   className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                 />
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">DA</span>
                               </div>
                            </td>
                            <td className="p-4">
                               <div className="relative max-w-[150px]">
                                 <input 
                                   type="number" 
                                   value={homeVal}
                                   onChange={(e) => handleFeeChange(wilaya, 'home', e.target.value)}
                                   className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                 />
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">DA</span>
                               </div>
                            </td>
                            <td className="p-4">
                               <button 
                                 onClick={() => saveFee(wilaya)}
                                 className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                 title="Enregistrer"
                               >
                                 <Save size={18} />
                               </button>
                            </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
              </div>
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
              {orders.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100">Aucune commande pour le moment.</div>
              )}
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md">
                {/* ... (Existing order display code) ... */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">{order.customerName}</h4>
                        <p className="text-sm text-slate-500 font-medium">{order.customerPhone}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">{order.total.toLocaleString()} DZD</p>
                          <div className={`text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 mt-1 ${order.deliveryType === 'home' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                             <Truck size={12} /> {order.deliveryType === 'home' ? 'Domicile' : 'Bureau (Stop Desk)'}
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">{order.customerWilaya} - {order.customerCommune}</span>
                  </div>
                  {/* Items display */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Articles commandés</p>
                      {order.items.map((item, idx) => {
                          const isObject = typeof item === 'object' && item !== null;
                          const itemName = isObject ? item.name : item;
                          const itemDetails = isObject ? 
                              [item.selectedSize && `Taille: ${item.selectedSize}`, item.selectedColor && `Couleur: ${item.selectedColor}`].filter(Boolean).join(' • ') 
                              : '';
                          const itemImage = isObject ? item.image : null;

                          return (
                              <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                                  {itemImage ? (
                                      <img src={itemImage} alt={itemName} className="w-10 h-10 rounded-md object-cover border border-slate-200" />
                                  ) : (
                                     <div className="w-10 h-10 rounded-md bg-slate-200 flex items-center justify-center text-slate-400">
                                        <Package size={16} />
                                     </div>
                                  )}
                                  <div>
                                      <p className="text-sm font-bold text-slate-700">{itemName}</p>
                                      {itemDetails && <p className="text-xs text-slate-500">{itemDetails}</p>}
                                  </div>
                              </div>
                          );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 self-start sm:self-center">
                  {order.status === 'pending' ? (
                    <button onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 sm:flex-none justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow">
                      <CheckCircle size={16} /> Valider
                    </button>
                  ) : (
                    <span className="flex-1 sm:flex-none justify-center bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-default">
                        Traité
                    </span>
                  )}
                  <button onClick={() => deleteItem('orders', order.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- Nouveau Composant CartDrawer (SÉPARÉ) ---
const CartDrawer = ({ isOpen, onClose, cart, removeFromCart, user }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', commune: '' });
  const [orderComplete, setOrderComplete] = useState(false);
  const [deliveryType, setDeliveryType] = useState('home');
  const [deliveryFees, setDeliveryFees] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!user) return;
    const feesRef = collection(db, 'artifacts', appId, 'public', 'data', 'delivery_fees');
    const unsubscribeFees = onSnapshot(feesRef, (snapshot) => {
      const feesMap = {};
      snapshot.docs.forEach(doc => {
        feesMap[doc.id] = doc.data();
      });
      setDeliveryFees(feesMap);
    });
    return () => unsubscribeFees();
  }, [user]);

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const currentWilayaFees = (formData.wilaya && deliveryFees[formData.wilaya]) 
                            ? deliveryFees[formData.wilaya] 
                            : {}; 
  const homePrice = currentWilayaFees.home !== undefined ? currentWilayaFees.home : 800;
  const deskPrice = currentWilayaFees.desk !== undefined ? currentWilayaFees.desk : 400;
  const deliveryPrice = deliveryType === 'home' ? homePrice : deskPrice;
  const total = subtotal + deliveryPrice;

  const handleOrder = async () => {
    if (!formData.name || !formData.phone || !formData.wilaya || !formData.commune) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    
    if (!user) {
        alert("Erreur d'authentification. Veuillez rafraîchir la page.");
        return;
    }

    try {
      const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      
      const orderItems = cart.map(c => ({
        name: c.name,
        selectedSize: c.selectedSize || null,
        selectedColor: c.selectedColor || null,
        image: (c.images && c.images.length > 0) ? c.images[0] : (c.image || c.img),
        price: c.price
      }));

      await addDoc(ordersRef, {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerWilaya: formData.wilaya,
        customerCommune: formData.commune,
        deliveryType: deliveryType, 
        deliveryPrice: deliveryPrice,
        itemsCount: cart.length,
        subtotal: subtotal,
        total: total,
        status: 'pending',
        items: orderItems,
        createdAt: new Date().toISOString()
      });
      setOrderComplete(true);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'envoi de la commande. Vérifiez votre connexion.");
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
        <div className={`absolute right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 flex justify-between items-center border-b border-gray-100">
            <h2 className="logo-font text-3xl italic">Votre Sélection</h2>
            <button onClick={onClose} className="hover:rotate-90 transition duration-500"><X className="text-gray-400" strokeWidth={1} /></button>
          </div>

          <div className="flex-grow p-8 overflow-y-auto space-y-8 no-scrollbar">
            {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                  <p className="italic font-light">Le panier est vide.</p>
               </div>
            ) : (
               cart.map((item, i) => {
                  const itemImg = (item.images && item.images.length > 0) ? item.images[0] : (item.image || item.img);
                  return (
                  <div key={i} className="flex justify-between items-center slide-in" style={{animationDelay: `${i * 0.1}s`}}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gray-100 overflow-hidden">
                          <img src={itemImg} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{item.name}</p>
                          <p className="text-xs text-[#c4a47c]">{item.price.toLocaleString()} DZD</p>
                          {item.selectedSize && <p className="text-[10px] text-gray-500 mt-1">Taille: {item.selectedSize}</p>}
                          {item.selectedColor && <p className="text-[10px] text-gray-500 mt-1">Couleur: {item.selectedColor}</p>}
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(i)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                  </div>
              )
            }))}
          </div>

          <div className="p-8 bg-gray-50 space-y-6 border-t border-gray-100">
             {cart.length > 0 && (
              <div className="space-y-2 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Sous-total</span>
                  <span>{subtotal.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Livraison ({deliveryType === 'home' ? 'Domicile' : 'Bureau'})</span>
                  <span>{deliveryPrice.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="text-xs uppercase font-bold text-gray-400">Total</span>
                  <span className="text-3xl font-bold tracking-tighter logo-font">{total.toLocaleString()} <span className="text-sm font-sans font-normal text-gray-500">DZD</span></span>
                </div>
              </div>
             )}

            {showCheckout && !orderComplete && (
              <div className="space-y-3 pt-2 animate-[slideUp_0.4s_ease-out]">
                <input placeholder="NOM COMPLET" className="w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition" onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="TÉLÉPHONE" className="w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition" onChange={e => setFormData({...formData, phone: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                    <select 
                      className="w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition"
                      value={formData.wilaya}
                      onChange={e => setFormData({...formData, wilaya: e.target.value})}
                    >
                      <option value="">SÉLECTIONNER WILAYA</option>
                      {WILAYAS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                    
                  <input placeholder="COMMUNE" className="w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition" onChange={e => setFormData({...formData, commune: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button 
                    className={`p-3 border rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${deliveryType === 'desk' ? 'border-[#c4a47c] bg-amber-50 text-[#c4a47c]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    onClick={() => setDeliveryType('desk')}
                  >
                    Bureau (Stop Desk)<br/>
                    {formData.wilaya ? (
                       <span className="text-xs">+{deskPrice} DZD</span>
                    ) : (
                       <span className="text-xs text-gray-300">Sélectionnez Wilaya</span>
                    )}
                  </button>
                  <button 
                    className={`p-3 border rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${deliveryType === 'home' ? 'border-[#c4a47c] bg-amber-50 text-[#c4a47c]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    onClick={() => setDeliveryType('home')}
                  >
                    À Domicile<br/>
                    {formData.wilaya ? (
                       <span className="text-xs">+{homePrice} DZD</span>
                    ) : (
                       <span className="text-xs text-gray-300">Sélectionnez Wilaya</span>
                    )}
                  </button>
                </div>

                <button onClick={handleOrder} className="w-full bg-[#1a1a1a] text-white py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#c4a47c] transition duration-300 mt-2">Confirmer l'Achat</button>
              </div>
            )}

            {!showCheckout && cart.length > 0 && (
              <button onClick={() => setShowCheckout(true)} className="w-full bg-[#1a1a1a] text-white py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#c4a47c] transition duration-300">Commander</button>
            )}

            {orderComplete && (
              <div className="text-center p-6 bg-white border border-green-100 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CheckCircle size={24} />
                </div>
                <p className="text-green-800 font-bold mb-2 uppercase text-xs tracking-widest">Commande Envoyée !</p>
                <p className="text-xs text-gray-500">Nous vous contacterons sur votre numéro.</p>
                <button onClick={() => {setOrderComplete(false); onClose(); setShowCheckout(false)}} className="mt-4 text-[10px] font-bold underline hover:text-[#c4a47c]">FERMER</button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

// --- 3. Composant ProductDetails (State-based Navigation) ---
const ProductDetails = ({ productId, onBack, onAddToCart, onOpenCart }) => {
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setActiveImage(data.images && data.images.length > 0 ? data.images[0] : (data.image || data.img));
        } else {
            // Fallback default data
            const defaultProducts = [
                { id: 'def1', name: 'Pantalon Chino Signature', price: 6500, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', category: 'Pantalon' },
                { id: 'def2', name: 'Chemise Slim Oxford', price: 4800, image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=600', category: 'Chemise' },
                { id: 'def3', name: 'Manteau Laine & Cachemire', price: 24000, image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?q=80&w=600', category: 'Manteau' }
            ];
            const defProd = defaultProducts.find(p => p.id === productId);
            if(defProd) {
                setProduct(defProd);
                setActiveImage(defProd.image);
            } else {
                onBack();
            }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    if (productId) fetchProduct();
  }, [productId, onBack]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Veuillez sélectionner une taille.");
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Veuillez sélectionner une couleur.");
      return;
    }
    
    onAddToCart({ 
        ...product, 
        selectedSize, 
        selectedColor,
        image: activeImage 
    });
    // Removed alert, now opens cart
    onOpenCart();
  };

  if (!product) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      );
  }

  const images = (product.images && product.images.length > 0) ? product.images : [(product.image || product.img)];

  return (
    <div className="min-h-screen bg-white animate-fade-in pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-8 transition-colors"
        >
          <ArrowLeft size={18} /> Retour à la boutique
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="space-y-6">
            <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-24 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${activeImage === img ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-[#c4a47c] text-xs font-bold tracking-[0.3em] uppercase">{product.category}</span>
            </div>
            <h1 className="logo-font text-4xl md:text-5xl font-medium mb-4">{product.name}</h1>
            <p className="text-2xl font-light mb-8">{product.price.toLocaleString()} DZD</p>

            <div className="prose prose-sm text-gray-500 mb-10 leading-relaxed">
              <p>{product.description || "Aucune description disponible pour ce produit."}</p>
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-bold uppercase tracking-widest">Taille</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center border transition-all ${
                        selectedSize === size 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="mb-10">
                <span className="text-sm font-bold uppercase tracking-widest block mb-4">Couleur</span>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border transition-all text-sm font-medium ${
                        selectedColor === color 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto space-y-4">
              <button 
                onClick={handleAddToCart}
                className="w-full bg-[#1a1a1a] text-white py-5 text-sm font-bold uppercase tracking-widest hover:bg-[#c4a47c] transition duration-300 flex items-center justify-center gap-3"
              >
                <ShoppingBag size={18} /> Ajouter au Panier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Composant Store Front ---
const StoreFront = ({ onAdminClick, onProductClick, cart, addToCart, onOpenCart, user }) => {
  // Removed local Cart state and logic, now handled by App and CartDrawer
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const defaultProducts = [
    { id: 'def1', name: 'Pantalon Chino Signature', price: 6500, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', category: 'Pantalon' },
    { id: 'def2', name: 'Chemise Slim Oxford', price: 4800, image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=600', category: 'Chemise' },
    { id: 'def3', name: 'Manteau Laine & Cachemire', price: 24000, image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?q=80&w=600', category: 'Manteau' }
  ];

  useEffect(() => {
    if (!user) return; 

    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
      setLoadingProducts(false);
    }, (error) => {
       console.error("Error fetching products:", error);
       setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [user]);

  const allProducts = products.length > 0 ? products : defaultProducts;
  
  const PREDEFINED_CATEGORIES = ['Costumes', 'Chaussures', 'Accessoires', 'Chemises', 'Manteaux', 'Pantalon'];
  const dynamicCategories = allProducts.map(p => p.category).filter(Boolean);
  const categories = ['Tout', ...new Set([...PREDEFINED_CATEGORIES, ...dynamicCategories])];

  const displayProducts = selectedCategory === 'Tout' 
    ? allProducts 
    : allProducts.filter(p => p.category === selectedCategory);

  const handleQuickAdd = (product) => {
    addToCart(product); 
    onOpenCart();
  };

  return (
    <div className="bg-[#fcfcfc] text-[#1a1a1a] min-h-screen font-sans selection:bg-[#c4a47c] selection:text-white">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="logo-font text-2xl font-bold tracking-tighter uppercase border-b-2 border-black pb-1 cursor-pointer">Élégance</div>
          
          <div className="hidden md:flex space-x-10 text-[11px] font-bold tracking-[0.2em] uppercase">
            <a href="#vetements" className="hover:text-[#c4a47c] transition duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[1px] after:bg-[#c4a47c] after:left-0 after:-bottom-1 after:transition-all hover:after:w-full">Prêt-à-porter</a>
            <a href="#footer" className="hover:text-[#c4a47c] transition duration-300">Contact</a>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={onAdminClick} className="text-[10px] font-bold tracking-[0.2em] uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition duration-300">Admin</button>
            <button onClick={onOpenCart} className="relative p-2 hover:text-[#c4a47c] transition">
              <ShoppingBag size={24} strokeWidth={1.5} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cart.length}</span>}
            </button>
          </div>
        </div>
      </nav>

        <>
          <section className="h-screen flex items-center px-6 md:px-20 bg-cover bg-center relative bg-fixed" style={{backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.1)), url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071')"}}>
            <div className="max-w-3xl text-white pt-20">
              <span className="inline-block mb-4 text-[12px] tracking-[0.4em] uppercase font-light animate-[fadeIn_1s_ease-out]">Maison de Couture Algérienne</span>
              <h1 className="logo-font text-6xl md:text-8xl mb-8 leading-tight italic animate-[slideUp_1s_ease-out_0.2s_both]">L'élégance est un <br /> héritage.</h1>
              <a href="#vetements" className="px-12 py-5 bg-[#c4a47c] text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition duration-500 inline-block animate-[fadeIn_1s_ease-out_0.6s_both]">Explorer la collection</a>
            </div>
          </section>

          <main className="py-24 px-6 max-w-7xl mx-auto" id="vetements">
            <div className="mb-12 rounded-xl overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=2070" alt="New Collection" className="w-full h-48 md:h-64 object-cover" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end mb-8">
              <div>
                <span className="text-[#c4a47c] text-xs font-bold tracking-[0.3em] uppercase">Vêtements</span>
                <h2 className="logo-font text-5xl mt-2 italic">Prêt-à-porter de Luxe</h2>
              </div>
              <div className="text-right hidden md:block">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Collection Automne / Hiver</p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-12 overflow-x-auto pb-4 no-scrollbar">
              <div className="flex gap-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-black text-white shadow-lg transform scale-105' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-black hover:text-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loadingProducts ? (
               <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <>
                {displayProducts.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 italic">Aucun produit trouvé dans cette catégorie.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 animate-fade-in">
                    {displayProducts.map((product) => {
                      const displayImage = (product.images && product.images.length > 0) ? product.images[0] : (product.image || product.img);
                      return (
                      <div key={product.id} onClick={() => onProductClick(product.id)} className="group cursor-pointer">
                        <div className="overflow-hidden bg-[#f0f0f0] aspect-[3/4] mb-6 relative">
                          <img src={displayImage} className="w-full h-full object-cover transition duration-1000 ease-in-out group-hover:scale-110" alt={product.name} />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <button onClick={(e) => { e.stopPropagation(); handleQuickAdd(product); }} className="absolute bottom-0 left-0 w-full bg-white text-black py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white border-t border-black">Ajouter au Panier</button>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                              <h4 className="text-lg font-light group-hover:underline decoration-1 underline-offset-4">{product.name}</h4>
                              <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">{product.category || 'Collection'}</p>
                          </div>
                          <p className="text-[#c4a47c] font-medium mt-1 uppercase text-sm tracking-tighter">{product.price.toLocaleString()} DZD</p>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </>
            )}
          </main>
        </>

      <footer id="footer" className="bg-[#0a0a0a] text-white py-24 px-6 border-t border-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="lg:col-span-2">
            <h3 className="logo-font text-3xl mb-8 italic">Élégance Boutique</h3>
            <p className="text-gray-500 font-light max-w-sm leading-relaxed text-sm">Plus qu'un vêtement, une déclaration d'intention. Nous façonnons le style de l'homme moderne avec une touche traditionnelle algérienne.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] mb-8 text-[#c4a47c]">Contact</h4>
            <div className="space-y-4 text-sm font-light text-gray-400">
              <p className="flex items-center gap-3 hover:text-white transition"><Phone size={14} /> 0559312724</p>
              <p className="flex items-center gap-3 hover:text-white transition"><MapPin size={14} /> Hydra, Alger, Algérie</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] mb-8 text-[#c4a47c]">Légal</h4>
             <ul className="space-y-2 text-sm text-gray-500">
                <li className="hover:text-white cursor-pointer transition">Mentions Légales</li>
                <li className="hover:text-white cursor-pointer transition">Conditions de Vente</li>
                <li className="hover:text-white cursor-pointer transition">Politique de Confidentialité</li>
             </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-900 text-center text-xs text-gray-600 uppercase tracking-widest">
           © 2024 Élégance Boutique. Tous droits réservés.
        </div>
      </footer>
      <GlobalStyles />
    </div>
  );
};

// --- App Racine ---
const App = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Helper: Retrieve initial state from URL hash
  const getInitialState = () => {
      try {
          const hash = window.location.hash.replace('#', '');
          const parts = hash.split('/');
          const view = parts[0];
          const param = parts[1];
          
          if (view === 'admin') return { view: 'admin', param: null };
          if (view === 'details' && param) return { view: 'details', param: param };
          return { view: 'store', param: null };
      } catch (e) {
          return { view: 'store', param: null };
      }
  };

  const initialState = getInitialState();
  const [currentView, setCurrentView] = useState(initialState.view);
  const [selectedProductId, setSelectedProductId] = useState(initialState.param);

  useEffect(() => {
    // Tailwind Script Injection
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-script';
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }

    // Hash Change Listener
    const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '');
        const parts = hash.split('/');
        const view = parts[0];
        const param = parts[1];

        if (view === 'admin') {
            setCurrentView('admin');
            setSelectedProductId(null);
        } else if (view === 'details' && param) {
            setCurrentView('details');
            setSelectedProductId(param);
        } else {
            setCurrentView('store');
            setSelectedProductId(null);
        }
        window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set default hash if empty
    if (!window.location.hash) {
        window.location.hash = 'store';
    }

    // Init Auth for App
    const initAuth = async () => {
       try {
         if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
       } catch (err) {
         console.error("Auth failed", err);
       }
    }
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubscribeAuth();
    };
  }, []);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  // --- Router Navigation Functions ---
  const navigateToProduct = (id) => {
      window.location.hash = `details/${id}`;
  };

  const navigateToStore = () => {
      window.location.hash = 'store';
  };

  const navigateToAdmin = () => {
      window.location.hash = 'admin';
  };

  return (
    <>
      {currentView === 'store' && (
        <StoreFront 
            onAdminClick={navigateToAdmin} 
            onProductClick={navigateToProduct}
            cart={cart}
            addToCart={addToCart}
            onOpenCart={() => setIsCartOpen(true)}
            user={user}
        />
      )}
      {currentView === 'details' && (
          <ProductDetails 
            productId={selectedProductId}
            onBack={navigateToStore}
            onAddToCart={addToCart}
            onOpenCart={() => setIsCartOpen(true)}
          />
      )}
      {currentView === 'admin' && (
          <AdminPanel 
            onBackToStore={navigateToStore} 
          />
      )}

      {/* Cart Drawer is now Global */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        removeFromCart={removeFromCart}
        user={user}
      />
    </>
  );
};

export default App;