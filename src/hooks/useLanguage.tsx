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
    
    // Public Data Page
    "publicData.hero.title": "Transparence & Données Ouvertes",
    "publicData.hero.description": "Accédez aux données officielles du secteur halieutique gabonais. Des informations fiables pour vos études, analyses et décisions d'investissement.",
    "publicData.stats.totalCaptures": "Captures Totales",
    "publicData.stats.totalRevenue": "Recettes Totales",
    "publicData.stats.activeLicenses": "Licences Actives",
    "publicData.stats.fishermen": "Pêcheurs",
    "publicData.stats.currentYear": "Année en cours",
    "publicData.stats.professionals": "Professionnels",
    "publicData.stats.registered": "Enregistrés",
    "publicData.categories.title": "Catégories de Données",
    "publicData.categories.captures": "Statistiques de Captures",
    "publicData.categories.capturesDesc": "Données détaillées sur les captures par espèce, zone et période",
    "publicData.categories.financial": "Données Financières",
    "publicData.categories.financialDesc": "Recettes, taxes et indicateurs économiques du secteur",
    "publicData.categories.licenses": "Licences & Conformité",
    "publicData.categories.licensesDesc": "État des licences et taux de conformité réglementaire",
    "publicData.categories.fleet": "Flotte de Pêche",
    "publicData.categories.fleetDesc": "Recensement des navires et pirogues en activité",
    "publicData.categories.species": "Espèces Marines",
    "publicData.categories.speciesDesc": "Catalogue des espèces avec statut de conservation",
    "publicData.categories.surveillance": "Surveillance Maritime",
    "publicData.categories.surveillanceDesc": "Rapports d'inspections et infractions constatées",
    "publicData.investment.title": "Investir dans le Secteur Halieutique Gabonais",
    "publicData.investment.description": "Le Gabon offre un cadre stable et transparent pour les investissements dans la pêche. Contactez-nous pour découvrir les opportunités disponibles.",
    "publicData.investment.createAccount": "Créer un Compte Professionnel",
    "publicData.investment.downloadGuide": "Télécharger le Guide d'Investissement",
    
    // News Page
    "news.hero.title": "Actualités du Secteur",
    "news.hero.description": "Suivez les dernières nouvelles, réglementations et développements du secteur halieutique gabonais.",
    "news.readMore": "Lire la suite",
    "news.loadMore": "Charger plus d'articles",
    "news.newsletter.title": "Restez Informé",
    "news.newsletter.description": "Inscrivez-vous à notre newsletter pour recevoir les dernières actualités directement dans votre boîte mail.",
    "news.newsletter.placeholder": "Votre adresse email",
    "news.newsletter.subscribe": "S'inscrire",
    
    // Awareness Page
    "awareness.hero.title": "Pêche Durable",
    "awareness.hero.description": "Ensemble pour préserver nos ressources marines et garantir un avenir durable aux générations futures.",
    "awareness.responsible.title": "Pêche Responsable",
    "awareness.responsible.description": "Respecter les tailles minimales, les quotas et les périodes de repos biologique pour assurer la régénération des espèces.",
    "awareness.ecosystem.title": "Protection des Écosystèmes",
    "awareness.ecosystem.description": "Préserver les zones de reproduction, les mangroves et les habitats marins essentiels à la biodiversité.",
    "awareness.illegal.title": "Lutte contre la Pêche Illégale",
    "awareness.illegal.description": "Signaler les activités suspectes et respecter les réglementations pour protéger nos ressources communes.",
    "awareness.practices.title": "Bonnes Pratiques",
    "awareness.practices.fishermen": "Pour les Pêcheurs",
    "awareness.practices.fishermenDesc": "Adoptez des pratiques durables au quotidien",
    "awareness.practices.consumers": "Pour les Consommateurs",
    "awareness.practices.consumersDesc": "Consommez de manière responsable",
    "awareness.threatened.title": "Espèces Menacées",
    "awareness.threatened.description": "Certaines espèces marines sont en danger critique. Leur pêche est strictement réglementée ou interdite. Respectons ces mesures pour préserver notre patrimoine marin.",
    "awareness.threatened.forbidden": "Pêche Interdite",
    "awareness.threatened.protected": "Protégée",
    "awareness.resources.title": "Ressources & Documentation",
    "awareness.resources.guide": "Guide du Pêcheur Responsable",
    "awareness.resources.guideDesc": "Manuel complet des bonnes pratiques de pêche durable",
    "awareness.resources.regulations": "Réglementation en Vigueur",
    "awareness.resources.regulationsDesc": "Toutes les règles et lois sur la pêche au Gabon",
    "awareness.resources.calendar": "Calendrier des Formations",
    "awareness.resources.calendarDesc": "Participez aux sessions de formation gratuite",
    "awareness.resources.downloadPdf": "Télécharger PDF",
    "awareness.resources.consult": "Consulter",
    "awareness.resources.viewCalendar": "Voir le calendrier",
    "awareness.cta.title": "Agissons Ensemble",
    "awareness.cta.description": "Chaque geste compte pour préserver nos océans. Rejoignez le mouvement pour une pêche durable au Gabon.",
    "awareness.cta.engage": "S'engager",
    "awareness.cta.report": "Signaler une Infraction",
    
    // Registry Page
    "registry.title": "Registre Public des Documents Ministériels",
    "registry.subtitle": "Transparence Administrative - Ministère de la Pêche et de l'Aquaculature",
    "registry.search.title": "Rechercher des documents",
    "registry.search.description": "Recherchez parmi {count} document(s) publié(s)",
    "registry.search.placeholder": "Rechercher par titre, objet, référence ou contenu...",
    "registry.search.allTypes": "Tous les types",
    "registry.search.resultsCount": "{count} document(s) trouvé(s)",
    "registry.loading": "Chargement des documents...",
    "registry.noResults": "Aucun document ne correspond à votre recherche",
    "registry.noDocuments": "Aucun document publié pour le moment",
    "registry.downloadBtn": "Télécharger",
    "registry.published": "Publié le",
    "registry.signatories": "Signataires",
    "registry.recipients": "Destinataires",
    "registry.backHome": "Retour à l'accueil",
    "registry.subscribe": "S'abonner aux notifications",
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
    
    // Public Data Page
    "publicData.hero.title": "Transparency & Open Data",
    "publicData.hero.description": "Access official data from the Gabonese fisheries sector. Reliable information for your studies, analyses and investment decisions.",
    "publicData.stats.totalCaptures": "Total Catches",
    "publicData.stats.totalRevenue": "Total Revenue",
    "publicData.stats.activeLicenses": "Active Licenses",
    "publicData.stats.fishermen": "Fishermen",
    "publicData.stats.currentYear": "Current year",
    "publicData.stats.professionals": "Professionals",
    "publicData.stats.registered": "Registered",
    "publicData.categories.title": "Data Categories",
    "publicData.categories.captures": "Catch Statistics",
    "publicData.categories.capturesDesc": "Detailed data on catches by species, area and period",
    "publicData.categories.financial": "Financial Data",
    "publicData.categories.financialDesc": "Revenue, taxes and economic indicators for the sector",
    "publicData.categories.licenses": "Licenses & Compliance",
    "publicData.categories.licensesDesc": "License status and regulatory compliance rates",
    "publicData.categories.fleet": "Fishing Fleet",
    "publicData.categories.fleetDesc": "Census of active vessels and canoes",
    "publicData.categories.species": "Marine Species",
    "publicData.categories.speciesDesc": "Species catalog with conservation status",
    "publicData.categories.surveillance": "Maritime Surveillance",
    "publicData.categories.surveillanceDesc": "Inspection reports and recorded violations",
    "publicData.investment.title": "Invest in Gabonese Fisheries Sector",
    "publicData.investment.description": "Gabon offers a stable and transparent framework for fisheries investments. Contact us to discover available opportunities.",
    "publicData.investment.createAccount": "Create Professional Account",
    "publicData.investment.downloadGuide": "Download Investment Guide",
    
    // News Page
    "news.hero.title": "Sector News",
    "news.hero.description": "Follow the latest news, regulations and developments in the Gabonese fisheries sector.",
    "news.readMore": "Read more",
    "news.loadMore": "Load more articles",
    "news.newsletter.title": "Stay Informed",
    "news.newsletter.description": "Subscribe to our newsletter to receive the latest news directly in your inbox.",
    "news.newsletter.placeholder": "Your email address",
    "news.newsletter.subscribe": "Subscribe",
    
    // Awareness Page
    "awareness.hero.title": "Sustainable Fishing",
    "awareness.hero.description": "Together to preserve our marine resources and ensure a sustainable future for generations to come.",
    "awareness.responsible.title": "Responsible Fishing",
    "awareness.responsible.description": "Respect minimum sizes, quotas and biological rest periods to ensure species regeneration.",
    "awareness.ecosystem.title": "Ecosystem Protection",
    "awareness.ecosystem.description": "Preserve breeding areas, mangroves and marine habitats essential to biodiversity.",
    "awareness.illegal.title": "Fight Against Illegal Fishing",
    "awareness.illegal.description": "Report suspicious activities and comply with regulations to protect our common resources.",
    "awareness.practices.title": "Best Practices",
    "awareness.practices.fishermen": "For Fishermen",
    "awareness.practices.fishermenDesc": "Adopt sustainable practices daily",
    "awareness.practices.consumers": "For Consumers",
    "awareness.practices.consumersDesc": "Consume responsibly",
    "awareness.threatened.title": "Threatened Species",
    "awareness.threatened.description": "Some marine species are critically endangered. Their fishing is strictly regulated or prohibited. Let's respect these measures to preserve our marine heritage.",
    "awareness.threatened.forbidden": "Fishing Prohibited",
    "awareness.threatened.protected": "Protected",
    "awareness.resources.title": "Resources & Documentation",
    "awareness.resources.guide": "Responsible Fisher's Guide",
    "awareness.resources.guideDesc": "Complete handbook of sustainable fishing best practices",
    "awareness.resources.regulations": "Current Regulations",
    "awareness.resources.regulationsDesc": "All fishing rules and laws in Gabon",
    "awareness.resources.calendar": "Training Calendar",
    "awareness.resources.calendarDesc": "Participate in free training sessions",
    "awareness.resources.downloadPdf": "Download PDF",
    "awareness.resources.consult": "Consult",
    "awareness.resources.viewCalendar": "View calendar",
    "awareness.cta.title": "Let's Act Together",
    "awareness.cta.description": "Every action counts to preserve our oceans. Join the movement for sustainable fishing in Gabon.",
    "awareness.cta.engage": "Get Involved",
    "awareness.cta.report": "Report a Violation",
    
    // Registry Page
    "registry.title": "Public Registry of Ministerial Documents",
    "registry.subtitle": "Administrative Transparency - Ministry of Fisheries and Aquaculture",
    "registry.search.title": "Search documents",
    "registry.search.description": "Search among {count} published document(s)",
    "registry.search.placeholder": "Search by title, subject, reference or content...",
    "registry.search.allTypes": "All types",
    "registry.search.resultsCount": "{count} document(s) found",
    "registry.loading": "Loading documents...",
    "registry.noResults": "No document matches your search",
    "registry.noDocuments": "No document published yet",
    "registry.downloadBtn": "Download",
    "registry.published": "Published on",
    "registry.signatories": "Signatories",
    "registry.recipients": "Recipients",
    "registry.backHome": "Back to home",
    "registry.subscribe": "Subscribe to notifications",
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
    
    // Public Data Page
    "publicData.hero.title": "透明与开放数据",
    "publicData.hero.description": "访问加蓬渔业部门的官方数据。为您的研究、分析和投资决策提供可靠信息。",
    "publicData.stats.totalCaptures": "总捕获量",
    "publicData.stats.totalRevenue": "总收入",
    "publicData.stats.activeLicenses": "有效许可证",
    "publicData.stats.fishermen": "渔民",
    "publicData.stats.currentYear": "本年度",
    "publicData.stats.professionals": "专业人士",
    "publicData.stats.registered": "已登记",
    "publicData.categories.title": "数据类别",
    "publicData.categories.captures": "捕获统计",
    "publicData.categories.capturesDesc": "按物种、区域和时期的详细捕获数据",
    "publicData.categories.financial": "财务数据",
    "publicData.categories.financialDesc": "该行业的收入、税收和经济指标",
    "publicData.categories.licenses": "许可证和合规性",
    "publicData.categories.licensesDesc": "许可证状态和监管合规率",
    "publicData.categories.fleet": "渔船队",
    "publicData.categories.fleetDesc": "活跃船只和独木舟的普查",
    "publicData.categories.species": "海洋物种",
    "publicData.categories.speciesDesc": "物种目录及保护状况",
    "publicData.categories.surveillance": "海上监视",
    "publicData.categories.surveillanceDesc": "检查报告和记录的违规行为",
    "publicData.investment.title": "投资加蓬渔业部门",
    "publicData.investment.description": "加蓬为渔业投资提供稳定透明的框架。请与我们联系以了解可用机会。",
    "publicData.investment.createAccount": "创建专业账户",
    "publicData.investment.downloadGuide": "下载投资指南",
    
    // News Page
    "news.hero.title": "行业新闻",
    "news.hero.description": "关注加蓬渔业部门的最新新闻、法规和发展。",
    "news.readMore": "阅读更多",
    "news.loadMore": "加载更多文章",
    "news.newsletter.title": "保持了解",
    "news.newsletter.description": "订阅我们的新闻通讯，直接在您的收件箱中接收最新新闻。",
    "news.newsletter.placeholder": "您的电子邮件地址",
    "news.newsletter.subscribe": "订阅",
    
    // Awareness Page
    "awareness.hero.title": "可持续捕鱼",
    "awareness.hero.description": "共同保护我们的海洋资源，确保子孙后代的可持续未来。",
    "awareness.responsible.title": "负责任的捕鱼",
    "awareness.responsible.description": "尊重最小尺寸、配额和生物休养期，以确保物种再生。",
    "awareness.ecosystem.title": "生态系统保护",
    "awareness.ecosystem.description": "保护繁殖区、红树林和对生物多样性至关重要的海洋栖息地。",
    "awareness.illegal.title": "打击非法捕鱼",
    "awareness.illegal.description": "报告可疑活动并遵守法规以保护我们的共同资源。",
    "awareness.practices.title": "最佳实践",
    "awareness.practices.fishermen": "给渔民",
    "awareness.practices.fishermenDesc": "每天采用可持续做法",
    "awareness.practices.consumers": "给消费者",
    "awareness.practices.consumersDesc": "负责任地消费",
    "awareness.threatened.title": "濒危物种",
    "awareness.threatened.description": "一些海洋物种处于极度濒危状态。它们的捕捞受到严格管制或禁止。让我们尊重这些措施以保护我们的海洋遗产。",
    "awareness.threatened.forbidden": "禁止捕鱼",
    "awareness.threatened.protected": "受保护",
    "awareness.resources.title": "资源与文档",
    "awareness.resources.guide": "负责任渔民指南",
    "awareness.resources.guideDesc": "可持续捕鱼最佳实践完整手册",
    "awareness.resources.regulations": "现行法规",
    "awareness.resources.regulationsDesc": "加蓬所有捕鱼规则和法律",
    "awareness.resources.calendar": "培训日历",
    "awareness.resources.calendarDesc": "参加免费培训课程",
    "awareness.resources.downloadPdf": "下载PDF",
    "awareness.resources.consult": "咨询",
    "awareness.resources.viewCalendar": "查看日历",
    "awareness.cta.title": "让我们共同行动",
    "awareness.cta.description": "每一个行动都对保护我们的海洋很重要。加入加蓬可持续捕鱼运动。",
    "awareness.cta.engage": "参与",
    "awareness.cta.report": "报告违规行为",
    
    // Registry Page
    "registry.title": "部长文件公共登记处",
    "registry.subtitle": "行政透明 - 渔业和水产养殖部",
    "registry.search.title": "搜索文件",
    "registry.search.description": "在{count}个已发布文件中搜索",
    "registry.search.placeholder": "按标题、主题、参考或内容搜索...",
    "registry.search.allTypes": "所有类型",
    "registry.search.resultsCount": "找到{count}个文件",
    "registry.loading": "正在加载文件...",
    "registry.noResults": "没有文件符合您的搜索",
    "registry.noDocuments": "目前尚未发布文件",
    "registry.downloadBtn": "下载",
    "registry.published": "发布于",
    "registry.signatories": "签署人",
    "registry.recipients": "收件人",
    "registry.backHome": "返回首页",
    "registry.subscribe": "订阅通知",
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
    
    // Public Data Page
    "publicData.hero.title": "Transparencia y Datos Abiertos",
    "publicData.hero.description": "Acceda a los datos oficiales del sector pesquero gabonés. Información confiable para sus estudios, análisis y decisiones de inversión.",
    "publicData.stats.totalCaptures": "Capturas Totales",
    "publicData.stats.totalRevenue": "Ingresos Totales",
    "publicData.stats.activeLicenses": "Licencias Activas",
    "publicData.stats.fishermen": "Pescadores",
    "publicData.stats.currentYear": "Año en curso",
    "publicData.stats.professionals": "Profesionales",
    "publicData.stats.registered": "Registrados",
    "publicData.categories.title": "Categorías de Datos",
    "publicData.categories.captures": "Estadísticas de Capturas",
    "publicData.categories.capturesDesc": "Datos detallados sobre capturas por especie, zona y período",
    "publicData.categories.financial": "Datos Financieros",
    "publicData.categories.financialDesc": "Ingresos, impuestos e indicadores económicos del sector",
    "publicData.categories.licenses": "Licencias y Cumplimiento",
    "publicData.categories.licensesDesc": "Estado de licencias y tasas de cumplimiento normativo",
    "publicData.categories.fleet": "Flota Pesquera",
    "publicData.categories.fleetDesc": "Censo de embarcaciones y canoas en actividad",
    "publicData.categories.species": "Especies Marinas",
    "publicData.categories.speciesDesc": "Catálogo de especies con estado de conservación",
    "publicData.categories.surveillance": "Vigilancia Marítima",
    "publicData.categories.surveillanceDesc": "Informes de inspecciones e infracciones registradas",
    "publicData.investment.title": "Invertir en el Sector Pesquero Gabonés",
    "publicData.investment.description": "Gabón ofrece un marco estable y transparente para las inversiones en pesca. Contáctenos para descubrir las oportunidades disponibles.",
    "publicData.investment.createAccount": "Crear Cuenta Profesional",
    "publicData.investment.downloadGuide": "Descargar Guía de Inversión",
    
    // News Page
    "news.hero.title": "Noticias del Sector",
    "news.hero.description": "Siga las últimas noticias, regulaciones y desarrollos del sector pesquero gabonés.",
    "news.readMore": "Leer más",
    "news.loadMore": "Cargar más artículos",
    "news.newsletter.title": "Manténgase Informado",
    "news.newsletter.description": "Suscríbase a nuestro boletín para recibir las últimas noticias directamente en su bandeja de entrada.",
    "news.newsletter.placeholder": "Su dirección de correo electrónico",
    "news.newsletter.subscribe": "Suscribirse",
    
    // Awareness Page
    "awareness.hero.title": "Pesca Sostenible",
    "awareness.hero.description": "Juntos para preservar nuestros recursos marinos y garantizar un futuro sostenible para las generaciones venideras.",
    "awareness.responsible.title": "Pesca Responsable",
    "awareness.responsible.description": "Respetar los tamaños mínimos, cuotas y períodos de descanso biológico para asegurar la regeneración de especies.",
    "awareness.ecosystem.title": "Protección de Ecosistemas",
    "awareness.ecosystem.description": "Preservar las zonas de reproducción, manglares y hábitats marinos esenciales para la biodiversidad.",
    "awareness.illegal.title": "Lucha Contra la Pesca Ilegal",
    "awareness.illegal.description": "Reportar actividades sospechosas y respetar las regulaciones para proteger nuestros recursos comunes.",
    "awareness.practices.title": "Buenas Prácticas",
    "awareness.practices.fishermen": "Para Pescadores",
    "awareness.practices.fishermenDesc": "Adopte prácticas sostenibles diariamente",
    "awareness.practices.consumers": "Para Consumidores",
    "awareness.practices.consumersDesc": "Consuma de manera responsable",
    "awareness.threatened.title": "Especies Amenazadas",
    "awareness.threatened.description": "Algunas especies marinas están en peligro crítico. Su pesca está estrictamente regulada o prohibida. Respetemos estas medidas para preservar nuestro patrimonio marino.",
    "awareness.threatened.forbidden": "Pesca Prohibida",
    "awareness.threatened.protected": "Protegida",
    "awareness.resources.title": "Recursos y Documentación",
    "awareness.resources.guide": "Guía del Pescador Responsable",
    "awareness.resources.guideDesc": "Manual completo de buenas prácticas de pesca sostenible",
    "awareness.resources.regulations": "Regulación Vigente",
    "awareness.resources.regulationsDesc": "Todas las reglas y leyes sobre pesca en Gabón",
    "awareness.resources.calendar": "Calendario de Formaciones",
    "awareness.resources.calendarDesc": "Participe en sesiones de formación gratuita",
    "awareness.resources.downloadPdf": "Descargar PDF",
    "awareness.resources.consult": "Consultar",
    "awareness.resources.viewCalendar": "Ver calendario",
    "awareness.cta.title": "Actuemos Juntos",
    "awareness.cta.description": "Cada acción cuenta para preservar nuestros océanos. Únase al movimiento por una pesca sostenible en Gabón.",
    "awareness.cta.engage": "Comprometerse",
    "awareness.cta.report": "Reportar una Infracción",
    
    // Registry Page
    "registry.title": "Registro Público de Documentos Ministeriales",
    "registry.subtitle": "Transparencia Administrativa - Ministerio de Pesca y Acuicultura",
    "registry.search.title": "Buscar documentos",
    "registry.search.description": "Buscar entre {count} documento(s) publicado(s)",
    "registry.search.placeholder": "Buscar por título, objeto, referencia o contenido...",
    "registry.search.allTypes": "Todos los tipos",
    "registry.search.resultsCount": "{count} documento(s) encontrado(s)",
    "registry.loading": "Cargando documentos...",
    "registry.noResults": "Ningún documento coincide con su búsqueda",
    "registry.noDocuments": "Ningún documento publicado por el momento",
    "registry.downloadBtn": "Descargar",
    "registry.published": "Publicado el",
    "registry.signatories": "Firmantes",
    "registry.recipients": "Destinatarios",
    "registry.backHome": "Volver al inicio",
    "registry.subscribe": "Suscribirse a notificaciones",
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
    
    // Public Data Page
    "publicData.hero.title": "الشفافية والبيانات المفتوحة",
    "publicData.hero.description": "الوصول إلى البيانات الرسمية من قطاع مصايد الأسماك في الغابون. معلومات موثوقة لدراساتك وتحليلاتك وقرارات الاستثمار.",
    "publicData.stats.totalCaptures": "إجمالي المصيد",
    "publicData.stats.totalRevenue": "إجمالي الإيرادات",
    "publicData.stats.activeLicenses": "التراخيص النشطة",
    "publicData.stats.fishermen": "الصيادون",
    "publicData.stats.currentYear": "السنة الحالية",
    "publicData.stats.professionals": "المحترفون",
    "publicData.stats.registered": "المسجلون",
    "publicData.categories.title": "فئات البيانات",
    "publicData.categories.captures": "إحصاءات المصيد",
    "publicData.categories.capturesDesc": "بيانات مفصلة عن المصيد حسب النوع والمنطقة والفترة",
    "publicData.categories.financial": "البيانات المالية",
    "publicData.categories.financialDesc": "الإيرادات والضرائب والمؤشرات الاقتصادية للقطاع",
    "publicData.categories.licenses": "التراخيص والامتثال",
    "publicData.categories.licensesDesc": "حالة التراخيص ومعدلات الامتثال التنظيمي",
    "publicData.categories.fleet": "أسطول الصيد",
    "publicData.categories.fleetDesc": "تعداد السفن والزوارق النشطة",
    "publicData.categories.species": "الأنواع البحرية",
    "publicData.categories.speciesDesc": "كتالوج الأنواع مع حالة الحفظ",
    "publicData.categories.surveillance": "المراقبة البحرية",
    "publicData.categories.surveillanceDesc": "تقارير التفتيش والانتهاكات المسجلة",
    "publicData.investment.title": "الاستثمار في قطاع مصايد الأسماك الغابوني",
    "publicData.investment.description": "تقدم الغابون إطاراً مستقراً وشفافاً لاستثمارات مصايد الأسماك. اتصل بنا لاكتشاف الفرص المتاحة.",
    "publicData.investment.createAccount": "إنشاء حساب مهني",
    "publicData.investment.downloadGuide": "تحميل دليل الاستثمار",
    
    // News Page
    "news.hero.title": "أخبار القطاع",
    "news.hero.description": "تابع آخر الأخبار واللوائح والتطورات في قطاع مصايد الأسماك الغابوني.",
    "news.readMore": "اقرأ المزيد",
    "news.loadMore": "تحميل المزيد من المقالات",
    "news.newsletter.title": "ابق على اطلاع",
    "news.newsletter.description": "اشترك في نشرتنا الإخبارية لتلقي آخر الأخبار مباشرة في صندوق بريدك.",
    "news.newsletter.placeholder": "عنوان بريدك الإلكتروني",
    "news.newsletter.subscribe": "اشتراك",
    
    // Awareness Page
    "awareness.hero.title": "الصيد المستدام",
    "awareness.hero.description": "معاً للحفاظ على مواردنا البحرية وضمان مستقبل مستدام للأجيال القادمة.",
    "awareness.responsible.title": "الصيد المسؤول",
    "awareness.responsible.description": "احترام الأحجام الدنيا والحصص وفترات الراحة البيولوجية لضمان تجديد الأنواع.",
    "awareness.ecosystem.title": "حماية النظم البيئية",
    "awareness.ecosystem.description": "الحفاظ على مناطق التكاثر وأشجار المانغروف والموائل البحرية الأساسية للتنوع البيولوجي.",
    "awareness.illegal.title": "مكافحة الصيد غير القانوني",
    "awareness.illegal.description": "الإبلاغ عن الأنشطة المشبوهة والامتثال للوائح لحماية مواردنا المشتركة.",
    "awareness.practices.title": "أفضل الممارسات",
    "awareness.practices.fishermen": "للصيادين",
    "awareness.practices.fishermenDesc": "اعتماد ممارسات مستدامة يومياً",
    "awareness.practices.consumers": "للمستهلكين",
    "awareness.practices.consumersDesc": "الاستهلاك بمسؤولية",
    "awareness.threatened.title": "الأنواع المهددة",
    "awareness.threatened.description": "بعض الأنواع البحرية معرضة لخطر شديد. صيدها منظم بشكل صارم أو محظور. دعونا نحترم هذه التدابير للحفاظ على تراثنا البحري.",
    "awareness.threatened.forbidden": "الصيد محظور",
    "awareness.threatened.protected": "محمية",
    "awareness.resources.title": "الموارد والوثائق",
    "awareness.resources.guide": "دليل الصياد المسؤول",
    "awareness.resources.guideDesc": "دليل شامل لأفضل ممارسات الصيد المستدام",
    "awareness.resources.regulations": "اللوائح الحالية",
    "awareness.resources.regulationsDesc": "جميع قواعد وقوانين الصيد في الغابون",
    "awareness.resources.calendar": "تقويم التدريبات",
    "awareness.resources.calendarDesc": "شارك في دورات تدريبية مجانية",
    "awareness.resources.downloadPdf": "تحميل PDF",
    "awareness.resources.consult": "استشر",
    "awareness.resources.viewCalendar": "عرض التقويم",
    "awareness.cta.title": "لنتصرف معاً",
    "awareness.cta.description": "كل إجراء مهم للحفاظ على محيطاتنا. انضم إلى حركة الصيد المستدام في الغابون.",
    "awareness.cta.engage": "المشاركة",
    "awareness.cta.report": "الإبلاغ عن انتهاك",
    
    // Registry Page
    "registry.title": "السجل العام للوثائق الوزارية",
    "registry.subtitle": "الشفافية الإدارية - وزارة مصايد الأسماك وتربية الأحياء المائية",
    "registry.search.title": "البحث عن وثائق",
    "registry.search.description": "البحث بين {count} وثيقة منشورة",
    "registry.search.placeholder": "البحث حسب العنوان أو الموضوع أو المرجع أو المحتوى...",
    "registry.search.allTypes": "جميع الأنواع",
    "registry.search.resultsCount": "تم العثور على {count} وثيقة",
    "registry.loading": "جارٍ تحميل الوثائق...",
    "registry.noResults": "لا توجد وثيقة تطابق بحثك",
    "registry.noDocuments": "لم يتم نشر أي وثيقة حتى الآن",
    "registry.downloadBtn": "تحميل",
    "registry.published": "نُشر في",
    "registry.signatories": "الموقعون",
    "registry.recipients": "المستلمون",
    "registry.backHome": "العودة إلى الصفحة الرئيسية",
    "registry.subscribe": "الاشتراك في الإشعارات",
  },
};

// Fonction pour détecter la langue du navigateur et la mapper vers nos langues supportées
const detectBrowserLanguage = (): Language => {
  // Récupérer la langue du navigateur
  const browserLang = navigator.language || navigator.languages?.[0] || "fr";
  
  // Extraire le code de langue principal (ex: "en-US" -> "en")
  const langCode = browserLang.toLowerCase().split("-")[0];
  
  // Mapper vers nos langues supportées
  const languageMap: Record<string, Language> = {
    fr: "fr",
    en: "en",
    zh: "zh",
    es: "es",
    ar: "ar",
  };
  
  // Retourner la langue détectée ou français par défaut
  return languageMap[langCode] || "fr";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Priorité: localStorage > DB > détection navigateur (géré au login)
    const saved = localStorage.getItem("language");
    return (saved as Language) || detectBrowserLanguage();
  });

  useEffect(() => {
    // Sauvegarder dans localStorage pour accès rapide
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
