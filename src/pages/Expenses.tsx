import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

const Expenses = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "Operations",
    amount: "",
    description: "",
  });

  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createExpense = useMutation({
    mutationFn: async (newExpense: typeof formData) => {
      const { error } = await supabase.from("expenses").insert([
        {
          category: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setOpen(false);
      setFormData({ category: "Operations", amount: "", description: "" });
      toast.success("Expense recorded successfully!");
    },
    onError: () => {
      toast.error("Failed to record expense");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate(formData);
  };

  const categories = ["Operations", "Materials", "Transport", "Utilities", "Packaging", "Marketing", "Other"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track all business expenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KSh)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter expense details..."
                />
              </div>
              <Button type="submit" className="w-full">
                Record Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading expenses...</div>
      ) : (
        <div className="space-y-4">
          {expenses?.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <Receipt className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{expense.category}</h3>
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expense_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">
                    -KSh {Number(expense.amount).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Expenses;
