import { Product } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-pig-stress-toy",
    title: "Squeeze Pink Pig Stress Reliever Toy with Red Tie",
    brand: "TECH AI Fun",
    category: "Toys & Stress Relief",
    price: 399,
    originalPrice: 799,
    discountPercent: 50,
    rating: 4.8,
    reviewCount: 342,
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80",
    stock: 25,
    isTrending: true,
    isBestSeller: true,
    description: "Ultra-stretchable, super-soft pink pig squishy stress toy wearing a stylish red necktie. High-elasticity TPR material restores its shape immediately after squeezing, stretching, or flattening. Perfect desk buddy for work and study relaxation.",
    features: [
      "Non-toxic eco-friendly soft TPR rubber",
      "Stretches up to 3x its original size",
      "Washable with warm water and soap",
      "Ergonomic anti-anxiety squeeze mechanism",
      "Iconic executive pig design with red tie"
    ],
    specs: {
      "Material": "Eco-friendly Soft TPR Rubber",
      "Weight": "450g",
      "Dimensions": "15cm x 12cm x 10cm",
      "Color": "Pink / Red Tie",
      "Age Group": "3+ Years"
    }
  },
  {
    id: "prod-adidas-f50-cleats",
    title: "Adidas F50 Elite FG Speed Cleats - Light Blue & White",
    brand: "Adidas",
    category: "Footwear & Sports",
    price: 14999,
    originalPrice: 19999,
    discountPercent: 25,
    rating: 4.9,
    reviewCount: 188,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    stock: 12,
    isTrending: true,
    isBestSeller: false,
    description: "Engineered for pure speed and precision control on firm ground pitches. Features Fibertouch upper with Sprintweb 3D texture for supreme ball mastery and Sprintframe 360 outsole with dynamic stud configuration.",
    features: [
      "Ultra-lightweight Fibertouch engineered upper",
      "Sprintweb 3D high-definition grip texture",
      "Sprintframe 360 aerodynamic firm-ground outsole",
      "Compression fit laceless tunnel construction",
      "Worn by elite world-class strikers"
    ],
    specs: {
      "Sole Material": "Synthetic Firm Ground Studs",
      "Upper Material": "Fibertouch Microfiber",
      "Colorway": "Lucid Cyan / Footwear White / Solar Red",
      "Closure": "Lace-up Lockdown",
      "Weight": "185g (per shoe)"
    }
  },
  {
    id: "prod-omega-moonswatch-snoopy",
    title: "Omega x Swatch Speedmaster MoonSwatch - Mission to the Moonphase White (Snoopy)",
    brand: "Omega x Swatch",
    category: "Watches & Accessories",
    price: 28500,
    originalPrice: 35000,
    discountPercent: 18,
    rating: 4.95,
    reviewCount: 512,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    stock: 6,
    isTrending: true,
    isBestSeller: true,
    description: "All-white Bioceramic chronograph with an iconic Snoopy Moonphase function at 2 o'clock. Features UV-reactive hidden quote: 'I CAN'T SLEEP WITHOUT A NIGHT LIGHT!'. Fitted with a white VELCRO© strap for astronaut ergonomics.",
    features: [
      "Patented Bioceramic case and bezel",
      "Snoopy Moonphase disc with secret UV glow message",
      "Tachymeter scale with dot over 90 detail",
      "Precision Swiss Quartz Chronograph movement",
      "Original Omega x Swatch astronaut VELCRO strap"
    ],
    specs: {
      "Case Diameter": "42.00 mm",
      "Case Thickness": "13.75 mm",
      "Movement": "Swiss Quartz Chronograph",
      "Water Resistance": "3 Bar (30m)",
      "Strap": "White VELCRO®"
    }
  },
  {
    id: "prod-crocs-clog-beige",
    title: "Crocs Classic Platform Clog - Cream / Ocean Blue Trim",
    brand: "Crocs",
    category: "Footwear & Sports",
    price: 3495,
    originalPrice: 4995,
    discountPercent: 30,
    rating: 4.7,
    reviewCount: 890,
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&auto=format&fit=crop&q=80",
    stock: 40,
    isTrending: false,
    isBestSeller: true,
    description: "Ultra-comfortable platform elevated Crocs clog featuring iconic Croslite foam cushioning, side blue racing strip, ventilation ports for breathability, and pivoting heel strap for a secure fit.",
    features: [
      "Contoured Croslite™ footbed for legendary comfort",
      "Elevated 1.6-inch / 4.1cm platform height",
      "Water-friendly and quick to dry",
      "Customizable with Jibbitz™ charms",
      "Non-marking lightweight traction outsole"
    ],
    specs: {
      "Material": "100% Croslite Foam",
      "Heel Height": "4.1 cm Platform",
      "Color": "Bone / Cream with Blue Trim",
      "Fit": "Roomy Comfort Fit"
    }
  },
  {
    id: "prod-techai-vision-pro",
    title: "TECH AI Spatial Vision Pro AR Glasses with 4K Micro-OLED",
    brand: "TECH AI",
    category: "AI Electronics",
    price: 34999,
    originalPrice: 44999,
    discountPercent: 22,
    rating: 4.9,
    reviewCount: 120,
    stock: 15,
    isAiProduct: true,
    isTrending: true,
    isBestSeller: true,
    description: "Next-generation AI Spatial Glasses equipped with dual 4K Micro-OLED displays, real-time voice translation powered by TECH AI Neural Engine, 6DoF spatial tracking, and whisper-quiet active cooling.",
    features: [
      "Dual 4K Micro-OLED screens with 120Hz refresh rate",
      "Built-in TECH AI Assistant for real-time live translation",
      "Hand gesture control and eye tracking camera system",
      "Spatial Audio speakers with directionality",
      "Lightweight 88g titanium frame design"
    ],
    specs: {
      "Display": "Dual 4K Micro-OLED (3840x2160 per eye)",
      "Processor": "TECH AI Neural Coprocessor X1",
      "Weight": "88g",
      "Connectivity": "Wi-Fi 7, Bluetooth 5.4, USB-C DP",
      "Battery Life": "4 Hours (External Mag-Pack)"
    }
  },
  {
    id: "prod-cyberpulse-anc-headphone",
    title: "CyberPulse AI Active Noise Canceling Wireless Headphones",
    brand: "CyberPulse",
    category: "AI Electronics",
    price: 8999,
    originalPrice: 14999,
    discountPercent: 40,
    rating: 4.85,
    reviewCount: 420,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    stock: 30,
    isAiProduct: true,
    isTrending: true,
    isBestSeller: false,
    description: "Studio-grade wireless headphones with adaptive AI ANC that analyzes surrounding noise 40,000 times per second. Delivering deep bass, spatial audio head tracking, and up to 60 hours of continuous playback.",
    features: [
      "Adaptive Hybrid ANC with Transparency Mode",
      "Custom 40mm Beryllium acoustic drivers",
      "Spatial Audio with Dynamic Head Tracking",
      "Dual AI beamforming mics for crystal clear calls",
      "60-hour battery life with 10-min fast charge"
    ],
    specs: {
      "Driver Size": "40mm Beryllium",
      "Bluetooth": "v5.4 with LDAC & AAC",
      "Battery": "60 Hours (ANC Off), 45 Hours (ANC On)",
      "Weight": "250g"
    }
  },
  {
    id: "prod-nova-ring-ai",
    title: "Nova Ring AI Titanium Smart Health Tracker",
    brand: "TECH AI",
    category: "AI Electronics",
    price: 12999,
    originalPrice: 18999,
    discountPercent: 31,
    rating: 4.75,
    reviewCount: 260,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
    stock: 18,
    isAiProduct: true,
    isTrending: true,
    isBestSeller: false,
    description: "Ultra-sleek grade-5 titanium smart ring with medical-grade PPG sensors. Tracks sleep stages, Heart Rate Variability (HRV), skin temperature trends, stress scores, and daily recovery guidance.",
    features: [
      "Fighter-jet Grade 5 Titanium construction",
      "100m Water Resistance (10 ATM)",
      "Continuous PPG Heart Rate & SpO2 monitoring",
      "7-Day battery life on a single wireless charge",
      "Zero subscription fees for AI analytics"
    ],
    specs: {
      "Material": "Grade 5 Titanium + PVD Coating",
      "Sensors": "Optical Heart Rate, SpO2, Skin Temp, Accelerometer",
      "Battery": "Up to 7 Days",
      "Waterproofing": "10 ATM / 100m"
    }
  },
  {
    id: "prod-aerodrone-4k",
    title: "AeroDrone 4K AI Dual-Camera Folding GPS Drone",
    brand: "AeroTech",
    category: "AI Electronics",
    price: 24999,
    originalPrice: 32999,
    discountPercent: 24,
    rating: 4.88,
    reviewCount: 175,
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80",
    stock: 8,
    isAiProduct: true,
    isTrending: true,
    isBestSeller: true,
    description: "Compact folding drone with 4K HDR dual cameras, 3-axis mechanical gimbal, 360° omnidirectional AI obstacle avoidance, and 45-minute extended flight time with automatic smart Return-to-Home.",
    features: [
      "4K/60fps HDR 1/1.3-inch CMOS Sensor",
      "3-Axis Mechanical Stabilization Gimbal",
      "Omnidirectional AI Obstacle Avoidance",
      "12km HD OcuSync 4 Video Transmission",
      "45 minutes long flight time per battery"
    ],
    specs: {
      "Camera": "4K HDR 60fps / 48MP Photos",
      "Flight Time": "45 Minutes",
      "Control Distance": "12 km Range",
      "Weight": "249g (No License Required)"
    }
  },
  {
    id: "prod-auradesk-ai-hologram",
    title: "AuraDesk AI Holographic Interactive Desktop Companion",
    brand: "TECH AI",
    category: "AI Electronics",
    price: 9999,
    originalPrice: 15999,
    discountPercent: 37,
    rating: 4.92,
    reviewCount: 310,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    stock: 20,
    isAiProduct: true,
    isTrending: true,
    isBestSeller: true,
    description: "Futuristic desktop holographic sphere that projects interactive 3D avatars, live calendar widgets, AI voice assistant responses, music visualizer, and custom notifications right on your desk.",
    features: [
      "3D Glass Prism Light Field Projection",
      "Built-in TECH AI Voice Assistant with GPT-4o intelligence",
      "Gesture-controlled interactive 3D widgets",
      "High-fidelity 10W Spatial Speaker System",
      "Syncs seamlessly with iOS, Android & Windows"
    ],
    specs: {
      "Display": "3D Light-Field Holographic Prism",
      "Audio": "10W Stereo Neodymium Driver",
      "Wireless": "Wi-Fi 6, Bluetooth 5.3",
      "Power": "USB-C PD 30W"
    }
  },
  {
    id: "prod-keychron-q1-max",
    title: "Keychron Q1 Max Wireless Custom Mechanical Keyboard RGB",
    brand: "Keychron",
    category: "Computers & Gaming",
    price: 16999,
    originalPrice: 21999,
    discountPercent: 22,
    rating: 4.9,
    reviewCount: 280,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    stock: 14,
    isTrending: false,
    isBestSeller: true,
    description: "Full CNC aluminum body 75% mechanical keyboard with double-gasket mount design, hot-swappable Gateron Jupiter Banana switches, 2.4GHz wireless & Bluetooth 5.1, and south-facing RGB illumination.",
    features: [
      "Solid 6063 CNC Machined Aluminum Frame",
      "Acoustic acoustic foam double-gasket mount construction",
      "2.4 GHz wireless connection with 1000 Hz polling rate",
      "Hot-swappable PCB supporting 3-pin & 5-pin switches",
      "KSA Double-shot PBT keycaps"
    ],
    specs: {
      "Layout": "75% Compact",
      "Body Material": "Full CNC Aluminum",
      "Connectivity": "2.4GHz / Bluetooth 5.1 / Type-C",
      "Battery": "4000 mAh Rechargeable"
    }
  },
  {
    id: "prod-prostream-4k-webcam",
    title: "ProStream 4K Ultra AI Autofocus Webcam with Dual Mics",
    brand: "ProStream",
    category: "Computers & Gaming",
    price: 6499,
    originalPrice: 9999,
    discountPercent: 35,
    rating: 4.8,
    reviewCount: 145,
    image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=800&auto=format&fit=crop&q=80",
    stock: 22,
    isAiProduct: true,
    isTrending: false,
    isBestSeller: false,
    description: "4K UHD webcam featuring AI Auto-Framing presenter tracking, HDR lighting correction, magnetic privacy shutter, and omnidirectional noise-canceling microphones.",
    features: [
      "Sony STARVIS™ 4K CMOS sensor",
      "AI Auto-Framing presenter tracking",
      "Dual noise-canceling omnidirectional microphones",
      "Integrated magnetic privacy cover",
      "Plug & play driverless setup for PC/Mac"
    ],
    specs: {
      "Resolution": "4K UHD @ 30fps / 1080p @ 60fps",
      "Field of View": "90° Adjustable",
      "Interface": "USB 3.0 Type-C",
      "Mounting": "Universal Monitor Clip + 1/4\" Tripod Thread"
    }
  },
  {
    id: "prod-hypercharge-140w-gan",
    title: "HyperCharge 20,000mAh 140W GaN OLED Power Bank",
    brand: "TECH AI",
    category: "Computers & Gaming",
    price: 4999,
    originalPrice: 7999,
    discountPercent: 37,
    rating: 4.86,
    reviewCount: 390,
    image: "https://images.unsplash.com/photo-1609592424009-54070a2f7c00?w=800&auto=format&fit=crop&q=80",
    stock: 35,
    isAiProduct: true,
    isTrending: true,
    isBestSeller: true,
    description: "Ultra-fast 140W Power Delivery 3.1 power bank equipped with real-time OLED color display showing power output watts, battery health percentage, temperature, and recharge time remaining.",
    features: [
      "140W USB-C PD 3.1 Fast Charge (Charges MacBook Pro to 50% in 30 mins)",
      "20,000 mAh TSA-approved airline safe capacity",
      "Real-time Smart OLED digital telemetry display",
      "Gallium Nitride (GaN III) cool running technology",
      "Charges up to 3 devices simultaneously"
    ],
    specs: {
      "Capacity": "20,000 mAh / 72Wh",
      "Max Output": "140W Single Port / 170W Total",
      "Ports": "2x USB-C PD 3.1 + 1x USB-A 22.5W",
      "Screen": "1.3\" Color OLED Display"
    }
  }
];

export const CATEGORIES = [
  "All Categories",
  "AI Electronics",
  "Toys & Stress Relief",
  "Footwear & Sports",
  "Watches & Accessories",
  "Computers & Gaming"
];
