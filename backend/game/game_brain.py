"""
Game Brain that uses app utils to perform gamification actions.
Example usage: app/game/utils/user.py for user related gamification actions.
"""
from game.utils import user as user_game_checks
from game.utils import price as price_game_checks
from core.models import User


class GameBrain:
    def __init__(self, user, action_type, data):
        self.user = user
        self.action_type = action_type
        self.data = data

    def user_action_check(self):
        """Checks if the decorated view is a Login Action"""
        point_actions = []
        if self.action_type == 'login':
            point_actions.append(user_game_checks.login_checks(user=self.user))
            user_update = User.objects.get(email=self.user.email)
            user_update.number_logins += 1
            user_update.save()
            return point_actions
        # Check if the decorated view is Managing the User
        elif self.action_type == 'profile_update':
            point_actions.append(user_game_checks.profile_update_checks(user=self.user, request=self.data))
            return point_actions
        # Check if the decorated view is Managing the user Upload Profile Image
        elif self.action_type == 'profile_picture_update':
            point_actions.append(user_game_checks.user_image_checks(user=self.user))
            return point_actions


    def price_action_check(self):
        """Checks if the decorated view is a Price Viewset Action"""
        point_actions = []
        if self.action_type == 'price_create':
            point_actions.append(price_game_checks.new_price_checks(user=self.user))
            return point_actions