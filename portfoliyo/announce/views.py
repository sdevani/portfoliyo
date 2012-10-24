"""Ajax view for marking an announcement as read by current user."""
from django.contrib.auth.decorators import login_required
from django import http
from django.views.decorators.http import require_POST

from . import models as announce


@require_POST
@login_required
def mark_announcement_read(request, annc_id):
    announce.mark_read(request.user.profile, int(annc_id))

    return http.HttpResponse()
