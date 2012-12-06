"""Notifications."""
from django.conf import settings
from django.core.urlresolvers import reverse
from django.utils.encoding import smart_unicode
from django.utils.safestring import mark_safe


from portfoliyo import email



def send_post_email_notification(profile, post):
    """Notify user about post."""
    rel = post.get_relationship()
    role = rel.description_or_role if rel else post.author.role
    c = {
        'profile': profile,
        'post': post,
        'author_role': role,
        'profile_url': settings.PORTFOLIYO_BASE_URL + reverse('edit_profile'),
    }

    student = getattr(post, 'student', None)
    if student:
        c['village_url'] =  (
            settings.PORTFOLIYO_BASE_URL +
            reverse('village', kwargs={'student_id': student.id})
            )
        c['message_source'] = mark_safe(u"%s's %s" % (student, role))
    else:
        c['message_source'] = mark_safe(smart_unicode(post.author))

    email.send_multipart('notifications/new_post', c, [profile.user.email])



def send_signup_email_notification(profile, rel):
    """Notify user that rel.elder signed up for rel.student."""
    c = {
        'profile': profile,
        'rel': rel,
        'village_url': (
            settings.PORTFOLIYO_BASE_URL +
            reverse('village', kwargs={'student_id': rel.student.id})
            ),
        'profile_url': settings.PORTFOLIYO_BASE_URL + reverse('edit_profile'),
    }

    email.send_multipart('notifications/new_student', c, [profile.user.email])
