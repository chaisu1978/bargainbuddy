"""
 Award utilities related to gamification
 """
from core.models import UserBadge, UserPoint, PointsAction, User

########################
# APPLY AWARD
########################


def apply_award(user, activity_type):
    # print(f"Inside apply_award for activity_type {activity_type}")
    point_action = PointsAction.objects.get(activity_type=activity_type)
    UserPoint.objects.create(
        user=user,
        points_action=point_action
    )
    if point_action.badge:
        UserBadge.objects.create(
            user=user,
            badge=point_action.badge
        )

    # Award the user the points in the
    # User model and increment number_logins
    update_user = User.objects.get(email=user.email)
    update_user.points += point_action.point_amount

    # Save the user
    update_user.save()

    response = {
        'activity_type': point_action.activity_type,
        'new_points': point_action.point_amount,
        'new_badge': point_action.badge.name if point_action.badge else None,
    }
    print(f"Apply Awards Response: {response}")
    return response if response else None
