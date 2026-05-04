type LogPayload = unknown;

function writeInfo(payload: LogPayload, ...optionalParams: unknown[]) {
  console.info(payload, ...optionalParams);
}

function writeWarn(payload: LogPayload, ...optionalParams: unknown[]) {
  console.warn(payload, ...optionalParams);
}

function writeError(payload: LogPayload, ...optionalParams: unknown[]) {
  console.error(payload, ...optionalParams);
}

export const logger = {
  info: writeInfo,
  warn: writeWarn,
  error: writeError
};
