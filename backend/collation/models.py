from django.db import models

# Create your models here.
class TextVersion(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    version_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - v{self.version_number}"