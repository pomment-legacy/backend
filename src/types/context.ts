import { Auth } from '@/lib/auth';
import { PommentData } from '@/core/main';
import { PommentConfig } from './config';

export interface PommentContext {
    userConfig: PommentConfig;
    pomment: PommentData;
    logLevel: string;
    userAuth: Auth;
    userPath: string;
}
