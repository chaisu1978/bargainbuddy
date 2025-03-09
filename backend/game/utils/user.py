"""
 User utilities related to gamification
"""
from core.models import UserPoint, User
import game.utils.awards as awards

########################
# User Game Conditions
########################


def is_first_login(user):
    if UserPoint.objects.filter(user=user).exists():
        return False
    return True


def is_first_profile_update(user, request):
    user_account = User.objects.get(email=user.email)
    data = request

    address = data.get('address')
    phone_number = data.get('phone_number')
    preferred_store = data.get('preferred_store')

    if user_account.profile_updated is False and (address or phone_number or preferred_store):
        return True
    return False


def is_first_profile_picture_update(user):
    user_account = User.objects.get(email=user.email)
    if user_account.profile_picture_updated is False:
        return True
    return False

########################
# Awards for user game conditions
########################


def login_checks(user):
    if is_first_login(user):
        return awards.apply_award(user, 'First Login')
    return None


def profile_update_checks(user, request):
    if is_first_profile_update(user, request):
        user.profile_updated = True
        user.save()
        return awards.apply_award(user, 'Update Profile Info')
    return None


def user_image_checks(user):
    if is_first_profile_picture_update(user):
        user.profile_picture_updated = True
        user.save()
        return awards.apply_award(user, 'First Profile Picture')
    return None
