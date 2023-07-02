import { logger } from '@mysomeid/chrome-ext-shared';

import { mysome } from "./root";

declare var chrome: any;

export const isMySOMEIDMessage = (msg: any) => msg?.origin === 'mysome' && !!msg?.type;

let messageHandler: ContentMessageHandler | undefined;

export type ContentMessageHandler = {
    sendMessage: (to: string, type: string, payload: {}, extra?: any) => void;
    sendMessageWResponse: (to: string, type: string, payload: any, extra?: any) => Promise<any>;
    addMessageHandler: (handler: (data: any) => void) => void; 
};

export const getMessageHandler = (): ContentMessageHandler => {
    return createContentMessageHandler();
}

export const createContentMessageHandler = (): ContentMessageHandler => {
    if ( messageHandler ) {
        return messageHandler;
    }

    const messageHandlers: ((data: any) => void)[] = [];

    const resolvers: Record<number, (data: any) => void> = {};

    // Create Bridge between content and popup/backend.
    const onMessage = ({ data }: {data: any}) => {
        if ( !isMySOMEIDMessage(data) ) {
            return;
        }

        logger.info("onMessage", data);

        if ( data.type === "validate-proof-response" ) {
           // debugger;
        }

        const {
            type,
            to,
        } = data;

        if ( !type ) {
            logger.error("Ignored message with no type ", data);
            return;
        }

        if ( type.indexOf('-response') > 0 ) {
            const resolver = resolvers[data.responseTo];
            // debugger;
            try {
                if ( resolver ) {
                    resolver(data.payload);
                } else {
                    logger.warn('No response listener for', data);
                }
            } catch(e) {
                logger.error(e);
            }
            return;
        }

        if ( to === 'injected' ) {
            logger.info("Message to injected ingored by content message handler.");
            return;
        }

        logger.info('MYSOMEID-Content: Content scripts: get message ', {...data} );

        if ( to === 'background' ) {
            logger.info("MYSOMEID-Content: Content scripts: forwarding message to extension.", data);

            chrome.runtime
                .sendMessage(data)
                .then((response: any) => {
                    logger.info("MYSOMEID-Content: Content scripts. got response (BRIDGING IT).", response);
                    // debugger;
                    window.postMessage(response, '*');
                })
                .catch((error: Error) => {
                    logger.error(error);
					window.postMessage({
                        error: error?.message,
                    }, '*');
				});

            return;
        } 
        else if ( to === "content" && type === 'forward' ) {
            logger.info("Forwarding message to " + data.payload?.to, {message: data.payload} );

            if (['popup', 'background'].indexOf(data.payload?.to) >= 0) {
                // send to background!
                chrome.runtime.sendMessage(data.payload)
                    .then((response: any) => {
                        logger.info("MYSOMEID-Content: Content scripts. got response.", response);
                        if (response?.error !== undefined) {
                            logger.info("MYSOMEID-Content: Response is an error: thrown as error");
                            // If an error is thrown in the background script, propagate it to inject.
                            throw new Error(response.error ?? undefined);
                        }
                        logger.info("TODO: send response back to origin. ", response);
                    })
                    .catch((e: Error) => {
                        logger.error(e);
                    });
            } else {
                logger.error("Unknown forwarding target : " + data.payload?.to);
            }
        }

        // The message is 
        if ( to === 'content' ) {
            // logger.log("Content: The message is for me.");
            messageHandlers.forEach( x => {
                try {
                    x(data);
                } catch(e) {
                    logger.error(e);
                }
            });

            return;
        }

        /*chrome.runtime
                .sendMessage(data)
                .then((response: any) => {
                    logger.log("MYSOMEID-Content: Content scripts. got response.", response);
                    if (response.error !== undefined) {
                        logger.log("MYSOMEID-Content: Response is an error: thrown as error");
                        // If an error is thrown in the background script, propagate it to inject.
                        throw new Error(response.error ?? undefined);
                    }
                    const msgResponse: MySoMeIdExtensionResponse = {
                        data,
                        response,
                    };
                    window.postMessage(msgResponse);
                })
                .catch((error: Error) => {
					logger.error(error);
					window.postMessage(new Error(error.message));
				});*/

        
    };
    
    window.addEventListener('message', onMessage);

    // Propagate events from content script extension -> inject
    chrome.runtime.onMessage.addListener((data: any) => {
        logger.info("MYSOMEID-Content: Got message from extension ", {data});
        if (!isMySOMEIDMessage(data)) {
            logger.info("MYSOMEID-Content: Not a MYSOMEID message");
            return;
        }
        logger.info("MYSOMEID-Content: Forwarding message to content messageHandler");
        window.postMessage(data, "*"); // Forward message.
    });

    const createMessage = (to: string, type: string, payload: any, extra?: any) => {
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

    messageHandler = {
        sendMessage: (to: string, type: string, payload: any, extra?: any) => {
            const data = createMessage(to, type, payload, extra);
 
            if ( to === 'background' ) {
                chrome.runtime.sendMessage(data, ({state}: any) => {
                });
                return;
            }
            
            if ( to === 'injected-widget' ) {
                const {
                    id
                } = data.payload;
                if (!mysome.widgets[id] ) {
                    logger.error("No widget with id : " + id );
                    return;
                }
                const wnd = (mysome.widgets[id].iframe as HTMLIFrameElement).contentWindow;
                if ( !wnd ) {
                    logger.error("No frame content window available");
                    return;
                }
                wnd.postMessage(JSON.stringify(data), '*');
                return;
            }

            window.postMessage(data, '*');
        },
        sendMessageWResponse: async (to: string, type: string, payload: any, extra?: any) => {
            const data = createMessage(to, type, payload, extra);
 
            if ( to === 'background' ) {
                return new Promise<any> (resolve  => {
                    chrome.runtime.sendMessage(data, (result: any) => {
                        logger.info("background returned result: ", result);
                        resolve(result);
                    });
                });
            }
            
            if ( to === 'injected-widget' ) {
                const {
                    id
                } = data.payload;
                if (!mysome.widgets[id] ) {
                    logger.error("No widget with id : " + id );
                    return;
                }
                const wnd = (mysome.widgets[id].iframe as HTMLIFrameElement).contentWindow;
                if ( !wnd ) {
                    logger.error("No frame content window available");
                    return;
                }
                wnd.postMessage(JSON.stringify(data), '*');
                return;
            }

            window.postMessage(data, '*');

            return new Promise<any>(resolve => {
                resolvers[data.serial] = resolve;
            });
        },
        addMessageHandler: (handler: (data: any) => void) => {
            messageHandlers.push(handler);
        },
    };
    return messageHandler;
};
