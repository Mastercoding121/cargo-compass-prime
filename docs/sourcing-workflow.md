# Sourcing & Procurement Workflow

This document outlines the end-to-end workflow for sourcing products from 1688.com and integrating them into the NextGen Hub platform.

## Table of Contents
1. [Data Collection](#data-collection)
2. [Product Ingestion](#product-ingestion)
3. [Pending Scraping Queue](#pending-scraping-queue)
4. [User Order Workflow](#user-order-workflow)

---

## Data Collection

### Step 1: Scrape 1688.com using Instant Data Scraper

1. **Install Instant Data Scraper** from the Chrome Web Store.
2. **Navigate to 1688.com** and search for the products you want to source.
3. **Open Instant Data Scraper** and configure the scraper to extract:
   - Product title
   - Product image URL
   - Original 1688 product link
   - Price in CNY (Yuan)
   - MOQ (Minimum Order Quantity)
   - Sales volume (optional)

### Step 2: Export and Prepare Data

1. **Export the scraped data** as a CSV file.
2. **Clean and format** the CSV file to match our schema:
   - Rename columns to match our expected fields (see table below)
   - Ensure valid numeric values for `price_yuan`, `moq`, and `sales_volume`
   - Verify URLs are valid and complete

### Expected CSV Schema

| Column Name           | Required? | Description                                                                 |
|-----------------------|-----------|-----------------------------------------------------------------------------|
| `product_id`          | No        | Unique product identifier (generated automatically if not provided)        |
| `title_english`       | Yes       | Product title (will be truncated to 500 characters if too long)            |
| `image_url`           | Yes       | URL to product image                                                        |
| `original_1688_link`  | Yes       | Complete URL to the 1688.com product page                                  |
| `price_yuan`          | Yes       | Price per unit in Chinese Yuan (CNY)                                      |
| `price_naira`         | No        | Price per unit in Nigerian Naira (NGN) - calculated automatically if not provided |
| `moq`                 | Yes       | Minimum Order Quantity                                                     |
| `sales_volume`        | No        | Number of units sold (defaults to 0)                                       |

---

## Product Ingestion

### Run the Ingestion Script

To import products into the Appwrite database:

```bash
# Using the default data/products.json file
npm run ingest-products

# Using a specific JSON file
npm run ingest-products -- --file=./data/my-products.json

# Using a CSV file
npm run ingest-products -- --file=./data/my-products.csv
```

### What the Script Does

1. **Loads data** from the specified file (CSV or JSON) or the default `data/products.json`
2. **Converts prices** from CNY to NGN using an exchange rate of 280
3. **Deduplicates** products based on `original_1688_link`
4. **Creates documents** in the Appwrite `products` collection
5. **Generates a report** showing how many products were added and skipped

---

## Pending Scraping Queue

When a user searches for a product on the order creation page and it's not found:
1. The product URL is automatically added to the `pending_scraping_queue` collection
2. A toast message is shown to the user: "Item not found in catalog, but requested for sourcing"
3. Admin users can review the queue and add products to the catalog

### Queue Collection Schema

| Field Name              | Type   | Description                                                                 |
|-------------------------|--------|-----------------------------------------------------------------------------|
| `original_1688_link`    | String | Unique 1688 product link                                                    |
| `requested_at`          | Datetime| When the product was requested                                              |
| `user_id`               | String | ID of the user who requested the product (optional)                        |
| `is_processed`          | Boolean| Whether the product has been processed and added to catalog (default: false) |

---

## User Order Workflow

### Step 1: Create Order

1. User navigates to `/dashboard/create-order`
2. Pastes a 1688.com product URL
3. System searches catalog for matching product by URL
4. If found:
   - Shows product details (title, image, price in NGN)
   - User can proceed to add to cart
5. If not found:
   - Shows manual entry form
   - Auto-adds URL to pending queue
   - User can enter product details manually

### Step 2: Order Preview & Storage

Order previews are stored locally in `localStorage` so users can:
- Navigate away and return without losing their progress
- Have access to recent order previews

### Step 3: Complete Order

User adds product to cart and proceeds through the checkout process as usual.
