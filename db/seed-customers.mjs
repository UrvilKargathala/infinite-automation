import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const customers = [
  {
    name: "Chen Holdings",
    segment: "Residential",
    contactName: "Michael Chen",
    email: "michael.chen@chenholdings.com.au",
    phone: "0412 555 018",
    address: "22 Chapel St, South Yarra VIC 3141",
    notes: "Multiple residential properties across South Yarra and Toorak.",
  },
  {
    name: "Kapoor Villas",
    segment: "Hospitality",
    contactName: "Anjali Kapoor",
    email: "anjali@kapoorvillas.com.au",
    phone: "0398 221 774",
    address: "14 Beach Rd, Portsea VIC 3944",
    notes: "Boutique serviced-apartment operator, 6 properties.",
  },
  {
    name: "Boroondara City Council",
    segment: "Government / Council",
    contactName: "David Whitfield",
    email: "d.whitfield@boroondara.vic.gov.au",
    phone: "0392 785 100",
    address: "8 Inglesby Rd, Camberwell VIC 3124",
    notes: "Public building access-control and camera rollout, multi-site.",
  },
  {
    name: "Sharma Smart Homes",
    segment: "Retail",
    contactName: "Rohan Sharma",
    email: "rohan@sharmasmarthomes.com.au",
    phone: "0431 908 226",
    address: "112 Bridge Rd, Richmond VIC 3121",
    notes: "Reseller partner — buys hardware for their own installs.",
  },
  {
    name: "Mehta Residences",
    segment: "Healthcare / Aged Care",
    contactName: "Priya Mehta",
    email: "priya.mehta@mehtaresidences.com.au",
    phone: "0405 663 391",
    address: "5 Balwyn Rd, Balwyn VIC 3103",
    notes: "Aged-care facility — sensor and emergency-call system client.",
  },
];

for (const c of customers) {
  await sql`
    INSERT INTO customers (name, segment, contact_name, email, phone, address, notes)
    VALUES (${c.name}, ${c.segment}, ${c.contactName}, ${c.email}, ${c.phone}, ${c.address}, ${c.notes})
  `;
  console.log("added", c.name);
}

console.log("done");
