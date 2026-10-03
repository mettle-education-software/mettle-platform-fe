import ApiClient from 'services/ApiClient';

// Eventos da Plataforma (login, progresso de vídeo) vão para o hub de eventos da Mettle (Cloudflare Worker mettle-events),
// que grava no Supabase e atualiza o Mautic. Substitui os webhooks do n8n.
export const n8nServiceWebhook = new ApiClient('https://events.mettle.com.br/webhooks/plataforma');
