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
      { id: 'customers', label: 'CRM Segments', icon: 'users', badge: null, badgeColor: 'blue', description: 'Group and classify customers based on historical purchase volume and business value.' },
      { id: 'activity', label: 'Activity Log', icon: 'activity', badge: null, badgeColor: 'blue', description: 'Real-time event stream: every email received, quote generated, reply handled, and error logged with timestamps.' }
    ],
    
    activeTab: 'overview',
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
        'Search invoice, client, SKU…': 'Search invoice, client, SKU…',
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
        
        // Overview Tab Details
        'Operations Command Center': 'செயல்பாட்டு கட்டுப்பாட்டு மையம்',
        'Good morning': 'காலை வணக்கம்',
        'Good afternoon': 'மதிய வணக்கம்',
        'Good evening': 'மாலை வணக்கம்',
        'Good morning, Operator': 'காலை வணக்கம், இயக்குநர்',
        'Good afternoon, Operator': 'மதிய வணக்கம், இயக்குநர்',
        'Good evening, Operator': 'மாலை வணக்கம், இயக்குநர்',
        'enquiries handled all-time': 'இதுவரை கையாளப்பட்ட விசாரணைகள்',
        'Automation Rate': 'தானியங்கி வீதம்',
        'Processed Enquiries': 'செயலாக்கப்பட்ட விசாரணைகள்',
        'Total emails ingested': 'மொத்தம் பெறப்பட்ட மின்னஞ்சல்கள்',
        'Accuracy Score': 'துல்லிய மதிப்பெண்',
        'Matching engine precision': 'பொருத்த இயந்திரத் துல்லியம்',
        'Escalated Disputes': 'மேல்முறையீடு செய்யப்பட்டவை',
        'Requires operator review': 'இயக்குநரின் மதிப்பாய்வு தேவை',
        'Alt. Matches Found': 'மாற்றுப் பொருட்கள் கண்டறியப்பட்டது',
        'Deficit alternatives resolved': 'பற்றாக்குறை தீர்வுகள்',
        'Live Pipeline': 'நேரடி செயல்பாடுகள்',
        'Sales Intelligence': 'விற்பனைத் தகவல்',
        'Operations Split': 'செயல்பாட்டுப் பகிர்வு',
        'Operations Dispatcher Split': 'செயல்பாட்டுப் பகிர்வு வரைபடம்',
        'Ratio of automated responses vs. human-in-the-loop reviews': 'தானியங்கி பதில்கள் மற்றும் நேரடி மதிப்புரைகளின் விகிதம்',
        'Automated': 'தானியங்கி',
        'Auto-Responded': 'தானியங்கி பதிலளிப்பு',
        'Human Review': 'நேரடி மதிப்பாய்வு',
        'Total Received': 'மொத்தம் பெறப்பட்டவை',
        'all-time': 'இதுவரை',
        'Sales Intelligence & Leakage': 'விற்பனைத் தகவல் & கசிவு பகுப்பாய்வு',
        'Immediate operational insights, high-value clients, top quotes, and conversion leakages.': 'செயல்பாட்டு நுண்ணறிவு, முக்கிய வாடிக்கையாளர்கள் மற்றும் கசிவு பகுப்பாய்வு.',
        'Conversion Funnel & Leakage': 'மாற்றப் புனல் & கசிவு',
        'Total Ingested': 'மொத்தம் பெறப்பட்டவை',
        'Converted (Quotes Sent)': 'மாற்றப்பட்டது (அனுப்பப்பட்டவை)',
        'Leakage (Unmatched/Rejected)': 'கசிவு (பொருந்தாதவை/நிராகரிக்கப்பட்டவை)',
        'Leakage Analysis:': 'கசிவு பகுப்பாய்வு:',
        'Unmatched items:': 'பொருந்தாத பொருட்கள்:',
        'Rejected discounts:': 'நிராகரிக்கப்பட்ட தள்ளுபடிகள்:',
        'enquiries': 'விசாரணைகள்',
        'Top Customers': 'முக்கிய வாடிக்கையாளர்கள்',
        'Name / Email': 'பெயர் / மின்னஞ்சல்',
        'Quotes': 'விலைப்பட்டியல்கள்',
        'Value': 'மதிப்பு',
        'No customers record': 'வாடிக்கையாளர் பதிவுகள் இல்லை',
        'Top Quotations': 'முக்கிய விலைப்பட்டியல்கள்',
        'Quote ID': 'விலைப்பட்டியல் எண்',
        'Customer': 'வாடிக்கையாளர்',
        'Total': 'மொத்தம்',
        'No quotations record': 'விலைப்பட்டியல் பதிவுகள் இல்லை',
        'Live Operations Pipeline': 'நேரடி செயல்பாட்டு வரிசை',
        'Refreshing…': 'புதுப்பிக்கப்படுகிறது...',
        'Auto-refresh every 10s': 'ஒவ்வொரு 10 வினாடிக்கும் புதுப்பிக்கப்படும்',
        'Last updated:': 'கடைசியாக புதுப்பிக்கப்பட்டது:',
        'Refresh Now': 'இப்போது புதுப்பி',
        'New Mail': 'புதிய மின்னஞ்சல்',
        'Reply': 'பதில்',
        'Customer Request': 'வாடிக்கையாளர் கோரிக்கை',
        'Rejected': 'நிராகரிக்கப்பட்டவை',
        'Pending': 'நிலுவையில் உள்ளவை',
        'New Request': 'புதிய கோரிக்கை',
        'View Request': 'கோரிக்கையைப் பார்',
        'Auto-Quoted': 'தானியங்கி விலைப்பட்டியல்',
        'View Thread': 'பின்னணி விபரங்கள்',
        'View Quote': 'விலைப்பட்டியலைப் பார்',
        'Replied': 'பதிலளித்தார்',
        'Escalated': 'மேல்முறையீடு',
        'Active': 'செயலில் உள்ளவை',
        'Decide': 'முடிவெடு',
        'Stock Shortage': 'இருப்பு பற்றாக்குறை',
        'Shortage:': 'பற்றாக்குறை:',
        'Resolve': 'தீர்வு காண்',
        'Draft Quotation': 'வரைவு விலைப்பட்டியல்',
        'Draft Amount:': 'வரைவு தொகை:',
        'Review': 'Review (மதிப்பாய்வு)',
        'Approve & Send': 'Approve & Send (அனுப்பு)',
        'Unmatched': 'பொருந்தாதவை',
        'View': 'பார்',
        'All clear': 'அனைத்தும் சரி',
        "Today's Enquiries": 'இன்றைய விசாரணைகள்',
        "Yesterday's Enquiries": 'நேற்றைய விசாரணைகள்',
        'emails': 'மின்னஞ்சல்கள்',
        'No enquiries recorded.': 'விசாரணைகள் ஏதும் இல்லை.',
        'Export': 'ஏற்றுமதி செய்க',
        'Search deficits...': 'தேடுக...',
        'Refresh': 'புதுப்பி',
        'Responded': 'பதிலளிக்கப்பட்டவை',
        
        // Deficits Tab Details
        'Inventory Fulfillment': 'சரக்கு இருப்பு மேலாண்மை',
        'Stock Deficits': 'இருப்பு பற்றாக்குறைகள்',
        'Match alternatives and clear out-of-stock order lines before they stall a quotation.': 'மாற்றுப் பொருட்களைப் பொருத்தி, தடையற்ற விலைப்பட்டியலை உறுதி செய்யவும்.',
        'Outstanding Deficits': 'நிலுவையில் உள்ள பற்றாக்குறைகள்',
        'Resolved Matches': 'தீர்வு காணப்பட்டவை',
        'Affected SKUs': 'பாதிக்கப்பட்ட தயாரிப்புகள்',
        'Customers Waiting': 'காத்திருக்கும் வாடிக்கையாளர்கள்',
        'Outstanding Stock Deficit Queue': 'நிலுவையில் உள்ள பற்றாக்குறை வரிசை',
        'Invoice ID': 'விலைப்பட்டியல் எண்',
        'Missing Catalog SKU': 'பற்றாக்குறை உள்ள தயாரிப்பு',
        'Customer Name & Contact': 'வாடிக்கையாளர் பெயர் & தொடர்பு',
        'Qty Shortage': 'பற்றாக்குறை அளவு',
        'Stock Status': 'இருப்பு நிலை',
        'Status': 'நிலை',
        'Operation Action': 'செயல்பாடு',
        'No deficits or stock shortages detected.': 'இருப்பு பற்றாக்குறைகள் ஏதும் இல்லை.',
        'Resolve Match': 'தீர்வு காண்',
        'Done': 'முடிந்தது',
        
        // Negotiations Tab Details
        'Deal Optimization': 'ஒப்பந்த உகப்பாக்கம்',
        'Escalated Negotiations': 'பேச்சுவார்த்தைகள்',
        'Review and approve custom discounts requested by high-value customers.': 'முக்கிய வாடிக்கையாளர்களின் சிறப்புத் தள்ளுபடி கோரிக்கைகளை அங்கீகரிக்கவும்.',
        'Outstanding Requests': 'நிலுவையில் உள்ள கோரிக்கைகள்',
        'Average Discount': 'சராசரி தள்ளுபடி',
        'Conversion Potential': 'மாற்ற சாத்தியக்கூறு',
        'Dispute Resolution Queue': 'தீர்வு வரிசை',
        'Requested Discount': 'கோரப்பட்ட தள்ளுபடி',
        'Approve': 'அங்கீகரி',
        'Reject': 'நிராகரி',
        'No pending negotiations escalated.': 'நிலுவையில் உள்ள பேச்சுவார்த்தைகள் ஏதும் இல்லை.',
        
        // Inventory Tab Details
        'Stock Overview': 'சரக்கு இருப்பு கண்ணோட்டம்',
        'Catalog Inventory': 'தயாரிப்பு இருப்புப் பட்டியல்',
        'Manage items, stock counts, categories, and verify base pricing.': 'தயாரிப்புகள், இருப்பு அளவுகள் மற்றும் விலைகளை நிர்வகிக்கவும்.',
        'Total Items': 'மொத்த தயாரிப்புகள்',
        'Low Stock Items': 'குறைந்த இருப்பு தயாரிப்புகள்',
        'Total Inventory Value': 'மொத்த இருப்பு மதிப்பு',
        'Master Catalog Queue': 'மாஸ்டர் தயாரிப்பு பட்டியல்',
        'Search inventory...': 'தேடுக...',
        'SKU ID': 'தயாரிப்பு குறியீடு',
        'Product Name': 'தயாரிப்பு பெயர்',
        'Category': 'பிரிவு',
        'In Stock Qty': 'இருப்பு அளவு',
        'Base Price': 'அடிப்படை விலை',
        'Out of Stock': 'இருப்பு இல்லை',
        'In Stock': 'இருப்பில் உள்ளது',
        
        // Pricing Tab Details
        'Contract Configuration': 'ஒப்பந்த கட்டமைப்பு',
        'Dynamic Contract Pricing': 'விலை நிர்ணயம்',
        'Define client-specific pricing rules, volume discounts, and service tiers.': 'வாடிக்கையாளர் ஒப்பந்த விலைகள் மற்றும் தள்ளுபடி விதிகளை நிர்வகிக்கவும்.',
        'Active Rules': 'செயலில் உள்ள விதிகள்',
        'Global Discounts': 'பொதுவான தள்ளுபடிகள்',
        'Contract Rules Queue': 'ஒப்பந்த விதிகள் வரிசை',
        'Client Name': 'வாடிக்கையாளர் பெயர்',
        'Rule Type': 'விதி வகை',
        'Details': 'விவரங்கள்',
        'No active contract rules defined.': 'விலை ஒப்பந்த விதிகள் ஏதும் இல்லை.',
        
        // AI Onboarding Tab Details
        'Autonomous AI': 'தன்னாட்சி செயற்கை நுண்ணறிவு',
        'AI Onboarding & Rules': 'AI சேர்க்கை & விதிகள்',
        'Configure vertical specific business descriptions, catalogs, contact credentials and training prompts.': 'செயல்பாட்டுப் பிரிவுகளின் வணிக விளக்கங்கள் மற்றும் விதிகளை நிர்வகிக்கவும்.',
        'Active Verticals': 'செயலில் உள்ள பிரிவுகள்',
        'System Prompts': 'அமைப்பு அறிவுறுத்தல்கள்',
        'Registered Clients': 'பதிவு செய்யப்பட்ட வாடிக்கையாளர்கள்',
        'Vertical Configurations': 'பிரிவு அமைப்புகள்',
        'Configure parameters': 'அளவீடுகளை அமைக்கவும்',
        'Vertical Name': 'பிரிவின் பெயர்',
        'Business Model': 'வணிக வகை',
        'Support Email': 'ஆதரவு மின்னஞ்சல்',
        'SMTP Username': 'SMTP பயனர்',
        'Status Code': 'நிலை',
        
        // CRM Segments Tab Details
        'CRM Directory': 'வாடிக்கையாளர் அடைவு',
        'CRM Client Directory': 'வாடிக்கையாளர் பட்டியல்',
        'Segment and view registered clients, contact logs, and history.': 'வாடிக்கையாளர் விபரங்கள் மற்றும் கொள்முதல் வரலாற்றைக் கண்காணிக்கவும்.',
        'Client Base': 'வாடிக்கையாளர் எண்ணிக்கை',
        'VIP Tier': 'வி.ஐ.பி பிரிவு',
        'Regular Tier': 'சாதாரண பிரிவு',
        'CRM Client Segment Base': 'வாடிக்கையாளர் தகவல் தளம்',
        'Company': 'நிறுவனம்',
        'Contact Phone': 'தொலைபேசி எண்',
        'Contact Email': 'மின்னஞ்சல் முகவரி',
        'Registered At': 'பதிவு செய்யப்பட்ட தேதி',
        'Segment': 'பிரிவு',
        'No clients registered.': 'வாடிக்கையாளர்கள் ஏதும் பதிவு செய்யப்படவில்லை.',

        // AI Training Tab Details
        'AI Learning': 'AI கற்றல்',
        'AI Relevance Training': 'AI பயிற்சி',
        'Train the relevance filter by defining product categories, intent signals, and synonyms.': 'பொருந்தும் தயாரிப்புகள் மற்றும் ஒத்த சொற்களின் மூலம் AI-க்குப் பயிற்சியளிக்கவும்.',
        'Keywords Trained': 'பயிற்சியளிக்கப்பட்ட சொற்கள்',
        'Synonyms Map': 'ஒத்த சொற்கள் வரைபடம்',
        'Intent Keywords': 'நோக்கச் சொற்கள்',
        'Intent Signals': 'நோக்க சிக்னல்கள்',
        'Synonyms List': 'ஒத்த சொற்கள் பட்டியல்',
        'Original Term': 'அசல் சொல்',
        'Mapped Catalog Term': 'பொருத்தப்பட்ட சொல்',
        'No training synonyms found.': 'ஒத்த சொற்கள் ஏதும் இல்லை.',

        // Activity Log Tab Details
        'Event Console': 'நிகழ்வு கன்சோல்',
        'Activity Log Console': 'செயல்பாட்டு கன்சோல்',
        'Real-time event stream of email processes, quote dispatches, and system errors.': 'மின்னஞ்சல் செயலாக்கம் மற்றும் கணினி நிகழ்வுகளின் நேரடி பதிவு.',
        'Total Logs': 'மொத்த பதிவுகள்',
        'Warning Events': 'எச்சரிக்கை நிகழ்வுகள்',
        'Error Events': 'பிழை நிகழ்வுகள்',
        'System Event Stream Log': 'கணினி நிகழ்வு பதிவு',
        'Timestamp': 'நேரம்',
        'Event Message': 'நிகழ்வு செய்தி',
        'Severity': 'தீவிரம்',
        'No events logged in database.': 'நிகழ்வுப் பதிவுகள் ஏதும் இல்லை.'
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
          if (trimmed && dict[trimmed]) {
            if (!node.parentElement.dataset.origText) {
              node.parentElement.dataset.origText = node.nodeValue;
            }
            node.nodeValue = node.nodeValue.replace(trimmed, dict[trimmed]);
          } else if (trimmed && !isTa && node.parentElement && node.parentElement.dataset.origText) {
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
      document.title = lang === 'ta' ? "Trofeo Hardware — நிர்வாகக் கட்டுப்பாட்டு குழு" : "Trofeo Hardware — Admin Control Panel";
      this.translateDOM();
      this.$nextTick(() => {
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      });
    },
    theme: 'warm',
    selectedTenant: 'default',
    tenants: [{ id: 'default', name: 'Trofeo Hardware Branch' }],
    invoiceFilter: '',
    deficitsSearch: '',
    negSearch: '',
    
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
      
      // Initialize DOM translation observer
      this.$nextTick(() => {
        if (this.language === 'ta') {
          document.title = "Trofeo Hardware — நிர்வாகக் கட்டுப்பாட்டு குழு";
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
        rows.push(['Reply', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', 'Customer Replied', m.timestamp || '—']);
      });
      this.getFilteredList(this.negotiations).forEach(m => {
        rows.push(['Customer Request', m.invoice_id || '—', m.customer_name || '—', m.customer_email || '—', `Requested: ${Math.round(m.discount_pct*100)}%`, m.created_at || '—']);
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
        sku.sku_name || '—',
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
