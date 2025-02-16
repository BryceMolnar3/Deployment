from rest_framework import serializers
from .models import TextVersion

class TextVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextVersion
        fields = '__all__'
