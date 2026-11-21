
// ==========================================
// FinTrack - Personal Finance Manager
// Complete JavaScript
// Refresh Always Requires Login
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. STORAGE AND BASIC HELPERS
    // ==========================================

    const TRANSACTION_KEY = "fintrack_transactions";
    const BUDGET_KEY = "fintrack_budgets";
    const AUTH_KEY = "fintrack_login_account";
    const SESSION_KEY = "fintrack_logged_in";

    const $ = (id) => document.getElementById(id);

    function readStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.error("Storage read error:", error);
            return fallback;
        }
    }

    function saveStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function money(amount) {
        return "৳" + Number(amount || 0).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    function currentMonth() {
        const date = new Date();
        return date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0");
    }

    function todayDate() {
        const date = new Date();
        return date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0");
    }

    function currentTime() {
        const date = new Date();
        return String(date.getHours()).padStart(2, "0") + ":" +
            String(date.getMinutes()).padStart(2, "0");
    }

    function formatDate(dateString) {
        if (!dateString) return "-";

        const date = new Date(dateString + "T00:00:00");

        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // ==========================================
    // 2. LOAD EXISTING DATA
    // ==========================================

    let transactions = readStorage(TRANSACTION_KEY, null);

    if (!Array.isArray(transactions)) {
        transactions = readStorage("transactions", []);
    }

    let budgets = readStorage(BUDGET_KEY, null);

    if (!budgets || Array.isArray(budgets) || typeof budgets !== "object") {
        budgets = readStorage("monthlyBudgets", {});
    }

    if (!Array.isArray(transactions)) {
        transactions = [];
    }

    if (!budgets || typeof budgets !== "object" || Array.isArray(budgets)) {
        budgets = {};
    }

    transactions = transactions.map((item, index) => ({
        id: item.id ?? item.transaction_id ?? Date.now() + index,
        description: item.description ?? item.title ?? "",
        person: item.person ?? item.source ?? "",
        amount: Number(item.amount ?? 0),
        date: item.date ?? item.transactionDate ?? todayDate(),
        time: item.time ?? "00:00",
        type: String(item.type ?? "expense").toLowerCase(),
        category: item.category ?? "Other"
    }));

    function saveTransactions() {
        saveStorage(TRANSACTION_KEY, transactions);
    }

    function saveBudgets() {
        saveStorage(BUDGET_KEY, budgets);
    }

    saveTransactions();
    saveBudgets();

    // ==========================================
    // 3. ACCOUNT AND LOGIN SYSTEM
    // ==========================================

    let account = readStorage(AUTH_KEY, null);

    if (
        !account ||
        typeof account.username !== "string" ||
        typeof account.password !== "string"
    ) {
        account = {
            username: "admin",
            password: "123456"
        };

        saveStorage(AUTH_KEY, account);
    }

    function openDashboard() {
        $("loginPage").style.display = "none";
        document.querySelector(".app-shell").classList.add("authenticated");

        $("profileAvatar").textContent =
            account.username.charAt(0).toUpperCase();

        $("currentUsername").value = account.username;

        refreshAll();
    }

    function openLoginPage() {
        sessionStorage.removeItem(SESSION_KEY);

        document.querySelector(".app-shell").classList.remove("authenticated");
        $("loginPage").style.display = "flex";

        $("loginForm").reset();
        $("loginError").textContent = "";

        $("sidebar").classList.remove("open");
    }

    $("loginForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const username = $("loginUsername").value.trim();
        const password = $("loginPassword").value;

        if (
            username === account.username &&
            password === account.password
        ) {
            sessionStorage.setItem(SESSION_KEY, "true");
            $("loginError").textContent = "";
            openDashboard();
        } else {
            $("loginError").textContent =
                "Invalid username or password. Please try again.";
        }
    });

    // Logout
    $("logoutBtn").addEventListener("click", function () {
        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {
            openLoginPage();
        }
    });

    // Account Settings
    $("settingsForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const currentUsername = $("currentUsername").value.trim();
        const newUsername = $("newUsername").value.trim();
        const currentPassword = $("currentPassword").value;
        const newPassword = $("newPassword").value;
        const confirmPassword = $("confirmPassword").value;

        if (currentUsername !== account.username) {
            alert("Current account information is incorrect.");
            return;
        }

        if (currentPassword !== account.password) {
            alert("Current password is incorrect.");
            return;
        }

        if (newUsername.length < 3) {
            alert("Username must contain at least 3 characters.");
            return;
        }

        if (newPassword.length < 6) {
            alert("New password must contain at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New password and confirmation do not match.");
            return;
        }

        account = {
            username: newUsername,
            password: newPassword
        };

        saveStorage(AUTH_KEY, account);

        $("profileAvatar").textContent =
            account.username.charAt(0).toUpperCase();

        $("currentUsername").value = account.username;

        $("settingsForm").reset();

        alert("Account updated successfully!");

        $("currentUsername").value = account.username;
    });

    // ==========================================
    // 4. PAGE NAVIGATION
    // ==========================================

    const pageInfo = {
        overview: {
            title: "Overview",
            subtitle: "Welcome to your financial dashboard."
        },
        transactions: {
            title: "Transactions",
            subtitle: "Manage your income and expenses."
        },
        analytics: {
            title: "Analytics",
            subtitle: "Analyze your financial activities."
        },
        budget: {
            title: "Budget",
            subtitle: "Manage your monthly spending."
        },
        calendar: {
            title: "Calendar",
            subtitle: "View your daily financial activities."
        },
        print: {
            title: "Print Memo",
            subtitle: "Generate your monthly financial report."
        },
        settings: {
            title: "Settings",
            subtitle: "Manage your account information."
        }
    };

    function showView(viewName) {
        if (!pageInfo[viewName]) return;

        document.querySelectorAll(".view-section").forEach(section => {
            section.classList.remove("active");
        });

        document.querySelectorAll(".nav-link").forEach(button => {
            button.classList.remove("active");
        });

        $(viewName).classList.add("active");

        const activeButton = document.querySelector(
            '.nav-link[data-view="' + viewName + '"]'
        );

        if (activeButton) {
            activeButton.classList.add("active");
        }

        $("pageTitle").textContent = pageInfo[viewName].title;
        $("pageSubtitle").textContent = pageInfo[viewName].subtitle;

        $("sidebar").classList.remove("open");

        if (viewName === "analytics") renderAnalytics();
        if (viewName === "calendar") renderCalendar();
        if (viewName === "print") renderPrintMemo();

        if (viewName === "settings") {
            $("currentUsername").value = account.username;
        }
    }

    document.querySelectorAll(".nav-link").forEach(button => {
        button.addEventListener("click", function () {
            showView(this.dataset.view);
        });
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", function () {
            showView(this.dataset.go);
        });
    });

    $("menuToggle").addEventListener("click", function () {
        $("sidebar").classList.toggle("open");
    });

    // ==========================================
    // 5. CALCULATION HELPERS
    // ==========================================

    function totalByType(type, list = transactions) {
        return list
            .filter(item => item.type === type)
            .reduce((total, item) => total + Number(item.amount), 0);
    }

    function getMonthTransactions(month) {
        return transactions.filter(item => item.date.startsWith(month));
    }

    function getBalance() {
        return totalByType("income") - totalByType("expense");
    }

    // ==========================================
    // 6. OVERVIEW DASHBOARD
    // ==========================================

    function renderOverview() {
        $("balance").textContent = money(getBalance());
        $("totalIncome").textContent = money(totalByType("income"));
        $("totalExpense").textContent = money(totalByType("expense"));

        const recent = [...transactions]
            .sort((a, b) => {
                return (b.date + b.time).localeCompare(a.date + a.time);
            })
            .slice(0, 5);

        const container = $("recentTransactionList");
        const empty = $("recentEmpty");

        if (recent.length === 0) {
            container.innerHTML = "";
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        container.innerHTML = `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(item => `
                            <tr>
                                <td>${escapeHTML(item.description)}</td>
                                <td>${escapeHTML(item.category)}</td>
                                <td>${formatDate(item.date)}</td>
                                <td class="${item.type === "income" ? "income-text" : "expense-text"}">
                                    ${escapeHTML(item.type)}
                                </td>
                                <td class="${item.type === "income" ? "income-text" : "expense-text"}">
                                    ${money(item.amount)}
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==========================================
    // 7. ADD TRANSACTION
    // ==========================================

    $("transactionDate").value = todayDate();
    $("transactionTime").value = currentTime();

    $("transactionForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const description = $("description").value.trim();
        const person = $("person").value.trim();
        const amount = Number($("amount").value);
        const date = $("transactionDate").value;
        const time = $("transactionTime").value;
        const type = $("type").value;
        const category = $("category").value;

        if (!description || amount <= 0 || !date || !time) {
            alert("Please enter valid transaction information.");
            return;
        }

        transactions.push({
            id: Date.now(),
            description,
            person,
            amount,
            date,
            time,
            type,
            category
        });

        saveTransactions();

        this.reset();

        $("transactionDate").value = todayDate();
        $("transactionTime").value = currentTime();

        refreshAll();

        alert("Transaction added successfully!");
    });

    // ==========================================
    // 8. TRANSACTION HISTORY AND FILTERS
    // ==========================================

    function renderTransactions() {
        const tbody = $("transactionList");
        const empty = $("transactionEmpty");

        const search = $("searchTransaction").value.toLowerCase().trim();
        const month = $("reportMonth").value;
        const selectedDate = $("filterDate").value;
        const sort = $("sortDate").value;

        let filtered = [...transactions];

        if (search) {
            filtered = filtered.filter(item => (
                item.description.toLowerCase().includes(search) ||
                item.person.toLowerCase().includes(search) ||
                item.category.toLowerCase().includes(search) ||
                item.type.toLowerCase().includes(search)
            ));
        }

        if (month) {
            filtered = filtered.filter(item => item.date.startsWith(month));
        }

        if (selectedDate) {
            filtered = filtered.filter(item => item.date === selectedDate);
        }

        filtered.sort((a, b) => {
            const first = a.date + a.time;
            const second = b.date + b.time;

            return sort === "oldest"
                ? first.localeCompare(second)
                : second.localeCompare(first);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = "";
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        tbody.innerHTML = filtered.map(item => `
            <tr>
                <td>${escapeHTML(item.description)}</td>
                <td>${escapeHTML(item.person || "-")}</td>
                <td>${escapeHTML(item.category)}</td>
                <td>${formatDate(item.date)}</td>
                <td class="${item.type === "income" ? "income-text" : "expense-text"}">
                    ${escapeHTML(item.type)}
                </td>
                <td class="${item.type === "income" ? "income-text" : "expense-text"}">
                    ${money(item.amount)}
                </td>
                <td>
                    <button class="secondary-button edit-btn" data-id="${item.id}">Edit</button>
                    <button class="danger-button delete-btn" data-id="${item.id}">Delete</button>
                </td>
            </tr>
        `).join("");
    }

    $("searchTransaction").addEventListener("input", renderTransactions);
    $("reportMonth").addEventListener("change", renderTransactions);
    $("filterDate").addEventListener("change", renderTransactions);
    $("sortDate").addEventListener("change", renderTransactions);

    $("clearFilters").addEventListener("click", function () {
        $("searchTransaction").value = "";
        $("reportMonth").value = "";
        $("filterDate").value = "";
        $("sortDate").value = "newest";
        renderTransactions();
    });

    // ==========================================
    // 9. EDIT AND DELETE TRANSACTIONS
    // ==========================================

    let editingId = null;

    function closeEditModal() {
        $("editModal").classList.remove("show");
        editingId = null;
    }

    function openEditModal(id) {
        const item = transactions.find(
            transaction => String(transaction.id) === String(id)
        );

        if (!item) return;

        editingId = item.id;

        $("editDescription").value = item.description;
        $("editPerson").value = item.person;
        $("editAmount").value = item.amount;
        $("editDate").value = item.date;
        $("editTime").value = item.time;
        $("editType").value = item.type;
        $("editCategory").value = item.category;

        $("editModal").classList.add("show");
    }

    $("transactionList").addEventListener("click", function (event) {
        const editButton = event.target.closest(".edit-btn");
        const deleteButton = event.target.closest(".delete-btn");

        if (editButton) {
            openEditModal(editButton.dataset.id);
        }

        if (deleteButton) {
            const id = deleteButton.dataset.id;

            if (confirm("Are you sure you want to delete this transaction?")) {
                transactions = transactions.filter(
                    item => String(item.id) !== String(id)
                );

                saveTransactions();
                refreshAll();
            }
        }
    });

    $("editForm").addEventListener("submit", function (event) {
        event.preventDefault();

        if (editingId === null) return;

        const index = transactions.findIndex(
            item => String(item.id) === String(editingId)
        );

        if (index === -1) return;

        const amount = Number($("editAmount").value);

        if (amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        transactions[index] = {
            ...transactions[index],
            description: $("editDescription").value.trim(),
            person: $("editPerson").value.trim(),
            amount,
            date: $("editDate").value,
            time: $("editTime").value,
            type: $("editType").value,
            category: $("editCategory").value
        };

        saveTransactions();
        closeEditModal();
        refreshAll();

        alert("Transaction updated successfully!");
    });

    $("cancelEdit").addEventListener("click", closeEditModal);
    $("cancelEditBottom").addEventListener("click", closeEditModal);

    $("editModal").addEventListener("click", function (event) {
        if (event.target === $("editModal")) {
            closeEditModal();
        }
    });

    // ==========================================
    // 10. EXPORT CSV
    // ==========================================

    $("exportBtn").addEventListener("click", function () {
        if (transactions.length === 0) {
            alert("There are no transactions to export.");
            return;
        }

        const headers = [
            "Description", "Person", "Amount",
            "Date", "Time", "Type", "Category"
        ];

        const rows = transactions.map(item => [
            item.description,
            item.person,
            item.amount,
            item.date,
            item.time,
            item.type,
            item.category
        ]);

        function csvCell(value) {
            return '"' + String(value ?? "").replace(/"/g, '""') + '"';
        }

        const csvContent = [
            headers.map(csvCell).join(","),
            ...rows.map(row => row.map(csvCell).join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "FinTrack_Transactions.csv";
        link.click();

        URL.revokeObjectURL(url);
    });

    // ==========================================
    // 11. ANALYTICS
    // ==========================================

    let expenseChart = null;

    function renderAnalytics() {
        const expenses = transactions.filter(item => item.type === "expense");
        const categoryTotals = {};

        expenses.forEach(item => {
            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0) + Number(item.amount);
        });

        const labels = Object.keys(categoryTotals);
        const values = Object.values(categoryTotals);
        const summary = $("categorySummary");

        if (labels.length === 0) {
            summary.innerHTML = `
                <div class="empty-message">
                    <div class="empty-icon">▥</div>
                    <h3>No Expense Data</h3>
                    <p>Add expense transactions to see your analytics.</p>
                </div>
            `;
        } else {
            summary.innerHTML = labels.map(category => `
                <div style="display:flex;justify-content:space-between;gap:15px;padding:12px;border-bottom:1px solid var(--border);">
                    <strong>${escapeHTML(category)}</strong>
                    <span>${money(categoryTotals[category])}</span>
                </div>
            `).join("");
        }

        const canvas = $("expenseChart");

        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }

        expenseChart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: labels.length ? labels : ["No Expense Data"],
                datasets: [{
                    data: values.length ? values : [1],
                    backgroundColor: [
                        "#4f46e5", "#16a36a", "#e05260",
                        "#f59e0b", "#0ea5e9", "#8b5cf6",
                        "#ec4899", "#64748b", "#14b8a6", "#a3a3a3"
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }

    // ==========================================
    // 12. MONTHLY BUDGET
    // ==========================================

    $("budgetMonth").value = currentMonth();

    function renderBudget() {
        const month = $("budgetMonth").value || currentMonth();
        const budget = Number(budgets[month] || 0);

        const monthlyExpenses = totalByType(
            "expense",
            getMonthTransactions(month)
        );

        $("budgetInput").value = budget || "";
        $("budgetDisplay").textContent = money(budget);

        if (budget <= 0) {
            $("budgetStatus").textContent = "No budget set for this month.";
            $("budgetProgress").style.width = "0%";
            return;
        }

        const percentage = (monthlyExpenses / budget) * 100;
        const remaining = budget - monthlyExpenses;

        if (remaining >= 0) {
            $("budgetStatus").textContent =
                money(remaining) + " remaining. You have used " +
                percentage.toFixed(1) + "% of your budget.";
        } else {
            $("budgetStatus").textContent =
                "You exceeded your budget by " + money(Math.abs(remaining)) + ".";
        }

        $("budgetProgress").style.width = Math.min(percentage, 100) + "%";
        $("budgetProgress").style.background =
            percentage > 100 ? "var(--red)" : "var(--primary)";
    }

    $("budgetMonth").addEventListener("change", renderBudget);

    $("setBudget").addEventListener("click", function () {
        const month = $("budgetMonth").value;
        const amount = Number($("budgetInput").value);

        if (!month) {
            alert("Please select a month.");
            return;
        }

        if (amount < 0 || !Number.isFinite(amount)) {
            alert("Please enter a valid budget amount.");
            return;
        }

        budgets[month] = amount;

        saveBudgets();
        renderBudget();
        renderPrintMemo();

        alert("Monthly budget saved successfully!");
    });

    // ==========================================
    // 13. CALENDAR
    // ==========================================

    let calendarDate = new Date();

    function renderCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();

        $("calendarMonth").textContent =
            calendarDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        let html = weekdays.map(day => `
            <div class="calendar-weekday">${day}</div>
        `).join("");

        for (let i = 0; i < firstDay; i++) {
            html += `<div></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = year + "-" +
                String(month + 1).padStart(2, "0") + "-" +
                String(day).padStart(2, "0");

            const dayTransactions = transactions.filter(
                item => item.date === dateString
            );

            const total = dayTransactions.reduce(
                (sum, item) => sum +
                    (item.type === "income"
                        ? Number(item.amount)
                        : -Number(item.amount)),
                0
            );

            html += `
                <div class="calendar-day
                    ${dateString === todayDate() ? "today" : ""}
                    ${dayTransactions.length ? "has-transaction" : ""}">
                    <strong>${day}</strong>
                    ${dayTransactions.length ? `
                        <span class="calendar-amount">${money(total)}</span>
                    ` : ""}
                </div>
            `;
        }

        $("calendarGrid").innerHTML = html;
    }

    $("calendarPrev").addEventListener("click", function () {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });

    $("calendarNext").addEventListener("click", function () {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    // ==========================================
    // 14. PRINT MEMO
    // ==========================================

    $("printMonth").value = currentMonth();

    function renderPrintMemo() {
        const month = $("printMonth").value || currentMonth();
        const monthlyTransactions = getMonthTransactions(month);

        const income = totalByType("income", monthlyTransactions);
        const expense = totalByType("expense", monthlyTransactions);
        const balance = income - expense;
        const budget = Number(budgets[month] || 0);

        $("memoDate").textContent = "Report Month: " + month;
        $("memoIncome").textContent = money(income);
        $("memoExpense").textContent = money(expense);
        $("memoBalance").textContent = money(balance);
        $("memoBudget").textContent = money(budget);

        const tbody = $("memoTransactionList");

        if (monthlyTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        No transactions found for this month.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = monthlyTransactions
            .slice()
            .sort((a, b) =>
                (b.date + b.time).localeCompare(a.date + a.time)
            )
            .map(item => `
                <tr>
                    <td>${escapeHTML(item.description)}</td>
                    <td>${escapeHTML(item.category)}</td>
                    <td>${formatDate(item.date)}</td>
                    <td>${escapeHTML(item.type)}</td>
                    <td>${money(item.amount)}</td>
                </tr>
            `).join("");
    }

    $("printMonth").addEventListener("change", renderPrintMemo);

    $("printBtn").addEventListener("click", function () {
        renderPrintMemo();
        window.print();
    });

    // ==========================================
    // 15. CLEAR ALL DATA
    // ==========================================

    $("clearAllBtn").addEventListener("click", function () {
        const confirmed = confirm(
            "Are you sure you want to delete all transactions and budgets? This action cannot be undone."
        );

        if (!confirmed) return;

        transactions = [];
        budgets = {};

        saveTransactions();
        saveBudgets();

        refreshAll();

        alert("All financial data has been cleared.");
    });

    // ==========================================
    // 16. REFRESH ALL DASHBOARD SECTIONS
    // ==========================================

    function refreshAll() {
        renderOverview();
        renderTransactions();
        renderAnalytics();
        renderBudget();
        renderCalendar();
        renderPrintMemo();
    }

    // ==========================================
    // 17. INITIAL PAGE SETUP
    // ==========================================

    $("todayLabel").textContent = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    $("footerYear").textContent = new Date().getFullYear();

    // IMPORTANT:
    // Do not restore the previous login session.
    // Every page load starts from the login screen.
    sessionStorage.removeItem(SESSION_KEY);
    openLoginPage();

});
