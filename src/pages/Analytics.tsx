import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Analytics = () => {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, products(name, category)")
        .order("sale_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Sales by category
  const salesByCategory = products?.reduce((acc, product) => {
    const productSales = sales?.filter((s) => s.product_id === product.id) || [];
    const categoryTotal = productSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    
    if (categoryTotal > 0) {
      const existing = acc.find((item) => item.name === product.category);
      if (existing) {
        existing.value += categoryTotal;
      } else {
        acc.push({ name: product.category, value: categoryTotal });
      }
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  // Expenses by category
  const expensesByCategory = expenses?.reduce((acc, expense) => {
    const existing = acc.find((item) => item.name === expense.category);
    if (existing) {
      existing.value += Number(expense.amount);
    } else {
      acc.push({ name: expense.category, value: Number(expense.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  // Top selling products
  const topProducts = products?.map((product) => {
    const productSales = sales?.filter((s) => s.product_id === product.id) || [];
    const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const revenue = productSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    
    return {
      name: product.name,
      sold: totalSold,
      revenue: revenue,
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || [];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your business performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `KSh ${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="hsl(var(--destructive))"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `KSh ${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `KSh ${Number(value).toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Units Sold'
                  ]}
                />
                <Legend />
                <Bar dataKey="sold" fill="hsl(var(--primary))" name="Units Sold" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
