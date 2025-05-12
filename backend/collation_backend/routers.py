class CollationRouter:
    """
    A router to control all database operations on models in the
    collation application, and core Django applications.
    """
    route_app_labels_mongodb = {'collation'} # Apps that should use MongoDB
    route_app_labels_default = {'auth', 'contenttypes', 'sessions', 'admin'} # Apps that should use default DB

    def db_for_read(self, model, **hints):
        """
        Attempts to read collation models go to mongodb.
        Attempts to read auth, contenttypes, etc. models go to default.
        """
        if model._meta.app_label in self.route_app_labels_mongodb:
            return 'mongodb'
        if model._meta.app_label in self.route_app_labels_default:
            return 'default'
        return None # Django will use 'default' if None is returned and no other router specifies

    def db_for_write(self, model, **hints):
        """
        Attempts to write collation models go to mongodb.
        Attempts to write auth, contenttypes, etc. models go to default.
        """
        if model._meta.app_label in self.route_app_labels_mongodb:
            return 'mongodb'
        if model._meta.app_label in self.route_app_labels_default:
            return 'default'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the collation app is involved with itself,
        or if both models are in the default group, or both in mongodb group.
        Restrict relations between mongodb apps and default apps if necessary,
        but for now, we allow if they are in the same db type.
        """
        db_obj1 = None
        db_obj2 = None

        if obj1._meta.app_label in self.route_app_labels_mongodb:
            db_obj1 = 'mongodb'
        elif obj1._meta.app_label in self.route_app_labels_default:
            db_obj1 = 'default'
        
        if obj2._meta.app_label in self.route_app_labels_mongodb:
            db_obj2 = 'mongodb'
        elif obj2._meta.app_label in self.route_app_labels_default:
            db_obj2 = 'default'

        if db_obj1 and db_obj2:
            return db_obj1 == db_obj2 # Relations allowed if they are destined for the same database
        
        # If one of the objects is not in either routed group, Django's default behavior might apply.
        # For cross-database relations, this would typically be False unless explicitly handled.
        # If you need specific cross-database relations (e.g. ForeignKey from collation model to User model),
        # you might need more sophisticated logic here or in your models (e.g. using unmanaged models or manual handling).
        # For now, we are keeping it simple: relations are fine if both models resolve to the same DB via this router.
        # If obj1 or obj2 is not in our explicit lists, Django might default to 'default' for them.
        # If one is in mongo_apps and other is not in default_apps (i.e. some other app),
        # this might return None, and then Django disallows by default.
        return None # Let Django decide or another router

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the collation app only appears in the 'mongodb' database.
        Make sure auth, contenttypes, etc. apps only appear in the 'default' database.
        """
        if app_label in self.route_app_labels_mongodb:
            return db == 'mongodb'
        if app_label in self.route_app_labels_default:
            return db == 'default'
        # For apps not in either list, don't migrate them with 'mongodb'
        # but allow them on 'default' (or let Django decide based on other routers or default behavior).
        if db == 'mongodb':
            return False 
        return None # None means Django's default behavior, which is to allow migration on 'default' for unrouted apps. 