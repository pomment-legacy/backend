export type PommentErrorMessage = string;

const createErrorMessageMap = <Key extends number>(map: Record<Key, PommentErrorMessage>) => map;

const messages = createErrorMessageMap({
    401: '鉴权失败',
    500: '内部服务器错误',
    2000: '提交内容校验失败',
});

export type PommentErrorCode = keyof typeof messages;

export default messages;
