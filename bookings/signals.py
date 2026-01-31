from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import Appointment

@receiver(m2m_changed, sender=Appointment.services.through)
def update_total_amount_and_duration(sender, instance, action, **kwargs):
    if action in ['post_add', 'post_remove', 'post_clear']:
        services = list(instance.services.all())
        instance.total_amount = sum(s.price for s in services)
        instance.duration_minutes = sum(s.duration for s in services)
        instance.save(update_fields=['total_amount', 'duration_minutes'])
