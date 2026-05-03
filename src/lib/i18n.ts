import type { Locale } from '../context/SettingsContext';

type Dict = Record<string, string>;

const en: Dict = {
  // generic
  'app.name': 'Liora',
  'app.tagline': 'AI Food & Lifestyle Concierge',
  'common.search': 'Search restaurants, cuisines…',
  'common.signIn': 'Sign In',
  'common.signOut': 'Sign Out',
  'common.getStarted': 'Get Started',
  'common.continue': 'Continue',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.settings': 'Settings',
  'common.close': 'Close',
  'common.viewAll': 'View all',
  'common.seeAll': 'See all',
  'common.back': 'Back',

  // greetings
  'greet.morning':   'Good morning',
  'greet.afternoon': 'Good afternoon',
  'greet.evening':   'Good evening',
  'greet.welcome':   'Welcome back',

  // home
  'home.mood': 'What are you in the mood for?',
  'home.quickAccess': 'Quick Access',
  'home.restaurants': 'Restaurants',
  'home.deals': 'Deals & Offers',
  'home.recentOrders': 'Recent Orders',
  'home.askLiora': 'Ask Liora anything',
  'home.askLioraSub': 'Your personal AI dining assistant',

  // settings panel
  'settings.title': 'Personalize Liora',
  'settings.subtitle': 'Make it yours. Changes save instantly.',
  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.accent': 'Accent color',
  'settings.accent.custom': 'Custom hex',
  'settings.density': 'Density',
  'settings.density.compact': 'Compact',
  'settings.density.comfortable': 'Comfortable',
  'settings.density.spacious': 'Spacious',
  'settings.layout': 'Layout',
  'settings.layout.expanded': 'Expanded sidebar',
  'settings.layout.collapsed': 'Collapsed (icon only)',
  'settings.locale': 'Language',
  'settings.brand': 'Brand override',
  'settings.brand.primary': 'Primary color',
  'settings.brand.logo': 'Logo URL',
  'settings.brand.name': 'Display name',
  'settings.reset': 'Reset to defaults',

  // nav groups
  'nav.discover': 'Discover',
  'nav.orders': 'Orders',
  'nav.lifestyle': 'Lifestyle',
  'nav.proTools': 'Pro Tools',
  'nav.you': 'You',
};

const es: Dict = {
  ...en,
  'common.signIn': 'Iniciar sesión',
  'common.signOut': 'Cerrar sesión',
  'common.getStarted': 'Comenzar',
  'common.continue': 'Continuar',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.settings': 'Ajustes',
  'common.close': 'Cerrar',
  'common.search': 'Buscar restaurantes, cocinas…',
  'greet.morning': 'Buenos días',
  'greet.afternoon': 'Buenas tardes',
  'greet.evening': 'Buenas noches',
  'greet.welcome': 'Bienvenido de nuevo',
  'home.mood': '¿Qué te apetece hoy?',
  'home.quickAccess': 'Acceso rápido',
  'home.restaurants': 'Restaurantes',
  'home.deals': 'Ofertas',
  'home.recentOrders': 'Pedidos recientes',
  'home.askLiora': 'Pregunta a Liora',
  'home.askLioraSub': 'Tu asistente personal',
  'settings.title': 'Personaliza Liora',
  'settings.subtitle': 'Hazlo tuyo. Los cambios se guardan al instante.',
  'settings.appearance': 'Apariencia',
  'settings.theme': 'Tema',
  'settings.accent': 'Color de acento',
  'settings.density': 'Densidad',
  'settings.layout': 'Diseño',
  'settings.locale': 'Idioma',
  'settings.brand': 'Marca personalizada',
  'settings.reset': 'Restablecer',
};

const fr: Dict = {
  ...en,
  'common.signIn': 'Se connecter',
  'common.signOut': 'Se déconnecter',
  'common.getStarted': 'Commencer',
  'common.settings': 'Paramètres',
  'common.search': 'Rechercher restaurants, cuisines…',
  'greet.morning': 'Bonjour',
  'greet.afternoon': 'Bon après-midi',
  'greet.evening': 'Bonsoir',
  'greet.welcome': 'Bon retour',
  'home.mood': "Que voulez-vous aujourd'hui ?",
  'home.quickAccess': 'Accès rapide',
  'settings.title': 'Personnaliser Liora',
  'settings.theme': 'Thème',
  'settings.accent': "Couleur d'accent",
  'settings.density': 'Densité',
  'settings.layout': 'Disposition',
  'settings.locale': 'Langue',
};

const hi: Dict = {
  ...en,
  'common.signIn': 'साइन इन',
  'common.signOut': 'साइन आउट',
  'common.getStarted': 'शुरू करें',
  'common.settings': 'सेटिंग्स',
  'greet.morning': 'सुप्रभात',
  'greet.afternoon': 'नमस्ते',
  'greet.evening': 'शुभ संध्या',
  'greet.welcome': 'पुनः स्वागत है',
  'home.mood': 'आज आपका क्या मन है?',
  'settings.title': 'लियोरा को निजीकृत करें',
};

const ar: Dict = {
  ...en,
  'common.signIn': 'تسجيل الدخول',
  'common.signOut': 'تسجيل الخروج',
  'common.getStarted': 'ابدأ',
  'common.settings': 'الإعدادات',
  'greet.morning': 'صباح الخير',
  'greet.afternoon': 'مساء الخير',
  'greet.evening': 'مساء الخير',
  'greet.welcome': 'مرحباً بعودتك',
  'home.mood': 'ماذا تشتهي اليوم؟',
  'settings.title': 'خصص ليورا',
};

const dictionaries: Record<Locale, Dict> = { en, es, fr, hi, ar };

export function t(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? en[key] ?? key;
}
