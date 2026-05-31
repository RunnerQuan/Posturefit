/**
 * Netlify Function — Coze SSE 代理
 *
 * 关键点：
 * 1. 前端统一请求 /api/coze/stream_run
 * 2. 生产环境由 Netlify Function 注入 COZE_TOKEN
 * 3. 直接透传上游 ReadableStream，避免先 await text() 导致函数阻塞到超时
 */

const DEFAULT_COZE_ENDPOINT = 'https://8f9jzqp2mk.coze.site/stream_run';
const DEFAULT_COZE_PROJECT_ID = '7643312041570172962';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function buildCozeRequestBody(payload, sessionId, projectId) {
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

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const cozeEndpoint = process.env.COZE_ENDPOINT || DEFAULT_COZE_ENDPOINT;
  const cozeProjectId = process.env.COZE_PROJECT_ID || DEFAULT_COZE_PROJECT_ID;
  const cozeToken = process.env.COZE_TOKEN;

  if (!cozeToken) {
    return json(500, {
      error: '服务端缺少 COZE_TOKEN',
      hasEndpoint: Boolean(process.env.COZE_ENDPOINT),
      hasProjectId: Boolean(process.env.COZE_PROJECT_ID),
      hasToken: false,
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: '请求体必须是合法 JSON' });
  }

  const { payload, sessionId: rawSessionId } = body || {};
  if (!payload || typeof payload !== 'object') {
    return json(400, { error: '缺少 payload' });
  }

  const sessionId =
    (rawSessionId && String(rawSessionId).trim()) ||
    `netlify-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let upstream;
  try {
    upstream = await fetch(cozeEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cozeToken}`,
        'Content-Type': 'application/json',
      },
      body: buildCozeRequestBody(payload, sessionId, cozeProjectId),
    });
  } catch (error) {
    return json(502, {
      error: '连接 Coze 失败',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (!upstream.ok) {
    const responseText = await upstream.text();
    return json(502, {
      error: 'Coze 请求失败',
      status: upstream.status,
      body: responseText.slice(0, 1000),
    });
  }

  if (!upstream.body) {
    const responseText = await upstream.text();
    return new Response(responseText, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
