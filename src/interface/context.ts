import ParameterizedContext from "koa";
import { IConfig } from "./config";

export interface IPommentContext extends ParameterizedContext {
    pmntConfig: IConfig;
}
