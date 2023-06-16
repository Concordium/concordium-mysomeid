import {logger} from '@mysomeid/chrome-ext-shared';

type Message = {
    type: string;
    data?: any;
    from?: string;
    to?: string;
}

export const createMessage = (to: string, type: string, payload: any, extra?: any) => {
    const serial = Math.round(Math.random() * 999999999999999999);

    const data = {
        to,
        from: 'content',
        type,
        payload,
        serial,
        ...(extra ?? {}),
        origin: 'mysome',
    };

    return data;
};

let messageHandler: {
    sendMessage: (m: Message) => void;
};

export function createWidgetMessageHandler(fn: (e: any) => void) {
    if ( messageHandler ) {
        return messageHandler;
    }

    const onMessage = (evt: any) => {
        logger.log('Widget: onMessage', evt?.data);
        if ( evt.origin.indexOf('mysomeid') === -1 ) {
            logger.log('Widget: onMessage - ignored its not a mysomeid message');
            return;
        }
        // Forward message.
        fn(evt.data);
    };

    window.addEventListener("message", onMessage);

    const sendMessage = (message: any) => {
        logger.log("Widget: Sending message", message);
        window.parent.postMessage(message, 'mysomeid-widget');
    };

    messageHandler = {
        sendMessage
    };

    return messageHandler;
}
