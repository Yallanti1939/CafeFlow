-- Migration V14: Add Ice Creams Category and Expand Products for Each Category (10+ Products per Category)

-- 1. Insert Ice Creams Category
INSERT INTO categories (name, description, image_url, display_order, is_visible) VALUES
('Ice Creams', 'Artisanal scoops, sundaes, and chilled frozen delights', NULL, 7, TRUE);

-- 2. Expand Coffee Category (ID: 1)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(1, 'Americano', 'Classic hot water poured over double shot espresso', '/images/products/espresso.png', 110.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Caffe Mocha', 'Rich dark chocolate sauce blended with espresso and velvety milk', '/images/products/latte.png', 190.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Caramel Macchiato', 'Vanilla milk marked with double espresso and golden caramel drizzle', '/images/products/cappuccino.png', 210.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Hazelnut Latte', 'Velvety espresso with roasted hazelnut syrup and steamed milk', '/images/products/latte.png', 195.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Flat White', 'Micro-foamed steamed milk poured over rich double ristretto', '/images/products/cappuccino.png', 175.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Irish Cold Brew', 'Slow-steeped cold brew with sweet cream and non-alcoholic Irish syrup', '/images/products/cold_coffee.png', 220.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Affogato', 'Double espresso shot poured over a scoop of vanilla bean ice cream', '/images/products/espresso.png', 160.00, TRUE, TRUE, 'AVAILABLE'),
(1, 'Vietnamese Iced Coffee', 'Strong dark roast coffee shaken with condensed milk and ice', '/images/products/cold_coffee.png', 185.00, TRUE, TRUE, 'AVAILABLE');

-- 3. Expand Tea Category (ID: 2)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(2, 'Earl Grey Tea', 'Classic black tea infused with natural fragrant bergamot oil', '/images/products/green_tea.png', 100.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Jasmine Blossom Tea', 'Delicate green tea leaves scented with fresh jasmine flowers', '/images/products/green_tea.png', 110.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Lemon Honey Ginger Tea', 'Soothing herbal infusion of fresh ginger, lemon, and raw honey', '/images/products/masala_chai.png', 95.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Chamomile Herbal Tea', 'Caffeine-free soothing chamomile flowers for deep relaxation', '/images/products/green_tea.png', 120.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Peach Iced Tea', 'Refreshing chilled black tea with natural sweet peach nectar', '/images/products/cold_coffee.png', 130.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Hibiscus Berry Iced Tea', 'Vibrant ruby red herbal iced tea with sweet wild berry notes', '/images/products/cold_coffee.png', 140.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Matcha Green Tea Latte', 'Japanese ceremonial grade matcha whisked with steamed oat milk', '/images/products/green_tea.png', 210.00, TRUE, TRUE, 'AVAILABLE'),
(2, 'Kashmiri Kahwa', 'Traditional saffron infused green tea with crushed almonds and cardamom', '/images/products/masala_chai.png', 150.00, TRUE, TRUE, 'AVAILABLE');

-- 4. Expand Burgers Category (ID: 3)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(3, 'Paneer Tikka Burger', 'Char-grilled spicy paneer patty with mint mayo & onion rings', '/images/products/veg_burger.png', 180.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'Crispy Mushroom Swiss Burger', 'Sautéed button mushrooms, melted Swiss cheese & garlic aioli', '/images/products/veg_burger.png', 195.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'Double Cheese Veggie Deluxe', 'Double crispy veg patties layered with double cheddar slices', '/images/products/veg_burger.png', 220.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'Spicy Jalapeno Bean Burger', 'Spiced black bean patty topped with pickled jalapenos & salsa', '/images/products/veg_burger.png', 175.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'Mexican Salsa Burger', 'Crispy tortilla crunch patty with fresh tomato salsa & guacamole', '/images/products/veg_burger.png', 190.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'BBQ Pulled Jackfruit Burger', 'Smoky BBQ glazed tender jackfruit with house coleslaw', '/images/products/veg_burger.png', 205.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'Crispy Potato Corn Burger', 'Golden spiced potato & sweet corn patty with thousand island dressing', '/images/products/veg_burger.png', 150.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'Schezwan Paneer Burger', 'Spicy Schezwan tossed paneer slab with crunchy capsicum', '/images/products/veg_burger.png', 185.00, TRUE, TRUE, 'AVAILABLE'),
(3, 'Farmhouse Veggie Burger', 'Fresh lettuce, grilled zucchini, bell peppers & pesto sauce', '/images/products/veg_burger.png', 170.00, TRUE, TRUE, 'AVAILABLE');

-- 5. Expand Sandwiches Category (ID: 4)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(4, 'Bombay Masala Toast', 'Spiced potato mash, beetroot, cucumber & mint chutney grilled sandwich', '/images/products/paneer_sandwich.png', 130.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Cheese Corn & Spinach Grill', 'Creamy corn, spinach & melted mozzarella on multigrain bread', '/images/products/paneer_sandwich.png', 150.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Caprese Tomato Basil Toastie', 'Fresh mozzarella, vine tomatoes, basil pesto & balsamic drizzle', '/images/products/paneer_sandwich.png', 180.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Mushroom Truffle Toast', 'Sautéed wild mushrooms with truffle oil & Swiss cheese on sourdough', '/images/products/paneer_sandwich.png', 210.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Veg Club Sandwich', 'Triple decker toasted sandwich with veg patty, cheese & tomatoes', '/images/products/paneer_sandwich.png', 190.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Chilli Cheese Garlic Toast', 'Crispy garlic toast loaded with green chillies & melted cheese', '/images/products/paneer_sandwich.png', 135.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Avocado Toast', 'Smashed avocado with lime, chilli flakes & vegan mayo on sourdough', '/images/products/paneer_sandwich.png', 230.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Garden Veggie Sub', 'Assorted crunchy farm vegetables with sweet onion sauce', '/images/products/paneer_sandwich.png', 165.00, TRUE, TRUE, 'AVAILABLE'),
(4, 'Tofu Teriyaki Sandwich', 'Grilled tofu glazed in sweet teriyaki sauce with crunchy cabbage slaw', '/images/products/paneer_sandwich.png', 175.00, TRUE, TRUE, 'AVAILABLE');

-- 6. Expand Snacks Category (ID: 5)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(5, 'Peri Peri Cheesy Fries', 'Crispy fries tossed in fiery Peri Peri seasoning & warm cheese sauce', '/images/products/french_fries.png', 160.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Veg Cheese Loaded Nachos', 'Tortilla chips loaded with refried beans, melted cheese, salsa & sour cream', '/images/products/french_fries.png', 190.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Crispy Onion Rings', 'Golden battered onion rings served with spicy garlic dip', '/images/products/french_fries.png', 140.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Garlic Bread with Cheese', 'Toasted French baguette spread with garlic butter & mozzarella', '/images/products/paneer_sandwich.png', 150.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Potato Cheese Balls', 'Deep fried crispy potato spheres stuffed with gooey melted cheese', '/images/products/french_fries.png', 170.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Paneer Popcorn', 'Bite-sized crunchy paneer nuggets with tangy cocktail sauce', '/images/products/french_fries.png', 180.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Jalapeno Poppers', 'Crispy crumbed jalapenos stuffed with seasoned cream cheese', '/images/products/french_fries.png', 195.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Vegetable Spring Rolls', 'Crispy thin pastry rolls stuffed with seasoned vegetables', '/images/products/french_fries.png', 155.00, TRUE, TRUE, 'AVAILABLE'),
(5, 'Chilli Cheese Toasties', 'Toasted bread topped with chopped capsicum & melted cheese', '/images/products/paneer_sandwich.png', 130.00, TRUE, TRUE, 'AVAILABLE');

-- 7. Expand Desserts Category (ID: 6)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(6, 'Red Velvet Cake Slice', 'Moist red velvet sponge layered with cream cheese frosting', '/images/products/cheesecake.png', 170.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Tiramisu Jar', 'Classic Italian coffee-soaked ladyfingers with mascarpone cream', '/images/products/brownie.png', 220.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Choco Lava Molten Cake', 'Warm chocolate cake with oozing melted chocolate center', '/images/products/brownie.png', 150.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Apple Cinnamon Pie', 'Warm spiced apple filling encased in flaky buttery crust', '/images/products/brownie.png', 160.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Banoffee Pie', 'Crushed biscuit base layered with dulce de leche, banana & cream', '/images/products/cheesecake.png', 180.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Dark Chocolate Truffle Tart', 'Decadent 70% dark chocolate ganache in a crisp pastry shell', '/images/products/brownie.png', 195.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Belgian Waffle with Nutella', 'Crispy golden waffle topped with warm Nutella & chocolate chips', '/images/products/brownie.png', 210.00, TRUE, TRUE, 'AVAILABLE'),
(6, 'Macaron Box (3 Pcs)', 'Assorted French macarons: Pistachio, Raspberry, and Salted Caramel', '/images/products/cheesecake.png', 230.00, TRUE, TRUE, 'AVAILABLE');

-- 8. Insert Products for Ice Creams Category (ID: 7)
INSERT INTO products (category_id, name, description, image_url, price, is_active, is_visible, availability_status) VALUES
(7, 'Belgian Chocolate Scoop', 'Rich dark Belgian chocolate ice cream with chocolate flakes', '/images/products/brownie.png', 110.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'French Vanilla Bean Scoop', 'Classic smooth vanilla ice cream made with real Madagascar vanilla pods', '/images/products/cheesecake.png', 90.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Alphonso Mango Delight', 'Creamy mango ice cream crafted from fresh Ratnagiri Alphonso pulp', '/images/products/cheesecake.png', 120.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Roasted Almond Fudge', 'Vanilla ice cream swirled with dark chocolate fudge & roasted almonds', '/images/products/brownie.png', 130.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Strawberry Cheesecake Scoop', 'Strawberry ice cream with graham cracker crust crumbles & strawberry swirl', '/images/products/cheesecake.png', 140.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Salted Caramel Pretzel', 'Sweet caramel ice cream with salted caramel ribbons & crunchy pretzels', '/images/products/cheesecake.png', 150.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Mint Chocolate Chip', 'Refreshing mint ice cream loaded with dark chocolate flakes', '/images/products/brownie.png', 125.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Cookies & Cream Sundae', 'Vanilla ice cream layered with crushed Oreo cookies & chocolate fudge', '/images/products/brownie.png', 160.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Brownie Fudge Sundae', 'Warm brownie pieces topped with 2 scoops of ice cream, nuts & hot fudge', '/images/products/brownie.png', 220.00, TRUE, TRUE, 'AVAILABLE'),
(7, 'Sicilian Pistachio Scoop', 'Nutty premium Sicilian pistachio ice cream topped with crushed pistachios', '/images/products/cheesecake.png', 170.00, TRUE, TRUE, 'AVAILABLE');
