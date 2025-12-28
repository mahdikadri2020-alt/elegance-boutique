import { upload } from "@vercel/blob/client"; // 1. استيراد دالة الرفع
/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Trash2, 
  TrendingUp, Users, Image as ImageIcon, CheckCircle, Lock, 
  Eye, EyeOff, LogOut, ShoppingBag, X, Phone, MapPin, Loader, UploadCloud, Edit, Plus,
  ArrowLeft, ChevronRight, Star, Share2, Truck, Save, Map, Filter, SlidersHorizontal, ArrowUpDown
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
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAlWIMQPdg9F48Q2r6M3Xxv3pJq08Hk8ps",
  authDomain: "elegance-boutique-38d2b.firebaseapp.com",
  projectId: "elegance-boutique-38d2b",
  storageBucket: "elegance-boutique-38d2b.firebasestorage.app",
  messagingSenderId: "858754859112",
  appId: "1:858754859112:web:4a43992d7d2d0cb98afbdd",
  measurementId: "G-9F5KQS0PGH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Global Constants (Shared between Admin & Store) ---
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const SHOE_SIZES = [];
for (let i = 35; i <= 45; i += 1) { 
  SHOE_SIZES.push(i.toString());
}
const AVAILABLE_COLORS = ['Noir', 'Blanc', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Gris', 'Beige', 'Marron', 'Rose'];

const ALGERIA_DATA = {
  "Adrar": ["Adrar", "Tamest", "Charouine", "Reggane", "In Zghmir", "Tit", "Ksar Kaddour", "Tsabit", "Timiaouine", "Zaouiet Kounta", "Aoulef", "Tamekten", "Tamantit", "Fenoughil", "Tinerkouk", "Deldoul", "Sali", "Akabli", "Metarfa", "Ouled Ahmed Tammi", "Bouda", "Aougrout", "Talmine", "Bordj Badji Mokhtar", "Sebbaa", "Ouled Aissa", "Timokten", "Timimoun"],
  "Chlef": ["Chlef", "Tenes", "Benairia", "El Karimia", "Tadjena", "Taougrite", "Beni Haoua", "Sobha", "Harchoun", "Ouled Fares", "Sidi Akkacha", "Boukadir", "Beni Rached", "Talassa", "Herenfa", "Oued Goussine", "Dahra", "Ouled Abbes", "Sendjas", "Zeboudja", "Oued Sly", "Abou El Hassan", "El Marsa", "Chettia", "Sidi Abderrahmane", "Moussadek", "El Hadjadj", "Labiod Medjadja", "Oued Fodda", "Ouled Ben Abdelkader", "Bouzghaia", "Sarthe", "Sidiakkacha", "Ain Merane", "Breira"],
  "Laghouat": ["Laghouat", "Ksar El Hirane", "Benacer Benchohra", "Sidi Makhlouf", "Hassi Delaa", "Hassi R'Mel", "Ain Madhi", "Tadjrouna", "El Haouaita", "Kheneg", "Gueltat Sidi Saad", "Ain Sidi Ali", "Beidha", "Brida", "El Ghisha", "Hadj Mechri", "Sebgag", "Taouiala", "Tadjmout", "Aflou", "El Assafia", "Oued Morra", "Oued M'Zi", "El Houaita"],
  "Oum El Bouaghi": ["Oum El Bouaghi", "Ain Beida", "Ain M'lila", "Behir Chergui", "El Amiria", "Sigus", "El Belala", "Ain Babouche", "Berriche", "Ouled Hamla", "Dhalaa", "Ain Kercha", "Hanchir Toumghani", "Fkirina", "Souk Naamane", "Zorg", "El Fedjoudj Boughrara Saoudi", "Ouled Zouai", "Bir Chouhada", "Ksar Sbahi", "Oued Nini", "Meskiana", "Ain Fekroun", "Rahia", "Ain Zitoun", "Ouled Gacem", "El Harmilia", "Henchir Toumghani", "Ain Diss"],
  "Batna": ["Batna", "Ghassira", "Maafa", "Merouana", "Seriana", "Menaa", "El Madher", "Tazoult", "N'Gaous", "Guigba", "Inoughissen", "Ouyoun El Assafir", "Djerma", "Bitam", "Abdelkader Azil", "Arris", "Kimmel", "Tilatou", "Ain Djasser", "Ouled Sellam", "Tigherghar", "Ain Yagout", "Sefiane", "Chirmato", "Tkout", "El Hassi", "Gosbat", "Fesdis", "Oued El Ma", "Talhamet", "Rahbat", "Ouled Si Slimane", "Ouled Aouf", "Boumagueur", "Barika", "Djezar", "Tkout", "Ain Touta", "Beni Foudhala El Hakania", "Oued Taga", "Ouled Fadel", "Timgad", "Ras El Aioun", "Chir", "Oued Chaaba", "Taxlent", "Ouled Ammar", "Zanet El Beida", "Lazrou", "Bouzina", "Chemora", "Boulhilat", "Larbaa", "Bouhmar", "Hidoussa", "Teniet El Abed", "Oued Taga", "Ouled Aouf"],
  "Béjaïa": ["Béjaïa", "Amizour", "Ferraoun", "Taourirt Ighil", "Chellata", "Tamokra", "Timezrit", "Souk El Tenine", "M'cisna", "Tinabdher", "Tichy", "Semaoun", "Kendira", "Tifra", "Ighram", "Amalou", "Ighil Ali", "Fenaia Ilmaten", "Toudja", "Darguina", "Sidi Ayad", "Aokas", "Beni Djellil", "Adekar", "Akbou", "Seddouk", "Tazmalt", "Ait R'zine", "Chemini", "Souk Oufella", "Taskriout", "Tibane", "Tala Hamza", "Barbacha", "Beni Ksila", "Ouzellaguen", "Bouhamza", "Beni Maouche", "Dra El Caid", "Kherrata", "Bejaia", "El Kseur", "Melbou", "Akfadou", "Leflaye", "Kherrata", "Dra El Caid", "Tamridjet", "Ait Smail", "Boukhelifa", "Tizi N'Berber", "Ait Maouche", "Oued Ghir", "Boudjellil"],
  "Biskra": ["Biskra", "Oumache", "Branis", "Chetma", "Ouled Djellal", "Ras El Miaad", "Besbes", "Sidi Khaled", "Doucen", "Chaiba", "Sidi Okba", "M'Chouneche", "El Haouch", "Ain Naga", "Zeribet El Oued", "El Feidh", "El Kantara", "Ain Zaatout", "El Outaya", "Djemorah", "Tolga", "Lioua", "Lichana", "Ourlal", "M'Lili", "Foughala", "Bordj Ben Azzouz", "Meziraa", "Bouchagroune", "Mekhadma"],
  "Béchar": ["Béchar", "Erg Ferradj", "Ouled Khoudir", "Meridja", "Timoudi", "Lahmar", "Beni Abbes", "Beni Ikhlef", "Mechraa Houari Boumedienne", "Kenadsa", "Igli", "Tabalbala", "Taghit", "El Ouata", "Boukais", "Mogheul", "Abadla", "Kerzaz", "Ksabi", "Tamtert", "Beni Ounif"],
  "Blida": ["Blida", "Chebli", "Bouinan", "Oued El Alleug", "Ouled Yaich", "Chrea", "El Affroun", "Chiffa", "Hammam Melouane", "Benkhelil", "Soumaa", "Mouzaia", "Soumaa", "Guerrouaou", "Boufarik", "Meftah", "Chiffa", "Ain Romana", "Oued Djer", "Beni Tamou", "Bouarfa", "Beni Mered", "Bougara", "Djebabra", "Larbaa", "Ouled Slama"],
  "Bouira": ["Bouira", "El Asnam", "Guerrouma", "Souk El Khemis", "Kadiria", "Hanif", "Dirah", "Ait Laaziz", "Taghzout", "Raouraoua", "Mezdour", "Haizer", "Lakhdaria", "Maala", "El Hachimia", "Aomar", "Chorfa", "Bordj Okhriss", "El Adjiba", "El Hakimia", "El Khebouzia", "Ahl El Ksar", "Bouderbala", "Zbarbar", "Ain El Hadjar", "Djebahia", "Aghbalou", "Taguedit", "Ain Turk", "Saharidj", "Dechmia", "Ridane", "Bechloul", "Boukram", "Ain Bessam", "Bir Ghbalou", "M'Chedallah", "Souk El Khemis", "Maamora", "Oued El Berdi", "Ath Mansour", "Sidi Aissa"],
  "Tamanrasset": ["Tamanrasset", "Abalessa", "In Ghar", "In Guezzam", "Idles", "Tazrouk", "Tin Zaouatine", "In Salah", "In Amguel", "Foggaret Ezzaouia"],
  "Tébessa": ["Tébessa", "Bir El Ater", "Cheria", "Stah Guentis", "El Aouinet", "Lahouidjbet", "Bedjene", "Morsott", "El Ma Labiodh", "Bir Dheb", "Ogla Melha", "Hammamet", "El Kouif", "Boulhaf Dir", "Bir Mokkadem", "El Meridj", "Ain Zerga", "Oum Ali", "Ferkane", "Saf Saf El Ouesra", "Negrine", "Bekkelal", "Tebessa", "Ain Djasser"],
  "Tlemcen": ["Tlemcen", "Beni Mester", "Ain Tallout", "Remchi", "El Fehoul", "Sabra", "Ghazaouet", "Souani", "Djebala", "El Gor", "Oued Chouly", "Ain Fezza", "Ouled Mimoun", "Amieur", "Ain Youcef", "Zenata", "Beni Snous", "Bab El Assa", "Dar Yaghmouracene", "Fellaoucene", "Azails", "Sebbaa Chioukh", "Terny Beni Hdiel", "Bensekrane", "Ain Nehala", "Hennaya", "Maghnia", "Hammam Boughrara", "Souahlia", "MSirda Fouaga", "Ouled Riyah", "Sidi Mhamed", "Sidi Medjahed", "Beni Boussaid", "Marsa Ben M'Hidi", "Nedroma", "Sidi Djillali", "Beni Bahdel", "El Bouihi", "Honaine", "Tianet", "Ouled Riyah", "Bouhlou", "Souk Tleta", "Sidi Abdelli", "Sebdou", "Beni Ouarsous", "Sidi Medjahed", "Beni Smiel", "Ain Ghoraba", "Chetouane", "Mansourah", "Beni Khellad"],
  "Tiaret": ["Tiaret", "Medroussa", "Ain Bouchekif", "Sidi Ali Mellal", "Ain Zarit", "Ain Deheb", "Sidi Bakhti", "Medrissa", "Zmalet El Emir Abdelkader", "Madna", "Sebt", "Mellakou", "Dahmouni", "Rahouia", "Mahdia", "Sougueur", "Sidi Abdelghani", "Ain El Hadid", "Ouled Djerad", "Naima", "Meghila", "Guertoufa", "Sidi Hosni", "Djillali Ben Amar", "Sebaine", "Tousnina", "Frenda", "Ain Kermes", "Ksar Chellala", "Rechaiga", "Nadorah", "Tagdemt", "Oued Lili", "Mechraa Safa", "Hamadia", "Chehaima", "Takhemaret", "Sidi Abderrahmane", "Serghine", "Bougara", "Faidja", "Tidda"],
  "Tizi Ouzou": ["Tizi Ouzou", "Ain El Hammam", "Akbil", "Freha", "Souamaa", "Mechtras", "Irdjen", "Timizart", "Makouda", "Dra El Mizan", "Tizi Gheniff", "Bounouh", "Ait Chafaa", "Frikat", "Beni Aissi", "Beni Zmenzer", "Iferhounene", "Azazga", "Illoula Oumalou", "Yakouren", "Larbaa Nath Irathen", "Tizi Rached", "Zekri", "Ouaguenoun", "Ain Zaouia", "Mkira", "Ait Yahia", "Ait Mahmoud", "Maatkas", "Ait Boumahdi", "Abi Youcef", "Beni Douala", "Illilten", "Bouzeguene", "Ait Aggouacha", "Ouadhia", "Azzefoun", "Tigzirt", "Ait Aissa Mimoun", "Boghni", "Ifigha", "Ait Oumalou", "Tirmitine", "Akerrou", "Yatafen", "Beni Zikki", "Dra Ben Khedda", "Ouacif", "Idjeur", "Mekla", "Tizi N'Tleta", "Beni Yenni", "Aghribs", "Iflissen", "Boudjima", "Ait Yahia Moussa", "Souk El Thenine", "Sidi Namane", "Iboudrarene", "Agouni Gueghrane", "Mizrana", "Assi Youcef", "Ait Toudert"],
  "Alger": ["Alger Centre", "Sidi M'Hamed", "El Madania", "Belouizdad", "Bab El Oued", "Bologhine", "Casbah", "Oued Koriche", "Bir Murad Rais", "El Biar", "Bouzareah", "Birkhadem", "El Harrach", "Baraki", "Oued Smar", "Bourouba", "Hussein Dey", "Kouba", "Bachedjerah", "Dar El Beida", "Bab Ezzouar", "Ben Aknoun", "Dely Ibrahim", "El Hammamet", "Rais Hamidou", "Djasr Kasentina", "El Mouradia", "Hydra", "Mohammadia", "Bordj El Kiffan", "El Magharia", "Beni Messous", "Les Eucalyptus", "Birtouta", "Tessala El Merdja", "Ouled Chebel", "Sidi Moussa", "Ain Taya", "Bordj El Bahri", "El Marsa", "Haraoua", "Rouiba", "Reghaia", "Ain Benian", "Staoueli", "Zeralda", "Mahelma", "Rahmania", "Souidania", "Cheraga", "Ouled Fayet", "El Achour", "Draria", "Douera", "Baba Hassen", "Khraicia", "Saoula"],
  "Djelfa": ["Djelfa", "Moudjebara", "El Guedid", "Hassi Bahbah", "Ain Maabed", "Sed Rahal", "Feidh El Botma", "Birine", "Bouira Lahdab", "Zaafrane", "Guernini", "Ain El Ibel", "Ain Oussera", "Benhar", "Dar Chioukh", "Hassi El Euch", "Had Sahary", "Guettara", "Sidi Ladjel", "Ben Yacoub", "Douis", "El Idrissia", "M'Liliha", "Tedjmut", "Ain Chouhada", "Oum Laadam", "Dar Chioukh", "Amourah", "Faidh El Botma", "Selmana"],
  "Jijel": ["Jijel", "Eraguene", "El Aouana", "Ziama Mansouriah", "Taher", "Emir Abdelkader", "Chekfa", "Chahna", "El Kennar", "Ouled Askeur", "El Milia", "Bouraoui Belhadef", "Kaous", "Ghebala", "Settara", "Sidi Maarouf", "Sidi Abdelaziz", "El Ancer", "Khiri Oued Adjoul", "Djimla", "Boudriaa Ben Yadjis", "Selma Benziada", "Bordj Tahar", "Texenna", "Ouled Rabah", "Ouadjana", "Boucif Ouled Askeur"],
  "Sétif": ["Sétif", "Ain El Kebira", "Beni Aziz", "Ouled Saber", "Guidjel", "Ain Oulmene", "Bouandas", "Bazer Sakhra", "Hamam Sokhna", "Mezloug", "Bir El Arch", "Tachouda", "Tala Ifacene", "Serdj El Ghoul", "Guellal", "Ain Azel", "Ain Lahdjar", "Bir Haddada", "El Eulma", "Djemila", "Beni Oulmene", "Amoucha", "Babar", "Ain Legraj", "Beni Chebana", "Beni Ourtilane", "Ain Abessa", "Dehamcha", "Ain Roua", "Dra El Mizan", "Rosfa", "Ouled Addouane", "Ain Sebt", "Beni Hocine", "El Ouricia", "Tizi N'Bechar", "Salah Bey", "Ain Arnat", "Guedjel", "Ouled Si Ahmed", "Ait Tizi", "Ait Naoual Mezada", "Bougaa", "Beni Fouda", "Tella", "Hamam Guergour", "Ait Naoual Mezada", "Harbil", "Rasfa", "Ouled Tebben", "Beidha Bordj", "Maoklane", "Guenzet", "Ain El Kebira", "Beni Mouhli"],
  "Saïda": ["Saïda", "Doui Thabet", "Ain El Hadjar", "Ouled Khaled", "Moulay Larbi", "Youb", "Hounet", "Sidi Amar", "Sidi Boubekeur", "El Hassasna", "Maamora", "Sidi Ahmed", "Ain Sekhouna", "Ouled Brahim", "Tircine", "Ain Soltane"],
  "Skikda": ["Skikda", "Ain Zouit", "El Hadaiek", "Azzaba", "Djendel Saadi Mohamed", "Ain Charchar", "Bekkouche Lakhdar", "Ben Azzouz", "Es Sebt", "El Harrouch", "Zerdaza", "Ouled Hebaba", "Sidi Mezghiche", "Emdjez Edchich", "Beni Oulbane", "Ain Bouziane", "Ramdane Djamel", "Beni Bachir", "Salah Bouchaour", "Tamalous", "Kerkera", "Ben Azouz", "Cheraia", "Collo", "Beni Zid", "Cheraia", "Kanoua", "Ouled Attia", "Oued Zehour", "Zitouna", "El Marsa", "Ben Azzouz", "Ain Kechra", "Oum Toub", "Bouchetata", "Filfila", "Hamadi Krouma"],
  "Sidi Bel Abbès": ["Sidi Bel Abbès", "Tessala", "Sidi Brahim", "Mostefa Ben Brahim", "Telagh", "Mezaourou", "Boukhanafis", "Sidi Ali Boussidi", "Sidi Lahcene", "Ain Thrid", "Sidi Khaled", "Lamtar", "Sidi Yacoub", "Sidi Hamadouche", "Sidi Dahou Zairs", "Ain Kadda", "Mcid", "Sidi Ali Benyoub", "Moulay Slissen", "El Haçaiba", "Ain Tindamine", "Tenira", "Oued Sebaa", "Hassi Dahou", "Oued Sefioun", "Teghalimet", "Ben Badis", "Sidi Chaib", "Hassi Zehana", "Chettouane Belaila", "Ain Adden", "Oued Taourira", "Dhaya", "Merine", "Youb", "Tafissour", "Marhoum", "Ras El Ma", "Oued Sebaa", "Redjem Demouche", "Bir El Hammam", "Sidi Daho", "Belarbi", "Tilmouni", "Sidi Bel Abbes", "Ain Trid", "Zerouala", "Sfisef", "M'Cid", "Boudjebaa El Bordj", "Sehala Thaoura"],
  "Annaba": ["Annaba", "Berrahal", "El Hadjar", "Eulma", "El Bouni", "Oued El Aneb", "Cheurfa", "Seraidi", "Ain Berda", "Chetaibi", "Sidi Amar", "Treat"],
  "Guelma": ["Guelma", "Nechmaya", "Bouati Mahmoud", "Oued Zenati", "Tamlouka", "Hammam Debagh", "Dahouara", "Ain Ben Beida", "Hamam N'Bails", "Oued Cheham", "Djeballah Khemissi", "Boumahra Ahmed", "Ain Sandel", "Belkheir", "Ben Djerrah", "Bou Hachana", "Heliopolis", "Ain Makhlouf", "Ain Larbi", "Tella", "Bouchegouf", "Medjez Sfa", "Oued Fragha", "Ain Reggada", "Bordj Sabath", "Ras El Agba", "Sellaoua Announa", "Medjez Amar", "Houari Boumedienne", "Roknia", "Salaoua Announa", "Khezaras"],
  "Constantine": ["Constantine", "Hamma Bouziane", "Didouche Mourad", "Zighoud Youcef", "Beni Hamidane", "Ouled Rahmoune", "Ain Abid", "Ben Badis", "Ibn Ziad", "Messaoud Boudjeriou", "El Khroub", "Ain Smara"],
  "Médéa": ["Médéa", "Ouzera", "Ouled Maaref", "Ain Boucif", "Aissaouia", "Ouled Deide", "El Omaria", "Derrag", "Tamesguida", "Ben Chicao", "El Hamdania", "Ouled Brahim", "Deux Bassins", "Bouaiche", "Mezerana", "Sidi Ziane", "Tlatet Eddouar", "Saneg", "Cheniguel", "Tafraout", "Baata", "Ouled Hellal", "Ouled Antar", "Ouled Bouachra", "El Azizia", "Maghraoua", "Mihoub", "Boughezoul", "Chahbounia", "Ain Ouksir", "Oum El Djalil", "Ouled Touomi", "Tablat", "Deux Bassins", "Dra El Mizan", "Berrouaghia", "Rebaia", "Bouchrahil", "Ouled Hellal", "Sidi Naamane", "Khams Djouamaa", "Beni Slimane", "Bir Ben Laabed", "El Guelb El Kebir", "Sidi Errabia", "Sedraya", "Djouab", "Sidi Zahar", "Ksar El Boukhari", "M'Fatha", "Saneg", "El Ouinet", "Ain Ouksir", "Ouled Maaref", "Chelalet El Adhaoura", "Cheniguel", "Tafraout", "Ain El Hadjar", "Bouaiche", "Sebt Aziz", "Kef Lakhdar", "Souagui", "Zoubiria", "Seghouane", "Draa Essamar", "Hannacha", "Ouamri", "Si Mahdjoub", "Boughezoul", "Chahbounia", "Ain Ouksir", "Oum El Djalil"],
  "Mostaganem": ["Mostaganem", "Sayada", "Fornaka", "Stidia", "Ain Nouissy", "Hassi Mameche", "Mazagran", "Ain Tedles", "Sidi Belaattar", "Sour", "Oued El Kheir", "Sidi Ali", "Ouled Maallah", "Tazgait", "Safsaf", "Mansourah", "Mesra", "Ain Sidi Cherif", "Touahria", "Achaacha", "Khadra", "Nekmaria", "Ouled Boughalem", "Bouguirat", "Safsaf", "Sirat", "Souaflia", "Benabdelmalek Ramdane", "Hadjadj", "Sidi Lakhdar", "Achaacha", "Khadra", "Nekmaria", "Ouled Boughalem"],
  "M'Sila": ["M'Sila", "Maadid", "Hammam Dalaa", "Ouled Derradj", "Tarmount", "M'Tarfa", "Maarif", "Khoubana", "Chellal", "Ouled Madhi", "Magra", "Berhoum", "Ain Khadra", "Belaiba", "Dehahna", "Bouti Sayah", "Sidi Aissa", "Ain El Hadjel", "Sidi Hadjeres", "Ouanougha", "Bou Saada", "El Hamel", "Oultem", "Benzouh", "Ouled Sidi Brahim", "Sidi Ameur", "Tamsa", "Ben Srour", "Ouled Slimane", "Zarzour", "Mohamed Boudiaf", "Ain El Melh", "Bir Foda", "Ain Fares", "Sidi M'Hamed", "Ain Errich", "El Houamed", "Slim", "Djebel Messaad", "Medjedel", "Ouled Atia", "Souamaa"],
  "Mascara": ["Mascara", "Bou Hanifia", "Tizi", "Hacine", "El Keurt", "Oued Taria", "Ghriss", "Froha", "Matmore", "Sidi Boussaid", "El Bordj", "Ain Fekan", "Benian", "Khalouia", "El Menaouer", "Oued El Abtal", "Sidi Abdeldjebar", "Sehailia", "Tighennif", "Hachem", "Sidi Kada", "Zelmata", "Oued El Abtal", "Ain Ferah", "Ghriss", "Froha", "Maoussa", "Matmore", "Sidi Boussaid", "El Bordj", "Ain Fekan", "Benian", "Khalouia", "El Menaouer", "Bou Hanifia", "Hacine", "El Keurt", "Sig", "Oggaz", "Alaimia", "Ras El Ain Amirouche", "Sig", "Chorfa", "El Gaada", "Zahana", "Mohammadia", "Sidi Abdelmoumen", "Ferraguig", "El Ghomri", "Sedjerara", "Mocta Douz"],
  "Ouargla": ["Ouargla", "Ain Beida", "Ngoussa", "Hassi Messaoud", "Rouissat", "Sidi Khouiled", "Hassi Ben Abdellah", "Touggourt", "Nezla", "Tebesbest", "Zaouia El Abidia", "El Alia", "El Borma", "Ain El Beida", "Sidi Slimane", "Megarine", "Mnagar", "Taibet", "Benaceur", "M'Naguer", "El Hadjira", "El Allia"],
  "Oran": ["Oran", "Gdyel", "Bir El Djir", "Hassi Bounif", "Es Senia", "Arzew", "Bethioua", "Marsat El Hadjadj", "Ain El Turk", "El Ancon", "Oued Tlelat", "Tafraoui", "Sidi Chami", "Boufatis", "Mers El Kebir", "Bousfer", "El Kerma", "El Braya", "Hassi Ben Okba", "Ben Freha", "Hassi Mefsoukh", "Sidi Ben Yebka", "Misserghin", "Boutlelis", "Ain El Kerma", "Ain El Bia"],
  "El Bayadh": ["El Bayadh", "Rogassa", "Stitten", "Brezina", "Ghassoul", "Boualem", "El Abiodh Sidi Cheikh", "Ain El Orak", "Arbaouat", "Bougtob", "El Kheiter", "Kef El Ahmar", "Tousmouline", "Chellala", "Kraakda", "El Bnoud", "Cheguig", "Sidi Ameur", "Sidi Slimane", "Sidi Tifour", "Boussemghoun", "Sidi Amar"],
  "Illizi": ["Illizi", "Djanet", "Debdeb", "Bordj Omar Driss", "Bordj El Haouas", "In Amenas"],
  "Bordj Bou Arréridj": ["Bordj Bou Arreridj", "Ras El Oued", "Bordj Zemoura", "Mansoura", "El M'hir", "Ben Daoud", "El Hamadia", "Bordj Ghdir", "Sidi Embarek", "El Anasser", "Belimour", "Ain Taghrout", "Ras El Oued", "Bordj Zemoura", "Mansoura", "El M'hir", "Ben Daoud", "El Hamadia", "Bordj Ghdir", "Sidi Embarek", "El Anasser", "Belimour", "Ain Taghrout", "Tixter", "Ain Tesra", "Ouled Brahem", "Ouled Dahmane", "Khelil", "Taglait", "Ksour", "Ouled Sidi Brahim", "Tefreg", "El Main", "Djaafra", "Colla", "Teniet En Nasr", "El Ach", "Rabitah", "Hasnaoua", "Medjana", "El Achir", "Ain Zada", "Bir Kasdali"],
  "Boumerdès": ["Boumerdes", "Boudouaou", "Afir", "Bordj Menaiel", "Baghlia", "Sidi Daoud", "Naciria", "Djinet", "Isser", "Zemmouri", "Si Mustapha", "Tidjelabine", "Chabet El Ameur", "Thenia", "Beni Amrane", "Khemis El Khechna", "Ouled Moussa", "Larbatache", "Kherrouba", "Hammedi", "Ouled Hedadj", "Dellys", "Ben Choud", "Sidi Daoud", "Baghlia", "Naciria", "Djinet", "Legata", "Ouled Aissa", "Ammal", "Beni Amrane", "Souk El Had", "Thénia", "Tidjelabine", "Bouzegza Keddara", "Corso", "Boudouaou El Bahri"],
  "El Tarf": ["El Tarf", "Bouhadjar", "Ben M'Hidi", "Bougous", "El Kala", "Ain El Assel", "El Aioun", "Bouteldja", "Souarekh", "Berrihane", "Lac Des Oiseaux", "Chefia", "Dréan", "Chihani", "Chebaita Mokhtar", "Besbes", "Asfour", "Echatt", "Zerizer", "Oued Zitoun", "Hammam Beni Salah", "Ain Kerma", "Zitouna", "Raml Souk"],
  "Tindouf": ["Tindouf", "Oum El Assel"],
  "Tissemsilt": ["Tissemsilt", "Bordj Bounaama", "Theniet El Had", "Lazharia", "Beni Chaib", "Lardjem", "Melaab", "Sidi Abed", "Sidi Boutouchent", "Tamallahet", "Sidi Lantri", "Bordj El Emir Abdelkader", "Layoune", "Khemisti", "Ouled Bessem", "Ammari", "Youssoufia", "Boucaid", "Larbaa", "Lazharia", "Beni Lahcene", "Sidi Slimane"],
  "El Oued": ["El Oued", "Robbah", "Oued El Alenda", "Bayadha", "Nakhla", "Guemar", "Kouinine", "Reguiba", "Hamraia", "Taghzout", "Debila", "Hassani Abdelkrim", "Hassi Khalifa", "Taleb Larbi", "Douar El Ma", "Sidi Aoun", "Trifaoui", "Magrane", "Beni Guecha", "Ourmas", "Still", "M'Rara", "Djamaa", "El M'Ghair", "Sidi Amrane", "Oum Touyour", "Sidi Khelil", "Tendla", "El Ogla", "Mih Ouansa"],
  "Khenchela": ["Khenchela", "Mtoussa", "Baghai", "El Hamma", "Ain Touila", "Ouled Rechache", "Remila", "Kais", "El Mahmal", "Taouzient", "Babar", "Tamza", "Ensigha", "Ouled Rabeh", "Chechar", "Djellal", "Khirane", "Bouhmama", "Yabous", "Msara", "Chelia"],
  "Souk Ahras": ["Souk Ahras", "Sedrata", "Hanancha", "Machroha", "Ouled Driss", "Tiffech", "Zaarouria", "Taoura", "Drea", "Haddada", "Khedara", "Merahna", "Ouled Moumen", "Bir Bouhouch", "M'Daourouch", "Oum El Adhaim", "Ragouba", "Sidi Fredj", "Ain Zana", "Ouled Driss", "Ain Soltane", "Khemissa", "Sedrata", "Zouabi", "Bir Bouhouch", "Safel El Oiden"],
  "Tipaza": ["Tipaza", "Menaceur", "Larhat", "Douaouda", "Bourkika", "Khemisti", "Aghbal", "Hadjout", "Sidi Amar", "Gouraya", "Nador", "Chaiba", "Ain Tagourait", "Cherchell", "Damous", "Merad", "Fouka", "Bou Ismail", "Ahmer El Ain", "Bouharoun", "Sidi Ghiles", "Messelmoun", "Sidi Rached", "Kolea", "Attatba", "Sidi Semiane", "Beni Milleuk", "Hadjeret Ennous"],
  "Mila": ["Mila", "Ferdjioua", "Chelghoum Laid", "Oued Athmania", "Ain Mellouk", "Telerghma", "Oued Seguen", "Tadjenanet", "Benyahia Abderrahmane", "Oued Endja", "Ahmed Rachedi", "Zeghaia", "Sidi Merouane", "Chigara", "Hamala", "Grarem Gouga", "Tiberguent", "Rouached", "Derrahi Bousselah", "Ain Beida Harriche", "El Ayadi Barbes", "Ain Tine", "Sidi Khelifa", "Ain Tine", "El Mechira", "Elayadi Barbes"],
  "Aïn Defla": ["Ain Defla", "Miliana", "Boumedfaa", "Khemis Miliana", "Hammam Righa", "Arib", "Djendel", "El Amra", "Djelida", "Bourached", "El Attaf", "Tiberkanine", "Ain Bouyahia", "El Abadia", "Tacheta Zougagha", "Zeddine", "El Maine", "Rouina", "Zeddine", "Bir Ould Khelifa", "Bordj Emir Khaled", "Tarik Ibn Ziad", "Bathia", "Belaas", "Hassania", "Ain Lechiekh", "Ain Soltane", "Oued Chorfa", "Djemaa Ouled Cheikh", "Ben Allal", "Sidi Lakhdar", "Ain Torki", "Ain Benian", "Hoceinia", "Barbouche", "Oued Djemaa"],
  "Naâma": ["Naama", "Mecheria", "Ain Sefra", "Tiout", "Sfissifa", "Moghrar", "Assela", "Djeniene Bourezg", "Ain Ben Khelil", "Makman Ben Amer", "Kasdir", "El Biodh"],
  "Aïn Témouchent": ["Ain Temouchent", "Hammam Bouhadjar", "Sidi Ben Adda", "Ain El Arbaa", "El Malah", "Tamzoura", "Chatabet El Leham", "Ain Kihal", "Aoubellil", "Bouzedjar", "Oued Sebbah", "Hassi El Ghella", "Ouled Kihal", "Chaabat El Leham", "Terga", "Oulhaça El Gheraba", "Sidi Ouriache", "Ain Tolba", "El Amria", "Hassi El Ghella", "Ouled Boudjemaa", "Aghlal", "Ain Safi", "Sidi Boumediene", "Beni Saf", "Sidi Safi", "Emir Abdelkader", "El Messaid"],
  "Ghardaïa": ["Ghardaia", "El Meniaa", "Dhaya Ben Dahoua", "Berriane", "Metlili", "El Guerrara", "El Atteuf", "Zelfana", "Sebseb", "Bounoura", "Hassi Fehal", "Hassi Gara", "Mansoura"],
  "Relizane": ["Relizane", "Oued Rhiou", "Gelaa", "Sidi M'Hamed Ben Ali", "Zemmoura", "Beni Dergoun", "El Matmar", "Sidi Khettab", "Belassel Bouzegza", "Sidi M'Hamed Benaouda", "Ain Tarek", "Had Echkalla", "El Ouldja", "Mazouna", "El Guettar", "Sidi Ali", "Bendaoud", "Ain Rahma", "Kalaa", "Sidi Saada", "Yellel", "Souk El Had", "Mendes", "Oued El Djemaa", "Djidiouia", "Hamri", "Beni Zentis", "Mediouna", "Sidi Lazreg", "Ammi Moussa", "Ouled Aiche"],
  "Timimoun": ["Timimoun", "Ouled Said", "Metarfa", "Talmine", "Tinerkouk", "Ksar Kaddour", "Charouine", "Bordj Badji Mokhtar", "Timiaouine"],
  "Bordj Badji Mokhtar": ["Bordj Badji Mokhtar", "Timiaouine"],
  "Ouled Djellal": ["Ouled Djellal", "Sidi Khaled", "Ras El Miad", "Besbes", "Chaiba", "Doucen"],
  "Béni Abbès": ["Beni Abbes", "Tamtert", "Igli", "El Ouata", "Ouled Khoudir", "Ksabi", "Timoudi", "Kerzaz", "Beni Ikhlef", "Tabelbala"],
  "In Salah": ["In Salah", "Foggaret Ezzaouia", "In Ghar"],
  "In Guezzam": ["In Guezzam", "Tin Zaouatine"],
  "Touggourt": ["Touggourt", "Nezla", "Tebesbest", "Zaouia El Abidia", "Megarine", "Sidi Slimane", "Tamacine", "Blidet Amor", "Temacine", "El Alia", "El Hadjira", "Benaceur", "Taibet", "Mnagar"],
  "Djanet": ["Djanet", "Bordj El Haouas"],
  "El M'Ghair": ["El M'Ghair", "Djamaa", "Oum Touyour", "Sidi Khelil", "Still", "M'Rara", "Sidi Amrane", "Tendla"],
  "El Meniaa": ["El Meniaa", "Hassi Gara", "Hassi Fehal"]
};

// Flatten Wilayas list for Selects
const WILAYAS = Object.keys(ALGERIA_DATA);

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

// 2. دالة مساعدة لتحويل النص (Base64) إلى ملف حقيقي
function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

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
    colors: [],
    colorImages: {} // New: Map color to image
  });

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

  // 3. الدالة الجديدة لرفع الصور إلى Vercel Blob
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    if (newProduct.images.length === 0) {
      alert("Veuillez ajouter au moins une image.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const imageUrls = [];

      // رفع الصور واحدة تلو الأخرى
      for (let i = 0; i < newProduct.images.length; i++) {
        // تحويل Base64 إلى ملف
        const file = dataURLtoFile(newProduct.images[i], `product-${Date.now()}-${i}.jpg`);

        // الرفع إلى Vercel Blob عبر الـ API
        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload', 
        });

        imageUrls.push(newBlob.url); // حفظ الرابط الجديد
      }

      // حفظ بيانات المنتج في Firestore (مع الروابط الخفيفة)
      const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      
      await addDoc(productsRef, {
        ...newProduct,
        images: imageUrls,       // المصفوفة تحتوي الآن على روابط http
        image: imageUrls[0],     // الصورة الرئيسية
        price: parseFloat(newProduct.price),
        createdAt: new Date().toISOString()
      });

      // إعادة تعيين النموذج
      setNewProduct({
        name: '',
        price: '',
        category: 'Costumes',
        description: '',
        images: [],
        sizes: [],
        colors: [],
        colorImages: {}
      });
      setActiveTab('products');
      alert("Produit ajouté avec succès !");

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'ajout: " + error.message);
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
      colors: product.colors || [],
      colorImages: product.colorImages || {}
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
        colors: editingProduct.colors || [],
        colorImages: editingProduct.colorImages || {}
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
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{orders.reduce((acc, curr) => acc + (curr.subtotal || 0), 0).toLocaleString()} <span className="text-sm font-normal">DZD</span></h3>
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
                    <option>Tricot</option>
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

                {/* Color Image Mapping for Edit */}
                {editingProduct.colors && editingProduct.colors.length > 0 && editingProduct.images && editingProduct.images.length > 0 && (
                  <div className="mt-4 p-4 bg-slate-100 rounded-xl">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Associer une image à chaque couleur (Optionnel)</h4>
                    <div className="space-y-3">
                      {editingProduct.colors.map(color => (
                        <div key={color} className="flex items-center gap-4">
                          <span className="text-sm font-semibold w-16">{color}</span>
                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                             {editingProduct.images.map((img, idx) => (
                               <div 
                                 key={idx} 
                                 onClick={() => setEditingProduct(prev => ({...prev, colorImages: {...prev.colorImages, [color]: img}}))}
                                 className={`w-12 h-12 rounded-md overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${editingProduct.colorImages?.[color] === img ? 'border-amber-600 ring-2 ring-amber-200' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                               >
                                 <img src={img} className="w-full h-full object-cover" alt={`${color} selection ${idx}`} />
                               </div>
                             ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              <div><label className="text-sm font-bold text-slate-700">Catégorie</label><select className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}><option>Costumes</option><option>Chemises</option><option>Chaussures</option><option>Accessoires</option><option>Manteaux</option><option>Pantalon</option><option>Tricot</option></select></div>
              
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

              {/* Color Image Mapping */}
              {newProduct.colors.length > 0 && newProduct.images.length > 0 && (
                <div className="mt-4 p-4 bg-slate-100 rounded-xl">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Associer une image à chaque couleur (Optionnel)</h4>
                  <div className="space-y-3">
                    {newProduct.colors.map(color => (
                      <div key={color} className="flex items-center gap-4">
                        <span className="text-sm font-semibold w-16">{color}</span>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                           {newProduct.images.map((img, idx) => (
                             <div 
                               key={idx} 
                               onClick={() => setNewProduct(prev => ({...prev, colorImages: {...prev.colorImages, [color]: img}}))}
                               className={`w-12 h-12 rounded-md overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${newProduct.colorImages?.[color] === img ? 'border-amber-600 ring-2 ring-amber-200' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                             >
                               <img src={img} className="w-full h-full object-cover" alt={`${color} selection ${idx}`} />
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-xl font-bold transition-all transform active:scale-95 shadow-md hover:shadow-lg">
                {isSubmitting ? 'Enregistrement...' : 'Publier le produit'}
              </button>
            </form>
          </div>
        )}

        {/* ... (Delivery and Orders tabs) ... */}
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

// --- Composant Filter Drawer (NOUVEAU) ---
const FilterDrawer = ({ isOpen, onClose, filters, setFilters, sortOption, setSortOption, resultsCount }) => {
  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const current = prev[type] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({ minPrice: '', maxPrice: '', sizes: [], colors: [] });
    setSortOption('newest');
  };

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
        <div className={`absolute right-0 top-0 h-full w-full md:w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 flex justify-between items-center border-b border-gray-100">
            <h2 className="logo-font text-2xl italic">Filtrer & Trier</h2>
            <button onClick={onClose} className="hover:rotate-90 transition duration-500"><X className="text-gray-400" strokeWidth={1} /></button>
          </div>

          <div className="flex-grow p-6 overflow-y-auto space-y-8 no-scrollbar">
            
            {/* Sort Section */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><ArrowUpDown size={14}/> Trier par</h3>
               <div className="grid grid-cols-1 gap-2">
                 {[
                   { id: 'newest', label: 'Nouveautés' },
                   { id: 'price-asc', label: 'Prix croissant' },
                   { id: 'price-desc', label: 'Prix décroissant' },
                 ].map(opt => (
                   <button
                    key={opt.id}
                    onClick={() => setSortOption(opt.id)}
                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${sortOption === opt.id ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                   >
                     {opt.label}
                   </button>
                 ))}
               </div>
            </div>

            <hr className="border-gray-100" />

            {/* Price Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Prix (DZD)</h3>
              <div className="flex gap-4 items-center">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm outline-none focus:border-black transition-colors"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Sizes Section */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Tailles</h3>
               <div className="flex flex-wrap gap-2">
                  {[...CLOTHING_SIZES, ...SHOE_SIZES].map(size => (
                    <button
                      key={size}
                      onClick={() => toggleFilter('sizes', size)}
                      className={`px-3 py-2 rounded-md text-xs font-bold border transition-all ${filters.sizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                    >
                      {size}
                    </button>
                  ))}
               </div>
            </div>

            <hr className="border-gray-100" />

            {/* Colors Section */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Couleurs</h3>
               <div className="flex flex-wrap gap-3">
                  {AVAILABLE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => toggleFilter('colors', color)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${filters.colors.includes(color) ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                    >
                      <span className="w-3 h-3 rounded-full border border-gray-100" style={{backgroundColor: color === 'Blanc' ? '#fff' : color === 'Noir' ? '#000' : color.toLowerCase()}}></span>
                      {color}
                    </button>
                  ))}
               </div>
            </div>

          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
             <button onClick={clearFilters} className="px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors">
               Réinitialiser
             </button>
             <button onClick={onClose} className="flex-1 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#c4a47c] transition-colors shadow-lg">
               Afficher ({resultsCount})
             </button>
          </div>
        </div>
    </div>
  );
};


// --- Composant CartDrawer ---
const CartDrawer = ({ isOpen, onClose, cart, removeFromCart, user }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', commune: '' });
  const [orderComplete, setOrderComplete] = useState(false);
  const [deliveryType, setDeliveryType] = useState('home');
  const [deliveryFees, setDeliveryFees] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);

  // Available Communes based on selected Wilaya
  const availableCommunes = useMemo(() => {
    // Deduplicate communes using Set to prevent unique key errors
    const rawList = formData.wilaya ? (ALGERIA_DATA[formData.wilaya] || []) : [];
    return [...new Set(rawList)].sort();
  }, [formData.wilaya]);

  useEffect(() => {
    if (!user) return;
    const feesRef = collection(db, 'artifacts', appId, 'public', 'data', 'delivery_fees');
    const unsubscribeFees = onSnapshot(feesRef, (snapshot) => {
      const feesMap = {};
      snapshot.docs.forEach(doc => {
        feesMap[doc.id] = doc.data();
      });
      setDeliveryFees(feesMap);
    }, (error) => console.error("Fees fetch error:", error));
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
      alert("يرجى ملء جميع الحقول.");
      return;
    }

    // New validation logic
    const phoneRegex = /^(05|06|07)[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
        alert("يجب أن يكون رقم الهاتف بالصيغة (05XXXXXXXX, 06XXXXXXXX, 07XXXXXXXX).");
        return;
    }
    
    if (!user) {
        alert("خطأ في المصادقة. يرجى تحديث الصفحة.");
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
      alert("خطأ أثناء إرسال الطلب. تحقق من اتصالك بالإنترنت.");
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} dir="rtl">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
        <div className={`absolute left-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 flex justify-between items-center border-b border-gray-100">
            <h2 className="logo-font text-3xl italic">سلة المشتريات</h2>
            <button onClick={onClose} className="hover:rotate-90 transition duration-500"><X className="text-gray-400" strokeWidth={1} /></button>
          </div>

          <div className="flex-grow p-8 overflow-y-auto space-y-8 no-scrollbar">
            {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                  <p className="italic font-light">السلة فارغة.</p>
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
                          {item.selectedSize && <p className="text-[10px] text-gray-500 mt-1">المقاس: {item.selectedSize}</p>}
                          {item.selectedColor && <p className="text-[10px] text-gray-500 mt-1">اللون: {item.selectedColor}</p>}
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
                  <span>المجموع الفرعي</span>
                  <span>{subtotal.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>التوصيل ({deliveryType === 'home' ? 'المنزل' : 'المكتب'})</span>
                  <span>{deliveryPrice.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="text-xs uppercase font-bold text-gray-400">المجموع</span>
                  <span className="text-3xl font-bold tracking-tighter logo-font">{total.toLocaleString()} <span className="text-sm font-sans font-normal text-gray-500">DZD</span></span>
                </div>
              </div>
             )}

            {showCheckout && !orderComplete && (
              <div className="space-y-3 pt-2 animate-[slideUp_0.4s_ease-out]">
                <input 
                  value={formData.name}
                  placeholder="الاسم الكامل" 
                  className="w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition text-right" 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
                <input 
                  type="tel"
                  value={formData.phone}
                  placeholder="رقم الهاتف (05/06/07...)" 
                  className="w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition text-right" 
                  onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})} 
                />
                <div className="grid grid-cols-2 gap-3">
                    <select 
                      className="w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition"
                      value={formData.wilaya}
                      onChange={e => setFormData({...formData, wilaya: e.target.value, commune: ''})}
                    >
                      <option value="">اختر الولاية</option>
                      {WILAYAS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                    
                    <select
                      className={`w-full bg-white border border-gray-200 p-4 text-[11px] font-bold tracking-widest outline-none focus:border-[#c4a47c] transition ${!formData.wilaya ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={formData.commune}
                      onChange={e => setFormData({...formData, commune: e.target.value})}
                      disabled={!formData.wilaya}
                    >
                      <option value="">اختر البلدية</option>
                      {availableCommunes.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button 
                    className={`p-3 border rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${deliveryType === 'desk' ? 'border-[#c4a47c] bg-amber-50 text-[#c4a47c]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    onClick={() => setDeliveryType('desk')}
                  >
                    المكتب (Stop Desk)<br/>
                    {formData.wilaya ? (
                        <span className="text-xs">+{deskPrice} DZD</span>
                    ) : (
                        <span className="text-xs text-gray-300">يرجى اختيار الولاية</span>
                    )}
                  </button>
                  <button 
                    className={`p-3 border rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${deliveryType === 'home' ? 'border-[#c4a47c] bg-amber-50 text-[#c4a47c]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    onClick={() => setDeliveryType('home')}
                  >
                    توصيل للمنزل<br/>
                    {formData.wilaya ? (
                        <span className="text-xs">+{homePrice} DZD</span>
                    ) : (
                        <span className="text-xs text-gray-300">يرجى اختيار الولاية</span>
                    )}
                  </button>
                </div>
                
                <button onClick={handleOrder} className="w-full bg-[#1a1a1a] text-white py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#c4a47c] transition duration-300 mt-2">تأكيد الشراء</button>
              </div>
            )}

            {!showCheckout && cart.length > 0 && (
              <button onClick={() => setShowCheckout(true)} className="w-full bg-[#1a1a1a] text-white py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#c4a47c] transition duration-300">طلب</button>
            )}

            {orderComplete && (
              <div className="text-center p-6 bg-white border border-green-100 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CheckCircle size={24} />
                </div>
                <p className="text-green-800 font-bold mb-2 uppercase text-xs tracking-widest">تم إرسال الطلب!</p>
                <p className="text-xs text-gray-500">سنقوم بالاتصال بك على رقمك.</p>
                <button onClick={() => {setOrderComplete(false); onClose(); setShowCheckout(false)}} className="mt-4 text-[10px] font-bold underline hover:text-[#c4a47c]">إغلاق</button>
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
                      onClick={() => {
                        setSelectedColor(color);
                        if (product.colorImages && product.colorImages[color]) {
                          setActiveImage(product.colorImages[color]);
                        }
                      }}
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
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sizes: [],
    colors: []
  });
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'price-asc', 'price-desc'
  
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
  
  const PREDEFINED_CATEGORIES = ['Costumes', 'Chaussures', 'Accessoires', 'Chemises', 'Manteaux', 'Pantalon', 'Tricot'];
  const dynamicCategories = allProducts.map(p => p.category).filter(Boolean);
  const categories = ['Tout', ...new Set([...PREDEFINED_CATEGORIES, ...dynamicCategories])];

  // Logic de filtrage avancée
  const filteredProducts = allProducts.filter(p => {
     // Category Filter
     if (selectedCategory !== 'Tout' && p.category !== selectedCategory) return false;

     // Price Filter
     const price = p.price || 0;
     if (filters.minPrice && price < parseInt(filters.minPrice)) return false;
     if (filters.maxPrice && price > parseInt(filters.maxPrice)) return false;

     // Size Filter
     if (filters.sizes.length > 0) {
       if (!p.sizes || !p.sizes.some(s => filters.sizes.includes(s))) return false;
     }

     // Color Filter
     if (filters.colors.length > 0) {
       if (!p.colors || !p.colors.some(c => filters.colors.includes(c))) return false;
     }

     return true;
  });

  // Sort Logic
  const displayProducts = [...filteredProducts].sort((a, b) => {
     if (sortOption === 'price-asc') return a.price - b.price;
     if (sortOption === 'price-desc') return b.price - a.price;
     // 'newest' logic (assuming createdAt exists, else fallback to index logic via id if sortable)
     if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
     return 0; 
  });

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

            {/* Category Filter & Sort Button */}
            <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
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

              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-6 py-2 border border-gray-200 rounded-full hover:border-black transition-all text-xs font-bold uppercase tracking-widest group bg-white shadow-sm hover:shadow-md"
              >
                 <SlidersHorizontal size={14} className="group-hover:scale-110 transition-transform" /> 
                 Filtrer & Trier
                 {(filters.minPrice || filters.maxPrice || filters.sizes.length > 0 || filters.colors.length > 0) && (
                   <span className="w-2 h-2 rounded-full bg-[#c4a47c]"></span>
                 )}
              </button>
            </div>

            {loadingProducts ? (
               <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <>
                {displayProducts.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 italic">Aucun produit ne correspond à votre sélection.</div>
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

        <FilterDrawer 
           isOpen={isFilterOpen} 
           onClose={() => setIsFilterOpen(false)}
           filters={filters}
           setFilters={setFilters}
           sortOption={sortOption}
           setSortOption={setSortOption}
           resultsCount={displayProducts.length}
        />

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
              <p className="flex items-center gap-3 hover:text-white transition"><MapPin size={14} /> Les Tours, Sétif, Algeria</p>
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);

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
  // Instead of setting state directly, we update the hash.
  // The useEffect listener picks this up and updates the state.
  
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
           removeFromCart={removeFromCart}
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