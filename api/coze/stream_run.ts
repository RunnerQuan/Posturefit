const DEFAULT_COZE_ENDPOINT = 'https://8f9jzqp2mk.coze.site/stream_run';
const DEFAULT_COZE_PROJECT_ID = '7643312041570172962';

type ProxyRequestBody = {
  payload?: unknown;
  sessionId?: string;
};

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value ? String(value) : undefined;
}

function json(status: number, body: Record<string, string>): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function buildCozeRequestBody(payload: unknown, sessionId: string, projectId: string): string {
  return JSON.stringify({
    content: {
      query: {
        prompt: [
          {
            type: 'text',
            content: {
              text: JSON.stringify(payload),
            },
          },
        ],
      },
    },
    type: 'query',
    session_id: sessionId,
    project_id: Number(projectId),
  });
}

function createUpstreamHeaders(contentType: string | null): Headers {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Type', contentType || 'text/event-stream; charset=utf-8');
  return headers;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          Allow: 'POST',
          'Cache-Control': 'no-store',
        },
      });
    }

    let body: ProxyRequestBody;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: '请求体必须是合法 JSON' });
    }

    if (!isRecord(body.payload)) {
      return json(400, { error: '缺少 payload' });
    }

    const token = getEnv('COZE_TOKEN');
    if (!token) {
      return json(500, { error: '服务端缺少 COZE_TOKEN' });
    }

    const endpoint = getEnv('COZE_ENDPOINT') || DEFAULT_COZE_ENDPOINT;
    const projectId = getEnv('COZE_PROJECT_ID') || DEFAULT_COZE_PROJECT_ID;
    const sessionId = body.sessionId?.trim() || crypto.randomUUID();

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: buildCozeRequestBody(body.payload, sessionId, projectId),
    });

    if (!upstream.ok || !upstream.body) {
      const errorText = await upstream.text();
      return new Response(errorText || `Coze 请求失败：${upstream.status}`, {
        status: upstream.status,
        headers: createUpstreamHeaders(upstream.headers.get('content-type')),
      });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: createUpstreamHeaders(upstream.headers.get('content-type')),
    });
  },
};
