"""
Module for managing user actions in the app.
"""
from core.models import UserAction


def user_action(user, action_type, additional_data):
    # If additional data is the json dict submitted to endpoint, save it as is
    if isinstance(additional_data, dict):
        UserAction.objects.create(
            user=user,
            action_type=action_type,
            additional_data=additional_data
            )
    # else if additional data is None, save it as nodata
    elif additional_data is None:
        UserAction.objects.create(
            user=user,
            action_type=action_type,
            additional_data={'data': ['nodata']}
            )
