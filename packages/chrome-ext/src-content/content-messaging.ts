import { mysome } from "./root";

declare var chrome: any;

export const isMySOMEIDMessage = (msg: any) => msg?.origin === 'mysome' && !!msg?.type;
// export const isMySOMEIDEvent = (msg: any) => msg?.origin === 'mysome' && msg?.isEvent === true;

/*export type MySoMeIdExtensionResponse = {
    msg: any;
    response: any;
};*/

/* export type MessageHandler = {
    sendMessage: (msg: any) => void;
}; */

// let injectedMessageHandler: MessageHandler | null;

/*export const getInjectedMessageHandler = (): MessageHandler => {
    if ( !injectedMessageHandler ) {
        throw new Error('MYSOMEID-Content: No message handler created');
    }
    return injectedMessageHandler;
};*/

/*export const createInjectedMessageHandler = (): MessageHandler => {
    if ( injectedMessageHandler ) {
        throw new Error('MYSOMEID-Content: Message handler already created');
    }

    const sendMessage = (msg: any) => {
        window.postMessage(msg, 'mysomeid-injected');
    };

    window.addEventListener('message', ({ data: msg, origin }) => {
        if ( origin?.indexOf("mysomeid") === 0 ) {
            console.log("MYSOMEID-Content: got some kind of message", {msg, origin});
        }
    });

    injectedMessageHandler = {
        sendMessage
    };

    return injectedMessageHandler;
};*/

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

        console.log("onMessage", data);

        if ( data.type === "validate-proof-response" ) {
           // debugger;
        }

        const {
            type,
            to,
        } = data;

        if ( !type ) {
            console.error("Ignored message with no type ", data);
            return;
        }

        if ( type.indexOf('-response') > 0 ) {
            const resolver = resolvers[data.responseTo];
            // debugger;
            try {
                if ( resolver ) {
                    resolver(data.payload);
                } else {
                    console.warn('No response listener for', data);
                }
            } catch(e) {
                console.error(e);
            }
            return;
        }

        if ( to === 'injected' ) {
            console.log("Message to injected ingored by content message handler.");
            return;
        }

        console.log('MYSOMEID-Content: Content scripts: get message ', {...data} );

        if ( to === 'background' ) {
            console.log("MYSOMEID-Content: Content scripts: forwarding message to extension.", data);

            chrome.runtime
                .sendMessage(data)
                .then((response: any) => {
                    console.log("MYSOMEID-Content: Content scripts. got response (BRIDGING IT).", response);
                    // debugger;
                    window.postMessage(response, '*');
                })
                .catch((error: Error) => {
                    console.error(error);
					window.postMessage({
                        error: error?.message,
                    }, '*');
				});

            return;
        } 
        else if ( to === "content" && type === 'forward' ) {
            console.log("Forwarding message to " + data.payload?.to, {message: data.payload} );

            if (['popup', 'background'].indexOf(data.payload?.to) >= 0) {
                // send to background!
                chrome.runtime.sendMessage(data.payload)
                    .then((response: any) => {
                        console.log("MYSOMEID-Content: Content scripts. got response.", response);
                        if (response?.error !== undefined) {
                            console.log("MYSOMEID-Content: Response is an error: thrown as error");
                            // If an error is thrown in the background script, propagate it to inject.
                            throw new Error(response.error ?? undefined);
                        }
                        /*const msgResponse: MySoMeIdExtensionResponse = {
                            msg: {},
                            response,
                        };*/

                        console.log("TODO: send response back to origin. ", response);
                        //window.postMessage(  );

                        // window.postMessage(msgResponse);
                    })
                    .catch((e: Error) => {
                        console.error(e);
                    });
            } else {
                console.error("Unknown forwarding target : " + data.payload?.to);
            }
        }

        // The message is 
        if ( to === 'content' ) {
            // console.log("Content: The message is for me.");
            messageHandlers.forEach( x => {
                try {
                    x(data);
                } catch(e) {
                    console.error(e);
                }
            });

            return;
        }

        /*chrome.runtime
                .sendMessage(data)
                .then((response: any) => {
                    console.log("MYSOMEID-Content: Content scripts. got response.", response);
                    if (response.error !== undefined) {
                        console.log("MYSOMEID-Content: Response is an error: thrown as error");
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
					console.error(error);
					window.postMessage(new Error(error.message));
				});*/

        
    };
    
    window.addEventListener('message', onMessage);

    // Propagate events from content script extension -> inject
    chrome.runtime.onMessage.addListener((data: any) => {
        console.log("MYSOMEID-Content: Got message from extension ", {data});
        if (!isMySOMEIDMessage(data)) {
            console.log("MYSOMEID-Content: Not a MYSOMEID message");
            return;
        }
        console.log("MYSOMEID-Content: Forwarding message to content messageHandler");
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
                    console.error("No widget with id : " + id );
                    return;
                }
                const wnd = (mysome.widgets[id].iframe as HTMLIFrameElement).contentWindow;
                if ( !wnd ) {
                    console.error("No frame content window available");
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
                        console.log("background returned result: ", result);
                        resolve(result);
                    });
                });
            }
            
            if ( to === 'injected-widget' ) {
                const {
                    id
                } = data.payload;
                if (!mysome.widgets[id] ) {
                    console.error("No widget with id : " + id );
                    return;
                }
                const wnd = (mysome.widgets[id].iframe as HTMLIFrameElement).contentWindow;
                if ( !wnd ) {
                    console.error("No frame content window available");
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
