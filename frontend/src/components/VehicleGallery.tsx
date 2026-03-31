import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";

interface Props {
  images: string[];
}

const PLACEHOLDER = "/placeholder-car.jpg";

export default function VehicleGallery({ images }: Props) {
  const safeImages = images?.filter(Boolean).length ? images : [PLACEHOLDER];

  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(
    () => setSelected((s) => (s === 0 ? safeImages.length - 1 : s - 1)),
    [safeImages.length]
  );

  const next = useCallback(
    () => setSelected((s) => (s === safeImages.length - 1 ? 0 : s + 1)),
    [safeImages.length]
  );

  // Keyboard navigation trong lightbox
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft")  prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape")     setLightbox(false);
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
          <img
            src={safeImages[selected]}
            alt={`Ảnh xe ${selected + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />

          {/* Arrows */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Ảnh trước"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                aria-label="Ảnh tiếp theo"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Zoom button */}
          <button
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-lg px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ZoomIn size={14} /> Phóng to
          </button>

          {/* Counter */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {selected + 1} / {safeImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {safeImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {safeImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  i === selected
                    ? "border-red-500 shadow-md scale-105"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER;
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            aria-label="Đóng"
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/10 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {safeImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Ảnh trước"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            src={safeImages[selected]}
            alt={`Ảnh xe ${selected + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />

          {/* Next */}
          {safeImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Ảnh tiếp theo"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Counter */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {selected + 1} / {safeImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}