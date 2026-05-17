export class RequestTimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = 'RequestTimeoutError';
  }
}

export async function withRequestTimeout<T>(ms: number, operation: () => Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new RequestTimeoutError(ms));
    }, ms);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
