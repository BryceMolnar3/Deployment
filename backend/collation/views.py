from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import TextVersion, Manuscript, WordComparison, ComparisonResult
from .serializers import TextVersionSerializer, ManuscriptSerializer, WordComparisonSerializer, ComparisonResultSerializer, ComparisonResultWithDetailsSerializer, VerseSerializer
from pymongo import MongoClient
from bson.json_util import dumps
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from bson import ObjectId
from .collate import collate_texts, extract_differences
from .phylogenetic import PhylogeneticTreeBuilder
import re



# MongoDB connection
client = MongoClient(settings.MONGODB_URI_FULL)
db = client.document_db
documents = db['documents']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def private_view(request):
    return Response({"message": "You are logged in!"})



@api_view(['DELETE'])
def delete_comparison(request, comparison_id):
    """
    Delete a saved comparison (ComparisonResult).
    """
    try:
        # Find the ComparisonResult by ID
        comparison = get_object_or_404(ComparisonResult, id=comparison_id)
        comparison.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -- Everything below is your existing code, unchanged except for the snippet above. --

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def private_view(request):
    return Response({"message": "You are logged in!"})

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
def get_all_comparisons(request):
    """Return all saved ComparisonResult objects, including nested WordComparison."""
    comparisons = ComparisonResult.objects.select_related("word_comparison").all()
    serializer = ComparisonResultWithDetailsSerializer(comparisons, many=True)
    return Response(serializer.data)



client = MongoClient(settings.MONGODB_URI_FULL)
db = client.document_db
documents = db['documents']

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
        # Get all non-draft documents from MongoDB
        cursor = documents.find({'$or': [{'is_draft': {'$exists': False}}, {'is_draft': False}]})
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
        # Construct the full filename as stored in the DB
        db_filename = f"{filename}.docx"
        
        # Find document by the full filename
        document = documents.find_one({'filename': db_filename})
        
        if document:
            document['_id'] = str(document['_id'])
            return JsonResponse(document)
        else:
            # Log which filename was not found for easier debugging
            print(f"INFO: Document not found with filename: {db_filename}") 
            return JsonResponse({'error': f'Document with sigla {filename} not found'}, status=404)
    except Exception as e:
        # Log the exception for easier debugging
        print(f"ERROR in get_document for filename {filename}: {str(e)}")
        import traceback
        traceback.print_exc() # Print full traceback to logs
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
        
        # Only block if a non-draft document with this filename exists
        existing_doc = documents.find_one({'filename': document_data['filename'], '$or': [{'is_draft': {'$exists': False}}, {'is_draft': False}]})
        if existing_doc:
            return JsonResponse({'error': 'Document with this filename already exists'}, status=400)
        
        # Handle image upload if present
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            import os
            from django.conf import settings
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
            image_path = os.path.join(settings.MEDIA_ROOT, image_file.name)
            with open(image_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
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
            import os
            from django.conf import settings
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
            image_path = os.path.join(settings.MEDIA_ROOT, image_file.name)
            with open(image_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
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
@require_http_methods(["PUT", "POST"])
def update_document(request, filename):
    try:
        print("=== DEBUG: update_document called ===")
        print("request.method:", request.method)
        print("request.POST:", dict(request.POST))
        print("request.FILES:", request.FILES)
        document_data = json.loads(request.POST.get('document', '{}'))
        print("document_data:", document_data)
        # Remove _id field if present to avoid MongoDB immutable field error
        if '_id' in document_data:
            del document_data['_id']
        
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

@csrf_exempt
@api_view(['DELETE'])
def delete_manuscript(request, filename):
    try:
        # Find the document
        document = documents.find_one({'filename': filename})
        if not document:
            return Response({'error': 'Document not found'}, status=404)
        
        # Delete the document
        result = documents.delete_one({'filename': filename})
        
        if result.deleted_count == 0:
            return Response({'error': 'Failed to delete document'}, status=500)
        
        return Response(status=204)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
@api_view(['GET'])
def get_verses(request, ms_id):
    """Fetch all verses for a specific manuscript."""
    try:
        manuscript = documents.find_one({"_id": ObjectId(ms_id)})
        
        if not manuscript:
            return JsonResponse({"error": "Manuscript not found"}, status=404)

        verses = manuscript.get("verses", [])  # Get verses list or empty list if not found
        verse_data = [{"verse_number": verse[0], "verse_text": verse[1]} for verse in verses]

        return JsonResponse({"manuscript_id": ms_id, "verses": verse_data}, safe=False)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def get_verse(request, ms_id, verse_number):
    """Fetch a specific verse from a manuscript."""
    try:
        manuscript = documents.find_one({"_id": ObjectId(ms_id)})
        if not manuscript:
            return JsonResponse({"error": "Manuscript not found"}, status=404)

        verses = manuscript.get("verses", [])

        # Find the verse by its number
        verse = next(({"verse_number": v[0], "verse_text": v[1]} for v in verses if v[0] == verse_number), None)
        
        if not verse:
            return JsonResponse({"error": "Verse not found"}, status=404)

        return JsonResponse(verse, safe=False)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    
@api_view(['GET'])
def collate_manuscripts(request):
    """Collate verses from all available manuscripts in the database."""
    try:
        # Get all manuscript IDs and their sigla/filename
        all_manuscripts = list(documents.find({}, {"_id": 1, "sigla": 1, "filename": 1, "verses": 1}))
        manuscript_ids = [str(doc["_id"]) for doc in all_manuscripts]
        manuscript_id_to_sigla = {str(doc["_id"]): (doc.get("sigla") or doc.get("filename") or f"Manuscript-{str(doc['_id'])[-6:]}") for doc in all_manuscripts}

        if len(manuscript_ids) < 2:
            return JsonResponse({"error": "At least two manuscripts are required for comparison."}, status=400)

        collated_verses = {}
        verse_manuscript_ids = {}  # Track manuscript order for each verse

        # Fetch verses from each manuscript
        for ms_id in manuscript_ids:
            manuscript = documents.find_one({"_id": ObjectId(ms_id)})
            if not manuscript:
                continue  # Skip if not found

            verses = manuscript.get("verses", [])
            for verse in verses:
                if not isinstance(verse, dict) or 'verse_number' not in verse or 'verse_text' not in verse:
                    continue
                verse_number = verse['verse_number']
                verse_text = verse['verse_text']
                if verse_number not in collated_verses:
                    collated_verses[verse_number] = []
                    verse_manuscript_ids[verse_number] = []
                collated_verses[verse_number].append(verse_text)
                verse_manuscript_ids[verse_number].append(ms_id)

        # Collate each verse
        collated_results = {}
        witness_maps = {}  # NEW: store witness-to-sigla mapping per verse
        for verse_number, texts in collated_verses.items():
            try:
                if len(texts) > 1:
                    collation_result = collate_texts(texts)
                    if collation_result:
                        collated_results[verse_number] = collation_result
                        # Build witness map for this verse
                        witness_map = {}
                        for i, ms_id in enumerate(verse_manuscript_ids[verse_number]):
                            sigla = manuscript_id_to_sigla.get(ms_id, f"Manuscript-{ms_id[-6:]}")
                            witness_map[f"w{i+1}"] = sigla
                        witness_maps[verse_number] = witness_map
            except Exception as e:
                collated_results[verse_number] = {"error": f"Collation failed: {str(e)}"}

        return JsonResponse({
            "differences": extract_differences(collated_results) or {},
            "witness_maps": witness_maps
        }, safe=False)

    except Exception as e:
        import traceback
        print("=== ERROR in collate_manuscripts ===")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
def save_comparison(request):
    if request.method == 'POST':
        # Extract data from the request body
        data = request.data
        # Create WordComparison instance
        word_comparison_data = data.get("wordComparison", {})
        word_comparison_serializer = WordComparisonSerializer(data=word_comparison_data)

        is_significant = data.get("isSignificant", False)
        if not is_significant:
            return Response({"message": "Comparison is not significant, not saved."}, status=status.HTTP_200_OK)
        
        if word_comparison_serializer.is_valid():
            # Save WordComparison instance to the database
            word_comparison_instance = word_comparison_serializer.save()

            timestamp = datetime.now().isoformat()

            # Create ComparisonResult instance
            comparison_result_data = {
                "word_comparison": word_comparison_instance.id,
                "is_significant": is_significant,
                "variation_type": data.get("variationType", ""),
                "timestamp": timestamp,
            }
            comparison_result_serializer = ComparisonResultSerializer(data=comparison_result_data)
            
            if comparison_result_serializer.is_valid():
                # Save ComparisonResult instance to the database
                comparison_result_instance = comparison_result_serializer.save()

                return Response(comparison_result_serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(comparison_result_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(word_comparison_serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
def generate_phylogenetic_tree(request):
    """
    Generate a phylogenetic tree from the manuscripts involved in significant
    differences (ComparisonResult where is_significant=True).

    Query Parameters:
        method (str): The clustering method to use. Currently only 'average' is supported.
        format2 (str): The output format. Supported values: 'base64', 'png', 'svg', 'newick'.

    Returns:
        - For 'base64', 'png', 'svg': The tree image in the requested format
        - For 'newick': A JSON response with the Newick format tree string

    Error Responses:
        - 400: Bad Request - Invalid parameters
        - 500: Internal Server Error - Tree generation failed
    """
    # Validate method parameter
    method = request.GET.get('method', 'average')
    if method != 'average':
        return JsonResponse({
            "error": f"Unsupported method: {method}. Only 'average' is currently supported."
        }, status=400)

    # Validate output format
    output_format = request.GET.get('format2', 'base64')
    if output_format not in ['base64', 'png', 'svg', 'newick']:
        return JsonResponse({
            "error": f"Unsupported format: {output_format}. Supported formats are: base64, png, svg, newick"
        }, status=400)

    try:
        print("\n=== GENERATING PHYLOGENETIC TREE (BASED ON SIGNIFICANT DIFFERENCES) ===")
        print(f"Method: {method}, Format: {output_format}")

        tree_builder = PhylogeneticTreeBuilder()

        if output_format == 'newick':
            newick_tree = tree_builder.generate_cluster_tree_image(output_format='newick')
            return JsonResponse({
                "newick_tree": newick_tree
            })

        elif output_format == 'base64':
            tree_image = tree_builder.generate_cluster_tree_image(output_format='base64')
            return JsonResponse({
                "tree_image": tree_image
            })

        else:  # png or svg
            tree_image = tree_builder.generate_cluster_tree_image(output_format=output_format)
            mime_type = f'image/{output_format}'
            return HttpResponse(tree_image, content_type=mime_type)

    except ValueError as e:
        # Handle validation errors
        return JsonResponse({
            "error": str(e)
        }, status=400)
    except Exception as e:
        # Log the full error for debugging
        import traceback
        traceback.print_exc()
        # Return a sanitized error message to the client
        return JsonResponse({
            "error": "An error occurred while generating the phylogenetic tree. Please try again later."
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_drafts(request):
    try:
        # Get all documents marked as drafts
        drafts = list(documents.find({'is_draft': True}))
        
        # Convert ObjectId to string for JSON serialization
        for draft in drafts:
            draft['_id'] = str(draft['_id'])
        
        return JsonResponse(drafts, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def replace_draft(request):
    try:
        import os
        from django.conf import settings
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
        
        # Find the existing draft
        existing_doc = documents.find_one({'filename': document_data['filename'], 'is_draft': True})
        if not existing_doc:
            return JsonResponse({'error': 'Draft not found'}, status=404)
        
        # Handle image upload if present
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
            image_path = os.path.join(settings.MEDIA_ROOT, image_file.name)
            with open(image_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
            document_data['image_filename'] = image_file.name
        else:
            # If no image is uploaded, remove image_filename if it exists
            if 'image_filename' in document_data:
                del document_data['image_filename']
            # If the old draft had an image, delete the file from MEDIA_ROOT
            if existing_doc.get('image_filename'):
                image_path = os.path.join(settings.MEDIA_ROOT, existing_doc['image_filename'])
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                    except Exception as e:
                        print(f"Warning: Could not delete old image file: {image_path}. Error: {e}")
        
        # Add draft flag to the document
        document_data['is_draft'] = True
        
        # Replace the existing draft
        result = documents.replace_one(
            {'filename': document_data['filename'], 'is_draft': True},
            document_data
        )
        
        if result.modified_count == 0:
            return JsonResponse({'error': 'Failed to replace draft'}, status=500)
        
        # Get the updated document
        updated_document = documents.find_one({'filename': document_data['filename']})
        updated_document['_id'] = str(updated_document['_id'])
        
        return JsonResponse(updated_document, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_draft(request, filename):
    try:
        # Find the draft
        draft = documents.find_one({'filename': filename, 'is_draft': True})
        if not draft:
            return JsonResponse({'error': 'Draft not found'}, status=404)
        # Delete the draft
        result = documents.delete_one({'filename': filename, 'is_draft': True})
        if result.deleted_count == 0:
            return JsonResponse({'error': 'Failed to delete draft'}, status=500)
        return JsonResponse({'message': 'Draft deleted successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)