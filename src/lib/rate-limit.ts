type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

interface TokenData {
  count: number;
  resetTime: number;
}

const tokenCache = new Map<string, TokenData>();

export function rateLimit(options: Options) {
  const interval = options.interval || 60000; // 1 minute default
  
  return {
    check: (limit: number, token: string) =>
      new Promise<{ success: boolean; limit: number; remaining: number }>((resolve) => {
        const now = Date.now();
        const tokenData = tokenCache.get(token);
        
        // Clean up expired entries
        if (tokenData && now > tokenData.resetTime) {
          tokenCache.delete(token);
        }
        
        const currentData = tokenCache.get(token) || { count: 0, resetTime: now + interval };
        currentData.count += 1;
        tokenCache.set(token, currentData);
        
        const isRateLimited = currentData.count > limit;
        
        resolve({
          success: !isRateLimited,
          limit,
          remaining: Math.max(0, limit - currentData.count),
        });
      }),
  };
}