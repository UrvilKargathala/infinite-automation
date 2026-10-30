// Customer identity helpers shared by the Add Customer form and the customers API.

/** Display name used everywhere else (quotes, CRM, search): first name + surname. */
export function customerFullName(firstName: string, surname: string): string {
  return [firstName.trim(), surname.trim()].filter(Boolean).join(" ");
}

function letters(s: string): string {
  return s.replace(/[^A-Za-z]/g, "").toUpperCase();
}

/**
 * Customer code base: first two letters of Name + first two of Surname (Rahul Verma → RAVE).
 * With no surname the name supplies all four letters. The API adds a number if the base is taken.
 */
export function customerCodeBase(firstName: string, surname: string): string {
  const a = letters(firstName);
  const b = letters(surname);
  return (b ? a.slice(0, 2) + b.slice(0, 2) : a.slice(0, 4)) || "CUST";
}

/** SR No shown on the form and table — the customer id, zero-padded to four digits. */
export function formatSrNo(id: number): string {
  return String(id).padStart(4, "0");
}

/** Birthday is stored as "YYYY-MM-DD", or "--MM-DD" when the year isn't known (ISO 8601). */
export function joinBirthday(day: string, month: string, year: string): string {
  if (!day || !month) return "";
  return `${year || "-"}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`.replace(/^-(?=-)/, "-");
}

export function splitBirthday(b: string): { day: string; month: string; year: string } {
  const m = /^(\d{4}|-)-(\d{2})-(\d{2})$/.exec(b ?? "");
  if (!m) return { day: "", month: "", year: "" };
  return { day: String(Number(m[3])), month: String(Number(m[2])), year: m[1] === "-" ? "" : m[1] };
}
