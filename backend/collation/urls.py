from django.urls import path
from . import views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    # API endpoints for documents
    path('api/documents/', views.get_documents, name='get_documents'),
    path('api/documents/search/', views.search_documents, name='search_documents'),
    path('api/documents/create/', views.create_document, name='create_document'),
    path('api/documents/draft/', views.create_draft, name='create_draft'),
    path('api/documents/<str:filename>/update-document', views.update_document, name='update_document'),
    path('api/documents/<str:filename>/update-manuscript', views.update_manuscript, name='update_manuscript'),
    path('api/documents/<str:filename>', views.get_document, name='get_document'),
    path('api/documents/<str:filename>/delete', views.delete_manuscript, name='delete_manuscript'),
    path('collate/', views.collate_manuscripts, name='collate_manuscripts'),
    path('versions/', views.get_versions, name='get_versions'),
    path('versions/add/', views.add_version, name='add_version'),
    path('verses/<str:ms_id>/', views.get_verses, name='get_verses'),
    path('verses/<str:ms_id>/<str:verse_number>/', views.get_verse, name='get_verse'),
    path('generate_phylogenetic_tree/', views.generate_phylogenetic_tree, name='generate_phylogenetic_tree'),
]

urlpatterns = format_suffix_patterns(urlpatterns, allowed=['json'])
