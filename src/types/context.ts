import { Auth } from '@/lib/auth';
import { PommentData } from '@/core/main';
import { PommentConfig } from './config';

export { PommentComputedContext } from '@/server/main';

export interface PommentContext {
    $config: PommentConfig;
    /**
     * v3 使用的旧 API
     * @deprecated
     */
    userConfig: PommentConfig;
    /**
     * v3 使用的旧 API
     * @deprecated
     */
    pomment: PommentData;
    /**
     * v3 使用的旧 API
     * @deprecated
     */
    logLevel: string;
    /**
     * v3 使用的旧 API
     * @deprecated
     */
    userAuth: Auth;
    /**
     * v3 使用的旧 API
     * @deprecated
     */
    userPath: string;
}
