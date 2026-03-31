import {
  Shield, CheckCircle, XCircle,
  Star, AlertTriangle, ClipboardList,
  User, Calendar, Wrench,
} from "lucide-react";
import type {
  InspectionPublic,
  QualityGrade,
} from "../api/inspection";
import { QUALITY_GRADE_CONFIG, CONDITION_CONFIG } from "../api/inspection";

// ── Score ring ─────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r    = 32;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(score / 10, 1); // score 0-10
  const filled = pct * circ;
  const color =
    score >= 8.5 ? "#16a34a" :
    score >= 7.0 ? "#2563eb" :
    score >= 5.0 ? "#d97706" : "#dc2626";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx={40} cy={40} r={r}
          fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-black" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// ── Grade badge ────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: QualityGrade }) {
  const cfg = QUALITY_GRADE_CONFIG[grade];
  return (
    <div className={`inline-flex flex-col items-center px-4 py-2 rounded-2xl ${cfg.bg}`}>
      <span className={`text-3xl font-black ${cfg.color}`}>{grade}</span>
      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

interface Props {
  inspection: InspectionPublic;
  compact?:   boolean;
}

export default function InspectionReport({ inspection, compact = false }: Props) {
  const passRate =
    inspection.total_items > 0
      ? Math.round((inspection.passed_count / inspection.total_items) * 100)
      : 0;

  const displayCategories = compact
    ? inspection.categories.slice(0, 2)
    : inspection.categories;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-green-600 shrink-0" />
              <h3 className="font-black text-gray-900">Báo cáo kiểm định</h3>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-3 truncate">
              {inspection.vehicle_name}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <User size={12} className="shrink-0" />
                KĐV: <strong className="text-gray-700 ml-0.5">{inspection.inspector_name}</strong>
              </div>
              {inspection.inspection_date && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar size={12} className="shrink-0" />
                  {new Date(inspection.inspection_date).toLocaleDateString("vi-VN")}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {inspection.quality_grade && (
              <GradeBadge grade={inspection.quality_grade} />
            )}
            {inspection.overall_score != null && (
              <div className="text-center">
                <ScoreRing score={Number(inspection.overall_score)} />
                <p className="text-xs text-gray-400 mt-1">Điểm TB</p>
              </div>
            )}
          </div>
        </div>

        {/* Pass rate bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Tỷ lệ đạt</span>
            <span className="font-bold text-gray-700">
              {inspection.passed_count}/{inspection.total_items} hạng mục ({passRate}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-700"
              style={{
                width: `${passRate}%`,
                background:
                  passRate >= 80 ? "#16a34a" :
                  passRate >= 60 ? "#2563eb" :
                  passRate >= 40 ? "#d97706" : "#dc2626",
              }}
            />
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
            <CheckCircle size={11} /> {inspection.passed_count} Đạt
          </span>
          {inspection.failed_count > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200">
              <XCircle size={11} /> {inspection.failed_count} Không đạt
            </span>
          )}
          {inspection.quality_grade && (
            <span className={`text-xs ${QUALITY_GRADE_CONFIG[inspection.quality_grade].color}`}>
              {QUALITY_GRADE_CONFIG[inspection.quality_grade].description}
            </span>
          )}
        </div>
      </div>

      {/* ── Kết luận & Khuyến nghị ── */}
      {!compact && (inspection.conclusion || inspection.recommendation) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inspection.conclusion && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5">
                Kết luận kiểm định
              </p>
              <p className="text-sm text-blue-800 leading-relaxed">
                {inspection.conclusion}
              </p>
            </div>
          )}
          {inspection.recommendation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                Khuyến nghị
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">
                {inspection.recommendation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Categories + Items ── */}
      {displayCategories.length > 0 && (
        <div className="space-y-3">
          {displayCategories.map((cat) => {
            const catPassed  = cat.items.filter((i) => i.is_passed).length;
            const allPassed  = catPassed === cat.items.length;
            const needRepair = cat.items.filter((i) => i.needs_repair).length;

            return (
              <div key={cat.category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Category header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b border-gray-100 ${
                  allPassed ? "bg-green-50/60" : "bg-orange-50/60"
                }`}>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className={
                      allPassed ? "text-green-600" : "text-orange-500"
                    } />
                    <span className="font-bold text-sm text-gray-900">
                      {cat.category}
                    </span>
                    {needRepair > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        <Wrench size={10} /> {needRepair} cần sửa
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    allPassed
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {catPassed}/{cat.items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {cat.items.map((item) => {
                    const condCfg = CONDITION_CONFIG[item.condition] ?? {
                      label: item.condition, color: "text-gray-600",
                      bg: "bg-gray-100", is_passed: false,
                    };
                    return (
                      <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div className="shrink-0 mt-0.5">
                          {item.is_passed ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-red-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800">
                              {item.name}
                            </p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${condCfg.bg} ${condCfg.color}`}>
                              {condCfg.label}
                            </span>
                            {item.needs_repair && (
                              <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                                Cần sửa
                              </span>
                            )}
                          </div>

                          {item.score != null && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Điểm: <strong className="text-gray-600">{item.score}/10</strong>
                            </p>
                          )}

                          {item.note && (
                            <p className="text-xs text-gray-500 mt-0.5 italic">
                              {item.note}
                            </p>
                          )}

                          {item.needs_repair && Number(item.estimated_repair_cost) > 0 && (
                            <p className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              Chi phí ước tính: {Number(item.estimated_repair_cost).toLocaleString("vi-VN")} đ
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Show more khi compact */}
          {compact && inspection.categories.length > 2 && (
            <p className="text-xs text-center text-gray-400 py-1">
              + {inspection.categories.length - 2} danh mục khác
            </p>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
        <Star size={13} className="text-yellow-500 shrink-0" />
        Báo cáo kiểm định được xác nhận bởi kỹ thuật viên AUTO Leng Art.
        Ngày {new Date(inspection.created_at).toLocaleDateString("vi-VN")}.
      </div>
    </div>
  );
}