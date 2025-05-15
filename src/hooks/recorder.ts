'use client';

import React from 'react';

async function requestRecorder() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return new MediaRecorder(stream);
}

/**
 * React hook to use browser's recorder.
 *
 * @example
 * import { useRecorder } from 'react-hook-recorder';
 * const [audioURL, isRecording, startRecording, stopRecording] = useRecorder();
 *
 * @example
 * // use audioURL
 * <audio controls src={audioURL} />
 *
 * @example
 * // use startRecording
 * startRecording()
 *
 * @example
 * // use stopRecording
 * stopRecording()
 */

export const useRecorder: () => [
    audioURL: string,
    isRecording: boolean,
    startRecording: () => void,
    stopRecording: () => void,
] = () => {
    const [audioURL, setAudioURL] = React.useState('');
    const [isRecording, setIsRecording] = React.useState(false);
    const [recorder, setRecorder] = React.useState<MediaRecorder | null>(null);

    React.useEffect(() => {
        if (recorder === null) {
            if (isRecording) {
                requestRecorder().then((mediaRecorder) => {
                    setRecorder(mediaRecorder);
                }, console.error);
            }
            return;
        }

        if (isRecording) {
            recorder.start();
        } else {
            recorder.stop();
        }

        const handleData = (e: BlobEvent | Event) => {
            if (e instanceof BlobEvent) setAudioURL(URL.createObjectURL(e.data));
        };

        recorder.addEventListener('data available', handleData);
        return () => recorder.removeEventListener('data available', handleData);
    }, [recorder, isRecording]);

    const startRecording = () => {
        setIsRecording(true);
    };

    const stopRecording = () => {
        setIsRecording(false);
    };

    return [audioURL, isRecording, startRecording, stopRecording];
};
