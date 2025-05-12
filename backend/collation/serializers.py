from rest_framework import serializers
from .models import TextVersion, Manuscript, Verse, WordComparison, ComparisonResult

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

class WordComparisonSerializer(serializers.ModelSerializer):
    verseNumber = serializers.IntegerField(source='verse_number')
    manuscriptSigla = serializers.CharField(source='manuscript_sigla')
    
    class Meta:
        model = WordComparison
        fields = ['verseNumber', 'word1', 'word2', 'position', 'manuscriptSigla']

class ComparisonResultSerializer(serializers.ModelSerializer):
    word_comparison = serializers.PrimaryKeyRelatedField(queryset=WordComparison.objects.all())
    isSignificant = serializers.BooleanField(source='is_significant')
    variationType = serializers.CharField(source='variation_type')

    class Meta:
        model = ComparisonResult
        fields = ['word_comparison', 'isSignificant', 'variationType', 'timestamp']

class ComparisonResultWithDetailsSerializer(serializers.ModelSerializer):
    """
    This serializer will give us a full nested WordComparison 
    instead of just a PK.
    """
    word_comparison = WordComparisonSerializer(read_only=True)

    class Meta:
        model = ComparisonResult
        fields = ['id', 'word_comparison', 'is_significant', 'variation_type', 'timestamp']
