"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { apiService, ApiResult } from "@/lib/services/api";

export interface AppState {
  user: { username: string; role: string } | null;
  categories: any[];
  banks: any[];
  transactions: any[];
  fixedCosts: any[];
  deposits: any[];
  cryptos: any[];
  ecomPlatforms: any[];
  ecommerce: any[];
  inventory: any[];
  subscriptions: any[];
  budgets: any[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

interface AppStateContextType extends AppState {
  refreshData: () => Promise<void>;
  login: (username: string, pin: string) => Promise<ApiResult>;
  logout: () => Promise<void>;
  updateProfile: (username?: string, pin?: string) => Promise<ApiResult>;
  
  // Mutations
  addCategory: (name: string, type: string, parentId?: string) => Promise<ApiResult>;
  deleteCategory: (id: string) => Promise<ApiResult>;
  
  addBank: (name: string, accountNumber: string, initialBalance: number, accountType: string) => Promise<ApiResult>;
  deleteBank: (id: string) => Promise<ApiResult>;
  
  addTransaction: (data: any) => Promise<ApiResult>;
  updateTransaction: (data: any) => Promise<ApiResult>;
  deleteTransaction: (id: string) => Promise<ApiResult>;
  
  saveBudget: (month: string, categoryName: string, limit: number) => Promise<ApiResult>;
  deleteBudget: (id: string) => Promise<ApiResult>;
  copyBudgets: (sourceMonth: string, targetMonth: string) => Promise<ApiResult>;
  
  addFixedCost: (name: string, amount: number, categoryName: string) => Promise<ApiResult>;
  deleteFixedCost: (id: string) => Promise<ApiResult>;
  
  addDeposit: (data: any) => Promise<ApiResult>;
  updateDepositStatus: (id: string, status: string) => Promise<ApiResult>;
  deleteDeposit: (id: string) => Promise<ApiResult>;
  
  addCrypto: (name: string, quantity: number, valueIdr: number) => Promise<ApiResult>;
  updateCrypto: (id: string, name: string, quantity: number, valueIdr: number) => Promise<ApiResult>;
  deleteCrypto: (id: string) => Promise<ApiResult>;
  
  addEcomPlatform: (platform: string, storeName?: string) => Promise<ApiResult>;
  deleteEcomPlatform: (id: string) => Promise<ApiResult>;
  
  addEcomTransaction: (data: any) => Promise<ApiResult>;
  deleteEcomTransaction: (id: string) => Promise<ApiResult>;
  
  addInventoryItem: (data: any) => Promise<ApiResult>;
  updateInventoryItem: (data: any) => Promise<ApiResult>;
  deleteInventoryItem: (id: string) => Promise<ApiResult>;
  
  addSubscription: (data: any) => Promise<ApiResult>;
  updateSubscription: (data: any) => Promise<ApiResult>;
  deleteSubscription: (id: string) => Promise<ApiResult>;
  
  confirmState: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: "warning" | "danger" | "info";
  };
  alertState: {
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "info";
  };
  showConfirm: (message: string, onConfirm: () => void, options?: { title?: string; type?: "warning" | "danger" | "info" }) => void;
  showAlert: (message: string, type?: "success" | "error" | "info") => void;
  hideAlert: () => void;
}

const defaultState: AppState = {
  user: null,
  categories: [],
  banks: [],
  transactions: [],
  fixedCosts: [],
  deposits: [],
  cryptos: [],
  ecomPlatforms: [],
  ecommerce: [],
  inventory: [],
  subscriptions: [],
  budgets: [],
  loading: true,
  syncing: false,
  error: null,
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  // Custom Confirm & Alert dialog states
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: "warning" | "danger" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    type: "warning",
  });

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const showConfirm = (message: string, onConfirmCallback: () => void, options?: { title?: string; type?: "warning" | "danger" | "info" }) => {
    setConfirmState({
      isOpen: true,
      title: options?.title || "Konfirmasi Tindakan",
      message,
      onConfirm: () => {
        onConfirmCallback();
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
      type: options?.type || "warning",
    });
  };

  const showAlert = (message: string, type: "success" | "error" | "info" = "success") => {
    setAlertState({
      isOpen: true,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const refreshData = useCallback(async () => {
    setState((s) => ({ ...s, syncing: true }));
    try {
      const res = await apiService.loadBatchData();
      if (res.status === "success" && res.data) {
        setState((s) => ({
          ...s,
          ...res.data,
          syncing: false,
          error: null,
        }));
      } else {
        setState((s) => ({ ...s, syncing: false, error: res.message || "Failed to load data" }));
      }
    } catch (e: any) {
      setState((s) => ({ ...s, syncing: false, error: e.message || "Network error" }));
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const sessionRes = await apiService.getSession();
        if (sessionRes.status === "success" && (sessionRes as any).username) {
          setState((s) => ({
            ...s,
            user: { username: (sessionRes as any).username, role: (sessionRes as any).role || "admin" },
          }));
          await refreshData();
        }
      } catch (err) {
        // Not logged in or expired
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    }
    initSession();
  }, [refreshData]);

  const login = async (username: string, pin: string): Promise<ApiResult> => {
    setState((s) => ({ ...s, syncing: true }));
    const res = await apiService.login(username, pin);
    if (res.status === "success") {
      setState((s) => ({
        ...s,
        user: { username, role: (res as any).role || "admin" },
        syncing: false,
      }));
      await refreshData();
    } else {
      setState((s) => ({ ...s, syncing: false }));
    }
    return res;
  };

  const logout = async () => {
    setState((s) => ({ ...s, syncing: true }));
    await apiService.logout();
    setState(() => ({
      ...defaultState,
      loading: false,
    }));
  };

  const updateProfile = async (username?: string, pin?: string): Promise<ApiResult> => {
    setState((s) => ({ ...s, syncing: true }));
    const res = await apiService.updateProfile(username, pin);
    if (res.status === "success" && username) {
      setState((s) => ({
        ...s,
        user: s.user ? { ...s.user, username } : null,
        syncing: false,
      }));
    } else {
      setState((s) => ({ ...s, syncing: false }));
    }
    return res;
  };

  // Helper function to execute state updates and trigger background syncs
  const executeMutation = async (
    apiCall: () => Promise<ApiResult>
  ): Promise<ApiResult> => {
    setState((s) => ({ ...s, syncing: true }));
    const result = await apiCall();
    if (result.status === "success") {
      await refreshData();
    } else {
      setState((s) => ({ ...s, syncing: false }));
    }
    return result;
  };

  // Category mutations
  const addCategory = (name: string, type: string, parentId?: string) =>
    executeMutation(() => apiService.addCategory(name, type, parentId));

  const deleteCategory = (id: string) =>
    executeMutation(() => apiService.deleteCategory(id));

  // Bank mutations
  const addBank = (name: string, accountNumber: string, initialBalance: number, accountType: string) =>
    executeMutation(() => apiService.addBank(name, accountNumber, initialBalance, accountType));

  const deleteBank = (id: string) =>
    executeMutation(() => apiService.deleteBank(id));

  // Transaction mutations
  const addTransaction = (data: any) =>
    executeMutation(() => apiService.addTransaction(data));

  const updateTransaction = (data: any) =>
    executeMutation(() => apiService.updateTransaction(data));

  const deleteTransaction = (id: string) =>
    executeMutation(() => apiService.deleteTransaction(id));

  // Budget mutations
  const saveBudget = (month: string, categoryName: string, limit: number) =>
    executeMutation(() => apiService.saveBudget(month, categoryName, limit));

  const deleteBudget = (id: string) =>
    executeMutation(() => apiService.deleteBudget(id));

  const copyBudgets = (sourceMonth: string, targetMonth: string) =>
    executeMutation(() => apiService.copyBudgets(sourceMonth, targetMonth));

  // Fixed Cost mutations
  const addFixedCost = (name: string, amount: number, categoryName: string) =>
    executeMutation(() => apiService.addFixedCost(name, amount, categoryName));

  const deleteFixedCost = (id: string) =>
    executeMutation(() => apiService.deleteFixedCost(id));

  // Deposit mutations
  const addDeposit = (data: any) =>
    executeMutation(() => apiService.addDeposit(data));

  const updateDepositStatus = (id: string, status: string) =>
    executeMutation(() => apiService.updateDepositStatus(id, status));

  const deleteDeposit = (id: string) =>
    executeMutation(() => apiService.deleteDeposit(id));

  // Crypto mutations
  const addCrypto = (name: string, quantity: number, valueIdr: number) =>
    executeMutation(() => apiService.addCrypto(name, quantity, valueIdr));

  const updateCrypto = (id: string, name: string, quantity: number, valueIdr: number) =>
    executeMutation(() => apiService.updateCrypto(id, name, quantity, valueIdr));

  const deleteCrypto = (id: string) =>
    executeMutation(() => apiService.deleteCrypto(id));

  // Ecommerce Platform mutations
  const addEcomPlatform = (platform: string, storeName?: string) =>
    executeMutation(() => apiService.addEcomPlatform(platform, storeName));

  const deleteEcomPlatform = (id: string) =>
    executeMutation(() => apiService.deleteEcomPlatform(id));

  // Ecommerce Transaction mutations
  const addEcomTransaction = (data: any) =>
    executeMutation(() => apiService.addEcomTransaction(data));

  const deleteEcomTransaction = (id: string) =>
    executeMutation(() => apiService.deleteEcomTransaction(id));

  // Inventory mutations
  const addInventoryItem = (data: any) =>
    executeMutation(() => apiService.addInventoryItem(data));

  const updateInventoryItem = (data: any) =>
    executeMutation(() => apiService.updateInventoryItem(data));

  const deleteInventoryItem = (id: string) =>
    executeMutation(() => apiService.deleteInventoryItem(id));

  // Subscription mutations
  const addSubscription = (data: any) =>
    executeMutation(() => apiService.addSubscription(data));

  const updateSubscription = (data: any) =>
    executeMutation(() => apiService.updateSubscription(data));

  const deleteSubscription = (id: string) =>
    executeMutation(() => apiService.deleteSubscription(id));

  return (
    <AppStateContext.Provider
      value={{
        ...state,
        refreshData,
        login,
        logout,
        updateProfile,
        addCategory,
        deleteCategory,
        addBank,
        deleteBank,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        saveBudget,
        deleteBudget,
        copyBudgets,
        confirmState,
        alertState,
        showConfirm,
        showAlert,
        hideAlert,
        addFixedCost,
        deleteFixedCost,
        addDeposit,
        updateDepositStatus,
        deleteDeposit,
        addCrypto,
        updateCrypto,
        deleteCrypto,
        addEcomPlatform,
        deleteEcomPlatform,
        addEcomTransaction,
        deleteEcomTransaction,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addSubscription,
        updateSubscription,
        deleteSubscription,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
