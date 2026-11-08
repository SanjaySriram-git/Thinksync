"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================= */
/* TYPES                                                          */
/* ============================================================= */

type TransactionType = "income" | "expense";
type Frequency = "none" | "weekly" | "monthly";
type ViewMode = "list" | "monthly";
type Theme = "dark" | "light";

type Account = {
  id: string;
  name: string;
};

type Transaction = {
  id: number;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  tags: string[];
  recurring: Frequency;
};

type Budget = {
  category: string;
  limit: number;
};

type ToastState = {
  message: string;
  onUndo?: () => void;
};

/* ============================================================= */
/* CONSTANTS                                                      */
/* ============================================================= */

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Education",
  "Entertainment",
  "Health",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Allowance",
  "Scholarship",
  "Business",
  "Other",
];

const CURRENCIES: Record<string, { symbol: string; locale: string }> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
};

const CATEGORY_COLORS = [
  "#00bce9",
  "#7045ff",
  "#ff5a7a",
  "#37d37b",
  "#ffb84d",
  "#4dc9ff",
  "#c96dff",
  "#ff8a4d",
];

const STORAGE_KEYS = {
  transactions: "thinksync-expense-transactions",
  accounts: "thinksync-expense-accounts",
  budgets: "thinksync-expense-budgets",
  theme: "thinksync-expense-theme",
  currency: "thinksync-expense-currency",
};

const DEFAULT_ACCOUNT: Account = { id: "default", name: "Cash" };

const emptyForm = {
  type: "expense" as TransactionType,
  amount: "",
  category: "Food",
  description: "",
  date: new Date().toISOString().split("T")[0],
  tags: "",
  recurring: "none" as Frequency,
};

/* ============================================================= */
/* HELPERS                                                        */
/* ============================================================= */

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addInterval(date: Date, frequency: Frequency) {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  return next;
}

function monthKey(date: string) {
  return date.slice(0, 7); // YYYY-MM
}

/* ============================================================= */
/* COMPONENT                                                      */
/* ============================================================= */

export default function ExpensePage() {
  const [mounted, setMounted] = useState(false);

  // splash
  const [showSplash, setShowSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);

  // core data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([DEFAULT_ACCOUNT]);
  const [activeAccountId, setActiveAccountId] = useState(DEFAULT_ACCOUNT.id);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // preferences
  const [theme, setTheme] = useState<Theme>("dark");
  const [currencyCode, setCurrencyCode] = useState("INR");

  // modal / form
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  // account management modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");

  // budget modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: "Food", limit: "" });

  // filters / search / sort / view
  const [filter, setFilter] = useState<"all" | "income" | "expenses">("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const currency = CURRENCIES[currencyCode] ?? CURRENCIES.INR;

  /* ------------------------------------------------------------- */
  /* SPLASH TIMING                                                  */
  /* ------------------------------------------------------------- */

  useEffect(() => {
    const leaveTimer = setTimeout(() => setSplashLeaving(true), 1100);
    const removeTimer = setTimeout(() => setShowSplash(false), 1650);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  /* ------------------------------------------------------------- */
  /* LOAD                                                           */
  /* ------------------------------------------------------------- */

  useEffect(() => {
    setMounted(true);

    try {
      const savedTx = localStorage.getItem(STORAGE_KEYS.transactions);
      const savedAccounts = localStorage.getItem(STORAGE_KEYS.accounts);
      const savedBudgets = localStorage.getItem(STORAGE_KEYS.budgets);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      const savedCurrency = localStorage.getItem(STORAGE_KEYS.currency);

      let loadedTx: Transaction[] = [];

      if (savedTx) {
        const parsed = JSON.parse(savedTx);
        if (Array.isArray(parsed)) {
          loadedTx = parsed.map((t: any) => ({
            accountId: DEFAULT_ACCOUNT.id,
            tags: [],
            recurring: "none",
            ...t,
          }));
        }
      }

      if (savedAccounts) {
        const parsed = JSON.parse(savedAccounts);
        if (Array.isArray(parsed) && parsed.length > 0) setAccounts(parsed);
      }

      if (savedBudgets) {
        const parsed = JSON.parse(savedBudgets);
        if (Array.isArray(parsed)) setBudgets(parsed);
      }

      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      if (savedCurrency && CURRENCIES[savedCurrency]) setCurrencyCode(savedCurrency);

      // generate any due recurring transactions
      loadedTx = generateDueRecurring(loadedTx);

      setTransactions(loadedTx);
    } catch (error) {
      console.error("Unable to load saved data:", error);
    }
  }, []);

  /* ------------------------------------------------------------- */
  /* SAVE                                                           */
  /* ------------------------------------------------------------- */

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
    } catch (error) {
      console.error("Unable to save transactions:", error);
    }
  }, [transactions, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
    } catch (error) {
      console.error("Unable to save accounts:", error);
    }
  }, [accounts, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
    } catch (error) {
      console.error("Unable to save budgets:", error);
    }
  }, [budgets, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch (error) {
      console.error("Unable to save theme:", error);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEYS.currency, currencyCode);
    } catch (error) {
      console.error("Unable to save currency:", error);
    }
  }, [currencyCode, mounted]);

  /* ------------------------------------------------------------- */
  /* KEYBOARD SHORTCUTS                                             */
  /* ------------------------------------------------------------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openAddTransaction();
      }
      if (e.key === "Escape") {
        if (showModal) closeModal();
        if (showAccountModal) setShowAccountModal(false);
        if (showBudgetModal) setShowBudgetModal(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, showAccountModal, showBudgetModal]);

  /* ------------------------------------------------------------- */
  /* RECURRING GENERATION                                           */
  /* ------------------------------------------------------------- */

  function generateDueRecurring(list: Transaction[]): Transaction[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups = new Map<string, Transaction[]>();
    list.forEach((t) => {
      if (t.recurring === "none") return;
      const key = `${t.accountId}|${t.type}|${t.category}|${t.description}|${t.recurring}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    });

    const additions: Transaction[] = [];

    groups.forEach((group) => {
      const latest = group.reduce((a, b) => (a.date > b.date ? a : b));
      let cursor = new Date(`${latest.date}T00:00:00`);
      let guard = 0;

      while (guard < 24) {
        cursor = addInterval(cursor, latest.recurring);
        if (cursor > today) break;
        additions.push({
          ...latest,
          id: Date.now() + additions.length + Math.floor(Math.random() * 1000),
          date: cursor.toISOString().split("T")[0],
        });
        guard += 1;
      }
    });

    if (additions.length === 0) return list;
    return [...additions, ...list];
  }

  /* ------------------------------------------------------------- */
  /* TOAST                                                          */
  /* ------------------------------------------------------------- */

  function showToast(message: string, onUndo?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, onUndo });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  /* ------------------------------------------------------------- */
  /* DERIVED: transactions for active account                       */
  /* ------------------------------------------------------------- */

  const accountTransactions = useMemo(
    () => transactions.filter((t) => t.accountId === activeAccountId),
    [transactions, activeAccountId]
  );

  const totalIncome = useMemo(
    () => accountTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [accountTransactions]
  );

  const totalExpenses = useMemo(
    () => accountTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [accountTransactions]
  );

  const currentBalance = totalIncome - totalExpenses;

  /* ------------------------------------------------------------- */
  /* DERIVED: filtered + searched + sorted list                     */
  /* ------------------------------------------------------------- */

  const filteredTransactions = useMemo(() => {
    let list = accountTransactions.filter((t) => {
      let ok = true;
      if (filter === "income") ok = ok && t.type === "income";
      if (filter === "expenses") ok = ok && t.type === "expense";
      if (categoryFilter !== "All Categories") ok = ok && t.category === categoryFilter;
      if (dateFrom) ok = ok && t.date >= dateFrom;
      if (dateTo) ok = ok && t.date <= dateTo;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        ok =
          ok &&
          (t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q)));
      }
      return ok;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date) || b.id - a.id;
      if (sortBy === "date-asc") return a.date.localeCompare(b.date) || a.id - b.id;
      if (sortBy === "amount-desc") return b.amount - a.amount;
      return a.amount - b.amount;
    });

    return list;
  }, [accountTransactions, filter, categoryFilter, search, dateFrom, dateTo, sortBy]);

  const monthlyGroups = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    filteredTransactions.forEach((t) => {
      const key = monthKey(t.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  /* ------------------------------------------------------------- */
  /* DERIVED: category breakdown (donut) — expenses only            */
  /* ------------------------------------------------------------- */

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    accountTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount));

    const total = Array.from(totals.values()).reduce((s, v) => s + v, 0);
    const entries = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount], i) => ({
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));

    let cumulative = 0;
    const gradientStops = entries.map((e) => {
      const start = cumulative;
      cumulative += e.percent;
      return `${e.color} ${start}% ${cumulative}%`;
    });

    return { entries, total, gradient: gradientStops.join(", ") || "#1c2233 0% 100%" };
  }, [accountTransactions]);

  /* ------------------------------------------------------------- */
  /* DERIVED: 6 month trend                                         */
  /* ------------------------------------------------------------- */

  const trend = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        income: 0,
        expense: 0,
      });
    }
    accountTransactions.forEach((t) => {
      const key = monthKey(t.date);
      const bucket = months.find((m) => m.key === key);
      if (!bucket) return;
      if (t.type === "income") bucket.income += t.amount;
      else bucket.expense += t.amount;
    });
    const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));
    return { months, max };
  }, [accountTransactions]);

  /* ------------------------------------------------------------- */
  /* DERIVED: budgets with spend                                    */
  /* ------------------------------------------------------------- */

  const budgetProgress = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return budgets.map((b) => {
      const spent = accountTransactions
        .filter((t) => t.type === "expense" && t.category === b.category && monthKey(t.date) === thisMonth)
        .reduce((s, t) => s + t.amount, 0);
      return { ...b, spent, percent: b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0 };
    });
  }, [budgets, accountTransactions]);

  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  /* ------------------------------------------------------------- */
  /* FORM HANDLERS                                                  */
  /* ------------------------------------------------------------- */

  const changeTransactionType = (type: TransactionType) => {
    setForm({
      ...form,
      type,
      category: type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    });
  };

  const openAddTransaction = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditTransaction = (t: Transaction) => {
    setEditingId(t.id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      description: t.description,
      date: t.date,
      tags: t.tags.join(", "),
      recurring: t.recurring,
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(form.amount);
    if (!form.amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!form.category) {
      alert("Please select a category.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingId !== null) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                type: form.type,
                amount,
                category: form.category,
                description: form.description.trim() || (form.type === "income" ? "Income" : "Expense"),
                date: form.date,
                tags,
                recurring: form.recurring,
              }
            : t
        )
      );
      showToast("Transaction updated.");
    } else {
      const newTransaction: Transaction = {
        id: Date.now(),
        accountId: activeAccountId,
        type: form.type,
        amount,
        category: form.category,
        description: form.description.trim() || (form.type === "income" ? "Income" : "Expense"),
        date: form.date,
        tags,
        recurring: form.recurring,
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      showToast("Transaction added.");
    }

    setForm({
      ...emptyForm,
      type: form.type,
      category: form.type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    });
    setEditingId(null);
    setShowModal(false);
  };

  const deleteTransaction = (id: number) => {
    const removed = transactions.find((t) => t.id === id);
    if (!removed) return;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast("Transaction deleted.", () => {
      setTransactions((prev) => [removed, ...prev]);
    });
  };

  /* ------------------------------------------------------------- */
  /* ACCOUNTS                                                       */
  /* ------------------------------------------------------------- */

  const addAccount = () => {
    const name = newAccountName.trim();
    if (!name) return;
    const acc: Account = { id: uid(), name };
    setAccounts((prev) => [...prev, acc]);
    setActiveAccountId(acc.id);
    setNewAccountName("");
    setShowAccountModal(false);
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      alert("You need at least one account.");
      return;
    }
    const confirmed = window.confirm(
      "Delete this account and all its transactions? This cannot be undone."
    );
    if (!confirmed) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setTransactions((prev) => prev.filter((t) => t.accountId !== id));
    if (activeAccountId === id) {
      const remaining = accounts.filter((a) => a.id !== id);
      setActiveAccountId(remaining[0]?.id ?? DEFAULT_ACCOUNT.id);
    }
  };

  /* ------------------------------------------------------------- */
  /* BUDGETS                                                        */
  /* ------------------------------------------------------------- */

  const saveBudget = () => {
    const limit = Number(budgetForm.limit);
    if (!limit || limit <= 0) {
      alert("Please enter a valid budget limit.");
      return;
    }
    setBudgets((prev) => {
      const existing = prev.find((b) => b.category === budgetForm.category);
      if (existing) {
        return prev.map((b) => (b.category === budgetForm.category ? { ...b, limit } : b));
      }
      return [...prev, { category: budgetForm.category, limit }];
    });
    setBudgetForm({ category: "Food", limit: "" });
  };

  const removeBudget = (category: string) => {
    setBudgets((prev) => prev.filter((b) => b.category !== category));
  };

  /* ------------------------------------------------------------- */
  /* CSV EXPORT / IMPORT                                            */
  /* ------------------------------------------------------------- */

  const exportCSV = () => {
    const header = ["date", "type", "category", "description", "amount", "tags", "recurring"];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type,
      t.category,
      t.description.replace(/,/g, ";"),
      String(t.amount),
      t.tags.join("|"),
      t.recurring,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${accounts.find((acc) => acc.id === activeAccountId)?.name ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => importInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) return;

        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const idx = (name: string) => header.indexOf(name);

        const imported: Transaction[] = lines.slice(1).map((line) => {
          const cols = line.split(",");
          const type: TransactionType = cols[idx("type")]?.trim() === "income" ? "income" : "expense";
          const amount = Number(cols[idx("amount")]) || 0;
          return {
            id: Date.now() + Math.floor(Math.random() * 10000),
            accountId: activeAccountId,
            type,
            amount,
            category: cols[idx("category")]?.trim() || "Other",
            description: cols[idx("description")]?.trim() || (type === "income" ? "Income" : "Expense"),
            date: cols[idx("date")]?.trim() || new Date().toISOString().split("T")[0],
            tags: (cols[idx("tags")] || "").split("|").map((t) => t.trim()).filter(Boolean),
            recurring: (["none", "weekly", "monthly"].includes(cols[idx("recurring")]?.trim())
              ? cols[idx("recurring")].trim()
              : "none") as Frequency,
          };
        });

        setTransactions((prev) => [...imported, ...prev]);
        showToast(`Imported ${imported.length} transaction(s).`);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Could not read that CSV file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ------------------------------------------------------------- */
  /* FORMATTING                                                     */
  /* ------------------------------------------------------------- */

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString(currency.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    const parsedDate = new Date(`${date}T00:00:00`);
    return parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatMonthLabel = (key: string) => {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  /* ============================================================= */
  /* RENDER                                                          */
  /* ============================================================= */

  return (
    <main className={`expense-page ${theme === "light" ? "light" : ""}`}>
      {/* ============================================================ */}
      {/* SPLASH SCREEN                                                  */}
      {/* ============================================================ */}

      {showSplash && (
        <div className={`splash-screen ${splashLeaving ? "splash-leaving" : ""}`}>
          <div className="splash-ring">
            <div className="splash-core">
              <span className="splash-text">TS</span>
            </div>
          </div>
        </div>
      )}

      <div className="expense-container">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="expense-header">
          <div>
            <h1>Expense Tracker</h1>
            <p>Track your income, expenses and manage your money smarter.</p>
          </div>

          <div className="header-actions">
            <select
              className="account-select"
              value={activeAccountId}
              onChange={(e) => setActiveAccountId(e.target.value)}
              title="Active account"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <button className="icon-toggle-button" onClick={() => setShowAccountModal(true)} title="Manage accounts">
              👛
            </button>

            <select
              className="currency-select"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              title="Currency"
            >
              {Object.keys(CURRENCIES).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <button
              className="icon-toggle-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>

            <button className="add-transaction-button" onClick={openAddTransaction}>
              + Add Transaction
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================================= */}

        <div className="summary-grid">
          <div className="summary-card balance-card">
            <div className="summary-title">Current Balance</div>
            <div className="summary-value balance-value">{formatCurrency(currentBalance)}</div>
            <div className="card-decoration" />
          </div>

          <div className="summary-card income-card">
            <div className="summary-title">Total Income</div>
            <div className="summary-value income-value">{formatCurrency(totalIncome)}</div>
            <div className="card-decoration" />
          </div>

          <div className="summary-card expense-card">
            <div className="summary-title">Total Expenses</div>
            <div className="summary-value expense-value">{formatCurrency(totalExpenses)}</div>
            <div className="card-decoration" />
          </div>
        </div>

        {/* ================================================= */}
        {/* CHARTS */}
        {/* ================================================= */}

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-header">
              <h2>Spending by Category</h2>
            </div>

            {categoryBreakdown.entries.length === 0 ? (
              <p className="chart-empty">No expenses yet to break down.</p>
            ) : (
              <div className="donut-wrapper">
                <div className="donut" style={{ background: `conic-gradient(${categoryBreakdown.gradient})` }}>
                  <div className="donut-hole">
                    <div className="donut-hole-value">{formatCurrency(categoryBreakdown.total)}</div>
                    <div className="donut-hole-label">Total spent</div>
                  </div>
                </div>

                <div className="donut-legend">
                  {categoryBreakdown.entries.map((entry) => (
                    <div className="legend-row" key={entry.category}>
                      <span className="legend-dot" style={{ background: entry.color }} />
                      <span className="legend-label">{entry.category}</span>
                      <span className="legend-value">{entry.percent.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h2>Last 6 Months</h2>
            </div>

            <div className="trend-chart">
              {trend.months.map((m) => (
                <div className="trend-column" key={m.key}>
                  <div className="trend-bars">
                    <div
                      className="trend-bar income-bar"
                      style={{ height: `${(m.income / trend.max) * 100}%` }}
                      title={`Income: ${formatCurrency(m.income)}`}
                    />
                    <div
                      className="trend-bar expense-bar"
                      style={{ height: `${(m.expense / trend.max) * 100}%` }}
                      title={`Expense: ${formatCurrency(m.expense)}`}
                    />
                  </div>
                  <div className="trend-label">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="trend-legend">
              <span><span className="legend-dot income-dot" /> Income</span>
              <span><span className="legend-dot expense-dot" /> Expense</span>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* BUDGETS */}
        {/* ================================================= */}

        <section className="budgets-section">
          <div className="budgets-header">
            <h2>Monthly Budgets</h2>
            <button className="secondary-button" onClick={() => setShowBudgetModal(true)}>
              + Set Budget
            </button>
          </div>

          {budgetProgress.length === 0 ? (
            <p className="chart-empty">No budgets set yet. Add one to track category spending limits.</p>
          ) : (
            <div className="budget-list">
              {budgetProgress.map((b) => (
                <div className="budget-row" key={b.category}>
                  <div className="budget-row-top">
                    <span className="budget-category">{b.category}</span>
                    <span className={b.spent > b.limit ? "budget-amount over" : "budget-amount"}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                    <button className="budget-remove" onClick={() => removeBudget(b.category)} title="Remove budget">
                      ×
                    </button>
                  </div>
                  <div className="budget-track">
                    <div
                      className={b.spent > b.limit ? "budget-fill over" : "budget-fill"}
                      style={{ width: `${b.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* TRANSACTIONS SECTION */}
        {/* ================================================= */}

        <section className="transactions-section">
          <div className="transactions-header">
            <h2>Recent Transactions</h2>

            <div className="filters">
              <button className={filter === "all" ? "filter-button active" : "filter-button"} onClick={() => setFilter("all")}>
                All
              </button>
              <button className={filter === "income" ? "filter-button active" : "filter-button"} onClick={() => setFilter("income")}>
                Income
              </button>
              <button className={filter === "expenses" ? "filter-button active" : "filter-button"} onClick={() => setFilter("expenses")}>
                Expenses
              </button>

              <select className="category-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All Categories">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select className="category-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="amount-desc">Amount: high to low</option>
                <option value="amount-asc">Amount: low to high</option>
              </select>

              <button
                className={viewMode === "monthly" ? "filter-button active" : "filter-button"}
                onClick={() => setViewMode(viewMode === "list" ? "monthly" : "list")}
              >
                {viewMode === "list" ? "Group by Month" : "Flat List"}
              </button>
            </div>
          </div>

          <div className="filters-row-2">
            <input
              className="search-input"
              type="text"
              placeholder="🔍 Search description, category or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <input className="date-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
            <span className="date-separator">to</span>
            <input className="date-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />

            <button className="secondary-button" onClick={exportCSV}>
              ⬇ Export CSV
            </button>
            <button className="secondary-button" onClick={triggerImport}>
              ⬆ Import CSV
            </button>
            <input ref={importInputRef} type="file" accept=".csv" hidden onChange={handleImportFile} />
          </div>

          {/* ================================================= */}
          {/* TRANSACTION LIST */}
          {/* ================================================= */}

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="money-icon">💸</div>
              <h3>No transactions found</h3>
              <p>Try adjusting your filters, or add your first income or expense.</p>
              <button className="empty-add-button" onClick={openAddTransaction}>
                + Add Transaction
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="transaction-list">
              {filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  onEdit={openEditTransaction}
                  onDelete={deleteTransaction}
                />
              ))}
            </div>
          ) : (
            <div className="monthly-groups">
              {monthlyGroups.map(([key, txs]) => {
                const monthIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
                const monthExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
                return (
                  <div className="monthly-group" key={key}>
                    <div className="monthly-group-header">
                      <span>{formatMonthLabel(key)}</span>
                      <span className="monthly-group-totals">
                        <span className="income-text">+{formatCurrency(monthIncome)}</span>
                        {" · "}
                        <span className="expense-text">-{formatCurrency(monthExpense)}</span>
                      </span>
                    </div>
                    <div className="transaction-list">
                      {txs.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                          onEdit={openEditTransaction}
                          onDelete={deleteTransaction}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* =================================================== */}
      {/* ADD / EDIT TRANSACTION MODAL */}
      {/* =================================================== */}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="transaction-modal">
            <div className="modal-header">
              <div>
                <h2>{editingId !== null ? "Edit Transaction" : "Add Transaction"}</h2>
                <p>Record your income or expense.</p>
              </div>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Transaction Type</label>
                <div className="type-buttons">
                  <button
                    type="button"
                    className={form.type === "expense" ? "type-button expense-selected" : "type-button"}
                    onClick={() => changeTransactionType("expense")}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={form.type === "income" ? "type-button income-selected" : "type-button"}
                    onClick={() => changeTransactionType("income")}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <div className="amount-input-wrapper">
                  <span>{currency.symbol}</span>
                  <input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  placeholder="e.g. Lunch, Salary, Bus fare..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags (comma separated)</label>
                <input
                  id="tags"
                  type="text"
                  placeholder="e.g. work, trip-goa"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recurring">Repeats</label>
                  <select
                    id="recurring"
                    value={form.recurring}
                    onChange={(e) => setForm({ ...form, recurring: e.target.value as Frequency })}
                  >
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingId !== null ? "Save Changes" : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* ACCOUNTS MODAL */}
      {/* =================================================== */}

      {showAccountModal && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowAccountModal(false)}>
          <div className="transaction-modal">
            <div className="modal-header">
              <div>
                <h2>Manage Accounts</h2>
                <p>Track cash, bank, or card balances separately.</p>
              </div>
              <button className="close-button" onClick={() => setShowAccountModal(false)}>
                ×
              </button>
            </div>

            <div className="account-list">
              {accounts.map((a) => (
                <div className="account-row" key={a.id}>
                  <span>{a.name}</span>
                  {accounts.length > 1 && (
                    <button className="budget-remove" onClick={() => deleteAccount(a.id)} title="Delete account">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label htmlFor="new-account">New account name</label>
              <input
                id="new-account"
                type="text"
                placeholder="e.g. Bank, Credit Card"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={() => setShowAccountModal(false)}>
                Close
              </button>
              <button type="button" className="save-button" onClick={addAccount}>
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* BUDGET MODAL */}
      {/* =================================================== */}

      {showBudgetModal && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowBudgetModal(false)}>
          <div className="transaction-modal">
            <div className="modal-header">
              <div>
                <h2>Set Budget</h2>
                <p>Set a monthly limit for a category.</p>
              </div>
              <button className="close-button" onClick={() => setShowBudgetModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="budget-category">Category</label>
              <select
                id="budget-category"
                value={budgetForm.category}
                onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="budget-limit">Monthly limit</label>
              <div className="amount-input-wrapper">
                <span>{currency.symbol}</span>
                <input
                  id="budget-limit"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={budgetForm.limit}
                  onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={() => setShowBudgetModal(false)}>
                Close
              </button>
              <button type="button" className="save-button" onClick={saveBudget}>
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* TOAST */}
      {/* =================================================== */}

      {toast && (
        <div className="toast">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              className="toast-undo"
              onClick={() => {
                toast.onUndo?.();
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* STYLES */}
      {/* ================================================= */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .expense-page {
          --bg: #060812;
          --text: #f4f7ff;
          --muted: #7d96b4;
          --card-bg: rgba(14, 18, 30, 0.82);
          --card-border: #202637;
          --section-bg: rgba(7, 10, 20, 0.72);
          --section-border: #1d2331;
          --row-border: #171c29;
          --input-bg: #131824;
          --input-border: #272d3c;

          min-height: 100vh;
          color: var(--text);
          padding: 36px 24px 80px;
          background: radial-gradient(circle at 0% 0%, rgba(0, 204, 255, 0.12), transparent 35%),
            radial-gradient(circle at 100% 0%, rgba(151, 71, 255, 0.14), transparent 38%), var(--bg);
          transition: background 0.3s ease, color 0.3s ease;
        }

        .expense-page.light {
          --bg: #f4f6fb;
          --text: #10131c;
          --muted: #5a6579;
          --card-bg: #ffffff;
          --card-border: #e3e7f0;
          --section-bg: #ffffff;
          --section-border: #e3e7f0;
          --row-border: #eef0f6;
          --input-bg: #f7f8fc;
          --input-border: #dde1ec;
        }

        .expense-container {
          width: min(1135px, 100%);
          margin: 0 auto;
        }

        /* SPLASH */

        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #02040a;
          transition: opacity 0.55s ease, transform 0.55s ease;
          opacity: 1;
        }

        .splash-leaving {
          opacity: 0;
          transform: scale(1.06);
          pointer-events: none;
        }

        .splash-ring {
          width: 210px;
          height: 210px;
          border-radius: 50%;
          border: 1px solid rgba(0, 188, 229, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: splash-pulse 1.8s ease-in-out infinite;
        }

        .splash-ring::before {
          content: "";
          position: absolute;
          inset: -18px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 188, 229, 0.28), transparent 70%);
          filter: blur(8px);
        }

        .splash-core {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: #05070d;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 25px rgba(0, 188, 229, 0.18);
          animation: splash-fade-in 0.6s ease;
        }

        .splash-text {
          font-size: 38px;
          font-weight: 800;
          color: white;
          letter-spacing: 1px;
          text-shadow: 0 0 18px rgba(0, 188, 229, 0.85);
        }

        @keyframes splash-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 188, 229, 0.25);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(0, 188, 229, 0);
          }
        }

        @keyframes splash-fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* HEADER */

        .expense-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .expense-header h1 {
          margin: 0;
          font-size: 31px;
          line-height: 1.2;
          font-weight: 750;
          letter-spacing: -0.8px;
        }

        .expense-header p {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .account-select,
        .currency-select {
          height: 42px;
          border: 1px solid var(--input-border);
          border-radius: 10px;
          background: var(--input-bg);
          color: var(--text);
          font-size: 12px;
          font-weight: 650;
          padding: 0 10px;
        }

        .icon-toggle-button {
          height: 42px;
          width: 42px;
          border: 1px solid var(--input-border);
          border-radius: 10px;
          background: var(--input-bg);
          color: var(--text);
          cursor: pointer;
          font-size: 16px;
        }

        .add-transaction-button,
        .empty-add-button,
        .save-button {
          border: none;
          color: white;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(100deg, #7045ff, #00bce9);
          box-shadow: 0 10px 25px rgba(54, 125, 255, 0.18);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .add-transaction-button {
          padding: 13px 20px;
          border-radius: 13px;
          white-space: nowrap;
        }

        .add-transaction-button:hover,
        .empty-add-button:hover,
        .save-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(54, 125, 255, 0.3);
        }

        .secondary-button {
          height: 34px;
          padding: 0 14px;
          border-radius: 9px;
          border: 1px solid var(--input-border);
          background: var(--input-bg);
          color: var(--text);
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
        }

        .secondary-button:hover {
          border-color: #00bde5;
        }

        /* SUMMARY */

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          position: relative;
          overflow: hidden;
          min-height: 109px;
          padding: 23px 21px;
          border: 1px solid var(--card-border);
          border-radius: 18px;
          background: var(--card-bg);
        }

        .summary-title {
          color: var(--muted);
          font-size: 12px;
          font-weight: 650;
          margin-bottom: 13px;
        }

        .summary-value {
          position: relative;
          z-index: 2;
          font-size: 29px;
          line-height: 1;
          font-weight: 750;
        }

        .balance-value {
          color: #42d7ee;
        }
        .income-value {
          color: #72e7a1;
        }
        .expense-value {
          color: #ff9aa8;
        }

        .card-decoration {
          position: absolute;
          width: 76px;
          height: 76px;
          right: -13px;
          bottom: -22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.035);
        }

        /* CHARTS */

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .chart-card {
          border: 1px solid var(--card-border);
          border-radius: 18px;
          background: var(--card-bg);
          padding: 20px;
        }

        .chart-card-header h2 {
          margin: 0 0 16px;
          font-size: 15px;
          font-weight: 700;
        }

        .chart-empty {
          color: var(--muted);
          font-size: 12px;
        }

        .donut-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .donut {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut-hole {
          width: 92px;
          height: 92px;
          border-radius: 50%;
          background: var(--card-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .donut-hole-value {
          font-size: 12px;
          font-weight: 750;
        }

        .donut-hole-label {
          font-size: 9px;
          color: var(--muted);
          margin-top: 2px;
        }

        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 140px;
        }

        .legend-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          flex: 1;
          color: var(--text);
        }

        .legend-value {
          color: var(--muted);
          font-weight: 650;
        }

        .income-dot {
          background: #63e99b;
        }
        .expense-dot {
          background: #ff8798;
        }

        .trend-chart {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 140px;
        }

        .trend-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
        }

        .trend-bars {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 100%;
          width: 100%;
          justify-content: center;
        }

        .trend-bar {
          width: 10px;
          border-radius: 3px 3px 0 0;
          min-height: 2px;
          transition: height 0.3s ease;
        }

        .income-bar {
          background: linear-gradient(180deg, #63e99b, #2fae6f);
        }

        .expense-bar {
          background: linear-gradient(180deg, #ff8798, #d9536a);
        }

        .trend-label {
          margin-top: 8px;
          font-size: 10px;
          color: var(--muted);
        }

        .trend-legend {
          display: flex;
          gap: 16px;
          margin-top: 14px;
          font-size: 11px;
          color: var(--muted);
        }

        .trend-legend span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* BUDGETS */

        .budgets-section {
          border: 1px solid var(--section-border);
          border-radius: 20px;
          background: var(--section-bg);
          padding: 20px;
          margin-bottom: 24px;
        }

        .budgets-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .budgets-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .budget-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .budget-row-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          font-size: 12px;
        }

        .budget-category {
          font-weight: 650;
          flex: 1;
        }

        .budget-amount {
          color: var(--muted);
        }

        .budget-amount.over {
          color: #ff8798;
          font-weight: 700;
        }

        .budget-remove {
          border: none;
          background: transparent;
          color: var(--muted);
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
        }

        .budget-remove:hover {
          color: #ff7184;
        }

        .budget-track {
          height: 8px;
          border-radius: 5px;
          background: var(--input-bg);
          overflow: hidden;
        }

        .budget-fill {
          height: 100%;
          border-radius: 5px;
          background: linear-gradient(90deg, #00bce9, #7045ff);
        }

        .budget-fill.over {
          background: linear-gradient(90deg, #ff8798, #d9536a);
        }

        /* TRANSACTIONS */

        .transactions-section {
          overflow: hidden;
          border: 1px solid var(--section-border);
          border-radius: 20px;
          background: var(--section-bg);
        }

        .transactions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px;
          border-bottom: 1px solid var(--section-border);
          flex-wrap: wrap;
        }

        .transactions-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filters-row-2 {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--section-border);
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          height: 34px;
          border: 1px solid var(--input-border);
          border-radius: 9px;
          background: var(--input-bg);
          color: var(--text);
          font-size: 12px;
          padding: 0 12px;
          outline: none;
        }

        .date-input {
          height: 34px;
          border: 1px solid var(--input-border);
          border-radius: 9px;
          background: var(--input-bg);
          color: var(--text);
          font-size: 11px;
          padding: 0 8px;
        }

        .date-separator {
          color: var(--muted);
          font-size: 11px;
        }

        .filter-button,
        .category-select {
          height: 34px;
          border: 1px solid var(--input-border);
          border-radius: 9px;
          background: var(--input-bg);
          color: var(--muted);
          font-size: 11px;
          font-weight: 650;
        }

        .filter-button {
          padding: 0 13px;
          cursor: pointer;
        }

        .filter-button:hover {
          border-color: #00bde5;
        }

        .filter-button.active {
          color: white;
          border-color: #00bde5;
          background: rgba(0, 188, 229, 0.1);
        }

        .category-select {
          padding: 0 11px;
          outline: none;
        }

        /* EMPTY */

        .empty-state {
          min-height: 304px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 45px 20px;
        }

        .money-icon {
          font-size: 31px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 9px;
          font-size: 16px;
        }

        .empty-state p {
          margin: 0 0 21px;
          color: var(--muted);
          font-size: 12px;
        }

        .empty-add-button {
          padding: 12px 19px;
          border-radius: 11px;
        }

        /* TRANSACTION LIST */

        .transaction-list {
          display: flex;
          flex-direction: column;
        }

        .monthly-group-header {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          background: var(--input-bg);
          font-size: 12px;
          font-weight: 700;
          border-bottom: 1px solid var(--row-border);
          border-top: 1px solid var(--row-border);
        }

        .monthly-group-totals {
          font-weight: 650;
        }

        .income-text {
          color: #70e5a0;
        }

        .expense-text {
          color: #ff98a7;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(7px);
        }

        .transaction-modal {
          width: min(475px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          border: 1px solid var(--card-border);
          border-radius: 19px;
          padding: 23px;
          background: var(--card-bg);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.55);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 23px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .modal-header p {
          margin: 7px 0 0;
          color: var(--muted);
          font-size: 12px;
        }

        .close-button {
          width: 34px;
          height: 34px;
          border: 1px solid var(--input-border);
          border-radius: 9px;
          background: var(--input-bg);
          color: var(--muted);
          font-size: 21px;
          line-height: 1;
          cursor: pointer;
        }

        .close-button:hover {
          color: var(--text);
        }

        /* FORM */

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 650;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border: 1px solid var(--input-border);
          border-radius: 10px;
          outline: none;
          background: var(--input-bg);
          color: var(--text);
          font-size: 13px;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #00bce5;
          box-shadow: 0 0 0 3px rgba(0, 188, 229, 0.08);
        }

        .amount-input-wrapper {
          position: relative;
        }

        .amount-input-wrapper span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #61dcef;
          font-weight: 750;
          pointer-events: none;
        }

        .amount-input-wrapper input {
          padding-left: 31px;
        }

        .type-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .type-button {
          height: 42px;
          border: 1px solid var(--input-border);
          border-radius: 10px;
          background: var(--input-bg);
          color: var(--muted);
          font-weight: 650;
          cursor: pointer;
        }

        .type-button:hover {
          border-color: #3b4559;
        }

        .expense-selected {
          color: #ff9ba8;
          border-color: rgba(255, 105, 126, 0.5);
          background: rgba(255, 105, 126, 0.08);
        }

        .income-selected {
          color: #6de4a0;
          border-color: rgba(80, 220, 140, 0.5);
          background: rgba(80, 220, 140, 0.08);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid var(--section-border);
        }

        .cancel-button,
        .save-button {
          height: 42px;
          padding: 0 18px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .cancel-button {
          border: 1px solid var(--input-border);
          background: var(--input-bg);
          color: var(--muted);
        }

        .cancel-button:hover {
          color: var(--text);
        }

        .save-button {
          border: none;
        }

        /* ACCOUNTS */

        .account-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .account-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border: 1px solid var(--input-border);
          border-radius: 10px;
          background: var(--input-bg);
          font-size: 13px;
        }

        /* TOAST */

        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1200;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 18px;
          border-radius: 12px;
          background: #10151f;
          border: 1px solid #262d3d;
          color: white;
          font-size: 13px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }

        .toast-undo {
          border: none;
          background: transparent;
          color: #58d9f0;
          font-weight: 700;
          cursor: pointer;
        }

        /* RESPONSIVE */

        @media (max-width: 800px) {
          .expense-page {
            padding: 25px 15px 60px;
          }
          .expense-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .header-actions {
            width: 100%;
          }
          .add-transaction-button {
            width: 100%;
          }
          .summary-grid {
            grid-template-columns: 1fr;
          }
          .charts-grid {
            grid-template-columns: 1fr;
          }
          .transactions-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .filters {
            width: 100%;
          }
          .filter-button,
          .category-select {
            flex: 1;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .expense-header h1 {
            font-size: 26px;
          }
          .filters {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .category-select {
            width: 100%;
            grid-column: span 2;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================= */
/* TRANSACTION ROW SUBCOMPONENT                                   */
/* ============================================================= */

function TransactionRow({
  transaction,
  formatCurrency,
  formatDate,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="transaction-row">
      <div className={transaction.type === "income" ? "transaction-icon income-icon" : "transaction-icon expense-icon"}>
        {transaction.type === "income" ? "↗" : "↘"}
      </div>

      <div className="transaction-details">
        <div className="transaction-description">{transaction.description}</div>
        <div className="transaction-meta">
          {transaction.category} • {formatDate(transaction.date)}
          {transaction.recurring !== "none" && <> • ↻ {transaction.recurring}</>}
          {transaction.tags.length > 0 && <> • {transaction.tags.map((t) => `#${t}`).join(" ")}</>}
        </div>
      </div>

      <div className={transaction.type === "income" ? "transaction-amount income-text" : "transaction-amount expense-text"}>
        {transaction.type === "income" ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </div>

      <button className="row-icon-button" onClick={() => onEdit(transaction)} title="Edit transaction">
        ✎
      </button>
      <button className="row-icon-button" onClick={() => onDelete(transaction.id)} title="Delete transaction">
        🗑
      </button>

      <style jsx>{`
        .transaction-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--row-border);
        }

        .transaction-row:last-child {
          border-bottom: none;
        }

        .transaction-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 21px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .income-icon {
          color: #63e99b;
          background: rgba(55, 211, 123, 0.1);
        }

        .expense-icon {
          color: #ff8798;
          background: rgba(255, 90, 111, 0.1);
        }

        .transaction-details {
          flex: 1;
          min-width: 0;
        }

        .transaction-description {
          color: var(--text);
          font-size: 13px;
          font-weight: 650;
          margin-bottom: 5px;
        }

        .transaction-meta {
          color: var(--muted);
          font-size: 11px;
        }

        .transaction-amount {
          font-size: 14px;
          font-weight: 750;
          white-space: nowrap;
        }

        .income-text {
          color: #70e5a0;
        }

        .expense-text {
          color: #ff98a7;
        }

        .row-icon-button {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.18s ease;
        }

        .transaction-row:hover .row-icon-button {
          opacity: 1;
        }

        .row-icon-button {
          opacity: 0;
        }

        .row-icon-button:hover {
          color: #58d9f0;
          background: rgba(0, 188, 229, 0.08);
        }

        @media (max-width: 520px) {
          .row-icon-button {
            opacity: 1;
          }
          .transaction-row {
            padding: 14px;
          }
          .transaction-icon {
            width: 37px;
            height: 37px;
          }
          .transaction-amount {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}