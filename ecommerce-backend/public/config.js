// Pathaan Collection - Global Frontend Configuration

let API_BASE = "https://pathaan-backend.vercel.app";

// Local development
if (
    window.location.protocol === "file:" ||
    window.location.port === "5500" ||
    window.location.port === "3000" ||
    window.location.port === "5173" ||
    window.location.port === "8080"
) {
    API_BASE = "http://localhost:5000";
}

// Optional backend override
if (localStorage.getItem("BACKEND_URL")) {
    API_BASE = localStorage.getItem("BACKEND_URL").replace(/\/$/, "");
}

function getSitePreferences() {
    try {
        const saved = JSON.parse(localStorage.getItem("pathaanSettings") || "{}");
        return {
            language: saved.language === "hi" ? "hi" : "en",
            currency: saved.currency === "USD" ? "USD" : "INR"
        };
    } catch (error) {
        return { language: "en", currency: "INR" };
    }
}

const siteTranslations = {
    "Back to the Atelier": "एटेलियर पर वापस जाएँ",
    "Continue Shopping": "खरीदारी जारी रखें",
    "My Shopping Cart": "मेरा शॉपिंग कार्ट",
    "Shopping Cart": "शॉपिंग कार्ट",
    "My Orders": "मेरे ऑर्डर",
    "Order History": "ऑर्डर इतिहास",
    "Order Summary": "ऑर्डर सारांश",
    "Subtotal": "उप-योग",
    "Estimated Shipping": "अनुमानित शिपिंग",
    "Estimated Delivery": "अनुमानित डिलीवरी",
    "Total": "कुल",
    "Total Amount": "कुल राशि",
    "Checkout Now": "अभी चेकआउट करें",
    "Complete Order": "ऑर्डर पूरा करें",
    "Place Order": "ऑर्डर दें",
    "Continue to Payment": "भुगतान जारी रखें",
    "Payment Confirmed!": "भुगतान की पुष्टि हुई!",
    "Payable Amount": "देय राशि",
    "View My Orders": "मेरे ऑर्डर देखें",
    "Order Details": "ऑर्डर विवरण",
    "Order Status": "ऑर्डर की स्थिति",
    "Track Order": "ऑर्डर ट्रैक करें",
    "Cancel Order": "ऑर्डर रद्द करें",
    "Loading items...": "आइटम लोड हो रहे हैं...",
    "Loading orders...": "ऑर्डर लोड हो रहे हैं...",
    "No orders found": "कोई ऑर्डर नहीं मिला",
    "Your cart is empty": "आपका कार्ट खाली है",
    "Clear Cart": "कार्ट खाली करें",
    "Apply": "लागू करें",
    "FREE": "मुफ़्त",
    "Sort: Featured First": "क्रम: विशेष पहले",
    "Sort: Price Low to High": "क्रम: कम कीमत पहले",
    "Sort: Price High to Low": "क्रम: अधिक कीमत पहले",
    "Sort: Alphabetical (A-Z)": "क्रम: वर्णमाला (A-Z)",
    "All Masterpieces": "सभी उत्पाद",
    "CURATED MASTER CATALOG": "चुना हुआ कैटलॉग",
    "Explore Catalog": "कैटलॉग देखें",
    "Add to Bag": "बैग में जोड़ें",
    "Add to Cart": "कार्ट में जोड़ें",
    "Buy Now": "अभी खरीदें",
    "Search products...": "उत्पाद खोजें...",
    "Search products": "उत्पाद खोजें",
    "All": "सभी",
    "Home": "होम",
    "Shop": "दुकान",
    "About": "हमारे बारे में",
    "About Us": "हमारे बारे में",
    "Contact": "संपर्क",
    "FAQ": "अक्सर पूछे जाने वाले सवाल",
    "Frequently Asked Questions": "अक्सर पूछे जाने वाले सवाल",
    "Privacy Policy": "गोपनीयता नीति",
    "Terms & Conditions": "नियम और शर्तें",
    "Terms and Conditions": "नियम और शर्तें",
    "Settings": "सेटिंग्स",
    "My Profile": "मेरी प्रोफ़ाइल",
    "Sign In": "साइन इन करें",
    "Sign In / Register": "साइन इन / रजिस्टर",
    "Login": "लॉगिन",
    "Register": "रजिस्टर करें",
    "Logout": "लॉग आउट",
    "Sign out": "साइन आउट",
    "Email Address": "ईमेल पता",
    "Password": "पासवर्ड",
    "Your Name": "आपका नाम",
    "Phone Number": "फ़ोन नंबर",
    "Address": "पता",
    "Save Profile": "प्रोफ़ाइल सहेजें",
    "Update Profile": "प्रोफ़ाइल अपडेट करें",
    "Update password": "पासवर्ड अपडेट करें",
    "Current password": "वर्तमान पासवर्ड",
    "New password": "नया पासवर्ड",
    "Confirm new password": "नया पासवर्ड दोबारा लिखें",
    "Forgot password?": "पासवर्ड भूल गए?",
    "Don't have an account?": "खाता नहीं है?",
    "Already have an account?": "पहले से खाता है?",
    "Save preferences": "प्राथमिकताएँ सहेजें",
    "Download preferences": "प्राथमिकताएँ डाउनलोड करें",
    "Clear saved preferences": "सहेजी प्राथमिकताएँ हटाएँ",
    "Account shortcuts": "खाते के लिंक",
    "Account & security": "खाता और सुरक्षा",
    "Notifications": "सूचनाएँ",
    "Order updates": "ऑर्डर अपडेट",
    "Atelier news and offers": "एटेलियर समाचार और ऑफ़र",
    "Reduce motion": "कम एनिमेशन",
    "Color theme": "रंग थीम",
    "Accent color": "मुख्य रंग",
    "Language": "भाषा",
    "Display currency": "कीमत की मुद्रा",
    "Dark": "डार्क",
    "Light": "लाइट",
    "Use site default": "वेबसाइट की डिफ़ॉल्ट थीम",
    "English": "अंग्रेज़ी",
    "Hindi": "हिंदी",
    "Indian rupee (INR)": "भारतीय रुपया (INR)",
    "US dollar (USD)": "अमेरिकी डॉलर (USD)",
    "Choose size": "साइज़ चुनें",
    "Choose color": "रंग चुनें",
    "Quantity": "मात्रा",
    "Description": "विवरण",
    "Reviews": "समीक्षाएँ",
    "Related Products": "संबंधित उत्पाद",
    "First Name": "पहला नाम",
    "Last Name": "उपनाम",
    "City": "शहर",
    "State": "राज्य",
    "Pincode": "पिन कोड",
    "PIN Code": "पिन कोड",
    "Payment Method": "भुगतान का तरीका",
    "Select Payment Method": "भुगतान का तरीका चुनें",
    "Cash on Delivery": "कैश ऑन डिलीवरी",
    "Order placed successfully!": "ऑर्डर सफलतापूर्वक दिया गया!",
    "No items found to checkout": "चेकआउट के लिए कोई आइटम नहीं मिला",
    "Please login to continue": "जारी रखने के लिए लॉगिन करें",
    "Back to Store": "दुकान पर वापस जाएँ",
    "Welcome Back": "वापसी पर स्वागत है",
    "Create Account": "खाता बनाएँ",
    "Your Cart": "आपका कार्ट",
    "Wishlist": "विशलिस्ट",
    "Saved Masterpieces": "पसंदीदा उत्पाद",
    "Remove": "हटाएँ",
    "Update": "अपडेट करें",
    "Save": "सहेजें",
    "Cancel": "रद्द करें",
    "Close": "बंद करें",
    "Search": "खोजें",
    "Filter": "फ़िल्टर",
    "Category": "श्रेणी",
    "Price": "कीमत",
    "Stock": "स्टॉक",
    "Status": "स्थिति",
    "Date": "तारीख",
    "Name": "नाम",
    "Email": "ईमेल",
    "Phone": "फ़ोन",
    "Free shipping on all orders": "सभी ऑर्डर पर मुफ़्त शिपिंग",
    "Your order has been verified and sent for dispatch.": "आपके ऑर्डर की पुष्टि हो गई है और उसे भेजने की तैयारी है।",
    "Prices are approximate USD display conversions. Payment is processed in INR.": "USD कीमत अनुमानित है। भुगतान INR में होगा।",
    "Display estimate only. The UPI request is charged in INR.": "यह केवल अनुमानित कीमत है। UPI भुगतान INR में होगा।"
    ,"Search creations...": "उत्पाद खोजें..."
    ,"PATHAAN ATELIER": "पठान एटेलियर"
    ,"Guest Connoisseur": "अतिथि ग्राहक"
    ,"Welcome to Atelier": "एटेलियर में आपका स्वागत है"
    ,"STORE NAVIGATION": "स्टोर नेविगेशन"
    ,"Shopping Bag": "शॉपिंग बैग"
    ,"Liked Items (Wishlist)": "पसंदीदा आइटम (विशलिस्ट)"
    ,"My Orders & Archive": "मेरे ऑर्डर और इतिहास"
    ,"ACCOUNT & CONCIERGE": "खाता और सहायता"
    ,"Client Dashboard": "ग्राहक डैशबोर्ड"
    ,"Atelier Heritage": "एटेलियर की विरासत"
    ,"Concierge FAQ": "सहायता के सवाल"
    ,"SIGN IN / REGISTER": "साइन इन / रजिस्टर"
    ,"Sign In / Register": "साइन इन / रजिस्टर"
    ,"Saved Masterpieces": "पसंदीदा उत्पाद"
    ,"Loading liked creations...": "पसंदीदा उत्पाद लोड हो रहे हैं..."
    ,"AUTUMN / WINTER 2026 COUTURE": "ऑटम / विंटर 2026 कलेक्शन"
    ,"Timeless Luxury, Handcrafted Elegance.": "बेमिसाल लक्ज़री, हाथों से गढ़ी शान।"
    ,"Discover our masterworks: double-faced cashmere wrap coats, pure mulberry silk gowns, and artisanal botanical elixirs crafted for discerning connoisseurs.": "हमारे खास उत्पाद देखें: कैशमियर कोट, शुद्ध मुलबेरी सिल्क के परिधान और वनस्पति से बने विशेष उत्पाद।"
    ,"EXPLORE CATALOG": "कैटलॉग देखें"
    ,"Sort: Featured First": "क्रम: विशेष पहले"
    ,"Sort: Price Low to High": "क्रम: कम कीमत पहले"
    ,"Sort: Price High to Low": "क्रम: अधिक कीमत पहले"
    ,"Sort: Alphabetical (A-Z)": "क्रम: वर्णमाला (A-Z)"
    ,"Curating collection...": "कलेक्शन लोड हो रहा है..."
    ,"COLLECTIONS": "कलेक्शन"
    ,"ATELIER SERVICES": "एटेलियर सेवाएँ"
    ,"THE PRIVÉ CIRCLE": "प्रिवे सर्कल"
    ,"Botanical Facial Oils": "वनस्पति फ़ेशियल ऑयल"
    ,"Velvet Lip Colors": "वेलवेट लिप कलर"
    ,"Mulberry Silk Slip Dresses": "मुलबेरी सिल्क ड्रेस"
    ,"Mongolian Cashmere Coats": "मंगोलियन कैशमियर कोट"
    ,"Delivery Status & Archive": "डिलीवरी स्थिति और इतिहास"
    ,"The Atelier Story & Heritage": "एटेलियर की कहानी और विरासत"
    ,"Concierge Support & FAQ": "ग्राहक सहायता और सवाल"
    ,"Join our private VIP salon for complimentary invitations, clean formulation previews, and 10% off your initial order.": "विशेष निमंत्रण, नए उत्पादों की जानकारी और पहले ऑर्डर पर 10% छूट के लिए हमारे VIP सर्कल से जुड़ें।"
    ," JOIN PRIVÉ CIRCLE": " VIP सर्कल से जुड़ें"
    ,"Privacy Policy": "गोपनीयता नीति"
    ,"Terms of Atelier": "एटेलियर की शर्तें"
    ,"About Pathaan Collection": "पठान कलेक्शन के बारे में"
    ,"Redefining Luxury, Craftsmanship, and Modern Streetwear": "लक्ज़री, कारीगरी और आधुनिक स्ट्रीटवियर की नई पहचान"
    ,"Our Story": "हमारी कहानी"
    ,"Founded with a passion for distinctive style and premium materials, Pathaan Collection brings together rich textile traditions with modern silhouettes. Each garment is engineered for maximum comfort, durability, and bold presence.": "अलग अंदाज़ और बेहतरीन कपड़ों के जुनून से बना पठान कलेक्शन, पारंपरिक कपड़ा-कला को आधुनिक डिज़ाइन से जोड़ता है। हर परिधान आराम, टिकाऊपन और खास पहचान के लिए बनाया गया है।"
    ,"Craftsmanship & Materials": "कारीगरी और सामग्री"
    ,"Every piece in our collection goes through rigorous quality control, utilizing heavy-weight combed cottons, tailored draping, and vibrant, non-fading dyes. Whether it's our signature oversized hoodies, luxury ethnic shirts, or statement accessories, we believe that true luxury lies in the details.": "हमारे हर उत्पाद की सख्त गुणवत्ता जाँच होती है। बेहतरीन कॉटन, सधी हुई सिलाई और न फीके पड़ने वाले रंग इस्तेमाल किए जाते हैं। हमारे लिए असली लक्ज़री हर बारीकी में है।"
    ,"Customer First Promise": "ग्राहक हमारी प्राथमिकता"
    ,"We are dedicated to providing seamless online shopping with pan-India fast shipping, 100% verified authentic merchandise, 256-bit secure checkout, and easy 7-day hassle-free returns.": "हम पूरे भारत में तेज़ डिलीवरी, प्रमाणित असली उत्पाद, सुरक्षित चेकआउट और आसान 7-दिन रिटर्न के साथ बेहतरीन खरीदारी अनुभव देने के लिए प्रतिबद्ध हैं।"
    ,"Everything you need to know about shopping with us": "हमारे साथ खरीदारी से जुड़ी ज़रूरी जानकारी"
    ,"How do I track my order?": "मैं अपना ऑर्डर कैसे ट्रैक करूँ?"
    ,"You can track all your past and ongoing orders by navigating to the My Orders page. You will see live delivery status updates and your unique 6-digit Delivery OTP.": "आप 'मेरे ऑर्डर' पेज पर अपने सभी पुराने और चालू ऑर्डर ट्रैक कर सकते हैं। वहाँ डिलीवरी की स्थिति और आपका 6 अंकों का OTP दिखेगा।"
    ,"What payment methods do you accept?": "आप कौन से भुगतान तरीके स्वीकार करते हैं?"
    ,"We accept all major payment methods including Instant UPI QR (Google Pay, PhonePe, Paytm), Credit & Debit cards, Net Banking, and Cash on Delivery (COD).": "हम UPI QR (Google Pay, PhonePe, Paytm), क्रेडिट/डेबिट कार्ड, नेट बैंकिंग और कैश ऑन डिलीवरी स्वीकार करते हैं।"
    ,"What is the Delivery OTP?": "डिलीवरी OTP क्या है?"
    ,"The Delivery OTP is a 6-digit security pin generated when your order is placed. Share this code with the delivery executive only when the package arrives safely at your doorstep.": "डिलीवरी OTP आपके ऑर्डर के साथ बनाया गया 6 अंकों का सुरक्षा कोड है। पैकेज मिलने पर ही यह कोड डिलीवरी कर्मचारी को दें।"
    ,"What if I need to change my delivery address?": "डिलीवरी पता बदलना हो तो क्या करें?"
    ,"You can update your delivery address directly from the My Orders page before your package is marked as Shipped.": "पैकेज भेजे जाने से पहले 'मेरे ऑर्डर' पेज से डिलीवरी पता अपडेट कर सकते हैं।"
    ,"How do I return or exchange an item?": "मैं आइटम वापस या एक्सचेंज कैसे करूँ?"
    ,"We offer an easy 7-day return policy. Items must be unwashed with tags attached. You can cancel or initiate return directly from the My Orders dashboard.": "हम आसान 7-दिन रिटर्न देते हैं। आइटम बिना धुला हो और टैग लगे हों। 'मेरे ऑर्डर' पेज से रद्द या रिटर्न शुरू करें।"
    ,"Privacy, Returns & Shipping Policy": "गोपनीयता, रिटर्न और शिपिंग नीति"
    ,"1. Privacy Policy": "1. गोपनीयता नीति"
    ,"Pathaan Collection respects your privacy. We collect your name, email, phone number, and delivery address exclusively for order processing, dispatch, delivery communication, and security verification. Your data is never sold to third parties and is encrypted via industry standard SSL.": "पठान कलेक्शन आपकी गोपनीयता का सम्मान करता है। हम नाम, ईमेल, फ़ोन और डिलीवरी पता केवल ऑर्डर प्रोसेस करने, डिलीवरी और सुरक्षा जाँच के लिए लेते हैं। आपका डेटा बेचा नहीं जाता और SSL से सुरक्षित रहता है।"
    ,"2. Shipping & Delivery Policy": "2. शिपिंग और डिलीवरी नीति"
    ,"Processing Time: Orders are processed and dispatched within 24 to 48 hours of confirmation.": "प्रोसेसिंग समय: पुष्टि के 24 से 48 घंटे में ऑर्डर भेजे जाते हैं।"
    ,"Estimated Delivery: Standard delivery takes 3 to 6 business days across India.": "अनुमानित डिलीवरी: भारत में सामान्य डिलीवरी में 3 से 6 कार्यदिवस लगते हैं।"
    ,"Shipping Charges: Free standard delivery is offered on all prepaid and eligible orders.": "शिपिंग शुल्क: सभी प्रीपेड और पात्र ऑर्डर पर सामान्य डिलीवरी मुफ़्त है।"
    ,"Delivery OTP: For your safety, every order generates a secure 6-digit OTP required upon delivery receipt.": "डिलीवरी OTP: सुरक्षा के लिए हर ऑर्डर में 6 अंकों का OTP बनता है, जो डिलीवरी लेते समय ज़रूरी है।"
    ,"3. 7-Day Hassle-Free Return & Refund Policy": "3. आसान 7-दिन रिटर्न और रिफंड नीति"
    ,"Eligibility: Products can be returned within 7 days of delivery provided they are unused, unwashed, with original tags intact.": "पात्रता: डिलीवरी के 7 दिनों के भीतर बिना इस्तेमाल, बिना धुले और मूल टैग सहित उत्पाद लौटाए जा सकते हैं।"
    ,"Refund Processing: Once received and inspected, refunds are initiated within 48 hours directly to the original payment source (or bank transfer for COD orders).": "रिफंड: उत्पाद मिलने और जाँच के बाद 48 घंटे में मूल भुगतान माध्यम पर रिफंड शुरू किया जाता है। COD ऑर्डर के लिए बैंक ट्रांसफर किया जाता है।"
    ,"Damaged / Wrong Item: If you receive a damaged or incorrect package, contact our support team within 48 hours with a photo for instant exchange or 100% refund.": "क्षतिग्रस्त/गलत आइटम: फोटो के साथ 48 घंटे के भीतर सहायता टीम से संपर्क करें—एक्सचेंज या पूरा रिफंड मिलेगा।"
    ,"4. Contact Support": "4. सहायता से संपर्क करें"
    ,"Have questions about your order or return? Reach out to our dedicated support team via email or our store contact section.": "ऑर्डर या रिटर्न पर सवाल हों तो ईमेल या स्टोर के संपर्क पेज से हमारी सहायता टीम से संपर्क करें।"
    ,"Terms of Service": "सेवा की शर्तें"
    ,"Standard Online Shopping Agreement": "ऑनलाइन खरीदारी के सामान्य नियम"
    ,"1. Overview": "1. सामान्य जानकारी"
    ,"By accessing or purchasing from Pathaan Collection, you agree to be bound by these terms. All products, descriptions, and prices are subject to change at our discretion without prior notice.": "पठान कलेक्शन का उपयोग या खरीदारी करके आप इन शर्तों से सहमत होते हैं। उत्पाद, विवरण और कीमतें बिना पूर्व सूचना बदली जा सकती हैं।"
    ,"2. Orders & Payments": "2. ऑर्डर और भुगतान"
    ,"We reserve the right to refuse or cancel any order for reasons including product unavailability, pricing errors, or suspicion of fraudulent activity. When selecting online payment methods, transactions are securely handled via 256-bit encrypted protocols.": "उत्पाद उपलब्ध न होने, कीमत की गलती या धोखाधड़ी के संदेह पर हम ऑर्डर रद्द कर सकते हैं। ऑनलाइन भुगतान 256-बिट एन्क्रिप्शन से सुरक्षित किया जाता है।"
    ,"3. Product Accuracy": "3. उत्पाद विवरण की सटीकता"
    ,"We strive to display product colors and textures as accurately as possible. However, actual colors may slightly vary depending on screen display resolutions and natural textile lighting.": "हम उत्पाद के रंग और बनावट सही दिखाने का प्रयास करते हैं। स्क्रीन और रोशनी के कारण वास्तविक रंग थोड़ा अलग हो सकता है।"
    ,"4. Governing Law": "4. लागू कानून"
    ,"These terms and conditions are governed by and construed in accordance with the applicable laws of India.": "ये शर्तें भारत के लागू कानूनों के अनुसार नियंत्रित और समझी जाएँगी।"
    ,"Secure Checkout": "सुरक्षित चेकआउट"
    ,"1. Delivery Details": "1. डिलीवरी विवरण"
    ,"Full Name *": "पूरा नाम *"
    ,"Full Street Address, House / Flat No. *": "पूरा पता, मकान / फ्लैट नंबर *"
    ,"Autofill via Live GPS (Optional)": "GPS से पता भरें (वैकल्पिक)"
    ,"2. Payment Method": "2. भुगतान का तरीका"
    ,"UPI / QR Code Instant (GPay, PhonePe, Paytm)": "तुरंत UPI / QR कोड (GPay, PhonePe, Paytm)"
    ,"Fastest delivery, zero extra fees": "तेज़ डिलीवरी, कोई अतिरिक्त शुल्क नहीं"
    ,"Credit / Debit Card / Net Banking": "क्रेडिट / डेबिट कार्ड / नेट बैंकिंग"
    ,"All major Indian & International banks": "भारत और अंतरराष्ट्रीय बैंक स्वीकार हैं"
    ,"Cash on Delivery (COD)": "कैश ऑन डिलीवरी (COD)"
    ,"Pay with cash or UPI at delivery doorstep": "डिलीवरी पर नकद या UPI से भुगतान करें"
    ,"256-Bit SSL Encrypted": "256-बिट SSL एन्क्रिप्टेड"
    ,"100% Genuine": "100% असली"
    ,"Pathaan Collection Gateway": "पठान कलेक्शन भुगतान"
    ,"Instant 256-Bit Encrypted Payment": "तुरंत 256-बिट एन्क्रिप्टेड भुगतान"
    ,"UPI / QR Code": "UPI / QR कोड"
    ,"Card / NetBanking": "कार्ड / नेट बैंकिंग"
    ,"Scan via Google Pay, PhonePe, Paytm, or BHIM": "Google Pay, PhonePe, Paytm या BHIM से स्कैन करें"
    ,"UPI Transaction ID / UTR (Optional)": "UPI ट्रांज़ैक्शन ID / UTR (वैकल्पिक)"
    ,"I Have Sent Payment": "मैंने भुगतान कर दिया है"
    ,"Create Account": "खाता बनाएँ"
    ,"Join Pathaan Collection today 🔥": "आज ही पठान कलेक्शन से जुड़ें 🔥"
    ,"Log in to manage your orders & cart": "अपने ऑर्डर और कार्ट देखने के लिए लॉगिन करें"
    ,"Executive Overview": "एग्ज़ीक्यूटिव ओवरव्यू"
    ,"Orders & Fulfillment": "ऑर्डर और डिलीवरी"
    ,"Beauty & Fashion Catalog": "फैशन और उत्पाद कैटलॉग"
    ,"Private Clients (VIP)": "विशेष ग्राहक (VIP)"
    ,"Atelier & Database Sync": "एटेलियर और डेटाबेस सिंक"
    ,"Live Performance Overview": "लाइव प्रदर्शन सारांश"
    ,"Gross Sales Volume": "कुल बिक्री"
    ,"Orders in Pipeline": "प्रक्रिया में ऑर्डर"
    ,"Average Order Value": "औसत ऑर्डर राशि"
    ,"Active Catalog SKUs": "कैटलॉग में सक्रिय उत्पाद"
    ,"Latest Store Orders": "नवीनतम ऑर्डर"
    ,"Real-time transactions from customers": "ग्राहकों के हाल के लेन-देन"
    ,"Bestseller Inventory": "सबसे ज़्यादा बिकने वाले उत्पाद"
    ,"No recent store transactions.": "हाल में कोई ऑर्डर नहीं।"
    ,"No inventory SKUs registered yet.": "अभी कोई उत्पाद दर्ज नहीं है।"
    ,"Manage your account, delivery, and shopping preferences.": "अपने खाते, डिलीवरी और खरीदारी की प्राथमिकताएँ प्रबंधित करें।"
    ,"Choose your preferred language for the store.": "दुकान के लिए अपनी पसंदीदा भाषा चुनें।"
    ,"Currency": "मुद्रा"
    ,"Product prices are stored in INR. USD is an approximate display conversion; checkout remains in INR.": "उत्पाद की मूल कीमत INR में रहती है। USD केवल अनुमानित प्रदर्शन रूपांतरण है; भुगतान INR में होगा।"
    ,"INR (₹)": "INR (₹)"
    ,"USD ($)": "USD ($)"
    ,"Save language": "भाषा सहेजें"
    ,"Save currency": "मुद्रा सहेजें"
    ,"Offers & Promotions": "ऑफ़र और प्रचार"
    ,"Product news, promotions, and special offers.": "उत्पाद समाचार, प्रचार और विशेष ऑफ़र।"
    ,"Choose which updates you want to receive.": "चुनें कि आप कौन से अपडेट पाना चाहते हैं।"
    ,"Save notification preferences": "सूचना प्राथमिकताएँ सहेजें"
    ,"Delivery Address": "डिलीवरी पता"
    ,"Add and manage the addresses saved to your account.": "अपने खाते में सहेजे पते जोड़ें और प्रबंधित करें।"
    ,"Add Address": "पता जोड़ें"
    ,"Address label": "पते का नाम"
    ,"Work": "कार्यस्थल"
    ,"Other": "अन्य"
    ,"Full name": "पूरा नाम"
    ,"Phone": "फ़ोन"
    ,"Street address": "सड़क का पता"
    ,"PIN code": "पिन कोड"
    ,"Set as default address": "डिफ़ॉल्ट पता बनाएँ"
    ,"Save Address": "पता सहेजें"
    ,"Update Address": "पता अपडेट करें"
    ,"Edit": "बदलें"
    ,"Delete": "हटाएँ"
    ,"Preference for updates about your orders.": "अपने ऑर्डर के अपडेट पाने की प्राथमिकता।"
    ,"You are not signed in.": "आपने साइन इन नहीं किया है।"
    ,"to manage your account security.": "खाते की सुरक्षा प्रबंधित करने के लिए।"
    ,"Sign in": "साइन इन करें"
    ,"Signed in as": "साइन इन हैं:"
    ,"Name, phone, address, city, state, and pincode are required": "नाम, फ़ोन, पता, शहर, राज्य और पिन कोड आवश्यक हैं।"
    ,"Delivery address added": "डिलीवरी पता जोड़ा गया।"
    ,"Delivery address updated": "डिलीवरी पता अपडेट हुआ।"
    ,"Delivery address deleted": "डिलीवरी पता हटाया गया।"
    ,"Default delivery address updated": "डिफ़ॉल्ट डिलीवरी पता अपडेट हुआ।"
    ,"Default": "डिफ़ॉल्ट"
    ,"Set Default": "डिफ़ॉल्ट बनाएँ"
    ,"No saved addresses yet.": "अभी कोई पता सहेजा नहीं गया है।"
    ,"Sign in to manage delivery addresses.": "डिलीवरी पते प्रबंधित करने के लिए साइन इन करें।"
    ,"Appearance": "दिखावट"
    ,"Choose the look that works best for you.": "अपनी पसंद की थीम चुनें।"
    ,"Theme": "थीम"
    ,"Light Mode": "लाइट मोड"
    ,"Dark Mode": "डार्क मोड"
    ,"Save appearance": "दिखावट सहेजें"
    ,"Help & Support": "सहायता और समर्थन"
    ,"Contact Support": "सहायता से संपर्क करें"
    ,"Legal": "कानूनी जानकारी"
    ,"Terms & Conditions": "नियम और शर्तें"
    ,"Return & Refund Policy": "रिटर्न और रिफंड नीति"
    ,"Manage your password and sign-in session.": "अपना पासवर्ड और साइन-इन सत्र प्रबंधित करें।"
    ,"Sign in to save notification preferences to your account.": "सूचना प्राथमिकताएँ खाते में सहेजने के लिए साइन इन करें।"
};
const translatedTextNodes = new Set();
const originalTextByNode = new WeakMap();
const originalAttributesByElement = new WeakMap();
let activeSiteLanguage = "en";

function translateTextNode(node) {
    const original = originalTextByNode.get(node) ?? node.nodeValue;
    if (typeof original !== "string" || !original.trim()) return;
    originalTextByNode.set(node, original);
    translatedTextNodes.add(node);
    const leading = original.match(/^\s*/)[0];
    const trailing = original.match(/\s*$/)[0];
    const text = original.trim();
    const translation = activeSiteLanguage === "hi" ? siteTranslations[text] : null;
    const result = translation ? `${leading}${translation}${trailing}` : original;
    if (node.nodeValue !== result) node.nodeValue = result;
}

function translateElementAttributes(element) {
    const attributes = ["placeholder", "title", "aria-label", "alt"];
    let originals = originalAttributesByElement.get(element);
    if (!originals) {
        originals = new Map();
        originalAttributesByElement.set(element, originals);
    }

    for (const attribute of attributes) {
        if (!element.hasAttribute(attribute) && !originals.has(attribute)) continue;
        if (!originals.has(attribute)) originals.set(attribute, element.getAttribute(attribute) || "");
        const original = originals.get(attribute);
        const translated = activeSiteLanguage === "hi" ? siteTranslations[original] : null;
        const value = translated || original;
        if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
    }
}

function translateSubtree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root);
        return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        if (node.parentElement && !node.parentElement.closest("script,style,noscript,textarea")) {
            translateTextNode(node);
        }
    }
    if (root.querySelectorAll) root.querySelectorAll("*").forEach(translateElementAttributes);
}

function applySitePreferences() {
    const preferences = getSitePreferences();
    activeSiteLanguage = preferences.language;
    document.documentElement.dataset.theme = "dark";
    document.documentElement.lang = preferences.language;
    const palette = {
        "--site-accent": "#c7a46a",
        "--gold": "#a98245",
        "--gold-warm": "#a98245",
        "--gold-hover": "#d8bd8a",
        "--gold-primary": "#d8b576",
        "--gold-light": "#ead6aa",
        "--gold-dark": "#8f6c37",
        "--gold-gradient": "linear-gradient(135deg, #e5cc91 0%, #c7a46a 52%, #9a733d 100%)",
        "--gold-btn-gradient": "linear-gradient(135deg, #d8bd8a 0%, #c7a46a 58%, #a98245 100%)",
        "--border-gold": "rgba(199,164,106,.35)",
        "--primary": "#926d38",
        "--secondary": "#d8b576",
        "--cyan": "#d8b576",
        "--dark": "#11100e",
        "--dark2": "#191714",
        "--dark3": "#24211c",
        "--background": "#0d0d0f",
        "--surface": "#191714",
        "--surface-2": "#24211c",
        "--text": "#f4efe5",
        "--gray": "#b9b09f"
    };
    for (const [property, value] of Object.entries(palette)) {
        document.documentElement.style.setProperty(property, value);
    }

    translateSubtree(document.body);
    for (const node of translatedTextNodes) translateTextNode(node);
}

function saveSitePreferences(preferences) {
    const current = getSitePreferences();
    const next = {
        language: ["en", "hi"].includes(preferences.language) ? preferences.language : current.language,
        currency: ["INR", "USD"].includes(preferences.currency) ? preferences.currency : current.currency
    };
    const saved = JSON.parse(localStorage.getItem("pathaanSettings") || "{}");
    delete saved.theme;
    delete saved.accent;
    localStorage.setItem("pathaanSettings", JSON.stringify({ ...saved, ...next }));
    applySitePreferences();
    return next;
}

async function loadAccountPreferences() {
    if (!getToken()) return;
    try {
        const response = await fetch(API_BASE + "/api/profile/preferences", { headers: getAuthHeader() });
        if (response.status === 401) return;
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.msg || `Preferences request failed (${response.status})`);
        saveSitePreferences({ language: result.language, currency: result.currency });
        window.dispatchEvent(new CustomEvent("sitepreferencesloaded", { detail: getSitePreferences() }));
    } catch (error) {
        console.error("Could not load account language and currency preferences:", error);
    }
}

function applyTranslationToAddedContent() {
    translateSubtree(document.body);
}

function initializeSitePreferences() {
    applySitePreferences();
    new MutationObserver(records => {
        for (const record of records) {
            if (record.type === "childList") record.addedNodes.forEach(applyTranslationToAddedContent);
            else if (record.type === "characterData") translateTextNode(record.target);
        }
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
    loadAccountPreferences();
}

if (document.body) {
    initializeSitePreferences();
} else {
    document.addEventListener("DOMContentLoaded", initializeSitePreferences, { once: true });
}
window.addEventListener("storage", event => {
    if (event.key === "pathaanSettings") applySitePreferences();
});
window.applySitePreferences = applySitePreferences;
window.saveSitePreferences = saveSitePreferences;
window.loadAccountPreferences = loadAccountPreferences;

function getToken() {
    return localStorage.getItem("token") || "";
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    return localStorage.getItem("isAdmin") === "true";
}

function getAuthHeader() {
    const token = getToken();
    return {
        "token": token,
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

function requireLogin(redirectUrl) {
    if (!isLoggedIn()) {
        const next = redirectUrl || window.location.pathname;
        if (typeof showToast === "function") {
            showToast("Please login to continue", "error");
        }
        setTimeout(() => {
            window.location.href = `/login?redirect=${encodeURIComponent(next)}`;
        }, 600);
        return false;
    }
    return true;
}

function saveAuthSession(token, user = {}) {
    if (token) localStorage.setItem("token", token);
    if (user.language || user.currency) {
        saveSitePreferences({ language: user.language, currency: user.currency });
    }
    if (user.isAdmin !== undefined) localStorage.setItem("isAdmin", String(user.isAdmin));
    if (user.email) localStorage.setItem("userEmail", user.email);
    if (user.name) localStorage.setItem("userName", user.name);
    if (user.phone) localStorage.setItem("userPhone", user.phone);
    if (user.address) localStorage.setItem("userAddress", user.address);
    if (user.profileImage) localStorage.setItem("userAvatar", user.profileImage);
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userAddress");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("buyNowItem");
    localStorage.removeItem("checkoutCart");
    if (typeof showToast === "function") {
        showToast("Logged out successfully", "success");
    }
    setTimeout(() => {
        window.location.href = "/login";
    }, 500);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, s => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[s]));
}

function formatPrice(amount) {
    const parsedAmount = Number(amount);
    const amountInInr = Number.isFinite(parsedAmount) ? parsedAmount : 0;
    const currency = getSitePreferences().currency;
    const displayAmount = currency === "USD" ? amountInInr / 83 : amountInInr;
    return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: currency === "USD" ? 2 : 0,
        maximumFractionDigits: 2
    }).format(displayAmount);
}

function getProductImageUrl(img) {
    if (!img) return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    const cleanPath = img.startsWith("/") ? img : "/" + img;
    return API_BASE + cleanPath;
}