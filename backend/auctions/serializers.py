from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import Auction, Bid

User = get_user_model()


class BidSerializer(serializers.ModelSerializer):
    bidder_name = serializers.CharField(source="bidder.get_username", read_only=True)

    class Meta:
        model = Bid
        fields = ["id", "amount", "created_at", "bidder_name"]


class AuctionSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.get_username", read_only=True)
    state = serializers.CharField(read_only=True)
    leading_bid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    next_bid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    bid_count = serializers.IntegerField(source="bids.count", read_only=True)
    is_watched = serializers.SerializerMethodField()

    class Meta:
        model = Auction
        fields = ["id", "title", "description", "category", "image_url", "starting_bid", "current_bid",
                  "bid_increment", "leading_bid", "next_bid", "starts_at", "ends_at", "state",
                  "seller_name", "bid_count", "is_watched"]
        read_only_fields = ["current_bid", "seller_name", "state"]

    def get_is_watched(self, auction):
        user = self.context["request"].user
        return user.is_authenticated and user.watched_auctions.filter(pk=auction.pk).exists()


class AuctionDetailSerializer(AuctionSerializer):
    recent_bids = serializers.SerializerMethodField()

    class Meta(AuctionSerializer.Meta):
        fields = AuctionSerializer.Meta.fields + ["recent_bids"]

    def get_recent_bids(self, auction):
        return BidSerializer(auction.bids.select_related("bidder")[:8], many=True).data


class AuctionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = ["id", "title", "description", "category", "image_url", "starting_bid", "bid_increment", "starts_at", "ends_at"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["ends_at"] <= attrs["starts_at"]:
            raise serializers.ValidationError({"ends_at": "The closing time must be after the start time."})
        if attrs["ends_at"] <= timezone.now():
            raise serializers.ValidationError({"ends_at": "The closing time must be in the future."})
        if attrs["starting_bid"] <= 0 or attrs["bid_increment"] <= 0:
            raise serializers.ValidationError("Starting price and bid increment must be greater than zero.")
        return attrs

    def create(self, validated_data):
        return Auction.objects.create(seller=self.context["request"].user, **validated_data)


class PlaceBidSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, attrs):
        auction_id = self.context["auction_id"]
        amount = attrs["amount"]
        with transaction.atomic():
            try:
                auction = Auction.objects.select_for_update().select_related("seller").get(pk=auction_id)
            except Auction.DoesNotExist:
                raise serializers.ValidationError({"auction": "This auction no longer exists."})
            now = timezone.now()
            if auction.seller_id == self.context["request"].user.id:
                raise serializers.ValidationError({"bid": "You cannot bid on your own listing."})
            if auction.visibility != Auction.Visibility.PUBLISHED or auction.starts_at > now or auction.ends_at <= now:
                raise serializers.ValidationError({"auction": "Bidding is not open for this listing."})
            if amount < auction.next_bid:
                raise serializers.ValidationError({"amount": f"Your bid must be at least ₹{auction.next_bid:,.0f}."})
            attrs["auction"] = auction
        return attrs

    def save(self, **kwargs):
        with transaction.atomic():
            auction = Auction.objects.select_for_update().get(pk=self.validated_data["auction"].pk)
            amount = self.validated_data["amount"]
            if auction.state != "live" or amount < auction.next_bid:
                raise serializers.ValidationError({"amount": f"Another bid was placed. The new minimum is ₹{auction.next_bid:,.0f}."})
            bid = Bid.objects.create(auction=auction, bidder=self.context["request"].user, amount=amount)
            auction.current_bid = amount
            # Anti-sniping: a bid in the last two minutes adds two minutes to the clock.
            if auction.ends_at - timezone.now() <= timedelta(minutes=2):
                auction.ends_at += timedelta(minutes=2)
            auction.save(update_fields=["current_bid", "ends_at"])
            return bid
