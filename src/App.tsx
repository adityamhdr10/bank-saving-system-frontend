import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { CustomerManagement } from "./components/CustomerManagement";
import { AccountManagement } from "./components/AccountManagement";
import { DepositoTypeManagement } from "./components/DepositoTypeManagement";
import { DepositTransaction } from "./components/DepositTransaction";
import { WithdrawalTransaction } from "./components/WithdrawalTransaction";
import {
  Landmark,
  Users,
  Wallet,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

export interface Customer {
  id: string;
  name: string;
}

export interface DepositoType {
  id: string;
  name: string;
  yearlyReturn: number;
}

export interface Account {
  id: string;
  packet: string;
  customerId: string;
  balance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "deposit" | "withdrawal";
  amount: number;
  date: string;
  endingBalance?: number;
}

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [depositoTypes, setDepositoTypes] = useState<DepositoType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // BARU - Load semua data saat app start
  useEffect(() => {
    loadAllData();
  }, []);

  // BARU - Fungsi untuk load semua data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const { customersApi, depositoTypesApi, accountsApi, transactionsApi } =
        await import("./services/api");

      // Load customers
      const customersResponse = await customersApi.getAll();
      if (customersResponse.success) {
        const mappedCustomers = customersResponse.data
          .map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
          }))
          .sort((a: Customer, b: Customer) => Number(a.id) - Number(b.id));
        setCustomers(mappedCustomers);
      }

      // Load deposito types
      const depositoResponse = await depositoTypesApi.getAll();
      if (depositoResponse.success) {
        const mapped = depositoResponse.data.map((d: any) => ({
          id: d.id.toString(),
          name: d.name,
          yearlyReturn: parseFloat(d.yearly_return),
        }));
        setDepositoTypes(mapped);
      }

      // Load accounts
      const accountsResponse = await accountsApi.getAll();
      if (accountsResponse.success) {
        const mappedAccounts = accountsResponse.data
          .map((a: any) => ({
            id: a.id.toString(),
            packet: a.deposito_type_id.toString(),
            customerId: a.customer_id.toString(),
            balance: parseFloat(a.balance),
          }))
          .sort((a: Account, b: Account) => Number(a.id) - Number(b.id));
        setAccounts(mappedAccounts);

        // Load all transactions
        const allTransactions: Transaction[] = [];
        for (const account of mappedAccounts) {
          try {
            const response = await transactionsApi.getByAccount(account.id);
            if (response.success && response.data) {
              const mappedTransactions = response.data.map((t: any) => {
                const rawType =
                  t.type || t.transaction_type || t.transactionType;
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
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Landmark className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-indigo-900">
              Bank Saving System
            </h1>
          </div>
          <p className="text-gray-600">
            Comprehensive banking management platform
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="deposito" className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4" />
              Deposito Types
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              Withdrawal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <CustomerManagement
              customers={customers}
              setCustomers={setCustomers}
              onDataChange={loadAllData}
            />
          </TabsContent>

          <TabsContent value="deposito">
            <DepositoTypeManagement
              depositoTypes={depositoTypes}
              setDepositoTypes={setDepositoTypes}
            />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountManagement
              accounts={accounts}
              setAccounts={setAccounts}
              customers={customers}
              depositoTypes={depositoTypes}
            />
          </TabsContent>

          <TabsContent value="deposit">
            <DepositTransaction
              accounts={accounts}
              setAccounts={setAccounts}
              customers={customers}
              transactions={transactions}
              setTransactions={setTransactions}
            />
          </TabsContent>

          <TabsContent value="withdrawal">
            <WithdrawalTransaction
              accounts={accounts}
              setAccounts={setAccounts}
              customers={customers}
              depositoTypes={depositoTypes}
              transactions={transactions}
              setTransactions={setTransactions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
