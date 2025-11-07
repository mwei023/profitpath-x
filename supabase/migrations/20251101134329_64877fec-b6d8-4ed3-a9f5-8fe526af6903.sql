-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sell_price DECIMAL(10, 2) NOT NULL CHECK (sell_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_alert INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Public access policies (for v1, will add auth later)
CREATE POLICY "Public read access for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert access for products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public delete access for products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Public read access for sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Public insert access for sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for sales" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Public delete access for sales" ON public.sales FOR DELETE USING (true);

CREATE POLICY "Public read access for expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public insert access for expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Public delete access for expenses" ON public.expenses FOR DELETE USING (true);

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.products (name, category, sell_price, stock_quantity, low_stock_alert) VALUES
  ('Premium Booklet A5', 'Booklets', 150.00, 45, 10),
  ('Standard Pen Blue', 'Pens', 25.00, 120, 20),
  ('Chocolate Chip Cookies (Box)', 'Cookies', 200.00, 30, 15),
  ('Luxury Pen Set', 'Pens', 450.00, 15, 5),
  ('Oatmeal Cookies (Box)', 'Cookies', 180.00, 25, 10);