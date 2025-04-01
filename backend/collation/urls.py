from django.urls import path
from . import views

urlpatterns = [
    path('manuscripts/', views.get_manuscripts, name='get_manuscripts'),
    path('manuscripts/search/', views.search_manuscripts, name='search_manuscripts'),
    path('versions/', views.get_versions, name='get_versions'),
    path('versions/add/', views.add_version, name='add_version'),
    path('documents/', views.get_documents, name='get_documents'),
    path('documents/search/', views.search_documents, name='search_documents'),
    path('documents/<str:filename>', views.get_document, name='get_document'),
    path('documents/<str:filename>/update', views.update_document, name='update_document'),
    path('documents/create/', views.create_document, name='create_document'),
    path('documents/draft/', views.create_draft, name='create_draft'),
] 