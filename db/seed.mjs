import fs from "fs";
import { neon } from "@neondatabase/serverless";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/DATABASE_URL=(.+)/)[1].trim();
const sql = neon(url);

// --- Extract products from the Zustand seed file ---
const productSrc = fs.readFileSync(new URL("../lib/store/useProductStore.ts", import.meta.url), "utf8");
const productRe = /\{ id: (\d+), name: "((?:[^"\\]|\\.)*)", sku: "((?:[^"\\]|\\.)*)", brand: "((?:[^"\\]|\\.)*)", category: "((?:[^"\\]|\\.)*)", hsn: "((?:[^"\\]|\\.)*)", description: "((?:[^"\\]|\\.)*)", price: null, status: "((?:[^"\\]|\\.)*)" \}/g;
const products = [];
let m;
while ((m = productRe.exec(productSrc))) {
  const unesc = (s) => s.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  products.push({
    id: Number(m[1]), name: unesc(m[2]), sku: unesc(m[3]), brand: unesc(m[4]),
    category: unesc(m[5]), hsn: unesc(m[6]), description: unesc(m[7]), status: m[8],
  });
}
if (products.length !== 105) throw new Error(`Expected 105 products, parsed ${products.length}`);

const leads = [
  { id: 1, name: "Rahul Mehta", company: "Mehta Residences", email: "rahul@mehta.in", phone: "+91 98765 43210", segment: "Residential", stage: "New", value: 185000, assigned: "Urvil", lastContact: "2026-08-10" },
  { id: 2, name: "James Cooper", company: "Cooper & Sons Commercial", email: "james@coopersons.com.au", phone: "+61 412 345 678", segment: "Commercial", stage: "New", value: 1250000, assigned: "Henil", lastContact: "2026-08-12" },
  { id: 3, name: "Ananya Sharma", company: "Sharma Smart Homes", email: "ananya@sharmahomes.in", phone: "+91 87654 32109", segment: "Residential", stage: "Qualified", value: 275000, assigned: "Urvil", lastContact: "2026-08-08" },
  { id: 4, name: "David Mitchell", company: "Mitchell Agri Farms", email: "david@mitchellagri.com.au", phone: "+61 423 456 789", segment: "Agriculture", stage: "Qualified", value: 210000, assigned: "Chirag", lastContact: "2026-08-06" },
  { id: 5, name: "Sneha Patel", company: "Patel Holiday Stays", email: "sneha@patelstays.in", phone: "+91 76543 21098", segment: "Short Term Rentals", stage: "Quoted", value: 340000, assigned: "Chirag", lastContact: "2026-08-09" },
  { id: 6, name: "Tom Bradley", company: "Bradley Office Tower", email: "tom@bradleyoffice.com.au", phone: "+61 434 567 890", segment: "Commercial", stage: "Quoted", value: 2100000, assigned: "Urvil", lastContact: "2026-08-07" },
  { id: 7, name: "Vikram Singh", company: "Singh Warehousing", email: "vikram@singhwh.in", phone: "+91 65432 10987", segment: "Commercial", stage: "Won", value: 850000, assigned: "Henil", lastContact: "2026-08-01" },
  { id: 8, name: "Sarah O'Brien", company: "O'Brien BnB Group", email: "sarah@obrienstays.com.au", phone: "+61 445 678 901", segment: "Short Term Rentals", stage: "Won", value: 420000, assigned: "Chirag", lastContact: "2026-07-28" },
  { id: 9, name: "Amit Desai", company: "Desai Irrigation", email: "amit@desaiirr.in", phone: "+91 54321 09876", segment: "Agriculture", stage: "Lost", value: 180000, assigned: "Chirag", lastContact: "2026-07-25" },
  { id: 10, name: "Emily Watson", company: "Watson Smart Living", email: "emily@watsonliving.com.au", phone: "+61 456 789 012", segment: "Residential", stage: "New", value: 195000, assigned: "Urvil", lastContact: "2026-08-11" },
  { id: 11, name: "Kavita Nair", company: "Nair Education Trust", email: "kavita@nairedu.in", phone: "+91 43210 98765", segment: "Commercial", stage: "Quoted", value: 1800000, assigned: "Urvil", lastContact: "2026-08-05" },
  { id: 12, name: "Michael Chen", company: "Chen Vineyards", email: "michael@chenvineyards.com.au", phone: "+61 467 890 123", segment: "Agriculture", stage: "Qualified", value: 290000, assigned: "Urvil", lastContact: "2026-08-04" },
  { id: 13, name: "Deepak Joshi", company: "Joshi Luxury Villas", email: "deepak@joshivillas.in", phone: "+91 32109 87654", segment: "Residential", stage: "Won", value: 310000, assigned: "Henil", lastContact: "2026-07-30" },
  { id: 14, name: "Lisa Taylor", company: "Taylor Co-Working Hub", email: "lisa@taylorcowork.com.au", phone: "+61 478 901 234", segment: "Commercial", stage: "Lost", value: 950000, assigned: "Chirag", lastContact: "2026-07-20" },
];

const users = [
  { id: 1, fullName: "Urvil Kargathala", email: "urvilk1542@gmail.com", role: "Super Admin", status: "Active" },
  { id: 2, fullName: "Henil Patel", email: "patelhenil34@gmail.com", role: "Super Admin", status: "Active" },
  { id: 3, fullName: "Tirth", email: "tirthsavaliya.official@gmail.com", role: "Super Admin", status: "Active" },
];

const quotes = [
  { id: 1, number: "IA-Q-2026-001", clientId: 3, client: "Sharma Smart Homes", date: "2026-08-01", validUntil: "2026-08-31", status: "Draft",
    sections: [
      { id: "s1a", name: "Ground Floor", items: [
        { id: "i1a1", productId: 1, name: "4 Channel Dimmer Device", category: "Light Controller", brand: "Infinite AUS", qty: 6, price: 4500, discount: 0 },
        { id: "i1a2", productId: 8, name: "Dendo Curtain/Blind Motor", category: "Curtain Controller", brand: "Infinite AUS", qty: 4, price: 3800, discount: 5 },
        { id: "i1a3", productId: 84, name: "Glass Break Sensor", category: "Sensors & Alarms", brand: "Sensors & Alarms", qty: 3, price: 1800, discount: 0 },
      ]},
      { id: "s1b", name: "First Floor", items: [
        { id: "i1b1", productId: 2, name: "2 Channel 10 AMP Device", category: "Light Controller", brand: "Infinite AUS", qty: 4, price: 7200, discount: 0 },
        { id: "i1b2", productId: 10, name: "Curtain/Blind Device", category: "Curtain Controller", brand: "Infinite AUS", qty: 3, price: 8900, discount: 10 },
      ]},
      { id: "s1c", name: "Outdoor", items: [
        { id: "i1c1", productId: 66, name: "G5 Turret Ultra", category: "Camera", brand: "Camera", qty: 4, price: 22000, discount: 0 },
        { id: "i1c2", productId: 79, name: "G5 Bullet", category: "Camera", brand: "Camera", qty: 2, price: 14200, discount: 0 },
      ]},
    ] },
  { id: 2, number: "IA-Q-2026-002", clientId: 6, client: "Bradley Office Tower", date: "2026-08-03", validUntil: "2026-09-02", status: "Sent",
    sections: [
      { id: "s2a", name: "Reception & Lobby", items: [
        { id: "i2a1", productId: 33, name: "U7 Pro", category: "Wifi", brand: "Wifi", qty: 6, price: 18500, discount: 5 },
        { id: "i2a2", productId: 48, name: "G3 Intercom", category: "Video Door Phone", brand: "Video Door Phone", qty: 2, price: 15000, discount: 0 },
        { id: "i2a3", productId: 42, name: "G3 Reader Pro", category: "Video Door Phone", brand: "Video Door Phone", qty: 4, price: 4800, discount: 0 },
      ]},
      { id: "s2b", name: "Office Floors", items: [
        { id: "i2b1", productId: 35, name: "U7 Lite", category: "Wifi", brand: "Wifi", qty: 12, price: 9800, discount: 10 },
        { id: "i2b2", productId: 4, name: "HVAC AC Device", category: "AC Controller", brand: "Infinite AUS", qty: 8, price: 5200, discount: 0 },
      ]},
    ] },
  { id: 3, number: "IA-Q-2026-003", clientId: 5, client: "Patel Holiday Stays", date: "2026-08-05", validUntil: "2026-09-04", status: "Accepted",
    sections: [
      { id: "s3a", name: "Living Area", items: [
        { id: "i3a1", productId: 1, name: "4 Channel Dimmer Device", category: "Light Controller", brand: "Infinite AUS", qty: 8, price: 4500, discount: 0 },
        { id: "i3a2", productId: 9, name: "IR Device", category: "Infrared Controller", brand: "Infinite AUS", qty: 4, price: 2200, discount: 0 },
        { id: "i3a3", productId: 18, name: "Smart Locks", category: "Locks", brand: "Electrical Product", qty: 3, price: 12500, discount: 5 },
      ]},
      { id: "s3b", name: "Security", items: [
        { id: "i3b1", productId: 62, name: "G6 Dome", category: "Camera", brand: "Camera", qty: 6, price: 16500, discount: 0 },
        { id: "i3b2", productId: 89, name: "Alarm Hub Kit", category: "Sensors & Alarms", brand: "Sensors & Alarms", qty: 1, price: 9500, discount: 0 },
      ]},
    ] },
  { id: 4, number: "IA-Q-2026-004", clientId: 4, client: "Mitchell Agri Farms", date: "2026-07-20", validUntil: "2026-08-19", status: "Rejected",
    sections: [
      { id: "s4a", name: "Farm Office", items: [
        { id: "i4a1", productId: 96, name: "Gateway Pro", category: "Advance Hosting", brand: "Advance Hosting", qty: 1, price: 35000, discount: 0 },
        { id: "i4a2", productId: 33, name: "U7 Pro", category: "Wifi", brand: "Wifi", qty: 3, price: 18500, discount: 0 },
      ]},
    ] },
  { id: 5, number: "IA-Q-2026-005", clientId: 7, client: "Singh Warehousing", date: "2026-08-10", validUntil: "2026-09-09", status: "Draft",
    sections: [
      { id: "s5a", name: "Warehouse Floor", items: [
        { id: "i5a1", productId: 70, name: "AI 360", category: "Camera", brand: "Camera", qty: 8, price: 28000, discount: 5 },
        { id: "i5a2", productId: 19, name: "Dimmable Light", category: "Light", brand: "Electrical Product", qty: 50, price: 850, discount: 10 },
      ]},
      { id: "s5b", name: "Loading Dock", items: [
        { id: "i5b1", productId: 79, name: "G5 Bullet", category: "Camera", brand: "Camera", qty: 4, price: 14200, discount: 0 },
        { id: "i5b2", productId: 85, name: "Environmental Sensor", category: "Sensors & Alarms", brand: "Sensors & Alarms", qty: 6, price: 2200, discount: 0 },
      ]},
    ] },
];

async function main() {
  await sql.query("TRUNCATE quote_items, quote_sections, quotes, leads, products, users RESTART IDENTITY CASCADE");

  for (const p of products) {
    await sql.query(
      `INSERT INTO products (id, name, sku, brand, category, hsn, description, price, status) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8)`,
      [p.id, p.name, p.sku, p.brand, p.category, p.hsn, p.description, p.status]
    );
  }
  console.log(`Seeded ${products.length} products`);

  for (const l of leads) {
    await sql.query(
      `INSERT INTO leads (id, name, company, email, phone, segment, stage, value, assigned, last_contact) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [l.id, l.name, l.company, l.email, l.phone, l.segment, l.stage, l.value, l.assigned, l.lastContact]
    );
  }
  console.log(`Seeded ${leads.length} leads`);

  for (const q of quotes) {
    await sql.query(
      `INSERT INTO quotes (id, number, client_id, client, date, valid_until, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [q.id, q.number, q.clientId, q.client, q.date, q.validUntil, q.status]
    );
    for (let si = 0; si < q.sections.length; si++) {
      const s = q.sections[si];
      await sql.query(
        `INSERT INTO quote_sections (id, quote_id, name, position) VALUES ($1,$2,$3,$4)`,
        [s.id, q.id, s.name, si]
      );
      for (let ii = 0; ii < s.items.length; ii++) {
        const it = s.items[ii];
        await sql.query(
          `INSERT INTO quote_items (id, section_id, product_id, name, category, brand, qty, price, discount, position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [it.id, s.id, it.productId, it.name, it.category, it.brand, it.qty, it.price, it.discount, ii]
        );
      }
    }
  }
  console.log(`Seeded ${quotes.length} quotes`);

  for (const u of users) {
    await sql.query(
      `INSERT INTO users (id, full_name, email, role, status) VALUES ($1,$2,$3,$4,$5)`,
      [u.id, u.fullName, u.email, u.role, u.status]
    );
  }
  console.log(`Seeded ${users.length} users`);

  await sql.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`);
  await sql.query(`SELECT setval('leads_id_seq', (SELECT MAX(id) FROM leads))`);
  await sql.query(`SELECT setval('quotes_id_seq', (SELECT MAX(id) FROM quotes))`);
  await sql.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
  console.log("Sequences synced. Done.");
}

main().catch((e) => { console.error("SEED FAILED:", e); process.exit(1); });
