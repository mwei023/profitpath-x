import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const Sales = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    payment_method: "Cash",
  });

  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, products(name, category, sell_price)")
        .order("sale_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createSale = useMutation({
    mutationFn: async (newSale: typeof formData) => {
      const product = products?.find((p) => p.id === newSale.product_id);
      if (!product) throw new Error("Product not found");

      const quantity = parseInt(newSale.quantity);
      const unit_price = Number(product.sell_price);
      const total_amount = unit_price * quantity;

      // Insert sale
      const { error: saleError } = await supabase.from("sales").insert([
        {
          product_id: newSale.product_id,
          quantity,
          unit_price,
          total_amount,
          payment_method: newSale.payment_method,
        },
      ]);
      if (saleError) throw saleError;

      // Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: product.stock_quantity - quantity })
        .eq("id", newSale.product_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setFormData({ product_id: "", quantity: "", payment_method: "Cash" });
      toast.success("Sale recorded successfully!");
    },
    onError: () => {
      toast.error("Failed to record sale");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSale.mutate(formData);
  };

  const selectedProduct = products?.find((p) => p.id === formData.product_id);
  const estimatedTotal = selectedProduct
    ? Number(selectedProduct.sell_price) * (parseInt(formData.quantity) || 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">Record and track all sales transactions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - KSh {Number(product.sell_price).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                    <SelectItem value="Debt">On Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {estimatedTotal > 0 && (
                <div className="rounded-lg border bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-accent">KSh {estimatedTotal.toLocaleString()}</p>
                </div>
              )}
              <Button type="submit" className="w-full">
                Record Sale
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading sales...</div>
      ) : (
        <div className="space-y-4">
          {sales?.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{sale.products?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {sale.quantity} units × KSh {Number(sale.unit_price).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.sale_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">
                    +KSh {Number(sale.total_amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{sale.payment_method}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sales;
