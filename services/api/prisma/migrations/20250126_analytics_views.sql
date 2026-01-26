-- ============================================
-- Analytics Materialized Views
-- Run after Prisma migrations
-- ============================================

-- Daily Sales Summary View (refreshed by scheduled job)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales AS
SELECT
  DATE(o.created_at) as report_date,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.total_amount_iqd) as total_revenue,
  COUNT(oi.id) as item_count,
  AVG(o.total_amount_iqd)::INTEGER as avg_order_value,
  COUNT(DISTINCT o.customer_phone) as unique_customers
FROM "order" o
LEFT JOIN order_item oi ON o.id = oi.order_id
WHERE o.status NOT IN ('CANCELLED')
GROUP BY DATE(o.created_at)
ORDER BY report_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_date ON mv_daily_sales(report_date);

-- Category Sales View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_sales AS
SELECT
  DATE(o.created_at) as report_date,
  c.id as category_id,
  c.name_ar as category_name,
  SUM(oi.quantity * oi.unit_price_iqd) as revenue,
  SUM(oi.quantity) as item_count,
  COUNT(DISTINCT o.id) as order_count
FROM "order" o
JOIN order_item oi ON o.id = oi.order_id
JOIN product p ON oi.product_id = p.id
JOIN category c ON p.category_id = c.id
WHERE o.status NOT IN ('CANCELLED')
GROUP BY DATE(o.created_at), c.id, c.name_ar
ORDER BY report_date DESC, revenue DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_category_sales_date_cat ON mv_category_sales(report_date, category_id);

-- Product Sales Velocity View (for demand forecasting)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_velocity AS
SELECT
  p.id as product_id,
  p.sku,
  p.name_ar as product_name,
  DATE(o.created_at) as sale_date,
  SUM(oi.quantity) as quantity_sold,
  SUM(oi.quantity * oi.unit_price_iqd) as revenue,
  COUNT(DISTINCT o.id) as order_count,
  AVG(oi.quantity)::FLOAT as avg_quantity_per_order
FROM product p
JOIN order_item oi ON p.id = oi.product_id
JOIN "order" o ON oi.order_id = o.id
WHERE o.status NOT IN ('CANCELLED')
  AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.id, p.sku, p.name_ar, DATE(o.created_at)
ORDER BY sale_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_velocity_date_product ON mv_product_velocity(sale_date, product_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_velocity_sku ON mv_product_velocity(sku);

-- Stock Status View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stock_status AS
SELECT
  p.id as product_id,
  p.sku,
  p.name_ar as product_name,
  c.name_ar as category_name,
  COALESCE(SUM(ii.quantity), 0) as total_stock,
  MIN(ii.expiry_date) as earliest_expiry,
  COUNT(CASE WHEN ii.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as near_expiry_count,
  p.cost_price,
  p.sale_price
FROM product p
LEFT JOIN inventory_item ii ON p.id = ii.product_id
LEFT JOIN category c ON p.category_id = c.id
WHERE p.is_active = true AND p.deleted_at IS NULL
GROUP BY p.id, p.sku, p.name_ar, c.name_ar, p.cost_price, p.sale_price;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_status_product ON mv_stock_status(product_id);
CREATE INDEX IF NOT EXISTS idx_mv_stock_status_sku ON mv_stock_status(sku);

-- Order Fulfillment Time View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_fulfillment_times AS
SELECT
  DATE(o.created_at) as order_date,
  o.status,
  AVG(EXTRACT(EPOCH FROM (da.delivered_at - o.created_at))/3600)::FLOAT as avg_hours_to_delivery,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (da.delivered_at - o.created_at))/3600) as median_hours,
  MIN(EXTRACT(EPOCH FROM (da.delivered_at - o.created_at))/3600)::FLOAT as min_hours,
  MAX(EXTRACT(EPOCH FROM (da.delivered_at - o.created_at))/3600)::FLOAT as max_hours,
  COUNT(*) as order_count
FROM "order" o
LEFT JOIN delivery_assignment da ON o.id = da.order_id
WHERE da.delivered_at IS NOT NULL
GROUP BY DATE(o.created_at), o.status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_fulfillment_date_status ON mv_fulfillment_times(order_date, status);

-- Basket Analysis Helper View (co-purchases)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_basket_pairs AS
SELECT
  oi1.product_id as product_id_a,
  oi2.product_id as product_id_b,
  p1.sku as sku_a,
  p2.sku as sku_b,
  COUNT(DISTINCT oi1.order_id) as co_occurrence_count
FROM order_item oi1
JOIN order_item oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
JOIN "order" o ON oi1.order_id = o.id
JOIN product p1 ON oi1.product_id = p1.id
JOIN product p2 ON oi2.product_id = p2.id
WHERE o.status NOT IN ('CANCELLED')
  AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY oi1.product_id, oi2.product_id, p1.sku, p2.sku
HAVING COUNT(DISTINCT oi1.order_id) >= 3
ORDER BY co_occurrence_count DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_basket_pairs_products ON mv_basket_pairs(product_id_a, product_id_b);

-- Refund Summary View (for anomaly detection)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_refund_summary AS
SELECT
  DATE(r.created_at) as refund_date,
  COUNT(*) as refund_count,
  SUM(r.amount_iqd) as total_refund_amount,
  AVG(r.amount_iqd)::INTEGER as avg_refund_amount,
  array_agg(DISTINCT r.reason) as reasons
FROM refund r
GROUP BY DATE(r.created_at)
ORDER BY refund_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_refund_summary_date ON mv_refund_summary(refund_date);

-- Function to refresh all analytics views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_sales;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_velocity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_status;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fulfillment_times;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_basket_pairs;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_refund_summary;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW mv_daily_sales IS 'Daily aggregated sales metrics - refresh hourly';
COMMENT ON MATERIALIZED VIEW mv_category_sales IS 'Category-level daily sales - refresh hourly';
COMMENT ON MATERIALIZED VIEW mv_product_velocity IS 'Product sales velocity for demand forecasting - refresh daily';
COMMENT ON MATERIALIZED VIEW mv_stock_status IS 'Current stock status with expiry info - refresh every 15 min';
COMMENT ON MATERIALIZED VIEW mv_fulfillment_times IS 'Order fulfillment time analysis - refresh daily';
COMMENT ON MATERIALIZED VIEW mv_basket_pairs IS 'Product co-purchase pairs for basket analysis - refresh daily';
COMMENT ON MATERIALIZED VIEW mv_refund_summary IS 'Daily refund summary for anomaly detection - refresh hourly';
