from django.apps import AppConfig


class VehiclesConfig(AppConfig):
    """
    Cấu hình ứng dụng quản lý xe.

    App này chịu trách nhiệm:
    - Quản lý thông tin xe (VehicleUnit)
    - Thông số kỹ thuật xe (VehicleSpec)
    - Media xe (VehicleMedia)
    - Theo dõi trạng thái vòng đời xe (VehicleStatusLog)

    Hàm ready() dùng để đăng ký các Django signals
    phục vụ cho tự động cập nhật trạng thái xe khi
    có sự kiện xảy ra trong hệ thống.
    """

    default_auto_field = "django.db.models.BigAutoField"

    name = "vehicles"

    verbose_name = "Quản lý xe"

    def ready(self):
        """
        Hàm này được Django gọi khi app được khởi tạo.

        Tại đây ta import module signals để kích hoạt
        các sự kiện tự động của hệ thống.

        Lưu ý:
        - Import trong hàm ready để tránh circular import
        - Không nên đặt logic nặng trong hàm này
        """

        import vehicles.signals  # noqa
