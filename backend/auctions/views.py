from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Auction, Bid
from .serializers import AuctionCreateSerializer, AuctionDetailSerializer, AuctionSerializer, PlaceBidSerializer

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", ""))
        if len(username) < 3:
            return Response({"username": ["Use at least 3 characters."]}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({"password": ["Use at least 8 characters."]}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username__iexact=username).exists():
            return Response({"username": ["That username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username}, status=status.HTTP_201_CREATED)


class SignInView(ObtainAuthToken):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token = Token.objects.select_related("user").get(key=response.data["token"])
        return Response({"token": token.key, "username": token.user.username})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username,
            "watchlist": list(request.user.watched_auctions.values_list("id", flat=True)),
        })


class AuctionListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        now = timezone.now()
        queryset = Auction.objects.filter(visibility=Auction.Visibility.PUBLISHED).select_related("seller").annotate(_bid_count=Count("bids"))
        category = self.request.query_params.get("category")
        state = self.request.query_params.get("state", "live")
        search = self.request.query_params.get("q", "").strip()
        if category and category != "all":
            queryset = queryset.filter(category=category)
        if state == "live":
            queryset = queryset.filter(starts_at__lte=now, ends_at__gt=now)
        elif state == "upcoming":
            queryset = queryset.filter(starts_at__gt=now)
        elif state == "ended":
            queryset = queryset.filter(ends_at__lte=now)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search) | Q(category__icontains=search))
        if self.request.user.is_authenticated and self.request.query_params.get("watched") == "1":
            queryset = queryset.filter(watchers=self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AuctionCreateSerializer
        return AuctionSerializer

    def perform_create(self, serializer):
        serializer.save()


class AuctionDetailView(generics.RetrieveAPIView):
    queryset = Auction.objects.filter(visibility=Auction.Visibility.PUBLISHED).select_related("seller").prefetch_related("bids__bidder")
    serializer_class = AuctionDetailSerializer
    permission_classes = [permissions.AllowAny]


class PlaceBidView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        serializer = PlaceBidSerializer(data=request.data, context={"request": request, "auction_id": pk})
        serializer.is_valid(raise_exception=True)
        bid = serializer.save()
        return Response({"id": bid.id, "amount": bid.amount, "created_at": bid.created_at}, status=status.HTTP_201_CREATED)


class WatchlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            auction = Auction.objects.get(pk=pk, visibility=Auction.Visibility.PUBLISHED)
        except Auction.DoesNotExist:
            return Response({"detail": "Auction not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.watched_auctions.filter(pk=pk).exists():
            request.user.watched_auctions.remove(auction)
            watching = False
        else:
            request.user.watched_auctions.add(auction)
            watching = True
        return Response({"watching": watching})


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(_request):
    return Response({"status": "ok"})
