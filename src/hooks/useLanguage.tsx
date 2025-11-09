import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "fr" | "en" | "zh" | "es" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traductions pour les pages publiques
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.publicData": "Données Publiques",
    "nav.news": "Actualités",
    "nav.awareness": "Sensibilisation",
    "nav.registry": "Registre Public",
    "nav.login": "Connexion",
    "nav.professionalSpace": "Espace Professionnel",
    
    // Hero
    "hero.title": "PÊCHE GABON",
    "hero.subtitle": "Excellence en Gestion Halieutique",
    "hero.description": "Une plateforme digitale de pointe pour une gestion durable et transparente des ressources halieutiques gabonaises. Nous offrons aux investisseurs un écosystème moderne, réglementé et propice à la croissance.",
    "hero.dataInvestment": "Données & Investissements",
    
    // Footer
    "footer.copyright": "© 2025 PÊCHE GABON - Ministère de la Pêche et de l'Aquaculture",
    "footer.dataUpdated": "Données mises à jour quotidiennement",
    
    // Common
    "common.learnMore": "En savoir plus",
    "common.download": "Télécharger",
    "common.back": "Retour",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.publicData": "Public Data",
    "nav.news": "News",
    "nav.awareness": "Awareness",
    "nav.registry": "Public Registry",
    "nav.login": "Login",
    "nav.professionalSpace": "Professional Space",
    
    // Hero
    "hero.title": "GABON FISHERIES",
    "hero.subtitle": "Excellence in Fisheries Management",
    "hero.description": "A cutting-edge digital platform for sustainable and transparent management of Gabonese fisheries resources. We offer investors a modern, regulated ecosystem conducive to growth.",
    "hero.dataInvestment": "Data & Investments",
    
    // Footer
    "footer.copyright": "© 2025 GABON FISHERIES - Ministry of Fisheries and Aquaculture",
    "footer.dataUpdated": "Data updated daily",
    
    // Common
    "common.learnMore": "Learn more",
    "common.download": "Download",
    "common.back": "Back",
  },
  zh: {
    // Navigation
    "nav.home": "首页",
    "nav.publicData": "公开数据",
    "nav.news": "新闻",
    "nav.awareness": "宣传",
    "nav.registry": "公共登记处",
    "nav.login": "登录",
    "nav.professionalSpace": "专业空间",
    
    // Hero
    "hero.title": "加蓬渔业",
    "hero.subtitle": "渔业管理卓越",
    "hero.description": "一个尖端的数字平台，用于可持续和透明地管理加蓬渔业资源。我们为投资者提供现代化、规范化的增长生态系统。",
    "hero.dataInvestment": "数据与投资",
    
    // Footer
    "footer.copyright": "© 2025 加蓬渔业 - 渔业和水产养殖部",
    "footer.dataUpdated": "每日更新数据",
    
    // Common
    "common.learnMore": "了解更多",
    "common.download": "下载",
    "common.back": "返回",
  },
  es: {
    // Navigation
    "nav.home": "Inicio",
    "nav.publicData": "Datos Públicos",
    "nav.news": "Noticias",
    "nav.awareness": "Sensibilización",
    "nav.registry": "Registro Público",
    "nav.login": "Iniciar sesión",
    "nav.professionalSpace": "Espacio Profesional",
    
    // Hero
    "hero.title": "PESCA GABÓN",
    "hero.subtitle": "Excelencia en Gestión Pesquera",
    "hero.description": "Una plataforma digital de vanguardia para la gestión sostenible y transparente de los recursos pesqueros gaboneses. Ofrecemos a los inversores un ecosistema moderno, regulado y propicio para el crecimiento.",
    "hero.dataInvestment": "Datos e Inversiones",
    
    // Footer
    "footer.copyright": "© 2025 PESCA GABÓN - Ministerio de Pesca y Acuicultura",
    "footer.dataUpdated": "Datos actualizados diariamente",
    
    // Common
    "common.learnMore": "Saber más",
    "common.download": "Descargar",
    "common.back": "Volver",
  },
  ar: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.publicData": "البيانات العامة",
    "nav.news": "الأخبار",
    "nav.awareness": "التوعية",
    "nav.registry": "السجل العام",
    "nav.login": "تسجيل الدخول",
    "nav.professionalSpace": "المساحة المهنية",
    
    // Hero
    "hero.title": "مصايد الأسماك الغابون",
    "hero.subtitle": "التميز في إدارة مصايد الأسماك",
    "hero.description": "منصة رقمية متطورة للإدارة المستدامة والشفافة لموارد مصايد الأسماك في الغابون. نحن نقدم للمستثمرين نظاماً بيئياً حديثاً ومنظماً ومواتياً للنمو.",
    "hero.dataInvestment": "البيانات والاستثمارات",
    
    // Footer
    "footer.copyright": "© 2025 مصايد الأسماك الغابون - وزارة مصايد الأسماك وتربية الأحياء المائية",
    "footer.dataUpdated": "يتم تحديث البيانات يومياً",
    
    // Common
    "common.learnMore": "اعرف المزيد",
    "common.download": "تحميل",
    "common.back": "رجوع",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "fr";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    // Mettre à jour la direction du texte pour l'arabe
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
