-- ====================================================================
-- LAKSHMI VENKATESHWARA SHEEP & NATU KOLLA FARM
-- PRODUCTION-READY FARM MANAGEMENT SYSTEM DATABASE SCHEMA
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. HELPER FUNCTIONS & TRIGGERS
-- --------------------------------------------------------------------

-- Automatic timestamp updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to fetch user role safely
CREATE OR REPLACE FUNCTION public.get_user_role(u_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = u_id;
    RETURN COALESCE(u_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- 2. ROLES & PROFILES (Normalized Security & Profiles)
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.roles (name, description) VALUES
('admin', 'Full administrative access to all farm assets, finances, workers, and settings'),
('worker', 'Farm staff access for livestock logging, task completion, and inventory management'),
('customer', 'Customer access for catalog browsing, ordering, payment tracking, and profile management')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(20),
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    address TEXT,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    designation VARCHAR(100) DEFAULT 'Farm Owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    designation VARCHAR(100) DEFAULT 'Livestock & Fodder Supervisor',
    monthly_salary DECIMAL(10, 2) DEFAULT 0.00,
    joining_date DATE DEFAULT CURRENT_DATE,
    specialization VARCHAR(100) DEFAULT 'General Livestock & Poultry',
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_payment_mode VARCHAR(50) DEFAULT 'Cash on Delivery',
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 3. ANIMALS (Livestock, Health, Vaccinations, Breeding & Weight)
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.animals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Sheep', 'Natu Kolla')),
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
    age_months INT DEFAULT 0,
    weight_kg DECIMAL(6,2) DEFAULT 0.00,
    purchase_price DECIMAL(10,2) DEFAULT 0.00,
    selling_price DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Healthy' CHECK (status IN ('Healthy', 'Under Treatment', 'Sold', 'Quarantine', 'Breeding')),
    vaccination_status VARCHAR(50) DEFAULT 'Up to Date',
    medical_history TEXT,
    breeding_details TEXT,
    photo_url TEXT,
    qr_code_url TEXT,
    added_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.animal_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    symptoms TEXT NOT NULL,
    diagnosis TEXT,
    treatment_given TEXT,
    veterinarian_name VARCHAR(150),
    cost DECIMAL(10,2) DEFAULT 0.00,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    health_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(150) NOT NULL,
    dose_given VARCHAR(50),
    administered_date DATE DEFAULT CURRENT_DATE,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.breeding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mother_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    father_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    mating_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    offspring_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.animal_weight (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    weight_kg DECIMAL(6,2) NOT NULL,
    recorded_date DATE DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------------------
-- 4. PRODUCTS & SUPPLIERS
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Sheep', 'Natu Kolla', 'Grass', 'Feed', 'Medicine')),
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    stock_quantity INT DEFAULT 0,
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    supplied_goods TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 5. INVENTORY (Grass, Feed & General Farm Inventory)
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Feed', 'Medicine', 'Equipment', 'Suppliers', 'Grass')),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    current_stock INT DEFAULT 0,
    min_alert_stock INT DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'units',
    cost_per_unit DECIMAL(10,2) DEFAULT 0.00,
    last_restocked DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.grass_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grass_type VARCHAR(150) NOT NULL, -- e.g. Subabul, Lucerne, Super Napier, Hedge Lucerne
    plot_location VARCHAR(150) NOT NULL,
    area_acres DECIMAL(6,2) DEFAULT 1.0,
    quantity_kg DECIMAL(10,2) DEFAULT 0.00,
    min_stock_threshold_kg DECIMAL(10,2) DEFAULT 100.00,
    last_harvested_date DATE DEFAULT CURRENT_DATE,
    next_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'Ready for Harvest' CHECK (status IN ('Growing', 'Ready for Harvest', 'Harvested', 'Depleted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.feed_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_type VARCHAR(150) NOT NULL, -- e.g. Maize Bran Mix, Groundnut Cake Mash, Mineral Salt
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(150),
    quantity_kg DECIMAL(10,2) DEFAULT 0.00,
    min_stock_threshold_kg DECIMAL(10,2) DEFAULT 50.00,
    cost_per_kg DECIMAL(10,2) DEFAULT 0.00,
    last_restocked_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 6. ORDERS, ORDER ITEMS & PAYMENTS
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash on Delivery',
    payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    order_status VARCHAR(50) DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    transaction_reference VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Completed' CHECK (payment_status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 7. FARM GALLERY & OWNERS
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.farm_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    image_title VARCHAR(200) NOT NULL,
    image_description TEXT,
    category VARCHAR(50) DEFAULT 'Sheep & Goat',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200),
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200),
    image_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Farm',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 8. EXPENSES, INCOME, TASKS, ATTENDANCE, MESSAGES & SETTINGS
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    income_date DATE DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    source_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    attendance_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) CHECK (status IN ('Present', 'Half Day', 'Absent')),
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    UNIQUE(worker_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_worker_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    due_date DATE DEFAULT CURRENT_DATE,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Replied', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(200) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) NOT NULL,
    token VARCHAR(200) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-- --------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_animals_tag ON public.animals(tag_number);
CREATE INDEX IF NOT EXISTS idx_animals_category ON public.animals(category);
CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(status);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_farm_gallery_active ON public.farm_gallery(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_grass_inventory_type ON public.grass_inventory(grass_type);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_type ON public.feed_inventory(feed_type);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_income_date ON public.income(income_date);

-- --------------------------------------------------------------------
-- 10. AUTOMATED TRIGGERS & INVENTORY DEDUCTION LOGIC
-- --------------------------------------------------------------------

-- Set updated_at trigger attachments
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_workers_updated_at ON public.workers;
CREATE TRIGGER trg_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_animals_updated_at ON public.animals;
CREATE TRIGGER trg_animals_updated_at BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_farm_gallery_updated_at ON public.farm_gallery;
CREATE TRIGGER trg_farm_gallery_updated_at BEFORE UPDATE ON public.farm_gallery FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_grass_inventory_updated_at ON public.grass_inventory;
CREATE TRIGGER trg_grass_inventory_updated_at BEFORE UPDATE ON public.grass_inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_feed_inventory_updated_at ON public.feed_inventory;
CREATE TRIGGER trg_feed_inventory_updated_at BEFORE UPDATE ON public.feed_inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger function: Automatically deduct product & feed stock upon sales order confirmation
CREATE OR REPLACE FUNCTION public.handle_order_inventory_deduction()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Only trigger when order moves to 'Confirmed' or 'Delivered'
    IF (TG_OP = 'INSERT' AND NEW.order_status IN ('Confirmed', 'Delivered')) OR
       (TG_OP = 'UPDATE' AND OLD.order_status NOT IN ('Confirmed', 'Delivered') AND NEW.order_status IN ('Confirmed', 'Delivered')) THEN
        
        FOR item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
            IF item.product_id IS NOT NULL THEN
                UPDATE public.products 
                SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
                WHERE id = item.product_id;
            END IF;
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_inventory ON public.orders;
CREATE TRIGGER trg_deduct_inventory
AFTER INSERT OR UPDATE OF order_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_order_inventory_deduction();

-- Trigger function: Auto-create profile in public.profiles when new user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        status,
        created_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        'Active',
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_weight ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grass_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Open policies for development and public reading
CREATE POLICY "Public Read Access for Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Animals" ON public.animals FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Farm Gallery" ON public.farm_gallery FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Owners" ON public.owners FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for Contact Messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Profiles RLS Policies (Secure Self-Service & Admin Management)
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles SELECT Policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles INSERT Policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles UPDATE Policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles DELETE Policy" ON public.profiles;

-- SELECT Policy: Users can read their own profile or authenticated users can read profiles
CREATE POLICY "Profiles SELECT Policy" ON public.profiles FOR SELECT USING (
    auth.uid() = id OR auth.uid() IS NOT NULL
);

-- INSERT Policy: Authenticated users can INSERT ONLY their own profile record where id = auth.uid()
CREATE POLICY "Profiles INSERT Policy" ON public.profiles FOR INSERT WITH CHECK (
    auth.uid() = id
);

-- UPDATE Policy: Authenticated users can UPDATE ONLY their own profile record (or Admins/Owners)
CREATE POLICY "Profiles UPDATE Policy" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'administrator')
) WITH CHECK (
    auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'administrator')
);

-- DELETE Policy: Admin/Owner only
CREATE POLICY "Profiles DELETE Policy" ON public.profiles FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'administrator')
);
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Admin Full Access Order Items" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Admin Full Access Payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Admin Full Access Grass Inventory" ON public.grass_inventory FOR ALL USING (true);
CREATE POLICY "Admin Full Access Feed Inventory" ON public.feed_inventory FOR ALL USING (true);
CREATE POLICY "Admin Full Access Inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Admin Full Access Expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Admin Full Access Income" ON public.income FOR ALL USING (true);
CREATE POLICY "Admin Full Access Tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Admin Full Access Attendance" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Admin Full Access Gallery" ON public.farm_gallery FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 12. SUPABASE STORAGE BUCKETS & POLICIES
-- --------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES
('farm-images', 'farm-images', true),
('animal-images', 'animal-images', true),
('product-images', 'product-images', true),
('profile-images', 'profile-images', true),
('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read farm-images" ON storage.objects FOR SELECT USING (bucket_id = 'farm-images');
CREATE POLICY "Public Write farm-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'farm-images');
CREATE POLICY "Public Update farm-images" ON storage.objects FOR UPDATE USING (bucket_id = 'farm-images');
CREATE POLICY "Public Delete farm-images" ON storage.objects FOR DELETE USING (bucket_id = 'farm-images');

CREATE POLICY "Public Read animal-images" ON storage.objects FOR SELECT USING (bucket_id = 'animal-images');
CREATE POLICY "Public Write animal-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'animal-images');
CREATE POLICY "Public Update animal-images" ON storage.objects FOR UPDATE USING (bucket_id = 'animal-images');
CREATE POLICY "Public Delete animal-images" ON storage.objects FOR DELETE USING (bucket_id = 'animal-images');

CREATE POLICY "Public Read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public Write product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Public Update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Public Delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

CREATE POLICY "Public Read profile-images" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Public Write profile-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images');
CREATE POLICY "Public Update profile-images" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images');
CREATE POLICY "Public Delete profile-images" ON storage.objects FOR DELETE USING (bucket_id = 'profile-images');

CREATE POLICY "Public Read documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Public Write documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Public Update documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');
CREATE POLICY "Public Delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- --------------------------------------------------------------------
-- 13. REALTIME PUBLICATION ENABLEMENT
-- --------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.farm_gallery;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grass_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- --------------------------------------------------------------------
-- 14. SAMPLE SEED DATA
-- --------------------------------------------------------------------

INSERT INTO public.profiles (id, full_name, mobile_number, email, username, role, address, avatar_url) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Neelam Ramachandraiah', '9502756669', 'admin@farm.com', 'ramachandraiah', 'admin', 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289', '/1.jpeg'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Neelam Subbaiah', '8897288390', 'subbaiah@farm.com', 'subbaiah', 'admin', 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289', '/2.jpeg'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Neelam Sreenivasulu', '9392589010', 'owner9392589010@farm.com', 'owner9392589010', 'admin', 'Devarajapalli Village, Kamalapuram Mandal, YSR Kadapa District, Andhra Pradesh – 516289', '/3.jpeg')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.admins (user_id, designation) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Founder & Senior Managing Director'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Co-Founder & Field Operations Head'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Digital Operator & Systems Manager')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.owners (name, designation, phone, image_url) VALUES
('Neelam Ramachandraiah', 'Founder', '+91 9502756669', '/1.jpeg'),
('Neelam Subbaiah', 'Founder', '+91 8897288390', '/2.jpeg'),
('Neelam Sreenivasulu', 'Digital Operator', '+91 9392589010', '/3.jpeg')
ON CONFLICT DO NOTHING;

INSERT INTO public.settings (setting_key, setting_value) VALUES
('farm_name', 'Lakshmi Venkateshwara Sheep & Natu Kolla Farm'),
('owner_1_name', 'Neelam Ramachandraiah'),
('owner_1_phone', '9502756669'),
('owner_2_name', 'Neelam Subbaiah'),
('owner_2_phone', '8897288390'),
('whatsapp_contact', '9502756669'),
('maps_location_url', 'https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.products (id, name, category, price, unit, stock_quantity, description, image_url, is_available) VALUES
('11111111-1111-1111-1111-111111111111', 'Local Jodipi Breeding Sheep (Prime Live)', 'Sheep', 18500, 'per head', 12, '100% pure Local Jodipi breed sheep. Raised on organic fodder and leguminous grazing.', '', true),
('22222222-2222-2222-2222-222222222222', 'Pure Natu Kolla (Country Live Rooster / Hen)', 'Natu Kolla', 1800, 'per bird (approx 2.5 kg)', 45, 'Authentic village-reared Natu Kolla chicken. 100% free range, fed with millets and natural grains.', '', true),
('33333333-3333-3333-3333-333333333333', 'Super Napier CO-FS-29 Green Grass (Fresh Fodder)', 'Grass', 15, 'per kg', 2500, 'Freshly harvested Super Napier CO-FS-29 hybrid grass grown organically. High crude protein green fodder.', '', true),
('44444444-4444-4444-4444-444444444444', 'Lucerne / Hybrid Pasture Green Grass (Fodder Bundle)', 'Grass', 120, '10 kg bundle', 450, 'Nutritious green alfalfa and leguminous pasture grass cuttings. Rich in protein and essential minerals.', '', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.animals (tag_number, category, breed, gender, age_months, weight_kg, purchase_price, selling_price, status, vaccination_status, medical_history, photo_url) VALUES
('LV-SHP-101', 'Sheep', 'Local Jodipi (White with Black Patches)', 'Male', 18, 42.5, 12000, 18500, 'Healthy', 'Up to Date', 'Deworming done. PPR vaccine administered.', ''),
('LV-SHP-102', 'Sheep', 'Local Palla (Pure White)', 'Female', 14, 35.0, 10500, 15500, 'Healthy', 'Up to Date', 'Regular vitamin supplements & mineral block grazing.', ''),
('LV-NTK-201', 'Natu Kolla', 'Aseel Native Rooster (Fighter Breed)', 'Male', 10, 3.2, 1500, 3200, 'Healthy', 'Up to Date', 'Ranikhet oral drops administered.', '')
ON CONFLICT (tag_number) DO NOTHING;

INSERT INTO public.grass_inventory (grass_type, plot_location, area_acres, quantity_kg, min_stock_threshold_kg, next_harvest_date, status, notes) VALUES
('Subabul & Lucerne Paddock', 'North Paddock Plot 1', 2.5, 1250.00, 200.00, CURRENT_DATE + INTERVAL '5 days', 'Ready for Harvest', 'High protein leguminous green fodder for active sheep herd.'),
('Super Napier Grass', 'East Paddock Plot 2', 3.0, 2400.00, 300.00, CURRENT_DATE + INTERVAL '12 days', 'Growing', 'High yield perennial grass paddock.')
ON CONFLICT DO NOTHING;

INSERT INTO public.feed_inventory (feed_type, quantity_kg, min_stock_threshold_kg, cost_per_kg, notes) VALUES
('Maize Bran & Groundnut Cake Mash', 850.00, 100.00, 28.50, 'Standard morning feed mix for sheep and Natu Kolla poultry.'),
('Mineral Salt Blocks & Vitamin Pellets', 120.00, 25.00, 65.00, 'Essential trace minerals for lamb growth and bone & muscle development.')
ON CONFLICT DO NOTHING;
