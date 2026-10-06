// Sentry no navegador. Opções comuns (amostragem, filtros, sem PII) em src/libs/sentryOptions.ts.
// Sem Session Replay: o plano gratuito tem 50 replays/mês e o replay pesa no pacote do navegador.
import * as Sentry from '@sentry/nextjs';
import { sharedOptions } from './src/libs/sentryOptions';

Sentry.init(sharedOptions);
