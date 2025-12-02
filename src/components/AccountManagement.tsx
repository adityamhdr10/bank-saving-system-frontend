import { useState, useEffect } from "react";
import { Account, Customer, DepositoType } from "../App";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Pencil, Trash2, Plus, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { accountsApi } from "../services/api";
import Swal from "sweetalert2";

interface AccountManagementProps {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  customers: Customer[];
  depositoTypes: DepositoType[];
  onDataChange?: () => void;
}

export function AccountManagement({
  accounts,
  setAccounts,
  customers,
  depositoTypes,
  onDataChange,
}: AccountManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    packet: "",
    customerId: "",
    balance: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (accounts.length === 0) {
    loadAccounts();
  }
}, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountsApi.getAll();
      if (response.success) {
        const mapped = response.data
          .map((a: any) => ({
            id: a.id.toString(),
            packet: a.deposito_type_id.toString(),
            customerId: a.customer_id.toString(),
            balance: parseFloat(a.balance),
          }))
          .sort((a: Customer, b: Customer) => Number(a.id) - Number(b.id)); 
        setAccounts(mapped);
      }
    } catch (err: any) {
      console.error("Error loading accounts:", err);
      setError(err.response?.data?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.packet || !formData.customerId) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in all required fields",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await accountsApi.create({
        customer_id: parseInt(formData.customerId),
        deposito_type_id: parseInt(formData.packet),
        balance: formData.balance ? parseFloat(formData.balance) : 0,
      });

      if (response.success) {
        await loadAccounts();
        setFormData({ packet: "", customerId: "", balance: "" });
        setIsAddDialogOpen(false);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Account created successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error creating account:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to create account",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.packet || !currentAccount) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please select a deposito package",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await accountsApi.update(currentAccount.id, {
        deposito_type_id: parseInt(formData.packet),
      });

      if (response.success) {
        await loadAccounts();
        setIsEditDialogOpen(false);
        setCurrentAccount(null);
        setFormData({ packet: "", customerId: "", balance: "" });
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Account updated successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error updating account:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to update account",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "This account will be permanently deleted!",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await accountsApi.delete(accountToDelete);

      if (response.success) {
        await loadAccounts();
        setAccountToDelete(null);
        setIsDeleteDialogOpen(false);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Account deleted successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error deleting account:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          err.response?.data?.message ||
          "Failed to delete account. It may have transactions.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setAccountToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setCurrentAccount(account);
    setFormData({
      packet: account.packet,
      customerId: account.customerId,
      balance: account.balance.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || "Unknown";
  };

  const getPacketName = (packetId: string) => {
    return depositoTypes.find((d) => d.id === packetId)?.name || "Unknown";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Account Management</CardTitle>
            <CardDescription>
              Manage customer accounts and balances
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Add New Account
                </DialogTitle>
                <DialogDescription>
                  Enter account details below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="account-customer">Customer</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customerId: value })
                    }
                  >
                    <SelectTrigger id="account-customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} (ID: {customer.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-packet">Deposito Package</Label>
                  <Select
                    value={formData.packet}
                    onValueChange={(value) =>
                      setFormData({ ...formData, packet: value })
                    }
                  >
                    <SelectTrigger id="account-packet">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {depositoTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.yearlyReturn}% yearly)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-balance">
                    Initial Balance (Optional)
                  </Label>
                  <Input
                    id="account-balance"
                    type="number"
                    placeholder="Enter initial balance (default: 0)"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
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
                    "Add Account"
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

        {loading && accounts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="lds-circle medium text-blue-600">
              <div></div>
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <Alert>
            <AlertDescription>
              No accounts found. Click "Add Account" to create your first
              account record.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.id}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getPacketName(account.packet)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getCustomerName(account.customerId)}</TableCell>
                  <TableCell>
                    $
                    {account.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(account)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(account.id)}
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
                Edit Account
              </DialogTitle>
              <DialogDescription>
                Update account deposito package
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-account-packet">Deposito Package</Label>
                <Select
                  value={formData.packet}
                  onValueChange={(value) =>
                    setFormData({ ...formData, packet: value })
                  }
                >
                  <SelectTrigger id="edit-account-packet">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositoTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.yearlyReturn}% yearly)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  "Update Account"
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
                Are you sure you want to delete this account? This action cannot
                be undone.
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
                  "Delete Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
