// 错误声明
export type PommentErrorMessage = string;

const createErrorMessageMap = <Key extends number>(map: Record<Key, PommentErrorMessage>) => map;

const error = createErrorMessageMap({
    400: '提交内容校验失败',
    401: '鉴权失败',
    404: '找不到资源',
    500: '内部服务器错误',
});

export type PommentErrorCode = keyof typeof error;

export default error;

// 错误类
export class PommentWebError extends Error {
    code: PommentErrorCode;

    constructor(code: PommentErrorCode) {
        super(error[code]);
        this.code = code;
    }
}
