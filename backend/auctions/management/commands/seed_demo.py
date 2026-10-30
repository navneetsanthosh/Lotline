from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from auctions.models import Auction, Bid


class Command(BaseCommand):
    help = "Create or refresh fictional Lotline sample auctions and local demo accounts."

    def handle(self, *args, **options):
        User = get_user_model()
        seller, _ = User.objects.get_or_create(username="studioform")
        if not seller.has_usable_password():
            seller.set_password("LocalOnly-Lotline-2026!")
            seller.save(update_fields=["password"])
        demo_bidders = []
        for username in ("demo", "collector"):
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password("LocalOnly-Lotline-2026!")
                user.save(update_fields=["password"])
            demo_bidders.append(user)

        now = timezone.now()
        rows = [
            ("A chair with a story", "home", "Mid-century teak lounge chair", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85", "A beautifully preserved teak lounge chair with sculpted arms and a refreshed linen seat. A thoughtful piece for a slow Sunday.", 14500, 500, 43),
            ("The quiet geometry", "art", "Original ink study, 1986", "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85", "An original minimal ink study on archival cotton paper, signed and dated 1986. Framed in a slim, solid oak frame.", 6000, 200, 17),
            ("A little silver, a lot of time", "watches", "Seiko automatic, circa 1974", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85", "A serviced Seiko automatic with a brushed steel case, original dial and a fresh leather strap. Keeps excellent time.", 17500, 500, 5),
            ("A camera for the long way", "electronics", "Olympus OM-1 film camera", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85", "A compact classic in working condition. The viewfinder is clear, shutter speeds are accurate and the light meter has been checked.", 9500, 300, 90),
            ("A vessel in blue", "home", "Hand-thrown stoneware vase", "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85", "Thrown by hand in a small studio in Auroville. The glazed surface shifts between deep blue and soft grey in natural light.", 2600, 100, 27),
            ("A record of the everyday", "art", "35mm street photography print", "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=85", "A museum-quality silver gelatin print from an original 35mm negative. Printed by hand in a small darkroom in Kochi.", 4200, 200, 64),
        ]
        for index, (title, category, subtitle, image_url, description, starting, increment, minutes) in enumerate(rows):
            current = Decimal(starting + (increment * (index + 2)))
            auction, _ = Auction.objects.update_or_create(
                title=title,
                defaults={
                    "seller": seller,
                    "description": description,
                    "category": category,
                    "image_url": image_url,
                    "starting_bid": Decimal(starting),
                    "current_bid": current,
                    "bid_increment": Decimal(increment),
                    "starts_at": now - timedelta(hours=2),
                    "ends_at": now + timedelta(minutes=minutes),
                    "visibility": Auction.Visibility.PUBLISHED,
                },
            )
            auction.bids.all().delete()
            for bid_index in range(index + 2):
                bid = Bid.objects.create(
                    auction=auction,
                    bidder=demo_bidders[bid_index % len(demo_bidders)],
                    amount=Decimal(starting + increment * (bid_index + 1)),
                )
                Bid.objects.filter(pk=bid.pk).update(created_at=now - timedelta(minutes=(index + 2 - bid_index) * 9))
            self.stdout.write(f"Seeded: {title} · {subtitle}")
        self.stdout.write(self.style.SUCCESS("Lotline sample auctions are ready. Local demo login: demo / LocalOnly-Lotline-2026!"))
