# Generated by Django 5.1.4 on 2025-01-22 22:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_alter_datasources_description'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='preferred_store',
        ),
        migrations.AddField(
            model_name='user',
            name='preferred_stores',
            field=models.ManyToManyField(blank=True, to='core.store'),
        ),
    ]
