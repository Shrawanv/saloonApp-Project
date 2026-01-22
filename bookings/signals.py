from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import Appointment

@receiver(m2m_changed, sender=Appointment.services.through)
def update_total_amount(sender, instance, action, **kwargs):
    if action in ['post_add', 'post_remove', 'post_clear']:
        total = sum(service.price for service in instance.services.all())
        instance.total_amount = total
        instance.save(update_fields=['total_amount'])
