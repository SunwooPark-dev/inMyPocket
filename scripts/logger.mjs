function writeInfo(payload, ...optionalParams) {
  console.info(payload, ...optionalParams);
}

function writeWarn(payload, ...optionalParams) {
  console.warn(payload, ...optionalParams);
}

function writeError(payload, ...optionalParams) {
  console.error(payload, ...optionalParams);
}

export const logger = {
  info: writeInfo,
  warn: writeWarn,
  error: writeError
};
