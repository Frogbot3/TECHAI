import { Product } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-pig-stress-toy",
    title: "NoiseFit Pulse 3 Bluetooth Calling Smartwatch",
    brand: "Noise",
    category: "Mobiles & Wearables",
    price: 1799,
    originalPrice: 4999,
    discountPercent: 64,
    rating: 4.4,
    reviewCount: 1842,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop&q=80",
    stock: 36,
    isTrending: true,
    isBestSeller: true,
    description: "A daily-use smartwatch with Bluetooth calling, health tracking, bright display, and multi-day battery life for work, workouts, and travel.",
    features: [
      "Bluetooth calling with built-in speaker and mic",
      "Heart rate, SpO2, sleep, and activity tracking",
      "Bright color display with custom watch faces",
      "Water-resistant body for everyday use",
      "Up to 7 days battery life"
    ],
    specs: {
      Display: "1.85 inch TFT",
      Battery: "Up to 7 days",
      Connectivity: "Bluetooth",
      Warranty: "1 year brand warranty"
    }
  },
  {
    id: "prod-adidas-f50-cleats",
    title: "Campus Everyday Running Shoes for Men",
    brand: "Campus",
    category: "Fashion",
    price: 1299,
    originalPrice: 2499,
    discountPercent: 48,
    rating: 4.2,
    reviewCount: 956,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
    stock: 42,
    isTrending: true,
    description: "Lightweight running shoes with breathable mesh upper, cushioned sole, and reliable grip for daily walking, gym sessions, and casual wear.",
    features: [
      "Breathable knitted mesh upper",
      "Soft EVA midsole cushioning",
      "Durable outsole with strong grip",
      "Lace-up fit for secure support",
      "Suitable for running and everyday use"
    ],
    specs: {
      Material: "Mesh and synthetic",
      Sole: "EVA and rubber",
      Closure: "Lace-up",
      Warranty: "30 day replacement"
    }
  },
  {
    id: "prod-omega-moonswatch-snoopy",
    title: "Titan Neo Analog Watch with Stainless Steel Strap",
    brand: "Titan",
    category: "Fashion",
    price: 3995,
    originalPrice: 5495,
    discountPercent: 27,
    rating: 4.6,
    reviewCount: 731,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900&auto=format&fit=crop&q=80",
    stock: 18,
    isBestSeller: true,
    description: "A clean stainless steel analog watch with a versatile dial, comfortable strap, and reliable quartz movement for everyday office and casual wear.",
    features: [
      "Quartz movement for accurate timekeeping",
      "Stainless steel strap with fold-over clasp",
      "Scratch-resistant mineral glass",
      "Water resistant for daily splashes",
      "Gift-ready brand packaging"
    ],
    specs: {
      Movement: "Quartz",
      Strap: "Stainless steel",
      Dial: "Analog",
      Warranty: "2 years brand warranty"
    }
  },
  {
    id: "prod-crocs-clog-beige",
    title: "UrbanCart Soft Foam Clogs for Men and Women",
    brand: "UrbanCart",
    category: "Fashion",
    price: 699,
    originalPrice: 1499,
    discountPercent: 53,
    rating: 4.1,
    reviewCount: 428,
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=900&auto=format&fit=crop&q=80",
    stock: 55,
    isBestSeller: true,
    description: "Comfortable slip-on clogs with a soft foam build, ventilated design, and easy-clean finish for home, errands, travel, and casual wear.",
    features: [
      "Lightweight soft foam construction",
      "Ventilation holes for airflow",
      "Easy to wash and quick to dry",
      "Pivoting heel strap for a steady fit",
      "Unisex everyday style"
    ],
    specs: {
      Material: "EVA foam",
      Fit: "Regular",
      Care: "Washable",
      Return: "7 day replacement"
    }
  },
  {
    id: "prod-techai-vision-pro",
    title: "Samsung Galaxy M Series 5G Smartphone",
    brand: "Samsung",
    category: "Mobiles & Wearables",
    price: 13999,
    originalPrice: 18999,
    discountPercent: 26,
    rating: 4.3,
    reviewCount: 2680,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900&auto=format&fit=crop&q=80",
    stock: 24,
    isTrending: true,
    isBestSeller: true,
    description: "A reliable 5G smartphone with a vivid display, large battery, fast processor, and practical camera setup for everyday entertainment and productivity.",
    features: [
      "5G-ready performance for fast browsing",
      "Large display for video and gaming",
      "Long-lasting battery with fast charging support",
      "Multi-camera setup for everyday photography",
      "Expandable storage support"
    ],
    specs: {
      Display: "6.6 inch FHD+",
      Storage: "128 GB",
      RAM: "6 GB",
      Battery: "5000 mAh"
    }
  },
  {
    id: "prod-cyberpulse-anc-headphone",
    title: "boAt Rockerz Wireless Headphones with Fast Charge",
    brand: "boAt",
    category: "Electronics",
    price: 1499,
    originalPrice: 3990,
    discountPercent: 62,
    rating: 4.2,
    reviewCount: 3490,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80",
    stock: 68,
    isTrending: true,
    description: "Wireless headphones with punchy sound, comfortable ear cushions, fast charging, and long battery life for music, classes, meetings, and travel.",
    features: [
      "Wireless Bluetooth audio",
      "Fast charging support",
      "Soft padded ear cushions",
      "Built-in microphone for calls",
      "Foldable design for easy carrying"
    ],
    specs: {
      Playback: "Up to 20 hours",
      Connectivity: "Bluetooth 5.0",
      Charging: "USB-C",
      Warranty: "1 year brand warranty"
    }
  },
  {
    id: "prod-nova-ring-ai",
    title: "Havells 1200W Steam Iron with Non-Stick Soleplate",
    brand: "Havells",
    category: "Home Appliances",
    price: 1199,
    originalPrice: 1995,
    discountPercent: 40,
    rating: 4.3,
    reviewCount: 1294,
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=900&auto=format&fit=crop&q=80",
    stock: 33,
    isBestSeller: true,
    description: "A compact steam iron with non-stick soleplate, variable steam control, and quick heating for daily clothes care at home.",
    features: [
      "1200W quick heating performance",
      "Non-stick coated soleplate",
      "Variable steam control",
      "Comfortable grip and stable heel rest",
      "Overheat safety protection"
    ],
    specs: {
      Power: "1200W",
      Soleplate: "Non-stick coating",
      Steam: "Variable control",
      Warranty: "2 years brand warranty"
    }
  },
  {
    id: "prod-aerodrone-4k",
    title: "Prestige Electric Kettle 1.5 Litre Stainless Steel",
    brand: "Prestige",
    category: "Home Appliances",
    price: 899,
    originalPrice: 1495,
    discountPercent: 40,
    rating: 4.4,
    reviewCount: 2140,
    image: "https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=900&auto=format&fit=crop&q=80",
    stock: 46,
    isBestSeller: true,
    description: "A stainless steel electric kettle with auto cut-off, easy pouring, and fast boiling for tea, coffee, instant meals, and kitchen use.",
    features: [
      "1.5 litre family-size capacity",
      "Auto cut-off for safety",
      "Stainless steel body",
      "Wide mouth for easy cleaning",
      "360 degree cordless base"
    ],
    specs: {
      Capacity: "1.5 litre",
      Power: "1500W",
      Body: "Stainless steel",
      Warranty: "1 year brand warranty"
    }
  },
  {
    id: "prod-auradesk-ai-hologram",
    title: "Zebronics Full HD Web Camera with Built-in Microphone",
    brand: "Zebronics",
    category: "Computers & Gaming",
    price: 999,
    originalPrice: 1999,
    discountPercent: 50,
    rating: 4.0,
    reviewCount: 840,
    image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=900&auto=format&fit=crop&q=80",
    stock: 29,
    isTrending: true,
    description: "A plug-and-play Full HD webcam with built-in mic and universal monitor mount for video calls, online classes, interviews, and streaming.",
    features: [
      "Full HD video support",
      "Built-in microphone",
      "Universal clip for laptops and monitors",
      "Plug-and-play USB setup",
      "Works with major meeting apps"
    ],
    specs: {
      Resolution: "1080p",
      Interface: "USB",
      Microphone: "Built-in",
      Warranty: "1 year brand warranty"
    }
  },
  {
    id: "prod-keychron-q1-max",
    title: "Redgear Shadow Blade Mechanical Gaming Keyboard",
    brand: "Redgear",
    category: "Computers & Gaming",
    price: 2499,
    originalPrice: 4999,
    discountPercent: 50,
    rating: 4.5,
    reviewCount: 1576,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add?w=900&auto=format&fit=crop&q=80",
    stock: 22,
    isTrending: true,
    isBestSeller: true,
    description: "A sturdy mechanical keyboard with tactile switches, RGB lighting, media controls, and a wrist rest for gaming and productivity setups.",
    features: [
      "Mechanical blue switches",
      "RGB lighting modes",
      "Dedicated media control knob",
      "Detachable wrist rest",
      "Durable braided cable"
    ],
    specs: {
      Layout: "Full size",
      Switches: "Mechanical blue",
      Lighting: "RGB",
      Warranty: "1 year brand warranty"
    }
  },
  {
    id: "prod-prostream-4k-webcam",
    title: "Mamaearth Vitamin C Face Wash 100 ml",
    brand: "Mamaearth",
    category: "Beauty & Personal Care",
    price: 249,
    originalPrice: 299,
    discountPercent: 17,
    rating: 4.1,
    reviewCount: 2450,
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=900&auto=format&fit=crop&q=80",
    stock: 82,
    isBestSeller: true,
    description: "A gentle daily face wash with vitamin C and turmeric, made for refreshing cleansing and a clean, bright-looking finish.",
    features: [
      "Vitamin C and turmeric formula",
      "Suitable for daily cleansing",
      "Removes dirt and excess oil",
      "Dermatologically tested",
      "Travel-friendly 100 ml pack"
    ],
    specs: {
      Quantity: "100 ml",
      SkinType: "All skin types",
      Form: "Gel cleanser",
      Return: "Non-returnable hygiene item"
    }
  },
  {
    id: "prod-hypercharge-140w-gan",
    title: "Tata Sampann Unpolished Toor Dal 1 kg",
    brand: "Tata Sampann",
    category: "Grocery & Essentials",
    price: 189,
    originalPrice: 240,
    discountPercent: 21,
    rating: 4.5,
    reviewCount: 3890,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&auto=format&fit=crop&q=80",
    stock: 120,
    isBestSeller: true,
    description: "Unpolished toor dal for everyday cooking, packed for freshness and consistent quality in dals, sambar, khichdi, and home meals.",
    features: [
      "Unpolished dal retains natural goodness",
      "High protein staple for daily meals",
      "Clean packed 1 kg pouch",
      "Suitable for dal, sambar, and khichdi",
      "Trusted grocery pantry essential"
    ],
    specs: {
      Weight: "1 kg",
      Type: "Toor dal",
      ShelfLife: "Refer pack",
      Storage: "Store in a cool dry place"
    }
  }
];

export const CATEGORIES = [
  "All Categories",
  "Mobiles & Wearables",
  "Electronics",
  "Home Appliances",
  "Fashion",
  "Computers & Gaming",
  "Beauty & Personal Care",
  "Grocery & Essentials"
];
