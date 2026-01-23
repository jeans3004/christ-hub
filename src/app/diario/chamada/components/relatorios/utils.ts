/**
 * Utilitarios para relatorios de chamada.
 */

// Formatar data para exibicao (DD/MM/YYYY)
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Formatar data completa
export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const dias = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

// Formatar periodo
export function formatPeriodo(dataInicio: string, dataFim: string): string {
  return `${formatDate(dataInicio)} a ${formatDate(dataFim)}`;
}

// Estilos de impressao
const printStyles = `
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
    h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
    h2 { text-align: center; color: #666; margin-top: 0; font-size: 14px; }
    .header-info { text-align: center; margin-bottom: 20px; color: #333; }
    .chamada-section { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #ddd; }
    .section-header { background: #f5f5f5; padding: 8px; border-bottom: 1px solid #ddd; }
    .section-title { font-weight: bold; font-size: 14px; margin: 0; }
    .section-subtitle { color: #666; font-size: 12px; margin: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
    th { background: #f9f9f9; font-weight: bold; }
    .presente { color: green; font-weight: bold; }
    .ausente { color: red; font-weight: bold; }
    .stats { padding: 8px; background: #f9f9f9; display: flex; gap: 15px; }
    .stat-item { display: inline-block; margin-right: 15px; }
    .conteudo { padding: 8px; background: #fff9c4; border-top: 1px solid #ddd; }
    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
    .signature-line { margin-top: 50px; border-top: 1px solid #000; width: 250px; margin-left: auto; margin-right: auto; }
    .signature-label { text-align: center; margin-top: 5px; font-size: 11px; }
    .summary-box { border: 1px solid #ddd; padding: 10px; margin-bottom: 15px; background: #f9f9f9; }
    .summary-title { font-weight: bold; margin-bottom: 5px; }
    .summary-grid { display: flex; gap: 20px; flex-wrap: wrap; }
    .summary-item { text-align: center; }
    .summary-value { font-size: 20px; font-weight: bold; }
    .summary-label { font-size: 10px; color: #666; }
    @media print {
      body { padding: 10px; }
      .page-break { page-break-before: always; }
    }
  </style>
`;

// Funcao de impressao generica
interface PrintOptions {
  title: string;
  subtitle?: string;
  professor?: string;
  periodo?: string;
  content: string;
  showSignature?: boolean;
}

export function printReport(options: PrintOptions): void {
  const { title, subtitle, professor, periodo, content, showSignature = true } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        ${printStyles}
      </head>
      <body>
        <h1>Centro de Educacao Integral Christ Master</h1>
        <h2>${title}</h2>
        <div class="header-info">
          ${professor ? `<strong>Professor(a):</strong> ${professor}<br>` : ''}
          ${subtitle ? `<strong>Data:</strong> ${subtitle}<br>` : ''}
          ${periodo ? `<strong>Periodo:</strong> ${periodo}` : ''}
        </div>
        ${content}
        ${showSignature ? `
          <div class="signature-line"></div>
          <div class="signature-label">Assinatura do Professor(a)</div>
        ` : ''}
        <div class="footer">
          Documento gerado em ${new Date().toLocaleString('pt-BR')}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
