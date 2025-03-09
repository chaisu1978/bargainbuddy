import pandas as pd
import requests
import urllib.parse
from django.utils.timezone import now
from core.models import Product, Store, Region, PriceListing, PriceListImportHistory
import re
from decimal import Decimal
from core.models import DataSources

LOCATION_SERVER = "nominatim:8080"

def query_nominatim(store_name, address):
    """Query Nominatim server for coordinates with retry."""
    store_name = str(store_name)
    address = str(address)

    attempts = [
        f"{store_name}, {address}",
        f"{store_name.split(' ')[0]}, {address}"
    ]

    for attempt in attempts:
        url = f"http://{LOCATION_SERVER}/search?q={urllib.parse.quote(attempt)}&countrycodes=tt&format=json"
        response = requests.get(url)
        if response.status_code == 200 and response.json():
            data = response.json()[0]
            return data.get('lat'), data.get('lon')
    return None, None

def detect_header_row(df):
    """Detect the correct header row dynamically."""
    for i in range(min(10, len(df))):
        if "No." in df.iloc[i].values:
            return i
    return None

def extract_sheet_data(sheet_name, df):
    # 1) Basic row handling, rename headers, etc.
    general_addresses = df.iloc[2, 4:].ffill().tolist()
    store_names = df.iloc[3, 4:].tolist()  # keep them as .tolist(), even if some are NaN
    header_row = detect_header_row(df)
    if header_row is not None:
        df.columns = df.iloc[header_row].tolist()
        df = df.iloc[header_row + 1:, :]
    else:
        raise ValueError(f"Header row not found in '{sheet_name}'.")

    # 2) col_metadata => list of (col_index, store_name, address)
    col_metadata = []
    for i, (nm, addr) in enumerate(zip(store_names, general_addresses)):
        col_metadata.append((i, str(nm or "").strip(), str(addr or "").strip()))

    # 3) Build products_df from the first 4 columns
    if "No." not in df.columns:
        raise ValueError(f"'No.' not found in sheet '{sheet_name}'.")

    products_df = df.iloc[:, :4].rename(
        columns={"No.": "Product_ID", "ITEMS": "Item", "BRAND": "Brand", "SIZE": "Size"}
    )

    # 4) Make a separate DataFrame for the price columns and rename them 0..N
    df_price_part = df.iloc[:, 4:].copy()
    df_price_part.columns = range(len(df_price_part.columns))

    # 5) Insert product columns (Approach A)
    df_price_part["Size"]  = products_df["Size"].values
    df_price_part["Brand"] = products_df["Brand"].values
    df_price_part["Item"]  = products_df["Item"].values

    # 6) Melt with var_name='ColIndex'
    price_instances_df = df_price_part.melt(
        id_vars=["Size", "Brand", "Item"],
        var_name="ColIndex",
        value_name="Price"
    ).dropna(subset=["Price"])

    # 7) Convert ColIndex from object->int if needed
    price_instances_df["ColIndex"] = price_instances_df["ColIndex"].astype(int)

    # 8) Make a dict from col_metadata for quick lookups
    index_to_meta = {}
    for (col_i, store_nm, store_addr) in col_metadata:
        index_to_meta[col_i] = (store_nm, store_addr)

    # 9) Map each row’s ColIndex to the appropriate (Store, Address)
    price_instances_df["Store"] = price_instances_df["ColIndex"].apply(
        lambda c: index_to_meta[c][0] if c in index_to_meta else "UNKNOWN_STORE"
    )
    price_instances_df["Address"] = price_instances_df["ColIndex"].apply(
        lambda c: index_to_meta[c][1] if c in index_to_meta else "UNKNOWN_ADDRESS"
    )

    # 10) Build stores_with_addresses if needed (like before):
    stores_with_addresses = pd.DataFrame(col_metadata, columns=["ColIndex", "Store", "Address"])

    return products_df, stores_with_addresses, price_instances_df


def process_product_import(products_df):
    """Import products into the database without duplication and preserve manual updates."""
    # Get or create the MTI data source
    source_mti, _ = DataSources.objects.get_or_create(name="mti", defaults={"description": "Ministry of Trade Import"})

    for _, product_row in products_df.iterrows():
        # Try matching by name, brand, amount, and source
        product = Product.objects.filter(
            name=product_row["Item"],
            brand=product_row["Brand"],
            amount=product_row["Size"],
            source=source_mti
        ).first()

        # If exists, update only fields provided while preserving manual fields
        if product:
            # Only overwrite MTI-provided fields
            product.name = product_row["Item"] or product.name
            product.brand = product_row["Brand"] or product.brand
            product.amount = product_row["Size"] or product.amount
            product.save()
        else:
            # Create if not found
            Product.objects.create(
                name=product_row["Item"],
                brand=product_row["Brand"],
                amount=product_row["Size"],
                source=source_mti
            )

def process_store_import(stores_df, region):
    source_mti, _ = DataSources.objects.get_or_create(
        name="mti", defaults={"description": "Ministry of Trade Import"}
    )
    unresolved_stores = []

    for _, row in stores_df.iterrows():
        store_name = str(row["Store"]).strip()
        store_address = str(row["Address"]).strip()

        # Only call Nominatim once we know we want to create or update
        lat, lon = query_nominatim(store_name, store_address)

        # Refine filter to require exact match on name+address+region
        # so we don't clobber an existing store with the same name but a different address.
        store = Store.objects.filter(
            name=store_name,
            address=store_address,
            region=region,
            source=source_mti
        ).first()

        if store:
            # Possibly update lat/lon if needed
            if lat and lon and (store.lat != lat or store.lon != lon):
                store.lat = lat
                store.lon = lon
            store.save()
        else:
            # If no exact match, create a new store.
            new_store = Store.objects.create(
                name=store_name,
                address=store_address,
                lat=lat or 0.0,
                lon=lon or 0.0,
                region=region,
                source=source_mti
            )

        if not lat or not lon:
            unresolved_stores.append({
                "store": store_name,
                "address": store_address
            })

    return unresolved_stores


def clean_price(value):
    """Convert a price string to a decimal safely."""
    try:
        if isinstance(value, str):
            value = re.sub(r"[^\d.]", "", value)  # Remove non-numeric characters
        return Decimal(value)
    except Exception:
        return None  # Return None if conversion fails

def process_price_import(price_instances_df, region, date_added):
    """Import price listings with source and verification tracking."""
    source_mti, _ = DataSources.objects.get_or_create(name="mti")

    skipped_prices = []  # Track problematic rows

    for _, row in price_instances_df.iterrows():
        product = Product.objects.filter(
            name=row["Item"],
            brand=row["Brand"],
            amount=row["Size"]
        ).first()

        # Use name + address + region
        store = Store.objects.filter(
            name=row["Store"],
            address=row["Address"],
            region=region
        ).first()

        if product and store:
            price = clean_price(row["Price"])
            if price is None:
                skipped_prices.append({
                    "store": row["Store"],
                    "address": row["Address"],
                    "item": row["Item"],
                    "brand": row["Brand"],
                    "size": row["Size"],
                    "raw_price": row["Price"]
                })
                continue

            # Check existing listing (only consider listings from MTI)
            existing_listing = PriceListing.objects.filter(
                product=product,
                store=store,
                source=source_mti
            ).order_by('-date_added').first()

            # Update if price changed or create if new
            if not existing_listing or existing_listing.price != price:
                PriceListing.objects.create(
                    product=product,
                    store=store,
                    price=price,
                    date_added=date_added,
                    price_is_verified='verified',
                    source=source_mti
                )

    return skipped_prices

def log_import_history(file_name, user, success, date_added, message):
    """Log the import process into history."""
    PriceListImportHistory.objects.create(
        file_name=file_name,
        imported_by=user,
        success=success,
        date_imported=date_added,
        message=message,
    )
