import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ArrowDownLeft, CalendarDays, Check, CircleDollarSign, Clock3, Leaf, Plus, ReceiptText, ShieldCheck, Trash2, X, Pencil } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const STORAGE_KEY = 'little-ledger-expenses-v1';

function Home() {
  type Expense = { id: string; description: string; amountCents: number; date: string };
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const thisMonth = todayString.slice(0, 7);
  // State is the live list shown on screen; the lazy initializer loads it once from this browser.
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is Expense =>
        item && typeof item.id === 'string' && typeof item.description === 'string' &&
        Number.isInteger(item.amountCents) && item.amountCents > 0 &&
        typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date),
      );
    } catch {
      return [];
    }
  });
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString);
  const [formError, setFormError] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);

  // This effect keeps the browser's saved copy in sync whenever the list changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [expenses]);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [expenses],
  );
  const totalCents = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amountCents, 0), [expenses]);
  const monthExpenses = useMemo(() => expenses.filter((expense) => expense.date.startsWith(selectedMonth)), [expenses, selectedMonth]);
  const monthCents = useMemo(() => monthExpenses.reduce((sum, expense) => sum + expense.amountCents, 0), [monthExpenses]);
  const monthLabel = new Date(`${selectedMonth}-02T12:00:00`).toLocaleDateString('en-US', { month: 'long' });
  const currency = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  const prettyDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  function openAdd() {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setDate(todayString);
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingId(expense.id);
    setDescription(expense.description);
    setAmount((expense.amountCents / 100).toFixed(2));
    setDate(expense.date);
    setFormError('');
    setDialogOpen(true);
  }

  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanDescription = description.trim();
    const parsedAmount = Number(amount);
    if (!cleanDescription) {
      setFormError('Add a short description so you can recognize this expense.');
      return;
    }
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !Number.isSafeInteger(Math.round(parsedAmount * 100))) {
      setFormError('Enter an amount greater than $0.00, using numbers only.');
      return;
    }
    const parsedDate = new Date(`${date}T12:00:00`);
    if (!date || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      setFormError('Choose a valid date for this expense.');
      return;
    }
    const amountCents = Math.round(parsedAmount * 100);
    if (editingId) {
      setExpenses((current) => current.map((item) => item.id === editingId ? { ...item, description: cleanDescription, amountCents, date } : item));
    } else {
      setExpenses((current) => [...current, { id: crypto.randomUUID(), description: cleanDescription, amountCents, date }]);
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (!deleting) return;
    setExpenses((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Leaf size={19} strokeWidth={2.2} /></span><span>little ledger</span></div>
        <div className="top-note"><span /> Just for you, saved on this device</div>
      </header>
      <main className="main-wrap">
        <section className="intro">
          <div>
            <div className="eyebrow">A little clarity, day by day</div>
            <h1>Your money, in one<br className="desktop-break" /> easy place.</h1>
            <p>Keep track of what you spend. No judgment, just a clearer picture.</p>
          </div>
          <button type="button" className="button-primary" onClick={openAdd} data-testid="button-add-expense">
            <Plus size={17} /> Add an expense
          </button>
        </section>

        <section className="overview" aria-label="Spending summary">
          <div className="summary-card primary-card">
            <div className="summary-label"><CircleDollarSign size={17} /> All your expenses</div>
            <strong className="summary-value" data-testid="value-total-expenses">{currency(totalCents)}</strong>
            <div className="summary-foot" data-testid="text-expense-count">
              {expenses.length === 1 ? '1 expense recorded' : `${expenses.length} expenses recorded`} · all time
            </div>
          </div>
          <div className="summary-card">
            <div className="month-tools">
              <div className="summary-label"><CalendarDays size={16} /> Monthly summary</div>
              <select aria-label="Choose a month" className="month-select" value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)} data-testid="select-summary-month">
                {Array.from({ length: 12 }, (_, index) => {
                  const month = `${today.getFullYear()}-${String(index + 1).padStart(2, '0')}`;
                  return <option value={month} key={month}>{new Date(`${month}-02T12:00:00`).toLocaleDateString('en-US', { month: 'long' })}</option>;
                })}
              </select>
            </div>
            <strong className="summary-value" data-testid="value-month-total">{currency(monthCents)}</strong>
            <div className="summary-foot" data-testid="text-month-count">
              {monthLabel} {today.getFullYear()} · {monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}
            </div>
          </div>
        </section>

        <section aria-labelledby="expenses-title">
          <div className="section-heading">
            <h2 id="expenses-title">Your expenses</h2>
            <span className="expense-count" data-testid="text-visible-count">{expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="expense-panel">
            {sortedExpenses.length === 0 ? (
              <div className="empty-state" data-testid="empty-expenses">
                <div className="empty-art"><ReceiptText size={25} /></div>
                <h3>A fresh page, just for you.</h3>
                <p>Your expenses will appear here when you add them. Start with anything, big or small.</p>
                <button type="button" className="button-primary empty-cta" onClick={openAdd} data-testid="button-empty-add">
                  <Plus size={16} /> Add your first expense
                </button>
              </div>
            ) : sortedExpenses.map((expense) => (
              <article className="expense-row" key={expense.id} data-testid={`row-expense-${expense.id}`}>
                <div className="expense-detail">
                  <span className="expense-symbol"><ArrowDownLeft size={18} /></span>
                  <div>
                    <div className="expense-description" data-testid={`text-description-${expense.id}`}>{expense.description}</div>
                    <div className="expense-date" data-testid={`text-date-${expense.id}`}>{prettyDate(expense.date)}</div>
                  </div>
                </div>
                <strong className="expense-amount" data-testid={`text-amount-${expense.id}`}>{currency(expense.amountCents)}</strong>
                <div className="row-actions">
                  <button type="button" className="icon-button" aria-label={`Edit ${expense.description}`} title="Edit expense"
                    onClick={() => openEdit(expense)} data-testid={`button-edit-${expense.id}`}><Pencil size={15} /></button>
                  <button type="button" className="icon-button delete" aria-label={`Delete ${expense.description}`} title="Delete expense"
                    onClick={() => setDeleting(expense)} data-testid={`button-delete-${expense.id}`}><Trash2 size={16} /></button>
                </div>
              </article>
            ))}
          </div>
          {storageWarning && <p role="status" className="storage-note" data-testid="status-storage-warning">Your browser couldn't save this change. Check that device storage is available.</p>}
          <div className="storage-note"><ShieldCheck size={14} /> Private to this browser. Nothing is sent anywhere.</div>
        </section>
      </main>

      {dialogOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <section className="expense-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="dialog-head">
              <div><h2 id="dialog-title">{editingId ? 'Edit expense' : 'Add an expense'}</h2><p>A quick note is all you need.</p></div>
              <button type="button" className="close-button" aria-label="Close form" onClick={() => setDialogOpen(false)} data-testid="button-close-expense-form"><X size={17} /></button>
            </div>
            <form onSubmit={saveExpense} noValidate>
              <div className="field">
                <label htmlFor="expense-description">What was it for?</label>
                <input id="expense-description" autoFocus value={description} onChange={(event) => { setDescription(event.target.value); setFormError(''); }}
                  placeholder="For example, groceries" aria-invalid={formError.includes('description')} data-testid="input-expense-description" />
              </div>
              <div className="field">
                <label htmlFor="expense-amount">Amount</label>
                <input id="expense-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount}
                  onChange={(event) => { setAmount(event.target.value); setFormError(''); }} placeholder="0.00"
                  aria-invalid={formError.includes('amount')} data-testid="input-expense-amount" />
              </div>
              <div className="field">
                <label htmlFor="expense-date">Date</label>
                <input id="expense-date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setFormError(''); }}
                  aria-invalid={formError.includes('date')} data-testid="input-expense-date" />
              </div>
              {formError && <span role="alert" className="field-error" data-testid="error-expense-form">{formError}</span>}
              <div className="dialog-actions">
                <button type="button" className="button-secondary" onClick={() => setDialogOpen(false)} data-testid="button-cancel-expense">Cancel</button>
                <button type="submit" className="button-primary" data-testid="button-save-expense"><Check size={16} /> {editingId ? 'Save changes' : 'Save expense'}</button>
              </div>
            </form>
            <div className="storage-note"><Clock3 size={13} /> Your list saves automatically on this device.</div>
          </section>
        </div>
      )}

      {deleting && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleting(null); }}>
          <section className="expense-dialog delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="dialog-head">
              <div><h2 id="delete-title">Remove this expense?</h2><p>“{deleting.description}” will be removed from your list.</p></div>
              <button type="button" className="close-button" aria-label="Close confirmation" onClick={() => setDeleting(null)} data-testid="button-close-delete"><X size={17} /></button>
            </div>
            <div className="dialog-actions">
              <button type="button" className="button-secondary" onClick={() => setDeleting(null)} data-testid="button-cancel-delete">Keep it</button>
              <button type="button" className="button-danger" onClick={confirmDelete} data-testid="button-confirm-delete"><Trash2 size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Remove expense</button>
            </div>
          </section>
        </div>
      )}
      <span className="sr-only" data-testid="text-current-year">{today.getFullYear()}</span>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
