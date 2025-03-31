from django.urls import path, include
from . import views

urlpatterns = [
    path('api/', include('collation.urls')),
    path('manuscripts/', views.get_manuscripts, name='get_manuscripts'),
    path('manuscripts/search/', views.search_manuscripts, name='search_manuscripts'),
    path('versions/', views.get_versions, name='get_versions'),
    path('versions/add/', views.add_version, name='add_version'),
    path('compare/', views.compare_texts, name='compare_texts'),
] 