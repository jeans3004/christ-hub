/**
 * API Route: Enviar mídia para grupo do WhatsApp.
 * POST /api/whatsapp/send-group-media
 */

import { NextRequest, NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'sge';

type MediaType = 'image' | 'document' | 'audio' | 'video';

interface SendGroupMediaRequest {
  groupId: string;
  mediaType: MediaType;
  mediaBase64?: string;
  mediaUrl?: string;
  filename?: string;
  mimetype?: string;
  caption?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendGroupMediaRequest = await request.json();
    const {
      groupId,
      mediaType,
      mediaBase64,
      mediaUrl,
      filename,
      mimetype,
      caption,
    } = body;

    // Validações
    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId é obrigatório' },
        { status: 400 }
      );
    }

    if (!groupId.endsWith('@g.us')) {
      return NextResponse.json(
        { error: 'groupId deve estar no formato: 123456789@g.us' },
        { status: 400 }
      );
    }

    if (!mediaBase64 && !mediaUrl) {
      return NextResponse.json(
        { error: 'mediaBase64 ou mediaUrl é obrigatório' },
        { status: 400 }
      );
    }

    if (!mediaType || !['image', 'document', 'audio', 'video'].includes(mediaType)) {
      return NextResponse.json(
        { error: 'mediaType inválido' },
        { status: 400 }
      );
    }

    // Preparar corpo da requisição para Evolution API
    const mediaBody = {
      number: groupId,
      mediatype: mediaType,
      mimetype: mimetype || getMimeType(mediaType, filename),
      caption: caption || '',
      media: mediaBase64 || mediaUrl,
      fileName: filename || getDefaultFilename(mediaType),
    };

    // Enviar via Evolution API
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify(mediaBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Evolution API sendMedia to group error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          error: errorData.message || `Erro ${response.status} ao enviar mídia para grupo`,
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      messageId: result.key?.id,
    });
  } catch (error) {
    console.error('API /api/whatsapp/send-group-media error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Helper: obter mimetype padrão
function getMimeType(mediaType: MediaType, filename?: string): string {
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
      pdf: 'application/pdf', doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav',
      mp4: 'video/mp4', '3gp': 'video/3gpp', mov: 'video/quicktime',
    };
    if (ext && mimeTypes[ext]) return mimeTypes[ext];
  }
  const defaults: Record<MediaType, string> = {
    image: 'image/jpeg', document: 'application/pdf', audio: 'audio/mpeg', video: 'video/mp4',
  };
  return defaults[mediaType];
}

// Helper: gerar nome de arquivo padrão
function getDefaultFilename(mediaType: MediaType): string {
  const timestamp = Date.now();
  const extensions: Record<MediaType, string> = {
    image: 'jpg', document: 'pdf', audio: 'mp3', video: 'mp4',
  };
  return `${mediaType}_${timestamp}.${extensions[mediaType]}`;
}
