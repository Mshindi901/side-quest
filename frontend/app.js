/**
 * PoultryFlow Farm Dashboard - Client Application
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? '' 
    : 'http://localhost:4000';

// Global state
const state = {
    revenue: [],
    expenses: [],
    inventory: [],
    revenueSearch: '',
    expenseSearch: '',
    expenseTypeFilter: '',
    inventorySearch: '',
    pendingDelete: null // { id, type, name }
};

// Currency Formatter (KES without decimals)
const formatCurrency = (amount) => {
    const num = Math.round(parseFloat(amount) || 0);
    return 'KES ' + num.toLocaleString('en-US');
};

// Date Formatter
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Show Toast Notification
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 200);
    }, 3500);
};

// Check Server Health
const checkServerHealth = async () => {
    const statusEl = document.getElementById('serverStatus');
    try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) {
            statusEl.className = 'server-status connected';
            statusEl.querySelector('.status-text').textContent = 'Backend: Online';
        } else {
            statusEl.className = 'server-status error';
            statusEl.querySelector('.status-text').textContent = 'Backend: Degraded';
        }
    } catch (err) {
        statusEl.className = 'server-status error';
        statusEl.querySelector('.status-text').textContent = 'Backend: Offline';
    }
};

// API Calls
const fetchAllData = async () => {
    await Promise.all([
        fetchRevenue(),
        fetchExpenses(),
        fetchInventory()
    ]);
    updateDashboardKPIs();
};

const fetchRevenue = async () => {
    const tbody = document.getElementById('revenueTableBody');
    try {
        const res = await fetch(`${API_BASE}/api/revenue`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
            state.revenue = result.data;
        } else {
            state.revenue = [];
        }
    } catch (err) {
        console.error('Error fetching revenue:', err);
        state.revenue = [];
    }
    renderRevenueTable();
};

const fetchExpenses = async () => {
    try {
        const res = await fetch(`${API_BASE}/api/expenses`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
            state.expenses = result.data;
        } else {
            state.expenses = [];
        }
    } catch (err) {
        console.error('Error fetching expenses:', err);
        state.expenses = [];
    }
    renderExpensesTable();
};

const fetchInventory = async () => {
    try {
        const res = await fetch(`${API_BASE}/api/inventory`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
            state.inventory = result.data;
        } else {
            state.inventory = [];
        }
    } catch (err) {
        console.error('Error fetching inventory:', err);
        state.inventory = [];
    }
    renderInventoryTable();
};

// Update KPI Summary Metrics
const updateDashboardKPIs = () => {
    const totalRev = state.revenue.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const totalExp = state.expenses.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const netProfit = totalRev - totalExp;
    const totalInv = state.inventory.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

    // KPI Values
    document.getElementById('kpiTotalRevenue').textContent = formatCurrency(totalRev);
    document.getElementById('kpiRevenueCount').textContent = `${state.revenue.length} recorded entries`;
    document.getElementById('navRevenueCount').textContent = state.revenue.length;
    document.getElementById('sectionRevenueTotal').textContent = `${formatCurrency(totalRev)} Total`;

    document.getElementById('kpiTotalExpenses').textContent = formatCurrency(totalExp);
    document.getElementById('kpiExpenseCount').textContent = `${state.expenses.length} recorded entries`;
    document.getElementById('navExpenseCount').textContent = state.expenses.length;
    document.getElementById('sectionExpenseTotal').textContent = `${formatCurrency(totalExp)} Total`;

    document.getElementById('kpiTotalInventory').textContent = formatCurrency(totalInv);
    document.getElementById('kpiInventoryCount').textContent = `${state.inventory.length} stock items`;
    document.getElementById('navInventoryCount').textContent = state.inventory.length;
    document.getElementById('sectionInventoryTotal').textContent = `${formatCurrency(totalInv)} Total`;

    // Net Profit & Margin
    const netProfitEl = document.getElementById('kpiNetProfit');
    const marginPill = document.getElementById('kpiProfitMargin');
    
    netProfitEl.textContent = formatCurrency(netProfit);
    if (netProfit < 0) {
        netProfitEl.style.color = 'var(--danger)';
        marginPill.className = 'kpi-pill negative';
        marginPill.textContent = 'Net Loss';
    } else {
        netProfitEl.style.color = 'var(--text-main)';
        marginPill.className = 'kpi-pill';
        const marginPct = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0;
        marginPill.textContent = `${marginPct}% Margin`;
    }
};

// Render Revenue Table
const renderRevenueTable = () => {
    const tbody = document.getElementById('revenueTableBody');
    let filtered = state.revenue;

    if (state.revenueSearch.trim()) {
        const q = state.revenueSearch.toLowerCase();
        filtered = filtered.filter(item => (item.name || '').toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-empty">No revenue records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <div class="item-title">${escapeHtml(item.name)}</div>
            </td>
            <td>
                <span class="item-amount amount-positive">+${formatCurrency(item.amount)}</span>
            </td>
            <td>
                <span class="item-date">${formatDate(item.createdAt)}</span>
            </td>
            <td style="text-align: right;">
                <div class="action-buttons">
                    <button class="btn-table-action action-edit" onclick="editRevenue('${item.id}')" title="Edit Revenue">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="btn-table-action action-delete" onclick="confirmDelete('${item.id}', 'revenue', '${escapeHtml(item.name)}')" title="Delete Revenue">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};

// Render Expenses Table
const renderExpensesTable = () => {
    const tbody = document.getElementById('expensesTableBody');
    let filtered = state.expenses;

    if (state.expenseSearch.trim()) {
        const q = state.expenseSearch.toLowerCase();
        filtered = filtered.filter(item => (item.name || '').toLowerCase().includes(q));
    }

    if (state.expenseTypeFilter) {
        filtered = filtered.filter(item => (item.type || '').toLowerCase() === state.expenseTypeFilter.toLowerCase());
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No expense records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <div class="item-title">${escapeHtml(item.name)}</div>
            </td>
            <td>
                <span class="category-tag tag-${escapeHtml(item.type)}">${escapeHtml(item.type || 'Other')}</span>
            </td>
            <td>
                <span class="item-amount amount-negative">-${formatCurrency(item.amount)}</span>
            </td>
            <td>
                <span class="item-date">${formatDate(item.createdAt)}</span>
            </td>
            <td style="text-align: right;">
                <div class="action-buttons">
                    <button class="btn-table-action action-edit" onclick="editExpense('${item.id}')" title="Edit Expense">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="btn-table-action action-delete" onclick="confirmDelete('${item.id}', 'expense', '${escapeHtml(item.name)}')" title="Delete Expense">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};

// Render Inventory Table
const renderInventoryTable = () => {
    const tbody = document.getElementById('inventoryTableBody');
    let filtered = state.inventory;

    if (state.inventorySearch.trim()) {
        const q = state.inventorySearch.toLowerCase();
        filtered = filtered.filter(item => (item.name || '').toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-empty">No inventory items found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <div class="item-title">${escapeHtml(item.name)}</div>
            </td>
            <td>
                <span class="item-amount">${formatCurrency(item.amount)}</span>
            </td>
            <td>
                <span class="item-date">${formatDate(item.createdAt)}</span>
            </td>
            <td style="text-align: right;">
                <div class="action-buttons">
                    <button class="btn-table-action action-edit" onclick="editInventory('${item.id}')" title="Edit Inventory">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="btn-table-action action-delete" onclick="confirmDelete('${item.id}', 'inventory', '${escapeHtml(item.name)}')" title="Delete Inventory">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Modal Handlers
const openModal = (dialogId) => {
    const dialog = document.getElementById(dialogId);
    if (dialog) dialog.showModal();
};

const closeModal = (dialogId) => {
    const dialog = document.getElementById(dialogId);
    if (dialog) dialog.close();
};

// Form Open Handlers (Add Mode)
const openAddExpenseModal = () => {
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseType').value = '';
    document.getElementById('expenseModalTitle').textContent = 'Add New Expense';
    openModal('expenseModal');
};

const openAddRevenueModal = () => {
    document.getElementById('revenueId').value = '';
    document.getElementById('revenueName').value = '';
    document.getElementById('revenueAmount').value = '';
    document.getElementById('revenueModalTitle').textContent = 'Add New Revenue';
    openModal('revenueModal');
};

const openAddInventoryModal = () => {
    document.getElementById('inventoryId').value = '';
    document.getElementById('inventoryName').value = '';
    document.getElementById('inventoryAmount').value = '';
    document.getElementById('inventoryModalTitle').textContent = 'Add Inventory Item';
    openModal('inventoryModal');
};

// Edit Record Handlers
window.editExpense = (id) => {
    const item = state.expenses.find(e => e.id === id);
    if (!item) return;
    document.getElementById('expenseId').value = item.id;
    document.getElementById('expenseName').value = item.name;
    document.getElementById('expenseAmount').value = item.amount;
    document.getElementById('expenseType').value = item.type;
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
    openModal('expenseModal');
};

window.editRevenue = (id) => {
    const item = state.revenue.find(r => r.id === id);
    if (!item) return;
    document.getElementById('revenueId').value = item.id;
    document.getElementById('revenueName').value = item.name;
    document.getElementById('revenueAmount').value = item.amount;
    document.getElementById('revenueModalTitle').textContent = 'Edit Revenue';
    openModal('revenueModal');
};

window.editInventory = (id) => {
    const item = state.inventory.find(i => i.id === id);
    if (!item) return;
    document.getElementById('inventoryId').value = item.id;
    document.getElementById('inventoryName').value = item.name;
    document.getElementById('inventoryAmount').value = item.amount;
    document.getElementById('inventoryModalTitle').textContent = 'Edit Inventory Item';
    openModal('inventoryModal');
};

// Delete Handlers
window.confirmDelete = (id, type, name) => {
    state.pendingDelete = { id, type, name };
    document.getElementById('deleteItemName').textContent = `"${name}" (${type})`;
    openModal('deleteConfirmModal');
};

const executeDelete = async () => {
    if (!state.pendingDelete) return;
    const { id, type, name } = state.pendingDelete;
    const endpoint = type === 'expense' ? 'expenses' : type;

    try {
        const res = await fetch(`${API_BASE}/api/${endpoint}/${id}`, {
            method: 'DELETE'
        });
        const result = await res.json();
        if (result.success) {
            showToast(`${name} deleted successfully`, 'success');
            closeModal('deleteConfirmModal');
            state.pendingDelete = null;
            await fetchAllData();
        } else {
            showToast(result.message || 'Failed to delete record', 'error');
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Server error while deleting', 'error');
    }
};

// Form Submissions
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('expenseId').value;
    const name = document.getElementById('expenseName').value.trim();
    const amount = Math.round(parseFloat(document.getElementById('expenseAmount').value));
    const type = document.getElementById('expenseType').value || 'Feeds';

    const isEdit = Boolean(id);
    const url = isEdit ? `${API_BASE}/api/expenses/${id}` : `${API_BASE}/api/expenses`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, amount, type })
        });
        const result = await res.json();
        if (result.success) {
            showToast(isEdit ? 'Expense updated!' : 'Expense added!', 'success');
            closeModal('expenseModal');
            await fetchAllData();
        } else {
            showToast(result.message || 'Error saving expense', 'error');
        }
    } catch (err) {
        console.error('Save expense error:', err);
        showToast('Failed to connect to backend', 'error');
    }
});

document.getElementById('revenueForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('revenueId').value;
    const name = document.getElementById('revenueName').value.trim();
    const amount = Math.round(parseFloat(document.getElementById('revenueAmount').value));

    const isEdit = Boolean(id);
    const url = isEdit ? `${API_BASE}/api/revenue/${id}` : `${API_BASE}/api/revenue`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, amount })
        });
        const result = await res.json();
        if (result.success) {
            showToast(isEdit ? 'Revenue updated!' : 'Revenue added!', 'success');
            closeModal('revenueModal');
            await fetchAllData();
        } else {
            showToast(result.message || 'Error saving revenue', 'error');
        }
    } catch (err) {
        console.error('Save revenue error:', err);
        showToast('Failed to connect to backend', 'error');
    }
});

document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('inventoryId').value;
    const name = document.getElementById('inventoryName').value.trim();
    const amount = Math.round(parseFloat(document.getElementById('inventoryAmount').value));

    const isEdit = Boolean(id);
    const url = isEdit ? `${API_BASE}/api/inventory/${id}` : `${API_BASE}/api/inventory`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, amount })
        });
        const result = await res.json();
        if (result.success) {
            showToast(isEdit ? 'Inventory updated!' : 'Inventory item added!', 'success');
            closeModal('inventoryModal');
            await fetchAllData();
        } else {
            showToast(result.message || 'Error saving inventory', 'error');
        }
    } catch (err) {
        console.error('Save inventory error:', err);
        showToast('Failed to connect to backend', 'error');
    }
});

// Event Listeners for UI
document.addEventListener('DOMContentLoaded', () => {
    // Current date
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
        const today = new Date();
        dateDisplay.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Modal Trigger Buttons
    document.getElementById('openAddExpenseModal').addEventListener('click', openAddExpenseModal);
    document.getElementById('sidebarAddExpenseBtn').addEventListener('click', openAddExpenseModal);

    document.getElementById('openAddRevenueModal').addEventListener('click', openAddRevenueModal);
    document.getElementById('sidebarAddRevenueBtn').addEventListener('click', openAddRevenueModal);

    document.getElementById('openAddInventoryModal').addEventListener('click', openAddInventoryModal);
    document.getElementById('sidebarAddInventoryBtn').addEventListener('click', openAddInventoryModal);

    // Delete Confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', executeDelete);

    // Generic Close Modal Buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-dialog').forEach(modal => modal.close());
        });
    });

    // Close modal on backdrop click
    document.querySelectorAll('.modal-dialog').forEach(modal => {
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
                && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
            if (!isInDialog) {
                modal.close();
            }
        });
    });

    // Search and Filter Listeners
    document.getElementById('revenueSearchInput').addEventListener('input', (e) => {
        state.revenueSearch = e.target.value;
        renderRevenueTable();
    });

    document.getElementById('expenseSearchInput').addEventListener('input', (e) => {
        state.expenseSearch = e.target.value;
        renderExpensesTable();
    });

    document.getElementById('expenseTypeFilter').addEventListener('change', (e) => {
        state.expenseTypeFilter = e.target.value;
        renderExpensesTable();
    });

    document.getElementById('inventorySearchInput').addEventListener('input', (e) => {
        state.inventorySearch = e.target.value;
        renderInventoryTable();
    });

    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        showToast('Refreshing farm records...', 'info');
        await checkServerHealth();
        await fetchAllData();
    });

    // Sidebar Mobile Toggle
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    // Sidebar Navigation Active Link Switching
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Initial Load
    checkServerHealth();
    fetchAllData();
});

