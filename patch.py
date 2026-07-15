import re

with open('static/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add loading/error state variables
c = c.replace('overviewData: {},', 'overviewData: {},\n          loadingOverview: true,\n          overviewError: null,')

# 2. Update fetchOverviewData
old_fetch = '''          async fetchOverviewData() {
            try {
              const res = await this.safeFetch(`/api/overview/analytics?tenant_id=${this.selectedTenant}`);'''
new_fetch = '''          async fetchOverviewData() {
            this.loadingOverview = true;
            this.overviewError = null;
            try {
              const res = await this.safeFetch(`/api/overview/analytics?tenant_id=${this.selectedTenant}`);'''
c = c.replace(old_fetch, new_fetch)

old_catch = '''              this.$nextTick(() => lucide.createIcons());
            } catch (e) {
              this.showToast('Error loading overview data: ' + e.message, 'error');
            }
          },'''
new_catch = '''              this.$nextTick(() => lucide.createIcons());
            } catch (e) {
              this.overviewError = e.message;
              this.showToast('Error loading overview data: ' + e.message, 'error');
            } finally {
              this.loadingOverview = false;
            }
          },'''
c = c.replace(old_catch, new_catch)

# 3. Add loading and error states to Kanban Grid
old_grid = '''            <!-- Kanban Grid -->
            <div class="kanban-grid">'''

new_grid = '''            <!-- Kanban Grid Container -->
            <template x-if="loadingOverview">
              <div class="empty-state" style="padding:80px 20px; border:1px dashed var(--border); border-radius:var(--r-xl); margin-top:20px;">
                <div class="spinner" style="border-top-color:var(--accent); border-right-color:var(--accent); border-bottom-color:var(--accent); border-left-color:transparent; width:28px; height:28px; margin-bottom:16px;"></div>
                <h3 style="color:var(--text-1); font-weight:700;">Loading Pipeline Data...</h3>
                <p style="color:var(--text-3); font-size:12px;">Syncing with mail server and matching engine</p>
              </div>
            </template>
            <template x-if="!loadingOverview && overviewError">
              <div class="empty-state" style="padding:80px 20px; border:1px dashed var(--red); background:rgba(220,38,38,0.03); border-radius:var(--r-xl); margin-top:20px;">
                <i data-lucide="alert-triangle" style="width:32px; height:32px; color:var(--red); margin:0 auto 16px; display:block;"></i>
                <h3 style="color:var(--red); font-weight:700;">Connection Failed</h3>
                <p style="color:var(--text-2); font-size:12px; margin-bottom:16px;" x-text="overviewError"></p>
                <button @click="fetchOverviewData()" class="btn btn-primary btn-sm">Retry Connection</button>
              </div>
            </template>
            <div class="kanban-grid" x-show="!loadingOverview && !overviewError">'''
c = c.replace(old_grid, new_grid)

with open('static/index.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated fallbacks ->', c.count('loadingOverview'))
