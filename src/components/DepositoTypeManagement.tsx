import { useState, useEffect } from "react";
import { DepositoType } from "../App";
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
import { Pencil, Trash2, Plus, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { depositoTypesApi } from "../services/api";
import Swal from "sweetalert2";

interface DepositoTypeManagementProps {
  depositoTypes: DepositoType[];
  setDepositoTypes: (depositoTypes: DepositoType[]) => void;
  onDataChange?: () => void;
}

export function DepositoTypeManagement({
  depositoTypes,
  setDepositoTypes,
  onDataChange,
}: DepositoTypeManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentType, setCurrentType] = useState<DepositoType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    yearlyReturn: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (depositoTypes.length === 0) {
      loadDepositoTypes();
    }
  }, []);

  const loadDepositoTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await depositoTypesApi.getAll();
      if (response.success) {
        const mapped = response.data.map((d: any) => ({
          id: d.id.toString(),
          name: d.name,
          yearlyReturn: parseFloat(d.yearly_return),
        }));
        setDepositoTypes(mapped);
      }
    } catch (err: any) {
      console.error("Error loading deposito types:", err);
      setError(err.response?.data?.message || "Failed to load deposito types");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.yearlyReturn) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in all fields",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await depositoTypesApi.create({
        name: formData.name,
        yearly_return: parseFloat(formData.yearlyReturn),
      });

      if (response.success) {
        await loadDepositoTypes();
        setFormData({ name: "", yearlyReturn: "" });
        setIsAddDialogOpen(false);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Deposito type created successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error creating deposito type:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to create deposito type",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.name || !formData.yearlyReturn || !currentType) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in all fields",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await depositoTypesApi.update(currentType.id, {
        name: formData.name,
        yearly_return: parseFloat(formData.yearlyReturn),
      });

      if (response.success) {
        await loadDepositoTypes();
        setIsEditDialogOpen(false);
        setCurrentType(null);
        setFormData({ name: "", yearlyReturn: "" });
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Deposito type updated successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error updating deposito type:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to update deposito type",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "This deposito type will be permanently deleted!",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await depositoTypesApi.delete(typeToDelete);

      if (response.success) {
        await loadDepositoTypes();
        setTypeToDelete(null);
        setIsDeleteDialogOpen(false);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Deposito type deleted successfully!",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err: any) {
      console.error("Error deleting deposito type:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          err.response?.data?.message ||
          "Failed to delete deposito type. It may be in use by accounts.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setTypeToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (type: DepositoType) => {
    setCurrentType(type);
    setFormData({
      name: type.name,
      yearlyReturn: type.yearlyReturn.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const getTierColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("bronze"))
      return "bg-orange-100 text-orange-800 border-orange-300";
    if (lowerName.includes("silver"))
      return "bg-gray-100 text-gray-800 border-gray-300";
    if (lowerName.includes("gold"))
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Deposito Type Management</CardTitle>
            <CardDescription>
              Manage interest tiers and yearly return rates
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Deposito Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Add New Deposito Type
                </DialogTitle>
                <DialogDescription>
                  Enter deposito type details below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type-name">Type Name</Label>
                  <Input
                    id="type-name"
                    placeholder="e.g., Bronze, Silver, Gold"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-return">Yearly Return (%)</Label>
                  <Input
                    id="type-return"
                    type="number"
                    step="0.1"
                    placeholder="Enter yearly return percentage"
                    value={formData.yearlyReturn}
                    onChange={(e) =>
                      setFormData({ ...formData, yearlyReturn: e.target.value })
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
                    "Add Type"
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

        {loading && depositoTypes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="lds-circle medium text-blue-600">
              <div></div>
            </div>
          </div>
        ) : depositoTypes.length === 0 ? (
          <Alert>
            <AlertDescription>
              No deposito types found. Click "Add Deposito Type" to create your
              first type.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Yearly Return</TableHead>
                <TableHead>Monthly Return</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depositoTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.id}</TableCell>
                  <TableCell>
                    <Badge className={getTierColor(type.name)}>
                      {type.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{type.yearlyReturn}%</TableCell>
                  <TableCell>{(type.yearlyReturn / 12).toFixed(3)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(type)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(type.id)}
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
                Edit Deposito Type
              </DialogTitle>
              <DialogDescription>
                Update deposito type details below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type-name">Type Name</Label>
                <Input
                  id="edit-type-name"
                  placeholder="e.g., Bronze, Silver, Gold"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type-return">Yearly Return (%)</Label>
                <Input
                  id="edit-type-return"
                  type="number"
                  step="0.1"
                  placeholder="Enter yearly return percentage"
                  value={formData.yearlyReturn}
                  onChange={(e) =>
                    setFormData({ ...formData, yearlyReturn: e.target.value })
                  }
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
                  "Update Type"
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
                Are you sure you want to delete this deposito type? This action
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
                  "Delete Type"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
