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
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# MongoDB connection
client = MongoClient('localhost', 27017)
db = client.document_db
documents = db['documents']

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

@require_http_methods(["GET"])
def get_documents(request):
    try:
        # Get all documents from MongoDB
        cursor = documents.find()
        # Convert cursor to list and then to JSON
        documents_list = list(cursor)
        # Convert ObjectId to string for JSON serialization
        for doc in documents_list:
            doc['_id'] = str(doc['_id'])
        return JsonResponse(documents_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def search_documents(request):
    try:
        query = request.GET.get('q', '')
        # Search in MongoDB
        cursor = documents.find({
            '$or': [
                {'metadata.MS ID:': {'$regex': query, '$options': 'i'}},
                {'metadata.Other Names:': {'$regex': query, '$options': 'i'}},
                {'metadata.Date:': {'$regex': query, '$options': 'i'}},
                {'metadata.Origin:': {'$regex': query, '$options': 'i'}}
            ]
        })
        # Convert cursor to list and then to JSON
        documents_list = list(cursor)
        # Convert ObjectId to string for JSON serialization
        for doc in documents_list:
            doc['_id'] = str(doc['_id'])
        return JsonResponse(documents_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def get_document(request, filename):
    try:
        # Find document by filename
        document = documents.find_one({'filename': filename})
        if document:
            # Convert ObjectId to string for JSON serialization
            document['_id'] = str(document['_id'])
            return JsonResponse(document)
        else:
            return JsonResponse({'error': 'Document not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def create_document(request):
    try:
        # Get the document data from the form
        document_data = json.loads(request.POST.get('document', '{}'))
        
        # Validate metadata field names
        if 'metadata' in document_data:
            # Replace any dots in field names with spaces
            metadata = document_data['metadata']
            cleaned_metadata = {}
            for key, value in metadata.items():
                cleaned_key = key.replace('.', ' ').strip()
                cleaned_metadata[cleaned_key] = value
            document_data['metadata'] = cleaned_metadata
        
        # Check if document with same filename already exists
        existing_doc = documents.find_one({'filename': document_data['filename']})
        if existing_doc:
            return JsonResponse({'error': 'Document with this filename already exists'}, status=400)
        
        # Handle image upload if present
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            # Here you would typically save the image to a file storage system
            # For now, we'll just store the filename
            document_data['image_filename'] = image_file.name
        
        # Insert new document
        result = documents.insert_one(document_data)
        
        # Get the inserted document
        new_document = documents.find_one({'_id': result.inserted_id})
        new_document['_id'] = str(new_document['_id'])
        
        return JsonResponse(new_document, status=201)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def create_draft(request):
    try:
        # Get the document data from the form
        document_data = json.loads(request.POST.get('document', '{}'))
        
        # Validate metadata field names
        if 'metadata' in document_data:
            # Replace any dots in field names with spaces
            metadata = document_data['metadata']
            cleaned_metadata = {}
            for key, value in metadata.items():
                cleaned_key = key.replace('.', ' ').strip()
                cleaned_metadata[cleaned_key] = value
            document_data['metadata'] = cleaned_metadata
        
        # Check if draft with same filename already exists
        existing_doc = documents.find_one({'filename': document_data['filename']})
        if existing_doc:
            return JsonResponse({'error': 'Document with this filename already exists'}, status=400)
        
        # Handle image upload if present
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            # Here you would typically save the image to a file storage system
            # For now, we'll just store the filename
            document_data['image_filename'] = image_file.name
        
        # Add draft flag to the document
        document_data['is_draft'] = True
        
        # Insert new draft document
        result = documents.insert_one(document_data)
        
        # Get the inserted document
        new_document = documents.find_one({'_id': result.inserted_id})
        new_document['_id'] = str(new_document['_id'])
        
        return JsonResponse(new_document, status=201)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_document(request, filename):
    try:
        # Get the document data from the form
        document_data = json.loads(request.POST.get('document', '{}'))
        
        # Find the existing document
        existing_doc = documents.find_one({'filename': filename})
        if not existing_doc:
            return JsonResponse({'error': 'Document not found'}, status=404)
        
        # Handle image upload if present
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            # Save the image to the media directory
            import os
            from django.conf import settings
            
            # Create media directory if it doesn't exist
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
            
            # Save the image
            image_path = os.path.join(settings.MEDIA_ROOT, image_file.name)
            with open(image_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
            
            # Update image filename in document data
            document_data['image_filename'] = image_file.name
        
        # Update the document
        result = documents.update_one(
            {'filename': filename},
            {'$set': document_data}
        )
        
        if result.modified_count == 0:
            return JsonResponse({'error': 'No changes made to document'}, status=400)
        
        # Get the updated document
        updated_document = documents.find_one({'filename': filename})
        updated_document['_id'] = str(updated_document['_id'])
        
        return JsonResponse(updated_document)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['PUT'])
def update_manuscript(request, filename):
    try:
        # Get the document data from the request
        document_data = request.data
        
        # Find the existing document
        existing_doc = documents.find_one({'filename': filename})
        if not existing_doc:
            return Response({'error': 'Document not found'}, status=404)
        
        # Remove _id field if present to avoid MongoDB immutable field error
        if '_id' in document_data:
            del document_data['_id']
        
        # Create updated document by merging existing data with updates
        updated_data = {**existing_doc, **document_data}
        del updated_data['_id']  # Remove _id from the merged data
        
        # Validate verses data if present
        if 'verses' in document_data:
            # Ensure verses are properly formatted
            for verse in document_data['verses']:
                if not isinstance(verse.get('verse_number'), int):
                    return Response({'error': 'Invalid verse number format'}, status=400)
                if not isinstance(verse.get('verse_text'), str):
                    return Response({'error': 'Invalid verse text format'}, status=400)
        
        # Update the document
        result = documents.update_one(
            {'filename': filename},
            {'$set': updated_data}
        )
        
        if result.modified_count == 0:
            return Response({'error': 'No changes made to document'}, status=400)
        
        # Get the updated document
        updated_document = documents.find_one({'filename': filename})
        updated_document['_id'] = str(updated_document['_id'])
        
        return Response(updated_document)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

