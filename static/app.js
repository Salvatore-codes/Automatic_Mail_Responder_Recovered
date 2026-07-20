/* ── Hero Kinetic Typography + Ghost-Trail Cycling Quotes ── */
function heroQuotes() {
  return {
    greetingWords: [],
    quotes: [
      'Every enquiry handled is a deal one step closer.',
      'Precision in pricing, excellence in service.',
      'Automation works. You strategize.',
      'Your pipeline is live. Stay sharp.',
      'Speed meets accuracy — that\'s Trofeo.',
      'Every quote sent is a promise kept.',
      'Operational excellence, one email at a time.',
      'AI handles the volume. You own the vision.',
    ],
    quoteIdx: 0,
    quoteChanging: false,
    _quoteTimer: null,

    init() {
      // Build greeting words for kinetic reveal
      const h = new Date().getHours();
      const greeting = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', Operator';
      this.greetingWords = greeting.split(' ');

      // Start cycling quotes after initial delay
      setTimeout(() => this._cycleQuote(), 2000);
    },

    _cycleQuote() {
      this._quoteTimer = setInterval(() => {
        // Phase 1: fade out (add class)
        this.quoteChanging = true;
        setTimeout(() => {
          // Phase 2: swap text while invisible
          this.quoteIdx = (this.quoteIdx + 1) % this.quotes.length;
          // Phase 3: fade back in (remove class)
          setTimeout(() => {
            this.quoteChanging = false;
          }, 80);
        }, 450);
      }, 4000);
    },

    destroy() {
      if (this._quoteTimer) clearInterval(this._quoteTimer);
    }
  };
}

function dashboardApp() {
  return {
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'layout-dashboard', badge: null, badgeColor: 'blue', description: 'View executive operational analytics, service health status, and live email queues.' },
      { id: 'deficits', label: 'Deficits', icon: 'package', badge: 0, badgeColor: 'red', description: 'Manage raw material/item deficits and match alternatives for outstanding orders.' },
      { id: 'negotiations', label: 'Negotiations', icon: 'message-square-text', badge: 0, badgeColor: 'yellow', description: 'Review, counter-offer, or resolve discount requests escalated by the AI.' },
      { id: 'inventory', label: 'Full Inventory', icon: 'warehouse', badge: null, badgeColor: 'blue', description: 'View current stock levels, base prices, and catalog items.' },
      { id: 'pricing', label: 'Dynamic Pricing', icon: 'coins', badge: null, badgeColor: 'blue', description: 'Configure customer contract pricing and category-level discount tiers.' },
      { id: 'training', label: 'AI Training', icon: 'brain', badge: null, badgeColor: 'blue', description: 'Train and configure relevance keywords for automatic email classification.' },
      { id: 'verticals', label: 'AI Onboarding', icon: 'sparkles', badge: null, badgeColor: 'blue', description: 'Train and configure active vertical guidelines, industry rules, and tones using autonomous AI.' },
      { id: 'activity', label: 'Activity Log', icon: 'activity', badge: null, badgeColor: 'blue', description: 'Real-time event stream: every email received, quote generated, reply handled, and error logged with timestamps.' },
      { id: 'access', label: 'User Access', icon: 'shield-alert', badge: null, badgeColor: 'blue', description: 'Manage employee system access, roles, and pipeline seniority rights.' }
    ],
    
    activeTab: 'overview',
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    currentUserEmail: localStorage.getItem('currentUserEmail') || 'superadmin@trofeo.com',
    currentUser: { email: '', role: '', full_name: '' },
    selectedOperatorEmail: 'all',
    usersList: [],
    sharedInboxes: [],
    language: localStorage.getItem('language') || 'en',
    translations: {
      en: {
        'Language / மொழி': 'Language / மொழி',
        'Administrator': 'Administrator',
        'Operations': 'Operations',
        'Overview': 'Overview',
        'Deficits': 'Deficits',
        'Negotiations': 'Negotiations',
        'Full Inventory': 'Full Inventory',
        'Dynamic Pricing': 'Dynamic Pricing',
        'AI Training': 'AI Training',
        'AI Onboarding': 'AI Onboarding',
        'CRM Segments': 'CRM Segments',
        'Activity Log': 'Activity Log',
        'Search invoice, client, SKUâ€¦': 'Search invoice, client, SKUâ€¦',
        'Automatic': 'Automatic',
        'Manual': 'Manual',
        'Live': 'Live',
        'Services': 'Services',
        'Trading / Stocks': 'Trading / Stocks'
      },
      ta: {
        'Language / மொழி': 'மொழி (Language)',
        'Administrator': 'நிர்வாகி',
        'Operations': 'செயல்பாடுகள்',
        'Overview': 'கண்ணோட்டம்',
        'Deficits': 'பற்றாக்குறைகள்',
        'Negotiations': 'பேச்சுவார்த்தைகள்',
        'Full Inventory': 'சரக்கு இருப்பு',
        'Dynamic Pricing': 'விலை நிர்ணயம்',
        'AI Training': 'AI பயிற்சி',
        'AI Onboarding': 'AI சேர்க்கை',
        'CRM Segments': 'வாடிக்கையாளர் பிரிவுகள்',
        'Activity Log': 'செயல்பாட்டுப் பதிவு',
        'User Access': 'பயனர் அணுகல்',
        'User Access Control': 'பயனர் அணுகல் கட்டுப்பாடு',
        'Security & Operations': 'பாதுகாப்பு & செயல்பாடுகள்',
        'Active Policy': 'செயலில் உள்ள கொள்கை',
        'Authorized Personnel': 'அங்கீகரிக்கப்பட்ட பணியாளர்கள்',
        'Grant System Access': 'அணுகல் அனுமதி வழங்கு',
        'Access Level': 'அணுகல் நிலை',
        'Sales Operator (Restricted)': 'விற்பனை இயக்குநர் (வரம்புக்குட்பட்டது)',
        'Super Admin (Full Access)': 'சூப்பர் அட்மின் (முழு அணுகல்)',
        'Add Authorized User': 'பயனரைச் சேர்',
        'Password': 'கடவுச்சொல்',
        'Viewing': 'பார்ப்பது',
        'emails': 'மின்னஞ்சல்கள்',
        'Export': 'ஏற்றுமதி',
        'No enquiries recorded.': 'விசாரணைகள் எதுவும் பதிவு செய்யப்படவில்லை.',
        'Search invoice, client, SKU…': 'விலைப்பட்டியல், வாடிக்கையாளர், குறியீடு தேடுக...',
        'Automatic': 'தானியங்கி',
        'Manual': 'கைமுறை',
        'Live': 'நேரடி',
        'Services': 'சேவைகள்',
        'Trading / Stocks': 'வர்த்தகம் / பொருட்கள்',
        'Engine A (Local)': 'இன்ஜின் ஏ (உள்ளூர்)',
        'Engine B (AI)': 'இன்ஜின் பி (AI)',
        'Connect Outlook': 'அவுட்லுக்கை இணைக்கவும்',
        'Ivory & Ink': 'ஐவரி & இங்க்',
        'Midnight': 'நள்ளிரவு',
        'Navy Gold': 'நேவி கோல்டு',
        'Cyberpunk': 'சைபர்பங்க்',
        'Admin Control Panel': 'நிர்வாகக் கட்டுப்பாட்டு குழு',

        // ── Login / Signup Screen ──
        'Automatic Mail Responder': 'தானியங்கி மின்னஞ்சல் பதிலளிப்பி',
        'Sign in to your operator session': 'உங்கள் இயக்குநர் அமர்வில் உள்நுழையவும்',
        'Register your business and connect your support mailbox': 'உங்கள் வணிகத்தை பதிவு செய்து உதவி மின்னஞ்சலை இணைக்கவும்',
        'Sign In': 'உள்நுழை',
        'Sign Up': 'பதிவு செய்',
        'Operator Email': 'இயக்குநர் மின்னஞ்சல்',
        'Preset Profiles:': 'முன்னமைவு சுயவிவரங்கள்:',
        'Standard Operator': 'நிலையான இயக்குநர்',
        'Initialize Session': 'அமர்வை தொடங்கு',
        '1. Company Profile': '1. நிறுவன விவரம்',
        'Full Name': 'முழு பெயர்',
        'Access Role': 'அணுகல் பாத்திரம்',
        'Sales Operator': 'விற்பனை இயக்குநர்',
        'Business Name': 'வணிக பெயர்',
        'e.g. Apex Dental Solutions': 'எ.கா. Apex Dental Solutions',
        'Vertical / Industry': 'துறை / தொழில்',
        'e.g. Dental Care': 'எ.கா. பல் சிகிச்சை',
        'Business Model': 'வணிக மாதிரி',
        'Trading (Stocks)': 'வர்த்தகம் (பொருட்கள்)',
        'Website URL (Optional)': 'இணையதள இணைப்பு (விரும்பினால்)',
        'Company Profile Description (Optional)': 'நிறுவன விளக்கம் (விரும்பினால்)',
        'Brief details about what items you sell or services you offer to train the AI model...': 'AI மாதிரியை பயிற்சி செய்ய நீங்கள் விற்கும் பொருட்கள் அல்லது சேவைகளைப் பற்றிய சுருக்கமான விவரங்கள்...',
        '2. Mailbox Connection': '2. மின்னஞ்சல் இணைப்பு',
        'Login / Support Email': 'உள்நுழைவு / ஆதரவு மின்னஞ்சல்',
        'support@mycompany.com': 'support@mycompany.com',
        'Email App Password / Access Code': 'மின்னஞ்சல் செயலி கடவுச்சொல் / அணுகல் குறியீடு',
        '* For Gmail support boxes, generate a 16-character App Password under Google account security settings.': '* Gmail பயனர்களுக்கு: Google கணக்கு பாதுகாப்பு அமைப்புகளில் 16 எழுத்து App Password உருவாக்கவும்.',
        'Mail Provider Preset': 'மின்னஞ்சல் வழங்குநர்',
        'Register & Initialize Responder': 'பதிவு செய்து பதிலளிப்பியை தொடங்கு',
        'Instantiating Auto-Responder Systems...': 'தானியங்கி பதிலளிப்பி அமைக்கப்படுகிறது...',
        
        
        // Overview Tab Details
        'Operations Command Center': 'à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯� à®•à®Ÿà¯�à®Ÿà¯�à®ªà¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯� à®®à¯ˆà®¯à®®à¯�',
        'Good morning': 'à®•à®¾à®²à¯ˆ à®µà®£à®•à¯�à®•à®®à¯�',
        'Good afternoon': 'à®®à®¤à®¿à®¯ à®µà®£à®•à¯�à®•à®®à¯�',
        'Good evening': 'à®®à®¾à®²à¯ˆ à®µà®£à®•à¯�à®•à®®à¯�',
        'Good morning, Operator': 'à®•à®¾à®²à¯ˆ à®µà®£à®•à¯�à®•à®®à¯�, à®‡à®¯à®•à¯�à®•à¯�à®¨à®°à¯�',
        'Good afternoon, Operator': 'à®®à®¤à®¿à®¯ à®µà®£à®•à¯�à®•à®®à¯�, à®‡à®¯à®•à¯�à®•à¯�à®¨à®°à¯�',
        'Good evening, Operator': 'à®®à®¾à®²à¯ˆ à®µà®£à®•à¯�à®•à®®à¯�, à®‡à®¯à®•à¯�à®•à¯�à®¨à®°à¯�',
        'enquiries handled all-time': 'à®‡à®¤à¯�à®µà®°à¯ˆ à®•à¯ˆà®¯à®¾à®³à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®µà®¿à®šà®¾à®°à®£à¯ˆà®•à®³à¯�',
        'Automation Rate': 'à®¤à®¾à®©à®¿à®¯à®™à¯�à®•à®¿ à®µà¯€à®¤à®®à¯�',
        'Processed Enquiries': 'à®šà¯†à®¯à®²à®¾à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®µà®¿à®šà®¾à®°à®£à¯ˆà®•à®³à¯�',
        'Total emails ingested': 'à®®à¯Šà®¤à¯�à®¤à®®à¯� à®ªà¯†à®±à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®®à®¿à®©à¯�à®©à®žà¯�à®šà®²à¯�à®•à®³à¯�',
        'Accuracy Score': 'à®¤à¯�à®²à¯�à®²à®¿à®¯ à®®à®¤à®¿à®ªà¯�à®ªà¯†à®£à¯�',
        'Matching engine precision': 'à®ªà¯Šà®°à¯�à®¤à¯�à®¤ à®‡à®¯à®¨à¯�à®¤à®¿à®°à®¤à¯� à®¤à¯�à®²à¯�à®²à®¿à®¯à®®à¯�',
        'Escalated Disputes': 'à®®à¯‡à®²à¯�à®®à¯�à®±à¯ˆà®¯à¯€à®Ÿà¯� à®šà¯†à®¯à¯�à®¯à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ',
        'Requires operator review': 'à®‡à®¯à®•à¯�à®•à¯�à®¨à®°à®¿à®©à¯� à®®à®¤à®¿à®ªà¯�à®ªà®¾à®¯à¯�à®µà¯� à®¤à¯‡à®µà¯ˆ',
        'Alt. Matches Found': 'à®®à®¾à®±à¯�à®±à¯�à®ªà¯� à®ªà¯Šà®°à¯�à®Ÿà¯�à®•à®³à¯� à®•à®£à¯�à®Ÿà®±à®¿à®¯à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¤à¯�',
        'Deficit alternatives resolved': 'à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆ à®¤à¯€à®°à¯�à®µà¯�à®•à®³à¯�',
        'Live Pipeline': 'à®¨à¯‡à®°à®Ÿà®¿ à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®•à®³à¯�',
        'Sales Intelligence': 'à®µà®¿à®±à¯�à®ªà®©à¯ˆà®¤à¯� à®¤à®•à®µà®²à¯�',
        'Operations Split': 'à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯�à®ªà¯� à®ªà®•à®¿à®°à¯�à®µà¯�',
        'Operations Dispatcher Split': 'à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯�à®ªà¯� à®ªà®•à®¿à®°à¯�à®µà¯� à®µà®°à¯ˆà®ªà®Ÿà®®à¯�',
        'Ratio of automated responses vs. human-in-the-loop reviews': 'à®¤à®¾à®©à®¿à®¯à®™à¯�à®•à®¿ à®ªà®¤à®¿à®²à¯�à®•à®³à¯� à®®à®±à¯�à®±à¯�à®®à¯� à®¨à¯‡à®°à®Ÿà®¿ à®®à®¤à®¿à®ªà¯�à®ªà¯�à®°à¯ˆà®•à®³à®¿à®©à¯� à®µà®¿à®•à®¿à®¤à®®à¯�',
        'Automated': 'à®¤à®¾à®©à®¿à®¯à®™à¯�à®•à®¿',
        'Auto-Responded': 'à®¤à®¾à®©à®¿à®¯à®™à¯�à®•à®¿ à®ªà®¤à®¿à®²à®³à®¿à®ªà¯�à®ªà¯�',
        'Human Review': 'à®¨à¯‡à®°à®Ÿà®¿ à®®à®¤à®¿à®ªà¯�à®ªà®¾à®¯à¯�à®µà¯�',
        'Total Received': 'à®®à¯Šà®¤à¯�à®¤à®®à¯� à®ªà¯†à®±à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ',
        'all-time': 'à®‡à®¤à¯�à®µà®°à¯ˆ',
        'Sales Intelligence & Leakage': 'à®µà®¿à®±à¯�à®ªà®©à¯ˆà®¤à¯� à®¤à®•à®µà®²à¯� & à®•à®šà®¿à®µà¯� à®ªà®•à¯�à®ªà¯�à®ªà®¾à®¯à¯�à®µà¯�',
        'Immediate operational insights, high-value clients, top quotes, and conversion leakages.': 'à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯� à®¨à¯�à®£à¯�à®£à®±à®¿à®µà¯�, à®®à¯�à®•à¯�à®•à®¿à®¯ à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯�à®•à®³à¯� à®®à®±à¯�à®±à¯�à®®à¯� à®•à®šà®¿à®µà¯� à®ªà®•à¯�à®ªà¯�à®ªà®¾à®¯à¯�à®µà¯�.',
        'Conversion Funnel & Leakage': 'à®®à®¾à®±à¯�à®±à®ªà¯� à®ªà¯�à®©à®²à¯� & à®•à®šà®¿à®µà¯�',
        'Total Ingested': 'à®®à¯Šà®¤à¯�à®¤à®®à¯� à®ªà¯†à®±à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ',
        'Converted (Quotes Sent)': 'à®®à®¾à®±à¯�à®±à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¤à¯� (à®…à®©à¯�à®ªà¯�à®ªà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ)',
        'Leakage (Unmatched/Rejected)': 'à®•à®šà®¿à®µà¯� (à®ªà¯Šà®°à¯�à®¨à¯�à®¤à®¾à®¤à®µà¯ˆ/à®¨à®¿à®°à®¾à®•à®°à®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ)',
        'Leakage Analysis:': 'à®•à®šà®¿à®µà¯� à®ªà®•à¯�à®ªà¯�à®ªà®¾à®¯à¯�à®µà¯�:',
        'Unmatched items:': 'à®ªà¯Šà®°à¯�à®¨à¯�à®¤à®¾à®¤ à®ªà¯Šà®°à¯�à®Ÿà¯�à®•à®³à¯�:',
        'Rejected discounts:': 'à®¨à®¿à®°à®¾à®•à®°à®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®¤à®³à¯�à®³à¯�à®ªà®Ÿà®¿à®•à®³à¯�:',
        'enquiries': 'à®µà®¿à®šà®¾à®°à®£à¯ˆà®•à®³à¯�',
        'Top Customers': 'à®®à¯�à®•à¯�à®•à®¿à®¯ à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯�à®•à®³à¯�',
        'Name / Email': 'à®ªà¯†à®¯à®°à¯� / à®®à®¿à®©à¯�à®©à®žà¯�à®šà®²à¯�',
        'Quotes': 'à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯�à®•à®³à¯�',
        'Value': 'à®®à®¤à®¿à®ªà¯�à®ªà¯�',
        'No customers record': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®ªà®¤à®¿à®µà¯�à®•à®³à¯� à®‡à®²à¯�à®²à¯ˆ',
        'Top Quotations': 'à®®à¯�à®•à¯�à®•à®¿à®¯ à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯�à®•à®³à¯�',
        'Quote ID': 'à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯� à®Žà®£à¯�',
        'Customer': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯�',
        'Total': 'à®®à¯Šà®¤à¯�à®¤à®®à¯�',
        'No quotations record': 'à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯� à®ªà®¤à®¿à®µà¯�à®•à®³à¯� à®‡à®²à¯�à®²à¯ˆ',
        'Live Operations Pipeline': 'à®¨à¯‡à®°à®Ÿà®¿ à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯� à®µà®°à®¿à®šà¯ˆ',
        'Refreshingâ€¦': 'à®ªà¯�à®¤à¯�à®ªà¯�à®ªà®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®•à®¿à®±à®¤à¯�...',
        'Auto-refresh every 10s': 'à®’à®µà¯�à®µà¯Šà®°à¯� 10 à®µà®¿à®©à®¾à®Ÿà®¿à®•à¯�à®•à¯�à®®à¯� à®ªà¯�à®¤à¯�à®ªà¯�à®ªà®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®®à¯�',
        'Last updated:': 'à®•à®Ÿà¯ˆà®šà®¿à®¯à®¾à®• à®ªà¯�à®¤à¯�à®ªà¯�à®ªà®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¤à¯�:',
        'Refresh Now': 'à®‡à®ªà¯�à®ªà¯‹à®¤à¯� à®ªà¯�à®¤à¯�à®ªà¯�à®ªà®¿',
        'New Mail': 'à®ªà¯�à®¤à®¿à®¯ à®®à®¿à®©à¯�à®©à®žà¯�à®šà®²à¯�',
        'Reply': 'à®ªà®¤à®¿à®²à¯�',
        'Customer Request': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®•à¯‹à®°à®¿à®•à¯�à®•à¯ˆ',
        'Rejected': 'à®¨à®¿à®°à®¾à®•à®°à®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ',
        'Pending': 'à®¨à®¿à®²à¯�à®µà¯ˆà®¯à®¿à®²à¯� à®‰à®³à¯�à®³à®µà¯ˆ',
        'New Request': 'à®ªà¯�à®¤à®¿à®¯ à®•à¯‹à®°à®¿à®•à¯�à®•à¯ˆ',
        'View Request': 'à®•à¯‹à®°à®¿à®•à¯�à®•à¯ˆà®¯à¯ˆà®ªà¯� à®ªà®¾à®°à¯�',
        'Auto-Quoted': 'à®¤à®¾à®©à®¿à®¯à®™à¯�à®•à®¿ à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯�',
        'View Thread': 'à®ªà®¿à®©à¯�à®©à®£à®¿ à®µà®¿à®ªà®°à®™à¯�à®•à®³à¯�',
        'View Quote': 'à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯ˆà®ªà¯� à®ªà®¾à®°à¯�',
        'Replied': 'à®ªà®¤à®¿à®²à®³à®¿à®¤à¯�à®¤à®¾à®°à¯�',
        'Escalated': 'à®®à¯‡à®²à¯�à®®à¯�à®±à¯ˆà®¯à¯€à®Ÿà¯�',
        'Active': 'à®šà¯†à®¯à®²à®¿à®²à¯� à®‰à®³à¯�à®³à®µà¯ˆ',
        'Decide': 'à®®à¯�à®Ÿà®¿à®µà¯†à®Ÿà¯�',
        'Stock Shortage': 'à®‡à®°à¯�à®ªà¯�à®ªà¯� à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆ',
        'Shortage:': 'à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆ:',
        'Resolve': 'à®¤à¯€à®°à¯�à®µà¯� à®•à®¾à®£à¯�',
        'Draft Quotation': 'à®µà®°à¯ˆà®µà¯� à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯�',
        'Draft Amount:': 'à®µà®°à¯ˆà®µà¯� à®¤à¯Šà®•à¯ˆ:',
        'Review': 'Review (à®®à®¤à®¿à®ªà¯�à®ªà®¾à®¯à¯�à®µà¯�)',
        'Approve & Send': 'Approve & Send (à®…à®©à¯�à®ªà¯�à®ªà¯�)',
        'Unmatched': 'à®ªà¯Šà®°à¯�à®¨à¯�à®¤à®¾à®¤à®µà¯ˆ',
        'View': 'à®ªà®¾à®°à¯�',
        'All clear': 'à®…à®©à¯ˆà®¤à¯�à®¤à¯�à®®à¯� à®šà®°à®¿',
        "Today's Enquiries": 'à®‡à®©à¯�à®±à¯ˆà®¯ à®µà®¿à®šà®¾à®°à®£à¯ˆà®•à®³à¯�',
        "Yesterday's Enquiries": 'à®¨à¯‡à®±à¯�à®±à¯ˆà®¯ à®µà®¿à®šà®¾à®°à®£à¯ˆà®•à®³à¯�',
        'emails': 'à®®à®¿à®©à¯�à®©à®žà¯�à®šà®²à¯�à®•à®³à¯�',
        'No enquiries recorded.': 'à®µà®¿à®šà®¾à®°à®£à¯ˆà®•à®³à¯� à®�à®¤à¯�à®®à¯� à®‡à®²à¯�à®²à¯ˆ.',
        'Export': 'à®�à®±à¯�à®±à¯�à®®à®¤à®¿ à®šà¯†à®¯à¯�à®•',
        'Search deficits...': 'à®¤à¯‡à®Ÿà¯�à®•...',
        'Refresh': 'à®ªà¯�à®¤à¯�à®ªà¯�à®ªà®¿',
        'Responded': 'à®ªà®¤à®¿à®²à®³à®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ',
        
        // Deficits Tab Details
        'Inventory Fulfillment': 'à®šà®°à®•à¯�à®•à¯� à®‡à®°à¯�à®ªà¯�à®ªà¯� à®®à¯‡à®²à®¾à®£à¯�à®®à¯ˆ',
        'Stock Deficits': 'à®‡à®°à¯�à®ªà¯�à®ªà¯� à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆà®•à®³à¯�',
        'Match alternatives and clear out-of-stock order lines before they stall a quotation.': 'à®®à®¾à®±à¯�à®±à¯�à®ªà¯� à®ªà¯Šà®°à¯�à®Ÿà¯�à®•à®³à¯ˆà®ªà¯� à®ªà¯Šà®°à¯�à®¤à¯�à®¤à®¿, à®¤à®Ÿà¯ˆà®¯à®±à¯�à®± à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯ˆ à®‰à®±à¯�à®¤à®¿ à®šà¯†à®¯à¯�à®¯à®µà¯�à®®à¯�.',
        'Outstanding Deficits': 'à®¨à®¿à®²à¯�à®µà¯ˆà®¯à®¿à®²à¯� à®‰à®³à¯�à®³ à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆà®•à®³à¯�',
        'Resolved Matches': 'à®¤à¯€à®°à¯�à®µà¯� à®•à®¾à®£à®ªà¯�à®ªà®Ÿà¯�à®Ÿà®µà¯ˆ',
        'Affected SKUs': 'à®ªà®¾à®¤à®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯�à®•à®³à¯�',
        'Customers Waiting': 'à®•à®¾à®¤à¯�à®¤à®¿à®°à¯�à®•à¯�à®•à¯�à®®à¯� à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯�à®•à®³à¯�',
        'Outstanding Stock Deficit Queue': 'à®¨à®¿à®²à¯�à®µà¯ˆà®¯à®¿à®²à¯� à®‰à®³à¯�à®³ à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆ à®µà®°à®¿à®šà¯ˆ',
        'Invoice ID': 'à®µà®¿à®²à¯ˆà®ªà¯�à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯� à®Žà®£à¯�',
        'Missing Catalog SKU': 'à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆ à®‰à®³à¯�à®³ à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯�',
        'Customer Name & Contact': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®ªà¯†à®¯à®°à¯� & à®¤à¯Šà®Ÿà®°à¯�à®ªà¯�',
        'Qty Shortage': 'à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆ à®…à®³à®µà¯�',
        'Stock Status': 'à®‡à®°à¯�à®ªà¯�à®ªà¯� à®¨à®¿à®²à¯ˆ',
        'Status': 'à®¨à®¿à®²à¯ˆ',
        'Operation Action': 'à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�',
        'No deficits or stock shortages detected.': 'à®‡à®°à¯�à®ªà¯�à®ªà¯� à®ªà®±à¯�à®±à®¾à®•à¯�à®•à¯�à®±à¯ˆà®•à®³à¯� à®�à®¤à¯�à®®à¯� à®‡à®²à¯�à®²à¯ˆ.',
        'Resolve Match': 'à®¤à¯€à®°à¯�à®µà¯� à®•à®¾à®£à¯�',
        'Done': 'à®®à¯�à®Ÿà®¿à®¨à¯�à®¤à®¤à¯�',
        
        // Negotiations Tab Details
        'Deal Optimization': 'à®’à®ªà¯à®ªà®¨à¯à®¤ à®‰à®•à®ªà¯à®ªà®¾à®•à¯à®•à®®à¯',
        'Escalated Negotiations': 'à®ªà¯‡à®šà¯à®šà¯à®µà®¾à®°à¯à®¤à¯à®¤à¯ˆà®•à®³à¯',
        'Review and approve custom discounts requested by high-value customers.': 'à®®à¯à®•à¯à®•à®¿à®¯ à®µà®¾à®Ÿà®¿à®•à¯à®•à¯ˆà®¯à®¾à®³à®°à¯à®•à®³à®¿à®©à¯ à®šà®¿à®±à®ªà¯à®ªà¯à®¤à¯ à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆà®•à®³à¯ˆ à®…à®™à¯à®•à¯€à®•à®°à®¿à®•à¯à®•à®µà¯à®®à¯.',
        'Outstanding Requests': 'à®¨à®¿à®²à¯à®µà¯ˆà®¯à®¿à®²à¯ à®‰à®³à¯à®³ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆà®•à®³à¯',
        'Average Discount': 'à®šà®°à®¾à®šà®°à®¿ à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿',
        'Conversion Potential': 'à®®à®¾à®±à¯à®± à®šà®¾à®¤à¯à®¤à®¿à®¯à®•à¯à®•à¯‚à®±à¯',
        'Dispute Resolution Queue': 'à®¤à¯€à®°à¯à®µà¯ à®µà®°à®¿à®šà¯ˆ',
        'Requested Discount': 'à®•à¯‹à®°à®ªà¯à®ªà®Ÿà¯à®Ÿ à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿',
        'Approve': 'à®…à®™à¯à®•à¯€à®•à®°à®¿',
        'Reject': 'à®¨à®¿à®°à®¾à®•à®°à®¿',
        'No pending negotiations escalated.': 'à®¨à®¿à®²à¯à®µà¯ˆà®¯à®¿à®²à¯ à®‰à®³à¯à®³ à®ªà¯‡à®šà¯à®šà¯à®µà®¾à®°à¯à®¤à¯à®¤à¯ˆà®•à®³à¯ à®à®¤à¯à®®à¯ à®‡à®²à¯à®²à¯ˆ.',
        
        // Inventory Tab Details
        'Total Items': 'à®®à¯Šà®¤à¯�à®¤ à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯�à®•à®³à¯�',
        'Low Stock Items': 'à®•à¯�à®±à¯ˆà®¨à¯�à®¤ à®‡à®°à¯�à®ªà¯�à®ªà¯� à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯�à®•à®³à¯�',
        'Total Inventory Value': 'à®®à¯Šà®¤à¯�à®¤ à®‡à®°à¯�à®ªà¯�à®ªà¯� à®®à®¤à®¿à®ªà¯�à®ªà¯�',
        'Master Catalog Queue': 'à®®à®¾à®¸à¯�à®Ÿà®°à¯� à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯� à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯�',
        'Search inventory...': 'à®¤à¯‡à®Ÿà¯�à®•...',
        'SKU ID': 'à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯� à®•à¯�à®±à®¿à®¯à¯€à®Ÿà¯�',
        'Product Name': 'à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯� à®ªà¯†à®¯à®°à¯�',
        'Category': 'à®ªà®¿à®°à®¿à®µà¯�',
        'In Stock Qty': 'à®‡à®°à¯�à®ªà¯�à®ªà¯� à®…à®³à®µà¯�',
        'Base Price': 'à®…à®Ÿà®¿à®ªà¯�à®ªà®Ÿà¯ˆ à®µà®¿à®²à¯ˆ',
        'Out of Stock': 'à®‡à®°à¯�à®ªà¯�à®ªà¯� à®‡à®²à¯�à®²à¯ˆ',
        'In Stock': 'à®‡à®°à¯�à®ªà¯�à®ªà®¿à®²à¯� à®‰à®³à¯�à®³à®¤à¯�',
        
        // Pricing Tab Details
        'Contract Configuration': 'à®’à®ªà¯�à®ªà®¨à¯�à®¤ à®•à®Ÿà¯�à®Ÿà®®à¯ˆà®ªà¯�à®ªà¯�',
        'Dynamic Contract Pricing': 'à®µà®¿à®²à¯ˆ à®¨à®¿à®°à¯�à®£à®¯à®®à¯�',
        'Define client-specific pricing rules, volume discounts, and service tiers.': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®’à®ªà¯�à®ªà®¨à¯�à®¤ à®µà®¿à®²à¯ˆà®•à®³à¯� à®®à®±à¯�à®±à¯�à®®à¯� à®¤à®³à¯�à®³à¯�à®ªà®Ÿà®¿ à®µà®¿à®¤à®¿à®•à®³à¯ˆ à®¨à®¿à®°à¯�à®µà®•à®¿à®•à¯�à®•à®µà¯�à®®à¯�.',
        'Active Rules': 'à®šà¯†à®¯à®²à®¿à®²à¯� à®‰à®³à¯�à®³ à®µà®¿à®¤à®¿à®•à®³à¯�',
        'Global Discounts': 'à®ªà¯Šà®¤à¯�à®µà®¾à®© à®¤à®³à¯�à®³à¯�à®ªà®Ÿà®¿à®•à®³à¯�',
        'Contract Rules Queue': 'à®’à®ªà¯�à®ªà®¨à¯�à®¤ à®µà®¿à®¤à®¿à®•à®³à¯� à®µà®°à®¿à®šà¯ˆ',
        'Client Name': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®ªà¯†à®¯à®°à¯�',
        'Rule Type': 'à®µà®¿à®¤à®¿ à®µà®•à¯ˆ',
        'Details': 'à®µà®¿à®µà®°à®™à¯�à®•à®³à¯�',
        'No active contract rules defined.': 'à®µà®¿à®²à¯ˆ à®’à®ªà¯�à®ªà®¨à¯�à®¤ à®µà®¿à®¤à®¿à®•à®³à¯� à®�à®¤à¯�à®®à¯� à®‡à®²à¯�à®²à¯ˆ.',
        
        // AI Onboarding Tab Details
        'Autonomous AI': 'à®¤à®©à¯�à®©à®¾à®Ÿà¯�à®šà®¿ à®šà¯†à®¯à®±à¯�à®•à¯ˆ à®¨à¯�à®£à¯�à®£à®±à®¿à®µà¯�',
        'AI Onboarding & Rules': 'AI à®šà¯‡à®°à¯�à®•à¯�à®•à¯ˆ & à®µà®¿à®¤à®¿à®•à®³à¯�',
        'Configure vertical specific business descriptions, catalogs, contact credentials and training prompts.': 'à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯�à®ªà¯� à®ªà®¿à®°à®¿à®µà¯�à®•à®³à®¿à®©à¯� à®µà®£à®¿à®• à®µà®¿à®³à®•à¯�à®•à®™à¯�à®•à®³à¯� à®®à®±à¯�à®±à¯�à®®à¯� à®µà®¿à®¤à®¿à®•à®³à¯ˆ à®¨à®¿à®°à¯�à®µà®•à®¿à®•à¯�à®•à®µà¯�à®®à¯�.',
        'Active Verticals': 'à®šà¯†à®¯à®²à®¿à®²à¯� à®‰à®³à¯�à®³ à®ªà®¿à®°à®¿à®µà¯�à®•à®³à¯�',
        'System Prompts': 'à®…à®®à¯ˆà®ªà¯�à®ªà¯� à®…à®±à®¿à®µà¯�à®±à¯�à®¤à¯�à®¤à®²à¯�à®•à®³à¯�',
        'Registered Clients': 'à®ªà®¤à®¿à®µà¯� à®šà¯†à®¯à¯�à®¯à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯�à®•à®³à¯�',
        'Vertical Configurations': 'à®ªà®¿à®°à®¿à®µà¯� à®…à®®à¯ˆà®ªà¯�à®ªà¯�à®•à®³à¯�',
        'Configure parameters': 'à®…à®³à®µà¯€à®Ÿà¯�à®•à®³à¯ˆ à®…à®®à¯ˆà®•à¯�à®•à®µà¯�à®®à¯�',
        'Vertical Name': 'à®ªà®¿à®°à®¿à®µà®¿à®©à¯� à®ªà¯†à®¯à®°à¯�',
        'Business Model': 'à®µà®£à®¿à®• à®µà®•à¯ˆ',
        'Support Email': 'à®†à®¤à®°à®µà¯� à®®à®¿à®©à¯�à®©à®žà¯�à®šà®²à¯�',
        'SMTP Username': 'SMTP à®ªà®¯à®©à®°à¯�',
        'Status Code': 'à®¨à®¿à®²à¯ˆ',
        
        // CRM Segments Tab Details
        'CRM Directory': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®…à®Ÿà¯ˆà®µà¯�',
        'CRM Client Directory': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯�',
        'Segment and view registered clients, contact logs, and history.': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®µà®¿à®ªà®°à®™à¯�à®•à®³à¯� à®®à®±à¯�à®±à¯�à®®à¯� à®•à¯Šà®³à¯�à®®à¯�à®¤à®²à¯� à®µà®°à®²à®¾à®±à¯�à®±à¯ˆà®•à¯� à®•à®£à¯�à®•à®¾à®£à®¿à®•à¯�à®•à®µà¯�à®®à¯�.',
        'Client Base': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®Žà®£à¯�à®£à®¿à®•à¯�à®•à¯ˆ',
        'VIP Tier': 'à®µà®¿.à®�.à®ªà®¿ à®ªà®¿à®°à®¿à®µà¯�',
        'Regular Tier': 'à®šà®¾à®¤à®¾à®°à®£ à®ªà®¿à®°à®¿à®µà¯�',
        'CRM Client Segment Base': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯� à®¤à®•à®µà®²à¯� à®¤à®³à®®à¯�',
        'Company': 'à®¨à®¿à®±à¯�à®µà®©à®®à¯�',
        'Contact Phone': 'à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿ à®Žà®£à¯�',
        'Contact Email': 'à®®à®¿à®©à¯�à®©à®žà¯�à®šà®²à¯� à®®à¯�à®•à®µà®°à®¿',
        'Registered At': 'à®ªà®¤à®¿à®µà¯� à®šà¯†à®¯à¯�à®¯à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®¤à¯‡à®¤à®¿',
        'Segment': 'à®ªà®¿à®°à®¿à®µà¯�',
        'No clients registered.': 'à®µà®¾à®Ÿà®¿à®•à¯�à®•à¯ˆà®¯à®¾à®³à®°à¯�à®•à®³à¯� à®�à®¤à¯�à®®à¯� à®ªà®¤à®¿à®µà¯� à®šà¯†à®¯à¯�à®¯à®ªà¯�à®ªà®Ÿà®µà®¿à®²à¯�à®²à¯ˆ.',

        // AI Training Tab Details
        'AI Learning': 'AI à®•à®±à¯�à®±à®²à¯�',
        'AI Relevance Training': 'AI à®ªà®¯à®¿à®±à¯�à®šà®¿',
        'Train the relevance filter by defining product categories, intent signals, and synonyms.': 'à®ªà¯Šà®°à¯�à®¨à¯�à®¤à¯�à®®à¯� à®¤à®¯à®¾à®°à®¿à®ªà¯�à®ªà¯�à®•à®³à¯� à®®à®±à¯�à®±à¯�à®®à¯� à®’à®¤à¯�à®¤ à®šà¯Šà®±à¯�à®•à®³à®¿à®©à¯� à®®à¯‚à®²à®®à¯� AI-à®•à¯�à®•à¯�à®ªà¯� à®ªà®¯à®¿à®±à¯�à®šà®¿à®¯à®³à®¿à®•à¯�à®•à®µà¯�à®®à¯�.',
        'Keywords Trained': 'à®ªà®¯à®¿à®±à¯�à®šà®¿à®¯à®³à®¿à®•à¯�à®•à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®šà¯Šà®±à¯�à®•à®³à¯�',
        'Synonyms Map': 'à®’à®¤à¯�à®¤ à®šà¯Šà®±à¯�à®•à®³à¯� à®µà®°à¯ˆà®ªà®Ÿà®®à¯�',
        'Intent Keywords': 'à®¨à¯‹à®•à¯�à®•à®šà¯� à®šà¯Šà®±à¯�à®•à®³à¯�',
        'Intent Signals': 'à®¨à¯‹à®•à¯�à®• à®šà®¿à®•à¯�à®©à®²à¯�à®•à®³à¯�',
        'Synonyms List': 'à®’à®¤à¯�à®¤ à®šà¯Šà®±à¯�à®•à®³à¯� à®ªà®Ÿà¯�à®Ÿà®¿à®¯à®²à¯�',
        'Original Term': 'à®…à®šà®²à¯� à®šà¯Šà®²à¯�',
        'Mapped Catalog Term': 'à®ªà¯Šà®°à¯�à®¤à¯�à®¤à®ªà¯�à®ªà®Ÿà¯�à®Ÿ à®šà¯Šà®²à¯�',
        'No training synonyms found.': 'à®’à®¤à¯�à®¤ à®šà¯Šà®±à¯�à®•à®³à¯� à®�à®¤à¯�à®®à¯� à®‡à®²à¯�à®²à¯ˆ.',

        // Activity Log Tab Details
        'Event Console': 'à®¨à®¿à®•à®´à¯�à®µà¯� à®•à®©à¯�à®šà¯‹à®²à¯�',
        'Activity Log Console': 'à®šà¯†à®¯à®²à¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯� à®•à®©à¯�à®šà¯‹à®²à¯�',
        'Real-time event stream of email processes, quote dispatches, and system errors.': 'à®®à®¿à®©à¯�à®©à®žà¯�à®šà®²à¯� à®šà¯†à®¯à®²à®¾à®•à¯�à®•à®®à¯� à®®à®±à¯�à®±à¯�à®®à¯� à®•à®£à®¿à®©à®¿ à®¨à®¿à®•à®´à¯�à®µà¯�à®•à®³à®¿à®©à¯� à®¨à¯‡à®°à®Ÿà®¿ à®ªà®¤à®¿à®µà¯�.',
        'Total Logs': 'à®®à¯Šà®¤à¯�à®¤ à®ªà®¤à®¿à®µà¯�à®•à®³à¯�',
        'Warning Events': 'à®Žà®šà¯�à®šà®°à®¿à®•à¯�à®•à¯ˆ à®¨à®¿à®•à®´à¯�à®µà¯�à®•à®³à¯�',
        'Error Events': 'à®ªà®¿à®´à¯ˆ à®¨à®¿à®•à®´à¯�à®µà¯�à®•à®³à¯�',
        'System Event Stream Log': 'à®•à®£à®¿à®©à®¿ à®¨à®¿à®•à®´à¯�à®µà¯� à®ªà®¤à®¿à®µà¯�',
        'Timestamp': 'à®¨à¯‡à®°à®®à¯�',
        'Event Message': 'à®¨à®¿à®•à®´à¯�à®µà¯� à®šà¯†à®¯à¯�à®¤à®¿',
        'Severity': 'à®¤à¯€à®µà®¿à®°à®®à¯�',
        'No events logged in database.': 'à®¨à®¿à®•à®´à¯�à®µà¯�à®ªà¯� à®ªà®¤à®¿à®µà¯�à®•à®³à¯� à®�à®¤à¯�à®®à¯� à®‡à®²à¯�à®²à¯ˆ.'
      }
    },
    t(key) {
      if (this.language === 'ta' && this.translations.ta[key]) {
        return this.translations.ta[key];
      }
      return this.translations.en[key] || key;
    },
    translateDOM() {
      const isTa = this.language === 'ta';
      const dict = this.translations.ta;
      
      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const trimmed = node.nodeValue.trim();
          if (isTa && trimmed && dict[trimmed]) {
            if (!node.parentElement.dataset.origText) {
              node.parentElement.dataset.origText = node.nodeValue;
            }
            node.nodeValue = node.nodeValue.replace(trimmed, dict[trimmed]);
          } else if (!isTa && node.parentElement && node.parentElement.dataset.origText) {
            node.nodeValue = node.parentElement.dataset.origText;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' && node.tagName !== 'TEXTAREA') {
            const placeholder = node.getAttribute('placeholder');
            if (placeholder) {
              const pTrimmed = placeholder.trim();
              if (isTa && dict[pTrimmed]) {
                if (!node.dataset.origPlaceholder) {
                  node.dataset.origPlaceholder = placeholder;
                }
                node.setAttribute('placeholder', dict[pTrimmed]);
              } else if (!isTa && node.dataset.origPlaceholder) {
                node.setAttribute('placeholder', node.dataset.origPlaceholder);
              }
            }
            node.childNodes.forEach(walk);
          }
        }
      };
      
      walk(document.body);
    },
    setLanguage(lang) {
      this.language = lang;
      localStorage.setItem('language', lang);
      document.title = lang === 'ta' ? "Trofeo Hardware â€” à®¨à®¿à®°à¯�à®µà®¾à®•à®•à¯� à®•à®Ÿà¯�à®Ÿà¯�à®ªà¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯� à®•à¯�à®´à¯�" : "Trofeo Hardware â€” Admin Control Panel";
      this.translateDOM();
      this.$nextTick(() => {
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      });
    },
    theme: 'warm',
    selectedTenant: localStorage.getItem('selectedTenant') || 'default',
    loginTab: 'signin',
    signupForm: {
      email: '',
      full_name: '',
      password: '',
      confirmPassword: '',
      role: 'super_admin',
      business_name: '',
      business_type: 'Trading',
      industry: '',
      customIndustry: '',
      url: '',
      description_text: '',
      email_user: '',
      email_pass: '',
      imap_server: 'imap.gmail.com',
      imap_port: 993,
      smtp_server: 'smtp.gmail.com',
      smtp_port: 465,
      email_preset: 'gmail'
    },
    signupLoading: false,
    signupTesting: false,
    signupTestSuccess: null,
    signupTestMessage: '',
    signupError: '',
    showDossier: false,
    dossierUser: null,
    invoiceFilter: '',
    deficitsSearch: '',
    negSearch: '',

    handleEnterNavigation(e) {
      if (!e || e.key !== 'Enter' || e.shiftKey) return;
      
      const container = e.target.closest('.auth-card-container') || e.target.closest('form') || e.target.closest('div[style*="border-radius"]') || document.body;
      
      // Get all interactive input/select/textarea elements inside the active card
      const focusables = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'));
      const visibleFocusables = focusables.filter(el => el.offsetParent !== null);
      
      const currentIndex = visibleFocusables.indexOf(e.target);
      
      // Find the next unfilled input in the form sequence
      let nextEmpty = visibleFocusables.slice(currentIndex + 1).find(el => {
        const val = el.value ? el.value.trim() : '';
        return val === '';
      });
      
      // If none found after current, check from beginning before current
      if (!nextEmpty && currentIndex > 0) {
        nextEmpty = visibleFocusables.slice(0, currentIndex).find(el => {
          const val = el.value ? el.value.trim() : '';
          return val === '';
        });
      }

      if (nextEmpty) {
        e.preventDefault();
        e.stopPropagation();
        nextEmpty.focus();
        if (typeof nextEmpty.select === 'function' && nextEmpty.type !== 'select-one') {
          nextEmpty.select();
        }
      } else {
        // All fields filled! Submit form & navigate to Initialize Session
        e.preventDefault();
        e.stopPropagation();
        
        if (this.loginTab === 'signin') {
          this.loginUser(this.selectedEmail || 'superadmin@trofeo.com');
        } else if (this.loginTab === 'signup') {
          if (!this.otpVerified) {
            if (!this.otpSent) {
              this.sendOtp();
            } else if (this.otpCode) {
              this.verifyOtp();
            }
          } else {
            this.registerNewUser();
          }
        }
      }
    },
    
    // Tab AI Onboarding / Verticals
    activeVertical: {},
    onboardForm: { url: '', description_text: '', logoPreviewUrl: '', attachedFile: null, attachedFilePreview: '' },
    onboardLoading: false,
    approveLoading: false,
    onboardResult: null,

    activitySearch: '',
    toasts: [],
    connectionStatus: 'connected',
    
    // Tab AI Training
    trainingKeywords: [],
    recentlyLearnedKeywords: [],
    newTrainingKeyword: '',
    negotiationKeywords: [],
    newNegotiationKeyword: '',
    loadingTraining: false,
    trainingDataset: [],
    loadingTrainingDataset: false,
    trainingDatasetSearch: '',
    selectedDatasetEmail: null,
    showDatasetEmailModal: false,
    
    // Tab Dynamic Pricing
    tierPricingRules: [],
    customerCustomPrices: [],
    newRule: { tier: 'wholesale', category: 'Plumbing', discount_pct: 10 },
    newCustomPrice: { customer_email: '', sku_id: '', custom_price: '' },
    loadingPricing: false,
    rulesSearch: '',
    rulesSortKey: 'tier',
    rulesSortDesc: false,
    rulesPage: 1,
    rulesPageSize: 5,
    customPricesSearch: '',
    customPricesSortKey: 'customer_email',
    customPricesSortDesc: false,
    customPricesPage: 1,
    customPricesPageSize: 5,
    
    // Tab Customer Segments
    customerSegments: { customers: [], stats: {} },
    loadingSegments: false,
    segmentsSearch: '',
    segmentsSortKey: 'total_value',
    segmentsSortDesc: true,
    segmentsPage: 1,
    segmentsPageSize: 10,
    
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
      business_name: '',
      email_user: '',
      imap_server: 'imap.gmail.com',
      imap_port: 993,
      smtp_server: 'smtp.gmail.com',
      smtp_port: 465,
      has_email_pass: false
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
      { label: 'ðŸ“§ Email with Deficits', text: 'Subject: Quotation Request - Order SKU-2026-X\nDear Sales Team,\nPlease send pricing and quotes for the following parts:\n1. 10 units of Plastic Tool Box 19 Inch\n2. 5 units of Heavy Duty Staple Tacker Gun\n3. 2 units of Spirit Level Aluminum 24 Inch\nThanks,\nRajarajan (rajarajanodooimplementers@gmail.com)' },
      { label: 'ðŸ’¬ WhatsApp Shorthand', text: 'Hi, need stock check and discount for:\n- 3 qty box-tool-19\n- 8 qty staple gun\nUrgently need delivery to our site tomorrow. Let me know the total with tax.' },
      { label: 'âš ï¸� Deficit Trigger (High Qty)', text: 'Order inquiry:\n- 15 units of Plastic Tool Box 19 Inch (BOX-TOOL-19)\nNeed invoice asap.' }
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
    selectedAskedDiscount: 0,
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
    chatQuoteStatus: '',
    editableDraftText: '',
    aiInstruction: '',
    refineLoading: false,

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
    newPriceLevel: 0.0,
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
        if (!options.headers) {
          options.headers = {};
        }
        if (this.currentUserEmail) {
          options.headers['x-user-email'] = this.currentUserEmail;
        }
        if (this.selectedOperatorEmail) {
          options.headers['x-selected-operator'] = this.selectedOperatorEmail;
        }
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
      this.loadActiveVertical();
      this.loadUsers();
      
      // Initialize DOM translation observer
      this.$nextTick(() => {
        if (this.language === 'ta') {
          document.title = "Trofeo Hardware â€” à®¨à®¿à®°à¯�à®µà®¾à®•à®•à¯� à®•à®Ÿà¯�à®Ÿà¯�à®ªà¯�à®ªà®¾à®Ÿà¯�à®Ÿà¯� à®•à¯�à®´à¯�";
        }
        this.translateDOM();
        const observer = new MutationObserver(() => {
          if (this.language === 'ta') {
            this.translateDOM();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      });
      
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
        let list = [];
        if (data.tenants && data.tenants.length > 0) {
          list = data.tenants;
        } else if (Array.isArray(data) && data.length > 0) {
          list = data;
        }
        this.tenants = list;
        
        // Find the active vertical to select in the dropdown
        const active = list.find(t => t.is_active);
        if (active) {
          this.selectedTenant = active.id;
        } else if (list.length > 0) {
          this.selectedTenant = list[0].id;
        }
        
        // Load initial dashboard metrics without firing a redundant active vertical set request
        this.fetchOverviewData();
        this.fetchServiceStatus();
        this.refreshBadges();
        this.loadDeficits();
        this.loadNegotiations();
        this.loadQuotes();
        this.loadCatalog();
        this.loadLogs();
        this.loadSettings();
        this.loadActiveVertical();
        this.loadAnalytics();
        this.loadActivityLog();
        this.fetchTrainingData();
        this.fetchNegotiationData();
        this.loadPricingData();
        this.loadCustomerSegments();
      } catch (e) {
        this.showToast('Error loading verticals: ' + e.message, 'error');
      }
    },
    
    async handleTenantChange() {
      // Find the tenant name for the toast
      const tenantObj = this.tenants.find(t => t.id === this.selectedTenant);
      const tenantLabel = tenantObj ? tenantObj.name : this.selectedTenant;

      try {
        await this.safeFetch('/api/verticals/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this.selectedTenant,
            tenant_id: 'default'
          })
        });
      } catch (e) {
        console.warn('Error setting active vertical:', e);
      }

      // Reload ALL data sections so every tab reflects the new company vertical
      this.fetchOverviewData();
      this.fetchServiceStatus();
      this.refreshBadges();
      this.loadDeficits();
      this.loadNegotiations();
      this.loadQuotes();
      this.loadCatalog();
      this.loadLogs();
      this.loadSettings();
      this.loadActiveVertical();
      this.loadAnalytics();
      this.loadActivityLog();
      this.fetchTrainingData();
      this.fetchNegotiationData();
      this.loadPricingData();
      this.loadCustomerSegments();
      this.loadUsers();   // ← refresh User Access tab for new vertical
      this.loadSharedInboxes();

      this.showToast(`Switched to ${tenantLabel} — all data reloaded`, 'success');
    },
    
    switchTab(tabId, filterVal = '') {
      // Security Guard: Non-admin users cannot access restricted tabs
      const restrictedTabs = ['pricing', 'training', 'verticals', 'access'];
      if (this.currentUser.role !== 'super_admin' && restrictedTabs.includes(tabId)) {
        this.activeTab = 'overview';
        this.invoiceFilter = '';
        this.showToast('Access Denied: Super Admin role required', 'error');
        return;
      }
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
        this.fetchNegotiationData();
      }
      if (tabId === 'pricing') {
        this.loadPricingData();
      }
      if (tabId === 'customers') {
        this.loadCustomerSegments();
      }
      if (tabId === 'verticals') {
        this.loadActiveVertical();
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
      if (!logDateConverter(ts)) return ts || 'â€”';
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
      
      // Reset all page pagination parameters to 1 when search query changes
      this.deficitsPage = 1;
      this.negPage = 1;
      this.catalogPage = 1;
      this.activityPage = 1;
      this.rulesPage = 1;
      this.customPricesPage = 1;
      this.segmentsPage = 1;
      
      // Sync Catalog search filter
      this.filterCatalog();
      
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

      getFilteredRules() {
        const query = (this.rulesSearch || this.invoiceFilter).toLowerCase().trim();
        if (!query) return this.tierPricingRules;
        return this.tierPricingRules.filter(r => 
          (r.tier || '').toLowerCase().includes(query) || 
          (r.category || '').toLowerCase().includes(query) ||
          String(Math.round(r.discount_pct * 100)).includes(query)
        );
      },

      sortedRules() {
        return [...this.getFilteredRules()].sort((a, b) => {
          let valA = a[this.rulesSortKey];
          let valB = b[this.rulesSortKey];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          
          if (valA < valB) return this.rulesSortDesc ? 1 : -1;
          if (valA > valB) return this.rulesSortDesc ? -1 : 1;
          return 0;
        });
      },

      paginatedRules() {
        const start = (this.rulesPage - 1) * this.rulesPageSize;
        return this.sortedRules().slice(start, start + this.rulesPageSize);
      },

      rulesTotalPages() {
        return Math.ceil(this.sortedRules().length / this.rulesPageSize) || 1;
      },

      getFilteredCustomPrices() {
        const query = (this.customPricesSearch || this.invoiceFilter).toLowerCase().trim();
        if (!query) return this.customerCustomPrices;
        return this.customerCustomPrices.filter(p => 
          (p.customer_email || '').toLowerCase().includes(query) || 
          (p.sku_id || '').toLowerCase().includes(query) ||
          String(p.custom_price).includes(query)
        );
      },

      sortedCustomPrices() {
        return [...this.getFilteredCustomPrices()].sort((a, b) => {
          let valA = a[this.customPricesSortKey];
          let valB = b[this.customPricesSortKey];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          
          if (valA < valB) return this.customPricesSortDesc ? 1 : -1;
          if (valA > valB) return this.customPricesSortDesc ? -1 : 1;
          return 0;
        });
      },

      paginatedCustomPrices() {
        const start = (this.customPricesPage - 1) * this.customPricesPageSize;
        return this.sortedCustomPrices().slice(start, start + this.customPricesPageSize);
      },

      customPricesTotalPages() {
        return Math.ceil(this.sortedCustomPrices().length / this.customPricesPageSize) || 1;
      },

      getFilteredSegments() {
        const query = (this.segmentsSearch || this.invoiceFilter).toLowerCase().trim();
        const list = this.customerSegments.customers || [];
        if (!query) return list;
        return list.filter(c => 
          (c.name || '').toLowerCase().includes(query) || 
          (c.email || '').toLowerCase().includes(query) ||
          (c.phone || '').toLowerCase().includes(query) ||
          (c.tier || '').toLowerCase().includes(query) ||
          (c.segment_label || '').toLowerCase().includes(query)
        );
      },

      sortedSegments() {
        return [...this.getFilteredSegments()].sort((a, b) => {
          let valA = a[this.segmentsSortKey];
          let valB = b[this.segmentsSortKey];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          
          if (valA < valB) return this.segmentsSortDesc ? 1 : -1;
          if (valA > valB) return this.segmentsSortDesc ? -1 : 1;
          return 0;
        });
      },

      paginatedSegments() {
        const start = (this.segmentsPage - 1) * this.segmentsPageSize;
        return this.sortedSegments().slice(start, start + this.segmentsPageSize);
      },

      segmentsTotalPages() {
        return Math.ceil(this.sortedSegments().length / this.segmentsPageSize) || 1;
      },
      isMailboxConnected() {
      if (this.settings && (this.settings.has_email_pass || (this.settings.email_user && this.settings.email_user.trim()))) {
        return true;
      }
      if (this.overviewData && (this.overviewData.mailbox_connected || this.overviewData.has_email_pass)) {
        return true;
      }
      return false;
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
      // quotation thread â€” strip the prefix so the timeline (and View PDF) resolve.
      if (invoiceId && invoiceId.startsWith('CUSTOMER_REPLIED:')) {
        invoiceId = invoiceId.split(':').slice(1).join(':');
      }
      this.chatInvoiceId = invoiceId;
      this.chatCustName = custName;
      this.showChatModal = true;
      this.loadingChat = true;
      this.chatLogs = [];
      this.chatItems = [];
      this.chatQuoteStatus = '';
      this.editableDraftText = '';
      this.aiInstruction = '';
      
      try {
        // Bug 10 fix: Use /api/quote/details/ as primary source (more reliable, direct per-QTN endpoint)
        const detailsRes = await this.safeFetch(`/api/quote/details/${invoiceId}?tenant_id=${this.selectedTenant}`);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          this.chatLogs = detailsData.logs || [];
          this.chatItems = detailsData.items || [];
          this.chatQuoteStatus = detailsData.quotation ? detailsData.quotation.status : '';
          this.editableDraftText = detailsData.draft_body || '';
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
      this.selectedAskedDiscount = Math.round(currentDiscount * 100);
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
          const icon = action === 'approve' ? 'âœ…' : 'âœ—';
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

    async handleCatalogImport(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append("file", file);
      
      this.loadingInventory = true;
      try {
        const res = await fetch(`/api/inventory/import?tenant_id=${this.selectedTenant}`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          this.showToast(`Imported ${data.count} records successfully!`, 'success');
          this.loadCatalog();
        } else {
          this.showToast(data.detail || 'Failed to import catalog', 'error');
        }
      } catch (e) {
        this.showToast('Import error: ' + e.message, 'error');
      } finally {
        this.loadingInventory = false;
        event.target.value = ''; // Reset file input
      }
    },
    
    filterCatalog() {
      const query = (this.inventorySearch || this.invoiceFilter).toLowerCase().trim();
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
    
    openStockModal(skuId, skuName, stock, price) {
      this.selectedSkuId = skuId;
      this.selectedSkuName = skuName;
      this.newStockLevel = stock;
      this.newPriceLevel = price || 0.0;
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
            new_price: parseFloat(this.newPriceLevel),
            tenant_id: this.selectedTenant
          })
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          this.showToast('Catalog item updated successfully!', 'success');
          this.showStockModal = false;
          this.loadCatalog();
          this.loadLogs();
          this.refreshBadges();
        }
      } catch (e) {
        this.showToast('Error updating catalog item: ' + e.message, 'error');
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

    async loadActiveVertical() {
      try {
        const res = await this.safeFetch(`/api/verticals?tenant_id=${this.selectedTenant}`);
        const data = await res.json();
        if (data.verticals && data.verticals.length > 0) {
          const active = data.verticals.find(v => v.is_active === 1);
          if (active) {
            const prevActiveId = this.activeVertical ? this.activeVertical.id : null;
            this.activeVertical = active;
            if (active.id !== prevActiveId) {
              const bType = active.business_type === 'Services' ? 'Services based' : 'Trading (Stock based)';
              this.showToast(`Business Profile Loaded: ${active.name} [${bType}]`, 'success');
            }
          }
        }
      } catch (e) {
        console.warn('Error loading active vertical:', e);
      }
    },

    onLogoFileSelected(event) {
      const file = event.target.files[0];
      if (file) {
        this.onboardForm.logoPreviewUrl = URL.createObjectURL(file);
      } else {
        this.onboardForm.logoPreviewUrl = '';
      }
    },

    onDocFileSelected(event) {
      const file = event.target.files[0];
      if (!file) {
        this.onboardForm.attachedFile = null;
        this.onboardForm.attachedFilePreview = '';
        return;
      }
      this.onboardForm.attachedFile = file;
      this.onboardForm.attachedFilePreview = '';
      // For TXT files, read a short preview of content
      if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.onboardForm.attachedFilePreview = (e.target.result || '').slice(0, 120).replace(/\n/g, ' ');
        };
        reader.readAsText(file.slice(0, 300));
      }
      this.$nextTick(() => this.triggerLucide());
    },

    removeAttachedFile() {
      this.onboardForm.attachedFile = null;
      this.onboardForm.attachedFilePreview = '';
      const input = document.getElementById('onboardFile');
      if (input) input.value = '';
      this.$nextTick(() => this.triggerLucide());
    },

    async runOnboardAnalysis() {
      const fileInput = document.getElementById('onboardFile');
      const file = fileInput ? fileInput.files[0] : null;

      if (!this.onboardForm.url && !this.onboardForm.description_text && !file) {
        this.showToast('Please provide a website URL, business description text, or attach a document.', 'error');
        return;
      }
      this.onboardLoading = true;
      this.onboardResult = null;
      try {
        const formData = new FormData();
        if (this.onboardForm.url) {
          formData.append('url', this.onboardForm.url);
        }
        if (this.onboardForm.description_text) {
          formData.append('description_text', this.onboardForm.description_text);
        }
        if (file) {
          formData.append('file', file);
        }

        const logoInput = document.getElementById('onboardLogoFile');
        const logoFile = logoInput ? logoInput.files[0] : null;
        if (logoFile) {
          formData.append('logo_file', logoFile);
        }

        const res = await this.safeFetch(`/api/verticals/onboard?tenant_id=${this.selectedTenant}`, {
          method: 'POST',
          body: formData
        });
        if (res.status !== 200) {
          const err = await res.json();
          this.showToast('Analysis failed: ' + (err.detail || 'Unknown error'), 'error');
        } else {
          this.onboardResult = await res.json();
          this.showToast('AI analysis complete! Suggestion loaded.', 'success');
        }
      } catch (e) {
        this.showToast('Error analyzing business profile: ' + e.message, 'error');
      } finally {
        this.onboardLoading = false;
        this.$nextTick(() => this.triggerLucide());
      }
    },

    async approveOnboardProfile() {
      if (!this.onboardResult) return;
      this.approveLoading = true;
      try {
        const verticalId = this.onboardResult.company_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const payload = {
          id: verticalId,
          name: this.onboardResult.company_name,
          industry: this.onboardResult.industry,
          guidelines: this.onboardResult.guidelines,
          tone: this.onboardResult.tone,
          catalog_path: this.onboardResult.suggested_catalog ? `data/catalog_${verticalId}.csv` : (this.activeVertical.catalog_path || 'data/sku_catalog.csv'),
          crm_path: this.onboardResult.suggested_crm ? `data/crm_${verticalId}.json` : (this.activeVertical.crm_path || 'data/crm_customers.json'),
          source_details: this.onboardForm.description_text || this.onboardForm.url || 'Scraped website onboarding',
          suggested_relevance_keywords: this.onboardResult.suggested_relevance_keywords || [],
          suggested_negotiation_keywords: this.onboardResult.suggested_negotiation_keywords || [],
          suggested_catalog: this.onboardResult.suggested_catalog || [],
          suggested_crm: this.onboardResult.suggested_crm || [],
          logo_path: this.onboardResult.uploaded_logo_path || '',
          extracted_logo_url: this.onboardResult.extracted_logo_url || '',
          business_type: this.onboardResult.business_type || 'Trading',
          tenant_id: this.selectedTenant
        };
        
        const res = await this.safeFetch('/api/verticals/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          this.showToast('Vertical profile activated & model trained successfully!', 'success');
          this.loadActiveVertical();
          this.loadSettings();
          this.fetchTrainingData();
          this.fetchNegotiationData();
          this.onboardResult = null;
          this.onboardForm = { url: '', description_text: '', logoPreviewUrl: '', attachedFile: null, attachedFilePreview: '' };
          // Clear logo file inputs
          const logoInput = document.getElementById('onboardLogoFile');
          if (logoInput) logoInput.value = '';
          const docInput = document.getElementById('onboardFile');
          if (docInput) docInput.value = '';
        } else {
          this.showToast('Failed to activate: ' + data.message, 'error');
        }
      } catch (e) {
        this.showToast('Error activating vertical profile: ' + e.message, 'error');
      } finally {
        this.approveLoading = false;
        this.$nextTick(() => this.triggerLucide());
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

    async approveManualQuote(invoiceId, customBody = '') {
      try {
        const res = await this.safeFetch(`/api/quote/approve_and_send?tenant_id=${this.selectedTenant}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invoiceId, custom_body: customBody })
        });
        const data = await res.json();
        if (data.status === 'success') {
          this.showToast(`Quotation ${invoiceId} approved and sent successfully!`, 'success');
          this.showChatModal = false;
          this.fetchOverviewData();
        } else {
          this.showToast('Failed to approve quotation: ' + data.detail, 'error');
        }
      } catch (e) {
        this.showToast('Error approving quotation: ' + e.message, 'error');
      }
    },

    async refineDraftWithAI() {
      if (!this.aiInstruction || !this.aiInstruction.trim()) {
        this.showToast('Please type an instruction first.', 'warning');
        return;
      }
      this.refineLoading = true;
      try {
        const res = await this.safeFetch('/api/quotes/refine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': this.currentUserEmail
          },
          body: JSON.stringify({
            invoice_id: this.chatInvoiceId,
            instruction: this.aiInstruction,
            current_draft: this.editableDraftText,
            tenant_id: this.selectedTenant
          })
        });
        if (res.ok) {
          const data = await res.json();
          this.editableDraftText = data.refined_draft;
          this.aiInstruction = '';
          this.showToast('AI Refinement applied successfully!', 'success');
        } else {
          const err = await res.json();
          this.showToast('Refinement failed: ' + (err.detail || res.statusText), 'error');
        }
      } catch (e) {
        this.showToast('Error refining draft: ' + e.message, 'error');
      } finally {
        this.refineLoading = false;
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

    // â”€â”€ Activity Log Methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async loadActivityLog() {
      try {
        const res = await this.safeFetch(`/api/activity/log?tenant_id=${this.selectedTenant}&limit=200`);
        const data = await res.json();
        this.activityLogs = data.logs || [];
        this.activityUptime = data.uptime_seconds || 0;
        this.activityServerStart = data.server_start_time || '';
        // Current time from server (IST) â€” also ticked by the 1s interval
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
      if (!ts) return 'â€”';
      try {
        return ts.split(' ')[0] || ts;
      } catch (e) { return ts; }
    },

    formatActivityTime(ts) {
      if (!ts) return 'â€”';
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

    // â”€â”€ Export Report Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        rows.push(['New Mail', m.invoice_id || 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', m.description || 'â€”', m.timestamp || 'â€”']);
      });
      this.getFilteredList(this.respondedMails).forEach(m => {
        rows.push(['Responded', m.invoice_id || 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', m.status || 'â€”', m.timestamp || 'â€”']);
      });
      this.getFilteredList(this.repliedMails).forEach(m => {
        rows.push(['Reply', m.invoice_id || 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', 'Customer Replied', m.timestamp || 'â€”']);
      });
      this.getFilteredList(this.negotiations).forEach(m => {
        rows.push(['Customer Request', m.invoice_id || 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', `Requested: ${Math.round(m.discount_pct*100)}%`, m.created_at || 'â€”']);
      });
      this.getFilteredList(this.rejectedMails).forEach(m => {
        rows.push(['Rejected', m.invoice_id || 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', 'Quotation Rejected', m.created_at || 'â€”']);
      });
      this.getFilteredList(this.pendingDeficits).forEach(m => {
        rows.push(['Pending (Deficit)', m.invoice_id || 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', `Shortage: ${m.deficit_qty} units of ${m.sku_name}`, m.created_at || 'â€”']);
      });
      this.getFilteredList(this.pendingReviews).forEach(m => {
        rows.push(['Pending (Draft Review)', m.invoice_id || 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', `Draft Amount: ₹${m.grand_total}`, m.created_at || 'â€”']);
      });
      this.getFilteredList(this.pendingUnmatched).forEach(m => {
        rows.push(['Pending (Unmatched)', 'â€”', m.customer_name || 'â€”', m.customer_email || 'â€”', m.original_body || 'â€”', m.created_at || 'â€”']);
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
        m.customer_name || 'â€”',
        m.customer_email || 'â€”',
        m.description || 'â€”',
        m.timestamp || 'â€”',
        m.status || 'â€”'
      ]);
      
      const title = type === 'today' ? "Today's Enquiries Report" : "Yesterday's Enquiries Report";
      const filename = type === 'today' ? 'todays_enquiries_report' : 'yesterdays_enquiries_report';
      this.executeExport(format, title, filename, headers, rows);
    },

    exportInventoryReport(format) {
      const headers = ['SKU ID', 'Product Description', 'Category', 'Stock Level', 'Unit Price (INR)'];
      const rows = this.filteredCatalog.map(sku => [
        sku.sku_id || 'â€”',
        sku.sku_name || 'â€”',
        sku.category || 'â€”',
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
        e.timestamp || 'â€”',
        this.formatEventLabel(e.event_type) || e.event_type || 'â€”',
        e.customer_name || 'â€”',
        e.customer_email || 'â€”',
        e.invoice_id || 'â€”',
        e.description || 'â€”'
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
        await this.loadTrainingDataset();
      } catch (e) {
        console.error('Failed to fetch training data:', e);
      } finally {
        this.loadingTraining = false;
      }
    },

    async loadTrainingDataset() {
      this.loadingTrainingDataset = true;
      try {
        const res = await this.safeFetch(`/api/training/dataset?tenant_id=${this.selectedTenant}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          this.trainingDataset = data.emails || [];
        }
        this.$nextTick(() => this.triggerLucide());
      } catch (e) {
        this.showToast('Error loading dataset: ' + e.message, 'error');
      } finally {
        this.loadingTrainingDataset = false;
      }
    },

    async trainFromDatasetEmail(emailId) {
      this.showToast('Extracting keywords from email...', 'info');
      try {
        const res = await this.safeFetch('/api/training/dataset/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email_id: emailId, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.learned && data.learned.length > 0) {
            this.showToast(`AI learned ${data.learned.length} new keywords: ${data.learned.join(', ')}`, 'success');
          } else {
            this.showToast('AI analyzed the email but found no new relevant keywords.', 'info');
          }
          this.fetchTrainingData();
        } else {
          const err = await res.json();
          this.showToast('Training failed: ' + (err.detail || 'unknown error'), 'error');
        }
      } catch (e) {
        this.showToast('Training error: ' + e.message, 'error');
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
    },

    async fetchNegotiationData() {
      try {
        const res = await this.safeFetch(`/api/training/negotiation/keywords?tenant_id=${this.selectedTenant}`);
        if (res.ok) {
          const data = await res.json();
          this.negotiationKeywords = data.keywords || [];
        }
      } catch (e) {
        console.error('Failed to fetch negotiation keywords:', e);
      }
    },

    async addNegotiationKeyword() {
      const kw = this.newNegotiationKeyword.trim().toLowerCase();
      if (!kw) return;
      try {
        const res = await this.safeFetch(`/api/training/negotiation/keywords/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.showToast(`Negotiation keyword "${kw}" added successfully!`);
            this.newNegotiationKeyword = '';
            this.fetchNegotiationData();
          } else {
            this.showToast(`Keyword "${kw}" is already registered.`, 'warning');
          }
        }
      } catch (e) {
        this.showToast('Failed to add keyword: ' + e.message, 'error');
      }
    },

    async deleteNegotiationKeyword(kw) {
      if (!confirm(`Are you sure you want to delete negotiation keyword "${kw}"?`)) return;
      try {
        const res = await this.safeFetch(`/api/training/negotiation/keywords/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          this.showToast(`Negotiation keyword "${kw}" deleted!`);
          this.fetchNegotiationData();
        }
      } catch (e) {
        this.showToast('Failed to delete keyword: ' + e.message, 'error');
      }
    },

    async resetNegotiationKeywords() {
      if (!confirm('Are you sure you want to reset all negotiation keywords to system defaults?')) return;
      try {
        const res = await this.safeFetch(`/api/training/negotiation/keywords/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          this.showToast('Negotiation keywords reset to defaults!');
          this.fetchNegotiationData();
        }
      } catch (e) {
        this.showToast('Failed to reset keywords: ' + e.message, 'error');
      }
    },

    async loadPricingData() {
      this.loadingPricing = true;
      try {
        const resRules = await this.safeFetch(`/api/pricing/rules?tenant_id=${this.selectedTenant}`);
        if (resRules.ok) {
          this.tierPricingRules = await resRules.json();
        }
        const resCustom = await this.safeFetch(`/api/pricing/custom?tenant_id=${this.selectedTenant}`);
        if (resCustom.ok) {
          this.customerCustomPrices = await resCustom.json();
        }
      } catch (e) {
        this.showToast('Failed to load pricing data: ' + e.message, 'error');
      } finally {
        this.loadingPricing = false;
      }
    },

    async loadCustomerSegments() {
      this.loadingSegments = true;
      try {
        const res = await this.safeFetch(`/api/customers/segments?tenant_id=${this.selectedTenant}`);
        if (res.ok) {
          this.customerSegments = await res.json();
        }
      } catch (e) {
        this.showToast('Failed to load customer segments: ' + e.message, 'error');
      } finally {
        this.loadingSegments = false;
      }
    },

    async addTierRule() {
      if (!this.newRule.category) {
        this.showToast('Category name is required', 'warning');
        return;
      }
      try {
        const res = await this.safeFetch('/api/pricing/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: this.newRule.tier,
            category: this.newRule.category,
            discount_pct: parseFloat(this.newRule.discount_pct) / 100.0,
            tenant_id: this.selectedTenant
          })
        });
        if (res.ok) {
          this.showToast('Tier pricing rule saved successfully!');
          this.loadPricingData();
        }
      } catch (e) {
        this.showToast('Failed to save rule: ' + e.message, 'error');
      }
    },

    async deleteTierRule(ruleId) {
      if (!confirm('Are you sure you want to delete this pricing rule?')) return;
      try {
        const res = await this.safeFetch(`/api/pricing/rules/${ruleId}?tenant_id=${this.selectedTenant}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          this.showToast('Pricing rule deleted!');
          this.loadPricingData();
        }
      } catch (e) {
        this.showToast('Failed to delete rule: ' + e.message, 'error');
      }
    },

    async addCustomPrice() {
      if (!this.newCustomPrice.customer_email || !this.newCustomPrice.sku_id || !this.newCustomPrice.custom_price) {
        this.showToast('All fields are required', 'warning');
        return;
      }
      try {
        const res = await this.safeFetch('/api/pricing/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_email: this.newCustomPrice.customer_email,
            sku_id: this.newCustomPrice.sku_id,
            custom_price: parseFloat(this.newCustomPrice.custom_price),
            tenant_id: this.selectedTenant
          })
        });
        if (res.ok) {
          this.showToast('Custom customer price override saved!');
          this.newCustomPrice.customer_email = '';
          this.newCustomPrice.sku_id = '';
          this.newCustomPrice.custom_price = '';
          this.loadPricingData();
        }
      } catch (e) {
        this.showToast('Failed to save override: ' + e.message, 'error');
      }
    },

    async deleteCustomPrice(priceId) {
      if (!confirm('Are you sure you want to delete this custom price override?')) return;
      try {
        const res = await this.safeFetch(`/api/pricing/custom/${priceId}?tenant_id=${this.selectedTenant}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          this.showToast('Custom price override deleted!');
          this.loadPricingData();
        }
      } catch (e) {
        this.showToast('Failed to delete override: ' + e.message, 'error');
      }
    },

    async loadUsers() {
      try {
        const res = await this.safeFetch('/api/users?tenant_id=' + this.selectedTenant);
        if (res.ok) {
          const data = await res.json();
          this.usersList = data.users || [];
          const matched = this.usersList.find(u => u.email.toLowerCase() === this.currentUserEmail.toLowerCase());
          if (matched) {
            this.currentUser = matched;
          } else {
            this.currentUser = { email: 'superadmin@trofeo.com', role: 'super_admin', full_name: 'Super Admin' };
          }
        } else {
          if (this.currentUserEmail === 'superadmin@trofeo.com') {
            this.currentUser = { email: 'superadmin@trofeo.com', role: 'super_admin', full_name: 'Super Admin' };
          } else if (this.currentUserEmail === 'karthi@trofeo.com') {
            this.currentUser = { email: 'karthi@trofeo.com', role: 'employee', full_name: 'Karthikeyan' };
          } else {
            this.currentUser = { email: this.currentUserEmail, role: 'employee', full_name: this.currentUserEmail.split('@')[0] };
          }
        }
      } catch (e) {
        console.error('Failed to load users list:', e);
      }
      // Also refresh shared inboxes whenever users are loaded
      this.loadSharedInboxes();
      if (this.currentUser.role !== 'super_admin' && ['pricing', 'training', 'verticals', 'access'].includes(this.activeTab)) {
        this.activeTab = 'overview';
      }
    },

    async loadSharedInboxes() {
      try {
        const res = await this.safeFetch('/api/users/shared-inboxes?tenant_id=' + this.selectedTenant);
        if (res.ok) {
          const data = await res.json();
          this.sharedInboxes = data.shared_inboxes || [];
        }
      } catch (e) {
        console.error('Failed to load shared inboxes:', e);
      }
    },

    async saveSharedInboxAssignment(inboxEmail, inboxLabel, userEmail) {
      if (!inboxEmail.trim() || !userEmail.trim()) {
        this.showToast('Please enter both inbox email and user email.', 'error');
        return;
      }
      try {
        const res = await this.safeFetch('/api/users/shared-inboxes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inbox_email: inboxEmail.trim(), inbox_label: inboxLabel.trim(), user_email: userEmail.trim(), tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          this.showToast(`${userEmail} assigned to shared inbox ${inboxEmail}`, 'success');
          this.loadSharedInboxes();
        } else {
          const err = await res.json();
          this.showToast('Failed: ' + (err.detail || 'Unknown error'), 'error');
        }
      } catch (e) {
        this.showToast('Error: ' + e.message, 'error');
      }
    },

    async removeSharedInboxAssignment(inboxEmail, userEmail) {
      try {
        const res = await this.safeFetch('/api/users/shared-inboxes/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inbox_email: inboxEmail, user_email: userEmail || '', tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          const msg = userEmail ? `${userEmail} removed from ${inboxEmail}` : `Shared inbox ${inboxEmail} deleted`;
          this.showToast(msg, 'success');
          this.loadSharedInboxes();
        } else {
          const err = await res.json();
          this.showToast('Failed: ' + (err.detail || 'Unknown error'), 'error');
        }
      } catch (e) {
        this.showToast('Error: ' + e.message, 'error');
      }
    },

    loginUser(email) {
      this.currentUserEmail = email;
      localStorage.setItem('currentUserEmail', email);
      this.isLoggedIn = true;
      localStorage.setItem('isLoggedIn', 'true');
      document.documentElement.classList.add('user-logged-in');
      document.documentElement.classList.remove('user-logged-out');
      this.selectedOperatorEmail = 'all';
      
      this.loadUsers().then(() => {
        this.fetchOverviewData();
        this.loadDeficits();
        this.loadNegotiations();
        this.loadActivityLog();
        this.showToast('Logged in as ' + this.currentUser.full_name);
        this.$nextTick(() => {
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        });
      });
    },

    async testSignupConnection() {
      if (!this.signupForm.email_user || !this.signupForm.email_pass || !this.signupForm.imap_server || !this.signupForm.smtp_server) {
        this.signupTestSuccess = false;
        this.signupTestMessage = 'Please enter email, app password, IMAP, and SMTP servers.';
        return;
      }
      this.signupTesting = true;
      this.signupTestSuccess = null;
      this.signupTestMessage = 'Testing mailbox connection...';
      try {
        const res = await fetch('/api/auth/test_connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email_user: this.signupForm.email_user,
            email_pass: this.signupForm.email_pass,
            imap_server: this.signupForm.imap_server,
            imap_port: parseInt(this.signupForm.imap_port) || 993,
            smtp_server: this.signupForm.smtp_server,
            smtp_port: parseInt(this.signupForm.smtp_port) || 465
          })
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          this.signupTestSuccess = true;
          this.signupTestMessage = '✓ IMAP & SMTP connection successful!';
          this.showToast('Mailbox connection verified!', 'success');
        } else {
          this.signupTestSuccess = false;
          this.signupTestMessage = '✗ ' + (data.message || 'Connection failed.');
          this.showToast('Connection test failed.', 'error');
        }
      } catch (e) {
        this.signupTestSuccess = false;
        this.signupTestMessage = '✗ Connection error: ' + e.message;
      } finally {
        this.signupTesting = false;
      }
    },

    async registerNewUser() {
      if (!this.signupForm.email || !this.signupForm.full_name || !this.signupForm.business_name || !this.signupForm.industry || !this.signupForm.password || !this.signupForm.confirmPassword) {
        this.signupError = 'Please fill out all required fields: Full Name, Business Name, Industry, Email, New Password, and Confirm Password.';
        return;
      }

      if (this.signupForm.password !== this.signupForm.confirmPassword) {
        this.signupError = 'New password and Confirm password do not match.';
        return;
      }
      
      let finalIndustry = this.signupForm.industry;
      if (this.signupForm.industry === 'Other') {
        if (!this.signupForm.customIndustry || !this.signupForm.customIndustry.trim()) {
          this.signupError = 'Please specify your custom industry vertical.';
          return;
        }
        finalIndustry = this.signupForm.customIndustry.trim();
      }

      this.signupLoading = true;
      this.signupError = '';
      try {
        const payload = {
          email: this.signupForm.email,
          full_name: this.signupForm.full_name,
          password: this.signupForm.password,
          role: 'super_admin',
          business_name: this.signupForm.business_name,
          business_type: this.signupForm.business_type || 'Trading',
          industry: finalIndustry,
          url: this.signupForm.url || null,
          description_text: this.signupForm.description_text || null,
          email_user: this.signupForm.email,
          email_pass: this.signupForm.email_pass,
          imap_server: this.signupForm.imap_server || 'imap.gmail.com',
          imap_port: parseInt(this.signupForm.imap_port) || 993,
          smtp_server: this.signupForm.smtp_server || 'smtp.gmail.com',
          smtp_port: parseInt(this.signupForm.smtp_port) || 465
        };

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.status !== 200) {
          const err = await res.json();
          this.signupError = err.detail || 'Registration failed.';
          this.showToast('Registration failed: ' + this.signupError, 'error');
          return;
        }

        const data = await res.json();
        if (data.status === 'SUCCESS') {
          this.showToast('Account created and Automatic Mail Responder started!', 'success');
          
          this.selectedTenant = data.tenant_id;
          localStorage.setItem('selectedTenant', data.tenant_id);
          
          this.currentUserEmail = data.user.email;
          localStorage.setItem('currentUserEmail', data.user.email);
          this.isLoggedIn = true;
          localStorage.setItem('isLoggedIn', 'true');
          document.documentElement.classList.add('user-logged-in');
          document.documentElement.classList.remove('user-logged-out');
          this.selectedOperatorEmail = 'all';
          
          this.signupForm = {
            email: '', full_name: '', password: '', role: 'super_admin', business_name: '',
            business_type: 'Trading', industry: '', url: '', description_text: '',
            email_user: '', email_pass: '', imap_server: 'imap.gmail.com', imap_port: 993,
            smtp_server: 'smtp.gmail.com', smtp_port: 465, email_preset: 'gmail'
          };
          this.signupTestSuccess = null;
          this.signupTestMessage = '';
          this.loginTab = 'signin';
          
          this.loadTenants().then(() => {
            this.loadUsers().then(() => {
              this.fetchOverviewData();
              this.loadDeficits();
              this.loadNegotiations();
              this.loadActivityLog();
              this.showToast('Welcome, ' + this.currentUser.full_name + '!');
            });
          });
        }
      } catch (e) {
        this.signupError = 'Error: ' + e.message;
        this.showToast('Error registering: ' + e.message, 'error');
      } finally {
        this.signupLoading = false;
      }
    },

    logoutUser() {
      this.isLoggedIn = false;
      localStorage.removeItem('isLoggedIn');
      document.documentElement.classList.remove('user-logged-in');
      document.documentElement.classList.add('user-logged-out');
      localStorage.removeItem('currentUserEmail');
      this.currentUserEmail = '';
      this.currentUser = { email: '', role: '', full_name: '' };
      this.showToast('Logged out');
    },

    validateUserSession() {
      const savedEmail = localStorage.getItem('currentUserEmail');
      const savedLogin = localStorage.getItem('isLoggedIn');
      if (savedLogin === 'true' && savedEmail) {
        this.isLoggedIn = true;
        this.currentUserEmail = savedEmail;
        document.documentElement.classList.add('user-logged-in');
        document.documentElement.classList.remove('user-logged-out');
      } else {
        this.isLoggedIn = true;
        this.currentUserEmail = savedEmail || 'superadmin@trofeo.com';
        localStorage.setItem('currentUserEmail', this.currentUserEmail);
        localStorage.setItem('isLoggedIn', 'true');
        document.documentElement.classList.add('user-logged-in');
      }
    },

    getUserInitials(u) {
      if (!u) return 'OP';
      const name = (u.full_name || u.email || '').trim();
      if (!name) return 'OP';
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      if (name.includes('@')) {
        const handle = name.split('@')[0];
        return handle.substring(0, 2).toUpperCase();
      }
      if (name.length >= 2) {
        return name.substring(0, 2).toUpperCase();
      }
      return (name + 'P').toUpperCase();
    },

    switchUser(email) {
      this.currentUserEmail = email;
      localStorage.setItem('currentUserEmail', email);
      this.selectedOperatorEmail = 'all';
      
      this.loadUsers().then(() => {
        if (this.currentUser.role !== 'super_admin' && ['pricing', 'training', 'verticals', 'access'].includes(this.activeTab)) {
          this.activeTab = 'overview';
        }
        this.fetchOverviewData();
        this.loadDeficits();
        this.loadNegotiations();
        this.loadActivityLog();
        this.showToast('Switched session to ' + this.currentUser.full_name);
        this.$nextTick(() => {
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        });
      });
    },

    switchSelectedOperator(email) {
      this.selectedOperatorEmail = email;
      this.fetchOverviewData();
      this.loadDeficits();
      this.loadNegotiations();
      this.loadActivityLog();
      this.showToast(email === 'all' ? 'Showing all operator records' : 'Filtered to ' + email);
    },

    async triggerAutonomousFollowups() {
      try {
        const res = await this.safeFetch('/api/followups/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours_threshold: 0, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          const data = await res.json();
          this.showToast(data.message || 'Follow-ups checked & dispatched successfully!');
          this.fetchOverviewData();
        } else {
          const err = await res.json();
          this.showToast('Follow-up trigger notice: ' + (err.detail || 'no pending quotes'), 'info');
        }
      } catch (e) {
        this.showToast('Error checking follow-ups: ' + e.message, 'error');
      }
    },

    async saveUser(email, fullName, role, active = 1) {
      try {
        const res = await this.safeFetch('/api/users/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, full_name: fullName, role, active, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          this.showToast('User access level saved successfully!');
          this.loadUsers();
        } else {
          const err = await res.json();
          this.showToast('Failed to save user access level: ' + (err.detail || 'unknown error'), 'error');
        }
      } catch (e) {
        this.showToast('Failed to save user access level: ' + e.message, 'error');
      }
    },

    async deleteUser(email) {
      try {
        const res = await this.safeFetch('/api/users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, tenant_id: this.selectedTenant })
        });
        if (res.ok) {
          this.showToast('User access removed!');
          this.loadUsers();
        } else {
          const err = await res.json();
          this.showToast('Failed to remove user: ' + (err.detail || 'unknown error'), 'error');
        }
      } catch (e) {
        this.showToast('Failed to remove user: ' + e.message, 'error');
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
