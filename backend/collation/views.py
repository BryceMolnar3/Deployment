from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import TextVersion, Manuscript
from .serializers import TextVersionSerializer, ManuscriptSerializer
from .collate import collate_texts

@api_view(['GET'])
def get_manuscripts(request):
    manuscripts = Manuscript.objects.all()
    serializer = ManuscriptSerializer(manuscripts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def search_manuscripts(request):
    query = request.GET.get('q', '').lower()
    manuscripts = Manuscript.objects.filter(
        Q(ms_id__icontains=query) |
        Q(sigla__icontains=query) |
        Q(other_names__icontains=query) |
        Q(place_of_origin__icontains=query) |
        Q(date__icontains=query) |
        Q(materials__icontains=query) |
        Q(format_description__icontains=query)
    )
    serializer = ManuscriptSerializer(manuscripts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_versions(request):
    versions = TextVersion.objects.all()
    serializer = TextVersionSerializer(versions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_version(request):
    serializer = TextVersionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def compare_texts(request):
    texts = request.data.get("texts", [])
    result = collate_texts(texts)
    return Response({"collation": result})

