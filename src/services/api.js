export const API_BASE_URL = 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      'Não foi possível conectar à API em ' + API_BASE_URL + '. Verifique se o backend está ativo e acessível.',
    );
  }

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      throw new ApiError('A API retornou uma resposta inválida (JSON malformado).', response.status);
    }
  }

  if (!response.ok) {
    const message = data?.error || 'A requisição falhou com o status HTTP ' + response.status + '.';
    throw new ApiError(message, response.status);
  }

  return data;
}
