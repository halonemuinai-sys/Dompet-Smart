export interface ApiResult<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

const handleResponse = async (res: Response): Promise<ApiResult> => {
  try {
    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.message || "Request failed" };
    }
    return data;
  } catch (e) {
    return { status: "error", message: "Gagal memproses data server." };
  }
};

export const apiService = {
  // Auth APIs
  async login(username: string, pin: string): Promise<ApiResult> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });
    return handleResponse(res);
  },

  async logout(): Promise<ApiResult> {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    return handleResponse(res);
  },

  async getSession(): Promise<ApiResult> {
    const res = await fetch("/api/auth/session");
    return handleResponse(res);
  },

  async updateProfile(username?: string, pin?: string): Promise<ApiResult> {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });
    return handleResponse(res);
  },

  // Batch load
  async loadBatchData(): Promise<ApiResult> {
    const res = await fetch("/api/batch");
    return handleResponse(res);
  },

  // Categories
  async addCategory(name: string, type: string, parentId?: string): Promise<ApiResult> {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, parentId }),
    });
    return handleResponse(res);
  },

  async deleteCategory(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Banks
  async addBank(name: string, accountNumber: string, initialBalance: number, accountType: string): Promise<ApiResult> {
    const res = await fetch("/api/banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, accountNumber, initialBalance, accountType }),
    });
    return handleResponse(res);
  },

  async deleteBank(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/banks?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Transactions
  async addTransaction(data: {
    type: string;
    amount: number;
    date: string;
    description: string;
    bankId: string;
    categoryName?: string;
    subCategoryName?: string;
    discount?: number;
    transferToBankId?: string;
  }): Promise<ApiResult> {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateTransaction(data: {
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
    bankId: string;
    categoryName: string;
    subCategoryName?: string;
    discount?: number;
  }): Promise<ApiResult> {
    const res = await fetch("/api/transactions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteTransaction(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Budgets
  async saveBudget(month: string, categoryName: string, limit: number): Promise<ApiResult> {
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, categoryName, limit }),
    });
    return handleResponse(res);
  },

  async deleteBudget(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Fixed Costs
  async addFixedCost(name: string, amount: number, categoryName: string): Promise<ApiResult> {
    const res = await fetch("/api/fixed-costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount, categoryName }),
    });
    return handleResponse(res);
  },

  async deleteFixedCost(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/fixed-costs?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Deposits
  async addDeposit(data: {
    name: string;
    bankId: string;
    amount: number;
    rate: number;
    tenor: number;
    startDate: string;
    maturityDate: string;
  }): Promise<ApiResult> {
    const res = await fetch("/api/portfolio/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateDepositStatus(id: string, status: string): Promise<ApiResult> {
    const res = await fetch("/api/portfolio/deposits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    return handleResponse(res);
  },

  async deleteDeposit(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/portfolio/deposits?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Cryptos
  async addCrypto(name: string, quantity: number, valueIdr: number): Promise<ApiResult> {
    const res = await fetch("/api/portfolio/cryptos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, valueIdr }),
    });
    return handleResponse(res);
  },

  async updateCrypto(id: string, name: string, quantity: number, valueIdr: number): Promise<ApiResult> {
    const res = await fetch("/api/portfolio/cryptos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, quantity, valueIdr }),
    });
    return handleResponse(res);
  },

  async deleteCrypto(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/portfolio/cryptos?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Ecommerce Platforms
  async addEcomPlatform(platform: string, storeName?: string): Promise<ApiResult> {
    const res = await fetch("/api/ecommerce/platforms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, storeName }),
    });
    return handleResponse(res);
  },

  async deleteEcomPlatform(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/ecommerce/platforms?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Ecommerce Transactions
  async addEcomTransaction(data: {
    date: string;
    platformId: string;
    itemName: string;
    categoryName: string;
    amount: number;
    bankId: string;
    tenor: number;
  }): Promise<ApiResult> {
    const res = await fetch("/api/ecommerce/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteEcomTransaction(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/ecommerce/transactions?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Inventory
  async addInventoryItem(data: {
    itemName: string;
    categoryName: string;
    purchasePrice: number;
    purchaseDate: string;
    lifespanMonths: number;
    condition: string;
    source?: string;
    ecomId?: string;
  }): Promise<ApiResult> {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateInventoryItem(data: {
    id: string;
    itemName: string;
    categoryName: string;
    purchasePrice: number;
    purchaseDate: string;
    lifespanMonths: number;
    condition: string;
  }): Promise<ApiResult> {
    const res = await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteInventoryItem(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  // Subscriptions
  async addSubscription(data: {
    name: string;
    email?: string;
    amount: number;
    billingCycle: string;
    dueDate: string;
    categoryName: string;
    bankId: string;
  }): Promise<ApiResult> {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateSubscription(data: {
    id: string;
    name: string;
    email?: string;
    amount: number;
    billingCycle: string;
    dueDate: string;
    categoryName: string;
    bankId: string;
    status: string;
  }): Promise<ApiResult> {
    const res = await fetch("/api/subscriptions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteSubscription(id: string): Promise<ApiResult> {
    const res = await fetch(`/api/subscriptions?id=${id}`, { method: "DELETE" });
    return handleResponse(res);
  },
};
