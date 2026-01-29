-- ============================================
-- CHECK Constraints for Data Integrity
-- PR#21 - Data Integrity, Constraints & Auditing
-- ============================================

-- Inventory: quantity must be non-negative
ALTER TABLE inventory_item
ADD CONSTRAINT chk_inventory_quantity_non_negative
CHECK (quantity >= 0);

-- Product: prices must be non-negative
ALTER TABLE product
ADD CONSTRAINT chk_product_cost_price_non_negative
CHECK (cost_price >= 0);

ALTER TABLE product
ADD CONSTRAINT chk_product_sale_price_non_negative
CHECK (sale_price >= 0);

-- OrderItem: quantity must be positive, price non-negative
ALTER TABLE order_item
ADD CONSTRAINT chk_order_item_quantity_positive
CHECK (quantity > 0);

ALTER TABLE order_item
ADD CONSTRAINT chk_order_item_unit_price_non_negative
CHECK (unit_price_iqd >= 0);

-- Order: total amount must be non-negative
ALTER TABLE "order"
ADD CONSTRAINT chk_order_total_amount_non_negative
CHECK (total_amount_iqd >= 0);

-- Payment: amount must be non-negative
ALTER TABLE payment
ADD CONSTRAINT chk_payment_amount_non_negative
CHECK (amount_iqd >= 0);

-- Refund: amount must be positive (can't refund 0)
ALTER TABLE refund
ADD CONSTRAINT chk_refund_amount_positive
CHECK (amount_iqd > 0);

-- DeliveryZone: fees and minimums must be non-negative
ALTER TABLE delivery_zone
ADD CONSTRAINT chk_delivery_zone_fee_non_negative
CHECK (fee_iqd >= 0);

ALTER TABLE delivery_zone
ADD CONSTRAINT chk_delivery_zone_min_order_non_negative
CHECK (min_order_iqd >= 0);

-- StoreHours: cutoff minutes must be non-negative
ALTER TABLE store_hours
ADD CONSTRAINT chk_store_hours_cutoff_non_negative
CHECK (order_cutoff_minutes >= 0);
