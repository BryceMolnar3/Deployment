from django.urls import path
from . import views

urlpatterns = [
    # API endpoints for documents
    path('api/documents/', views.get_documents, name='get_documents'),
    path('api/documents/search/', views.search_documents, name='search_documents'),
    path('api/documents/create/', views.create_document, name='create_document'),
    path('api/documents/draft/', views.create_draft, name='create_draft'),
    path('api/documents/<str:filename>/update', views.update_document, name='update_document'),
    path('api/documents/<str:filename>/update', views.update_manuscript, name='update_manuscript'),
    path('api/documents/<str:filename>', views.get_document, name='get_document'),
    
    # Legacy endpoints (can be removed if not used)
    path('manuscripts/', views.get_manuscripts, name='get_manuscripts'),
    path('manuscripts/search/', views.search_manuscripts, name='search_manuscripts'),
    path('versions/', views.get_versions, name='get_versions'),
    path('versions/add/', views.add_version, name='add_version'),
] 