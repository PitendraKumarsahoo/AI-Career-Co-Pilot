import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface SkillRadarChartProps {
  skills: string[];
}

export default function SkillRadarChart({ skills }: SkillRadarChartProps) {
  // Ensure we have at least 3 skills for a valid radar chart; fallback if empty
  const chartData = useMemo(() => {
    const list = [...skills];
    const defaultSkills = ["TypeScript", "React", "Node.js", "Python", "Cloud Architecture"];
    while (list.length < 3) {
      const fallback = defaultSkills.find((s) => !list.includes(s)) || "General Eng";
      list.push(fallback);
    }

    return list.map((skill) => {
      // Create a deterministic proficiency score between 65 and 95% based on skill name hash
      let hash = 0;
      for (let i = 0; i < skill.length; i++) {
        hash = skill.charCodeAt(i) + ((hash << 5) - hash);
      }
      const score = 65 + (Math.abs(hash) % 31); // range 65% to 95%
      return {
        subject: skill,
        "Proficiency %": score,
        fullMark: 100,
      };
    });
  }, [skills]);

  // Premium custom tooltip for Recharts Radar
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-white/10 p-2.5 rounded-xl backdrop-blur-md shadow-lg font-sans">
          <p className="text-xs font-bold text-white">{payload[0].payload.subject}</p>
          <p className="text-[11px] text-sky-400 mt-1 font-mono">
            Proficiency: <strong className="text-white">{payload[0].value}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="recharts-radar-chart-container" className="flex flex-col items-center justify-center p-3 relative bg-slate-950/20 rounded-xl border border-white/5 w-full">
      <div className="w-full h-[220px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="55%" 
            data={chartData}
            margin={{ top: 15, right: 25, bottom: 15, left: 25 }}
          >
            <PolarGrid stroke="#ffffff25" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "#f1f5f9", fontSize: 9, fontWeight: 500 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: "#94a3b8", fontSize: 8 }} 
              stroke="transparent"
            />
            <Radar
              name="Proficiency"
              dataKey="Proficiency %"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.4}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mt-2.5 w-full">
        {chartData.map((d) => (
          <span
            key={d.subject}
            className="text-[9px] font-mono bg-sky-500/5 border border-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded-md"
          >
            {d.subject}: <strong className="text-white">{d["Proficiency %"]}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
