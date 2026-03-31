// src/components/admin/Pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalCount: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalCount,
  pageSize = 20,
  onChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  // Tạo danh sách trang hiển thị: luôn show trang đầu, cuối, và xung quanh trang hiện tại
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
      {/* Info */}
      <p className="text-xs text-gray-400">
        Hiển thị{" "}
        <span className="font-semibold text-gray-600">
          {from}–{to}
        </span>{" "}
        trong <span className="font-semibold text-gray-600">{totalCount}</span>{" "}
        kết quả
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Pages */}
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`dot-${i}`}
              className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs"
            >
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? "bg-red-600 text-white border border-red-600"
                  : "border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600"
              }`}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
