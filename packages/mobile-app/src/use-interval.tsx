import { useEffect, useRef, useState } from "react";

export const useInterval = (cb: () => void, delay: number) => {
  const [callback, setCallback] = useState<() => void>(cb);

  useEffect(() => {
    setCallback(cb);
  }, [cb]);

  // Set up the interval.
  useEffect(() => {
    let id = setInterval(() => {
      callback && callback();
    }, delay);
    return () => clearInterval(id);
  }, [delay]);
};

export const useTimeout = (cb: () => void, delay: number) => {
  const [callback, setCallback] = useState<() => void>(cb);

  useEffect(() => {
    setCallback(cb);
  }, [cb]);

  // Set up the interval.
  useEffect(() => {
    let id = setTimeout(() => {
      callback && callback();
    }, delay);
    return () => clearTimeout(id);
  }, [delay]);
};
