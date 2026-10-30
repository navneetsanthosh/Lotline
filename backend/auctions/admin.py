from django.contrib import admin
from .models import Auction, Bid


class BidInline(admin.TabularInline):
    model = Bid
    extra = 0
    readonly_fields = ["bidder", "amount", "created_at"]
    can_delete = False


@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "seller", "current_bid", "starts_at", "ends_at", "visibility"]
    list_filter = ["category", "visibility"]
    search_fields = ["title", "description", "seller__username"]
    inlines = [BidInline]


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ["auction", "bidder", "amount", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["auction__title", "bidder__username"]
