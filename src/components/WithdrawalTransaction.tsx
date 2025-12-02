import { useState, useEffect } from "react";
import { Account, Customer, DepositoType, Transaction } from "../App";
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
import {
  ArrowDownCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
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

interface WithdrawalTransactionProps {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  customers: Customer[];
  depositoTypes: DepositoType[];
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  onDataChange?: () => void;
}

export function WithdrawalTransaction({
  accounts,
  setAccounts,
  customers,
  depositoTypes,
  transactions,
  setTransactions,
  onDataChange,
}: WithdrawalTransactionProps) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [months, setMonths] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calculatedBalance, setCalculatedBalance] = useState(0);
  const [calculatedInterest, setCalculatedInterest] = useState(0);
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
        } catch (err) {}
      }
      setTransactions(allTransactions);
    } catch (err) {}
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
    } catch (err) {}
  };

  useEffect(() => {
    if (selectedAccountId && months) {
      const account = accounts.find((a) => a.id === selectedAccountId);
      if (account) {
        const depositoType = depositoTypes.find((d) => d.id === account.packet);
        if (depositoType) {
          const monthlyReturn = depositoType.yearlyReturn / 12 / 100;
          const numMonths = parseInt(months);
          const endingBalance =
            account.balance * Math.pow(1 + monthlyReturn, numMonths);
          const interest = endingBalance - account.balance;
          setCalculatedBalance(endingBalance);
          setCalculatedInterest(interest);
        }
      }
    } else {
      setCalculatedBalance(0);
      setCalculatedInterest(0);
    }
  }, [selectedAccountId, months, accounts, depositoTypes]);

  const handleWithdrawal = async () => {
    if (
      !selectedAccountId ||
      !months ||
      !withdrawalAmount ||
      !startDate ||
      !endDate
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in all fields",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const numMonths = parseInt(months);
    if (numMonths <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Period",
        text: "Number of months must be greater than 0",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const withdrawAmount = parseFloat(withdrawalAmount);
    if (withdrawAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Withdrawal amount must be greater than 0",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (withdrawAmount > calculatedBalance) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `Withdrawal amount cannot exceed balance with interest ($${calculatedBalance.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2 }
        )})`,
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Account not found",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await transactionsApi.withdraw({
        account_id: parseInt(selectedAccountId),
        amount: withdrawAmount,
        transaction_date: endDate,
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
          text: "Withdrawal successfully processed!",
          confirmButtonColor: "#3b82f6",
          timer: 2000,
          showConfirmButton: false,
        });

        setSelectedAccountId("");
        setMonths("");
        setWithdrawalAmount("");
        setStartDate("");
        setEndDate("");
        setCalculatedBalance(0);
        setCalculatedInterest(0);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.response?.data?.message || "Failed to process withdrawal",
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

  const getPackageInfo = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return null;
    return depositoTypes.find((d) => d.id === account.packet);
  };

  const selectedPackage = selectedAccountId
    ? getPackageInfo(selectedAccountId)
    : null;

  const recentWithdrawals = transactions
    .filter((t) => t.type === "withdrawal")
    .sort((a, b) => parseInt(b.id) - parseInt(a.id))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-red-600" />
            Withdrawal Transaction
          </CardTitle>
          <CardDescription>
            Withdraw funds with interest calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-account">Select Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger id="withdrawal-account">
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

            {selectedAccountId && selectedPackage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Starting Balance</p>
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
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-200">
                  <div>
                    <p className="text-sm text-gray-600">Package Type</p>
                    <p className="font-semibold text-blue-900">
                      {selectedPackage.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Yearly Return</p>
                    <p className="font-semibold text-blue-900">
                      {selectedPackage.yearlyReturn}%
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Monthly Return Rate</p>
                    <p className="font-semibold text-blue-900">
                      {(selectedPackage.yearlyReturn / 12).toFixed(3)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="withdrawal-months">
                Investment Period (Months)
              </Label>
              <Input
                id="withdrawal-months"
                type="number"
                placeholder="Enter number of months"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                disabled={loading}
              />
            </div>

            {selectedAccountId && months && calculatedBalance > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-emerald-900">
                    Withdrawal Calculation
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                      <p className="text-xs text-gray-600 mb-1">
                        Starting Balance
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        $
                        {getAccountBalance(selectedAccountId).toLocaleString(
                          "en-US",
                          { minimumFractionDigits: 2 }
                        )}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                      <p className="text-xs text-gray-600 mb-1">
                        Investment Period
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        {months} months
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                      <p className="text-xs text-gray-600 mb-1">
                        Interest Earned
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        $
                        {calculatedInterest.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                      <p className="text-xs text-gray-600 mb-1">
                        Balance + Interest
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        $
                        {calculatedBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      Enter the amount you want to withdraw. The remaining
                      balance will stay in the account.
                    </p>
                  </div>

                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Withdrawal Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="pl-7"
                  disabled={loading}
                />
              </div>
              {withdrawalAmount &&
                calculatedBalance > 0 &&
                parseFloat(withdrawalAmount) > calculatedBalance && (
                  <p className="text-xs text-red-600">
                    ⚠️ Amount exceeds balance with interest
                  </p>
                )}
            </div>

             {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                    <>
                      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">
                          Remaining Balance After Withdrawal
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          $
                          {(
                            calculatedBalance - parseFloat(withdrawalAmount)
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </>
                  )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="withdrawal-start-date"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Start Date
                </Label>
                <Input
                  id="withdrawal-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="withdrawal-end-date"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  End Date
                </Label>
                <Input
                  id="withdrawal-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              onClick={handleWithdrawal}
              className="w-full bg-red-600 hover:bg-red-700"
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
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Confirm Withdrawal
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Withdrawals</CardTitle>
          <CardDescription>View latest withdrawal transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentWithdrawals.length === 0 ? (
            <Alert>
              <AlertDescription>
                No withdrawal transactions yet. Make your first withdrawal to
                see it here.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWithdrawals.map((transaction) => (
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
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        -$
                        {transaction.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        $
                        {transaction.endingBalance?.toLocaleString("en-US", {
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
