# Generated by Django 5.1.4 on 2024-12-24 15:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_user_number_logins_user_preferred_region_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='barcode',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
    ]
