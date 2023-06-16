import {logger} from '@mysomeid/chrome-ext-shared';

logger.log("Installing MySoMeId Injected.");

type MessageTypes = 'show-popup' | 'create-tour' | 'reload-tabs' | 'create-badge' | 'get-state' | 'set-state' | 'update-registration' | 'create-popup' | 'widget-create' | 'get-url';
type ToTypes = 'content' | 'popup' | 'background' | 'injected-widget';
const widgets: Record<string, any> = {};
const messageContexts: Record<number, any> = {};

class InjectedMessageHandler {
  constructor() {
    logger.log("InjectedWidget: subscribe to messages");
    window.addEventListener('message', this.onMessage);
  }

  sendMessage(to: ToTypes, type: MessageTypes, payload: any): any {
    // When sending a message to the injected-widget we need to use the iframe ANDt he payload needs to contain the id of the iframe.

    let target: any = window;
    let origin: '*' | undefined = '*';
    let enc = (v: any) => v;
  
    if ( to === 'injected-widget' ) {
      let {id} = payload;
      if ( id === undefined && Object.keys(widgets).length > 0 ) {
        id = Object.keys(widgets)[0];
      }

      let iframe: HTMLIFrameElement | undefined;
      if  (id !== undefined && Number.isFinite(id) && id >= 0 && widgets[id] ) {
        iframe = document.getElementById(`mysome-frame-iframe-${id}`) as HTMLIFrameElement;
      }

      if ( !iframe ) {
        throw new Error('No iframe with id #' + id );
      }

      if ( !iframe?.contentWindow ) {
        logger.error('No iframe content window for iframe #' + id );
      }

      target = iframe?.contentWindow;
      origin = "*";
      enc = v => JSON.stringify(v);
    }
    const serial = Math.round(Math.random() * 999999999999999);
    const data = enc({
      to,
      type,
      from: 'injected',
      serial, // TODO: use proper UUIDv4 here.
      origin: 'mysome',
      payload,
    });

    const resolvers: ((msg: any) => void)[] = [];
    messageContexts[serial] = {
      addResolver: (r: (msg: any) => void) => resolvers.push(r),
      resolve: (data: any) => {
        resolvers.forEach(r => r(data));
      },
      serial,
    };
    target?.postMessage(data, origin);
    return messageContexts[serial];
  }

  sendMessageWResponse = async (to: ToTypes, type: MessageTypes, payload: any) => {
    return new Promise<any>((resolve, reject) => {
      this.sendMessage(to, type, payload).addResolver(resolve);
    });
  };

  onMessage = (message: any) => {
    if ( message?.data?.origin !== 'mysome' ) {
      return;
    }

    const {
      data,
    } = message;

    const {
      type,
      from,
      to,
      payload
    } = data;

    logger.log("Injected: message ", data);

    if ( from === 'injected' ) { // Dont process message from self!
      return;
    }

    if ( to === 'background' ) {
      logger.log("Injected: forwarding message (routing through content) ", data);

      // Route to content in order for content to send to background.
      window.postMessage({
        to: 'content',
        type: 'forward',
        from: 'injected',
        serial: Math.round(Math.random() * 999999999999),
        origin: 'mysome',
        payload: data,
      }, "*");

      return;
    }

    if ( to !== 'injected' ) {
      logger.log("Injected: ignored message ", data);
      return;
    }
    
    if ( type?.indexOf('-response') > 0 ) {
      const handler = messageContexts[data.responseTo];
      if ( !handler ) {
        return;
      } 
      handler.resolve(data);
      delete messageContexts[data.responseTo]; // free some memory.
      return;
    }

    if (type === 'console.log') {
      logger.log(payload.text, ...(payload?.more ?? {}));
      return;
    }
    else if (type === 'console.error') {
      logger.error(payload.text, ...(payload?.more ?? {}));
      return;
    } else if ( type === 'redirect' ) {
      const {
        url
      } = payload;
      window.location.href = url;
    }
  };
}

const messageHandler = new InjectedMessageHandler();

const createPopup = () => {
  messageHandler.sendMessage("content", "create-popup", {});
};

const createBadge = () => {
  messageHandler.sendMessage("content", "create-badge", {}); 
}

const createTour = () => {
  messageHandler.sendMessage("content", "create-tour", {}); 
};

const reloadTabs = async (args?: any) : Promise<any> => {
  return await messageHandler.sendMessageWResponse("background", "reload-tabs", {...(args ?? {})}); 
};

const updateRegistration = async (state: any) => {
  if (!state || typeof state !== 'object' ) {
    throw new Error('Invalid state for registration');
  }
  return await messageHandler.sendMessageWResponse("background", "update-registration", {
    store: 'state',
    state,
  });
};

const getState = async (store: string): Promise<any | null> => {
  const response = await messageHandler.sendMessageWResponse("background", "get-state", {store});
  return response?.store ?? null;
};

const getStateValue = async (store: string, key: string): Promise<any | null> => {
  const response = await messageHandler.sendMessageWResponse("background", "get-state", {store});
  return response?.store?.[key] ?? null;
};

const setStateValue = async (store: string, key: string, value: any): Promise<any | null> => {
  await messageHandler.sendMessageWResponse("background", "set-state", {store, key, value});
};

const getPlatformRequests = async () => {
  const response = await messageHandler.sendMessageWResponse("background", "get-state", {store: 'platform-requests'});
  const requests = response?.store?.array ?? [];
  logger.log("getPlatform requests (state) ", requests );
  return requests?.store?.array ?? [];
};

const createPlatformRequest = async (platform: string, requestType: string) => {
  const response = await messageHandler.sendMessageWResponse("background", "get-state", {store: 'platform-requests' });
  logger.log("createPlatformRequest requests (before adding) ", response?.store?.array );
  const value = [
    ...(response?.store?.array ?? []),
    {
      id: Math.round(Math.random() * 99999999).toString(),
      created: new Date().getTime(),
      platform,
      requestType,
      status: 'created',
    }
  ];
  await messageHandler.sendMessageWResponse("background", "set-state", {store: 'platform-requests', key: 'array', value});
};

const getRegistrations = async () => {
  logger.log("getRegistrations");
  const state = await messageHandler.sendMessageWResponse("background", "get-state", {store: 'state'});
  logger.log("getRegistrations return ", {state} );
  return state?.state?.['regs'] ?? null;
};

class MySoMeAPI {
  messageHandler = messageHandler;
  createPopup = createPopup;
  createBadge = createBadge;
  sendMessage = (to: ToTypes, type: MessageTypes, payload: any) => {
    messageHandler.sendMessage(to, type, payload);
  };
  sendMessageWResponse = async (to: ToTypes, type: MessageTypes, payload: any) => {
    return messageHandler.sendMessageWResponse(to, type, payload);
  };
  updateReg = updateRegistration;
  updateRegistration = updateRegistration;
  getRegistrations = getRegistrations;
  getPlatformRequests = getPlatformRequests;
  createPlatformRequest = createPlatformRequest;
  getStateValue = getStateValue;
  setStateValue = setStateValue;
  getState = getState;
  reloadTabs = reloadTabs;
}

let TEST: boolean | null = null;
let webAppBaseUrl = 'https://app.mysome.id';

getState('state').then(state => {
  TEST = !!(state?.['staging']);
  webAppBaseUrl = TEST ? 'https://app.testnet.mysome.id' : 'https://app.mysome.id';
});

export const getWebAppBaseUrl = () => webAppBaseUrl;

(window as any).mysome = new MySoMeAPI();
