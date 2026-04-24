
export type DayHours = { open: string; close: string; closed: boolean };
export type DemoRestaurant = { id:string; ownerId:string; name:string; address?:string; phone?:string; website?:string; staffCode?:string; cuisine?:string; bio?:string; hours?:DayHours[]; };
export type DemoMenuItem = { id:string; restaurantId:string; name:string; description?:string; priceCents:number; tags?:string[]; available:boolean; };
export type DemoEvent = { id:string; restaurantId?:string; type:"view_restaurant"|"open_menu"|"click_call"|"click_directions"|"favorite"|"reservation"; ts:number; };

const RKEY="liora_demo_restaurants";
const MKEY="liora_demo_menu_items";
const EKEY="liora_demo_events";
const RESKEY="liora_demo_reservations";

const read = <T>(k:string, d:T)=>{ try{return JSON.parse(localStorage.getItem(k)||"")}catch{return d} };
const write = (k:string, v:any)=>localStorage.setItem(k, JSON.stringify(v));
const uid = ()=> Math.random().toString(36).slice(2)+Date.now().toString(36);

export function db_getRestaurantsByOwner(ownerId:string): DemoRestaurant[]{
  return read<DemoRestaurant[]>(RKEY, []).filter(r=>r.ownerId===ownerId);
}
export function db_upsertRestaurant(row:DemoRestaurant){
  const all = read<DemoRestaurant[]>(RKEY, []);
  const i = all.findIndex(x=>x.id===row.id);
  if(i>=0) all[i]=row; else all.push(row);
  write(RKEY, all);
}

export function db_listMenu(restaurantId:string): DemoMenuItem[]{
  return read<DemoMenuItem[]>(MKEY, []).filter(m=>m.restaurantId===restaurantId);
}
export function db_addMenu(restaurantId:string, item:Omit<DemoMenuItem,"id"|"restaurantId">){
  const all = read<DemoMenuItem[]>(MKEY, []);
  all.push({ id:uid(), restaurantId, ...item });
  write(MKEY, all);
}
export function db_updateMenu(item:DemoMenuItem){
  const all = read<DemoMenuItem[]>(MKEY, []);
  const i = all.findIndex(x=>x.id===item.id);
  if(i>=0){ all[i]=item; write(MKEY, all); }
}
export function db_deleteMenu(id:string){
  const all = read<DemoMenuItem[]>(MKEY, []);
  write(MKEY, all.filter(x=>x.id!==id));
}

export function db_seedMenuIfEmpty(restaurantId: string) {
  const existing = read<DemoMenuItem[]>(MKEY, []).filter(m => m.restaurantId === restaurantId);
  if (existing.length > 0) return;
  const seeds: Omit<DemoMenuItem, 'id'>[] = [
    { restaurantId, name: 'Bruschetta al Pomodoro', description: 'Toasted sourdough with fresh tomatoes, garlic, basil and a drizzle of extra virgin olive oil.', priceCents: 1200, tags: ['Starter', 'Vegetarian'], available: true },
    { restaurantId, name: 'Burrata & Prosciutto', description: 'Creamy burrata served with thinly sliced prosciutto, rocket and aged balsamic.', priceCents: 1650, tags: ['Starter'], available: true },
    { restaurantId, name: 'Rigatoni Amatriciana', description: 'Rigatoni tossed in a rich tomato and guanciale sauce, finished with Pecorino Romano.', priceCents: 1950, tags: ['Pasta', 'Chef Favourite'], available: true },
    { restaurantId, name: 'Mushroom Truffle Risotto', description: 'Wild mushroom and Arborio rice risotto finished with black truffle oil and Parmesan shavings.', priceCents: 2200, tags: ['Main', 'Vegetarian'], available: true },
    { restaurantId, name: 'Grilled Sea Bass', description: 'Pan-seared sea bass with lemon butter, capers, cherry tomatoes and wilted spinach.', priceCents: 2850, tags: ['Main', 'Seafood'], available: true },
    { restaurantId, name: 'Lamb Rack Scottadito', description: 'Herb-crusted lamb cutlets with roasted garlic mash and red wine jus.', priceCents: 3400, tags: ['Main'], available: true },
    { restaurantId, name: 'Margherita Pizza', description: 'Classic Neapolitan base with San Marzano tomatoes, fior di latte mozzarella and fresh basil.', priceCents: 1800, tags: ['Pizza', 'Vegetarian'], available: true },
    { restaurantId, name: 'Tiramisu', description: 'House-made tiramisu with espresso-soaked ladyfingers, mascarpone cream and dark cocoa.', priceCents: 1100, tags: ['Dessert'], available: true },
    { restaurantId, name: 'Panna Cotta', description: 'Vanilla panna cotta with a seasonal berry coulis and candied orange zest.', priceCents: 950, tags: ['Dessert'], available: true },
    { restaurantId, name: 'Still / Sparkling Water', description: '500ml bottle.', priceCents: 450, tags: ['Drinks'], available: true },
    { restaurantId, name: 'House Red Wine (Glass)', description: 'Rotating selection of Italian reds — ask your waiter for today\'s pour.', priceCents: 1100, tags: ['Drinks'], available: true },
    { restaurantId, name: 'Espresso', description: 'Single or double shot of our signature espresso blend.', priceCents: 400, tags: ['Drinks', 'Coffee'], available: true },
  ];
  const all = read<DemoMenuItem[]>(MKEY, []);
  seeds.forEach(s => all.push({ id: uid(), ...s }));
  write(MKEY, all);
}

export function db_logEvent(ev:Omit<DemoEvent,"id"|"ts">){
  const all = read<DemoEvent[]>(EKEY, []);
  all.push({ id:uid(), ts:Date.now(), ...ev });
  write(EKEY, all);
}
export function db_eventsForRestaurant(restaurantId:string): DemoEvent[]{
  return read<DemoEvent[]>(EKEY, []).filter(e=>e.restaurantId===restaurantId);
}

export type DemoReservation = { id:string; restaurantId:string; userEmail:string; partySize:number; when:string; status:"requested"|"confirmed"|"canceled" };
export function db_listReservations(restaurantId:string): DemoReservation[] {
  return read<DemoReservation[]>(RESKEY, []).filter(r=>r.restaurantId===restaurantId);
}
export function db_seedIfEmpty(ownerId:string){
  // ensure owner has at least one restaurant record to edit
  const rs = read<DemoRestaurant[]>(RKEY, []);
  if (!rs.some(r=>r.ownerId===ownerId)){
    rs.push({ id:uid(), ownerId, name:'', address:'', phone:'', website:'' });
    write(RKEY, rs);
  }
}

// -----------------------------------------
// DEMO RESTAURANT SEEDING (4 restaurants)
// -----------------------------------------
const DEMO_RESTAURANTS: Omit<DemoRestaurant,'id'|'ownerId'>[] = [
  {
    name: 'The Golden Fork',
    address: '42 Sunset Blvd, New York, NY 10001',
    phone: '+1 212-555-0101',
    website: 'https://thegoldenfork.com',
    cuisine: 'Italian-American',
    bio: 'Fine dining since 1998. Fresh pasta, grilled meats and a curated wine list in a warm, candlelit setting.',
  },
  {
    name: 'Sakura Blossom',
    address: '88 Cherry Lane, San Francisco, CA 94102',
    phone: '+1 415-555-0188',
    website: 'https://sakurablossomsf.com',
    cuisine: 'Japanese',
    bio: 'Authentic Japanese cuisine featuring sushi, ramen and seasonal kaiseki menus sourced from local farms.',
  },
  {
    name: 'Spice Route',
    address: '7 Curry Mile, Chicago, IL 60601',
    phone: '+1 312-555-0177',
    website: 'https://spiceroutechicago.com',
    cuisine: 'Indian',
    bio: 'A celebration of South Asian flavours — from tandoor-roasted meats to fragrant biryanis and live dosa station.',
  },
  {
    name: 'The Rustic Table',
    address: '15 Oak Street, Austin, TX 73301',
    phone: '+1 512-555-0199',
    website: 'https://therustictable.com',
    cuisine: 'American Farm-to-Table',
    bio: 'Seasonal, locally-sourced comfort food. Wood-fired steaks, fresh salads and house-brewed craft beers on tap.',
  },
];

/** Call once at app bootstrap to ensure the 4 demo restaurants exist.
 *  Uses a fixed synthetic owner ID so the records survive across sessions. */
export const DEMO_OWNER_ID = 'demo_owner_liora_2026';

export function db_seedDemoRestaurants() {
  const all = read<DemoRestaurant[]>(RKEY, []);
  let changed = false;
  for (const tmpl of DEMO_RESTAURANTS) {
    if (!all.some(r => r.name.toLowerCase() === tmpl.name.toLowerCase())) {
      all.push({ id: uid(), ownerId: DEMO_OWNER_ID, ...tmpl });
      changed = true;
    }
  }
  if (changed) write(RKEY, all);
  // Seed menus for each demo restaurant
  for (const r of all.filter(r => r.ownerId === DEMO_OWNER_ID)) {
    db_seedMenuIfEmpty(r.id);
  }
}


// -----------------------------------------
// ORDERS
// -----------------------------------------
const OKEY = 'liora_demo_orders';

export type DemoOrderItem = { menuItemId?: string; name: string; qty: number; priceCents: number };
export type DemoOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'rejected';
export type DemoOrder = {
  id: string;
  restaurantId: string;
  customerName: string;
  customerEmail?: string;
  tableNumber?: string;
  items: DemoOrderItem[];
  status: DemoOrderStatus;
  totalCents: number;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  allergens?: string[];
};

export function db_listOrders(restaurantId: string): DemoOrder[] {
  return read<DemoOrder[]>(OKEY, []).filter(o => o.restaurantId === restaurantId);
}
export function db_addOrder(order: Omit<DemoOrder,'id'|'updatedAt'>): DemoOrder {
  const all = read<DemoOrder[]>(OKEY, []);
  const o: DemoOrder = { ...order, id: uid(), updatedAt: Date.now() };
  all.push(o);
  write(OKEY, all);
  return o;
}
export function db_updateOrderStatus(id: string, status: DemoOrderStatus) {
  const all = read<DemoOrder[]>(OKEY, []);
  const i = all.findIndex(o => o.id === id);
  if (i >= 0) { all[i].status = status; all[i].updatedAt = Date.now(); write(OKEY, all); }
}
export function db_deleteOrder(id: string) {
  write(OKEY, read<DemoOrder[]>(OKEY,[]).filter(o => o.id !== id));
}
/** Returns ALL orders across every restaurant (customer-facing view). */
export function db_listAllOrders(): DemoOrder[] {
  return read<DemoOrder[]>(OKEY, []).sort((a, b) => b.createdAt - a.createdAt);
}
/** @deprecated No-op on live server — orders are created by real customers. */
export function db_seedOrders(_restaurantId: string) { /* no-op */ }

// -----------------------------------------
// PROMOTIONS
// -----------------------------------------
const PROMOKEY = 'liora_demo_promotions';

export type DemoPromotion = {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  type: 'percent' | 'flat' | 'bogo';
  value: number;
  code?: string;
  isActive: boolean;
  validUntil?: string;
  usageCount: number;
  maxUsage?: number;
};

export function db_listPromotions(restaurantId: string): DemoPromotion[] {
  return read<DemoPromotion[]>(PROMOKEY, []).filter(p => p.restaurantId === restaurantId);
}
export function db_addPromotion(promo: Omit<DemoPromotion,'id'|'usageCount'>): DemoPromotion {
  const all = read<DemoPromotion[]>(PROMOKEY, []);
  const p: DemoPromotion = { ...promo, id: uid(), usageCount: 0 };
  all.push(p);
  write(PROMOKEY, all);
  return p;
}
export function db_updatePromotion(promo: DemoPromotion) {
  const all = read<DemoPromotion[]>(PROMOKEY, []);
  const i = all.findIndex(p => p.id === promo.id);
  if (i >= 0) { all[i] = promo; write(PROMOKEY, all); }
}
export function db_deletePromotion(id: string) {
  write(PROMOKEY, read<DemoPromotion[]>(PROMOKEY,[]).filter(p => p.id !== id));
}
/** Returns all active promotions across every restaurant (customer-facing). */
export function db_listAllActivePromotions(): DemoPromotion[] {
  return read<DemoPromotion[]>(PROMOKEY, []).filter(p => p.isActive);
}
/** Returns all restaurants (used to resolve names for customer-facing views). */
export function db_getAllRestaurants(): DemoRestaurant[] {
  return read<DemoRestaurant[]>(RKEY, []);
}
/** @deprecated No-op on live server — promotions are created by the restaurant owner. */
export function db_seedPromotions(_restaurantId: string) { /* no-op */ }

// -----------------------------------------
// CHEF SPECIALS
// -----------------------------------------
const CSKEY = 'liora_demo_chef_specials';

export type DemoChefSpecialCategory = 'daily_special' | 'seasonal' | 'chef_choice';
export type DemoChefSpecial = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceCents: number;
  isAvailable: boolean;
  category: DemoChefSpecialCategory;
  chefNote?: string;
  imageEmoji?: string;
};

export function db_listChefSpecials(restaurantId: string): DemoChefSpecial[] {
  return read<DemoChefSpecial[]>(CSKEY, []).filter(c => c.restaurantId === restaurantId);
}
export function db_addChefSpecial(item: Omit<DemoChefSpecial,'id'>): DemoChefSpecial {
  const all = read<DemoChefSpecial[]>(CSKEY, []);
  const c: DemoChefSpecial = { ...item, id: uid() };
  all.push(c);
  write(CSKEY, all);
  return c;
}
export function db_updateChefSpecial(item: DemoChefSpecial) {
  const all = read<DemoChefSpecial[]>(CSKEY, []);
  const i = all.findIndex(c => c.id === item.id);
  if (i >= 0) { all[i] = item; write(CSKEY, all); }
}
export function db_deleteChefSpecial(id: string) {
  write(CSKEY, read<DemoChefSpecial[]>(CSKEY,[]).filter(c => c.id !== id));
}
/** @deprecated No-op on live server — chef specials are added by the restaurant. */
export function db_seedChefSpecials(_restaurantId: string) { /* no-op */ }

// -------------------------------------------------------------
// DINE-IN SESSIONS
// -------------------------------------------------------------
const DSKEY = 'liora_dine_sessions';

export type DineInItemStatus = 'ordered' | 'preparing' | 'served';
export type DineInItem = {
  id: string;
  name: string;
  priceCents: number;
  qty: number;
  emoji: string;
  round: number;
  status: DineInItemStatus;
  addedAt: number;
};

export type DineInSessionStatus = 'open' | 'bill_requested' | 'paid';
export type DineInSession = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  tableNumber: string;
  items: DineInItem[];
  status: DineInSessionStatus;
  subtotalCents: number;
  taxCents: number;
  serviceFeeCents: number;
  tipCents: number;
  totalCents: number;
  createdAt: number;
  paidAt?: number;
  receiptToken?: string;
};

export function db_createDineSession(session: Omit<DineInSession,'id'>): DineInSession {
  const all = read<DineInSession[]>(DSKEY, []);
  const s: DineInSession = { ...session, id: uid() };
  all.push(s);
  write(DSKEY, all);
  return s;
}
export function db_getDineSession(id: string): DineInSession | null {
  return read<DineInSession[]>(DSKEY, []).find(s => s.id === id) || null;
}
export function db_updateDineSession(session: DineInSession) {
  const all = read<DineInSession[]>(DSKEY, []);
  const i = all.findIndex(s => s.id === session.id);
  if (i >= 0) { all[i] = session; write(DSKEY, all); }
}
export function db_listDineSessions(restaurantId: string): DineInSession[] {
  return read<DineInSession[]>(DSKEY, []).filter(s => s.restaurantId === restaurantId);
}
export function db_listOpenDineSessions(restaurantId: string): DineInSession[] {
  return db_listDineSessions(restaurantId).filter(s => s.status !== 'paid');
}

// -----------------------------------------
// INVENTORY
// -----------------------------------------
const INVKEY = 'liora_demo_inventory';

export type InventoryUnit = 'units' | 'kg' | 'g' | 'litres' | 'ml' | 'bottles' | 'cans' | 'bags' | 'boxes' | 'portions';
export type InventoryCategory = 'Proteins' | 'Produce' | 'Dairy' | 'Bakery' | 'Pantry' | 'Beverages' | 'Alcohol' | 'Frozen' | 'Spices' | 'Other';

export type DemoInventoryItem = {
  id: string;
  restaurantId: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: InventoryUnit;
  reorderPoint: number;        // quantity below which it is "low"
  costPerUnit?: number;        // in cents, optional
  supplier?: string;
  notes?: string;
  updatedAt: number;
};

export function db_listInventory(restaurantId: string): DemoInventoryItem[] {
  return read<DemoInventoryItem[]>(INVKEY, [])
    .filter(i => i.restaurantId === restaurantId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function db_addInventoryItem(item: Omit<DemoInventoryItem,'id'|'updatedAt'>): DemoInventoryItem {
  const all = read<DemoInventoryItem[]>(INVKEY, []);
  const entry: DemoInventoryItem = { ...item, id: uid(), updatedAt: Date.now() };
  all.push(entry);
  write(INVKEY, all);
  return entry;
}
export function db_updateInventoryItem(item: DemoInventoryItem) {
  const all = read<DemoInventoryItem[]>(INVKEY, []);
  const i = all.findIndex(x => x.id === item.id);
  if (i >= 0) { all[i] = { ...item, updatedAt: Date.now() }; write(INVKEY, all); }
}
export function db_deleteInventoryItem(id: string) {
  write(INVKEY, read<DemoInventoryItem[]>(INVKEY, []).filter(x => x.id !== id));
}

// -----------------------------------------
// STAFF
// -----------------------------------------
const STAFFKEY = 'liora_demo_staff';
const SHIFTKEY = 'liora_demo_shifts';

export type StaffRole =
  | 'Head Chef' | 'Sous Chef' | 'Line Cook' | 'Prep Cook' | 'Pastry Chef'
  | 'Server' | 'Bartender' | 'Host/Hostess' | 'Busser' | 'Food Runner'
  | 'Manager' | 'Cashier' | 'Dishwasher' | 'Barista' | 'Other';

export type StaffStatus = 'active' | 'inactive';

export type DemoStaffMember = {
  id: string;
  restaurantId: string;
  name: string;
  role: StaffRole;
  phone?: string;
  email?: string;
  hourlyRate?: number;          // USD per hour
  status: StaffStatus;
  notes?: string;
  createdAt: number;
};

export type ShiftDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type DemoShift = {
  id: string;
  restaurantId: string;
  staffId: string;
  weekStart: string;            // ISO date string of the Monday of the week, e.g. "2026-03-16"
  day: ShiftDay;
  startTime: string;            // "HH:MM" 24h
  endTime: string;              // "HH:MM" 24h
  notes?: string;
};

// --- Staff CRUD ----------------------------------------------------------------
export function db_listStaff(restaurantId: string): DemoStaffMember[] {
  return read<DemoStaffMember[]>(STAFFKEY, [])
    .filter(s => s.restaurantId === restaurantId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function db_addStaffMember(member: Omit<DemoStaffMember,'id'|'createdAt'>): DemoStaffMember {
  const all = read<DemoStaffMember[]>(STAFFKEY, []);
  const entry: DemoStaffMember = { ...member, id: uid(), createdAt: Date.now() };
  all.push(entry);
  write(STAFFKEY, all);
  return entry;
}
export function db_updateStaffMember(member: DemoStaffMember) {
  const all = read<DemoStaffMember[]>(STAFFKEY, []);
  const i = all.findIndex(x => x.id === member.id);
  if (i >= 0) { all[i] = member; write(STAFFKEY, all); }
}
export function db_deleteStaffMember(id: string) {
  write(STAFFKEY, read<DemoStaffMember[]>(STAFFKEY, []).filter(x => x.id !== id));
  // also remove their shifts
  write(SHIFTKEY, read<DemoShift[]>(SHIFTKEY, []).filter(s => s.staffId !== id));
}

// --- Shift CRUD ----------------------------------------------------------------
export function db_listShifts(restaurantId: string, weekStart: string): DemoShift[] {
  return read<DemoShift[]>(SHIFTKEY, [])
    .filter(s => s.restaurantId === restaurantId && s.weekStart === weekStart);
}
export function db_addShift(shift: Omit<DemoShift,'id'>): DemoShift {
  const all = read<DemoShift[]>(SHIFTKEY, []);
  const entry: DemoShift = { ...shift, id: uid() };
  all.push(entry);
  write(SHIFTKEY, all);
  return entry;
}
export function db_updateShift(shift: DemoShift) {
  const all = read<DemoShift[]>(SHIFTKEY, []);
  const i = all.findIndex(x => x.id === shift.id);
  if (i >= 0) { all[i] = shift; write(SHIFTKEY, all); }
}
export function db_deleteShift(id: string) {
  write(SHIFTKEY, read<DemoShift[]>(SHIFTKEY, []).filter(x => x.id !== id));
}

// -----------------------------------------
// TABLES
// -----------------------------------------
const TKEY = 'liora_demo_tables';

export type DemoTable = {
  id: string;
  restaurantId: string;
  number: number;       // the table number shown to customers
  label?: string;       // optional friendly name, e.g. "Patio"
  seats?: number;       // seating capacity
};

export function db_listTables(restaurantId: string): DemoTable[] {
  return read<DemoTable[]>(TKEY, [])
    .filter(t => t.restaurantId === restaurantId)
    .sort((a, b) => a.number - b.number);
}
export function db_addTable(table: Omit<DemoTable,'id'>): DemoTable {
  const all = read<DemoTable[]>(TKEY, []);
  const t: DemoTable = { ...table, id: uid() };
  all.push(t);
  write(TKEY, all);
  return t;
}
export function db_updateTable(table: DemoTable) {
  const all = read<DemoTable[]>(TKEY, []);
  const i = all.findIndex(x => x.id === table.id);
  if (i >= 0) { all[i] = table; write(TKEY, all); }
}
export function db_deleteTable(id: string) {
  write(TKEY, read<DemoTable[]>(TKEY, []).filter(x => x.id !== id));
}

// -----------------------------------------
// ATTENDANCE
// -----------------------------------------
const ATTKEY = 'liora_demo_attendance';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';

export type DemoAttendanceRecord = {
  id: string;
  staffId: string;
  restaurantId: string;
  date: string;        // YYYY-MM-DD
  clockIn: string;     // HH:MM or ''
  clockOut: string;    // HH:MM or ''
  status: AttendanceStatus;
  notes: string;
};

export function db_listAttendance(restaurantId: string, date?: string): DemoAttendanceRecord[] {
  const all = read<DemoAttendanceRecord[]>(ATTKEY, []).filter(a => a.restaurantId === restaurantId);
  return date ? all.filter(a => a.date === date) : all;
}

export function db_upsertAttendance(record: Omit<DemoAttendanceRecord, 'id'> & { id?: string }): DemoAttendanceRecord {
  const all = read<DemoAttendanceRecord[]>(ATTKEY, []);
  const existing = all.findIndex(a => a.staffId === record.staffId && a.date === record.date);
  const final: DemoAttendanceRecord = { ...record, id: record.id || uid() };
  if (existing >= 0) { all[existing] = final; } else { all.push(final); }
  write(ATTKEY, all);
  return final;
}

export function db_deleteAttendance(id: string) {
  write(ATTKEY, read<DemoAttendanceRecord[]>(ATTKEY, []).filter(x => x.id !== id));
}

export function db_seedAttendance(restaurantId: string, staffIds: string[]) {
  const existing = read<DemoAttendanceRecord[]>(ATTKEY, []).filter(a => a.restaurantId === restaurantId);
  if (existing.length > 0) return;
  const records: DemoAttendanceRecord[] = [];
  const today = new Date();
  const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'late', 'present', 'absent', 'present', 'half_day'];
  staffIds.forEach(staffId => {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().slice(0, 10);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const clockIn = status === 'absent' ? '' : status === 'late' ? '09:' + String(Math.floor(Math.random() * 30) + 20).padStart(2, '0') : '09:00';
      const clockOut = status === 'absent' ? '' : status === 'half_day' ? '13:00' : '17:' + String(Math.floor(Math.random() * 30)).padStart(2, '0');
      records.push({ id: uid(), staffId, restaurantId, date: dateStr, clockIn, clockOut, status, notes: '' });
    }
  });
  write(ATTKEY, [...existing, ...records]);
}

// -----------------------------------------
// RESTAURANT HELPERS
// -----------------------------------------
export function db_getRestaurantById(id: string): DemoRestaurant | null {
  return read<DemoRestaurant[]>(RKEY, []).find(r => r.id === id) ?? null;
}

// -----------------------------------------
// TABLE ALERTS (Quick-action notifications from diners)
// -----------------------------------------
const ALERTS_KEY = 'liora_demo_table_alerts';

export type DemoTableAlert = {
  id: string;
  restaurantName: string;
  tableNumber: string;
  action: string;
  message: string;
  status: 'active' | 'dismissed';
  orderId?: string;
  createdAt: number;
};

export function db_addTableAlert(alert: Omit<DemoTableAlert, 'id' | 'createdAt' | 'status'>): DemoTableAlert {
  const all = read<DemoTableAlert[]>(ALERTS_KEY, []);
  const a: DemoTableAlert = { ...alert, id: uid(), status: 'active', createdAt: Date.now() };
  all.push(a);
  write(ALERTS_KEY, all);
  return a;
}

export function db_listTableAlerts(restaurantName: string): DemoTableAlert[] {
  return read<DemoTableAlert[]>(ALERTS_KEY, []).filter(
    a => a.restaurantName.toLowerCase() === restaurantName.toLowerCase() && a.status === 'active'
  );
}

export function db_dismissTableAlert(id: string) {
  const all = read<DemoTableAlert[]>(ALERTS_KEY, []);
  const i = all.findIndex(a => a.id === id);
  if (i >= 0) { all[i].status = 'dismissed'; write(ALERTS_KEY, all); }
}

export function db_getRestaurantByName(name: string): DemoRestaurant | undefined {
  return read<DemoRestaurant[]>(RKEY, []).find(r => r.name.toLowerCase() === name.toLowerCase());
}

/** Returns or auto-generates a staff access code for the given restaurant. */
export function db_getOrCreateStaffCode(restaurantId: string): string {
  const all = read<DemoRestaurant[]>(RKEY, []);
  const r = all.find(x => x.id === restaurantId);
  if (!r) throw new Error('Restaurant not found');
  if (r.staffCode) return r.staffCode;
  // Generate a memorable 6-char alphanumeric code
  const code = Math.random().toString(36).toUpperCase().slice(2, 8);
  r.staffCode = code;
  write(RKEY, all);
  return code;
}
