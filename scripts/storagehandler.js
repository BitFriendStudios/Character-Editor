class StorageHandler
{
    static #decoder = new TextDecoder();
    static #encoder = new TextEncoder();

    static getLocal(key, decode = false)
    {
        var item = localStorage.getItem(key);
        if (!item || !decode)
            return item;
        return this.#decoder.decode(Uint8Array.from(atob(item), x => x.charCodeAt(0)));
    }

    static setLocal(key, value, encode = false)
    {
        if (!key || !value)
            return false;
        if (encode)
            value = btoa(this.#encoder.encode(value).reduce((a, b) => a + String.fromCharCode(b), ''));
        localStorage.setItem(key, value);
        return true;
    }

    static removeLocal(key) 
    {
        localStorage.removeItem(key);
    }

    static async getIndexed(key, decode = false)
    {
        return new Promise(async (resolve, reject) => 
        {
            let db = await this.#openDBInstance().catch((err) => reject(err));
            if (!db)
                return;
            var store = db.transaction('data', "readwrite").objectStore('data');
            var dataRequest = store.get(key);
            dataRequest.addEventListener('error', () => reject(dataRequest.error));
            dataRequest.addEventListener('success', () => 
            {
                let result = dataRequest.result;
                if (!decode || !result)
                {
                    resolve(result);
                    return;
                }
                result = this.#decoder.decode(Uint8Array.from(atob(result), x => x.charCodeAt(0)));
                resolve(result);
            });
        });
    }

    static async setIndexed(key, value, encode = false)
    {
        return new Promise(async (resolve, reject) => 
        {
            let db = await this.#openDBInstance().catch((err) => reject(err));
            if (!db)
                return;
            var store = db.transaction('data', "readwrite").objectStore('data');
            if (encode)
                value = btoa(this.#encoder.encode(value).reduce((a, b) => a + String.fromCharCode(b), ''));
            var dataRequest = store.put(value, key);
            dataRequest.addEventListener('error', () => reject(dataRequest.error));
            dataRequest.addEventListener('success', resolve);
        });
    }

    static async purgeIndexed(key)
    {
        return new Promise(async (resolve, reject) => 
        {
            let db = await this.#openDBInstance().catch((err) => reject(err));
            if (!db)
                return;
            var store = db.transaction('data', "readwrite").objectStore('data');
            var dataRequest = store.delete(key);
            dataRequest.addEventListener('error', () => reject(dataRequest.error));
            dataRequest.addEventListener('success', resolve);
        });
    }

    static async purgeDatabase()
    {
        return new Promise(async (resolve, reject) => 
        {
            let db = await this.#openDBInstance().catch((err) => reject(err));
            if (!db)
                return;
            var store = db.transaction('data', "readwrite").objectStore('data');
            var dataRequest = store.clear();
            dataRequest.addEventListener('error', () => reject(dataRequest.error));
            dataRequest.addEventListener('success', resolve);
        });
    }

    static async hasDatabaseItems()
    {
        return new Promise(async (resolve, reject) => 
        {
            let db = await this.#openDBInstance().catch((err) => reject(err));
            if (!db)
                return;
            var store = db.transaction('data', 'readonly').objectStore('data');
            var dataRequest = store.count();
            dataRequest.addEventListener('error', () => reject(dataRequest.error));
            dataRequest.addEventListener('success', () => resolve(dataRequest.result > 0));
        });
    }

    static async #openDBInstance()
    {
        return new Promise((resolve, reject) =>
        {
            let db;
            var request = window.indexedDB.open("BitFriendsDB", 1);
            request.addEventListener('upgradeneeded', (evt) => 
            {
                db = evt.target.result;

                db.createObjectStore("data");
                resolve(db);
                return;
            });
            request.addEventListener('error', () => { reject(request.error); });
            request.addEventListener('success', () => { resolve(request.result); });
        });
    }
}