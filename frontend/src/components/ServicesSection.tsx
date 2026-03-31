import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, DollarSign, Handshake } from "lucide-react";

const TABS = ["Mua xe", "Bán xe", "Lên đời"] as const;
type Tab = (typeof TABS)[number];

const SERVICES_MAP: Record<
  Tab,
  {
    icon: React.ReactNode;
    title: string;
    desc: string;
  }[]
> = {
  "Mua xe": [
    {
      icon: <Clock size={28} className="text-red-600" />,
      title: "1 phút hoàn thiện hồ sơ",
      desc: "Mua xe nhanh chóng và tiện lợi tại sieuthiotohanoi! Chỉ cần mất 1 phút để hoàn tất hồ sơ, quý khách đã có thể tiến hành các bước tiếp theo để sở hữu chiếc xe mơ ước.",
    },
    {
      icon: <FileText size={28} className="text-red-600" />,
      title: "10 phút báo giá xe sơ bộ",
      desc: "Nhận báo giá chi tiết chỉ trong 10 phút! Ngay sau khi hoàn tất hồ sơ, quý khách sẽ nhận được bảng báo giá chi tiết, rõ ràng về dòng xe mà mình đang quan tâm.",
    },
    {
      icon: <DollarSign size={28} className="text-red-600" />,
      title: "Nhận Full tiền ngay",
      desc: "Quý khách sẽ nhận được toàn bộ số tiền ngay lập tức sau khi hoàn tất thủ tục mua bán tại showroom và được kiểm chứng qua bộ phận kỹ thuật.",
    },
    {
      icon: <Handshake size={28} className="text-red-600" />,
      title: "Ký kết và thanh toán hợp đồng",
      desc: "Siêu Thị Ô Tô Hà Nội đến tận nơi, định giá chất lượng xe và thực hiện thanh toán ngay trong 24h.",
    },
  ],
  "Bán xe": [
    {
      icon: <Clock size={28} className="text-red-600" />,
      title: "Định giá nhanh trong 30 phút",
      desc: "Chỉ cần cung cấp thông tin xe, chúng tôi sẽ định giá và phản hồi ngay trong vòng 30 phút làm việc.",
    },
    {
      icon: <FileText size={28} className="text-red-600" />,
      title: "Hồ sơ đơn giản, minh bạch",
      desc: "Thủ tục sang tên, chuyển nhượng được hỗ trợ toàn bộ bởi đội ngũ pháp lý chuyên nghiệp.",
    },
    {
      icon: <DollarSign size={28} className="text-red-600" />,
      title: "Thanh toán ngay, không chờ đợi",
      desc: "Nhận tiền mặt hoặc chuyển khoản ngay sau khi ký hợp đồng, không cần chờ đợi.",
    },
    {
      icon: <Handshake size={28} className="text-red-600" />,
      title: "Giá cao nhất thị trường",
      desc: "Cam kết thu mua với giá cạnh tranh nhất, dựa trên định giá thực tế và minh bạch.",
    },
  ],
  "Lên đời": [
    {
      icon: <Clock size={28} className="text-red-600" />,
      title: "Đổi xe trong 1 ngày",
      desc: "Quy trình lên đời xe nhanh gọn, bạn có thể hoàn thành trong vòng một ngày làm việc.",
    },
    {
      icon: <FileText size={28} className="text-red-600" />,
      title: "Hỗ trợ chênh lệch linh hoạt",
      desc: "Chúng tôi hỗ trợ phần chênh lệch giữa xe cũ và xe mới theo nhiều hình thức thanh toán linh hoạt.",
    },
    {
      icon: <DollarSign size={28} className="text-red-600" />,
      title: "Vay vốn ưu đãi",
      desc: "Kết nối với các ngân hàng để hỗ trợ vay vốn lãi suất ưu đãi khi lên đời xe.",
    },
    {
      icon: <Handshake size={28} className="text-red-600" />,
      title: "Hậu mãi trọn đời",
      desc: "Cam kết hỗ trợ sau bán hàng, bảo hành và dịch vụ chăm sóc xe tận tâm.",
    },
  ],
};

export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState<Tab>("Mua xe");
  const services = SERVICES_MAP[activeTab];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-1">
            Dịch vụ
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">
            Dịch Vụ Của AUTO Leng Art
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-0 mb-10 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-3 font-semibold text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {services.map((s) => (
            <div
              key={s.title}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-red-200 transition-all"
            >
              <div className="mb-3">{s.icon}</div>
              <h4 className="font-bold text-gray-900 text-sm mb-2">
                {s.title}
              </h4>
              <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/sell"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            {activeTab === "Mua xe" ? "Mua xe ngay" : "Bán xe ngay"}
          </Link>
        </div>
      </div>
    </section>
  );
}
