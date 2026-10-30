import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// CRM pipeline stages become data: six fixed defaults plus any custom stages users add.
// projects.stage keeps the stage *name*; "Cancelled" stays a status outside the pipeline.
await sql`
  CREATE TABLE IF NOT EXISTS pipeline_stages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    color TEXT NOT NULL DEFAULT '#64748B',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const DEFAULTS = [
  ["Inquiry", "#3B82F6"],
  ["Quote", "#8B5CF6"],
  ["Confirm Order", "#F59E0B"],
  ["Site Instruction", "#06B6D4"],
  ["Material Requirement", "#F97316"],
  ["Install", "#22C55E"],
];
for (const [i, [name, color]] of DEFAULTS.entries()) {
  await sql`
    INSERT INTO pipeline_stages (name, position, is_default, color) VALUES (${name}, ${i + 1}, true, ${color})
    ON CONFLICT (name) DO UPDATE SET position = EXCLUDED.position, is_default = true, color = EXCLUDED.color
  `;
}
console.log("✓ pipeline_stages ready with 6 default stages");

// Drop the old fixed stage list on projects (constraint name looked up, not assumed).
const checks = await sql`
  SELECT conname FROM pg_constraint
  WHERE conrelid = 'projects'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%stage%'
`;
for (const { conname } of checks) {
  await sql.query(`ALTER TABLE projects DROP CONSTRAINT "${conname}"`);
  console.log(`✓ dropped ${conname}`);
}

// Old 10-stage pipeline → new 6-stage pipeline, by meaning. Install is the last stage, so Completed lands there.
const moved = await sql`
  UPDATE projects SET stage = CASE stage
    WHEN 'Design' THEN 'Quote'
    WHEN 'Quotation' THEN 'Quote'
    WHEN 'Measurement' THEN 'Site Instruction'
    WHEN 'Marking' THEN 'Site Instruction'
    WHEN 'Production' THEN 'Material Requirement'
    WHEN 'Ready to Dispatch' THEN 'Install'
    WHEN 'Installation' THEN 'Install'
    WHEN 'Completed' THEN 'Install'
    ELSE stage END
  WHERE stage IN ('Design', 'Quotation', 'Measurement', 'Marking', 'Production', 'Ready to Dispatch', 'Installation', 'Completed')
  RETURNING id
`;
console.log(`✓ ${moved.length} project(s) moved to the new stages`);

const left = await sql`
  SELECT p.stage, count(*)::int AS n FROM projects p
  WHERE p.stage <> 'Cancelled' AND NOT EXISTS (SELECT 1 FROM pipeline_stages s WHERE s.name = p.stage)
  GROUP BY p.stage
`;
if (left.length) console.warn("⚠ projects in unknown stages:", left);
else console.log("✓ every live project is in a pipeline stage");
