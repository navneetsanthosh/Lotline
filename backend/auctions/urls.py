from django.urls import path
from .views import AuctionDetailView, AuctionListView, MeView, PlaceBidView, RegisterView, SignInView, WatchlistView, health

urlpatterns = [
    path("health/", health, name="health"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", SignInView.as_view(), name="sign-in"),
    path("me/", MeView.as_view(), name="me"),
    path("auctions/", AuctionListView.as_view(), name="auctions"),
    path("auctions/<int:pk>/", AuctionDetailView.as_view(), name="auction-detail"),
    path("auctions/<int:pk>/bids/", PlaceBidView.as_view(), name="place-bid"),
    path("auctions/<int:pk>/watch/", WatchlistView.as_view(), name="watch-auction"),
]
