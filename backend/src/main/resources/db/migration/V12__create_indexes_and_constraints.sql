CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status_visibility ON products(is_active, is_visible);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

CREATE INDEX idx_product_feedback_product_id ON product_feedback(product_id);
CREATE INDEX idx_product_feedback_created_at ON product_feedback(created_at);
CREATE INDEX idx_order_feedback_created_at ON order_feedback(created_at);
