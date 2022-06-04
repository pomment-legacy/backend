/**
 * 从对象中剔除指定的键
 * @param data
 * @param key
 */
export function filterKey(data: any, key: string[]): any {
    const newData = { ...data };
    key.forEach((e) => {
        delete newData[e];
    });
    return newData;
}

/**
 * 从对象中移除除指定的键以外的所有键
 * @param data
 * @param key
 */
export function reserveKey(data: any, key: string[]): any {
    const newData: any = {};
    key.forEach((e) => {
        newData[e] = data[e];
    });
    return newData;
}

export interface PagedList<T> {
    rows: T[],
    pageSize?: number
    pageNum?: number
    total: number
}

/**
 * 分页
 * @param data
 * @param pageSize
 * @param pageNum
 */
export function paging<T>(data: T[], pageSize?: number, pageNum?: number): PagedList<T> {
    if (!pageSize || !pageNum || pageSize <= 0 || pageNum <= 0) {
        return {
            rows: data,
            total: data.length,
        };
    }
    return {
        rows: data.slice(pageSize * (pageNum - 1), pageSize * pageNum),
        pageSize,
        pageNum,
        total: data.length,
    };
}
