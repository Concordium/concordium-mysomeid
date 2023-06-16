import {logger} from '@mysomeid/chrome-ext-shared';

let messageHandler: {
    sendMessage: (type: string, to: 'content' | 'injected' | 'injected-widget', payload: any) => void;
};

export function getMessageHandler() {
    return messageHandler;
}

export function createWidgetMessageHandler(fn: (e: any) => void) {
    
    if ( messageHandler ) {
        return messageHandler;
    }

    const onMessage = (msg: any) => {
        const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
        logger.log('Injected Widget: onMessage', data);
                
        if ( !data || data.origin !== 'mysome' ) {
            logger.log('Injected Widget: onMessage - ignored its not a mysomeid message');
            return;
        }

        // Forward message.
        fn(data);
    };

    window.addEventListener("message", onMessage, false);

    const sendMessage = (type: string, to: 'content' | 'injected' | 'injected-widget', payload: any) => {
        const msg = {
            serial: Math.round(Math.random()*999999999),
            type,
            to,
            from: 'injected-widget',
            route: [],
            payload,
            origin: 'mysome',
        };
        logger.log("Widget: Sending message", msg);

        if ( to === 'injected-widget' ) { // For testing purposes.
            setTimeout(() => {
                onMessage({data: msg});
            });
            return;
        }

        window.parent.postMessage(msg, "*");
    };

    messageHandler = {
        sendMessage
    };

    return messageHandler;
}
