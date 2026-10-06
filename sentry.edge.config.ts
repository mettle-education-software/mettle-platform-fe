// Sentry no edge (middleware e rotas edge). Opções comuns em src/libs/sentryOptions.ts.
import * as Sentry from '@sentry/nextjs';
import { sharedOptions } from './src/libs/sentryOptions';

Sentry.init(sharedOptions);
