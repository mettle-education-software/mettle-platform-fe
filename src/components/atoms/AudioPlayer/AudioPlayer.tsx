import React from 'react';

interface AudioPlayerProps {
    audioUrl: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
    return (
        <audio controls>
            <source src={audioUrl} type="audio/wave" />
            Your browser does not support the audio element.
        </audio>
    );
};
