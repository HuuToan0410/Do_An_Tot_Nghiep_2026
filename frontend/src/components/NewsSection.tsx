import { Link } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";

const NEWS = [
  {
    id: 1,
    category: "Tin Tức",
    title: "Bảo dưỡng ô tô: bí quyết bảo quản xe bền lâu",
    excerpt:
      "Bảo dưỡng ô tô là một phần quan trọng trong việc duy trì hiệu suất và tuổi thọ của xe...",
    image: "https://picsum.photos/seed/news1/600/400",
    date: "15/03/2026",
  },
  {
    id: 2,
    category: "Kiến Thức",
    title: 'Ý nghĩa của "mã lực" và "mô men xoắn" trong xe hơi',
    excerpt:
      "Nếu bạn là người thường xuyên theo dõi các thông tin ô tô, bạn chắc chắn đã từng nghe...",
    image: "https://picsum.photos/seed/news2/600/400",
    date: "10/03/2026",
  },
  {
    id: 3,
    category: "Kinh Nghiệm",
    title: "5 Điều Cần Kiểm Tra Kỹ Trước Khi Lái Xe",
    excerpt:
      "Hiện nay, số lượng người sử dụng ô tô để di chuyển ngày một tăng cao. Dưới đây là...",
    image: "https://picsum.photos/seed/news3/600/400",
    date: "05/03/2026",
  },
];

const CATEGORY_STYLES: Record<string, string> = {
  "Tin Tức": "bg-red-100    text-red-700",
  "Kiến Thức": "bg-blue-100   text-blue-700",
  "Kinh Nghiệm": "bg-green-100  text-green-700",
};

export default function NewsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-1">
            News
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase mb-3">
            Tin Tức Mới
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            AUTO Leng Art là đơn vị kinh doanh, chuyên mua – bán các loại
            xe lướt, xe đã qua sử dụng chất lượng cao.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NEWS.map((post) => (
            <Link
              key={post.id}
              to={`/news/${post.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              {/* Thumbnail */}
              <div className="overflow-hidden h-48">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      CATEGORY_STYLES[post.category] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Tag size={10} /> {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.date}</span>
                </div>

                <h3 className="font-bold text-gray-900 text-sm mb-2 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold group-hover:gap-2.5 transition-all">
                  Đọc thêm <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-8">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 border border-gray-300 hover:border-red-500 hover:text-red-600 text-gray-600 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Xem tất cả tin tức <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
