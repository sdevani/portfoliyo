"""Celery tasks."""
from __future__ import absolute_import

from celery.utils.log import get_task_logger

from portfoliyo.celery import celery, ModelTask


logger = get_task_logger(__name__)


# set ignore_result=True for tasks where we don't care about the return value
# set acks_late=True for tasks that are better executed twice than not at all



@celery.task(ignore_result=True, acks_late=True)
def send_sms(phone, source, body):
    """Send an SMS message."""
    from portfoliyo import sms
    sms.send(phone, source, body)



@celery.task(ignore_result=True)
def check_for_pending_notifications():
    """Trigger notifications to all users with pending notifications."""
    from portfoliyo.notifications import store
    for profile_id in store.pending_profile_ids():
        send_notification_email.delay(profile_id)



@celery.task(ignore_result=True)
def send_notification_email(profile_id):
    """Send notification email to the user with the given profile ID."""
    from portfoliyo.notifications import render
    render.send(profile_id)



@celery.task(base=ModelTask, ignore_result=True)
def record_notification(name, *args, **kw):
    """Record a notification (to later be incorporated in an email)."""
    from portfoliyo.notifications import record
    record_function = getattr(record, name)
    record_function(*args, **kw)



@celery.task(ignore_result=True)
def push_event(name, *args, **kw):
    """Send a Pusher event."""
    from portfoliyo.pusher import events
    event_function = getattr(events, name)
    event_function(*args, **kw)



@celery.task(ignore_result=True)
def mixpanel(func, *args, **kw):
    """Record something in Mixpanel."""
    from portfoliyo import mixpanel
    record_function = getattr(mixpanel, func)
    record_function(*args, **kw)
