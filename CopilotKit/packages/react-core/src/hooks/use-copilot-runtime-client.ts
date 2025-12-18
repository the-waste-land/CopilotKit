import {
  CopilotRuntimeClient,
  CopilotRuntimeClientOptions,
  GraphQLError,
} from "@copilotkit/runtime-client-gql";
import { useToast } from "../components/toast/toast-provider";
import { useMemo, useRef } from "react";
import {
  ErrorVisibility,
  CopilotKitApiDiscoveryError,
  CopilotKitRemoteEndpointDiscoveryError,
  CopilotKitAgentDiscoveryError,
  CopilotKitError,
  CopilotKitErrorCode,
  CopilotErrorHandler,
  CopilotErrorEvent,
} from "@copilotkit/shared";
import { shouldShowDevConsole } from "../utils/dev-console";

export interface CopilotRuntimeClientHookOptions extends CopilotRuntimeClientOptions {
  showDevConsole?: boolean;
  onError?: CopilotErrorHandler;
}

export const useCopilotRuntimeClient = (options: CopilotRuntimeClientHookOptions) => {
  const { setBannerError } = useToast();
  const { showDevConsole, onError, ...runtimeOptions } = options;

  // Deduplication state for structured errors
  const lastStructuredErrorRef = useRef<{ message: string; timestamp: number } | null>(null);

  // Helper function to trace UI errors
  const traceUIError = async (error: CopilotKitError, originalError?: any) => {
    // Just check if onError and publicApiKey are defined
    if (!onError || !runtimeOptions.publicApiKey) return;

    try {
      const errorEvent: CopilotErrorEvent = {
        type: "error",
        timestamp: Date.now(),
        context: {
          source: "ui",
          request: {
            operation: "runtimeClient",
            url: runtimeOptions.url,
            startTime: Date.now(),
          },
          technical: {
            environment: "browser",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            stackTrace: originalError instanceof Error ? originalError.stack : undefined,
          },
        },
        error,
      };
      await onError(errorEvent);
    } catch (error) {
      console.error("Error in onError handler:", error);
    }
  };

  const runtimeClient = useMemo(() => {
    return new CopilotRuntimeClient({
      ...runtimeOptions,
      handleGQLErrors: (error) => {
        if ((error as any).graphQLErrors?.length) {
          const graphQLErrors = (error as any).graphQLErrors as GraphQLError[];

          // Route all errors to banners for consistent UI
          const routeError = (gqlError: GraphQLError) => {
            const extensions = gqlError.extensions;
            const visibility = extensions?.visibility as ErrorVisibility;
            const isDev = shouldShowDevConsole(showDevConsole ?? false);

            // Silent errors - just log
            if (visibility === ErrorVisibility.SILENT) {
              console.error("CopilotKit Silent Error:", gqlError.message);
              return;
            }

            // DEV_ONLY errors - only show in development
            if (visibility === ErrorVisibility.DEV_ONLY && !isDev) {
              console.error("CopilotKit Error (hidden in production):", gqlError.message);
              return;
            }

            // All other errors (BANNER, TOAST) show regardless of environment
            // Deduplicate to prevent spam
            const now = Date.now();
            const errorMessage = gqlError.message;
            if (
              lastStructuredErrorRef.current &&
              lastStructuredErrorRef.current.message === errorMessage &&
              now - lastStructuredErrorRef.current.timestamp < 150
            ) {
              return; // Skip duplicate
            }
            lastStructuredErrorRef.current = { message: errorMessage, timestamp: now };

            const ckError = createStructuredError(gqlError);
            if (ckError) {
              setBannerError(ckError);
              // Trace the error
              traceUIError(ckError, gqlError);
            } else {
              // Fallback for unstructured errors
              const fallbackError = new CopilotKitError({
                message: gqlError.message,
                code: CopilotKitErrorCode.UNKNOWN,
              });
              setBannerError(fallbackError);
              // Trace the fallback error
              traceUIError(fallbackError, gqlError);
            }
          };

          // Process all errors as banners
          graphQLErrors.forEach(routeError);
        } else {
          const isDev = shouldShowDevConsole(showDevConsole ?? false);
          if (!isDev) {
            console.error("CopilotKit Error (hidden in production):", error);
          } else {
            // Route non-GraphQL errors to banner as well
            const fallbackError = new CopilotKitError({
              message: error?.message || String(error),
              code: CopilotKitErrorCode.UNKNOWN,
            });
            setBannerError(fallbackError);
            // Trace the non-GraphQL error
            traceUIError(fallbackError, error);
          }
        }
      },
      handleGQLWarning: (message: string) => {
        const isDev = shouldShowDevConsole(showDevConsole ?? false);

        // Check if this is a version mismatch warning
        const isVersionMismatch = message.includes("Version mismatch");

        if (isVersionMismatch) {
          // Version mismatch warnings should only show in dev mode
          if (isDev) {
            console.warn(message);
            const warningError = new CopilotKitError({
              message,
              code: CopilotKitErrorCode.VERSION_MISMATCH,
            });
            setBannerError(warningError);
          } else {
            // In production, just log to console
            console.warn("CopilotKit Version Mismatch (hidden in production):", message);
          }
        } else {
          // Other warnings show in all environments
          console.warn(message);
          const warningError = new CopilotKitError({
            message,
            code: CopilotKitErrorCode.UNKNOWN,
          });
          setBannerError(warningError);
        }
      },
    });
  }, [runtimeOptions, setBannerError, showDevConsole, onError]);

  return runtimeClient;
};

// Create appropriate structured error from GraphQL error
function createStructuredError(gqlError: GraphQLError): CopilotKitError | null {
  const extensions = gqlError.extensions;
  const originalError = extensions?.originalError as any;
  const message = originalError?.message || gqlError.message;
  const code = extensions?.code as CopilotKitErrorCode;

  if (code) {
    return new CopilotKitError({ message, code });
  }

  // Legacy error detection by stack trace
  if (originalError?.stack?.includes("CopilotApiDiscoveryError")) {
    return new CopilotKitApiDiscoveryError({ message });
  }
  if (originalError?.stack?.includes("CopilotKitRemoteEndpointDiscoveryError")) {
    return new CopilotKitRemoteEndpointDiscoveryError({ message });
  }
  if (originalError?.stack?.includes("CopilotKitAgentDiscoveryError")) {
    return new CopilotKitAgentDiscoveryError({
      agentName: "",
      availableAgents: [],
    });
  }

  return null;
}
