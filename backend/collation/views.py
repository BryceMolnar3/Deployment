from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
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
from .models import TextVersion
from .serializers import TextVersionSerializer, VerseSerializer
from .collate import collate_texts
from django.http import JsonResponse, HttpResponse
from pymongo import MongoClient
from rest_framework import status
from django.conf import settings
from bson import ObjectId
from .collate import collate_texts, extract_differences
from .phylogenetic import PhylogeneticTreeBuilder
import json
import re

client = MongoClient('localhost', 27017)
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
        # Get all manuscript IDs
        all_manuscripts = list(documents.find({}, {"_id": 1}))
        manuscript_ids = [str(doc["_id"]) for doc in all_manuscripts]

        if len(manuscript_ids) < 2:
            return JsonResponse({"error": "At least two manuscripts are required for comparison."}, status=400)

        collated_verses = {}

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
                collated_verses[verse_number].append(verse_text)

        # Collate each verse
        collated_results = {}
        for verse_number, texts in collated_verses.items():
            try:
                print(f'--- Collating these texts for verse {verse_number} ---')
                for t in texts:
                    print(repr(t))
                # Only collate if we have multiple manuscripts
                if len(texts) > 1:
                    # Perform collation
                    collation_result = collate_texts(texts)
                    print(f'Collation result for verse {verse_number}:', collation_result)
                    if collation_result:
                        collated_results[verse_number] = collation_result
                else:
                    print(f'Skipping verse {verse_number}: Only {len(texts)} manuscript version')
            except Exception as e:
                print(f"Error collating verse {verse_number}: {e}")
                collated_results[verse_number] = {"error": f"Collation failed: {str(e)}"}

        return JsonResponse({"differences": extract_differences(collated_results) or {}}, safe=False)

    except Exception as e:
        import traceback
        print("=== ERROR in collate_manuscripts ===")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def generate_phylogenetic_tree(request):
    """Generate a phylogenetic tree from all available manuscripts."""
    method = request.GET.get('method', 'average')
    output_format = request.GET.get('format2', 'base64')
    try:
        print("\n=== GENERATING PHYLOGENETIC TREE ===")
        print(f"Method: {method}, Format: {output_format}")
        
        # Get all manuscript IDs from the database
        all_manuscripts = list(documents.find({}))
        manuscript_ids = [str(doc["_id"]) for doc in all_manuscripts]
        
        all_manuscripts = list(documents.find({}))
        for doc in all_manuscripts:
            print(f"📄 ID: {doc['_id']}, filename: {doc.get('filename')}, verses: {len(doc.get('verses', []))}")


        print(f"Found {len(manuscript_ids)} manuscripts")
        print(f"Manuscript IDs: {manuscript_ids}")
        
        if len(manuscript_ids) < 3:
            print("ERROR: Not enough manuscripts (minimum 3 required)")
            return JsonResponse({"error": "At least three manuscripts are required in the database to build a phylogenetic tree."}, status=400)
        
        # First, collate the manuscripts
        collated_verses = {}
        manuscript_verse_counts = {ms_id: 0 for ms_id in manuscript_ids}

        # Fetch verses from each manuscript
        print("\n=== COLLECTING VERSES FROM MANUSCRIPTS ===")
        for i, ms_id in enumerate(manuscript_ids):
            manuscript = documents.find_one({"_id": ObjectId(ms_id)})
            
            if not manuscript:
                print(f"WARNING: Manuscript {ms_id} not found in database")
                continue
            
            ms_name = manuscript.get('filename', f"Manuscript-{ms_id[-6:]}")
            print(f"\nProcessing manuscript {i+1}/{len(manuscript_ids)}: {ms_name}")
            
            verses = manuscript.get("verses", [])
            print(f"  Found {len(verses)} verses in manuscript")
            
            for verse in verses:
                if not isinstance(verse, dict) or 'verse_number' not in verse or 'verse_text' not in verse:
                    continue
                verse_number = verse['verse_number']
                verse_text = verse['verse_text']
                if verse_number not in collated_verses:
                    collated_verses[verse_number] = []
                collated_verses[verse_number].append({
                    "text": verse_text,
                    "ms_id": ms_id
                })
                
                manuscript_verse_counts[ms_id] += 1
            
            print(f"  Added {manuscript_verse_counts[ms_id]} verses from this manuscript")

        # Summarize verse collection
        print("\n=== VERSE COLLECTION SUMMARY ===")
        total_unique_verses = len(collated_verses)
        print(f"Total unique verse numbers: {total_unique_verses}")
        
        # Count how many manuscripts contain each verse
        verse_coverage = {}
        for verse_num, verse_data in collated_verses.items():
            verse_coverage[verse_num] = len(verse_data)
        
        # Print verses with the most and least coverage
        sorted_verses = sorted(verse_coverage.items(), key=lambda x: x[1], reverse=True)
        print(f"Top 5 verses by manuscript coverage:")
        for verse_num, count in sorted_verses[:5]:
            print(f"  Verse {verse_num}: {count}/{len(manuscript_ids)} manuscripts")
            
        print(f"Bottom 5 verses by manuscript coverage:")
        for verse_num, count in sorted_verses[-5:]:
            print(f"  Verse {verse_num}: {count}/{len(manuscript_ids)} manuscripts")

        # Collate each verse
        print("\n=== COLLATING VERSES ===")
        collated_results = {}

        def clean_text(text):
            # Lowercase
            text = text.lower()
            # Remove all punctuation including (), [], etc.
            text = re.sub(r'[^\w\s]', '', text)
            return text

        for verse_number, verse_data in collated_verses.items():
            # Clean the text
            for item in verse_data:
                item["text"] = clean_text(item["text"])
        for verse_number, verse_data in collated_verses.items():
            try:
                # Only collate if we have multiple manuscripts
                if len(verse_data) > 1:
                    # Extract just the text for collation
                    texts = [item["text"] for item in verse_data]
                    ms_ids_for_verse = [item["ms_id"] for item in verse_data]
                    
                    # Debug output for a few verses
                    if len(collated_results) < 2 or verse_number in ['1', '2', '10']:
                        print(f"\nCollating verse {verse_number} with {len(texts)} manuscript versions:")
                        for i, (text, ms_id) in enumerate(zip(texts, ms_ids_for_verse)):
                            ms_name = next((m.get('filename', f"MS-{ms_id[-6:]}") for m in all_manuscripts if str(m["_id"]) == ms_id), f"MS-{ms_id[-6:]}")
                            print(f"  MS {i+1}: '{text[:50]}{'...' if len(text) > 50 else ''}' ({ms_name})")
                    
                    # Only collate if texts are different
                    if len(set(texts)) > 1:
                        # Perform collation
                        collation_result = collate_texts(texts)
                        if collation_result:
                            collated_results[verse_number] = collation_result
                            
                            # Debug collation structure for first verse
                            if verse_number == '1':
                                print("\nSample collation result structure:")
                                if isinstance(collation_result, str):
                                    collation_json = json.loads(collation_result)
                                else:
                                    collation_json = collation_result
                                print(f"  Witnesses: {collation_json.get('witnesses', [])}")
                                print(f"  Table columns: {len(collation_json.get('table', []))}")
                                
                                # Print a sample of the alignment table
                                sample_table = collation_json.get('table', [])[:3]
                                for i, column in enumerate(sample_table):
                                    print(f"  Column {i+1} ({len(column)} cells):")
                                    for j, cell in enumerate(column):
                                        if cell:
                                            cell_text = json.dumps(cell)[:100] + ('...' if len(json.dumps(cell)) > 100 else '')
                                            print(f"    Cell {j}: {cell_text}")
                    else:
                        print(f"  Skipping verse {verse_number}: All {len(texts)} texts are identical")
                else:
                    print(f"  Skipping verse {verse_number}: Only {len(verse_data)} manuscript version")
            except Exception as e:
                print(f"ERROR collating verse {verse_number}: {e}")
                import traceback
                traceback.print_exc()
                
        print(f"\nSuccessfully collated {len(collated_results)} verses with differences")
        
        # Examine collated results
        print("\n=== COLLATION RESULTS SUMMARY ===")
        print(f"Verses with successful collation: {sorted(list(collated_results.keys()))}")
        
        # Build the phylogenetic tree
        print("\n=== BUILDING PHYLOGENETIC TREE ===")
        tree_builder = PhylogeneticTreeBuilder()
        
        # Get manuscript info
        manuscripts_info = tree_builder.get_manuscript_info(manuscript_ids)
        print(f"Retrieved info for {len(manuscripts_info)} manuscripts")
        
        # Debug manuscript info
        print("\nManuscript labels to be used in tree:")
        for ms_id, info in manuscripts_info.items():
            print(f"  {ms_id[-6:]}: {info['sigla']}")
        
        print(f"\nGenerating tree with {method} linkage method, {output_format} format")
        
        if output_format == 'newick':
            print("Creating Newick format tree...")
            newick_tree = tree_builder.create_newick_tree(collated_results, manuscript_ids, method=method)
            print(f"Newick tree result: {newick_tree[:100]}...")
            return JsonResponse({
                "newick_tree": newick_tree,
                "manuscript_count": len(manuscript_ids)
            })

        elif output_format == 'base64':
            print("Creating base64 encoded tree image...")
            tree_image = tree_builder.generate_tree(collated_results, manuscript_ids, method=method, output_format='base64')
            print(f"Generated base64 image of length {len(tree_image)}")
            return JsonResponse({
                "tree_image": tree_image,
                "manuscript_count": len(manuscript_ids)
            })

        elif output_format in ['png', 'svg']:
            print(f"Creating {output_format} image...")
            tree_image = tree_builder.generate_tree(collated_results, manuscript_ids, method=method, output_format=output_format)
            print(f"Generated {output_format} image of size {len(tree_image)} bytes")
            return HttpResponse(tree_image, content_type=f'image/{output_format}')

        else:
            print(f"ERROR: Unsupported format {output_format}")
            return JsonResponse({"error": f"Unsupported format: {output_format}"}, status=400)
        
    except Exception as e:
        print(f"CRITICAL ERROR in generate_phylogenetic_tree: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)