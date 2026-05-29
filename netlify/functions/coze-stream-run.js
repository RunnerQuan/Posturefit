/**
 * Netlify Function — Coze SSE 代理
 *
 * 路径映射：netlify/functions/coze-stream-run.js → /.netlify/functions/coze-stream-run
 * 通过 netlify.toml redirect，/api/coze/stream_run → /.netlify/functions/coze-stream-run
 *
 * 前端在生产环境（无 token/projectId）发送：
 *   POST /api/coze/stream_run
 *   Body: { payload: {...}, sessionId: "..." }
 *
 * 此函数：
 *   1. 从 Netlify 环境变量读取 COZE_ENDPOINT / COZE_PROJECT_ID / COZE_TOKEN
 *   2. 将 payload 包装成 Coze stream_run 请求格式
 *   3. 转发到 Coze 并将 SSE 流直接返回给前端
 */

const DEFAULT_COZE_ENDPOINT = 'https://8f9jzqp2mk.coze.site/stream_run';
const DEFAULT_COZE_PROJECT_ID = '7643312041570172962';

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

exports.handler = async (event) => {
  // CORS 预检
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // 只允许 POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'POST',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // 1. 读取环境变量
  const cozeEndpoint = process.env.COZE_ENDPOINT || DEFAULT_COZE_ENDPOINT;
  const cozeProjectId = process.env.COZE_PROJECT_ID || DEFAULT_COZE_PROJECT_ID;
  const cozeToken = process.env.COZE_TOKEN;

  if (!cozeToken) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: '服务端缺少 COZE 环境变量',
        hasEndpoint: Boolean(process.env.COZE_ENDPOINT),
        hasProjectId: Boolean(process.env.COZE_PROJECT_ID),
        hasToken: false,
      }),
    };
  }

  // 2. 解析请求体
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: '请求体必须是合法 JSON' }),
    };
  }

  const { payload, sessionId: rawSessionId } = body || {};

  if (!payload || typeof payload !== 'object') {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: '缺少 payload' }),
    };
  }

  const sessionId =
    (rawSessionId && String(rawSessionId).trim()) ||
    `netlify-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // 3. 请求 Coze
  let cozeResponse;
  try {
    cozeResponse = await fetch(cozeEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cozeToken}`,
        'Content-Type': 'application/json',
      },
      body: buildCozeRequestBody(payload, sessionId, cozeProjectId),
    });
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: '连接 Coze 失败',
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }

  // 4. 透传 Coze 响应（包括 SSE 流）
  const responseText = await cozeResponse.text();

  if (!cozeResponse.ok) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Coze 请求失败',
        status: cozeResponse.status,
        body: responseText.slice(0, 1000),
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type':
        cozeResponse.headers.get('Content-Type') ||
        'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
    body: responseText,
  };
};
