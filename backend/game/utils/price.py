"""
 Price Listing utilities related to gamification
"""
from core.models import UserPoint, User
import game.utils.awards as awards

########################
# User Game Conditions
########################

# Check if UserPoint contains activity_type containing the string passed to it and return count
def price_listing_count(user, activity_type):
    user_account = User.objects.get(email=user.email)
    user_points = UserPoint.objects.filter(user=user_account)
    price_listing_count = user_points.filter(points_action__activity_type__contains=activity_type).count()
    return price_listing_count

# Check if UserPoint contains any activity_type containing the string 'Price Listing'
def is_first_price_listing(user):
    if price_listing_count(user, 'Price Listing') < 1:
        return True
    else:
        return False

def is_10th_price_listing(user):
    if price_listing_count(user, 'Price Listing') == 9:
        return True
    else:
        return False

def is_50th_price_listing(user):
    if price_listing_count(user, 'Price Listing') == 49:
        return True
    else:
        return False

def is_100th_price_listing(user):
    if price_listing_count(user, 'Price Listing') == 99:
        return True
    else:
        return False

def is_200th_price_listing(user):
    if price_listing_count(user, 'Price Listing') == 199:
        return True
    else:
        return False

def is_500th_price_listing(user):
    if price_listing_count(user, 'Price Listing') == 499:
        return True
    else:
        return False

def is_1000th_price_listing(user):
    if price_listing_count(user, 'Price Listing') == 999:
        return True
    else:
        return False


########################
# Awards for user game conditions
########################

def new_price_checks(user):
    if is_first_price_listing(user):
        return awards.apply_award(user, 'First Price Listing')
    elif is_10th_price_listing(user):
        return awards.apply_award(user, '10th Price Listing')
    elif is_50th_price_listing(user):
        return awards.apply_award(user, '50th Price Listing')
    elif is_100th_price_listing(user):
        return awards.apply_award(user, '100th Price Listing')
    elif is_200th_price_listing(user):
        return awards.apply_award(user, '200th Price Listing')
    elif is_500th_price_listing(user):
        return awards.apply_award(user, '500th Price Listing')
    elif is_1000th_price_listing(user):
        return awards.apply_award(user, '1000th Price Listing')
    else:
        return awards.apply_award(user, 'New Price Listing')

