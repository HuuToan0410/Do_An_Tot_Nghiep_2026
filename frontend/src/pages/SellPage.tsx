import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useMutation } from "@tanstack/react-query";
import {
  Phone, CheckCircle, DollarSign,
  FileText, Handshake, AlertCircle,
  User, Mail, Car, Gauge, ArrowRight,
} from "lucide-react";
import {
  submitSellRequest,
  submitContactRequest,
  type SellRequestPayload,
  type ContactRequestPayload,
} from "../api/contact";

// ── Constants ──────────────────────────────────────────────────

const STEPS = [
  {
    icon:  <Phone size={28} className="text-white" />,
    bg:    "bg-red-500",
    title: "1. Liên hệ tư vấn",
    desc:  "Gọi hotline hoặc điền form để được tư vấn miễn phí trong vòng 30 phút.",
  },
  {
    icon:  <FileText size={28} className="text-white" />,
    bg:    "bg-orange-500",
    title: "2. Định giá xe",
    desc:  "Chuyên viên đến tận nơi kiểm tra và định giá xe minh bạch, chính xác.",
  },
  {
    icon:  <DollarSign size={28} className="text-white" />,
    bg:    "bg-amber-500",
    title: "3. Ký hợp đồng",
    desc:  "Thủ tục đơn giản, nhanh gọn. Hỗ trợ sang tên và giấy tờ pháp lý.",
  },
  {
    icon:  <Handshake size={28} className="text-white" />,
    bg:    "bg-green-500",
    title: "4. Nhận tiền ngay",
    desc:  "Thanh toán tiền mặt hoặc chuyển khoản ngay trong ngày hoàn tất.",
  },
];

const BENEFITS = [
  "Định giá miễn phí, không ràng buộc",
  "Giá cao nhất thị trường",
  "Thanh toán ngay trong ngày",
  "Hỗ trợ thủ tục sang tên toàn bộ",
  "Đội ngũ chuyên nghiệp, uy tín",
  "Phục vụ tất cả các ngày trong tuần",
];

// ── Helpers ────────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}

interface FieldProps {
  label:     string;
  required?: boolean;
  error?:    string;
  children:  React.ReactNode;
}

function Field({ label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function SellPage() {

  const [sellForm, setSellForm] = useState<SellRequestPayload>({
    name: "", phone: "", email: "",
    brand: "", model: "", year: "",
    mileage: "", expected_price: "", note: "",
  });
  const [sellErrors,  setSellErrors]  = useState<Partial<SellRequestPayload>>({});
  const [sellSuccess, setSellSuccess] = useState(false);

  const [contactForm, setContactForm] = useState<ContactRequestPayload>({
    name: "", phone: "", email: "", message: "",
  });
  const [contactErrors,  setContactErrors]  = useState<{ name?: string; contact?: string }>({});
  const [contactSuccess, setContactSuccess] = useState(false);

  const sellMutation = useMutation({
    mutationFn: submitSellRequest,
    onSuccess: () => {
      setSellSuccess(true);
      setSellForm({ name:"",phone:"",email:"",brand:"",model:"",year:"",mileage:"",expected_price:"",note:"" });
    },
  });

  const contactMutation = useMutation({
    mutationFn: submitContactRequest,
    onSuccess: () => {
      setContactSuccess(true);
      setContactForm({ name:"",phone:"",email:"",message:"" });
    },
  });

  function validateSell(): boolean {
    const errs: Partial<SellRequestPayload> = {};
    if (!sellForm.name.trim())  errs.name  = "Vui lòng nhập họ tên";
    if (!sellForm.phone.trim()) errs.phone = "Vui lòng nhập số điện thoại";
    else if (!/^(0|\+84)[0-9]{9}$/.test(sellForm.phone.trim()))
      errs.phone = "Số điện thoại không hợp lệ";
    if (sellForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellForm.email))
      errs.email = "Email không hợp lệ";
    setSellErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateContact(): boolean {
    const errs: { name?: string; contact?: string } = {};
    if (!contactForm.name.trim())
      errs.name = "Vui lòng nhập họ tên";
    if (!contactForm.phone?.trim() && !contactForm.email?.trim())
      errs.contact = "Vui lòng nhập ít nhất số điện thoại hoặc email";
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  }

  return (
    <MainLayout>

      {/* ── Hero ── */}
      <section className="relative bg-[#111] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(https://picsum.photos/seed/sellcar/1600/600)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            Bán xe nhanh
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Bán Xe Của Bạn<br />
            <span className="text-red-500">Giá Tốt Nhất — Nhanh Nhất</span>
          </h1>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
            Định giá miễn phí trong 30 phút. Thanh toán ngay trong ngày.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:0987654321"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg"
            >
              <Phone size={20} /> Gọi ngay: 0987 654 321
            </a>
            <a
              href="#sell-form"
              className="inline-flex items-center justify-center gap-2 border-2 border-white hover:bg-white hover:text-black text-white font-bold px-8 py-4 rounded-xl transition-all"
            >
              Đăng ký bán xe <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Quy trình</p>
            <h2 className="text-3xl font-black text-gray-900">Bán Xe Chỉ 4 Bước Đơn Giản</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center group">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gray-200 z-0" />
                )}
                <div className="relative z-10">
                  <div className={`w-20 h-20 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Benefits ── */}
      <section id="sell-form" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Đăng ký ngay</p>
            <h2 className="text-3xl font-black text-gray-900">Để Lại Thông Tin Xe Muốn Bán</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto text-sm">
              Điền thông tin bên dưới, chúng tôi sẽ liên hệ định giá trong vòng 30 phút.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Form bán xe — 3/5 ── */}
            <div className="lg:col-span-3">
              {sellSuccess ? (
                <div className="bg-white border border-green-200 rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Gửi thành công! 🎉</h3>
                  <p className="text-gray-500 mb-6 leading-relaxed">
                    Chúng tôi đã nhận được thông tin xe của bạn.<br />
                    Nhân viên sẽ liên hệ trong vòng <strong className="text-gray-700">30 phút</strong>.
                  </p>
                  <button
                    onClick={() => setSellSuccess(false)}
                    className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
                  >
                    Đăng ký xe khác <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
                  {sellMutation.isError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      <AlertCircle size={15} className="shrink-0" />
                      {(sellMutation.error as Error)?.message ?? "Có lỗi xảy ra. Vui lòng thử lại."}
                    </div>
                  )}

                  {/* Thông tin liên hệ */}
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                    <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <p className="text-sm font-bold text-gray-800 uppercase tracking-wider">Thông tin liên hệ</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Họ và tên" required error={sellErrors.name}>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text" placeholder="Nguyễn Văn A"
                          value={sellForm.name}
                          onChange={(e) => setSellForm((p) => ({ ...p, name: e.target.value }))}
                          className={inputClass(!!sellErrors.name) + " pl-9"}
                        />
                      </div>
                    </Field>

                    <Field label="Số điện thoại" required error={sellErrors.phone}>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel" placeholder="0987 654 321"
                          value={sellForm.phone}
                          onChange={(e) => setSellForm((p) => ({ ...p, phone: e.target.value }))}
                          className={inputClass(!!sellErrors.phone) + " pl-9"}
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Email" error={sellErrors.email}>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email" placeholder="email@example.com (không bắt buộc)"
                        value={sellForm.email}
                        onChange={(e) => setSellForm((p) => ({ ...p, email: e.target.value }))}
                        className={inputClass(!!sellErrors.email) + " pl-9"}
                      />
                    </div>
                  </Field>

                  {/* Thông tin xe */}
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100 pt-2">
                    <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <p className="text-sm font-bold text-gray-800 uppercase tracking-wider">Thông tin xe muốn bán</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Hãng xe">
                      <div className="relative">
                        <Car size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text" placeholder="Toyota, Honda..."
                          value={sellForm.brand}
                          onChange={(e) => setSellForm((p) => ({ ...p, brand: e.target.value }))}
                          className={inputClass() + " pl-9"}
                        />
                      </div>
                    </Field>

                    <Field label="Dòng xe">
                      <input
                        type="text" placeholder="Camry, CX-5..."
                        value={sellForm.model}
                        onChange={(e) => setSellForm((p) => ({ ...p, model: e.target.value }))}
                        className={inputClass()}
                      />
                    </Field>

                    <Field label="Năm sản xuất">
                      <input
                        type="text" placeholder="2020"
                        value={sellForm.year}
                        onChange={(e) => setSellForm((p) => ({ ...p, year: e.target.value }))}
                        className={inputClass()}
                      />
                    </Field>

                    <Field label="Số km đã đi">
                      <div className="relative">
                        <Gauge size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text" placeholder="50,000 km"
                          value={sellForm.mileage}
                          onChange={(e) => setSellForm((p) => ({ ...p, mileage: e.target.value }))}
                          className={inputClass() + " pl-9"}
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Giá mong muốn">
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text" placeholder="vd: 500 triệu"
                        value={sellForm.expected_price}
                        onChange={(e) => setSellForm((p) => ({ ...p, expected_price: e.target.value }))}
                        className={inputClass() + " pl-9"}
                      />
                    </div>
                  </Field>

                  <Field label="Ghi chú thêm">
                    <textarea
                      rows={3}
                      placeholder="Tình trạng xe, lịch sử bảo dưỡng, lý do bán..."
                      value={sellForm.note}
                      onChange={(e) => setSellForm((p) => ({ ...p, note: e.target.value }))}
                      className={inputClass() + " resize-none"}
                    />
                  </Field>

                  <button
                    onClick={() => { if (validateSell()) sellMutation.mutate(sellForm); }}
                    disabled={sellMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
                  >
                    {sellMutation.isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <><ArrowRight size={18} /> Đăng ký bán xe ngay</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* ── Benefits — 2/5 ── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
                  Tại Sao Chọn Chúng Tôi?
                </h3>
                <div className="space-y-3">
                  {BENEFITS.map((b) => (
                    <div key={b} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <CheckCircle size={16} className="text-green-600 shrink-0" />
                      <span className="text-gray-700 text-sm font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hotline */}
              <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-6 text-center shadow-lg">
                <p className="text-red-200 text-sm mb-1">Cần tư vấn ngay?</p>
                <a href="tel:0987654321" className="text-3xl font-black hover:underline block mb-1">
                  0987 654 321
                </a>
                <p className="text-red-200 text-xs">7:00 – 19:00 · Tất cả các ngày</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "500+", label: "Xe đã mua" },
                  { value: "30'",  label: "Phản hồi" },
                  { value: "100%", label: "Minh bạch" },
                  { value: "10+",  label: "Năm KN" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-red-600">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Form để lại thông tin tìm xe ── */}
      <section className="bg-[#111] py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="inline-block bg-white/10 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
              Không tìm thấy xe?
            </span>
            <h2 className="text-3xl font-black text-white mb-2">
              Để Lại Thông Tin — Chúng Tôi Tìm Cho Bạn
            </h2>
            <p className="text-gray-400 text-sm">
              Hãy để lại số điện thoại hoặc email, chúng tôi sẽ liên hệ ngay khi có xe phù hợp.
            </p>
          </div>

          {contactSuccess ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Đã nhận được!</h3>
              <p className="text-gray-400 mb-5">
                Cảm ơn bạn! Chúng tôi sẽ liên hệ ngay khi có xe phù hợp.
              </p>
              <button
                onClick={() => setContactSuccess(false)}
                className="text-red-400 font-semibold text-sm hover:underline"
              >
                Gửi yêu cầu khác →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-2xl space-y-4">
              {contactMutation.isError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {(contactMutation.error as Error)?.message ?? "Có lỗi xảy ra. Vui lòng thử lại."}
                </div>
              )}

              <Field label="Họ và tên" required error={contactErrors.name}>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" placeholder="Nguyễn Văn A"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass(!!contactErrors.name) + " pl-9"}
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Số điện thoại" required error={contactErrors.contact}>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel" placeholder="0987 654 321"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                      className={inputClass(!!contactErrors.contact) + " pl-9"}
                    />
                  </div>
                </Field>

                <Field label="Email" error={!contactForm.phone ? contactErrors.contact : undefined}>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email" placeholder="email@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                      className={inputClass(!!contactErrors.contact && !contactForm.phone) + " pl-9"}
                    />
                  </div>
                </Field>
              </div>

              {contactErrors.contact && (
                <p className="flex items-center gap-1 text-xs text-red-500 -mt-2">
                  <AlertCircle size={11} /> {contactErrors.contact}
                </p>
              )}

              <Field label="Xe bạn đang tìm kiếm">
                <textarea
                  rows={3}
                  placeholder="vd: Toyota Camry 2020, dưới 700 triệu, màu trắng..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                  className={inputClass() + " resize-none"}
                />
              </Field>

              <button
                onClick={() => { if (validateContact()) contactMutation.mutate(contactForm); }}
                disabled={contactMutation.isPending}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {contactMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <><ArrowRight size={18} /> Để lại thông tin</>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                Chúng tôi sẽ liên hệ bạn ngay khi có xe phù hợp 🚗
              </p>
            </div>
          )}
        </div>
      </section>

    </MainLayout>
  );
}