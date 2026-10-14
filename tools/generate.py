#!/usr/bin/env python3
"""
One-off fixture generator for the Phantom Stock-Out demo.

Simulates 18 months of daily sales and system stock for 25 stores x 800 SKUs,
injects phantoms (plus the two confusers: misplaced and delisted), then scores
the morning list with the real method: per-SKU expected demand, the probability
of the observed zero-sale run under a negative binomial, expected rupee value,
and greedy aisle walks. Output is committed JSON under src/data. The app never
runs this script.

    python tools/generate.py
"""
import datetime as dt
import json
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
from scipy import stats

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data"
rng = np.random.default_rng(20251016)

LIST_DATE = dt.date(2025, 10, 16)               # Thursday: the list the manager opens at 7am
LAST_DAY = LIST_DATE - dt.timedelta(days=1)     # sales and stock are known through yesterday
N_DAYS = 548                                     # 18 months
DAY0 = LAST_DAY - dt.timedelta(days=N_DAYS - 1)
T = N_DAYS - 1
FUTURE = 40                                      # multipliers are needed a little past T
SERIES_DAYS = 120
CHECKS = 20
CONF = 0.80                                      # posterior needed to make the list
CYCLE = 35                                       # days between cycle counts of one aisle
HORIZON_CAP = 30
NOTICE = 0.003                                   # per unit of daily demand: chance a gap gets reported
WINDOW = 150

NORMAL, PHANTOM, MISPLACED, DELISTED, GONE = 0, 1, 2, 3, 4
TYPE_NAME = {PHANTOM: "phantom", MISPLACED: "misplaced", DELISTED: "delisted"}


def day(t):
    return DAY0 + dt.timedelta(days=int(t))


def iso(t):
    return day(t).isoformat()


def short(t):
    d = day(t)
    return f"{d.strftime('%a')} {d.day} {d.strftime('%b')}"


# ---------------------------------------------------------------------------
# Catalogue: 18 aisles, generic product names, 800 SKUs
# ---------------------------------------------------------------------------

PACKS = {
    "kg": [("500G", "500g", 0.5), ("1KG", "1kg", 1), ("2KG", "2kg", 2), ("5KG", "5kg", 5)],
    "g": [("50G", "50g", 0.5), ("100G", "100g", 1), ("200G", "200g", 2), ("500G", "500g", 5)],
    "l": [("200ML", "200ml", 0.2), ("500ML", "500ml", 0.5), ("1L", "1l", 1), ("5L", "5l", 5)],
    "ml": [("100ML", "100ml", 1), ("200ML", "200ml", 2), ("400ML", "400ml", 4), ("1L", "1l", 10)],
    "pc": [("1PC", "single", 1), ("2PK", "pack of 2", 2), ("4PK", "pack of 4", 4), ("6PK", "pack of 6", 6)],
}
PACK_POP = [0.6, 1.0, 0.55, 0.3]

# name, unit, margin share of price, staple-ness, shrink risk, products (name, code stem, price per unit)
AISLES = [
    ("Rice", "kg", .08, .95, .7, [
        ("Sona masoori rice", "SONAMSR", 68), ("Basmati rice", "BASMATI", 140), ("Kolam rice", "KOLAM", 64),
        ("Ponni rice", "PONNI", 66), ("Idli rice", "IDLIRICE", 52), ("Brown rice", "BRNRICE", 118),
        ("Jeera samba rice", "JEERASAMBA", 124), ("Matta rice", "MATTA", 72), ("Poha thick", "POHA", 58),
        ("Sabudana", "SABUDANA", 96), ("Broken basmati", "BRKBASMATI", 92), ("Red rice", "REDRICE", 104)]),
    ("Atta & flours", "kg", .08, .9, .7, [
        ("Whole wheat atta", "ATTA", 48), ("Multigrain atta", "MGATTA", 72), ("Maida", "MAIDA", 44),
        ("Besan", "BESAN", 96), ("Rice flour", "RICEFLR", 52), ("Ragi flour", "RAGIFLR", 74),
        ("Sooji", "SOOJI", 50), ("Bombay rava", "RAVA", 52), ("Jowar flour", "JOWARFLR", 68),
        ("Bajra flour", "BAJRAFLR", 64), ("Corn flour", "CORNFLR", 80), ("Idli rava", "IDLIRAVA", 56),
        ("Chakki atta", "CHAKKIATTA", 54)]),
    ("Edible oils & ghee", "l", .07, .85, 1.6, [
        ("Sunflower oil", "SUNOIL", 148), ("Groundnut oil", "GNUTOIL", 196), ("Mustard oil", "MUSTOIL", 172),
        ("Rice bran oil", "RBOIL", 152), ("Coconut oil", "COCOIL", 240), ("Sesame oil", "SESOIL", 290),
        ("Palmolein oil", "PALMOIL", 118), ("Olive oil", "OLIVEOIL", 820), ("Soybean oil", "SOYOIL", 140),
        ("Cow ghee", "COWGHEE", 640), ("Buffalo ghee", "BUFGHEE", 590), ("Vanaspati", "VANASPATI", 150),
        ("Cold pressed groundnut oil", "CPGNUT", 330)]),
    ("Pulses & grains", "kg", .10, .9, .9, [
        ("Toor dal", "TOORDAL", 160), ("Chana dal", "CHANADAL", 96), ("Moong dal", "MOONGDAL", 128),
        ("Urad dal", "URADDAL", 136), ("Masoor dal", "MASOORDAL", 104), ("Kabuli chana", "CHANA", 120),
        ("Rajma", "RAJMA", 150), ("Green moong", "GRMOONG", 118), ("Black chana", "BLKCHANA", 88),
        ("White peas", "WHTPEAS", 78), ("Urad whole", "URADWHL", 130), ("Lobia", "LOBIA", 112),
        ("Horse gram", "HORSEGRAM", 96), ("Unpolished toor dal", "UPTOORDAL", 178)]),
    ("Spices & masalas", "g", .22, .7, 1.3, [
        ("Turmeric powder", "HALDI", 30), ("Chilli powder", "CHILLI", 36), ("Coriander powder", "DHANIA", 26),
        ("Garam masala", "GARAM", 70), ("Cumin seeds", "JEERA", 60), ("Mustard seeds", "RAI", 18),
        ("Sambar powder", "SAMBAR", 44), ("Rasam powder", "RASAM", 42), ("Black pepper", "PEPPER", 110),
        ("Kitchen king masala", "KKMASALA", 72), ("Chaat masala", "CHAAT", 64), ("Biryani masala", "BIRYANI", 80),
        ("Hing", "HING", 260), ("Methi seeds", "METHI", 22), ("Green cardamom", "ELAICHI", 420),
        ("Cloves", "CLOVES", 190)]),
    ("Sugar, salt & jaggery", "kg", .06, .95, .6, [
        ("Sugar", "SUGAR", 46), ("Iodised salt", "SALT", 24), ("Rock salt", "ROCKSALT", 60),
        ("Jaggery", "JAGGERY", 70), ("Jaggery powder", "JAGPWD", 88), ("Brown sugar", "BRNSUGAR", 96),
        ("Black salt", "KALANAMAK", 70), ("Low sodium salt", "LOWNASALT", 90), ("Mishri", "MISHRI", 110),
        ("Palm jaggery", "PALMJAG", 240), ("Sugar-free sweetener", "SWEETNR", 980)]),
    ("Tea & coffee", "g", .15, .8, 1.2, [
        ("CTC tea", "CTCTEA", 52), ("Leaf tea", "LEAFTEA", 64), ("Green tea", "GREENTEA", 120),
        ("Masala tea", "MASALATEA", 70), ("Filter coffee", "FILTERCOF", 90), ("Instant coffee", "INSTCOF", 210),
        ("Chicory coffee", "CHICORY", 72), ("Elaichi tea", "ELAICHITEA", 74), ("Lemon tea", "LEMONTEA", 96),
        ("Coffee beans", "COFBEANS", 160), ("Tulsi tea", "TULSITEA", 110)]),
    ("Biscuits & snacks", "pc", .14, .85, 1.1, [
        ("Glucose biscuits", "GLUCOBIS", 10), ("Marie biscuits", "MARIE", 30), ("Cream biscuits", "CREAMBIS", 30),
        ("Salted crackers", "CRACKER", 35), ("Digestive biscuits", "DIGESTIVE", 60), ("Butter cookies", "COOKIES", 55),
        ("Potato chips", "CHIPS", 20), ("Banana chips", "BANCHIPS", 60), ("Namkeen mixture", "MIXTURE", 50),
        ("Aloo bhujia", "BHUJIA", 55), ("Roasted peanuts", "PEANUTS", 40), ("Methi khakhra", "KHAKHRA", 70),
        ("Milk rusk", "RUSK", 45), ("Butter murukku", "MURUKKU", 60), ("Popcorn", "POPCORN", 35)]),
    ("Breakfast & spreads", "g", .16, .65, 1.0, [
        ("Cornflakes", "CORNFLKS", 42), ("Rolled oats", "OATS", 26), ("Fruit muesli", "MUESLI", 80),
        ("Peanut butter", "PNUTBUTR", 70), ("Mixed fruit jam", "JAM", 40), ("Honey", "HONEY", 90),
        ("Choco spread", "CHOCOSPRD", 110), ("Ragi flakes", "RAGIFLKS", 50), ("Roasted vermicelli", "VERMICELLI", 22),
        ("Upma mix", "UPMAMIX", 40), ("Dosa mix", "DOSAMIX", 38), ("Idli mix", "IDLIMIX", 38),
        ("Pancake mix", "PANCAKE", 75)]),
    ("Noodles, pasta & sauces", "pc", .18, .75, .9, [
        ("Instant noodles", "NOODLES", 14), ("Hakka noodles", "HAKKA", 40), ("Penne pasta", "PENNE", 60),
        ("Macaroni", "MACARONI", 45), ("Spaghetti", "SPAGHETTI", 80), ("Tomato ketchup", "KETCHUP", 110),
        ("Green chilli sauce", "CHILSAUCE", 70), ("Soy sauce", "SOYSAUCE", 60), ("Eggless mayonnaise", "MAYO", 99),
        ("Pasta sauce", "PASTASAUCE", 140), ("Schezwan chutney", "SCHEZWAN", 95), ("Mango pickle", "MANGOPKL", 120),
        ("Lime pickle", "LIMEPKL", 110), ("White vinegar", "VINEGAR", 45)]),
    ("Dairy & bakery", "pc", .07, 1.0, .8, [
        ("Toned milk 500ml", "MILKTN", 27), ("Full cream milk 500ml", "MILKFC", 34), ("Curd 400g", "CURD", 45),
        ("Paneer 200g", "PANEER", 90), ("Salted butter 100g", "BUTTER", 58), ("Cheese slices", "CHEESE", 145),
        ("White bread", "BREADWHT", 40), ("Brown bread", "BREADBRN", 50), ("Burger buns", "BUNS", 35),
        ("Fresh cream 200ml", "CREAM", 70), ("Buttermilk 200ml", "BTRMILK", 15), ("Sweet lassi 200ml", "LASSI", 25),
        ("Pav", "PAV", 30)]),
    ("Beverages", "ml", .15, .7, 1.0, [
        ("Cola", "COLA", 10), ("Lemon soda", "LEMSODA", 9), ("Orange drink", "ORANGEDRK", 9),
        ("Mango drink", "MANGODRK", 10), ("Packaged water", "WATER", 2.2), ("Soda water", "SODA", 5),
        ("Energy drink", "ENERGY", 42), ("Iced tea", "ICEDTEA", 14), ("Tender coconut water", "COCWATER", 24),
        ("Mixed fruit juice", "MIXJUICE", 14), ("Malt drink", "MALTDRK", 52), ("Rose syrup", "ROSESYRUP", 30),
        ("Glucose drink", "GLUCDRK", 36)]),
    ("Personal care", "pc", .20, .7, 2.0, [
        ("Bath soap", "BATHSOAP", 38), ("Glycerin soap", "GLYSOAP", 55), ("Body wash", "BODYWASH", 199),
        ("Face wash", "FACEWASH", 140), ("Talcum powder", "TALC", 120), ("Deodorant", "DEO", 210),
        ("Body lotion", "LOTION", 230), ("Petroleum jelly", "PETJELLY", 85), ("Sunscreen", "SUNSCRN", 299),
        ("Hand wash refill", "HANDWASH", 99), ("Shaving cream", "SHAVECRM", 110), ("Razor", "RAZOR", 60),
        ("Cold cream", "COLDCRM", 150)]),
    ("Hair care", "pc", .20, .6, 2.2, [
        ("Anti-dandruff shampoo", "ADSHAMPOO", 180), ("Herbal shampoo", "HBSHAMPOO", 150), ("Conditioner", "CONDTNR", 190),
        ("Coconut hair oil", "COCHAIROIL", 110), ("Almond hair oil", "ALMHAIROIL", 160), ("Amla hair oil", "AMLAOIL", 95),
        ("Hair gel", "HAIRGEL", 120), ("Hair colour", "HAIRCLR", 199), ("Hair serum", "HAIRSERUM", 260),
        ("Henna powder", "HENNA", 60)]),
    ("Oral care", "pc", .18, .75, 1.8, [
        ("Toothpaste", "TPASTE", 95), ("Herbal toothpaste", "TPHERBAL", 105), ("Sensitive toothpaste", "TPSENSTV", 180),
        ("Soft toothbrush", "TBSOFT", 45), ("Medium toothbrush", "TBMED", 40), ("Mouthwash", "MOUTHWASH", 160),
        ("Dental floss", "FLOSS", 140), ("Tooth powder", "TPOWDER", 55), ("Kids toothpaste", "TPKIDS", 85)]),
    ("Home cleaning", "pc", .18, .7, .9, [
        ("Dishwash bar", "DISHBAR", 20), ("Dishwash liquid", "DISHLIQ", 105), ("Floor cleaner", "FLOORCLN", 120),
        ("Toilet cleaner", "TOILETCLN", 99), ("Glass cleaner", "GLASSCLN", 95), ("Phenyl", "PHENYL", 70),
        ("Scrub pad", "SCRUB", 25), ("Garbage bags", "GARBAGE", 85), ("Mosquito coil", "MOSQCOIL", 45),
        ("Room freshener", "FRESHNR", 170), ("Naphthalene balls", "NAPHTHA", 55), ("Kitchen towel", "KTOWEL", 90),
        ("Agarbatti", "AGARBATTI", 50)]),
    ("Laundry", "pc", .14, .8, 1.0, [
        ("Detergent powder 1kg", "DETPWD", 120), ("Detergent liquid 1l", "DETLIQ", 210), ("Detergent bar", "DETBAR", 28),
        ("Fabric conditioner", "FABCOND", 180), ("Liquid blue", "LIQBLUE", 40), ("Stain remover", "STAINRMV", 150),
        ("Front load powder 1kg", "MATICPWD", 240), ("Bleach", "BLEACH", 90), ("Fabric starch", "STARCH", 85)]),
    ("Baby & health", "pc", .16, .6, 1.9, [
        ("Baby diapers small", "DIAPERS", 420), ("Baby diapers medium", "DIAPERM", 460), ("Baby wipes", "BABYWIPES", 160),
        ("Baby soap", "BABYSOAP", 70), ("Baby oil", "BABYOIL", 180), ("Baby powder", "BABYPWD", 150),
        ("Sanitary pads", "SANPADS", 95), ("Antiseptic liquid", "ANTISEPT", 110), ("Adhesive bandages", "BANDAGE", 40),
        ("Pain balm", "PAINBALM", 60), ("ORS sachet", "ORS", 22), ("Cotton roll", "COTTON", 55),
        ("Hand sanitiser", "SANITISER", 90)]),
]
N_AISLES = len(AISLES)
assert N_AISLES == 18

skus = []
for a, (aname, unit, mshare, staple, shrink, products) in enumerate(AISLES):
    for pi, (pname, stem, price) in enumerate(products):
        for qi, (pcode, plabel, qty) in enumerate(PACKS[unit]):
            pack_price = price * qty * qty ** -0.06
            if unit == "pc" and any(ch.isdigit() for ch in pname):
                name = pname if qi == 0 else f"{pname}, {plabel}"
            else:
                name = f"{pname} {plabel}"
            skus.append(dict(
                code=f"{stem}{pcode}", name=name, aisle=a + 1, price=round(pack_price, 2),
                margin=round(max(0.5, pack_price * mshare * rng.uniform(.85, 1.15)), 2),
                score=.8 * staple + .6 * PACK_POP[qi] + .8 * (1 - pi / len(products)) + rng.normal(0, .35),
            ))
keep = np.sort(rng.choice(len(skus), size=800, replace=False))
skus = [skus[i] for i in keep]
K = len(skus)
assert len({s["code"] for s in skus}) == K

# demand classes: 15% fast (10-40/day), 45% medium (1-10), 40% slow (0.03-1)
order = np.argsort([-s["score"] for s in skus])
n_fast, n_med = int(.15 * K), int(.45 * K)
for rank, i in enumerate(order):
    if rank < n_fast:
        cls, lo, hi, u, r = "fast", 10, 40, 1 - rank / n_fast, 3.0
    elif rank < n_fast + n_med:
        cls, lo, hi, u, r = "medium", 1, 10, 1 - (rank - n_fast) / n_med, 1.5
    else:
        cls, lo, hi, u, r = "slow", .03, 1, 1 - (rank - n_fast - n_med) / (K - n_fast - n_med), .6
    u = float(np.clip(u + rng.normal(0, .12), 0, 1))
    skus[i].update(cls=cls, rate=lo * (hi / lo) ** u, r=r * rng.uniform(.85, 1.15))

sku_aisle = np.array([s["aisle"] - 1 for s in skus])
sku_rate = np.array([s["rate"] for s in skus])
sku_r = np.array([s["r"] for s in skus])
sku_margin = np.array([s["margin"] for s in skus])
aisle_shrink = np.array([a[4] for a in AISLES])

# ---------------------------------------------------------------------------
# Stores
# ---------------------------------------------------------------------------

STORES = [
    ("01", "Indiranagar", "Bengaluru", 1, "Hypermarket", 42000),
    ("02", "Banjara Hills", "Hyderabad", 1, "Hypermarket", 45000),
    ("03", "Kothrud", "Pune", 1, "Supermarket", 18000),
    ("04", "Anna Nagar", "Chennai", 1, "Supermarket", 16000),
    ("05", "Andheri West", "Mumbai", 1, "Supermarket", 14000),
    ("06", "Gachibowli", "Hyderabad", 1, "Express", 4500),
    ("07", "Whitefield", "Bengaluru", 1, "Supermarket", 20000),
    ("08", "Velachery", "Chennai", 1, "Hypermarket", 40000),
    ("09", "Powai", "Mumbai", 1, "Express", 4000),
    ("10", "Saravanampatti", "Coimbatore", 2, "Supermarket", 15000),
    ("11", "Dharampeth", "Nagpur", 2, "Supermarket", 14000),
    ("12", "MVP Colony", "Visakhapatnam", 2, "Supermarket", 15000),
    ("13", "Vijay Nagar", "Indore", 2, "Hypermarket", 38000),
    ("14", "Koramangala", "Bengaluru", 1, "Hypermarket", 48000),
    ("15", "Gokulam", "Mysuru", 2, "Supermarket", 12000),
    ("16", "Vidyanagar", "Hubballi", 3, "Supermarket", 11000),
    ("17", "Hanamkonda", "Warangal", 3, "Supermarket", 10000),
    ("18", "Fairlands", "Salem", 3, "Express", 3800),
    ("19", "College Road", "Nashik", 2, "Supermarket", 13000),
    ("20", "Tilak Road", "Tirupati", 3, "Express", 3500),
    ("21", "Jayanagar", "Bengaluru", 1, "Express", 4200),
    ("22", "Kukatpally", "Hyderabad", 1, "Hypermarket", 44000),
    ("23", "Baner", "Pune", 1, "Express", 4400),
    ("24", "Adyar", "Chennai", 1, "Supermarket", 15000),
    ("25", "Thane West", "Thane", 1, "Hypermarket", 41000),
]
S = len(STORES)
FMT_DEMAND = {"Hypermarket": 1.6, "Supermarket": 1.0, "Express": .45}
FMT_PHANTOM = {"Hypermarket": 1.5, "Supermarket": 1.0, "Express": .55}
TIER_DEMAND = {1: 1.0, 2: .9, 3: .8}

store_mult = np.array([FMT_DEMAND[s[4]] * TIER_DEMAND[s[3]] * rng.uniform(.9, 1.1) for s in STORES])
lam_ph = np.array([FMT_PHANTOM[s[4]] * rng.uniform(.6, 1.4) for s in STORES])
lam_mi = lam_ph * .3
lam_de = np.full(S, .04)
hot = np.ones((S, N_AISLES))
for s in range(S):
    hot[s, rng.choice(N_AISLES, size=3, replace=False)] = 3.0   # backroom overflow, poor shelf discipline
idx = {s[0]: i for i, s in enumerate(STORES)}
lam_ph[idx["14"]] = 1.9                    # the hero store: big, busy, leaky
lam_ph[idx["07"]] = .7                     # Whitefield: re-planogrammed in September,
lam_mi[idx["07"]] = 1.6                    # so things are on the wrong shelf rather than missing
lam_ph[idx["21"]] = .2                     # Jayanagar: tight store, the abstention case
lam_mi[idx["21"]] = .05

# ---------------------------------------------------------------------------
# Multipliers: weekday, season, promo
# ---------------------------------------------------------------------------

H = N_DAYS + FUTURE
wd_raw = np.array([.92, .88, .9, .95, 1.05, 1.2, 1.1])        # Mon..Sun
wd_raw /= wd_raw.mean()
weekday = np.array([wd_raw[day(t).weekday()] for t in range(H)])

season = np.ones((H, N_AISLES))
diwali = [dt.date(2024, 11, 1), dt.date(2025, 10, 20)]
FESTIVE = {2: .35, 4: .2, 5: .3, 7: .25, 1: .15, 3: .1}       # oils, spices, sugar, snacks, flours, pulses
for t in range(H):
    d = day(t)
    doy = d.timetuple().tm_yday
    season[t] *= 1 + .05 * math.sin(2 * math.pi * (doy - 80) / 365)
    if d.month in (4, 5, 6):
        season[t, 11] *= 1.4
    if d.month in (7, 8, 9):
        season[t, 6] *= 1.1
    for dw in diwali:
        gap = (dw - d).days
        if 0 <= gap <= 21:
            ramp = 1 - gap / 21
            for a, lift in FESTIVE.items():
                season[t, a] *= 1 + lift * ramp

promo = np.ones((H, K))
for k in range(K):
    if rng.random() < .3:
        t0 = int(rng.integers(0, 60))
        while t0 < H:
            promo[t0:t0 + 7, k] = rng.uniform(1.25, 1.7)
            t0 += int(rng.integers(45, 100))
