import { Auth } from 'pomment-common/dist/auth';
import { PommentData } from '../core/main';
import { IConfig } from './config';

export interface IPommentContext {
    userConfig: IConfig;
    pomment: PommentData;
    logLevel: string;
    userAuth: Auth;
    userPath: string;
}
