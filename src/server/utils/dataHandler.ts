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
