import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BrandStat } from "../api/dashboard";

const BAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-bold text-gray-900 mb-1">{label}</p>
      <p className="text-red-600 font-semibold">{payload[0].value} xe</p>
    </div>
  );
}

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function CustomXTick({ x = 0, y = 0, payload }: TickProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={11}
        fontWeight={500}
      >
        {payload?.value}
      </text>
    </g>
  );
}

interface Props {
  data: BrandStat[];
}

export default function BrandChart({ data }: Props) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={sorted}
          margin={{ top: 8, right: 16, left: -10, bottom: 4 }}
          barCategoryGap="30%"
        >
          <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="4 4" />
          <XAxis
            dataKey="brand"
            axisLine={false}
            tickLine={false}
            tick={<CustomXTick />}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={52}>
            {sorted.map((_, i) => (
              <Cell
                key={i}
                fill={BAR_COLORS[i % BAR_COLORS.length]}
                fillOpacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}