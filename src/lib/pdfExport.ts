import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrevisionData {
  mois: number;
  annee: number;
  montantPrevu: number;
  tauxPrevu: number;
  recouvrementPrevu: number;
  intervalleConfiance: number;
}

interface PrevisionsAnalysis {
  moyenneAttendu: number;
  moyenneTaux: number;
  tendance: 'hausse' | 'baisse' | 'stable';
  ecartType: number;
  volatilite: 'haute' | 'moyenne' | 'faible';
  previsions: PrevisionData[];
}

const getMoisLabel = (mois: number) => {
  const labels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return labels[mois - 1];
};

interface FinancialOverviewData {
  totalAttendu: number;
  totalRecouvre: number;
  tauxGlobal: number;
  enAttente: number;
  enRetard: number;
  nbQuittances: number;
  tendanceMensuelle: 'hausse' | 'baisse' | 'stable';
  variationMensuelle: number;
  performanceModele?: {
    mape: number;
    precision: number;
    evaluation_date: string;
  };
  facteursActifs: Array<{
    nom: string;
    impact_prevu: number;
  }>;
}

export const generateFinancialOverviewPDF = async (
  data: FinancialOverviewData,
  evolutionChartElement: HTMLElement | null,
  tauxChartElement: HTMLElement | null,
  pieChartElement: HTMLElement | null,
  barChartElement: HTMLElement | null
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // En-tête
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Tableau de Bord Financier', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Section: KPI Principaux
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('INDICATEURS CLÉS DE PERFORMANCE', 15, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  
  const kpis = [
    `Montant Total Attendu: ${data.totalAttendu.toLocaleString()} FCFA (${data.nbQuittances} quittances)`,
    `Montant Recouvré: ${data.totalRecouvre.toLocaleString()} FCFA`,
    `Taux de Recouvrement Global: ${data.tauxGlobal.toFixed(1)}%`,
    `En Attente: ${data.enAttente.toLocaleString()} FCFA (${((data.enAttente / data.totalAttendu) * 100).toFixed(1)}%)`,
    `En Retard: ${data.enRetard.toLocaleString()} FCFA (${((data.enRetard / data.totalAttendu) * 100).toFixed(1)}%)`,
    `Tendance Mensuelle: ${data.tendanceMensuelle === 'hausse' ? 'En amélioration' : data.tendanceMensuelle === 'baisse' ? 'En dégradation' : 'Stable'} (${data.variationMensuelle > 0 ? '+' : ''}${data.variationMensuelle.toFixed(1)}%)`
  ];

  kpis.forEach(text => {
    pdf.text(`• ${text}`, 20, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Performance du modèle
  if (data.performanceModele) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PERFORMANCE DU MODÈLE PRÉDICTIF', 15, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    pdf.text(`• MAPE: ${data.performanceModele.mape.toFixed(1)}% - ${data.performanceModele.mape <= 10 ? 'Excellent' : data.performanceModele.mape <= 20 ? 'Bon' : 'À améliorer'}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`• Précision: ${data.performanceModele.precision.toFixed(0)}%`, 20, yPosition);
    yPosition += 6;
    pdf.text(`• Dernière évaluation: ${new Date(data.performanceModele.evaluation_date).toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 10;
  }

  // Facteurs externes actifs
  if (data.facteursActifs.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('FACTEURS EXTERNES ACTIFS', 15, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    data.facteursActifs.slice(0, 5).forEach(facteur => {
      pdf.text(`• ${facteur.nom}: ${facteur.impact_prevu > 0 ? '+' : ''}${facteur.impact_prevu}% d'impact prévu`, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
  }

  // Graphiques
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('ANALYSE GRAPHIQUE', 15, yPosition);
  yPosition += 8;

  // Capture du graphique d'évolution mensuelle
  if (evolutionChartElement) {
    try {
      const canvas = await html2canvas(evolutionChartElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (yPosition + imgHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Erreur lors de la capture du graphique d\'évolution:', error);
    }
  }

  // Capture du graphique de taux
  if (tauxChartElement) {
    try {
      if (yPosition + 80 > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      const canvas = await html2canvas(tauxChartElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (yPosition + imgHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Erreur lors de la capture du graphique de taux:', error);
    }
  }

  // Nouvelle page pour les distributions
  pdf.addPage();
  yPosition = 20;

  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DISTRIBUTION DES PAIEMENTS', 15, yPosition);
  yPosition += 8;

  // Capture du graphique en camembert
  if (pieChartElement) {
    try {
      const canvas = await html2canvas(pieChartElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = (pageWidth - 30) / 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
      
      // Capture du graphique en barres à côté
      if (barChartElement) {
        try {
          const barCanvas = await html2canvas(barChartElement, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          const barImgData = barCanvas.toDataURL('image/png');
          pdf.addImage(barImgData, 'PNG', 15 + imgWidth + 5, yPosition, imgWidth, imgHeight);
        } catch (error) {
          console.error('Erreur lors de la capture du graphique en barres:', error);
        }
      }
      
      yPosition += imgHeight + 15;
    } catch (error) {
      console.error('Erreur lors de la capture du graphique en camembert:', error);
    }
  }

  // Section: Recommandations
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RECOMMANDATIONS', 15, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);

  const recommendations: string[] = [];

  if (data.tauxGlobal < 70) {
    recommendations.push('Taux de recouvrement faible: Renforcer les processus de relance et envisager des pénalités pour retard.');
  }

  if (data.tendanceMensuelle === 'baisse') {
    recommendations.push('Tendance à la baisse: Analyser les causes et mettre en place des actions correctives rapidement.');
  }

  if ((data.enRetard / data.totalAttendu) > 0.15) {
    recommendations.push('Proportion élevée de paiements en retard: Améliorer le suivi et la communication avec les usagers.');
  }

  if (data.tauxGlobal >= 80 && data.tendanceMensuelle !== 'baisse') {
    recommendations.push('Performance satisfaisante: Maintenir les bonnes pratiques actuelles et suivre l\'évolution des indicateurs.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Situation stable: Continuer le suivi régulier des indicateurs de recouvrement.');
  }

  recommendations.forEach((text, idx) => {
    const lines = pdf.splitTextToSize(`${idx + 1}. ${text}`, pageWidth - 40);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });

  // Pied de page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} sur ${totalPages} - Rapport généré automatiquement`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Sauvegarder le PDF
  const fileName = `tableau-bord-financier-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const generatePrevisionsPDF = async (
  previsions: PrevisionsAnalysis,
  combinedChartElement: HTMLElement | null,
  tauxChartElement: HTMLElement | null,
  selectedPeriod: string
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // En-tête
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Rapport de Prévisions Financières', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Section: Indicateurs Clés
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('INDICATEURS CLÉS', 15, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  
  const indicators = [
    `Taux de recouvrement moyen: ${previsions.moyenneTaux.toFixed(1)}% (sur ${selectedPeriod} mois)`,
    `Tendance: ${previsions.tendance === 'hausse' ? 'À la hausse' : previsions.tendance === 'baisse' ? 'À la baisse' : 'Stable'}`,
    `Volatilité: ${previsions.volatilite === 'haute' ? 'Haute' : previsions.volatilite === 'moyenne' ? 'Moyenne' : 'Faible'} (écart-type: ${previsions.ecartType.toFixed(1)}%)`,
    `Montant moyen mensuel attendu: ${previsions.moyenneAttendu.toLocaleString()} FCFA`
  ];

  indicators.forEach(text => {
    pdf.text(`• ${text}`, 20, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Graphiques
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('ANALYSE GRAPHIQUE', 15, yPosition);
  yPosition += 8;

  // Capture du graphique combiné
  if (combinedChartElement) {
    try {
      const canvas = await html2canvas(combinedChartElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (yPosition + imgHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Erreur lors de la capture du graphique combiné:', error);
    }
  }

  // Capture du graphique de taux
  if (tauxChartElement) {
    try {
      if (yPosition + 80 > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      const canvas = await html2canvas(tauxChartElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (yPosition + imgHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Erreur lors de la capture du graphique de taux:', error);
    }
  }

  // Nouvelle page pour le tableau
  pdf.addPage();
  yPosition = 20;

  // Section: Prévisions Détaillées
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PRÉVISIONS DÉTAILLÉES (6 PROCHAINS MOIS)', 15, yPosition);
  yPosition += 10;

  // En-tête du tableau
  pdf.setFontSize(9);
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
  
  pdf.setTextColor(0, 0, 0);
  pdf.text('Période', 18, yPosition + 5);
  pdf.text('Montant Prévu', 60, yPosition + 5);
  pdf.text('Taux Prévu', 110, yPosition + 5);
  pdf.text('Recouvrement', 145, yPosition + 5);
  
  yPosition += 10;

  // Lignes du tableau
  pdf.setFontSize(8);
  previsions.previsions.forEach((prev, idx) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }

    const bgColor = idx % 2 === 0 ? 255 : 250;
    pdf.setFillColor(bgColor, bgColor, bgColor);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 7, 'F');

    pdf.setTextColor(0, 0, 0);
    pdf.text(`${getMoisLabel(prev.mois)} ${prev.annee}`, 18, yPosition);
    pdf.text(`${prev.montantPrevu.toLocaleString()} FCFA`, 60, yPosition);
    pdf.text(`${prev.tauxPrevu.toFixed(1)}%`, 110, yPosition);
    pdf.text(`${prev.recouvrementPrevu.toLocaleString()} FCFA`, 145, yPosition);
    
    yPosition += 7;
  });

  yPosition += 10;

  // Section: Recommandations
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RECOMMANDATIONS', 15, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);

  const recommendations: string[] = [];

  if (previsions.moyenneTaux < 70) {
    recommendations.push('Taux de recouvrement faible: Renforcer les processus de relance et envisager des pénalités pour retard.');
  }

  if (previsions.tendance === 'baisse') {
    recommendations.push('Tendance à la baisse: Analyser les causes et mettre en place des actions correctives rapidement.');
  }

  if (previsions.volatilite === 'haute') {
    recommendations.push('Volatilité élevée: Standardiser les processus de paiement et améliorer la communication avec les usagers.');
  }

  if (previsions.moyenneTaux >= 80 && previsions.volatilite === 'faible') {
    recommendations.push('Performance satisfaisante: Maintenir les bonnes pratiques actuelles et suivre l\'évolution des indicateurs.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Situation stable: Continuer le suivi régulier des indicateurs de recouvrement.');
  }

  recommendations.forEach((text, idx) => {
    const lines = pdf.splitTextToSize(`${idx + 1}. ${text}`, pageWidth - 40);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });

  // Pied de page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} sur ${totalPages} - Rapport généré automatiquement`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Sauvegarder le PDF
  const fileName = `previsions-financieres-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
