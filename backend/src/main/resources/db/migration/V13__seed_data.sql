-- Seed Default Admin
-- Password is 'cafeflow@admin'. BCrypt: $2a$10$.nc2B99FxZoo2ke8ZytTme7rXIhE1aPPogCvYTy2A/25hVW5na26O
INSERT INTO admins (email, password_hash, name, role) 
VALUES ('admin@cafeflow.com', '$2a$10$.nc2B99FxZoo2ke8ZytTme7rXIhE1aPPogCvYTy2A/25hVW5na26O', 'CafeFlow Admin', 'SUPER_ADMIN');

-- Seed Categories
INSERT INTO categories (name, description, image_url, display_order, is_visible) VALUES
('Coffee', 'Freshly brewed warm and cold espresso beverages', NULL, 1, TRUE),
('Tea', 'Traditional hot brewed teas and wellness infusions', NULL, 2, TRUE),
('Burgers', 'Premium gourmet burgers with delicious stuffings', NULL, 3, TRUE),
('Sandwiches', 'Toasted grill sandwiches made with care', NULL, 4, TRUE),
('Snacks', 'Light bites to accompany your beverages', NULL, 5, TRUE),
('Desserts', 'Sweet treats and baked confectionery items', NULL, 6, TRUE);

-- Seed Products
-- Coffee
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(1, 'Espresso', 'Intense and rich single shot of pure espresso', '/images/products/espresso.png', 80.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Cappuccino', 'Classic balance of espresso, steamed milk, and thick foam', '/images/products/cappuccino.png', 150.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Latte', 'Mild espresso blended with generous velvety steamed milk', '/images/products/latte.png', 170.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Cold Coffee', 'Creamy blended milk, espresso, and vanilla ice cream', '/images/products/cold_coffee.png', 180.00, TRUE, TRUE, 'AVAILABLE');

-- Tea
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(2, 'Masala Chai', 'Aromatic spiced milk tea brewed with cardamom, ginger, and cloves', '/images/products/masala_chai.png', 60.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Green Tea', 'Pure and refreshing antioxidant rich green tea infusion', '/images/products/green_tea.png', 90.00, TRUE, TRUE, 'AVAILABLE');

-- Burgers, Sandwiches, Snacks (Food)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(3, 'Veg Burger', 'Crispy mixed vegetable patty with cheese slice, lettuce, and premium mayonnaise', '/images/products/veg_burger.png', 160.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Paneer Sandwich', 'Toasted white bread stuffed with spicy paneer bhurji and mint chutney', '/images/products/paneer_sandwich.png', 140.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'French Fries', 'Golden salted potato fries served with tomato ketchup', '/images/products/french_fries.png', 120.00, TRUE, TRUE, 'AVAILABLE');

-- Desserts
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(6, 'Chocolate Brownie', 'Fudgy warm chocolate brownie topped with chocolate drizzle', '/images/products/brownie.png', 130.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Cheesecake', 'Creamy New York style cheesecake with blueberry compote top', '/images/products/cheesecake.png', 180.00, TRUE, TRUE, 'AVAILABLE');

-- Customization Groups
INSERT INTO customization_groups (name, is_required, selection_type) VALUES
('Coffee Strength', TRUE, 'SINGLE'),
('Sugar Level', TRUE, 'SINGLE'),
('Milk Type', FALSE, 'SINGLE'),
('Size', TRUE, 'SINGLE'),
('Spicy Level', TRUE, 'SINGLE'),
('Extras', FALSE, 'MULTI');

-- Customization Options
-- Coffee Strength (Group 1)
INSERT INTO customization_options (group_id, name, price, is_available) VALUES
(1, 'Mild', 0.00, TRUE),
(1, 'Medium', 0.00, TRUE),
(1, 'Strong', 0.00, TRUE);

-- Sugar Level (Group 2)
INSERT INTO customization_options (group_id, name, price, is_available) VALUES
(2, 'No Sugar', 0.00, TRUE),
(2, 'Low Sugar', 0.00, TRUE),
(2, 'Medium Sugar', 0.00, TRUE),
(2, 'Extra Sugar', 0.00, TRUE);

-- Milk Type (Group 3)
INSERT INTO customization_options (group_id, name, price, is_available) VALUES
(3, 'Regular Milk', 0.00, TRUE),
(3, 'Almond Milk', 30.00, TRUE),
(3, 'Soy Milk', 25.00, TRUE);

-- Size (Group 4)
INSERT INTO customization_options (group_id, name, price, is_available) VALUES
(4, 'Small', 0.00, TRUE),
(4, 'Medium', 0.00, TRUE),
(4, 'Large', 40.00, TRUE);

-- Spicy Level (Group 5)
INSERT INTO customization_options (group_id, name, price, is_available) VALUES
(5, 'Mild Spicy', 0.00, TRUE),
(5, 'Medium Spicy', 0.00, TRUE),
(5, 'Extra Spicy', 0.00, TRUE);

-- Extras (Group 6)
INSERT INTO customization_options (group_id, name, price, is_available) VALUES
(6, 'Extra Cheese', 20.00, TRUE),
(6, 'Extra Patty', 40.00, TRUE),
(6, 'Extra Whipped Cream', 25.00, TRUE);

-- Map Customization Groups to Products
-- Espresso gets Size, Strength
INSERT INTO product_customization_groups (product_id, group_id) VALUES
(1, 1), -- Strength
(1, 4); -- Size

-- Cappuccino, Latte, Cold Coffee get Strength, Sugar, Milk, Size, Extras
INSERT INTO product_customization_groups (product_id, group_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 6), -- Cappuccino
(3, 1), (3, 2), (3, 3), (3, 4), (3, 6), -- Latte
(4, 1), (4, 2), (4, 3), (4, 4), (4, 6); -- Cold Coffee

-- Masala Chai gets Sugar, Milk
INSERT INTO product_customization_groups (product_id, group_id) VALUES
(5, 2), (5, 3);

-- Veg Burger gets Spicy Level, Extras
INSERT INTO product_customization_groups (product_id, group_id) VALUES
(7, 5), (7, 6);

-- Paneer Sandwich gets Spicy Level, Extras
INSERT INTO product_customization_groups (product_id, group_id) VALUES
(8, 5), (8, 6);
