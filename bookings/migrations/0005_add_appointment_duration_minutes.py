# Generated manually for duration-based slot booking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_appointment_total_amount'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='duration_minutes',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Total duration of selected services; used for slot availability.',
            ),
        ),
    ]
