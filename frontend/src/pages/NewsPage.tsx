import MainLayout from "../layouts/MainLayout";
import { Link } from "react-router-dom";
import { Tag, ArrowRight } from "lucide-react";

const NEWS_LIST = [
  {
    id: 1,
    category: "Tin Tức",
    title: "Bảo dưỡng ô tô: bí quyết bảo quản xe bền lâu",
    excerpt:
      "Bảo dưỡng ô tô là một phần quan trọng trong việc duy trì hiệu suất và tuổi thọ của xe. Hãy cùng tìm hiểu những bí quyết giúp xe luôn hoạt động tốt nhất.",
    image: "https://picsum.photos/seed/news1/600/400",
    date: "15/03/2026",
  },
  {
    id: 2,
    category: "Kiến Thức",
    title: 'Ý nghĩa của "mã lực" và "mô men xoắn" trong xe hơi',
    excerpt:
      "Nếu bạn là người thường xuyên theo dõi các thông tin ô tô, chắc chắn đã từng nghe đến mã lực và mô men xoắn. Vậy chúng có ý nghĩa gì?",
    image: "https://picsum.photos/seed/news2/600/400",
    date: "10/03/2026",
  },
  {
    id: 3,
    category: "Kinh Nghiệm",
    title: "5 Điều Cần Kiểm Tra Kỹ Trước Khi Lái Xe",
    excerpt:
      "Hiện nay số lượng người sử dụng ô tô ngày một tăng cao. Để đảm bảo an toàn, hãy kiểm tra kỹ 5 điều này trước khi lái xe.",
    image: "https://picsum.photos/seed/news3/600/400",
    date: "05/03/2026",
  },
  {
    id: 4,
    category: "Tin Tức",
    title: "Xu hướng xe điện tại Việt Nam năm 2026",
    excerpt:
      "Thị trường xe điện tại Việt Nam đang phát triển mạnh mẽ. Cùng tìm hiểu những xu hướng và mẫu xe điện nổi bật đáng chú ý nhất năm nay.",
    image: "https://picsum.photos/seed/news4/600/400",
    date: "01/03/2026",
  },
  {
    id: 5,
    category: "Kinh Nghiệm",
    title: "Cách chọn mua xe cũ an toàn, tránh bị lừa",
    excerpt:
      "Mua xe cũ tiềm ẩn nhiều rủi ro nếu không biết cách kiểm tra. Đây là những kinh nghiệm giúp bạn chọn được chiếc xe tốt nhất.",
    image: "https://picsum.photos/seed/news5/600/400",
    date: "25/02/2026",
  },
  {
    id: 6,
    category: "Kiến Thức",
    title: "Hướng dẫn đọc thông số kỹ thuật xe ô tô",
    excerpt:
      "Bảng thông số kỹ thuật xe có vẻ phức tạp nhưng thực ra rất dễ hiểu. Bài viết này sẽ giúp bạn nắm rõ từng chỉ số quan trọng.",
    image: "https://picsum.photos/seed/news6/600/400",
    date: "20/02/2026",
  },
];

const CATEGORY_STYLES: Record<string, string> = {
  "Tin Tức": "bg-red-100   text-red-700",
  "Kiến Thức": "bg-blue-100  text-blue-700",
  "Kinh Nghiệm": "bg-green-100 text-green-700",
};

export default function NewsPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-[#111] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-red-500 font-semibold text-sm uppercase tracking-widest mb-2">
            Tin Tức
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Tin Tức & Kiến Thức Xe Hơi
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Cập nhật những thông tin mới nhất về thị trường ô tô, kinh nghiệm
            mua xe và kiến thức hữu ích.
          </p>
        </div>
      </section>

      {/* News grid */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {NEWS_LIST.map((post) => (
            <Link
              key={post.id}
              to={`/news/${post.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100"
            >
              <div className="overflow-hidden h-48">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
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
      </section>
    </MainLayout>
  );
}
