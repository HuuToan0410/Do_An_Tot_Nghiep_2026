from django.contrib import admin
from .models import VehicleUnit, VehicleSpec, VehicleMedia, VehicleStatusLog

admin.site.register(VehicleUnit)
admin.site.register(VehicleSpec)
admin.site.register(VehicleMedia)
admin.site.register(VehicleStatusLog)
