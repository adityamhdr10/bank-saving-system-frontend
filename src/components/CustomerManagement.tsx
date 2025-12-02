import { useState, useEffect } from "react";
import { Customer } from "../App";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Pencil, Trash2, Plus, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { customersApi } from "../services/api";
import Swal from "sweetalert2";

interface CustomerManagementProps {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  onDataChange?: () => void;
}

export function CustomerManagement({
  customers,
  setCustomers,
  onDataChange,
}: CustomerManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customers.length === 0) {
      loadCustomers();
    }
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersApi.getAll();
      if (response.success) {
        const mappedCustomers = response.data
          .map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
          }))
          .sort((a: Customer, b: Customer) => Number(a.id) - Number(b.id));

        setCustomers(mappedCustomers);
      }
    } catch (err: any) {
      console.error("Error loading customers:", err);
      setError(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in the name field",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await customersApi.create({
        name: formData.name,
      });

      if (response.success) {
        await loadCustomers();
        setFormData({ name: "" });
        setIsAddDialogOpen(false);
        onDataChange?.();
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Customer created successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error creating customer:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to create customer",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.name || !currentCustomer) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in the name field",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await customersApi.update(currentCustomer.id, {
        name: formData.name,
      });

      if (response.success) {
        await loadCustomers();
        setIsEditDialogOpen(false);
        setCurrentCustomer(null);
        setFormData({ name: "" });
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Customer updated successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error updating customer:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to update customer",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "This customer will be permanently deleted!",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await customersApi.delete(customerToDelete);

      if (response.success) {
        await loadCustomers();
        setCustomerToDelete(null);
        setIsDeleteDialogOpen(false);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Customer deleted successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error deleting customer:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to delete customer",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCustomerToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({ name: customer.name });
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Customer Management</CardTitle>
            <CardDescription>
              Create, read, update, and delete customer records
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add New Customer
                </DialogTitle>
                <DialogDescription>
                  Enter customer details below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="lds-circle small">
                        <div></div>
                      </div>
                      <span className="ml-2">Adding...</span>
                    </>
                  ) : (
                    "Add Customer"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && customers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="lds-circle medium text-blue-600">
              <div></div>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <Alert>
            <AlertDescription>
              No customers found. Click "Add Customer" to create your first
              customer record.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(customer)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(customer.id)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Edit Customer
              </DialogTitle>
              <DialogDescription>
                Update customer details below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-customer-name">Customer Name</Label>
                <Input
                  id="edit-customer-name"
                  placeholder="Enter customer name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="lds-circle small">
                      <div></div>
                    </div>
                    <span className="ml-2">Updating...</span>
                  </>
                ) : (
                  "Update Customer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="lds-circle small">
                      <div></div>
                    </div>
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  "Delete Customer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
