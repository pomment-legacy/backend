export type ControllerMethod = 'get' | 'put' | 'post' | 'patch' | 'delete' | 'all'

export interface ControllerConfig {
    method: ControllerMethod
    path: string
    handler: Function
}
