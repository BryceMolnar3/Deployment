from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import TextVersion, Manuscript
from .serializers import TextVersionSerializer, ManuscriptSerializer
from .collate import collate_texts
from pymongo import MongoClient
from bson.json_util import dumps
import json

# MongoDB connection
client = MongoClient('localhost', 27017)
db = client.document_db

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

@api_view(['GET'])
def get_documents(request):
    try:
        documents = list(db.documents.find())
        # Convert ObjectId to string for JSON serialization
        for doc in documents:
            doc['_id'] = str(doc['_id'])
        return Response(documents)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def search_documents(request):
    try:
        query = request.GET.get('q', '').lower()
        documents = list(db.documents.find({
            '$or': [
                {'filename': {'$regex': query, '$options': 'i'}},
                {'metadata.MS ID:': {'$regex': query, '$options': 'i'}},
                {'metadata.Other Names:': {'$regex': query, '$options': 'i'}},
                {'metadata.Origin:': {'$regex': query, '$options': 'i'}},
                {'metadata.Date:': {'$regex': query, '$options': 'i'}}
            ]
        }))
        # Convert ObjectId to string for JSON serialization
        for doc in documents:
            doc['_id'] = str(doc['_id'])
        return Response(documents)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_document(request, filename):
    try:
        document = db.documents.find_one({'filename': filename})
        if not document:
            return Response({'error': 'Document not found'}, status=404)
        
        # Convert ObjectId to string for JSON serialization
        document['_id'] = str(document['_id'])
        return Response(document)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

