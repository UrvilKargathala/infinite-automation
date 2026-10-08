import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Num } from "@/components/ui/Num";
import { hatchPattern } from "./chartBits";
import type { Project } from "@/types";

/** Semi-circle gauge: share of (non-cancelled) projects completed, with in-progress and still-at-inquiry slices. */
export function ProjectProgress({ projects }: { projects: Project[] }) {
  const live = projects.filter((p) => p.stage !== "Cancelled");
  const completed = live.filter((p) => p.stage === "Completed").length;
  const pending = live.filter((p) => p.stage === "Inquiry").length;
  const inProgress = live.length - completed - pending;
  const pct = live.length > 0 ? Math.round((completed / live.length) * 100) : 0;

  const slices = [
    { name: "Completed", value: completed, fill: "#44BE4A" },
    { name: "In progress", value: inProgress, fill: "#3A90C3" },
    { name: "Inquiry", value: pending, fill: "url(#gaugePending)" },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6 flex flex-col">
      <h2 className="text-lg text-text-primary">Project progress</h2>
      <p className="text-xs text-text-muted mt-0.5">
        <Num>{live.length}</Num> active project{live.length === 1 ? "" : "s"}, cancelled excluded
      </p>

      {live.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted py-10">No projects yet</div>
      ) : (
        <>
          <div className="relative mt-4 h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>{hatchPattern("gaugePending")}</defs>
                <Pie
                  data={slices}
                  dataKey="value"
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={92}
                  outerRadius={135}
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-x-0 bottom-0 text-center">
              <Num className="text-4xl text-text-primary">{pct}%</Num>
              <div className="text-xs text-text-muted">Completed</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
            {slices.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={s.name === "Inquiry"
                    ? { background: "repeating-linear-gradient(45deg, #CBD5E1 0 2px, #F1F5F9 2px 4px)" }
                    : { backgroundColor: s.fill }}
                />
                {s.name} <Num>{s.value}</Num>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
