import fs from "fs";
import { neon } from "@neondatabase/serverless";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/DATABASE_URL="?([^"\n]+)"?/)[1].trim();
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

const tickets = [
  { id: 1, subject: "Dimmer switch not responding to app", name: "Rahul Mehta", company: "Mehta Residences", email: "rahul@mehta.in", phone: "+91 98765 43210", category: "Repair", priority: "Medium", status: "Open", assigned: "Urvil", lastContact: "2026-08-10" },
  { id: 2, subject: "New site install — access control + cameras", name: "James Cooper", company: "Cooper & Sons Commercial", email: "james@coopersons.com.au", phone: "+61 412 345 678", category: "Installation", priority: "High", status: "Open", assigned: "Henil", lastContact: "2026-08-12" },
  { id: 3, subject: "Smart lock battery low, keeps disconnecting", name: "Ananya Sharma", company: "Sharma Smart Homes", email: "ananya@sharmahomes.in", phone: "+91 87654 32109", category: "Maintenance", priority: "Low", status: "In Progress", assigned: "Urvil", lastContact: "2026-08-08" },
  { id: 4, subject: "Irrigation controller not triggering on schedule", name: "David Mitchell", company: "Mitchell Agri Farms", email: "david@mitchellagri.com.au", phone: "+61 423 456 789", category: "Repair", priority: "High", status: "In Progress", assigned: "Chirag", lastContact: "2026-08-06" },
  { id: 5, subject: "WiFi access points dropping guest connections", name: "Sneha Patel", company: "Patel Holiday Stays", email: "sneha@patelstays.in", phone: "+91 76543 21098", category: "Repair", priority: "Medium", status: "On Hold", assigned: "Chirag", lastContact: "2026-08-09" },
  { id: 6, subject: "New office tower — full automation install", name: "Tom Bradley", company: "Bradley Office Tower", email: "tom@bradleyoffice.com.au", phone: "+61 434 567 890", category: "Installation", priority: "Urgent", status: "On Hold", assigned: "Urvil", lastContact: "2026-08-07" },
  { id: 7, subject: "Warehouse camera install — final walkthrough", name: "Vikram Singh", company: "Singh Warehousing", email: "vikram@singhwh.in", phone: "+91 65432 10987", category: "Installation", priority: "Medium", status: "Resolved", assigned: "Henil", lastContact: "2026-08-01" },
  { id: 8, subject: "VoIP phones no dial tone after outage", name: "Sarah O'Brien", company: "O'Brien BnB Group", email: "sarah@obrienstays.com.au", phone: "+61 445 678 901", category: "Repair", priority: "Urgent", status: "Resolved", assigned: "Chirag", lastContact: "2026-07-28" },
  { id: 9, subject: "Sprinkler pump relay replacement", name: "Amit Desai", company: "Desai Irrigation", email: "amit@desaiirr.in", phone: "+91 54321 09876", category: "Repair", priority: "Medium", status: "Closed", assigned: "Chirag", lastContact: "2026-07-25" },
  { id: 10, subject: "Curtain motor jammed, won't close fully", name: "Emily Watson", company: "Watson Smart Living", email: "emily@watsonliving.com.au", phone: "+61 456 789 012", category: "Repair", priority: "High", status: "Open", assigned: "Urvil", lastContact: "2026-08-11" },
  { id: 11, subject: "Campus-wide sensor and alarm maintenance", name: "Kavita Nair", company: "Nair Education Trust", email: "kavita@nairedu.in", phone: "+91 43210 98765", category: "Maintenance", priority: "Low", status: "On Hold", assigned: "Urvil", lastContact: "2026-08-05" },
  { id: 12, subject: "HVAC controller not cooling — vineyard office", name: "Michael Chen", company: "Chen Vineyards", email: "michael@chenvineyards.com.au", phone: "+61 467 890 123", category: "Repair", priority: "High", status: "In Progress", assigned: "Urvil", lastContact: "2026-08-04" },
  { id: 13, subject: "Garage door controller install for villa", name: "Deepak Joshi", company: "Joshi Luxury Villas", email: "deepak@joshivillas.in", phone: "+91 32109 87654", category: "Installation", priority: "Medium", status: "Resolved", assigned: "Henil", lastContact: "2026-07-30" },
  { id: 14, subject: "Co-working hub network gear decommission", name: "Lisa Taylor", company: "Taylor Co-Working Hub", email: "lisa@taylorcowork.com.au", phone: "+61 478 901 234", category: "General", priority: "Low", status: "Closed", assigned: "Chirag", lastContact: "2026-07-20" },
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
  await sql.query("TRUNCATE quote_items, quote_sections, quotes, tickets, products, users RESTART IDENTITY CASCADE");

  for (const p of products) {
    await sql.query(
      `INSERT INTO products (id, name, sku, brand, category, hsn, description, price, status) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8)`,
      [p.id, p.name, p.sku, p.brand, p.category, p.hsn, p.description, p.status]
    );
  }
  console.log(`Seeded ${products.length} products`);

  for (const t of tickets) {
    await sql.query(
      `INSERT INTO tickets (id, subject, name, company, email, phone, category, priority, status, assigned, last_contact) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [t.id, t.subject, t.name, t.company, t.email, t.phone, t.category, t.priority, t.status, t.assigned, t.lastContact]
    );
  }
  console.log(`Seeded ${tickets.length} tickets`);

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
        const desc = products.find((p) => p.id === it.productId)?.description ?? "";
        await sql.query(
          `INSERT INTO quote_items (id, section_id, product_id, name, category, brand, description, qty, price, discount, position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [it.id, s.id, it.productId, it.name, it.category, it.brand, desc, it.qty, it.price, it.discount, ii]
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
  await sql.query(`SELECT setval('tickets_id_seq', (SELECT MAX(id) FROM tickets))`);
  await sql.query(`SELECT setval('quotes_id_seq', (SELECT MAX(id) FROM quotes))`);
  await sql.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
  console.log("Sequences synced. Done.");
}

main().catch((e) => { console.error("SEED FAILED:", e); process.exit(1); });
