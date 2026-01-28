/**
 * API Route: Enviar mídia via WhatsApp (imagem, documento, áudio, vídeo).
 * POST /api/whatsapp/send-media
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';
import { mensagemLogService } from '@/services/firestore';
import { MensagemLog } from '@/types';

type MediaType = 'image' | 'document' | 'audio' | 'video';

interface SendMediaRequest {
  destinatarioId: string;
  destinatarioNome: string;
  numero: string;
  mediaType: MediaType;
  mediaBase64?: string;
  mediaUrl?: string;
  filename?: string;
  mimetype?: string;
  caption?: string;
  enviadoPorId: string;
  enviadoPorNome: string;
}

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: 'Imagem',
  document: 'Documento',
  audio: 'Áudio',
  video: 'Vídeo',
};

export async function POST(request: NextRequest) {
  try {
    const body: SendMediaRequest = await request.json();
    const {
      destinatarioId,
      destinatarioNome,
      numero,
      mediaType,
      mediaBase64,
      mediaUrl,
      filename,
      mimetype,
      caption,
      enviadoPorId,
      enviadoPorNome,
    } = body;

    // Validações
    if (!numero) {
      return NextResponse.json(
        { error: 'Número do destinatário é obrigatório' },
        { status: 400 }
      );
    }

    if (!mediaBase64 && !mediaUrl) {
      return NextResponse.json(
        { error: 'Mídia (base64 ou URL) é obrigatória' },
        { status: 400 }
      );
    }

    if (!mediaType || !['image', 'document', 'audio', 'video'].includes(mediaType)) {
      return NextResponse.json(
        { error: 'Tipo de mídia inválido' },
        { status: 400 }
      );
    }

    if (!enviadoPorId || !enviadoPorNome) {
      return NextResponse.json(
        { error: 'Dados do remetente são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar log inicial
    const logData: Omit<MensagemLog, 'id' | 'createdAt' | 'updatedAt'> = {
      destinatarioId: destinatarioId || 'manual',
      destinatarioNome: destinatarioNome || 'Desconhecido',
      destinatarioNumero: numero,
      mensagem: caption || `[${MEDIA_TYPE_LABELS[mediaType]}]`,
      tipo: 'individual',
      status: 'queued',
      enviadoPorId,
      enviadoPorNome,
      enviadoEm: new Date(),
    };

    let logId = '';
    try {
      logId = await mensagemLogService.create(logData);
    } catch (logError) {
      console.error('Erro ao criar log:', logError);
    }

    // Enviar via Evolution API baseado no tipo
    let result: { success: boolean; messageId?: string; error?: string };

    const mediaData = {
      base64: mediaBase64,
      url: mediaUrl,
      mimetype: mimetype || getMimeType(mediaType, filename),
      filename: filename || getDefaultFilename(mediaType),
    };

    switch (mediaType) {
      case 'image':
        result = await whatsappService.sendImage(numero, mediaData, caption);
        break;
      case 'document':
        result = await whatsappService.sendDocument(numero, mediaData, caption);
        break;
      case 'audio':
        result = await whatsappService.sendAudio(numero, mediaData);
        break;
      case 'video':
        result = await whatsappService.sendVideo(numero, mediaData, caption);
        break;
      default:
        result = { success: false, error: 'Tipo de mídia não suportado' };
    }

    // Atualizar log
    if (logId) {
      try {
        await mensagemLogService.update(logId, {
          status: result.success ? 'sent' : 'failed',
          ...(result.messageId && { messageId: result.messageId }),
          ...(result.error && { erro: result.error }),
        });
      } catch (updateError) {
        console.error('Erro ao atualizar log:', updateError);
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, logId },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      logId,
    });
  } catch (error) {
    console.error('API /api/whatsapp/send-media error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper: obter mimetype padrão baseado no tipo e filename
function getMimeType(mediaType: MediaType, filename?: string): string {
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Imagens
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      // Documentos
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      // Áudio
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      // Vídeo
      mp4: 'video/mp4',
      '3gp': 'video/3gpp',
      mov: 'video/quicktime',
    };
    if (ext && mimeTypes[ext]) {
      return mimeTypes[ext];
    }
  }

  // Defaults
  const defaults: Record<MediaType, string> = {
    image: 'image/jpeg',
    document: 'application/pdf',
    audio: 'audio/mpeg',
    video: 'video/mp4',
  };
  return defaults[mediaType];
}

// Helper: gerar nome de arquivo padrão
function getDefaultFilename(mediaType: MediaType): string {
  const timestamp = Date.now();
  const extensions: Record<MediaType, string> = {
    image: 'jpg',
    document: 'pdf',
    audio: 'mp3',
    video: 'mp4',
  };
  return `${mediaType}_${timestamp}.${extensions[mediaType]}`;
}
