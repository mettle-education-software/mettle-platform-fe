/** @jest-environment node */
// Impersonação = modo visualização: nada grava (exceto sair da impersonação), e a recusa tem o formato do servidor.
import { blocksWrite, guardWrite, setViewOnly, VIEW_ONLY_CODE, VIEW_ONLY_EVENT, viewOnlyRefusal } from '../viewOnly';

const events: string[] = [];
beforeAll(() => {
    (globalThis as any).window = { dispatchEvent: (e: { type: string }) => events.push(e.type) };
    (globalThis as any).CustomEvent = class {
        type: string;
        constructor(type: string) {
            this.type = type;
        }
    };
});
afterEach(() => {
    setViewOnly(false);
    events.length = 0;
});

test('desligado: nada é barrado', () => {
    expect(blocksWrite('post', '/v2/x/summary')).toBe(false);
    expect(() => guardWrite('PUT', '/progress')).not.toThrow();
});

test('ligado: grava = barra; ler e sair da impersonação passam', () => {
    setViewOnly(true);
    for (const method of ['post', 'PUT', 'patch', 'delete']) expect(blocksWrite(method, '/x')).toBe(true);
    for (const method of ['get', 'HEAD', 'options', undefined]) expect(blocksWrite(method, '/x')).toBe(false);
    expect(blocksWrite('post', '/impersonate/remove')).toBe(false);
    expect(blocksWrite('post', '/impersonate/add/abc')).toBe(true);
    // a exceção é exata: nada de "parecido" passa
    expect(blocksWrite('post', '/impersonate/remove-x')).toBe(true);
    expect(blocksWrite('post', '/x?next=/impersonate/remove')).toBe(true);
});

test('recusa no formato do servidor e aviso para a barra', () => {
    setViewOnly(true);
    expect(() => guardWrite('POST', '/messages')).toThrow('Modo visualização');
    const error = viewOnlyRefusal() as any;
    expect(error.response).toEqual({ status: 403, data: { code: VIEW_ONLY_CODE, message: expect.any(String) } });
    expect(events).toEqual([VIEW_ONLY_EVENT, VIEW_ONLY_EVENT]);
});
