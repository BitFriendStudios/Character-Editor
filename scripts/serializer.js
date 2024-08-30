class Serializer
{
    static TYPE_SILLYTAVERN = "SillyTavern AI";
    static TYPE_CAI = "Character AI";
    static TYPE_CHUB = "Chub AI";
    static TYPE_JANITOR = "Janitor AI";
    static TYPE_ZOLTANAI = "ZoltanAI";
    static TYPE_NOVELAI = "NovelAI";

    static async read(file)
    {
        let image, data;

        try
        {
            if (file.type === 'application/json' || file.name.endsWith('.lorebook') || file.name.endsWith('.story'))
                data = JSON.parse(await file.text());
            else if (file.type === 'image/png')
            {
                var buffer = await file.arrayBuffer();
                data = JSON.parse(PNGSerializer.read(file.name, buffer));
                image = await this.readBlobData(file).catch(reason => console.error(reason));
            }

            var type = this.#interpretType(data);
            console.log(`Card source: ${type}`);
            var version = this.#interpretVersion(data);
            console.log(`Card version: ${version}`);

            var storageData = {
                'type': type,
                'version': version,
                'image': image,
                'data': JSON.stringify(data)
            };

            await StorageHandler.setIndexed('editing', JSON.stringify(storageData), true);
            await StorageHandler.purgeIndexed('original');

            window.location = "editor.html"
        }
        catch (e)
        {
            console.error(e);
            toggleLoader();
        }
    }

    static async write(filename, data, exportType)
    {
        let realData, downloadData, blob;

        realData = data["data"];
        if (typeof realData !== 'string')
            realData = JSON.stringify(realData);

        if (exportType == "png" && data["image"])
        {
            var image = await fetch(data["image"]).then((x) => x.blob()).catch((err) => console.error(err));
            var buffer = await image.arrayBuffer();
            downloadData = PNGSerializer.write(filename, buffer, realData);
            blob = new Blob([downloadData], { type: "image/png" });
        }
        else
        {
            downloadData = realData;
            blob = new Blob([downloadData], { type: "application/json" });
        }
        return window.URL.createObjectURL(blob);
    }

    static async readBlobData(blob)
    {
        return new Promise((resolve, reject) =>
        {
            const reader = new FileReader();
            reader.onerror = (evt) => reject(reader.error)
            reader.onloadend = (evt) => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    static #interpretType(data)
    {
        if (data["entries"])
        {
            if (data["lorebookversion"])
                return `${this.TYPE_NOVELAI} LoreBook`;
            if (data["extensions"] && data["extensions"]["chub"])
                return `${this.TYPE_CHUB} LoreBook`;
            return `${this.TYPE_SILLYTAVERN} LoreBook`;
        }
        if (data["storyContainerVersion"])
            return this.TYPE_NOVELAI;
        if (data["metadata"] && data["metadata"]["tool"])
        {
            if (data["metadata"]["tool"]["name"].includes("CAI"))
                return this.TYPE_CAI;
            if (data["metadata"]["tool"]["url"].includes("zoltanai.github.io"))
                return this.TYPE_ZOLTANAI;
            if (data["metadata"]["tool"]["name"].includes("Janitor"))
                return this.TYPE_JANITOR;
        }

        if (data["chat"] && data["create_date"])
            return this.TYPE_SILLYTAVERN;
        return this.TYPE_CHUB;
    }

    static #interpretVersion(data)
    {
        if (data["storyContainerVersion"])
            return `${data["storyContainerVersion"]}.0`;
        if (data["spec_version"])
            return data["spec_version"];
        return '1.0';
    }
}

class PNGSerializer
{
    static #PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    static #PNG_CHUNK_LENGTH_SIZE = 4;
    static #PNG_CHUNK_TYPE_SIZE = 4;
    static #PNG_CHUNK_CRC_SIZE = 4;

    static read(fileName, buffer)
    {
        let chunks = this.#readChunks(fileName, new Uint8Array(buffer));
        
        var tEXtChunk = chunks.filter(x => x.type == 'tEXt').map(x => this.#readText(fileName, x.data));
        if (!tEXtChunk || tEXtChunk.length <= 0)
            throw new Error(`Invalid data, no \'tEXt\' chunk found in png`);

        var charData = tEXtChunk.find(x => x.key === 'chara');
        if (!charData)
            throw new Error(`Invalid data, no \'tEXt\' chunk with \'chara\' field found in png`);

        var text = new TextDecoder().decode(Uint8Array.from(atob(charData.text), x => x.charCodeAt(0)));
        console.log(text);

        return new TextDecoder().decode(Uint8Array.from(atob(charData.text), x => x.charCodeAt(0)));
    }

    static write(filename, buffer, text)
    {
        let chunks = this.#readChunks(filename, new Uint8Array(buffer)).filter(x => x.type !== 'tEXt');

        chunks.splice(-1, 0, 
        { 
            'type': 'tEXt', 
            'data': this.#writeText('chara', btoa(new TextEncoder().encode(text).reduce((a, b) => a + String.fromCharCode(b), ''))) 
        });

        return this.#writeChunks(chunks);
    }

    static #readChunks(fileName, buffer)
    {
        var index = 0, chunks = [];
        for (; index < this.#PNG_SIGNATURE.length; index++)
            if (buffer[index] !== this.#PNG_SIGNATURE[index])
                throw new Error(`Invalid PNG signature found in ${fileName}`);
        while (index < buffer.length)
        {
            var chunk = this.#readNextChunk(fileName, buffer, index);
            if (index - 8 === 0 && chunk.type !== 'IHDR')
                throw new Error(`Invalid IHDR header found in ${fileName}`);
            chunks.push(chunk);
            index += this.#PNG_CHUNK_LENGTH_SIZE + this.#PNG_CHUNK_TYPE_SIZE + this.#PNG_CHUNK_CRC_SIZE + chunk.data.length;
        }

        if (chunks[chunks.length - 1].type !== 'IEND')
            throw new Error(`Invalid data, \'IEND\' header not found in ${fileName}`);
        return chunks;
    }

    static #readNextChunk(fileName, buffer, offset)
    {
        var baseArr = new Uint8Array(4),
            length = 0, 
            type = "", 
            data, 
            crc = 0;

        for (var i = this.#PNG_CHUNK_LENGTH_SIZE - 1; i >= 0; i--)
            baseArr[i] = buffer[offset++];
        length = new Uint32Array(baseArr.buffer)[0];

        for (var i = 0; i < this.#PNG_CHUNK_TYPE_SIZE; i++)
            type += String.fromCharCode(buffer[offset + i]);
        offset += this.#PNG_CHUNK_TYPE_SIZE;

        data = buffer.slice(offset, offset + length);
        offset += data.length;

        for (var i = this.#PNG_CHUNK_CRC_SIZE - 1; i >= 0; i--)
            baseArr[i] = buffer[offset++];
        crc = new Int32Array(baseArr.buffer)[0];

        var libCRC = CRC32.buf(data, CRC32.str(type));
        if (crc !== libCRC)
            throw new Error(`Invalid CRC32 at index ${offset} in file ${fileName} (orig: ${crc}, lib: ${libCRC})`);
        return { 'length': length, 'type': type, 'data': data, 'crc': crc };
    }

    static #writeChunks(chunks)
    {
        let data = new Uint8Array(chunks.reduce((a, b) => a + this.#PNG_CHUNK_LENGTH_SIZE + this.#PNG_CHUNK_TYPE_SIZE + this.#PNG_CHUNK_CRC_SIZE + b.data.length, 8));

        var index = 0;
        for (; index < this.#PNG_SIGNATURE.length; index++)
            data[index] = this.#PNG_SIGNATURE[index];

        for (var i = 0; i < chunks.length; i++)
        {
            var chunk = chunks[i],
                baseArr = new Uint8Array(4),
                lengthArr = new Uint32Array(baseArr.buffer),
                crcArr = new Int32Array(baseArr.buffer);
            
            lengthArr[0] = chunk.data.length;
            for (var j = this.#PNG_CHUNK_LENGTH_SIZE - 1; j >= 0; j--)
                data[index++] = baseArr[j];

            for (var j = 0; j < this.#PNG_CHUNK_TYPE_SIZE; j++)
                data[index++] = chunk.type.charCodeAt(j);

            for (var j = 0; j < chunk.data.length; j++)
                data[index++] = chunk.data[j];

            crcArr[0] = chunk.crc || CRC32.buf(chunk.data, CRC32.str(chunk.type));
            for (var j = this.#PNG_CHUNK_CRC_SIZE - 1; j >= 0; j--)
                data[index++] = baseArr[j];
        }

        return data;
    }

    static #readText(fileName, buffer)
    {
        var matchingKey = true,
            key = "",
            text = "";

        for (var i = 0; i < buffer.length; i++)
        {
            var code = buffer[i];

            if (matchingKey)
            {
                if (!code)
                {
                    matchingKey = false;
                    continue;
                }
                key += String.fromCharCode(code);
                continue;
            }

            if (!code)
                throw new Error(`Invalid data, found NULL character in tEXt data at index ${i} in ${fileName}`);
            text += String.fromCharCode(code);
        }

        return { 'key': key, 'text': text };
    }

    static #writeText(key, text)
    {
        var regex = /^[\x00-\xFF]$/;
        if (regex.test(key))
        {
            console.warn(`Found invalid characters in keyword ${key}, automatically replacing with \'?\'`);
            key = key.replace(regex, '?');
        }

        if (regex.test(text))
        {
            console.warn(`Found invalid characters in text ${text}, automatically replacing with \'?\'`);
            text = text.replace(regex, '?');
        }

        if (key.length > 79)
            throw new Error(`Keyword ${key} exceeds keyword character limit (max: 79, actual: ${key.length})`);

        var data = new Uint8Array(key.length + text.length + 1),
            index = 0;
        
        for (var i = 0; i < key.length; i++)
        {
            if (!key.charCodeAt(i))
                throw new Error('Invalid data, empty (0x00) character found in keyword');
            data[index++] = key.charCodeAt(i);
        }

        data[index++] = 0;

        for (var i = 0; i < text.length; i++)
        {
            if (!text.charCodeAt(i))
                throw new Error('Invalid data, empty (0x00) character found in text');
            data[index++] = text.charCodeAt(i);
        }

        return data;
    }
}