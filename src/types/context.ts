import { Auth } from '@/lib/auth';
import { PommentData } from '@/core/main';
import PommentDataContext from '@/server/model/pomment';
import { PommentConfig } from './config';

export { PommentComputedContext } from '@/server/main';

export interface PommentContext {
    $config: PommentConfig;
    $pomment: PommentDataContext;
}
