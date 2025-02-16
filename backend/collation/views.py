from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import TextVersion
from .serializers import TextVersionSerializer
from .collate import collate_texts

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

