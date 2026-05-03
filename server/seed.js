// Seed canonical demo data into Neon — idempotent.
// Mirrors DEMO_HOTEL_DIRECTORY and DEMO_RESTAURANTS from the client so the demo
// owner accounts (grand@/aspen@/skyline@/coral@liora.demo) keep their stable IDs.
import { q, q1 } from './db.js';

const DEMO_HOTELS = [
  {
    ownerId: 'demo_owner_grand', email: 'grand@liora.demo', ownerName: 'Mr. Alaric',
    name: 'Liora Grand Resort',
    description: 'A flagship overwater resort on the Indian Ocean — private villas, infinity pools and Michelin-grade cuisine just steps from the lagoon.',
    address: 'Maafushivaru Atoll, North Malé', city: 'Malé', country: 'Maldives',
    latitude: 4.1755, longitude: 73.5093, starRating: 5,
    amenities: ['wifi','pool','spa','gym','restaurant','bar','concierge','beach','airport_shuttle'],
    heroImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&q=85',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=85',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=85',
    ],
    brandColor: '#0ea5e9', phone: '+960 400 7700',
  },
  {
    ownerId: 'demo_owner_aspen', email: 'aspen@liora.demo', ownerName: 'Ms. Helena',
    name: 'Aspen Pines Lodge',
    description: 'A timber-and-stone alpine lodge in the Rockies — fireside lounges, ski-in/ski-out access and a heated outdoor pool under the stars.',
    address: '3120 Maroon Creek Road', city: 'Aspen', country: 'United States',
    latitude: 39.1911, longitude: -106.8175, starRating: 5,
    amenities: ['wifi','parking','pool','spa','gym','restaurant','bar','concierge','pet_friendly'],
    heroImageUrl: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=1200&q=85',
      'https://images.unsplash.com/photo-1502780402662-acc01917738e?w=1200&q=85',
      'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=1200&q=85',
    ],
    brandColor: '#0f766e', phone: '+1 970 925 1100',
  },
  {
    ownerId: 'demo_owner_skyline', email: 'skyline@liora.demo', ownerName: 'Mr. Carter',
    name: 'Manhattan Skyline Hotel',
    description: 'A 42-story art-deco landmark in midtown Manhattan — rooftop bar, private screening room and unobstructed Central Park views.',
    address: '550 Madison Avenue', city: 'New York', country: 'United States',
    latitude: 40.7616, longitude: -73.9737, starRating: 5,
    amenities: ['wifi','parking','gym','restaurant','bar','concierge','laundry'],
    heroImageUrl: 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=85',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85',
      'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=1200&q=85',
    ],
    brandColor: '#1e293b', phone: '+1 212 555 0142',
  },
  {
    ownerId: 'demo_owner_coral', email: 'coral@liora.demo', ownerName: 'Ms. Liana',
    name: 'Coral Bay Boutique',
    description: 'A 14-suite boutique hideaway on a private cove in Bali — open-air pavilions, beach bonfire dinners and a cliffside spa.',
    address: 'Jl. Pantai Bingin, Pecatu', city: 'Bali', country: 'Indonesia',
    latitude: -8.8067, longitude: 115.1039, starRating: 4,
    amenities: ['wifi','pool','spa','restaurant','bar','concierge','beach','pet_friendly'],
    heroImageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=85',
      'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=1200&q=85',
      'https://images.unsplash.com/photo-1505881502353-a1986add3762?w=1200&q=85',
    ],
    brandColor: '#f97316', phone: '+62 361 7472 100',
  },
];

const DEMO_ROOMS = [
  { name: 'Garden Suite',     type: 'suite',     description: 'Spacious suite overlooking the garden', pricePerNightCents: 38000,  capacityAdults: 2, capacityChildren: 2, totalUnits: 4,  amenities: ['King bed','Balcony','Bathtub'] },
  { name: 'Ocean Deluxe',     type: 'deluxe',    description: 'Panoramic ocean view',                   pricePerNightCents: 48000,  capacityAdults: 2, capacityChildren: 1, totalUnits: 6,  amenities: ['King bed','Sea view','Mini bar'] },
  { name: 'Penthouse Liora',  type: 'penthouse', description: 'Top-floor penthouse with private terrace', pricePerNightCents: 148000, capacityAdults: 4, capacityChildren: 2, totalUnits: 1, amenities: ['Terrace','Jacuzzi','Butler service'] },
  { name: 'Classic Double',   type: 'double',    description: 'Comfortable double room',                pricePerNightCents: 22000,  capacityAdults: 2, capacityChildren: 0, totalUnits: 12, amenities: ['Queen bed','Work desk'] },
];

const DEMO_ADDONS = [
  { name: 'Continental Breakfast', description: 'Daily breakfast in-room or at the lounge', priceCents: 3500, perPerson: true },
  { name: 'Airport Pickup',         description: 'Premium sedan service from the airport',   priceCents: 12000, perPerson: false },
  { name: 'Signature Spa Ritual',   description: '60-minute couples wellness ritual',         priceCents: 22000, perPerson: false },
];

const DEMO_RESTAURANTS = [
  { id: 'demo_rest_golden_fork',  ownerId: 'demo_owner_liora_2026', name: 'The Golden Fork', address: '42 Sunset Blvd, New York, NY 10001', phone: '+1 212-555-0101', website: 'https://thegoldenfork.com',  cuisine: 'Italian-American',          bio: 'Fine dining since 1998.' },
  { id: 'demo_rest_sakura',       ownerId: 'demo_owner_liora_2026', name: 'Sakura Blossom',  address: '88 Cherry Lane, San Francisco, CA 94102', phone: '+1 415-555-0188', website: 'https://sakurablossomsf.com', cuisine: 'Japanese',                bio: 'Authentic Japanese cuisine.' },
  { id: 'demo_rest_spice_route',  ownerId: 'demo_owner_liora_2026', name: 'Spice Route',     address: '7 Curry Mile, Chicago, IL 60601', phone: '+1 312-555-0177', website: 'https://spiceroutechicago.com', cuisine: 'Indian',                  bio: 'A celebration of South Asian flavours.' },
  { id: 'demo_rest_rustic_table', ownerId: 'demo_owner_liora_2026', name: 'The Rustic Table', address: '15 Oak Street, Austin, TX 73301', phone: '+1 512-555-0199', website: 'https://therustictable.com',  cuisine: 'American Farm-to-Table',  bio: 'Seasonal, locally-sourced comfort food.' },
];

const DEMO_MENU = [
  { name: 'Bruschetta al Pomodoro', description: 'Toasted sourdough with fresh tomatoes, garlic, basil and EVOO.', priceCents: 1200, tags: ['Starter','Vegetarian'], category: 'Starters' },
  { name: 'Burrata & Prosciutto', description: 'Creamy burrata with prosciutto, rocket and aged balsamic.',  priceCents: 1650, tags: ['Starter'],                category: 'Starters' },
  { name: 'Rigatoni Amatriciana', description: 'Rigatoni in a tomato and guanciale sauce with Pecorino Romano.', priceCents: 1950, tags: ['Pasta','Chef Favourite'], category: 'Mains' },
  { name: 'Mushroom Truffle Risotto', description: 'Wild mushroom Arborio risotto with truffle oil and Parmesan.', priceCents: 2200, tags: ['Main','Vegetarian'], category: 'Mains' },
  { name: 'Grilled Sea Bass', description: 'Pan-seared sea bass with lemon butter, capers and spinach.', priceCents: 2850, tags: ['Main','Seafood'], category: 'Mains' },
  { name: 'Lamb Rack Scottadito', description: 'Herb-crusted lamb cutlets with roasted garlic mash and red wine jus.', priceCents: 3400, tags: ['Main'], category: 'Mains' },
  { name: 'Margherita Pizza', description: 'Neapolitan base with San Marzano tomatoes, fior di latte and basil.', priceCents: 1800, tags: ['Pizza','Vegetarian'], category: 'Mains' },
  { name: 'Tiramisu', description: 'Espresso-soaked ladyfingers with mascarpone cream and cocoa.', priceCents: 1100, tags: ['Dessert'], category: 'Desserts' },
  { name: 'Panna Cotta', description: 'Vanilla panna cotta with seasonal berry coulis.', priceCents: 950, tags: ['Dessert'], category: 'Desserts' },
  { name: 'Espresso', description: 'Single or double shot of our signature espresso blend.', priceCents: 400, tags: ['Drinks','Coffee'], category: 'Drinks' },
];

export async function seedDemoData() {
  // -------- Demo hotel owner users --------
  for (const h of DEMO_HOTELS) {
    await q(`INSERT INTO users (id, email, role, name) VALUES ($1,$2,'hotel_owner',$3)
      ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name`,
      [h.ownerId, h.email.toLowerCase(), h.ownerName]);
  }
  // Generic demo restaurant owner
  await q(`INSERT INTO users (id, email, role, name) VALUES ('demo_owner_liora_2026','demo-owner@liora.demo','restaurant_owner','Liora Demo')
    ON CONFLICT (id) DO NOTHING`);

  // -------- Hotels + rooms + add-ons --------
  for (const h of DEMO_HOTELS) {
    const hotelId = `hot_${h.ownerId}`;
    const ts = Date.now();
    await q(`INSERT INTO hotels (id, owner_id, name, description, address, city, country, latitude, longitude,
      phone, email, star_rating, amenities, hero_image_url, gallery_urls, brand_color, policies, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15::jsonb,$16,$17::jsonb,$18,$19)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, address=EXCLUDED.address,
        city=EXCLUDED.city, country=EXCLUDED.country, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
        phone=EXCLUDED.phone, email=EXCLUDED.email, star_rating=EXCLUDED.star_rating, amenities=EXCLUDED.amenities,
        hero_image_url=EXCLUDED.hero_image_url, gallery_urls=EXCLUDED.gallery_urls,
        brand_color=EXCLUDED.brand_color, policies=EXCLUDED.policies, updated_at=$19`,
      [hotelId, h.ownerId, h.name, h.description, h.address, h.city, h.country,
       h.latitude, h.longitude, h.phone, h.email, h.starRating,
       JSON.stringify(h.amenities), h.heroImageUrl, JSON.stringify(h.galleryUrls),
       h.brandColor, JSON.stringify({ checkIn:'15:00', checkOut:'11:00', cancellation:'Free cancellation up to 48 hours before check-in.' }),
       ts, ts]);

    // Rooms
    for (let i = 0; i < DEMO_ROOMS.length; i++) {
      const r = DEMO_ROOMS[i];
      const rid = `${hotelId}_rm_${i}`;
      await q(`INSERT INTO hotel_rooms (id, hotel_id, name, type, description, price_per_night_cents,
        capacity_adults, capacity_children, total_units, amenities, image_urls, active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,true)
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, type=EXCLUDED.type, description=EXCLUDED.description,
          price_per_night_cents=EXCLUDED.price_per_night_cents, capacity_adults=EXCLUDED.capacity_adults,
          capacity_children=EXCLUDED.capacity_children, total_units=EXCLUDED.total_units,
          amenities=EXCLUDED.amenities`,
        [rid, hotelId, r.name, r.type, r.description, r.pricePerNightCents,
         r.capacityAdults, r.capacityChildren, r.totalUnits,
         JSON.stringify(r.amenities), JSON.stringify([])]);
    }
    // Add-ons
    for (let i = 0; i < DEMO_ADDONS.length; i++) {
      const a = DEMO_ADDONS[i];
      const aid = `${hotelId}_ax_${i}`;
      await q(`INSERT INTO hotel_addons (id, hotel_id, name, description, price_cents, per_person, active)
        VALUES ($1,$2,$3,$4,$5,$6,true)
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
          price_cents=EXCLUDED.price_cents, per_person=EXCLUDED.per_person`,
        [aid, hotelId, a.name, a.description, a.priceCents, a.perPerson]);
    }
  }

  // -------- Demo restaurants + menu items --------
  for (const r of DEMO_RESTAURANTS) {
    await q(`INSERT INTO restaurants (id, owner_id, name, address, phone, website, cuisine, bio)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET address=EXCLUDED.address, phone=EXCLUDED.phone, website=EXCLUDED.website,
        cuisine=EXCLUDED.cuisine, bio=EXCLUDED.bio, updated_at=$9`,
      [r.id, r.ownerId, r.name, r.address, r.phone, r.website, r.cuisine, r.bio, Date.now()]);
    // Seed menu only if empty
    const existing = await q1('SELECT count(*)::int AS n FROM menu_items WHERE restaurant_id=$1', [r.id]);
    if (existing.n === 0) {
      for (let i = 0; i < DEMO_MENU.length; i++) {
        const m = DEMO_MENU[i];
        await q(`INSERT INTO menu_items (id, restaurant_id, name, description, price_cents, tags, available, category)
          VALUES ($1,$2,$3,$4,$5,$6::jsonb,true,$7)`,
          [`${r.id}_mi_${i}`, r.id, m.name, m.description, m.priceCents, JSON.stringify(m.tags), m.category]);
      }
    }
  }
  console.log('[Seed] demo data OK');
}
