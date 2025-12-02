import { useState, useEffect } from "react";
import { Account, Customer, Transaction } from "../App";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowUpCircle, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { transactionsApi, accountsApi } from "../services/api";
import Swal from "sweetalert2";

interface DepositTransactionProps {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  customers: Customer[];
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  onDataChange?: () => void;
}

export function DepositTransaction({
  accounts,
  setAccounts,
  customers,
  transactions,
  setTransactions,
  onDataChange,
}: DepositTransactionProps) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (accounts.length > 0 && transactions.length === 0) {
    loadAllTransactions();
  }
}, [accounts.length]);

  useEffect(() => {
    if (selectedAccountId) {
      loadTransactionHistory(selectedAccountId);
    }
  }, [selectedAccountId]);

  const loadAllTransactions = async () => {
    try {
      const allTransactions: Transaction[] = [];

      for (const account of accounts) {
        try {
          const response = await transactionsApi.getByAccount(account.id);

          if (response.success && response.data) {
            const mappedTransactions = response.data.map((t: any) => {
              const rawType = t.type || t.transaction_type || t.transactionType;
              let transactionType: "deposit" | "withdrawal" = "deposit";

              if (rawType === "withdraw" || rawType === "withdrawal") {
                transactionType = "withdrawal";
              } else if (rawType === "deposit") {
                transactionType = "deposit";
              }

              return {
                id: t.id.toString(),
                accountId: t.account_id.toString(),
                type: transactionType,
                amount: parseFloat(t.amount),
                date: t.transaction_date,
                endingBalance: t.balance_after
                  ? parseFloat(t.balance_after)
                  : undefined,
              };
            });

            allTransactions.push(...mappedTransactions);
          }
        } catch (err) {
          console.error(
            `Error loading transactions for account ${account.id}:`,
            err
          );
        }
      }

      setTransactions(allTransactions);
    } catch (err) {
      console.error("Error loading all transactions:", err);
    }
  };

  const loadTransactionHistory = async (accountId: string) => {
    try {
      const response = await transactionsApi.getByAccount(accountId);
      if (response.success) {
        const mappedTransactions = response.data.map((t: any) => {
          const rawType = t.type || t.transaction_type || t.transactionType;
          let transactionType: "deposit" | "withdrawal" = "deposit";

          if (rawType === "withdraw" || rawType === "withdrawal") {
            transactionType = "withdrawal";
          } else if (rawType === "deposit") {
            transactionType = "deposit";
          }

          return {
            id: t.id.toString(),
            accountId: t.account_id.toString(),
            type: transactionType,
            amount: parseFloat(t.amount),
            date: t.transaction_date,
            endingBalance: t.balance_after
              ? parseFloat(t.balance_after)
              : undefined,
          };
        });
        setTransactions(mappedTransactions);
      }
    } catch (err) {
      console.error("Error loading transaction history:", err);
    }
  };

  const handleDeposit = async () => {
    if (!selectedAccountId || !amount || !date) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in all fields",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Deposit amount must be greater than 0",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await transactionsApi.deposit({
        account_id: parseInt(selectedAccountId),
        amount: depositAmount,
        transaction_date: date,
      });

      if (response.success) {
        const accountsResponse = await accountsApi.getAll();
        if (accountsResponse.success) {
          const mappedAccounts = accountsResponse.data.map((a: any) => ({
            id: a.id.toString(),
            packet: a.deposito_type_id.toString(),
            customerId: a.customer_id.toString(),
            balance: parseFloat(a.balance),
          }));
          setAccounts(mappedAccounts);
        }

        await loadAllTransactions();
        onDataChange?.();

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Deposit successfully processed!",
          confirmButtonColor: "#3b82f6",
          timer: 2000,
          showConfirmButton: false,
        });

        setSelectedAccountId("");
        setAmount("");
        setDate("");
      }
    } catch (err: any) {
      console.error("Error processing deposit:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to process deposit",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return "Unknown";
    return (
      customers.find((c) => c.id === account.customerId)?.name || "Unknown"
    );
  };

  const getAccountBalance = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.balance || 0;
  };

  const recentDeposits = transactions
    .filter((t) => t.type === "deposit")
    .sort((a, b) => parseInt(b.id) - parseInt(a.id))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-green-600" />
            Deposit Transaction
          </CardTitle>
          <CardDescription>Add funds to customer accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-account">Select Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger id="deposit-account">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      Account {account.id} - {getCustomerName(account.id)}{" "}
                      (Balance: ${account.balance.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccountId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-900">
                      $
                      {getAccountBalance(selectedAccountId).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Holder</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {getCustomerName(selectedAccountId)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Deposit Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  disabled={loading}
                />
              </div>
            </div>

            {amount && selectedAccountId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  New Balance After Deposit
                </p>
                <p className="text-2xl font-bold text-green-900">
                  $
                  {(
                    getAccountBalance(selectedAccountId) +
                    parseFloat(amount || "0")
                  ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deposit-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Transaction Date
              </Label>
              <Input
                id="deposit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleDeposit}
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="lds-circle small">
                    <div></div>
                  </div>
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Process Deposit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deposits</CardTitle>
          <CardDescription>View latest deposit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDeposits.length === 0 ? (
            <Alert>
              <AlertDescription>
                No deposit transactions yet. Make your first deposit to see it
                here.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeposits.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {transaction.date}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getCustomerName(transaction.accountId)}
                      <br />
                      <span className="text-xs text-gray-500">
                        Acc #{transaction.accountId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        +$
                        {transaction.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
