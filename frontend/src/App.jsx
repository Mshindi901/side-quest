import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  X,
  Menu,
  Activity,
  AlertTriangle,
  CheckCircle,
  Package,
  FileText
} from 'lucide-react';
import './App.css';

// Base API configuration (proxied in Vite to http://localhost:4000)
const api = axios.create({
  baseURL: ''
});

export default function App() {
  // Global Data State
  const [revenue, setRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [batches, setBatches] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'error' | 'checking'
  
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Search & Filter State
  const [revenueSearch, setRevenueSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  // Modal State
  const [expenseModal, setExpenseModal] = useState({
    isOpen: false,
    isEdit: false,
    id: '',
    name: '',
    amount: '',
    type: 'Feeds',
    batchId: ''
  });

  const [revenueModal, setRevenueModal] = useState({
    isOpen: false,
    isEdit: false,
    id: '',
    name: '',
    amount: '',
    batchId: ''
  });

  const [inventoryModal, setInventoryModal] = useState({
    isOpen: false,
    isEdit: false,
    id: '',
    name: '',
    amount: ''
  });

  const [batchModal, setBatchModal] = useState({ isOpen: false, name: '', startDate: '', endDate: '', status: 'active' });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    type: '', // 'expense' | 'revenue' | 'inventory'
    name: ''
  });

  // Show Toast Feedback
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Check Backend Server Health
  const checkHealth = async () => {
    try {
      const res = await api.get('/api/health');
      if (res.data?.success) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch {
      setBackendStatus('error');
    }
  };

  // Fetch All Records
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, expRes, invRes, batchRes] = await Promise.allSettled([
        api.get('/api/revenue'),
        api.get('/api/expenses'),
        api.get('/api/inventory'),
        api.get('/api/batches')
      ]);

      if (revRes.status === 'fulfilled' && revRes.value.data?.success) {
        setRevenue(revRes.value.data.data || []);
      }
      if (expRes.status === 'fulfilled' && expRes.value.data?.success) {
        setExpenses(expRes.value.data.data || []);
      }
      if (invRes.status === 'fulfilled' && invRes.value.data?.success) {
        setInventory(invRes.value.data.data || []);
      }
      if (batchRes.status === 'fulfilled' && batchRes.value.data?.success) {
        setBatches(batchRes.value.data.data || []);
      }

      await checkHealth();
    } catch (err) {
      console.error('Error fetching farm data:', err);
      showToast('Failed to connect to backend', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Format Currency Helper (KES without decimals)
  const formatCurrency = (val) => {
    const num = Math.round(parseFloat(val) || 0);
    return 'KES ' + num.toLocaleString('en-US');
  };

  // Format Date Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate KPIs
  const totalRevenue = revenue.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;
  const totalInventoryValuation = inventory.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // -------------------------------------------------------------
  // FORM SUBMISSION HANDLERS (Verified with Backend expectations)
  // -------------------------------------------------------------

  // 1. Save Expense (POST /api/expenses or PUT /api/expenses/:id)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const payload = {
      name: expenseModal.name.trim(),
      amount: Math.round(parseFloat(expenseModal.amount)),
        type: expenseModal.type,
        batchId: expenseModal.batchId
    };

    if (!payload.name || isNaN(payload.amount) || !payload.type || !payload.batchId) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    try {
      if (expenseModal.isEdit) {
        const res = await api.put(`/api/expenses/${expenseModal.id}`, payload);
        if (res.data?.success) {
          showToast('Expense updated successfully!');
        }
      } else {
        const res = await api.post('/api/expenses', payload);
        if (res.data?.success) {
          showToast('Expense added successfully!');
        }
      }
      setExpenseModal({ ...expenseModal, isOpen: false });
      fetchAllData();
    } catch (err) {
      console.error('Error saving expense:', err);
      showToast(err.response?.data?.message || 'Error saving expense to backend', 'error');
    }
  };

  // 2. Save Revenue (POST /api/revenue or PUT /api/revenue/:id)
  const handleSaveRevenue = async (e) => {
    e.preventDefault();
    const payload = {
      name: revenueModal.name.trim(),
      amount: Math.round(parseFloat(revenueModal.amount)),
      batchId: revenueModal.batchId
    };

    if (!payload.name || isNaN(payload.amount) || !payload.batchId) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    try {
      if (revenueModal.isEdit) {
        const res = await api.put(`/api/revenue/${revenueModal.id}`, payload);
        if (res.data?.success) {
          showToast('Revenue updated successfully!');
        }
      } else {
        const res = await api.post('/api/revenue', payload);
        if (res.data?.success) {
          showToast('Revenue added successfully!');
        }
      }
      setRevenueModal({ ...revenueModal, isOpen: false });
      fetchAllData();
    } catch (err) {
      console.error('Error saving revenue:', err);
      showToast(err.response?.data?.message || 'Error saving revenue to backend', 'error');
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/batches', batchModal);
      if (res.data?.success) {
        showToast('Batch created successfully!');
        setBatchModal({ isOpen: false, name: '', startDate: '', endDate: '', status: 'active' });
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving batch', 'error');
    }
  };

  const handleUpdateBatchStatus = async (batchId, status) => {
    try {
      const res = await api.patch(`/api/batches/${batchId}/status`, { status });
      if (res.data?.success) {
        setBatches((currentBatches) => currentBatches.map((batch) => (
          batch.id === batchId ? { ...batch, status } : batch
        )));
        showToast('Batch status updated successfully!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating batch status', 'error');
    }
  };

  const loadReport = async () => {
    try {
      const res = await api.get('/api/reports');
      if (res.data?.success) setReport(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error loading report', 'error');
    }
  };

  // 3. Save Inventory (POST /api/inventory or PUT /api/inventory/:id)
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    const payload = {
      name: inventoryModal.name.trim(),
      amount: Math.round(parseFloat(inventoryModal.amount))
    };

    if (!payload.name || isNaN(payload.amount)) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    try {
      if (inventoryModal.isEdit) {
        const res = await api.put(`/api/inventory/${inventoryModal.id}`, payload);
        if (res.data?.success) {
          showToast('Inventory item updated successfully!');
        }
      } else {
        const res = await api.post('/api/inventory', payload);
        if (res.data?.success) {
          showToast('Inventory item added successfully!');
        }
      }
      setInventoryModal({ ...inventoryModal, isOpen: false });
      fetchAllData();
    } catch (err) {
      console.error('Error saving inventory:', err);
      showToast(err.response?.data?.message || 'Error saving inventory to backend', 'error');
    }
  };

  // 4. Delete Handler (DELETE /api/expenses/:id, /api/revenue/:id, /api/inventory/:id)
  const handleConfirmDelete = async () => {
    const { id, type, name } = deleteModal;
    const endpoint = type === 'expense' ? 'expenses' : type;

    try {
      const res = await api.delete(`/api/${endpoint}/${id}`);
      if (res.data?.success) {
        showToast(`"${name}" deleted successfully!`);
        setDeleteModal({ isOpen: false, id: '', type: '', name: '' });
        fetchAllData();
      } else {
        showToast(res.data?.message || 'Failed to delete record', 'error');
      }
    } catch (err) {
      console.error('Error deleting record:', err);
      showToast(err.response?.data?.message || 'Server error while deleting', 'error');
    }
  };

  // Filtered lists
  const filteredRevenue = revenue.filter((item) =>
    (item.name || '').toLowerCase().includes(revenueSearch.toLowerCase())
  );

  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = (item.name || '').toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory = expenseCategoryFilter ? (item.type || '').toLowerCase() === expenseCategoryFilter.toLowerCase() : true;
    return matchesSearch && matchesCategory;
  });

  const filteredInventory = inventory.filter((item) =>
    (item.name || '').toLowerCase().includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              </svg>
            </div>
            <div className="brand-text">
              <h2>Dad Farm Records</h2>
              <span>Poultry Management</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
          >
            <Layers size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => { setActiveTab('revenue'); setSidebarOpen(false); }}
          >
            <TrendingUp size={18} />
            <span>Revenue</span>
            <span className="nav-badge">{revenue.length}</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('expenses'); setSidebarOpen(false); }}
          >
            <TrendingDown size={18} />
            <span>Expenses</span>
            <span className="nav-badge">{expenses.length}</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inventory'); setSidebarOpen(false); }}
          >
            <Package size={18} />
            <span>Inventory</span>
            <span className="nav-badge">{inventory.length}</span>
          </button>
          <button className={`nav-item ${activeTab === 'batches' ? 'active' : ''}`} onClick={() => { setActiveTab('batches'); setSidebarOpen(false); }}>
            <Layers size={18} /><span>Batches</span><span className="nav-badge">{batches.length}</span>
          </button>
          <button className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => { setActiveTab('report'); setSidebarOpen(false); loadReport(); }}>
            <FileText size={18} /><span>Reports</span>
          </button>

          <div className="nav-section-title" style={{ marginTop: '24px' }}>Quick Actions</div>
          <div className="sidebar-actions">
            <button
              className="btn-action-sidebar"
              onClick={() => setRevenueModal({ isOpen: true, isEdit: false, id: '', name: '', amount: '', batchId: batches[0]?.id || '' })}
            >
              <Plus size={15} />
              <span>Add Revenue</span>
            </button>
            <button className="btn-action-sidebar" onClick={() => setBatchModal({ isOpen: true, name: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', status: 'active' })}>
              <Plus size={15} /><span>Add Batch</span>
            </button>
            <button
              className="btn-action-sidebar"
              onClick={() => setExpenseModal({ isOpen: true, isEdit: false, id: '', name: '', amount: '', type: 'Feeds', batchId: batches[0]?.id || '' })}
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </button>
            <button
              className="btn-action-sidebar"
              onClick={() => setInventoryModal({ isOpen: true, isEdit: false, id: '', name: '', amount: '' })}
            >
              <Plus size={15} />
              <span>Add Inventory</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className={`server-status ${backendStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {backendStatus === 'connected' ? 'Backend: Connected' : backendStatus === 'checking' ? 'Checking API...' : 'Backend: Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className="page-title">Dad Farm Records</h1>
              <p className="page-subtitle">Real-time farm finances, sales reports, and inventory management</p>
            </div>
          </div>
            <button className="btn btn-secondary" onClick={fetchAllData} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            {activeTab === 'report' && <button className="btn btn-primary" onClick={() => window.open('/api/reports/pdf', '_blank')}><FileText size={16} /><span>Download PDF</span></button>}
        </header>

        <div className="content-container">
          {/* KPI Summary Cards */}
          <section className="kpi-grid">
            <div className="kpi-card kpi-revenue">
              <div className="kpi-icon">
                <DollarSign size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Total Revenue</span>
                <h3 className="kpi-value">{formatCurrency(totalRevenue)}</h3>
                <span className="kpi-subtext">{revenue.length} recorded entries</span>
              </div>
            </div>

            <div className="kpi-card kpi-expenses">
              <div className="kpi-icon">
                <TrendingDown size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Total Expenses</span>
                <h3 className="kpi-value">{formatCurrency(totalExpenses)}</h3>
                <span className="kpi-subtext">{expenses.length} recorded entries</span>
              </div>
            </div>

            <div className="kpi-card kpi-profit">
              <div className="kpi-icon">
                <Activity size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Net Profit / Margin</span>
                <h3 className="kpi-value" style={{ color: netProfit < 0 ? 'var(--danger)' : 'inherit' }}>
                  {formatCurrency(netProfit)}
                </h3>
                <span className={`kpi-pill ${netProfit < 0 ? 'negative' : ''}`}>
                  {netProfit < 0 ? 'Net Loss' : `${profitMargin}% Margin`}
                </span>
              </div>
            </div>

            <div className="kpi-card kpi-inventory">
              <div className="kpi-icon">
                <Package size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Total Inventory</span>
                <h3 className="kpi-value">{formatCurrency(totalInventoryValuation)}</h3>
                <span className="kpi-subtext">{inventory.length} stock items</span>
              </div>
            </div>
          </section>

          {/* SECTION 1: REVENUE */}
          {(activeTab === 'overview' || activeTab === 'revenue') && (
            <section className="section-card" id="revenue">
              <div className="section-header">
                <div className="section-title-wrap">
                  <div className="section-icon revenue-theme">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h2 className="section-heading">Revenue Streams</h2>
                    <p className="section-subtext">Egg crates, broilers, manure sales, and poultry byproducts</p>
                  </div>
                </div>
                <div className="section-actions">
                  <div className="section-badge revenue-badge">{formatCurrency(totalRevenue)} Total</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setRevenueModal({ isOpen: true, isEdit: false, id: '', name: '', amount: '', batchId: batches[0]?.id || '' })}
                  >
                    <Plus size={16} />
                    <span>Add Revenue</span>
                  </button>
                </div>
              </div>

              <div className="section-toolbar">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search revenue by description..."
                    value={revenueSearch}
                    onChange={(e) => setRevenueSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Source / Description</th>
                      <th>Amount</th>
                      <th>Date Added</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRevenue.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="table-empty">No revenue records found.</td>
                      </tr>
                    ) : (
                      filteredRevenue.map((item) => (
                        <tr key={item.id}>
                          <td><div className="item-title">{item.name}</div></td>
                          <td><span className="item-amount amount-positive">+{formatCurrency(item.amount)}</span></td>
                          <td><span className="item-date">{formatDate(item.createdAt)}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons">
                              <button
                                className="btn-table-action action-edit"
                                onClick={() => setRevenueModal({
                                  isOpen: true,
                                  isEdit: true,
                                  id: item.id,
                                  name: item.name,
                                  amount: item.amount,
                                  batchId: item.batchId
                                })}
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="btn-table-action action-delete"
                                onClick={() => setDeleteModal({
                                  isOpen: true,
                                  id: item.id,
                                  type: 'revenue',
                                  name: item.name
                                })}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'batches' && (
            <section className="section-card">
              <div className="section-header"><div className="section-title-wrap"><div className="section-icon inventory-theme"><Layers size={20} /></div><div><h2 className="section-heading">Production Batches</h2><p className="section-subtext">Create batches before recording revenue or expenses</p></div></div><button className="btn btn-primary" onClick={() => setBatchModal({ isOpen: true, name: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', status: 'active' })}><Plus size={16} /><span>Add Batch</span></button></div>
              <div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Start Date</th><th>Status</th></tr></thead><tbody>{batches.length === 0 ? <tr><td colSpan={3} className="table-empty">No batches found. Create one to start recording transactions.</td></tr> : batches.map((batch) => <tr key={batch.id}><td><div className="item-title">{batch.name}</div></td><td>{formatDate(batch.startDate)}</td><td><select className="select-input" aria-label={`Update status for ${batch.name}`} value={batch.status} onChange={(e) => handleUpdateBatchStatus(batch.id, e.target.value)}><option value="active">Active</option><option value="completed">Completed</option></select></td></tr>)}</tbody></table></div>
            </section>
          )}

          {activeTab === 'report' && (
            <section className="section-card">
              <div className="section-header"><div className="section-title-wrap"><div className="section-icon revenue-theme"><FileText size={20} /></div><div><h2 className="section-heading">Financial Report</h2><p className="section-subtext">All revenue, expenses, and net profit</p></div></div><button className="btn btn-primary" onClick={() => window.open('/api/reports/pdf', '_blank')}><FileText size={16} /><span>Download PDF</span></button></div>
              <div className="kpi-grid report-summary">
                <div className="kpi-card kpi-revenue"><div className="kpi-info"><span className="kpi-label">Total Revenue</span><h3 className="kpi-value">{formatCurrency(report?.totalRevenue)}</h3></div></div>
                <div className="kpi-card kpi-expenses"><div className="kpi-info"><span className="kpi-label">Total Expenses</span><h3 className="kpi-value">{formatCurrency(report?.totalExpenses)}</h3></div></div>
                <div className="kpi-card kpi-profit"><div className="kpi-info"><span className="kpi-label">Net Profit</span><h3 className="kpi-value">{formatCurrency(report?.netProfit)}</h3></div></div>
              </div>
              <div className="table-container"><table className="data-table"><thead><tr><th>Type</th><th>Description</th><th>Batch</th><th>Amount</th></tr></thead><tbody>{[...(report?.revenues || []).map((item) => ({ ...item, entryType: 'Revenue' })), ...(report?.expenses || []).map((item) => ({ ...item, entryType: 'Expense' }))].map((item) => <tr key={`${item.entryType}-${item.id}`}><td>{item.entryType}</td><td>{item.name}</td><td>{item.Batch?.name || 'Unknown batch'}</td><td className={item.entryType === 'Revenue' ? 'amount-positive' : 'amount-negative'}>{formatCurrency(item.amount)}</td></tr>)}</tbody></table></div>
            </section>
          )}

          {/* SECTION 2: EXPENSES */}
          {(activeTab === 'overview' || activeTab === 'expenses') && (
            <section className="section-card" id="expenses">
              <div className="section-header">
                <div className="section-title-wrap">
                  <div className="section-icon expense-theme">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h2 className="section-heading">Farm Expenses</h2>
                    <p className="section-subtext">Feed bags, vaccines, chicks stock, labor, and farm utilities</p>
                  </div>
                </div>
                <div className="section-actions">
                  <div className="section-badge expense-badge">{formatCurrency(totalExpenses)} Total</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setExpenseModal({ isOpen: true, isEdit: false, id: '', name: '', amount: '', type: 'Feeds', batchId: batches[0]?.id || '' })}
                  >
                    <Plus size={16} />
                    <span>Add Expense</span>
                  </button>
                </div>
              </div>

              <div className="section-toolbar">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <select
                    className="select-input"
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Feeds">Feeds</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Boosters">Boosters</option>
                    <option value="Vaccines">Vaccines</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Expense Name</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date Added</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="table-empty">No expense records found.</td>
                      </tr>
                    ) : (
                      filteredExpenses.map((item) => (
                        <tr key={item.id}>
                          <td><div className="item-title">{item.name}</div></td>
                          <td><span className={`category-tag tag-${item.type}`}>{item.type || 'Feeds'}</span></td>
                          <td><span className="item-amount amount-negative">-{formatCurrency(item.amount)}</span></td>
                          <td><span className="item-date">{formatDate(item.createdAt)}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons">
                              <button
                                className="btn-table-action action-edit"
                                onClick={() => setExpenseModal({
                                  isOpen: true,
                                  isEdit: true,
                                  id: item.id,
                                  name: item.name,
                                  amount: item.amount,
                                  type: item.type || 'Feeds',
                                  batchId: item.batchId
                                })}
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="btn-table-action action-delete"
                                onClick={() => setDeleteModal({
                                  isOpen: true,
                                  id: item.id,
                                  type: 'expense',
                                  name: item.name
                                })}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 3: INVENTORY */}
          {(activeTab === 'overview' || activeTab === 'inventory') && (
            <section className="section-card" id="inventory">
              <div className="section-header">
                <div className="section-title-wrap">
                  <div className="section-icon inventory-theme">
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="section-heading">Farm Inventory</h2>
                    <p className="section-subtext">Current on-hand feed stock, vaccines, drinkers, and equipment</p>
                  </div>
                </div>
                <div className="section-actions">
                  <div className="section-badge inventory-badge">{formatCurrency(totalInventoryValuation)} Total</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setInventoryModal({ isOpen: true, isEdit: false, id: '', name: '', amount: '' })}
                  >
                    <Plus size={16} />
                    <span>Add Inventory</span>
                  </button>
                </div>
              </div>

              <div className="section-toolbar">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search inventory items..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Valuation / Amount</th>
                      <th>Date Added</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="table-empty">No inventory items found.</td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => (
                        <tr key={item.id}>
                          <td><div className="item-title">{item.name}</div></td>
                          <td><span className="item-amount">{formatCurrency(item.amount)}</span></td>
                          <td><span className="item-date">{formatDate(item.createdAt)}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons">
                              <button
                                className="btn-table-action action-edit"
                                onClick={() => setInventoryModal({
                                  isOpen: true,
                                  isEdit: true,
                                  id: item.id,
                                  name: item.name,
                                  amount: item.amount
                                })}
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="btn-table-action action-delete"
                                onClick={() => setDeleteModal({
                                  isOpen: true,
                                  id: item.id,
                                  type: 'inventory',
                                  name: item.name
                                })}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* -------------------------------------------------- */}
      {/* MODALS */}
      {/* -------------------------------------------------- */}

      {/* 1. Expense Modal */}
      {expenseModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setExpenseModal({ ...expenseModal, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{expenseModal.isEdit ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button className="close-modal" onClick={() => setExpenseModal({ ...expenseModal, isOpen: false })}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveExpense}>
              <div className="form-group">
                <label>Expense Name / Description <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Layer Mash (10 bags), Newcastle Vaccine"
                  className="form-control"
                  value={expenseModal.name}
                  onChange={(e) => setExpenseModal({ ...expenseModal, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (KES) <span className="required">*</span></label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="0"
                    className="form-control"
                    value={expenseModal.amount}
                    onChange={(e) => setExpenseModal({ ...expenseModal, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category <span className="required">*</span></label>
                  <select
                    className="form-control select-input"
                    value={expenseModal.type}
                    onChange={(e) => setExpenseModal({ ...expenseModal, type: e.target.value })}
                  >
                    <option value="Feeds">Feeds</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Boosters">Boosters</option>
                    <option value="Vaccines">Vaccines</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Batch <span className="required">*</span></label>
                <select className="form-control select-input" required value={expenseModal.batchId} onChange={(e) => setExpenseModal({ ...expenseModal, batchId: e.target.value })}>
                  <option value="">Select a batch</option>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setExpenseModal({ ...expenseModal, isOpen: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {expenseModal.isEdit ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Revenue Modal */}
      {revenueModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setRevenueModal({ ...revenueModal, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{revenueModal.isEdit ? 'Edit Revenue' : 'Add New Revenue'}</h3>
              <button className="close-modal" onClick={() => setRevenueModal({ ...revenueModal, isOpen: false })}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveRevenue}>
              <div className="form-group">
                <label>Revenue Source / Description <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 50 Crates of Eggs, 100 Broilers Sold"
                  className="form-control"
                  value={revenueModal.name}
                  onChange={(e) => setRevenueModal({ ...revenueModal, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Amount (KES) <span className="required">*</span></label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="0"
                  className="form-control"
                  value={revenueModal.amount}
                  onChange={(e) => setRevenueModal({ ...revenueModal, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Batch <span className="required">*</span></label>
                <select className="form-control select-input" required value={revenueModal.batchId} onChange={(e) => setRevenueModal({ ...revenueModal, batchId: e.target.value })}>
                  <option value="">Select a batch</option>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRevenueModal({ ...revenueModal, isOpen: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {revenueModal.isEdit ? 'Save Changes' : 'Save Revenue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Inventory Modal */}
      {inventoryModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setInventoryModal({ ...inventoryModal, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{inventoryModal.isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
              <button className="close-modal" onClick={() => setInventoryModal({ ...inventoryModal, isOpen: false })}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveInventory}>
              <div className="form-group">
                <label>Item Name / Description <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Layer Mash (50kg bag), Drinkers"
                  className="form-control"
                  value={inventoryModal.name}
                  onChange={(e) => setInventoryModal({ ...inventoryModal, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Valuation / Amount (KES) <span className="required">*</span></label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  placeholder="0"
                  className="form-control"
                  value={inventoryModal.amount}
                  onChange={(e) => setInventoryModal({ ...inventoryModal, amount: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInventoryModal({ ...inventoryModal, isOpen: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {inventoryModal.isEdit ? 'Save Changes' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {batchModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setBatchModal({ ...batchModal, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Add New Batch</h3><button className="close-modal" onClick={() => setBatchModal({ ...batchModal, isOpen: false })}><X size={18} /></button></div>
            <form onSubmit={handleSaveBatch}>
              <div className="form-group"><label>Batch Name <span className="required">*</span></label><input className="form-control" required value={batchModal.name} onChange={(e) => setBatchModal({ ...batchModal, name: e.target.value })} placeholder="e.g., Layer flock - August 2026" /></div>
              <div className="form-row"><div className="form-group"><label>Start Date <span className="required">*</span></label><input className="form-control" type="date" required value={batchModal.startDate} onChange={(e) => setBatchModal({ ...batchModal, startDate: e.target.value })} /></div><div className="form-group"><label>Status</label><select className="form-control select-input" value={batchModal.status} onChange={(e) => setBatchModal({ ...batchModal, status: e.target.value })}><option value="active">Active</option><option value="completed">Completed</option></select></div></div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setBatchModal({ ...batchModal, isOpen: false })}>Cancel</button><button type="submit" className="btn btn-primary">Save Batch</button></div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteModal({ isOpen: false, id: '', type: '', name: '' })}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title text-danger">Confirm Deletion</h3>
              <button className="close-modal" onClick={() => setDeleteModal({ isOpen: false, id: '', type: '', name: '' })}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <AlertTriangle size={24} color="var(--danger)" />
                <span>Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?</span>
              </div>
              <p className="modal-hint">This action will remove the record from the database permanently.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteModal({ isOpen: false, id: '', type: '', name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} color="#16a34a" />}
            {toast.type === 'error' && <AlertTriangle size={18} color="#ef4444" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
