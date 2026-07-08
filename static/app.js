function dashboardApp() {
  return {
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'layout-dashboard', badge: null, badgeColor: 'blue', description: 'View executive operational analytics, service health status, and live email queues.' },
      { id: 'deficits', label: 'Deficits', icon: 'package', badge: 0, badgeColor: 'red', description: 'Manage raw material/item deficits and match alternatives for outstanding orders.' },
      { id: 'negotiations', label: 'Negotiations', icon: 'message-square-text', badge: 0, badgeColor: 'yellow', description: 'Review, counter-offer, or resolve discount requests escalated by the AI.' },
      { id: 'inventory', label: 'Full Inventory', icon: 'warehouse', badge: null, badgeColor: 'blue', description: 'View current stock levels, base prices, and catalog items.' },
      { id: 'training', label: 'AI Training', icon: 'brain', badge: null, badgeColor: 'blue', description: 'Train and configure relevance keywords for automatic email classification.' },
      { id: 'activity', label: 'Activity Log', icon: 'activity', badge: null, badgeColor: 'blue', description: 'Real-time event stream: every email received, quote generated, reply handled, and error logged with timestamps.' }
    ],
    
    activeTab: 'overview',
    theme: 'warm',
    selectedTenant: 'default',
    tenants: [{ id: 'default', name: 'Trofeo Hardware Branch' }],
    invoiceFilter: '',
    deficitsSearch: '',
    negSearch: '',
    activitySearch: '',
    toasts: [],
    connectionStatus: 'connected',
    
    // Tab AI Training
    trainingKeywords: [],
    recentlyLearnedKeywords: [],
    newTrainingKeyword: '',
    loadingTraining: false,
    
    // Tab 1: Overview
    overviewData: {},
    overviewSubTab: 'pipeline',
    newMails: [],
    respondedMails: [],
    repliedMails: [],
    negotiations: [],
    rejectedMails: [],
    pendingDeficits: [],
    pendingUnmatched: [],
    pendingReviews: [],
    lastRefreshed: '',
    isAutoRefreshing: false,
    logs: [],
    logsExpanded: false,
    autoRefreshLogs: true,
    
    // New Analytics State
    analyticsData: {
      top_customers: [],
      top_quotations: [],
      best_sellers: [],
      funnel: {
        total_received: 0,
        converted: 0,
        unmatched: 0,
        rejected: 0,
        pending_review: 0,
        escalated: 0,
        conversion_rate: 0.0,
        leakage_rate: 0.0
      }
    },
    analyticsDateFilter: 'all',
    custHistoryEmail: '',
    custHistoryResult: null,
    loadingCustHistory: false,
    
    // New Settings State
    settings: {
      reply_mode: 'auto',
      reply_pattern: 'summary',
      ingestion_engine: 'A',
      exec_name: '',
      exec_title: '',
      exec_phone: '',
      exec_email: '',
      business_name: ''
    },
    
    // Tab 2: Live Simulator
    simText: '',
    simEmail: 'rajarajanodooimplementers@gmail.com',
    simChannel: 'email',
    simEngine: 'A',
    simLoading: false,
    simMetrics: null,
    simLines: [],
    simDiscountPct: 0.0,
    simCustomerName: 'Walk-in Retail Client',
    simInvoiceId: '',
    simShowNegPanel: false,
    simTargetDiscount: 10,
    simChatHistory: [],
    simChatInput: '',
    simNegLoading: false,
    simNegStatus: 'Active',
    presets: [
      { label: '📧 Email with Deficits', text: 'Subject: Quotation Request - Order SKU-2026-X\nDear Sales Team,\nPlease send pricing and quotes for the following parts:\n1. 10 units of Plastic Tool Box 19 Inch\n2. 5 units of Heavy Duty Staple Tacker Gun\n3. 2 units of Spirit Level Aluminum 24 Inch\nThanks,\nRajarajan (rajarajanodooimplementers@gmail.com)' },
      { label: '💬 WhatsApp Shorthand', text: 'Hi, need stock check and discount for:\n- 3 qty box-tool-19\n- 8 qty staple gun\nUrgently need delivery to our site tomorrow. Let me know the total with tax.' },
      { label: '⚠️ Deficit Trigger (High Qty)', text: 'Order inquiry:\n- 15 units of Plastic Tool Box 19 Inch (BOX-TOOL-19)\nNeed invoice asap.' }
    ],
    
    // Modal 1: Review Match HITL
    showHitl: false,
    hitlIndex: null,
    hitlOptions: [],
    
    // Tab 3 & Modal 2: Deficits
    deficits: [],
    defLowStock: [],
    showResolveDeficit: false,
    selectedDeficit: null,
    deficitNewStock: 10,
    resolvingDeficit: false,
    
    // Tab 4 & Modal 3: Negotiations
    negotiationsList: [],
    showResolveNeg: false,
    selectedInvoiceId: '',
    selectedCustName: '',
    selectedSubtotal: 0,
    discountInput: 10,
    discountMode: 'order',
    targetSkuId: '',
    itemDiscountValue: 0,
    selectedItems: [],
    submittingResolution: false,
    
    // Modal 5: Chat logs
    showChatModal: false,
    chatInvoiceId: '',
    chatCustName: '',
    chatLogs: [],
    chatItems: [],
    loadingChat: false,

    // Modal 6: Unmatched / Manual direct reply modal
    showUnmatchedModal: false,
    selectedUnmatched: null,
    unmatchedSubject: '',
    unmatchedReplyText: '',
    unmatchedHistoryLogs: [],
    loadingUnmatchedHistory: false,
    sendingManualReply: false,

    // Tab 5: Repository
    quotes: [],
    filteredQuotes: [],
    
    // Tab 6 & Modal 4: Inventory
    catalog: [],
    filteredCatalog: [],
    inventorySearch: '',
    inventoryCategory: 'all',
    inventoryStatus: 'all',
    showStockModal: false,
    selectedSkuId: '',
    selectedSkuName: '',
    newStockLevel: 0,
    updatingStock: false,
    
    // Tab 7: Stock logs
    stockLogs: [],

    // Tab 8: Activity Log
    activityLogs: [],
    activityFilter: '',
    activityUptime: 0,
    activityCurrentTime: '',
    activityServerStart: '',
    showRawLog: false,
    rawLogLines: [],
    _activityTimer: null,
    _uptimeTicker: null,

    // Deficits sorting & pagination
    deficitsSortField: 'invoice_id',
    deficitsSortOrder: 'asc',
    deficitsPage: 1,
    deficitsPageSize: 10,

    setDeficitsSort(field) {
      if (this.deficitsSortField === field) {
        this.deficitsSortOrder = this.deficitsSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.deficitsSortField = field;
        this.deficitsSortOrder = 'asc';
      }
      this.deficitsPage = 1;
    },

    sortedDeficits() {
      const field = this.deficitsSortField;
      const order = this.deficitsSortOrder === 'asc' ? 1 : -1;
      return [...this.getFilteredDeficits()].sort((a, b) => {
        let valA = a[field] ?? '';
        let valB = b[field] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    },

    paginatedDeficits() {
      const start = (this.deficitsPage - 1) * this.deficitsPageSize;
      return this.sortedDeficits().slice(start, start + this.deficitsPageSize);
    },

    deficitsTotalPages() {
      return Math.ceil(this.sortedDeficits().length / this.deficitsPageSize) || 1;
    },

    // Negotiations sorting & pagination
    negSortField: 'invoice_id',
    negSortOrder: 'asc',
    negPage: 1,
    negPageSize: 10,

    setNegSort(field) {
      if (this.negSortField === field) {
        this.negSortOrder = this.negSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.negSortField = field;
        this.negSortOrder = 'asc';
      }
      this.negPage = 1;
    },

    sortedNegotiations() {
      const field = this.negSortField;
      const order = this.negSortOrder === 'asc' ? 1 : -1;
      return [...this.getFilteredNegotiations()].sort((a, b) => {
        let valA = a[field] ?? '';
        let valB = b[field] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    },

    paginatedNegotiations() {
      const start = (this.negPage - 1) * this.negPageSize;
      return this.sortedNegotiations().slice(start, start + this.negPageSize);
    },

    negTotalPages() {
      return Math.ceil(this.sortedNegotiations().length / this.negPageSize) || 1;
    },

    // Inventory sorting & pagination
    catalogSortField: 'sku_id',
    catalogSortOrder: 'asc',
    catalogPage: 1,
    catalogPageSize: 10,

    setCatalogSort(field) {
      if (this.catalogSortField === field) {
        this.catalogSortOrder = this.catalogSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.catalogSortField = field;
        this.catalogSortOrder = 'asc';
      }
      this.catalogPage = 1;
    },

    sortedCatalog() {
      const field = this.catalogSortField;
      const order = this.catalogSortOrder === 'asc' ? 1 : -1;
      return [...this.filteredCatalog].sort((a, b) => {
        let valA = a[field] ?? '';
        let valB = b[field] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    },

    paginatedCatalog() {
      const start = (this.catalogPage - 1) * this.catalogPageSize;
      return this.sortedCatalog().slice(start, start + this.catalogPageSize);
    },

    catalogTotalPages() {
      return Math.ceil(this.sortedCatalog().length / this.catalogPageSize) || 1;
    },

    // Activity Log sorting & pagination
    activitySortField: 'timestamp',
    activitySortOrder: 'desc',
    activityPage: 1,
    activityPageSize: 10,

    setActivitySort(field) {
      if (this.activitySortField === field) {
        this.activitySortOrder = this.activitySortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.activitySortField = field;
        this.activitySortOrder = 'asc';
      }
      this.activityPage = 1;
    },

    sortedActivityLogs() {
      const field = this.activitySortField;
      const order = this.activitySortOrder === 'asc' ? 1 : -1;
      return [...this.filteredActivityLogs].sort((a, b) => {
        let valA = a[field] ?? '';
        let valB = b[field] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    },

    paginatedActivityLogs() {
      const start = (this.activityPage - 1) * this.activityPageSize;
      return this.sortedActivityLogs().slice(start, start + this.activityPageSize);
    },

    activityTotalPages() {
      return Math.ceil(this.sortedActivityLogs().length / this.activityPageSize) || 1;
    },

    async safeFetch(url, options = {}) {
      try {
        const res = await fetch(url, options);
        this.connectionStatus = 'connected';
        return res;
      } catch (e) {
        this.connectionStatus = 'offline';
        throw e;
      }
    },

    triggerLucide() {
      try {
        const lib = (typeof lucide !== 'undefined' ? lucide : (typeof Lucide !== 'undefined' ? Lucide : null));
        if (lib && typeof lib.createIcons === 'function') {
          lib.createIcons();
        }
      } catch (e) {
        console.warn('Lucide icons error:', e);
      }
    },
    
    // Init logic
    initApp() {
      this.theme = localStorage.getItem('theme') || 'warm';
      this.applyTheme();
      this.loadTenants();
      this.loadSettings();
      
      // Auto-refresh dashboard pipeline every 10 seconds
      setInterval(() => {
        this.isAutoRefreshing = true;
        Promise.all([
          this.fetchOverviewData(),
          this.loadAnalytics()
        ]).finally(() => {
          this.isAutoRefreshing = false;
          const now = new Date();
          this.lastRefreshed = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        });
      }, 10000);

      // Badge refresh every 8s
      setInterval(() => this.refreshBadges(), 8000);
      
      // Loop poller for system logs console
      setInterval(() => {
        if (this.logsExpanded && this.autoRefreshLogs && this.activeTab === 'overview') {
          this.fetchLogsOnly();
        }
      }, 5000);

      // Activity Log auto-refresh every 10s
      setInterval(() => {
        if (this.activeTab === 'activity') {
          this.loadActivityLog();
        }
      }, 10000);

      // Live uptime ticker (increments every second)
      setInterval(() => {
        if (this.activityUptime > 0) this.activityUptime += 1;
        // Update live IST clock display
        const now = new Date();
        this.activityCurrentTime = now.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false
        }).replace(',', '') + ' IST';
      }, 1000);
    },
    
    // UI Toasts
    showToast(message, type = 'success') {
      const id = Date.now();
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 3000);
    },
    
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
      localStorage.setItem('theme', this.theme);
    },
    
    async loadTenants() {
      try {
        const res = await this.safeFetch('/api/tenants');
        const data = await res.json();
        if (data.tenants && data.tenants.length > 0) {
          this.tenants = data.tenants;
        } else if (Array.isArray(data) && data.length > 0) {
          this.tenants = data;
        }
        this.handleTenantChange();
      } catch (e) {
        this.showToast('Error loading branch branches: ' + e.message, 'error');
      }
    },
    
    handleTenantChange() {
      this.fetchOverviewData();
      this.fetchServiceStatus();
      this.refreshBadges();
      this.loadDeficits();
      this.loadNegotiations();
      this.loadQuotes();
      this.loadCatalog();
      this.loadLogs();
      this.loadSettings();
      this.loadAnalytics();
      this.loadActivityLog();
      this.fetchTrainingData();
    },
    
    switchTab(tabId, filterVal = '') {
      this.activeTab = tabId;
      this.invoiceFilter = filterVal;
      this.handleGlobalSearch();
      if (tabId === 'analytics') {
        this.loadAnalytics();
      }
      if (tabId === 'activity') {
        this.loadActivityLog();
      }
      if (tabId === 'training') {
        this.fetchTrainingData();
      }
      this.$nextTick(() => {
        this.triggerLucide();
        this.drawQrCanvas();
      });
    },
    
    // Formatter helper
    fmt(n) {
      return '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    
    formatTime(ts) {
      if (!ts) return '';
      try {
        const parts = ts.split(' ');
        if (parts.length > 1) {
          return parts[1].substr(0, 5) + ' ' + parts[0].substr(5);
        }
        return ts;
      } catch (e) { return ts; }
    },
    
    formatDate(ts) {
      if (!logDateConverter(ts)) return ts || '—';
      return logDateConverter(ts);
    },
    
    getLogColor(log) {
      if (log.includes('[Error') || log.includes('failed') || log.includes('crashed') || log.includes('Exception')) {
        return 'var(--red)';
      } else if (log.includes('[Success') || log.includes('Processed (status:')) {
        return 'var(--green)';
      } else if (log.includes('[Email Filter') || log.includes('Skipped')) {
        return 'var(--yellow)';
      } else if (log.includes('[Poller') || log.includes('[Email Listener]')) {
        return 'var(--accent-cyan)';
      }
      return 'var(--text-1)';
    },
    
    // Dynamic badging counts
    async refreshBadges() {
      try {
        const [defRes, negRes] = await Promise.all([
          this.safeFetch(`/api/deficits?tenant_id=${this.selectedTenant}`),
          this.safeFetch(`/api/negotiations/escalated?tenant_id=${this.selectedTenant}`)
        ]);
        const defData = await defRes.json();
        const negData = await negRes.json();
        
        const dCount = (defData.deficits || []).filter(d => d.status === 'PENDING').length;
        const nCount = (negData.negotiations || []).filter(n => n.status !== 'NEGOTIATION_RESOLVED').length;
        
        this.tabs.find(t => t.id === 'deficits').badge = dCount;
        this.tabs.find(t => t.id === 'negotiations').badge = nCount;
      } catch (e) {}
    },

    // Search filters
    handleGlobalSearch() {
      const query = this.invoiceFilter.toLowerCase().trim();
      
      // Filter Quotes Tab
      if (!query) {
        this.filteredQuotes = this.quotes;
      } else {
        this.filteredQuotes = this.quotes.filter(q => 
          (q.invoice_id || '').toLowerCase().includes(query) ||
          (q.customer_name || '').toLowerCase().includes(query) ||
          (q.customer_email || '').toLowerCase().includes(query)
        );
      }
      
      // If email is passed in global search, auto fill simulator email
      if (query.includes('@')) {
        this.simEmail = this.invoiceFilter;
      }
    },

    getFilteredList(list) {
      if (!list) return [];
      const query = this.invoiceFilter.toLowerCase().trim();
      if (!query) return list;
      return list.filter(item => {
        const eventLabel = item.event_type ? (this.formatEventLabel(item.event_type) || '').toLowerCase() : '';
        const eventType = (item.event_type || '').toLowerCase();
        return (
          (item.customer_name || '').toLowerCase().includes(query) ||
          (item.customer_email || '').toLowerCase().includes(query) ||
          (item.invoice_id || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          (item.original_body || '').toLowerCase().includes(query) ||
          (item.sku_name || '').toLowerCase().includes(query) ||
          (item.sku_id || '').toLowerCase().includes(query) ||
          (item.category || '').toLowerCase().includes(query) ||
          (item.status || '').toLowerCase().includes(query) ||
          (item.timestamp || '').toLowerCase().includes(query) ||
          (item.created_at || '').toLowerCase().includes(query) ||
          eventLabel.includes(query) ||
          eventType.includes(query)
        );
      });
    },

     getFilteredDeficits() {
       const query = (this.deficitsSearch || this.invoiceFilter).toLowerCase().trim();
       if (!query) return this.deficits;
       return this.deficits.filter(d => 
         (d.invoice_id || '').toLowerCase().includes(query) || 
         (d.sku_name || '').toLowerCase().includes(query) || 
         (d.sku_id || '').toLowerCase().includes(query) || 
         (d.customer_name || '').toLowerCase().includes(query) ||
         (d.customer_email || '').toLowerCase().includes(query) ||
         (d.status || '').toLowerCase().includes(query) ||
         (d.created_at || '').toLowerCase().includes(query)
       );
     },
 
     getFilteredNegotiations() {
       const query = (this.negSearch || this.invoiceFilter).toLowerCase().trim();
       if (!query) return this.negotiationsList;
       return this.negotiationsList.filter(n => 
         (n.invoice_id || '').toLowerCase().includes(query) || 
         (n.customer_name || '').toLowerCase().includes(query) || 
         (n.customer_email || '').toLowerCase().includes(query) ||
         (n.status || '').toLowerCase().includes(query) ||
         (n.created_at || '').toLowerCase().includes(query)
       );
     },

    // Tab 1: Overview APIS
    async fetchOverviewData() {
      try {
        const res = await this.safeFetch(`/api/overview/analytics?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        this.overviewData = data;
        
        const recent_stream = data.recent_stream || [];
        const pending_items = data.pending_items || {};
        const negotiations = pending_items.negotiations || [];
        const deficits = pending_items.deficits || [];
        const unmatched = pending_items.unmatched || [];
        this.pendingReviews = pending_items.reviews || [];
        
        // Sort stream by timestamp descending
        const sortedStream = [...recent_stream].sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp.replace(' ', 'T')).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp.replace(' ', 'T')).getTime() : 0;
          return tB - tA;
        });

        // 1. New Mail Column: Emails that just arrived, not yet responded
        this.newMails = sortedStream.filter(item =>
          item.customer_email !== "System / Marketing" &&
          item.status === "Pending Review"
        );

        // 2. Responded Column: Auto-quoted and completed items (automated quote sent)
        this.respondedMails = sortedStream.filter(item =>
          item.status === "Auto-Filtered" ||
          item.status === "QUOTE_GENERATED" ||
          item.status === "QUOTE_UPDATED" ||
          item.status === "NEGOTIATION_APPROVED" ||
          item.status === "NEGOTIATION_NEGOTIATING" ||
          item.status === "CONVERSATIONAL_REPLY" ||
          item.status === "UNPARSED_NOTICE"
        );

        // 3. Reply Column: Customer replies to existing quotes or active negotiation
        this.repliedMails = sortedStream.filter(item =>
          item.customer_email !== "System / Marketing" &&
          (
            item.status === "CUSTOMER_REPLIED"
          )
        );

        // 4. Rejected: Rejected quotes
        this.rejectedMails = sortedStream.filter(item =>
          item.status === "NEGOTIATION_REJECTED"
        );

        // 5. Pending Column: Human-requested, unmatched, escalated negotiations, stock deficits
        // Combine from stream (PENDING_HUMAN) + pending_items from DB
        const pendingFromStream = sortedStream.filter(item =>
          item.status === "PENDING_HUMAN"
        );
        
        // Helper to safely parse any IST/SQL datetime string into milliseconds
        const parseDateMs = (ts) => {
          if (!ts) return 0;
          try {
            const clean = ts.replace(' IST', '').replace(' ', 'T').trim();
            const d = new Date(clean);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          } catch (e) {
            return 0;
          }
        };

        this.negotiations = negotiations;
        
        // Sort pending deficits (newest at the top)
        this.pendingDeficits = [...deficits].sort((a, b) => parseDateMs(b.created_at) - parseDateMs(a.created_at));
        
        // Sort pending reviews (newest at the top)
        this.pendingReviews = [...(pending_items.reviews || [])].sort((a, b) => parseDateMs(b.created_at) - parseDateMs(a.created_at));
        
        // Merge stream-based human requests into unmatched display list
        const humanRequestsAsUnmatched = pendingFromStream.map(item => ({
          id: item.message_id,
          customer_email: item.customer_email,
          customer_name: item.customer_name,
          original_body: item.description,
          source: "email",
          created_at: item.timestamp
        }));
        
        // Sort combined unmatched items (newest at the top)
        this.pendingUnmatched = [...humanRequestsAsUnmatched, ...unmatched].sort((a, b) => parseDateMs(b.created_at) - parseDateMs(a.created_at));

        // Feeds: Today / Yesterday mails
        const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayStr = yesterday.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

        this.todayMails = sortedStream.filter(item => {
          if (!item.timestamp) return false;
          try {
            let clean = item.timestamp.replace(' IST', '').replace(' ', 'T').trim();
            if (clean.includes('T') && !clean.includes('+') && !clean.includes('Z')) {
              clean += '+05:30';
            }
            const mailDate = new Date(clean);
            const mailDateStr = mailDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
            return mailDateStr === todayStr;
          } catch (e) {
            return false;
          }
        });

        this.yesterdayMails = sortedStream.filter(item => {
          if (!item.timestamp) return false;
          try {
            let clean = item.timestamp.replace(' IST', '').replace(' ', 'T').trim();
            if (clean.includes('T') && !clean.includes('+') && !clean.includes('Z')) {
              clean += '+05:30';
            }
            const mailDate = new Date(clean);
            const mailDateStr = mailDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
            return mailDateStr === yesterdayStr;
          } catch (e) {
            return false;
          }
        });

        this.$nextTick(() => this.triggerLucide());
      } catch (e) {
        this.showToast('Error loading overview data: ' + e.message, 'error');
      }
    },

    loadUnmatchedIntoSimulator(item) {
      let body = item.original_body || '';
      if (body.includes('FULL EMAIL BODY:\n')) {
        body = body.split('FULL EMAIL BODY:\n')[1] || body;
      }
      this.simText = body;
      this.simEmail = item.customer_email || '';
      this.simChannel = item.source || 'email';
      this.switchTab('simulator');
      this.showToast('Enquiry loaded into Ingestion Simulator. Ready to process!', 'info');
    },
    
    async fetchServiceStatus() {
      try {
        const [statusRes, logsRes] = await Promise.all([
          this.safeFetch(`/api/service/status?tenant_id=${this.selectedTenant}`),
          this.safeFetch(`/api/service/logs?tenant_id=${this.selectedTenant}`)
        ]);
        const statusData = await statusRes.json();
        const logsData = await logsRes.json();
        this.logs = logsData.logs || [];
      } catch (e) {}
    },
    
    async fetchLogsOnly() {
      try {
        const res = await this.safeFetch(`/api/service/logs?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        this.logs = data.logs || [];
      } catch (e) {}
    },

    // Tab 2: Live Simulator APIs
    async runPipeline() {
      if (!this.simText.trim()) {
        this.showToast('Please enter enquiry request text.', 'error');
        return;
      }
      this.simLoading = true;
      this.simMetrics = null;
      try {
        const res = await this.safeFetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: this.simText,
            engine: this.simEngine,
            customer_email: this.simEmail,
            input_type: this.simChannel,
            tenant_id: this.selectedTenant
          })
        });
        const data = await res.json();
        this.simMetrics = data.metrics;
        this.simLines = data.matched_lines || [];
        this.simDiscountPct = data.discount_pct || 0.0;
        this.simCustomerName = data.customer_name || 'Walk-in Retail Client';
        this.simInvoiceId = 'TRF-' + Math.floor(100000 + Math.random() * 900000);
        
        // Reset chat
        this.simShowNegPanel = false;
        this.simChatHistory = [];
        
        this.showToast('Pipeline ingestion executed successfully!', 'success');
        
        this.$nextTick(() => {
          this.drawQrCanvas();
          this.triggerLucide();
        });
      } catch (e) {
        this.showToast('Pipeline execution error: ' + e.message, 'error');
      } finally {
        this.simLoading = false;
      }
    },
    
    drawQrCanvas() {
      const canvas = document.getElementById('simQrCanvas');
      if (canvas && this.simMetrics) {
        const ctx = canvas.getContext('2d');
        canvas.width = 110; canvas.height = 110;
        ctx.fillStyle = '#0F1521';
        ctx.fillRect(0, 0, 110, 110);
        ctx.fillStyle = '#6366F1';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("PAY VIA UPI", 55, 45);
        const rawSub = this.simLines.reduce((acc, l) => acc + (l.matched_sku_id !== 'UNKNOWN' ? (l.unit_price || 0) * (l.quantity || 0) : 0), 0);
        const grand = (rawSub * (1 - this.simDiscountPct)) * 1.18;
        ctx.fillText(this.fmt(grand), 55, 65);
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 3;
        ctx.strokeRect(6, 6, 98, 98);
      }
    },
    
    openHitlModalFromSim() {
      const idx = this.simLines.findIndex(l => l.confidence < 80 && l.matched_sku_id !== 'UNKNOWN');
      if (idx !== -1) {
        this.openHitl(idx, this.simLines[idx]);
      }
    },
    
    openHitl(index, line) {
      this.hitlIndex = index;
      this.hitlOptions = line.alternatives || [];
      this.showHitl = true;
    },
    
    async selectHitlOverride(skuId) {
      if (this.hitlIndex === null) return;
      const targetLine = this.simLines[this.hitlIndex];
      try {
        const res = await this.safeFetch('/api/hitl/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: targetLine.original_query,
            sku_id: skuId,
            tenant_id: this.selectedTenant
          })
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          this.showToast('HITL override successfully mapped!', 'success');
          const selectedOpt = this.hitlOptions.find(o => o.sku_id === skuId);
          
          // Update local array line
          this.simLines[this.hitlIndex] = {
            ...targetLine,
            matched_sku_id: skuId,
            matched_sku_name: selectedOpt.sku_name,
            confidence: 100,
            unit_price: selectedOpt.price,
            stock_avail: selectedOpt.stock
          };
          this.showHitl = false;
          this.drawQrCanvas();
        }
      } catch (e) {
        this.showToast('Error saving override synonym: ' + e.message, 'error');
      }
    },
    
    async generatePdf() {
      if (!this.simLines.length) return;
      try {
        const res = await this.safeFetch('/api/quote/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matched_lines: this.simLines,
            discount_pct: this.simDiscountPct,
            customer_name: this.simCustomerName,
            invoice_id: this.simInvoiceId,
            tenant_id: this.selectedTenant,
            source: this.simChannel,
            original_text: this.simText
          })
        });
        const data = await res.json();
        if (data.pdf_url) {
          this.showToast('PDF quote sheet compiled successfully!', 'success');
          window.open(data.pdf_url, '_blank');
          this.refreshBadges();
        }
      } catch (e) {
        this.showToast('Error generating PDF report: ' + e.message, 'error');
      }
    },
    
    async sendSimNegMsg() {
      if (!this.simChatInput.trim()) return;
      const userMsg = this.simChatInput;
      this.simChatHistory.push({ role: 'user', message: userMsg });
      this.simChatInput = '';
      this.simNegLoading = true;
      
      try {
        const res = await this.safeFetch('/api/negotiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_message: userMsg,
            requested_discount: parseFloat(this.simTargetDiscount) / 100.0,
            chat_history: this.simChatHistory,
            tenant_id: this.selectedTenant
          })
        });
        const data = await res.json();
        this.simChatHistory.push({ role: 'assistant', message: data.reply });
        this.simNegStatus = data.status;
        if (data.recommended_discount !== undefined) {
          this.simDiscountPct = data.recommended_discount;
          this.drawQrCanvas();
        }
      } catch (e) {
        this.showToast('Negotiation failure: ' + e.message, 'error');
      } finally {
        this.simNegLoading = false;
      }
    },
    
    // Computed Simulator subtotals
    get simSubtotal() {
      return this.simLines.reduce((acc, l) => acc + (l.matched_sku_id !== 'UNKNOWN' ? (l.unit_price || 0) * (l.quantity || 0) : 0), 0);
    },
    
    // Tab 3: Deficits APIs
    async loadDeficits() {
      this.loadingDeficits = true;
      try {
        const [defRes, lowRes] = await Promise.all([
          this.safeFetch(`/api/deficits?tenant_id=${this.selectedTenant}`),
          this.safeFetch(`/api/inventory/low-stock?tenant_id=${this.selectedTenant}&threshold=5`)
        ]);
        const defData = await defRes.json();
        const lowData = await lowRes.json();
        
        this.deficits = defData.deficits || [];
        this.defLowStock = lowData.items || [];
        
        this.$nextTick(() => this.triggerLucide());
      } catch (e) {
        this.showToast('Error loading deficits: ' + e.message, 'error');
      } finally {
        this.loadingDeficits = false;
      }
    },
    
    openResolveDeficit(deficit) {
      this.selectedDeficit = deficit;
      this.deficitNewStock = deficit.requested_qty;
      this.showResolveDeficit = true;
    },
    
    async handleResolveDeficit() {
      if (!this.selectedDeficit) return;
      this.resolvingDeficit = true;
      try {
        const res = await this.safeFetch('/api/deficits/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deficit_id: this.selectedDeficit.id,
            new_stock: parseInt(this.deficitNewStock),
            tenant_id: this.selectedTenant
          })
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          this.showToast('Deficit resolved. PDF updated and sent!', 'success');
        } else {
          this.showToast(data.message || 'Partial resolution registered.', 'info');
        }
        this.showResolveDeficit = false;
        this.loadDeficits();
        this.refreshBadges();
      } catch (e) {
        this.showToast('Resolution error: ' + e.message, 'error');
      } finally {
        this.resolvingDeficit = false;
      }
    },

    // Tab 4: Negotiations APIs
    async loadNegotiations() {
      this.loadingNegs = true;
      try {
        const res = await this.safeFetch(`/api/negotiations/escalated?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        this.negotiationsList = data.negotiations || [];
        
        this.$nextTick(() => this.triggerLucide());
      } catch (e) {
        this.showToast('Error loading negotiations: ' + e.message, 'error');
      } finally {
        this.loadingNegs = false;
      }
    },
    
    senderMeta(sender) {
      // Maps a chat-log sender to a display role + an AI-vs-human origin flag.
      const s = (sender || '').toString().trim().toLowerCase();
      if (s === 'bot' || s === 'ai' || s === 'system' || s === 'assistant') {
        return { role: 'AI Assistant', flag: 'AI Generated', flagCls: 'badge purple', labelCls: 'text-indigo-400' };
      }
      const staff = ['operator', 'human', 'agent', 'staff', 'admin', 'sales'];
      if (staff.includes(s)) {
        return { role: 'Operator', flag: 'Human Generated', flagCls: 'badge green', labelCls: 'text-emerald-400' };
      }
      const role = (s === 'customer' || s === '') ? 'Customer' : sender;
      return { role: role, flag: 'Human', flagCls: 'badge green', labelCls: 'text-emerald-400' };
    },

    streamOrigin(status) {
      // AI-vs-human origin flag for a sent reply shown on the pipeline cards.
      if (status === 'Auto-Filtered') return null;
      const human = ['NEGOTIATION_APPROVED', 'NEGOTIATION_REJECTED', 'NEGOTIATION_RESOLVED'];
      if (human.includes(status)) return { flag: 'Human Generated', cls: 'badge green' };
      return { flag: 'AI Generated', cls: 'badge purple' };
    },

    async openChatHistory(invoiceId, custName) {
      // A "CUSTOMER_REPLIED:QTN-xxxx" card id maps to the underlying
      // quotation thread — strip the prefix so the timeline (and View PDF) resolve.
      if (invoiceId && invoiceId.startsWith('CUSTOMER_REPLIED:')) {
        invoiceId = invoiceId.split(':').slice(1).join(':');
      }
      this.chatInvoiceId = invoiceId;
      this.chatCustName = custName;
      this.showChatModal = true;
      this.loadingChat = true;
      this.chatLogs = [];
      this.chatItems = [];
      
      try {
        // Bug 10 fix: Use /api/quote/details/ as primary source (more reliable, direct per-QTN endpoint)
        const detailsRes = await this.safeFetch(`/api/quote/details/${invoiceId}?tenant_id=${this.selectedTenant}`);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          this.chatLogs = detailsData.logs || [];
          this.chatItems = detailsData.items || [];
        }
        // If direct endpoint returned nothing, try bulk report data as fallback
        if (this.chatLogs.length === 0) {
          const res = await this.safeFetch(`/api/report/data?tenant_id=${this.selectedTenant}`);
          if (res.ok) {
            const data = await res.json();
            const logs = (data.logs || {})[invoiceId] || [];
            const items = (data.items || {})[invoiceId] || [];
            if (logs.length > 0) {
              this.chatLogs = logs;
              this.chatItems = items;
            }
          }
        }
      } catch (e) {
        this.showToast('Error loading quote history details: ' + e.message, 'error');
      } finally {
        this.loadingChat = false;
      }
    },

    
    async openResolveNeg(invoiceId, custName, subtotal, currentDiscount) {
      this.selectedInvoiceId = invoiceId;
      this.selectedCustName = custName;
      this.selectedSubtotal = subtotal;
      this.discountInput = Math.round(currentDiscount * 100);
      this.discountMode = 'order';
      this.targetSkuId = '';
      this.itemDiscountValue = 0;
      this.selectedItems = [];
      this.showResolveNeg = true;
      
      // Load items
      try {
        const res = await this.safeFetch(`/api/quote/details/${invoiceId}?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        if (data.items) {
          this.selectedItems = data.items;
          if (data.items.length > 0) {
            this.targetSkuId = data.items[0].sku_id;
          }
        }
      } catch (e) {}
    },
    
    getResolutionPreviewDiscount() {
      if (this.discountMode === 'order') {
        return this.fmt(this.selectedSubtotal * (parseFloat(this.discountInput) / 100.0));
      } else if (this.discountMode === 'item_pct') {
        const target = this.selectedItems.find(i => i.sku_id === this.targetSkuId);
        if (!target) return '₹0.00';
        const lineVal = (target.unit_price || 0) * (target.quantity || 0);
        return this.fmt(lineVal * (parseFloat(this.discountInput) / 100.0));
      } else {
        const target = this.selectedItems.find(i => i.sku_id === this.targetSkuId);
        if (!target) return '₹0.00';
        const diff = (target.unit_price || 0) - parseFloat(this.discountInput);
        return this.fmt(diff * (target.quantity || 0));
      }
    },
    
    getResolutionPreviewGrand() {
      let discountAmt = 0;
      if (this.discountMode === 'order') {
        discountAmt = this.selectedSubtotal * (parseFloat(this.discountInput) / 100.0);
      } else if (this.discountMode === 'item_pct') {
        const target = this.selectedItems.find(i => i.sku_id === this.targetSkuId);
        if (target) {
          const lineVal = (target.unit_price || 0) * (target.quantity || 0);
          discountAmt = lineVal * (parseFloat(this.discountInput) / 100.0);
        }
      } else {
        const target = this.selectedItems.find(i => i.sku_id === this.targetSkuId);
        if (target) {
          const diff = (target.unit_price || 0) - parseFloat(this.discountInput);
          discountAmt = diff * (target.quantity || 0);
        }
      }
      const net = this.selectedSubtotal - discountAmt;
      return this.fmt(net * 1.18);
    },
    
    async submitResolution(action) {
      this.submittingResolution = true;
      try {
        const res = await this.safeFetch('/api/negotiations/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice_id: this.selectedInvoiceId,
            action,
            override_discount_pct: parseFloat(this.discountInput) / 100.0,
            tenant_id: this.selectedTenant,
            item_discount_mode: this.discountMode,
            target_sku_id: this.targetSkuId,
            item_discount_value: parseFloat(this.itemDiscountValue)
          })
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          const icon = action === 'approve' ? '✅' : '✗';
          this.showToast(`${icon} ${data.message}`, 'success');
        }
        this.showResolveNeg = false;
        this.loadNegotiations();
        this.refreshBadges();
      } catch (e) {
        this.showToast('Resolution error: ' + e.message, 'error');
      } finally {
        this.submittingResolution = false;
      }
    },

    // Tab 5: Quotation repository APIs
    async loadQuotes() {
      try {
        const res = await this.safeFetch(`/api/report/data?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        this.quotes = data.quotations || [];
        this.handleGlobalSearch();
        
        this.$nextTick(() => this.triggerLucide());
      } catch (e) {}
    },
    
    async openQuoteComparison(invoiceId, custName) {
      this.openChatHistory(invoiceId, custName);
    },

    // Tab 6: Catalog Inventory APIs
    async loadCatalog() {
      this.loadingInventory = true;
      try {
        const res = await this.safeFetch(`/api/inventory/catalog?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        this.catalog = data.items || [];
        this.filterCatalog();
        
        this.$nextTick(() => this.triggerLucide());
      } catch (e) {
        this.showToast('Error loading catalog: ' + e.message, 'error');
      } finally {
        this.loadingInventory = false;
      }
    },
    
    filterCatalog() {
      const query = this.inventorySearch.toLowerCase().trim();
      const cat = this.inventoryCategory;
      const st = this.inventoryStatus;
      this.filteredCatalog = this.catalog.filter(item => {
        const matchesQuery = !query ||
          (item.sku_id || '').toLowerCase().includes(query) ||
          (item.sku_name || '').toLowerCase().includes(query) ||
          (item.category || '').toLowerCase().includes(query);
        const matchesCat = cat === 'all' || item.category === cat;
        const stock = item.stock || 0;
        const status = stock === 0 ? 'out' : (stock <= 5 ? 'low' : 'in');
        const matchesStatus = st === 'all' || status === st;
        return matchesQuery && matchesCat && matchesStatus;
      });
    },
    
    openStockModal(skuId, skuName, stock) {
      this.selectedSkuId = skuId;
      this.selectedSkuName = skuName;
      this.newStockLevel = stock;
      this.showStockModal = true;
    },
    
    async updateStock() {
      this.updatingStock = true;
      try {
        const res = await this.safeFetch('/api/inventory/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku_id: this.selectedSkuId,
            new_stock: parseInt(this.newStockLevel),
            tenant_id: this.selectedTenant
          })
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          this.showToast('Stock level updated successfully!', 'success');
          this.showStockModal = false;
          this.loadCatalog();
          this.loadLogs();
          this.refreshBadges();
        }
      } catch (e) {
        this.showToast('Error updating stock level: ' + e.message, 'error');
      } finally {
        this.updatingStock = false;
      }
    },

    // Tab 7: Stock logs
    async loadLogs() {
      try {
        const res = await this.safeFetch(`/api/inventory/logs?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        this.stockLogs = data.logs || [];
      } catch (e) {}
    },
    
    async loadSettings() {
      try {
        const res = await this.safeFetch(`/api/settings?tenant_id=${this.selectedTenant}`);
        this.settings = await res.json();
      } catch (e) {
        this.showToast('Error loading settings: ' + e.message, 'error');
      }
    },

    async saveSettings() {
      try {
        const res = await this.safeFetch(`/api/settings/update?tenant_id=${this.selectedTenant}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.settings)
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.showToast('System settings updated successfully!', 'success');
        } else {
          this.showToast('Failed to save settings: ' + data.detail, 'error');
        }
      } catch (e) {
        this.showToast('Error saving settings: ' + e.message, 'error');
      }
    },

    async loadAnalytics() {
      try {
        const res = await this.safeFetch(`/api/analytics/summary?date_filter=${this.analyticsDateFilter}&tenant_id=${this.selectedTenant}`);
        this.analyticsData = await res.json();
        this.$nextTick(() => this.triggerLucide());
      } catch (e) {
        this.showToast('Error loading analytics: ' + e.message, 'error');
      }
    },

    async loadCustomerHistory() {
      if (!this.custHistoryEmail || !this.custHistoryEmail.trim()) {
        this.showToast('Please enter a valid customer email', 'warning');
        return;
      }
      this.loadingCustHistory = true;
      try {
        const res = await this.safeFetch(`/api/analytics/customer_history?email=${encodeURIComponent(this.custHistoryEmail.trim())}&tenant_id=${this.selectedTenant}`);
        this.custHistoryResult = await res.json();
      } catch (e) {
        this.showToast('Error loading customer history: ' + e.message, 'error');
      } finally {
        this.loadingCustHistory = false;
      }
    },

    async approveManualQuote(invoiceId) {
      try {
        const res = await this.safeFetch(`/api/quote/approve_and_send?tenant_id=${this.selectedTenant}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invoiceId })
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.showToast(`Quotation ${invoiceId} approved and sent successfully!`, 'success');
          this.fetchOverviewData();
        } else {
          this.showToast('Failed to approve quotation: ' + data.detail, 'error');
        }
      } catch (e) {
        this.showToast('Error approving quotation: ' + e.message, 'error');
      }
    },

    async openUnmatchedModal(item) {
      this.selectedUnmatched = item;
      this.unmatchedReplyText = '';
      
      // Extract subject if present in original_body
      let subject = 'Quotation for items';
      if (item.original_body) {
        const subLine = item.original_body.split('\n').find(l => l.startsWith('Subject: '));
        if (subLine) {
          subject = subLine.replace('Subject: ', '').trim();
        }
      }
      if (subject && !subject.toUpperCase().startsWith('RE:')) {
        subject = 'RE: ' + subject;
      }
      
      this.unmatchedSubject = subject;
      this.unmatchedHistoryLogs = [];
      this.showUnmatchedModal = true;
      this.loadingUnmatchedHistory = true;
      try {
        const email = item.customer_email || '';
        if (email) {
          const res = await this.safeFetch(`/api/analytics/customer_history?email=${encodeURIComponent(email)}&tenant_id=${this.selectedTenant}`);
          if (res.ok) {
            const data = await res.json();
            this.unmatchedHistoryLogs = data.timeline || [];
          }
        }
      } catch (e) {
        console.warn('Failed to load customer history logs:', e);
      } finally {
        this.loadingUnmatchedHistory = false;
      }
    },

    getThreadedEnquiry(body, defaultName, defaultEmail) {
      if (!body) return [];
      
      let cleanBody = body;
      let subject = '';
      let sender = defaultName || '';
      let email = defaultEmail || '';
      let attachments = '';
      
      const lines = body.split('\n');
      const messageLines = [];
      for (let line of lines) {
        if (line.startsWith('Subject: ')) {
          subject = line.replace('Subject: ', '');
        } else if (line.startsWith('Sender: ')) {
          const parts = line.replace('Sender: ', '');
          sender = parts.split('<')[0].trim();
          const emailMatch = parts.match(/<([^>]+)>/);
          if (emailMatch) email = emailMatch[1];
        } else if (line.startsWith('Attachments: ')) {
          attachments = line.replace('Attachments: ', '');
        } else {
          messageLines.push(line);
        }
      }
      
      const text = messageLines.join('\n').trim();
      
      // Regex to match "On ... wrote:" patterns
      const regex = /On\s+[^:]+?\bwrote:/gi;
      const matches = [...text.matchAll(regex)];
      
      if (matches.length === 0) {
        return [{
          sender: sender || 'Customer',
          email: email || '',
          date: 'Latest',
          message: text,
          subject: subject,
          attachments: attachments
        }];
      }
      
      const blocks = [];
      
      // Add first block
      const firstText = text.substring(0, matches[0].index).trim();
      if (firstText) {
        blocks.push({
          sender: sender || 'Customer',
          email: email || '',
          date: 'Latest',
          message: firstText,
          subject: subject,
          attachments: attachments
        });
      }
      
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const matchText = match[0];
        const startIndex = match.index + matchText.length;
        const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
        const blockText = text.substring(startIndex, endIndex).trim();
        
        let blockSender = 'Customer';
        let blockEmail = '';
        let blockDate = '';
        
        try {
          const emailMatch = matchText.match(/<([^>]+)>/);
          blockEmail = emailMatch ? emailMatch[1] : '';
          
          let namePart = matchText.replace(/On\s+/i, '').split('<')[0].trim();
          const nameParts = namePart.split(/\sat\s\d+:\d+\s*(?:AM|PM|am|pm)?/gi);
          if (nameParts.length > 1) {
            namePart = nameParts[1].trim();
          } else {
            namePart = namePart.replace(/^[A-Za-z]{3},\s+[A-Za-z]{3}\s+\d+,\s+\d{4}\s+/g, '').trim();
          }
          blockSender = namePart || blockEmail || 'Customer';
          
          const dateMatch = matchText.match(/On\s+([^,]+,\s+[^<]+?)\s+(?:[A-Za-z0-9\s]+<|$)/i);
          if (dateMatch) {
            blockDate = dateMatch[1].split('<')[0].replace(' wrote:', '').trim();
          }
        } catch(e) {
          console.warn(e);
        }
        
        blocks.push({
          sender: blockSender,
          email: blockEmail,
          date: blockDate || 'Prior',
          message: blockText
        });
      }
      
      return blocks;
    },

    async submitManualReply() {
      if (!this.unmatchedReplyText || !this.unmatchedReplyText.trim()) {
        this.showToast('Please type your reply message body before sending.', 'warning');
        return;
      }
      this.sendingManualReply = true;
      try {
        // The card can have .invoice_id or .id
        let refId = '';
        if (this.selectedUnmatched.id && String(this.selectedUnmatched.id).startsWith('UNMATCHED_')) {
          refId = this.selectedUnmatched.id;
        } else if (this.selectedUnmatched.invoice_id) {
          refId = this.selectedUnmatched.invoice_id;
        } else if (this.selectedUnmatched.id) {
          refId = 'UNMATCHED_' + this.selectedUnmatched.id;
        }

        const res = await this.safeFetch(`/api/manual/reply?tenant_id=${this.selectedTenant}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_email: this.selectedUnmatched.customer_email,
            customer_name: this.selectedUnmatched.customer_name || 'Customer',
            subject: this.unmatchedSubject || 'Reply to enquiry',
            reply_body: this.unmatchedReplyText,
            invoice_id: refId,
            tenant_id: this.selectedTenant
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.showToast('Manual email reply sent successfully and unmatched enquiry resolved!', 'success');
          this.showUnmatchedModal = false;
          this.fetchOverviewData();
        } else {
          this.showToast('Failed to send email reply: ' + (data.detail || 'unknown error'), 'error');
        }
      } catch (e) {
        this.showToast('Error sending manual email reply: ' + e.message, 'error');
      } finally {
        this.sendingManualReply = false;
      }
    },

    // ── Activity Log Methods ────────────────────────────────────────────
    async loadActivityLog() {
      try {
        const res = await this.safeFetch(`/api/activity/log?tenant_id=${this.selectedTenant}&limit=200`);
        const data = await res.json();
        this.activityLogs = data.logs || [];
        this.activityUptime = data.uptime_seconds || 0;
        this.activityServerStart = data.server_start_time || '';
        // Current time from server (IST) — also ticked by the 1s interval
        if (data.current_time && !this.activityCurrentTime) {
          this.activityCurrentTime = data.current_time;
        }
        this.$nextTick(() => this.triggerLucide());
      } catch (e) {
        console.warn('Activity log fetch failed:', e);
      }
    },

    async handleActivityRowClick(entry) {
      if (!entry) return;
      const invoiceId = entry.invoice_id || '';
      const custName = entry.customer_name || 'Customer';
      const custEmail = entry.customer_email || '';
      
      this.showToast(`Loading details for ${invoiceId || custName}...`);

      // Case 1: Unmatched item
      if (invoiceId && invoiceId.startsWith('UNMATCHED_')) {
        const uIdStr = invoiceId.replace('UNMATCHED_', '');
        const item = this.pendingUnmatched.find(i => String(i.id) === uIdStr || String(i.id) === invoiceId);
        if (item) {
          this.openUnmatchedModal(item);
          return;
        }
        
        const mockItem = {
          id: parseInt(uIdStr) || uIdStr,
          customer_name: custName,
          customer_email: custEmail,
          original_body: entry.description,
          created_at: entry.timestamp
        };
        this.openUnmatchedModal(mockItem);
        return;
      }
      
      // Case 2: Stock deficit item
      if (entry.event_type === 'DEFICIT_RAISED' || (invoiceId && this.pendingDeficits.some(d => d.invoice_id === invoiceId))) {
        const item = this.pendingDeficits.find(d => d.invoice_id === invoiceId);
        if (item) {
          this.openResolveDeficit(item);
          return;
        }
      }

      // Case 3: Escalated Negotiation Review
      if (entry.event_type === 'NEGOTIATION_TRIGGERED' || (invoiceId && this.pendingReviews.some(r => r.invoice_id === invoiceId))) {
        const item = this.pendingReviews.find(r => r.invoice_id === invoiceId);
        if (item) {
          this.openResolveNeg(item.invoice_id, item.customer_name, item.subtotal, item.discount_pct || 0);
          return;
        }
      }
      
      // Case 4: Any standard quotation ID (starts with QTN-)
      if (invoiceId && invoiceId.toUpperCase().startsWith('QTN-')) {
        this.openChatHistory(invoiceId, custName);
        return;
      }
      
      // Case 5: No invoice ID but we have customer email
      if (custEmail) {
        const unmatchedItem = this.pendingUnmatched.find(i => i.customer_email === custEmail);
        if (unmatchedItem) {
          this.openUnmatchedModal(unmatchedItem);
          return;
        }
        this.openChatHistory(custEmail, custName);
        return;
      }
    },

    async loadRawLog() {
      try {
        const res = await this.safeFetch(`/api/service/logs?tenant_id=${this.selectedTenant}&limit=200`);
        const data = await res.json();
        this.rawLogLines = (data.logs || []).reverse(); // newest first
        this.$nextTick(() => {
          const pre = document.getElementById('raw-log-pre');
          if (pre) pre.scrollTop = 0;
        });
      } catch (e) {
        console.warn('Raw log fetch failed:', e);
      }
    },

    formatUptime(seconds) {
      if (!seconds || seconds <= 0) return '0h 0m 0s';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h}h ${m}m ${s}s`;
    },

    formatActivityDate(ts) {
      if (!ts) return '—';
      try {
        return ts.split(' ')[0] || ts;
      } catch (e) { return ts; }
    },

    formatActivityTime(ts) {
      if (!ts) return '—';
      try {
        const parts = ts.replace(' IST','').split(' ');
        return parts[1] ? parts[1].substr(0,8) : ts;
      } catch (e) { return ts; }
    },

    formatEventLabel(evtType) {
      const labels = {
        'EMAIL_RECEIVED':        'Email Received',
        'QUOTE_GENERATED':       'Quote Generated',
        'CUSTOMER_REPLIED':      'Customer Replied',
        'NEGOTIATION_TRIGGERED': 'Negotiation',
        'DEFICIT_RAISED':        'Deficit Raised',
        'EMAIL_SENT':            'Email Sent',
        'HUMAN_AGENT_REQUESTED': 'Human Requested',
        'UNMATCHED_ENQUIRY':     'Unmatched',
        'PENDING_REVIEW':        'Pending Review',
        'ERROR':                 'Error'
      };
      return labels[evtType] || (evtType || 'Event').replace(/_/g,' ');
    },

    getEventBadgeClass(evtType) {
      const map = {
        'EMAIL_RECEIVED':        'badge-email-received',
        'QUOTE_GENERATED':       'badge-quote-generated',
        'CUSTOMER_REPLIED':      'badge-customer-replied',
        'NEGOTIATION_TRIGGERED': 'badge-negotiation',
        'DEFICIT_RAISED':        'badge-deficit',
        'EMAIL_SENT':            'badge-email-sent',
        'HUMAN_AGENT_REQUESTED': 'badge-human',
        'UNMATCHED_ENQUIRY':     'badge-unmatched',
        'PENDING_REVIEW':        'badge-unmatched',
        'ERROR':                 'badge-error'
      };
      return map[evtType] || 'badge-default';
    },

    getActivityRowClass(evtType) {
      if (evtType === 'ERROR') return 'row-error';
      if (evtType === 'CUSTOMER_REPLIED') return 'row-reply';
      if (evtType === 'DEFICIT_RAISED') return 'row-deficit';
      return '';
    },

    getRawLineClass(line) {
      const l = (line || '').toLowerCase();
      if (l.includes('error') || l.includes('traceback') || l.includes('exception')) return 'raw-line-error';
      if (l.includes('warning') || l.includes('warn') || l.includes('[!]')) return 'raw-line-warn';
      if (l.includes('success') || l.includes('sent') || l.includes('[ok]') || l.includes('passed')) return 'raw-line-success';
      if (l.includes('poller') || l.includes('info') || l.includes('loaded')) return 'raw-line-info';
      return 'raw-line-default';
    },

    get filteredActivityLogs() {
      let logs = this.activityLogs || [];
      if (this.activityFilter) {
        logs = logs.filter(e => e.event_type === this.activityFilter);
      }
      const query = (this.activitySearch || this.invoiceFilter).toLowerCase().trim();
      if (!query) return logs;
      return logs.filter(e => 
        (e.customer_name || '').toLowerCase().includes(query) ||
        (e.customer_email || '').toLowerCase().includes(query) ||
        (e.invoice_id || '').toLowerCase().includes(query) ||
        (e.description || '').toLowerCase().includes(query) ||
        (e.event_type || '').toLowerCase().includes(query)
      );
    },

    // ── Export Report Helpers ────────────────────────────────────────────────
    executeExport(format, title, filename, headers, rows) {
      if (format === 'pdf') {
        this.exportToPdf(title, headers, rows);
      } else {
        this.exportToCsv(filename + (format === 'xlsx' ? '_excel.csv' : '.csv'), headers, rows);
      }
    },
    
    exportToCsv(filename, headers, rows) {
      const escape = val => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          str = `"${str}"`;
        }
        return str;
      };
      
      const csvContent = "\uFEFF" + [
        headers.map(escape).join(','),
        ...rows.map(row => row.map(escape).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    exportToPdf(title, headers, rows) {
      const printWindow = window.open('', '_blank');
      const html = `
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
              h1 { font-size: 20px; margin-bottom: 5px; border-bottom: 2px solid #b08a4a; padding-bottom: 8px; color: #111; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
              th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
              th { background-color: #f7f7f7; font-weight: bold; color: #111; }
              tr:nth-child(even) { background-color: #fafafa; }
              .footer { margin-top: 40px; font-size: 10px; color: #777; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p style="font-size: 11px; color: #666; margin-top: 5px;">Report Generated: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${rows.map(row => `<tr>${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
            <div class="footer">
              Trofeo Hardware Admin Command Center &bull; Automated Operations Report
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    },

    exportStageWise(format) {
      const headers = ['Stage', 'Invoice ID', 'Customer Name', 'Customer Email', 'Description/Details', 'Timestamp'];
      const rows = [];
      
      this.getFilteredList(this.newMails).forEach(m => {
        rows.push(['New Mail', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', m.description || '—', m.timestamp || '—']);
      });
      this.getFilteredList(this.respondedMails).forEach(m => {
        rows.push(['Responded', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', m.status || '—', m.timestamp || '—']);
      });
      this.getFilteredList(this.repliedMails).forEach(m => {
        rows.push(['Reply (Email)', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', 'Customer Replied', m.timestamp || '—']);
      });
      this.getFilteredList(this.negotiations).forEach(m => {
        rows.push(['Reply (Negotiation)', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', `Requested: ${Math.round(m.discount_pct*100)}%`, m.created_at || '—']);
      });
      this.getFilteredList(this.rejectedMails).forEach(m => {
        rows.push(['Rejected', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', 'Quotation Rejected', m.created_at || '—']);
      });
      this.getFilteredList(this.pendingDeficits).forEach(m => {
        rows.push(['Pending (Deficit)', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', `Shortage: ${m.deficit_qty} units of ${m.sku_name}`, m.created_at || '—']);
      });
      this.getFilteredList(this.pendingReviews).forEach(m => {
        rows.push(['Pending (Draft Review)', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', `Draft Amount: ₹${m.grand_total}`, m.created_at || '—']);
      });
      this.getFilteredList(this.pendingUnmatched).forEach(m => {
        rows.push(['Pending (Unmatched)', '—', m.customer_name || '—', m.customer_email || '—', m.original_body || '—', m.created_at || '—']);
      });

      const title = 'Stage-Wise Pipeline Report';
      const filename = 'stage_wise_pipeline_report';
      this.executeExport(format, title, filename, headers, rows);
    },

    exportDispatcher(format) {
      const headers = ['Metric', 'Count / Value', 'Percentage'];
      const metrics = this.overviewData.metrics || {};
      const rows = [
        ['Auto-Responded Enquiries', metrics.auto_responded || 0, `${Math.round(metrics.tool_efficiency_pct || 0)}%`],
        ['Human Review Enquiries', metrics.pending_approval || 0, `${Math.round(metrics.human_intervention_pct || 0)}%`],
        ['Total Enquiries Received', metrics.total_received || 0, '100%']
      ];
      
      const title = 'Operations Dispatcher Split Report';
      const filename = 'operations_dispatcher_report';
      this.executeExport(format, title, filename, headers, rows);
    },

    exportFunnel(format) {
      const headers = ['Conversion Stage / Customer / Invoice', 'Details', 'Quote Count', 'Value (INR)'];
      const rows = [];
      
      const funnel = this.analyticsData.funnel || {};
      rows.push(['CONVERSION FUNNEL STAGES', '', '', '']);
      rows.push(['  Total Ingested Enquiries', 'All-time received', '', funnel.total_received || 0]);
      rows.push(['  Converted (Quotes Sent)', 'Successful quotes', '', funnel.converted || 0]);
      rows.push(['  Leakage (Unmatched/Rejected)', 'Lost opportunities', '', (funnel.unmatched || 0) + (funnel.rejected || 0)]);
      rows.push(['', '', '', '']);
      
      rows.push(['TOP CUSTOMERS', '', '', '']);
      (this.analyticsData.top_customers || []).forEach(c => {
        rows.push([`  ${c.customer_name}`, c.customer_email, c.quote_count, c.total_value]);
      });
      rows.push(['', '', '', '']);
      
      rows.push(['TOP QUOTATIONS', '', '', '']);
      (this.analyticsData.top_quotations || []).forEach(q => {
        rows.push([`  ${q.invoice_id}`, q.customer_name, q.created_at, q.grand_total]);
      });
      
      const title = 'Conversion Funnel & Sales Intelligence Report';
      const filename = 'conversion_funnel_report';
      this.executeExport(format, title, filename, headers, rows);
    },

    exportEnquiries(format, type) {
      const list = type === 'today' ? this.todayMails : this.yesterdayMails;
      const headers = ['Customer Name', 'Customer Email', 'Subject/Details', 'Timestamp', 'Status'];
      const rows = this.getFilteredList(list).map(m => [
        m.customer_name || '—',
        m.customer_email || '—',
        m.description || '—',
        m.timestamp || '—',
        m.status || '—'
      ]);
      
      const title = type === 'today' ? "Today's Enquiries Report" : "Yesterday's Enquiries Report";
      const filename = type === 'today' ? 'todays_enquiries_report' : 'yesterdays_enquiries_report';
      this.executeExport(format, title, filename, headers, rows);
    },

    exportInventoryReport(format) {
      const headers = ['SKU ID', 'Product Description', 'Category', 'Stock Level', 'Unit Price (INR)'];
      const rows = this.filteredCatalog.map(sku => [
        sku.sku_id || '—',
        sku.name || '—',
        sku.category || '—',
        sku.stock !== null && sku.stock !== undefined ? sku.stock : '0',
        sku.price !== null && sku.price !== undefined ? sku.price : '0.00'
      ]);
      
      const title = 'Inventory & Catalog Report';
      const filename = 'inventory_catalog_report';
      this.executeExport(format, title, filename, headers, rows);
    },

    exportActivityLogs(format) {
      const activeFilterLabel = this.activityFilter ? this.formatEventLabel(this.activityFilter) : 'All Events';
      const headers = ['Timestamp', 'Event Type', 'Customer Name', 'Customer Email', 'Invoice/Ref ID', 'Description'];
      const rows = this.filteredActivityLogs.map(e => [
        e.timestamp || '—',
        this.formatEventLabel(e.event_type) || e.event_type || '—',
        e.customer_name || '—',
        e.customer_email || '—',
        e.invoice_id || '—',
        e.description || '—'
      ]);
      
      const title = `System Activity Logs Report - ${activeFilterLabel}`;
      const filename = `activity_logs_${activeFilterLabel.toLowerCase().replace(/\s+/g, '_')}`;
      this.executeExport(format, title, filename, headers, rows);
    },

    exportRawLog(format) {
      if (format === 'txt') {
        const content = this.rawLogLines.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "email_listener.log");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        const printWindow = window.open('', '_blank');
        const html = `
          <html>
            <head>
              <title>Email Listener Logs (Raw)</title>
              <style>
                body { font-family: monospace; font-size: 10px; padding: 20px; color: #111; background: #fff; }
                h1 { font-family: sans-serif; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
                pre { white-space: pre-wrap; word-break: break-all; line-height: 1.4; }
              </style>
            </head>
            <body>
              <h1>Email Listener Logs (data/email_listener.log)</h1>
              <p style="font-family:sans-serif; font-size: 10px; color: #666; margin-top: -5px; margin-bottom: 15px;">Generated on: ${new Date().toLocaleString()}</p>
              <pre>${this.rawLogLines.join('\n')}</pre>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
      }
    },

    async fetchTrainingData() {
      this.loadingTraining = true;
      try {
        const res = await this.safeFetch(`/api/training/keywords?tenant_id=${this.selectedTenant}`);
        if (res.ok) {
          const data = await res.json();
          this.trainingKeywords = data.keywords || [];
          this.recentlyLearnedKeywords = data.recently_learned || [];
        }
      } catch (e) {
        console.error('Failed to fetch training data:', e);
      } finally {
        this.loadingTraining = false;
      }
    },

    async addKeyword() {
      const kw = this.newTrainingKeyword.trim().toLowerCase();
      if (!kw) return;
      try {
        const res = await this.safeFetch(`/api/training/keywords/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.showToast(`Keyword "${kw}" added successfully!`);
            this.newTrainingKeyword = '';
            this.fetchTrainingData();
          } else {
            this.showToast(`Keyword "${kw}" is already registered.`, 'warning');
          }
        }
      } catch (e) {
        this.showToast('Failed to add keyword: ' + e.message, 'error');
      }
    },

    async deleteKeyword(kw) {
      if (!confirm(`Are you sure you want to delete keyword "${kw}"?`)) return;
      try {
        const res = await this.safeFetch(`/api/training/keywords/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          this.showToast(`Keyword "${kw}" deleted!`);
          this.fetchTrainingData();
        }
      } catch (e) {
        this.showToast('Failed to delete keyword: ' + e.message, 'error');
      }
    },

    async resetKeywords() {
      if (!confirm('Are you sure you want to reset all training keywords to system defaults?')) return;
      try {
        const res = await this.safeFetch(`/api/training/keywords/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          this.showToast('Keywords reset to default settings!');
          this.fetchTrainingData();
        }
      } catch (e) {
        this.showToast('Failed to reset keywords: ' + e.message, 'error');
      }
    }
  };
}


// Helper function for ISO date strings converting
function logDateConverter(ts) {
  if (!ts) return '';
  try {
    let clean = ts.replace(' IST', '').replace(' ', 'T').trim();
    if (clean.includes('T') && !clean.includes('+') && !clean.includes('Z')) {
      clean += '+05:30';
    }
    const date = new Date(clean);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) { return ts; }
}
