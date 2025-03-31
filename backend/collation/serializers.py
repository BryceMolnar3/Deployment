from rest_framework import serializers
from .models import TextVersion, Manuscript, Verse

class VerseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Verse
        fields = ['verse_number', 'verse_text']

class ManuscriptSerializer(serializers.ModelSerializer):
    verses = VerseSerializer(many=True, read_only=True)

    class Meta:
        model = Manuscript
        fields = '__all__'

class TextVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextVersion
        fields = '__all__'
