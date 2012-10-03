from django.contrib import admin
from django.contrib.auth import models as auth_models

from . import models


class RelationshipsFromInline(admin.TabularInline):
    model = models.Relationship
    fk_name = 'to_profile'


class RelationshipsToInline(admin.TabularInline):
    model = models.Relationship
    fk_name = 'from_profile'


def email(profile):
    return profile.user.email
email.admin_order_field = 'user__email'


admin.site.register(
    models.Profile,
    inlines=[RelationshipsFromInline, RelationshipsToInline],
    list_display=[
        'name',
        email,
        'phone',
        'role',
        'school_staff',
        'code',
        'state',
        'invited_by',
        'deleted',
        'declined',
        ],
    list_filter=['school_staff', 'state', 'deleted', 'declined'],
    )
admin.site.register(models.Group)


admin.site.unregister(auth_models.Group)
