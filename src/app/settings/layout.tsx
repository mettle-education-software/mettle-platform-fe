import Script from 'next/script';
import React from 'react';

interface SettingsLayoutProps {
    children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
    return (
        <>
            {children}
            <Script
                type="text/javascript"
                id="hs-script-loader"
                async
                defer
                src="//js-na1.hs-scripts.com/19504000.js"
            ></Script>
        </>
    );
};

export default SettingsLayout;
