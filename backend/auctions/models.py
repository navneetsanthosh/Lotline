from django.conf import settings
from django.db import models
from django.utils import timezone


class Auction(models.Model):
    class Category(models.TextChoices):
        ART = "art", "Art & Design"
        COLLECTIBLES = "collectibles", "Collectibles"
        ELECTRONICS = "electronics", "Electronics"
        HOME = "home", "Home & Living"
        WATCHES = "watches", "Watches"
        FASHION = "fashion", "Fashion"

    class Visibility(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="auctions")
    title = models.CharField(max_length=140)
    description = models.TextField()
    category = models.CharField(max_length=24, choices=Category.choices)
    image_url = models.URLField(max_length=600, blank=True)
    starting_bid = models.DecimalField(max_digits=12, decimal_places=2)
    current_bid = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    bid_increment = models.DecimalField(max_digits=10, decimal_places=2, default=100)
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField()
    visibility = models.CharField(max_length=12, choices=Visibility.choices, default=Visibility.PUBLISHED)
    watchers = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="watched_auctions")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ends_at", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def state(self):
        now = timezone.now()
        if self.visibility == self.Visibility.DRAFT:
            return "draft"
        if self.starts_at > now:
            return "upcoming"
        if self.ends_at <= now:
            return "ended"
        return "live"

    @property
    def leading_bid(self):
        return self.current_bid if self.current_bid is not None else self.starting_bid

    @property
    def next_bid(self):
        return self.leading_bid + self.bid_increment


class Bid(models.Model):
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name="bids")
    bidder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bids")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.bidder} bid {self.amount} on {self.auction}"
