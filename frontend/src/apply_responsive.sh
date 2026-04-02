#!/bin/bash
# apply_responsive.sh
# Chạy từ thư mục frontend/src/
# Áp dụng responsive fixes cho tất cả các file

echo "Applying responsive fixes..."

# ── VehicleDetailPage.tsx ──────────────────────────────────────
sed -i 's/grid lg:grid-cols-2 gap-10/grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10/g' pages/VehicleDetailPage.tsx
sed -i 's/mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6/mt-8 lg:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6/g' pages/VehicleDetailPage.tsx
sed -i 's/grid grid-cols-2 gap-2\.5">$/grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">/g' pages/VehicleDetailPage.tsx
sed -i 's/grid grid-cols-2 sm:grid-cols-4 gap-3/grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3/g' pages/VehicleDetailPage.tsx
sed -i 's/grid grid-cols-3 gap-2/grid grid-cols-3 gap-1.5 sm:gap-2/g' pages/VehicleDetailPage.tsx
echo "✓ VehicleDetailPage"

# ── DepositPage.tsx ────────────────────────────────────────────
sed -i 's/grid grid-cols-1 lg:grid-cols-5 gap-8/grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8/g' pages/DepositPage.tsx
sed -i 's/grid grid-cols-1 sm:grid-cols-2 gap-4/grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4/g' pages/DepositPage.tsx
echo "✓ DepositPage"

# ── SellPage.tsx ───────────────────────────────────────────────
sed -i 's/grid grid-cols-2 gap-4/grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4/g' pages/SellPage.tsx
sed -i 's/grid grid-cols-1 lg:grid-cols-5 gap-8/grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8/g' pages/SellPage.tsx
echo "✓ SellPage"

# ── ContactPage.tsx ────────────────────────────────────────────
sed -i 's/min-h-\[480px\]/min-h-[300px] sm:min-h-[400px] lg:min-h-[480px]/g' pages/ContactPage.tsx
sed -i 's/grid grid-cols-1 lg:grid-cols-5 gap-8/grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8/g' pages/ContactPage.tsx
echo "✓ ContactPage"

# ── AdminDashboardPage.tsx ─────────────────────────────────────
sed -i 's/grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6/grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6/g' pages/admin/AdminDashboardPage.tsx
sed -i 's/grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5/grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-4 lg:mb-5/g' pages/admin/AdminDashboardPage.tsx
echo "✓ AdminDashboardPage"

# ── Admin pages — summary cards ────────────────────────────────
for f in pages/admin/AdminSalesOrdersPage.tsx pages/admin/AdminWarrantiesPage.tsx pages/admin/AdminHandoversPage.tsx; do
  sed -i 's/grid grid-cols-3 gap-4 mb-6/grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6/g' "$f"
  sed -i 's/grid grid-cols-4 gap-4 mb-6/grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6/g' "$f"
  echo "✓ $f"
done

# ── AdminAppointmentsPage.tsx ──────────────────────────────────
sed -i 's/grid grid-cols-5 gap-2\.5 mb-5/grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 mb-4 sm:mb-5/g' pages/admin/Adminappointmentspage.tsx
sed -i 's/flex gap-6 h-full/flex flex-col lg:flex-row gap-4 lg:gap-6 h-full/g' pages/admin/Adminappointmentspage.tsx
echo "✓ AdminAppointmentsPage"

# ── ProfilePage.tsx ────────────────────────────────────────────
sed -i 's/grid grid-cols-1 lg:grid-cols-4 gap-6/grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6/g' pages/ProfilePage.tsx
echo "✓ ProfilePage"

echo ""
echo "✅ All responsive fixes applied!"
echo ""
echo "Manual fixes still needed:"
echo "  - AdminAppointmentsPage: detail panel layout (flex → stack on mobile)"
echo "  - AppointmentForm: use AppointmentForm_responsive.tsx from outputs/"
echo "  - VehicleCard: use VehicleCard_responsive.tsx from outputs/"