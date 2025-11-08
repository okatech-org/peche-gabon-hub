import * as XLSX from 'xlsx';

interface KPIData {
  label: string;
  value: number;
  trend?: number;
}

interface MonthlyData {
  mois: string;
  valeur: number;
}

interface PrevisionsData {
  feuille: string;
  somme: number;
}

interface ExportData {
  kpis: KPIData[];
  monthlyData: MonthlyData[];
  previsionsData: PrevisionsData[];
  statistics: {
    totalRecettes: number;
    moyenneMensuelle: number;
    moisPerformant: string;
  };
  rawData?: {
    quittances?: any[];
    exportations?: any[];
    taxes?: any[];
    demandes?: any[];
  };
}

export const exportToExcel = (data: ExportData, filename: string = 'dashboard_finances_peche_gabon.xlsx') => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // 1. KPIs Sheet
  const kpisData = [
    ['INDICATEURS CLÉS - PÊCHE GABON'],
    [''],
    ['Indicateur', 'Valeur (FCFA)', 'Tendance (%)'],
    ...data.kpis.map(kpi => [
      kpi.label,
      kpi.value,
      kpi.trend !== undefined ? kpi.trend : 'N/A'
    ]),
    [''],
    ['Date d\'export:', new Date().toLocaleDateString('fr-FR')],
    ['Heure d\'export:', new Date().toLocaleTimeString('fr-FR')]
  ];

  const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
  
  // Style for KPIs sheet
  kpisSheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 15 }
  ];
  
  // Merge title cell
  kpisSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
  ];

  XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');

  // 2. Monthly Data Sheet
  const monthlySheetData = [
    ['RECETTES MENSUELLES (QUITTANCES)'],
    [''],
    ['Mois', 'Montant (FCFA)'],
    ...data.monthlyData.map(item => [item.mois, item.valeur]),
    [''],
    ['TOTAL', data.monthlyData.reduce((sum, item) => sum + item.valeur, 0)],
    ['MOYENNE', data.statistics.moyenneMensuelle],
    ['MOIS LE PLUS PERFORMANT', data.statistics.moisPerformant]
  ];

  const monthlySheet = XLSX.utils.aoa_to_sheet(monthlySheetData);
  monthlySheet['!cols'] = [
    { wch: 20 },
    { wch: 20 }
  ];
  monthlySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
  ];

  XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Recettes Mensuelles');

  // 3. Prévisions Sheet
  if (data.previsionsData.length > 0) {
    const previsionsSheetData = [
      ['PRÉVISIONS ET SCÉNARIOS'],
      [''],
      ['Catégorie', 'Montant Total (FCFA)'],
      ...data.previsionsData.map(item => [item.feuille, item.somme]),
      [''],
      ['TOTAL GÉNÉRAL', data.previsionsData.reduce((sum, item) => sum + item.somme, 0)]
    ];

    const previsionsSheet = XLSX.utils.aoa_to_sheet(previsionsSheetData);
    previsionsSheet['!cols'] = [
      { wch: 30 },
      { wch: 25 }
    ];
    previsionsSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
    ];

    XLSX.utils.book_append_sheet(workbook, previsionsSheet, 'Prévisions');
  }

  // 4. Statistics Summary Sheet
  const statsData = [
    ['STATISTIQUES GLOBALES'],
    [''],
    ['Métrique', 'Valeur'],
    ['Total des Recettes', `${data.statistics.totalRecettes.toLocaleString('fr-FR')} FCFA`],
    ['Moyenne Mensuelle', `${data.statistics.moyenneMensuelle.toLocaleString('fr-FR')} FCFA`],
    ['Mois le Plus Performant', data.statistics.moisPerformant],
    [''],
    ['INDICATEURS DÉTAILLÉS'],
    [''],
    ...data.kpis.map(kpi => [kpi.label, `${kpi.value.toLocaleString('fr-FR')} FCFA`]),
    [''],
    ['Nombre de mois analysés', data.monthlyData.length],
    ['Nombre de scénarios prévisions', data.previsionsData.length]
  ];

  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet['!cols'] = [
    { wch: 30 },
    { wch: 30 }
  ];
  statsSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } }
  ];

  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');

  // 5. Raw Data Sheets (if available)
  if (data.rawData) {
    // Quittances raw data
    if (data.rawData.quittances && data.rawData.quittances.length > 0) {
      const quittancesSheet = XLSX.utils.json_to_sheet(data.rawData.quittances);
      XLSX.utils.book_append_sheet(workbook, quittancesSheet, 'Données Quittances');
    }

    // Exportations raw data
    if (data.rawData.exportations && data.rawData.exportations.length > 0) {
      const exportationsSheet = XLSX.utils.json_to_sheet(data.rawData.exportations);
      XLSX.utils.book_append_sheet(workbook, exportationsSheet, 'Données Exportations');
    }

    // Taxes raw data
    if (data.rawData.taxes && data.rawData.taxes.length > 0) {
      const taxesSheet = XLSX.utils.json_to_sheet(data.rawData.taxes);
      XLSX.utils.book_append_sheet(workbook, taxesSheet, 'Données Taxes');
    }

    // Demandes raw data
    if (data.rawData.demandes && data.rawData.demandes.length > 0) {
      const demandesSheet = XLSX.utils.json_to_sheet(data.rawData.demandes);
      XLSX.utils.book_append_sheet(workbook, demandesSheet, 'Données Demandes');
    }
  }

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, filename);
};

// Helper function to format currency for Excel
export const formatCurrencyForExcel = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0
  }).format(value);
};

// Helper function to prepare data from CSV
export const prepareExportData = (
  kpis: any[],
  monthlyData: any[],
  previsionsData: any[],
  rawData?: any
): ExportData => {
  const totalRecettes = monthlyData.reduce((sum, item) => sum + (Number(item.valeur) || 0), 0);
  const moyenneMensuelle = monthlyData.length > 0 ? totalRecettes / monthlyData.length : 0;
  const moisPerformant = monthlyData.length > 0
    ? monthlyData.reduce((max, item) => (Number(item.valeur) || 0) > (Number(max.valeur) || 0) ? item : max, monthlyData[0]).mois
    : 'N/A';

  return {
    kpis,
    monthlyData,
    previsionsData,
    statistics: {
      totalRecettes,
      moyenneMensuelle,
      moisPerformant
    },
    rawData
  };
};
