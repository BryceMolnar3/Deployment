from django.urls import path
from . import views

urlpatterns = [
    path('manuscripts/', views.get_manuscripts, name='get_manuscripts'),
    path('manuscripts/search/', views.search_manuscripts, name='search_manuscripts'),
    path('versions/', views.get_versions, name='get_versions'),
    path('versions/add/', views.add_version, name='add_version'),
    path('compare/', views.compare_texts, name='compare_texts'),
    path('documents/', views.get_documents, name='get_documents'),
    path('documents/search/', views.search_documents, name='search_documents'),
] 