import axios from "axios";

const API_BASE_URL =
  "https://bank-saving-system-api-production.up.railway.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// CUSTOMERS API
// ============================================

export const customersApi = {
  // GET all customers
  getAll: async () => {
    const response = await api.get("/customers");
    return response.data;
  },

  // GET customer by ID
  getById: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // CREATE customer
  create: async (data: { name: string }) => {
    const response = await api.post("/customers", data);
    return response.data;
  },

  // UPDATE customer
  update: async (id: string, data: { name: string }) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // DELETE customer
  delete: async (id: string) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};

// ============================================
// DEPOSITO TYPES API
// ============================================

export const depositoTypesApi = {
  // GET all deposito types
  getAll: async () => {
    const response = await api.get("/deposito-types");
    return response.data;
  },

  // GET deposito type by ID
  getById: async (id: string) => {
    const response = await api.get(`/deposito-types/${id}`);
    return response.data;
  },

  // CREATE deposito type
  create: async (data: { name: string; yearly_return: number }) => {
    const response = await api.post("/deposito-types", data);
    return response.data;
  },

  // UPDATE deposito type
  update: async (id: string, data: { name: string; yearly_return: number }) => {
    const response = await api.put(`/deposito-types/${id}`, data);
    return response.data;
  },

  // DELETE deposito type
  delete: async (id: string) => {
    const response = await api.delete(`/deposito-types/${id}`);
    return response.data;
  },
};

// ============================================
// ACCOUNTS API
// ============================================

export const accountsApi = {
  // GET all accounts
  getAll: async () => {
    const response = await api.get("/accounts");
    return response.data;
  },

  // GET account by ID
  getById: async (id: string) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  // GET accounts by customer ID
  getByCustomer: async (customerId: string) => {
    const response = await api.get(`/accounts/customer/${customerId}`);
    return response.data;
  },

  // CREATE account
  create: async (data: {
    customer_id: number;
    deposito_type_id: number;
    balance?: number;
  }) => {
    const response = await api.post("/accounts", data);
    return response.data;
  },

  // UPDATE account
  update: async (id: string, data: { deposito_type_id: number }) => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  },

  // DELETE account
  delete: async (id: string) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },
};

// ============================================
// TRANSACTIONS API
// ============================================

export const transactionsApi = {
  // GET transaction history by account
  getByAccount: async (accountId: string) => {
    const response = await api.get(`/transactions/account/${accountId}`);
    return response.data;
  },

  // DEPOSIT
  deposit: async (data: {
    account_id: number;
    amount: number;
    transaction_date: string;
  }) => {
    const response = await api.post("/transactions/deposit", data);
    return response.data;
  },

  // WITHDRAW
  withdraw: async (data: {
    account_id: number;
    amount: number;
    transaction_date: string;
  }) => {
    const response = await api.post("/transactions/withdraw", data);
    return response.data;
  },
};

export default api;
