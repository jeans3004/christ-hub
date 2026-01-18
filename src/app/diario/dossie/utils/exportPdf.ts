/**
 * Utilitario para exportar dossie do aluno em PDF.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AlunoDossie, NIVEL_DESCRICOES } from '../types';
import { Usuario } from '@/types';

interface ExportPdfOptions {
  dossie: AlunoDossie;
  usuario: Usuario;
  ano: number;
}

/**
 * Formata data para exibicao no PDF
 */
function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para exibicao no PDF
 */
function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcula idade a partir da data de nascimento
 */
function calculateAge(dataNascimento?: Date): number | null {
  if (!dataNascimento) return null;
  const birth = new Date(dataNascimento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Exporta o dossie do aluno para PDF
 */
export function exportDossiePdf({ dossie, usuario, ano }: ExportPdfOptions): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Cabecalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DOSSIE DO ALUNO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ano Letivo: ${ano}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Linha separadora
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Informacoes do Aluno
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACOES DO ALUNO', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const age = calculateAge(dossie.dataNascimento);
  const infoData = [
    ['Nome:', dossie.nome],
    ['Turma:', dossie.turmaNome],
    ['Matricula:', dossie.matricula || '-'],
    ['Data de Nascimento:', age ? `${formatDate(dossie.dataNascimento)} (${age} anos)` : formatDate(dossie.dataNascimento)],
    ['CPF:', dossie.cpf || '-'],
    ['Turno:', dossie.turno || '-'],
    ['Serie:', dossie.serie || '-'],
    ['Status:', dossie.ativo ? 'Ativo' : 'Inativo'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Frequencia
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FREQUENCIA', margin, yPos);
  yPos += 8;

  const freq = dossie.frequencia;
  const freqColor = freq.percentualPresenca >= 75 ? [0, 128, 0] : freq.percentualPresenca >= 50 ? [255, 165, 0] : [255, 0, 0];

  autoTable(doc, {
    startY: yPos,
    head: [['Total de Aulas', 'Presencas', 'Faltas', 'Percentual']],
    body: [[
      freq.totalAulas.toString(),
      freq.presencas.toString(),
      freq.faltas.toString(),
      `${freq.percentualPresenca}%`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    styles: { fontSize: 10, halign: 'center' },
    columnStyles: {
      3: { textColor: freqColor as [number, number, number] },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Avaliacoes por Rubricas
  if (dossie.avaliacoes.length > 0) {
    // Verificar se precisa de nova pagina
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AVALIACOES POR RUBRICAS', margin, yPos);
    yPos += 8;

    const avaliacoesData = dossie.avaliacoes.map((av) => [
      av.disciplinaNome,
      av.rubricaNome,
      av.bimestre ? `${av.bimestre}o Bim` : '-',
      av.av ? av.av.toUpperCase() : '-',
      av.nivel,
      NIVEL_DESCRICOES[av.nivel] || av.nivel,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Disciplina', 'Rubrica', 'Bimestre', 'AV', 'Nivel', 'Descricao']],
      body: avaliacoesData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Ocorrencias
  if (dossie.ocorrencias.length > 0) {
    // Verificar se precisa de nova pagina
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OCORRENCIAS', margin, yPos);
    yPos += 8;

    const ocorrenciasData = dossie.ocorrencias.map((oc) => [
      formatDate(oc.data),
      oc.motivo,
      oc.descricao || '-',
      oc.status === 'aprovada' ? 'Aprovada' : oc.status === 'pendente' ? 'Pendente' : oc.status,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Motivo', 'Descricao', 'Status']],
      body: ocorrenciasData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Assinatura Digital
  // Verificar se precisa de nova pagina para assinatura
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  yPos = pageHeight - 70;

  doc.setDrawColor(100);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURA DIGITAL', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const assinaturaInfo = [
    `Documento gerado eletronicamente pelo Sistema de Gestao Escolar`,
    `Emitido por: ${usuario.nome}`,
    `Cargo: ${usuario.tipo === 'professor' ? 'Professor(a)' : usuario.tipo === 'coordenador' ? 'Coordenador(a)' : 'Administrador(a)'}`,
    `Email: ${usuario.email}`,
    `Data/Hora: ${formatDateTime(new Date())}`,
  ];

  assinaturaInfo.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  // Hash de verificacao (simulado)
  const hash = generateVerificationHash(dossie, usuario);
  yPos += 3;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Codigo de Verificacao: ${hash}`, margin, yPos);

  // Rodape em todas as paginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Pagina ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Diario Digital - Sistema de Gestao Escolar',
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Salvar PDF
  const fileName = `dossie_${dossie.nome.replace(/\s+/g, '_').toLowerCase()}_${ano}.pdf`;
  doc.save(fileName);
}

/**
 * Gera um hash de verificacao para o documento
 */
function generateVerificationHash(dossie: AlunoDossie, usuario: Usuario): string {
  const data = `${dossie.id}-${usuario.id}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}
