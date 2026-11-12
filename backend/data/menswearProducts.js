const imageUrl = photoId =>
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`;

const categories = [
    {
        category: "Jackets",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Black", "Olive", "Navy", "Brown"],
        images: [
            "photo-1591047139829-d91aecb6caea",
            "photo-1551028719-00167b16eac5",
            "photo-1544923246-77307dd654cb",
            "photo-1591047139829-d91aecb6caea"
        ],
        products: [
            {
                _id: "660000000000000000000101",
                name: "Pathaan Signature Leather Bomber Jacket",
                price: 3499,
                originalPrice: 4999,
                description: "Premium handcrafted faux leather bomber jacket with thermal-insulated lining and custom metal zipper pulls.",
                images: [imageUrl("photo-1591047139829-d91aecb6caea")],
                stock: 45,
                colors: ["Black", "Dark Brown"],
                rating: 4.9,
                reviewsCount: 128,
                featured: true
            },
            ["Classic Cotton Utility Jacket", 2899, "Garment-washed cotton, practical flap pockets, and an adjustable waist."],
            ["Quilted Weekend Jacket", 3299, "Lightweight quilted lining and a neat stand collar for cool-weather layering."],
            ["Minimal Harrington Jacket", 2599, "A clean zip-front profile with ribbed trims and a smooth inner lining."],
            ["Water-Resistant City Jacket", 3199, "A lightweight water-resistant shell with a hood that packs away neatly."],
            ["Suede-Touch Trucker Jacket", 3799, "A soft suede-touch finish with classic chest pockets and metal buttons."],
            ["Relaxed Denim Jacket", 2499, "Mid-weight denim, a relaxed shape, and durable contrast stitching."],
            ["Rib-Collar Varsity Jacket", 2999, "A comfortable everyday layer finished with striped rib-knit cuffs and collar."],
            ["Lightweight Coach Jacket", 1999, "A snap-button front and easy relaxed fit for versatile everyday wear."],
            ["Textured Zip-Through Jacket", 2799, "Subtle woven texture and a smooth zip front deliver an elevated casual layer."]
        ]
    },
    {
        category: "T-Shirts",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["White", "Black", "Charcoal", "Sage"],
        images: [
            "photo-1521572163474-6864f9cf17ab",
            "photo-1503341504253-dff4815485f1",
            "photo-1523398002811-999ca8dec234",
            "photo-1503342217505-b0a15ec3261c"
        ],
        products: [
            {
                _id: "660000000000000000000102",
                name: "Vintage Oversized Washed Graphic Tee",
                price: 999,
                originalPrice: 1499,
                description: "Heavyweight 240 GSM pure cotton tee with vintage acid wash aesthetic and screen-printed graphics.",
                images: [imageUrl("photo-1521572163474-6864f9cf17ab")],
                stock: 80,
                colors: ["Faded Charcoal", "White", "Sage Green"],
                rating: 4.8,
                reviewsCount: 94,
                featured: true
            },
            ["Pathaan Heavyweight Crew T-Shirt", 899, "Soft heavyweight cotton jersey with a structured crew neck and clean finish."],
            ["Everyday Essential Cotton Tee", 699, "Breathable combed cotton and a comfortable regular fit for daily wear."],
            ["Relaxed Drop-Shoulder T-Shirt", 1099, "A contemporary roomy cut with dropped shoulders and a substantial feel."],
            ["Minimal Chest-Logo T-Shirt", 799, "A small tonal chest mark keeps this smooth cotton tee understated."],
            ["Classic Striped Cotton T-Shirt", 999, "Yarn-dyed stripes and soft cotton jersey create an easy weekend staple."],
            ["Longline Everyday T-Shirt", 899, "A slightly longer hem and soft stretch cotton give this tee an easy drape."],
            ["Ribbed Cotton Henley T-Shirt", 1199, "Textured rib-knit cotton and a three-button placket add a refined detail."],
            ["Vintage Print Graphic T-Shirt", 1099, "A soft-washed cotton tee with an original vintage-inspired front graphic."],
            ["Performance Quick-Dry T-Shirt", 1299, "Lightweight moisture-wicking fabric keeps active days comfortable."]
        ]
    },
    {
        category: "Pants",
        sizes: ["30", "32", "34", "36", "38"],
        colors: ["Black", "Olive", "Navy", "Beige"],
        images: [
            "photo-1473966968600-fa801b869a1a",
            "photo-1517438476312-10d79c077509",
            "photo-1515886657613-9f3515b0c78f",
            "photo-1541099649105-f69ad21f3246"
        ],
        products: [
            {
                _id: "660000000000000000000103",
                name: "Urban Tactical Multi-Pocket Cargo Pants",
                price: 2199,
                originalPrice: 2999,
                description: "Durable ripstop cotton fabric with 6 deep utility pockets, adjustable ankle cuffs, and relaxed street fit.",
                images: [imageUrl("photo-1473966968600-fa801b869a1a")],
                stock: 35,
                colors: ["Olive Green", "Tactical Black", "Beige"],
                rating: 4.7,
                reviewsCount: 76,
                featured: true
            },
            ["Tailored Slim-Fit Chinos", 1799, "Stretch cotton twill and a neat tapered leg make these chinos easy to dress up."],
            ["Relaxed Everyday Cotton Trousers", 1899, "A soft cotton blend, straight leg, and flexible waistband for all-day comfort."],
            ["Pleated Modern Formal Trousers", 2499, "A refined front pleat and smooth suiting fabric create a polished silhouette."],
            ["Lightweight Linen-Blend Pants", 1999, "Breathable linen-blend fabric and a relaxed cut suit warmer days."],
            ["Tapered Stretch Chinos", 1899, "Comfort stretch twill with a tapered ankle and clean, versatile styling."],
            ["Easy-Wear Drawstring Trousers", 1599, "A soft woven fabric and adjustable drawstring waist keep off-duty dressing simple."],
            ["Straight-Leg Workwear Pants", 2199, "Durable cotton canvas, reinforced seams, and roomy utility pockets."],
            ["Textured Smart-Casual Trousers", 2299, "Subtle textured fabric and a clean front move easily from desk to dinner."],
            ["Relaxed Weekend Cargo Pants", 2099, "A relaxed fit with practical pockets and an adjustable hem for everyday use."]
        ]
    },
    {
        category: "Ethnic",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Midnight Blue", "Ivory", "Emerald", "Black"],
        images: [
            "photo-1617137968427-85924c800a22",
            "photo-1610030469983-98e550d6193c",
            "photo-1617137968427-85924c800a22",
            "photo-1596755094514-f87e34085b2c"
        ],
        products: [
            {
                _id: "660000000000000000000104",
                name: "Midnight Royal Velvet Kurta Set",
                price: 2799,
                originalPrice: 3999,
                description: "Rich micro-velvet tailored kurta with mandarin collar and intricate golden thread embroidery.",
                images: [imageUrl("photo-1617137968427-85924c800a22")],
                stock: 20,
                colors: ["Midnight Blue", "Emerald Green", "Jet Black"],
                rating: 4.9,
                reviewsCount: 62,
                featured: true
            },
            ["Classic Cotton Kurta", 1499, "A breathable cotton kurta with a clean band collar and understated button placket."],
            ["Textured Festive Kurta", 2299, "A soft textured weave and refined detailing make this an easy occasion choice."],
            ["Embroidered Celebration Kurta", 2599, "Fine tonal embroidery adds a considered finish to this festive-ready kurta."],
            ["Linen-Blend Summer Kurta", 1899, "Airy linen-blend fabric and a relaxed silhouette keep warm-weather dressing easy."],
            ["Printed Everyday Kurta", 1699, "A subtle all-over print and lightweight cotton feel work for everyday occasions."],
            ["Straight-Fit Occasion Kurta", 2199, "A crisp straight fit and neat mandarin collar create a timeless occasion look."],
            ["Festive Kurta with Jacket Set", 3499, "A coordinated kurta and lightweight jacket set for a complete celebration look."],
            ["Minimal Band-Collar Kurta", 1599, "A clean, minimal profile in soft cotton with a comfortable straight cut."],
            ["Royal Jacquard Kurta", 2899, "A subtle jacquard weave and tailored details bring quiet polish to special events."]
        ]
    },
    {
        category: "Shirts",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["White", "Sky Blue", "Navy", "Olive"],
        images: [
            "photo-1598033129183-c4f50c736f10",
            "photo-1596755094514-f87e34085b2c",
            "photo-1603252109303-2751441dd157",
            "photo-1598033129183-c4f50c736f10"
        ],
        products: [
            ["Tailored Oxford Button-Down Shirt", 1799, "Durable Oxford cotton and a button-down collar deliver a sharp everyday staple."],
            ["Breathable Linen-Blend Shirt", 1999, "A lightweight linen blend with a relaxed drape for effortless warm-weather style."],
            ["Slim-Fit Poplin Dress Shirt", 1899, "Smooth cotton poplin and a clean slim fit make this an easy formal essential."],
            ["Classic Checked Twill Shirt", 1699, "Soft brushed twill and a timeless check pattern work well layered or on their own."],
            ["Grandad-Collar Cotton Shirt", 1599, "A crisp collarless design and breathable cotton bring a modern casual finish."],
            ["Striped Resort-Collar Shirt", 1799, "Lightweight woven cotton and a relaxed resort collar bring an easy holiday feel."],
            ["Brushed Flannel Check Shirt", 1899, "Warm brushed cotton flannel with a comfortable fit for cool-weather layering."],
            ["Textured Cuban-Collar Shirt", 1699, "A softly textured weave and open collar make this a versatile summer shirt."],
            ["Essential Formal Cotton Shirt", 1999, "A smooth cotton finish, structured collar, and tailored cut for occasion dressing."],
            ["Chambray Button-Down Shirt", 1799, "Soft chambray texture and classic buttons make this a dependable casual layer."]
        ]
    },
    {
        category: "Jeans",
        sizes: ["30", "32", "34", "36", "38"],
        colors: ["Indigo", "Washed Black", "Light Blue", "Dark Blue"],
        images: [
            "photo-1542272604-787c3835535d",
            "photo-1542272454315-4c01d7abdf4a",
            "photo-1541099649105-f69ad21f3246",
            "photo-1515886657613-9f3515b0c78f"
        ],
        products: [
            ["Classic Straight-Fit Indigo Jeans", 1999, "Mid-wash denim and a timeless straight leg deliver an easy everyday fit."],
            ["Slim-Fit Stretch Denim Jeans", 2199, "Comfort-stretch denim follows a clean slim line without restricting movement."],
            ["Relaxed Tapered Blue Jeans", 2299, "A relaxed top block narrows gently at the ankle for a modern silhouette."],
            ["Washed-Black Everyday Jeans", 2099, "Soft washed-black denim and versatile styling make these a wardrobe staple."],
            ["Light-Wash Weekend Jeans", 1999, "An easy light wash and comfortable straight fit bring a laid-back finish."],
            ["Dark Indigo Regular-Fit Jeans", 2199, "Deep indigo denim, clean stitching, and a dependable regular fit."],
            ["Vintage Fade Denim Jeans", 2399, "Subtle vintage fading gives this durable cotton denim a lived-in look."],
            ["Utility Pocket Denim Jeans", 2499, "Classic denim with practical utility pockets and reinforced construction."],
            ["Comfort Waist Straight Jeans", 2299, "Soft stretch denim and a flexible waistband keep long days comfortable."],
            ["Raw-Edge Relaxed Denim Jeans", 2599, "A relaxed cut and subtle raw-edge details give these jeans a modern character."]
        ]
    },
    {
        category: "Shoes",
        sizes: ["7", "8", "9", "10", "11"],
        colors: ["White", "Black", "Navy", "Tan"],
        images: [
            "photo-1542291026-7eec264c27ff",
            "photo-1543163521-1bf539c55dd2",
            "photo-1608231387042-66d1773070a5",
            "photo-1460353581641-37baddab0fa2"
        ],
        products: [
            ["Everyday Low-Top Sneakers", 2499, "A cushioned footbed and versatile low-top profile make these easy daily sneakers."],
            ["Classic White Court Sneakers", 2799, "Clean court-inspired styling with a supportive sole and smooth upper."],
            ["Lightweight Knit Running Shoes", 3299, "A breathable knit upper and responsive cushioning for active everyday wear."],
            ["Minimal Leather-Look Trainers", 2999, "A clean, understated trainer with a comfortable lining and durable outsole."],
            ["Urban High-Top Sneakers", 3199, "A supportive high-top shape and padded collar bring extra everyday comfort."],
            ["Casual Canvas Lace-Up Shoes", 1799, "Lightweight canvas and a flexible sole make these a relaxed warm-weather choice."],
            ["Weekend Slip-On Sneakers", 1999, "An easy slip-on design with a cushioned insole for convenient everyday wear."],
            ["Classic Suede-Touch Loafers", 2899, "A refined loafer profile with a soft suede-touch upper for smart-casual outfits."],
            ["Comfort Walking Sneakers", 2699, "A supportive cushioned sole and breathable upper are made for long walks."],
            ["Textured Everyday Trainers", 2399, "A subtle textured upper and grippy sole add function to a clean trainer shape."]
        ]
    },
    {
        category: "Accessories",
        sizes: ["One Size"],
        colors: ["Black", "Brown", "Silver", "Navy"],
        images: [
            "photo-1524805444758-089113d48a6d",
            "photo-1524805444758-089113d48a6d",
            "photo-1524592094714-0f0654e20314",
            "photo-1524592094714-0f0654e20314"
        ],
        products: [
            ["Minimal Dial Everyday Watch", 3499, "A clean minimal dial, comfortable strap, and versatile everyday proportions."],
            ["Classic Reversible Leather Belt", 1299, "A polished buckle and reversible finish make this belt easy to style."],
            ["Slim Genuine-Leather Card Holder", 999, "A compact profile with neatly arranged slots for everyday essentials."],
            ["Textured Formal Tie", 899, "A refined woven texture and versatile width for work and occasion dressing."],
            ["Polarized Wayfarer Sunglasses", 1499, "Classic wayfarer-inspired frames with polarized lenses for bright days."],
            ["Everyday Cotton Baseball Cap", 699, "Breathable cotton twill with an adjustable back strap for an easy fit."],
            ["Premium Ribbed Cotton Socks Set", 499, "Soft combed cotton with a comfortable ribbed cuff in everyday colors."],
            ["Compact Canvas Crossbody Bag", 1799, "A durable canvas finish and adjustable strap keep daily carry practical."],
            ["Woven Reversible Casual Belt", 999, "A comfortable woven design with an adjustable fit for casual outfits."],
            ["Structured Everyday Wallet", 1199, "A slim-fold profile with practical card storage and a neat finish."]
        ]
    }
];

let nextProductNumber = 105;

const menswearProducts = categories.flatMap(({ category, sizes, colors, images, products }) =>
    products.map((entry, index) => {
        if (!Array.isArray(entry)) {
            return {
                id: entry._id,
                category,
                sizes,
                inStock: true,
                createdAt: new Date(Date.UTC(2026, 10, 6, 12, 0, index)).toISOString(),
                ...entry
            };
        }

        const [name, price, description] = entry;
        const _id = `660000000000000000000${String(nextProductNumber++).padStart(3, "0")}`;
        const product = {
            _id,
            id: _id,
            name,
            price,
            originalPrice: Math.round(price * 1.35),
            category,
            description,
            images: [imageUrl(images[index % images.length])],
            stock: 20 + (index * 3) % 46,
            inStock: true,
            sizes,
            colors: [colors[index % colors.length], colors[(index + 1) % colors.length]],
            rating: 4.7 + (index % 3) / 10,
            reviewsCount: 24 + index * 7,
            featured: index < 2,
            createdAt: new Date(Date.UTC(2026, 10, 6, 12, 0, index)).toISOString()
        };
        return product;
    })
);

module.exports = menswearProducts;
