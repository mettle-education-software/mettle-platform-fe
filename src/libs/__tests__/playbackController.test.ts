import { createPlaybackController, createPlaybackCoordinator, PlaybackAction } from '../podcast';

// <audio> simulado: play() devolve uma promise controlada pelo teste; os eventos são disparados à mão.
const makeAudio = () => {
    const calls: { resolve: () => void; reject: (error: unknown) => void }[] = [];
    const audio = {
        paused: true,
        readyState: 0,
        play: jest.fn(
            () =>
                new Promise<void>((resolve, reject) => {
                    audio.paused = false;
                    calls.push({ resolve, reject });
                }),
        ),
        pause: jest.fn(() => {
            audio.paused = true;
        }),
        calls,
    };
    return audio;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const abort = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

const setup = (id: string, coordinator: ReturnType<typeof createPlaybackCoordinator>) => {
    const audio = makeAudio();
    const actions: PlaybackAction['type'][] = [];
    const controller = createPlaybackController({
        id,
        getAudio: () => audio,
        dispatch: (action) => actions.push(action.type),
        coordinator,
    });
    return { audio, actions, controller };
};

describe('createPlaybackController', () => {
    it('A pendente → B toca → A resolve tarde: só B toca', async () => {
        const coordinator = createPlaybackCoordinator();
        const a = setup('a', coordinator);
        const b = setup('b', coordinator);

        a.controller.toggle(); // A pendente
        b.controller.toggle(); // B reivindica: A é invalidado e pausado
        expect(a.audio.pause).toHaveBeenCalledTimes(1);
        expect(a.actions).toContain('PLAY_CANCELLED');
        expect(coordinator.activeId()).toBe('b');

        // Respostas atrasadas de A: promise resolve, evento play chega
        a.audio.calls[0].resolve();
        await flush();
        expect(a.controller.onPlay()).toBe(false);
        expect(a.audio.pause).toHaveBeenCalledTimes(2);
        expect(a.actions).not.toContain('PLAYING');
        expect(coordinator.activeId()).toBe('b');

        // B segue tocando
        b.audio.calls[0].resolve();
        await flush();
        expect(b.controller.onPlay()).toBe(true);
        expect(b.actions).toContain('PLAYING');
        expect(b.audio.pause).not.toHaveBeenCalled();
    });

    it('A pendente → B toca → A rejeita tarde (AbortError): ignorado', async () => {
        const coordinator = createPlaybackCoordinator();
        const a = setup('a', coordinator);
        const b = setup('b', coordinator);
        a.controller.toggle();
        b.controller.toggle();
        a.audio.calls[0].reject(abort());
        await flush();
        expect(a.actions).not.toContain('PLAY_REJECTED');
        expect(coordinator.activeId()).toBe('b');
    });

    it('duplo clique durante play pendente: um play() só e o segundo clique cancela', async () => {
        const coordinator = createPlaybackCoordinator();
        const a = setup('a', coordinator);
        a.controller.toggle();
        a.controller.toggle();
        expect(a.audio.play).toHaveBeenCalledTimes(1);
        expect(a.audio.pause).toHaveBeenCalledTimes(1);
        expect(a.actions).toEqual(['PLAY_REQUEST', 'PLAY_CANCELLED']);

        a.audio.calls[0].reject(abort());
        await flush();
        expect(a.controller.onPlay()).toBe(false);
        expect(a.actions).toEqual(['PLAY_REQUEST', 'PLAY_CANCELLED']);

        // novo clique começa uma tentativa nova, válida
        a.controller.toggle();
        expect(a.audio.play).toHaveBeenCalledTimes(2);
        expect(a.controller.onPlay()).toBe(true);
    });

    it('desmontar durante play pendente: pausa, libera o coordenador e ignora o resto', async () => {
        const coordinator = createPlaybackCoordinator();
        const a = setup('a', coordinator);
        a.controller.toggle();
        a.controller.dispose();
        expect(a.audio.pause).toHaveBeenCalledTimes(1);
        expect(coordinator.activeId()).toBeNull();
        const before = [...a.actions];
        a.audio.calls[0].resolve();
        await flush();
        expect(a.controller.onPlay()).toBe(false);
        expect(a.actions).toEqual(before);
    });

    it('rejeição da tentativa atual é despachada e libera o coordenador', async () => {
        const coordinator = createPlaybackCoordinator();
        const a = setup('a', coordinator);
        a.controller.toggle();
        a.audio.calls[0].reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
        await flush();
        expect(a.actions).toEqual(['PLAY_REQUEST', 'PLAY_REJECTED']);
        expect(coordinator.activeId()).toBeNull();
    });

    it('tocando → clique pausa (sem cancelamento) e o fim libera o coordenador', async () => {
        const coordinator = createPlaybackCoordinator();
        const a = setup('a', coordinator);
        a.controller.toggle();
        a.audio.calls[0].resolve();
        await flush();
        expect(a.controller.onPlay()).toBe(true);
        a.controller.toggle();
        expect(a.audio.pause).toHaveBeenCalledTimes(1);
        expect(a.actions).not.toContain('PLAY_CANCELLED');
        a.controller.onPause();
        a.controller.toggle();
        a.controller.onEnded();
        expect(coordinator.activeId()).toBeNull();
    });
});
